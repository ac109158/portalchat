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
directive('chatModuleExternal', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './modules/core/partials/chat/chat_module_external.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('chat', function() {
    return {
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/chat.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('chatbox', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/chatbox.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('groupChat', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/group.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('techChat', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/tech_chat.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('mcChat', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/mc_chat.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('adminChat', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/admin_chat.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('directoryChat', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/directory_chat.html',
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
directive('cmDirectoryTrackerPanel', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/chat_tracker.html',
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
directive('cmProfile', function() {
    return {
        scope: true,
        restrict: 'EA',
        replace: true,
        templateUrl: './modules/core/partials/chat/user_profile.html',
        link: function(scope, elm, attrs) {}
    };
}).
directive('cmUserProfile', ['UserManager', function(UserManager) {
    return {
        scope: {
            name: '=',
            avatar: '=',
            online: '=',
            user_presence: '=',
            user_presence_message: '=',
            user_presence_mesage_show: '=',
            data: '=',
            user: '=',
            access: '=',
            gpk: '='
        },
        restrict: 'E',
        replace: true,
        templateUrl: './modules/core/partials/chat/profile_tracker.html',
        link: function(scope, elm, attrs) {
            scope.inAdminGroup = function() {
                if (UserManager._user_profile && UserManager._user_profile.position) {
                    if ('3424258'.indexOf(UserManager._user_profile.position) != -1) {
                        return true;
                    }
                }
                return false;
            };
        }
    };
}]).
directive('ngEnterPress', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngEnterPress);
                });

                event.preventDefault();
            }
        });
    };
}).
directive('ngTabPress', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 9) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngTabPress);
                });

                event.preventDefault();
            }
        });
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
directive('focusMe', function($timeout, $parse) {
    return {
        //scope: true,   // optionally create a child scope
        link: function(scope, elem, attrs) {
            var model = $parse(attrs.focusMe);
            scope.$watch(model, function(value) {
                if (value === true) {
                    $timeout(function() {
                        if (angular.isDefined(elem[0].value)) {
                            var elemLen = elem[0].value.length;
                            if (elem[0].selectionStart || elem[0].selectionStart == '0') {
                                // Firefox/Chrome
                                elem[0].selectionStart = elemLen;
                                elem[0].selectionEnd = elemLen;
                                elem[0].focus();
                            } else {
                                elem[0].focus();
                            }
                        }

                    });
                }
            });
            // to address @blesh's comment, set attribute value to 'false'
            // on blur event:
            elem.bind('blur', function() {
                if (model && model.assign) {
                    scope.$apply(model.assign(scope, false));
                }

            });
        }
    };
}).
directive('ngKeydown', function() {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            // this next line will convert the string
            // function name into an actual function
            var functionToCall = scope.$eval(attrs.ngKeydown);
        }
    };
}).
directive('typeaheadUsers', function($timeout) {
    return {
        restrict: 'AEC',
        scope: {
            items: '=',
            prompt: '@',
            title: '@',
            subtitle: '@',
            avatar: '@',
            model: '=',
            onSelect: '&'
        },
        link: function(scope, elem, attrs) {
            scope.handleSelection = function(selectedItem) {
                scope.model = selectedItem;
                scope.current = 0;
                scope.selected = true;
                $timeout(function() {
                    scope.onSelect();
                }, 200);
            };
            scope.current = 0;
            scope.selected = true; // hides the list initially
            scope.isCurrent = function(index) {
                return scope.current == index;
            };
            scope.setCurrent = function(index) {
                scope.current = index;
            };
        },
        templateUrl: './modules/core/partials/chat/typeahead.html'
    };
}).
directive('windowResize', function($rootScope, $window, $timeout) {
    return {
        //scope: true,   // optionally create a child scope
        link: function(scope, elem, attrs) {
            angular.element($window).on('resize', function() {
                if (scope.module.interval.window_resize) {
                    $timeout.cancel(scope.module.interval.window_resize);
                }
                scope.module.interval.window_resize = $timeout(function() {
                    $rootScope.$broadcast('core-task-assignment', {
                        id: 'evaluate-chat-module-layout',
                        param: null
                    });
                    $timeout.cancel(scope.module.interval.window_resize);
                }, 500);
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
directive('scrollOnClick', function($timeout, $parse) {
    return {
        scope: true,
        //scope: true,   // optionally create a child scope
        link: function(scope, elem, attrs) {
            var model = $parse(attrs.scrollOnClick);
            scope.$watch(model, function(value) {
                if (value === true) {
                    $timeout(function() {
                        var message_display = document.getElementById(scope.referenced_display);
                        var message_display_current = message_display.scrollTop;
                        var message_display_height = message_display.clientHeight;
                        /*                  console.log(scope.referenced_message_id); */
                        var message_elem = document.getElementById(scope.referenced_message_id);
                        var elem_height = message_elem.parentNode.parentNode.clientHeight;
                        var display_offset = (message_display_height / 3) - elem_height;
                        var visibile = message_elem.parentNode.parentNode.offsetTop - ((elem_height / 2) + 15);

                        $("#" + scope.referenced_display).animate({
                            scrollTop: visibile
                        }, 500);
                        $timeout(function() {
                            message_elem.addClass('text-danger chat-reference-animation');
                        }, 1000);
                        $timeout(function() {
                            message_elem.removeClass('text-danger chat-reference-animation');
                            /*                      $("#" + scope.referenced_display).animate({scrollTop: message_display_current}, "slow"); */
                        }, 4000);
                    });
                }
            });
        }
    };
}).
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
