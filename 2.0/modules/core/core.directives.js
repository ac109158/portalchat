'use strict';

/* Directives */


angular.module('portalchat.core').
directive('avatar', function() {
    return {
        restrict: "E",
        template: '<img class="media-object thumbnail" ng-src="/components/com_callcenter/images/avatars/{{avatar}}-90.jpg">'
    };
}).
directive('cmView', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './modules/core/partials/chat/chat_view.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmMainSettings', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './modules/core/partials/chat/main_settings.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmChatSettings', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './modules/core/partials/chat/chat_settings.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmChatTracker', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './modules/core/partials/chat/chat_tracker.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('chatModuleExternal', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './modules/core/partials/chat/chat_module_external.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('panelContactChat', function() {
    return {
        restrict: 'E',
        scope: {
            chat: '=',
            ux: '=',
            ui: '=',
            profiles: '=',
            engine: '='
        },
        replace: true,
        templateUrl: './modules/core/partials/chat/panel_contact_chat.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('recentChats', function() {
    return {
        restrict: 'E',
        scope: false,
        replace: true,
        templateUrl: './modules/core/partials/chat/recent.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('contacts', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/contacts.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('chatModuleNavPanel', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/nav_panel.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmAudio', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/html5/audio.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmVideo', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/html5/video.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmImage', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/html5/image.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmAudioRecord', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/html5/audio_record.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmYoutube', function($sce) {
    return {
        restrict: 'EA',
        scope: {
            code: '='
        },
        replace: true,
        template: '<div style="height:200px; width:98%; margin-left:1%; margin-bottom:5px;"><iframe style="overflow:hidden;height:100%;width:100%" width="100%" height="100%" src="{{url}}" frameborder="0" allowfullscreen></iframe></div>',
        link: function(scope) {
            scope.$watch('code', function(newVal) {
                if (newVal) {
                    scope.url = $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + newVal + '?rel=0&autoplay=0&loop=0&wmode=opaque&modestbranding=1&width=200&height=200"');
                }
            });
        }
    };
}).
directive('cmContactProfile', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/contact_profile.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmProfile', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/user_profile.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('bindHtmlUnsafe', function($compile) {
    return function($scope, $element, $attrs) {

        var compile = function(newHTML) { // Create re-useable compile function
            newHTML = $compile(newHTML)($scope); // Compile html
            $element.html('').append(newHTML); // Clear and append it
        };

        var htmlName = $attrs.bindHtmlUnsafe; // Get the name of the variable
        // Where the HTML is stored

        $scope.$watch(htmlName, function(newHTML) { // Watch for changes to
            // the HTML
            if (!newHTML) return;
            compile(newHTML); // Compile it
        });

    };
}).
directive('windowResize', function($rootScope, $window, $timeout) {
    return {
        //scope: true,   // optionally create a child scope
        link: function(scope, elem, attrs) {
            angular.element($window).on('resize', function() {
                // if (scope.module.interval && scope.module.interval.window_resize) {
                //     $timeout.cancel(scope.module.interval.window_resize);
                // }
                // scope.module.interval.window_resize = $timeout(function() {
                //     $rootScope.$broadcast('core-task-assignment', {
                //         id: 'evaluate-chat-module-layout',
                //         param: null
                //     });
                //     $timeout.cancel(scope.module.interval.window_resize);
                // }, 500);
                $rootScope.$broadcast('core-task-assignment', {
                    id: 'evaluate-chat-module-layout',
                    param: null
                });
            });
        }
    };
}).
directive('scrollToBottom', function($timeout, $parse) {
    return {
        //scope: true,   // optionally create a child scope
        link: function(scope, elem, attrs) {
            var model = $parse(attrs.scrollToBottom);
            scope.$watch(model, function(value) {
                if (value === true) {
                    $timeout(function() {
                        elem[0].scrollTop = elem[0].scrollHeight;

                    });
                }
            });
        }
    };
}).
directive('scrollToTop', function($timeout, $parse) {
    return {
        //scope: true,   // optionally create a child scope
        link: function(scope, elem, attrs) {
            var model = $parse(attrs.scrollToTop);
            scope.$watch(model, function(value) {
                if (value === true) {
                    $timeout(function() {
                        elem[0].scrollTop = 0;
                    });
                }
            });
        }
    };
}).
directive('stickToBottom', function($timeout, $parse) {
    return {
        //scope: true,   // optionally create a child scope
        priority: 1,
        require: ['?ngModel'],
        restrict: 'A',
        link: function(scope, $el, attrs, ctrls) {
            var model = $parse(attrs.stickToBottom);
            var el = $el[0];

            function fakeNgModel(initValue) {
                return {
                    $setViewValue: function(value) {
                        this.$viewValue = value;
                    },
                    $viewValue: initValue
                };
            }

            function scrollToBottom() {
                el.scrollTop = el.scrollHeight;
            }

            function shouldActivateAutoScroll() {
                // + 1 catches off by one errors in chrome
                return el.scrollTop + el.clientHeight + 1 >= el.scrollHeight;
            }
            scope.$watch(model, function(value) {
                var ngModel = ctrls[0] || fakeNgModel(true);
                if (value === true) {

                    scope.$watch(function() {
                        if (ngModel.$viewValue) {
                            scrollToBottom();
                        }
                    });

                    $el.bind('scroll', function() {
                        scope.$apply(ngModel.$setViewValue.bind(ngModel, shouldActivateAutoScroll()));
                    });
                }
            });
        }
    };
}).
directive('cmVerticalAdust', ['$timeout', 'UxManager', function($timeout, UxManager) {
    return {
        restrict: 'E',
        template: '<div id="cm-vertical-adjuster" class="cm-main-gradient" data-drag="true" data-jqyoui-options="{helper: vertialAdjustHelper, cursor: ' + "'ns-resize'" + ', cursorAt: {left: 5, top: 5}, containment: ' + "'#cm-main-panel-content-wrapper'" + ', axis: y,scroll:false}" jqyoui-draggable="verticalResizerDraggableOptions" style="position: absolute;  cursor:ns-resize; margin:0px; padding: 0px; pointer-events: all; width: 100%; height: 10px; z-index: 8;"></div>',
        scope: true,
        link: function(scope, element, attrs) {
            scope.verticalResizerDraggableOptions = {
                onDrag: 'vertialAdjustDrag(event, ui)',
                onStop: 'vertialAdjustStop()'
            };

            scope.vertialAdjustHelper = function(event, ui) {
                return '<div style="cursor: ns-resize; font-size:1em;" class="glyphicon glyphicon-resize-vertical"></div>';
            }
            scope.vertialAdjustStop = function() {
                $timeout(function() {
                    UxManager.setChatModuleSectionHeights();
                }, 250);

            }

            scope.vertialAdjustDrag = function(event, ui) {
                UxManager.setVerticalAdjust(ui.position.top);
            }
        }

    }
}]).
directive('scrollIf', ['$timeout', '$window', '$compile', function($timeout, $window, $compile) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            scope.$watch(attrs.scrollIf, function(value) {
                if (value) {
                    // Scroll to ad.
                    var message_display = document.getElementById(scope.referenced_display);
                    var message_display_height = message_display.clientHeight;
                    var total_height = message_display.scrollHeight
                    var pos = parseInt(current_position + 50);
                    document.getElementById(scope.referenced_display).scrollTop = pos;
                }
            });
            $timeout(function() {
                element.addClass('animated bounce');
            });
            $timeout(function() {
                element.removeClass('animated bounce');
            });
        }

    }
}]).
directive('scrollOnClick', ['$timeout', '$parse', 'UxManager', function($timeout, $parse, UxManager) {
    return {
        scope: true,
        //scope: true,   // optionally create a child scope
        link: function(scope, elem, attrs) {
            var model = $parse(attrs.scrollOnClick);
            scope.$watch(model, function(value) {
                if (value === true) {
                    console.log('scrollOnClick');
                    $timeout(function() {
                        var message_display = document.getElementById('list:' + UxManager.reference.session_key);
                        // console.log('message_display', message_display);
                        var message_display_current = message_display.scrollTop;
                        var message_display_height = message_display.clientHeight;
                        /*                  console.log(scope.referenced_message_id); */
                        var message_elem = document.getElementById(UxManager.reference.session_key + ':' + UxManager.reference.priority);
                        // console.log('message_elem', UxManager.reference.session_key + ':' + UxManager.reference.priority, message_elem);
                        var visibile = message_elem.parentNode.parentNode.parentNode.parentNode.parentNode.offsetTop - 45;
                        // console.log('visible', message_elem, visibile);
                        $(message_display).animate({
                            scrollTop: visibile
                        }, 500);
                        $timeout(function() {
                            $(message_elem.parentNode).addClass('cm-chat-reference-animation-style');
                            $(message_elem.parentNode.parentNode.parentNode.parentNode.parentNode).addClass('cm-chat-reference-animation');
                        }, 1000);
                        $timeout(function() {
                            $(message_elem.parentNode).removeClass('cm-chat-reference-animation-style');
                            $(message_elem.parentNode.parentNode.parentNode.parentNode.parentNode).removeClass('cm-chat-reference-animation');
                            /*                      $("#" + scope.referenced_display).animate({scrollTop: message_display_current}, "slow"); */
                        }, 4000);
                    });
                }
            });
        }
    };
}]).
directive('directoryItemScroll', function($timeout, $parse) {
    return {
        scope: true,
        //scope: true,   // optionally create a child scope
        link: function(scope, elem, attrs) {
            var model = $parse(attrs.directoryItemScroll);
            scope.$watch(model, function(value) {
                if (value === true) {
                    scope.safeApply(function() {
                        $timeout(function() {
                            document.getElementById('cm-main-panel-tracker-content').addClass('cm-no-scroll');
                            $('#cm-main-panel-tracker-content').animate({
                                scrollTop: elem[0].offsetTop - 100
                            });
                            /*              document.getElementById('chat-module-tracker-content').scrollTop = elem[0].offsetTop - 115;      */

                            document.getElementById('cm-main-panel-tracker-content').removeClass('cm-no-scroll');
                        });
                    })
                }
            });
        }
    };
}).
directive('presence', function($presence, types) {
    function getTypeNames(param) {
        if (!param) {
            return types.getAllTypeNames();
        } else {
            return param.split(' ');
        }
    }

    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            angular.forEach(getTypeNames(attrs.presence), function(typeName) {
                var type = types.get(typeName);
                element.on(type.events, function() {
                    $presence.registerAction(type.name);
                });
            });
        }
    };
});
