/*
 * # Semantic - Sidebar
 * http://github.com/semantic-org/semantic-ui/
 *
 *
 * Copyright 2014 Contributor
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

;(function ( $, window, document, undefined ) {

$.fn.sidebar = function(parameters) {
  var
    $allModules    = $(this),
    $body          = $('body'),
    $head          = $('head'),

    moduleSelector = $allModules.selector || '',

    time           = new Date().getTime(),
    performance    = [],

    query          = arguments[0],
    methodInvoked  = (typeof query == 'string'),
    queryArguments = [].slice.call(arguments, 1),

    requestAnimationFrame = window.requestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function(callback) { setTimeout(callback, 0); },

    returnedValue
  ;

  $allModules
    .each(function() {
      var
        settings        = ( $.isPlainObject(parameters) )
          ? $.extend(true, {}, $.fn.sidebar.settings, parameters)
          : $.extend({}, $.fn.sidebar.settings),

        selector        = settings.selector,
        className       = settings.className,
        namespace       = settings.namespace,
        error           = settings.error,

        eventNamespace  = '.' + namespace,
        moduleNamespace = 'module-' + namespace,

        $module         = $(this),
        $body           = $('body'),
        $style          = $('style[title=' + namespace + ']'),

        $sidebars       = $(selector.sidebar),
        $page           = $(selector.page),
        $pusher         = $(selector.pusher),

        element         = this,
        instance        = $module.data(moduleNamespace),

        transitionEnd,

        module
      ;

      module      = {

        initialize: function() {
          module.debug('Initializing sidebar', $module);

          transitionEnd = module.get.transitionEvent();

          module.setup.page();

          // avoid locking rendering to change layout if included in onReady
          requestAnimationFrame(module.setup.layout);

          module.instantiate();
        },

        instantiate: function() {
          module.verbose('Storing instance of module', module);
          instance = module;
          $module
            .data(moduleNamespace, module)
          ;
        },

        destroy: function() {
          module.verbose('Destroying previous module for', $module);
          $module
            .off(eventNamespace)
            .removeData(moduleNamespace)
          ;
        },

        event: {
          clickaway: function(event) {
            if( $module.find(event.target).size() === 0 && $(event.target).filter($module).size() === 0 ) {
              module.verbose('User clicked on dimmed page');
              $.proxy(module.hide, element)();
            }
          }
        },

        bind: {
          clickaway: function() {
            $body
              .on('click' + eventNamespace, module.event.clickaway)
            ;
          }
        },
        unbind: {
          clickaway: function() {
            $body
              .off('click' + eventNamespace)
            ;
          }
        },

        refresh: function() {
          module.verbose('Refreshing selector cache');
          $style  = $('style[title=' + namespace + ']');
          $sidebars = $(selector.sidebar);
          $page     = $(selector.page);
          $pusher   = $(selector.pusher);
        },

        setup: {
          layout: function() {
            $pusher = $(selector.pusher);

            if($pusher.size() === 0) {
              module.debug('Adding wrapper element for sidebar');
              module.verbose('Setting up page structure for sidebar');
              $pusher = $('<div class="pusher" />');
              $page   = $('<div class="page" />');
              $pusher.append($page);
              $body
                .children()
                  .not(selector.omitted)
                  .not($sidebars)
                  .wrapAll($pusher)
              ;
            }
            module.refresh();
          },
          page: function() {
            $body.addClass(className.hasSidebar);
          }
        },

        attachEvents: function(selector, event) {
          var
            $toggle = $(selector)
          ;
          event = $.isFunction(module[event])
            ? module[event]
            : module.toggle
          ;
          if($toggle.size() > 0) {
            module.debug('Attaching sidebar events to element', selector, event);
            $toggle
              .off(eventNamespace)
              .on('click' + eventNamespace, event)
            ;
          }
          else {
            module.error(error.notFound);
          }
        },

        show: function(callback) {
          callback = $.isFunction(callback)
            ? callback
            : function(){}
          ;
          module.debug('Showing sidebar', callback);
          if(module.is.closed()) {
            if(settings.overlay)  {
              settings.animation = 'overlay';
            }
            if(settings.animation !== 'overlay') {
              module.hideAll();
            }
            module.pushPage(function() {
              $.proxy(callback, element)();
              $.proxy(settings.onShow, element)();
            });
            $.proxy(settings.onChange, element)();
            $.proxy(settings.onVisible, element)();
          }
          else {
            module.debug('Sidebar is already visible');
          }
        },

        hide: function(callback) {
          callback = $.isFunction(callback)
            ? callback
            : function(){}
          ;
          module.debug('Hiding sidebar', callback);
          if(module.is.visible()) {
            module.pullPage(function() {
              $.proxy(callback, element)();
              $.proxy(settings.onHidden, element)();
            });
            $.proxy(settings.onChange, element)();
            $.proxy(settings.onHide, element)();
          }
        },

        hideAll: function() {
          var
            $visibleSidebars = $sidebars.find('.' + className.visible)
          ;
          $visibleSidebars
            .sidebar('hide')
          ;
        },

        toggle: function() {
          if(module.is.closed()) {
            module.show();
          }
          else {
            module.hide();
          }
        },

        forceRepaint: function() {
          module.verbose('Forcing element repaint');
          var
            $parentElement = $module.parent(),
            $nextElement = $module.next()
          ;
          if($nextElement.size() === 0) {
            $module.detach().appendTo($parentElement);
          }
          else {
            $module.detach().insertBefore($nextElement);
          }
        },

        pushPage: function(callback) {
          callback = $.isFunction(callback)
            ? callback
            : function(){}
          ;
          if( !module.is.inward() ) {
            module.verbose('Adding body push state', module.get.direction());
            if(settings.animation != 'overlay') {
              module.remove.allVisible();
            }
            module.set.direction();
            module.set.animation();
            module.set.inward();
            requestAnimationFrame(function() {
              module.set.visible();
              requestAnimationFrame(function() {
                module.set.pushed();
              });
            });
            $pusher
              .off(transitionEnd)
              .on(transitionEnd, function(event) {
                if($(event.target).is(selector.pusher)) {
                  module.remove.inward();
                  module.set.active();
                  $pusher.off(transitionEnd);
                  module.bind.clickaway();
                  $.proxy(callback, element)();
                }
              })
            ;
          }
        },

        pullPage: function(callback) {
          callback = $.isFunction(callback)
            ? callback
            : function(){}
          ;
          if( !module.is.outward() ) {
            module.verbose('Removing body push state', module.get.direction());
            if(settings.animation == 'overlay') {
              $module. removeClass(className.visible);
            }
            module.unbind.clickaway();
            requestAnimationFrame(function() {
              module.set.outward();
              module.remove.active();
              module.remove.pushed();
              $pusher
                .off(transitionEnd)
                .on(transitionEnd, function(event) {
                  if($(event.target).is(selector.pusher)) {
                    module.remove.animation();
                    module.remove.direction();
                    module.remove.outward();
                    module.remove.visible();
                    $pusher.off(transitionEnd);
                    $.proxy(callback, element)();
                  }
                })
              ;
            });
          }
        },

        add: {
          bodyCSS: function(direction, distance) {
            var
              style
            ;
            if(direction !== className.bottom) {
              style = ''
                + '<style title="' + namespace + '">'
                + 'body.pushed {'
                + ''
                + '}'
                + '</style>'
              ;
            }
            $head.append(style);
            module.debug('Adding body css to head', $style);
          }
        },

        set: {
          active: function() {
            $module.addClass(className.active);
          },
          direction: function(direction) {
            direction = direction || module.get.direction();
            $body.addClass(className[direction]);
          },
          visible: function() {
            $module.addClass(className.visible);
          },
          animation: function(animation) {
            animation = animation || settings.animation;
            $body.addClass(animation);
          },
          inward: function() {
            $body.addClass(className.inward);
          },
          outward: function() {
            $body.addClass(className.outward);
          },
          pushed: function() {
            $body.addClass(className.pushed);
          }
        },
        remove: {
          bodyCSS: function() {
            module.debug('Removing body css styles', $style);
            module.refresh();
            $style.remove();
          },
          active: function() {
            $module.removeClass(className.active);
          },
          visible: function() {
            $module.removeClass(className.visible);
          },
          allVisible: function() {
            if($sidebars.hasClass(className.visible)) {
              $sidebars.removeClass(className.visible);
            }
          },
          animation: function(animation) {
            animation = animation || settings.animation;
            $body.removeClass(animation);
          },
          pushed: function() {
            $body.removeClass(className.pushed);
          },
          inward: function() {
            $body.removeClass(className.inward);
          },
          outward: function() {
            $body.removeClass(className.outward);
          },
          direction: function(direction) {
            direction = direction || module.get.direction();
            $body.removeClass(className[direction]);
          }
        },

        get: {
          direction: function() {
            if($module.hasClass(className.top)) {
              return className.top;
            }
            else if($module.hasClass(className.right)) {
              return className.right;
            }
            else if($module.hasClass(className.bottom)) {
              return className.bottom;
            }
            else {
              return className.left;
            }
          },
          transitionEvent: function() {
            var
              element     = document.createElement('element'),
              transitions = {
                'transition'       :'transitionend',
                'OTransition'      :'oTransitionEnd',
                'MozTransition'    :'transitionend',
                'WebkitTransition' :'webkitTransitionEnd'
              },
              transition
            ;
            for(transition in transitions){
              if( element.style[transition] !== undefined ){
                return transitions[transition];
              }
            }
          }
        },

        is: {
          open: function() {
            return $module.hasClass(className.active);
          },
          closed: function() {
            return !module.is.open();
          },
          visible: function() {
            return $module.hasClass(className.visible);
          },
          vertical: function() {
            return $module.hasClass(className.top);
          },
          inward: function() {
            return $body.hasClass(className.inward);
          },
          outward: function() {
            return $body.hasClass(className.outward);
          },
          animating: function() {
            return module.is.inward() || module.is.outward();
          }
        },

        setting: function(name, value) {
          module.debug('Changing setting', name, value);
          if( $.isPlainObject(name) ) {
            $.extend(true, settings, name);
          }
          else if(value !== undefined) {
            settings[name] = value;
          }
          else {
            return settings[name];
          }
        },
        internal: function(name, value) {
          if( $.isPlainObject(name) ) {
            $.extend(true, module, name);
          }
          else if(value !== undefined) {
            module[name] = value;
          }
          else {
            return module[name];
          }
        },
        debug: function() {
          if(settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.debug = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.debug.apply(console, arguments);
            }
          }
        },
        verbose: function() {
          if(settings.verbose && settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.verbose = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.verbose.apply(console, arguments);
            }
          }
        },
        error: function() {
          module.error = Function.prototype.bind.call(console.error, console, settings.name + ':');
          module.error.apply(console, arguments);
        },
        performance: {
          log: function(message) {
            var
              currentTime,
              executionTime,
              previousTime
            ;
            if(settings.performance) {
              currentTime   = new Date().getTime();
              previousTime  = time || currentTime;
              executionTime = currentTime - previousTime;
              time          = currentTime;
              performance.push({
                'Element'        : element,
                'Name'           : message[0],
                'Arguments'      : [].slice.call(message, 1) || '',
                'Execution Time' : executionTime
              });
            }
            clearTimeout(module.performance.timer);
            module.performance.timer = setTimeout(module.performance.display, 100);
          },
          display: function() {
            var
              title = settings.name + ':',
              totalTime = 0
            ;
            time = false;
            clearTimeout(module.performance.timer);
            $.each(performance, function(index, data) {
              totalTime += data['Execution Time'];
            });
            title += ' ' + totalTime + 'ms';
            if(moduleSelector) {
              title += ' \'' + moduleSelector + '\'';
            }
            if($allModules.size() > 1) {
              title += ' ' + '(' + $allModules.size() + ')';
            }
            if( (console.group !== undefined || console.table !== undefined) && performance.length > 0) {
              console.groupCollapsed(title);
              if(console.table) {
                console.table(performance);
              }
              else {
                $.each(performance, function(index, data) {
                  console.log(data['Name'] + ': ' + data['Execution Time']+'ms');
                });
              }
              console.groupEnd();
            }
            performance = [];
          }
        },
        invoke: function(query, passedArguments, context) {
          var
            object = instance,
            maxDepth,
            found,
            response
          ;
          passedArguments = passedArguments || queryArguments;
          context         = element         || context;
          if(typeof query == 'string' && object !== undefined) {
            query    = query.split(/[\. ]/);
            maxDepth = query.length - 1;
            $.each(query, function(depth, value) {
              var camelCaseValue = (depth != maxDepth)
                ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                : query
              ;
              if( $.isPlainObject( object[camelCaseValue] ) && (depth != maxDepth) ) {
                object = object[camelCaseValue];
              }
              else if( object[camelCaseValue] !== undefined ) {
                found = object[camelCaseValue];
                return false;
              }
              else if( $.isPlainObject( object[value] ) && (depth != maxDepth) ) {
                object = object[value];
              }
              else if( object[value] !== undefined ) {
                found = object[value];
                return false;
              }
              else {
                return false;
              }
            });
          }
          if ( $.isFunction( found ) ) {
            response = found.apply(context, passedArguments);
          }
          else if(found !== undefined) {
            response = found;
          }
          if($.isArray(returnedValue)) {
            returnedValue.push(response);
          }
          else if(returnedValue !== undefined) {
            returnedValue = [returnedValue, response];
          }
          else if(response !== undefined) {
            returnedValue = response;
          }
          return found;
        }
      };
      if(methodInvoked) {
        if(instance === undefined) {
          module.initialize();
        }
        module.invoke(query);
      }
      else {
        if(instance !== undefined) {
          module.destroy();
        }
        module.initialize();
      }
    })
  ;

  return (returnedValue !== undefined)
    ? returnedValue
    : this
  ;
};

$.fn.sidebar.settings = {

  name        : 'Sidebar',
  namespace   : 'sidebar',

  debug       : true,
  verbose     : true,
  performance : true,

  animation   : 'pushing',

  useCSS      : true,
  duration    : 300,

  dimPage     : true,

  exclusive   : true,

  onChange    : function(){},
  onShow      : function(){},
  onHide      : function(){},

  onHidden    : function(){},
  onVisible   : function(){},

  className : {
    hasSidebar : 'pushable',
    active     : 'active',
    visible    : 'visible',
    pushed     : 'pushed',
    inward     : 'show',
    outward    : 'hide'
  },

  selector: {
    sidebar : 'body > .ui.sidebar',
    pusher  : 'body > .pusher',
    page    : 'body > .pusher > .page',
    omitted : '.ui.modal, .ui.nag'
  },

  error   : {
    method   : 'The method you called is not defined.',
    notFound : 'There were no elements that matched the specified selector'
  }

};

})( jQuery, window , document );