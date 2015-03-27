'use strict';
/*
Toaster Module

AngularJS Toaster is a AngularJS port of the toastr non-blocking notification jQuery library.
It requires AngularJS v1.2.6 or higher and angular-animate for the CSS3 transformations.

Contributors:
https://github.com/jirikavi/AngularJS-Toaster

Log History:
8/8/2014 : Created inital module by combining a custom controller with the code on the project github A.C.
8/9/2014 : Added the abilty to clear toasts by type or by id with ..$rootScope.$broacast('user-toast-clear', type/id); A.C.

To Do:


'use strict';

/*
 * AngularJS Toaster
 * Version: 0.4.8
 *
 * Copyright 2013 Jiri Kavulak.
 * All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * Author: Jiri Kavulak
 * Related to project of John Papa and Hans Fjällemark
 */
angular.module('toaster', ['ngAnimate']);

angular.module('toaster').controller('toasterController', ['$rootScope', '$scope', 'toasterManager', '$window', '$timeout',
    function($rootScope, $scope, toasterManager, $window, $timeout) {
        $scope.test = "This is the toaster.main controller";

        $scope.default_time = 2000;
        $scope.extended_time = 10000;
        $scope.sticky = 0;

        $scope.typeMap = {
            'success': {
                'title': 'Success',
                'type': 'Success',
                'body': "Task was completed",
                'timeout': $scope.default_time,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': null
            },
            'error': {
                'title': 'Error',
                'type': 'error',
                'body': "An error has occured.",
                'timeout': $scope.sticky,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': null
            },
            'wait': {
                'title': 'Loading...',
                'type': 'wait',
                'body': "Please wait while the app finds that for you...",
                'timeout': $scope.sticky,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': null
            },
            'warning': {
                'title': 'Warning',
                'type': 'warning',
                'body': "The app detected a warning",
                'timeout': $scope.extended_time,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': null
            },
            'note': {
                'title': 'Note',
                'type': 'note',
                'body': "Something interesting has happened",
                'timeout': $scope.extended_time,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': null
            },
            200: {
                'title': 200,
                'type': 'success',
                'body': "Successful HTTP request was made!",
                'timeout': $scope.default_time,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': null
            },
            '403': {
                'title': 200,
                'type': 'error',
                'body': "The request was a valid request, but the server is refusing to respond to it.",
                'timeout': $scope.sticky,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': null
            },
            '404': {
                'title': '404 Error',
                'type': 'error',
                'body': "The requested resource could not be found but may be available again in the future!",
                'timeout': $scope.sticky,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': null
            },
            '500': {
                'title': '500 Error',
                'type': 'error',
                'body': "Internal Server Error!",
                'timeout': $scope.sticky,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': null
            },
            'goTo': {
                'title': 'Note',
                'type': 'note',
                'body': "Something interesting has happened",
                'timeout': $scope.extended_time,
                'bodyOutputType': 'trustedHtml',
                'clickHandler': 'goToLink'
            },
            'custom2': {},
            'custom3': {},
            'custom4': {},
            'custom5': {},
            'custom6': {}
        };

        //clickHandlers
        $scope.goToLink = function(toaster) {
            var match = toaster.body.match(/http[s]?:\/\/[^\s]+/);
            if (match) $window.open(match[0]);
            return true;
        };

        // $scope.pop = function() {
        //     //function (type, title, body, timeout, bodyOutputType, clickHandler) {
        //     toaster.pop('success', "title", 'Its address is https://google.com.', 15000, 'trustedHtml', 'goToLink');
        //     toaster.pop('success', "title", '<ul><li>Render html</li></ul>', 5000, 'trustedHtml');
        //     toaster.pop('error', "title", '<ul><li>Render html</li></ul>', null, 'trustedHtml');
        //     toaster.pop('wait', "title", null, null, 'template');
        //     toaster.pop('warning', "title", "myTemplate.html", null, 'template');
        //     toaster.pop('note', "title", "text");
        // };

        $scope.$on('user-toast', function(event, toast_obj) {
            // console.log('toaster.main controller has received user-toast: ', toast_obj);
            if (!angular.isObject(toast_obj)) {
                console.log("Failure: PLease provide call 'user-toast' with toast object {text:..., type:..., title:...}");
                return false;
            }
            if (angular.isUndefined(toast_obj.type)) {
                console.log('Failure: PLease provide the obj.type for your toast');
                return false;
            } else {
                if ($scope.typeMap[toast_obj.type]) {
                    if (!toast_obj.id) {
                        toast_obj.id = null;
                    }
                    var toast = $scope.typeMap[toast_obj.type];
                    angular.forEach(toast_obj, function(value, key) {
                        toast[key] = value;
                    });

                    var record = toasterManager.pop(toast.type, toast.title, toast.body, toast.timeout, toast.bodyOutputType, toast.clickHandler, toast.id);
                    // console.log(toast);

                } else {
                    console.log("Failure: PLease provide call 'user-toast' with valid type");
                    return false;
                }
            }

        });

        $scope.$on('user-toast-clear', function(event, value) {
            if (angular.isUndefined(value)) {
                console.log('Failure: user-toast-clear : Please pass a valid type or toast.id');
            }
            if (value === 'all') {
                $rootScope.$broadcast('toaster-clearToasts');
            } else if ($scope.typeMap[value]) {
                toasterManager.clearType(value);
            } else {
                toasterManager.removeToast(value);
            }
        });
    }
]);

angular.module('toaster').service('toasterManager', ['$rootScope', function($rootScope) {
    this.pop = function(type, title, body, timeout, bodyOutputType, clickHandler, id) {
        this.toast = {
            type: type,
            title: title,
            body: body,
            timeout: timeout,
            bodyOutputType: bodyOutputType,
            clickHandler: clickHandler,
            id: id
        };
        $rootScope.$broadcast('toaster-newToast');
    };

    this.clear = function() {
        $rootScope.$broadcast('toaster-clearToasts');
    };

    this.clearType = function(type) {
        $rootScope.$broadcast('toaster-clearType', type);
    };

    this.removeToast = function(id) {
        $rootScope.$broadcast('toaster-removeToast', id);
    };
}]);

angular.module('toaster').constant('toasterConfig', {
    'limit': 0, // limits max number of toasts
    'tap-to-dismiss': true,
    'close-button': false,
    'newest-on-top': true,
    //'fade-in': 1000,            // done in css
    //'on-fade-in': undefined,    // not implemented
    //'fade-out': 1000,           // done in css
    // 'on-fade-out': undefined,  // not implemented
    //'extended-time-out': 1000,    // not implemented
    'time-out': 3000, // Set timeOut and extendedTimeout to 0 to make it sticky
    'icon-classes': {
        error: 'toast-error',
        info: 'toast-info',
        wait: 'toast-wait',
        success: 'toast-success',
        warning: 'toast-warning',
        goTo : 'toast-info',
        403: 'toast-error',
        404: 'toast-error',
        500: 'toast-error',
        200: 'toast-success',
    },
    'body-output-type': '', // Options: '', 'trustedHtml', 'template'
    'body-template': 'toasterBodyTmpl.html',
    'icon-class': 'toast-info',
    'position-class': 'toast-top-right',
    'title-class': 'toast-title',
    'message-class': 'toast-message'
});

angular.module('toaster').directive('toasterContainer', ['$compile', '$timeout', '$sce', 'toasterConfig', 'toasterManager',
    function($compile, $timeout, $sce, toasterConfig, toaster) {
        return {
            replace: true,
            restrict: 'EA',
            scope: true, // creates an internal scope for this directive
            link: function(scope, elm, attrs) {

                var id = 0,
                    mergedConfig;

                mergedConfig = angular.extend({}, toasterConfig, scope.$eval(attrs.toasterOptions));

                scope.config = {
                    position: mergedConfig['position-class'],
                    title: mergedConfig['title-class'],
                    message: mergedConfig['message-class'],
                    tap: mergedConfig['tap-to-dismiss'],
                    closeButton: mergedConfig['close-button']
                };

                scope.configureTimer = function configureTimer(toast) {
                    var timeout = typeof(toast.timeout) == "number" ? toast.timeout : mergedConfig['time-out'];
                    if (timeout > 0)
                        setTimeout(toast, timeout);
                };

                function addToast(toast) {
                    toast.type = mergedConfig['icon-classes'][toast.type];
                    if (!toast.type)
                        toast.type = mergedConfig['icon-class'];

                    if (toast.id) {
                        id++;
                    } else {
                        id++;
                        angular.extend(toast, {
                            id: id
                        });
                    }

                    // Set the toast.bodyOutputType to the default if it isn't set
                    toast.bodyOutputType = toast.bodyOutputType || mergedConfig['body-output-type'];
                    switch (toast.bodyOutputType) {
                        case 'trustedHtml':
                            toast.html = $sce.trustAsHtml(toast.body);
                            break;
                        case 'template':
                            toast.bodyTemplate = toast.body || mergedConfig['body-template'];
                            break;
                    }

                    scope.configureTimer(toast);

                    if (mergedConfig['newest-on-top'] === true) {
                        scope.toasters.unshift(toast);
                        if (mergedConfig['limit'] > 0 && scope.toasters.length > mergedConfig['limit']) {
                            scope.toasters.pop();
                        }
                    } else {
                        scope.toasters.push(toast);
                        if (mergedConfig['limit'] > 0 && scope.toasters.length > mergedConfig['limit']) {
                            scope.toasters.shift();
                        }
                    }
                    return id;
                }

                function removeId(id) {
                    var i = 0;
                    for (i; i < scope.toasters.length; i++) {
                        if (scope.toasters[i].id === id)
                            break;
                    }
                    scope.toasters.splice(i, 1);
                }

                function setTimeout(toast, time) {
                    toast.timeout = $timeout(function() {
                        scope.removeToast(toast.id);
                    }, time);
                }

                scope.toasters = [];
                scope.$on('toaster-newToast', function() {
                    addToast(toaster.toast);
                });

                scope.$on('toaster-clearToasts', function() {
                    scope.toasters.splice(0, scope.toasters.length);
                });

                scope.$on('toaster-removeToast', function(event, id) {
                    removeId(id);
                });

                scope.$on('toaster-clearType', function(event, type) {
                    // console.log('received toaster-clearType');
                    var isType = [];
                    angular.forEach(scope.toasters, function(value, key) {
                        if (value.type == 'toast-' + type) {
                            this.push(value.id);
                        }
                    }, isType);
                    angular.forEach(isType, function(value) {
                        removeId(value);
                    });
                });

            },
            controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {

                $scope.stopTimer = function(toast) {
                    if (toast.timeout) {
                        $timeout.cancel(toast.timeout);
                        toast.timeout = null;
                    }
                };

                $scope.restartTimer = function(toast) {
                    if (!toast.timeout)
                        $scope.configureTimer(toast);
                };

                $scope.removeToast = function(id) {
                    var i = 0;
                    for (i; i < $scope.toasters.length; i++) {
                        if ($scope.toasters[i].id === id)
                            break;
                    }
                    $scope.toasters.splice(i, 1);
                };

                $scope.click = function(toaster) {
                    if ($scope.config.tap === true) {
                        if (toaster.clickHandler && angular.isFunction($scope.$parent.$eval(toaster.clickHandler))) {
                            var result = $scope.$parent.$eval(toaster.clickHandler)(toaster);
                            if (result === true)
                                $scope.removeToast(toaster.id);
                        } else {
                            if (angular.isString(toaster.clickHandler))
                                console.log("TOAST-NOTE: Your click handler is not inside a parent scope of toaster-container.");
                            $scope.removeToast(toaster.id);
                        }
                    }
                };
            }],
            template: '<div  id="toast-container" ng-class="config.position">' +
                '<div ng-repeat="toaster in toasters" class="toast" ng-class="toaster.type" ng-click="click(toaster)" ng-mouseover="stopTimer(toaster)"  ng-mouseout="restartTimer(toaster)">' +
                '<button class="toast-close-button" ng-show="config.closeButton">&times;</button>' +
                '<div ng-class="config.title">{{toaster.title}}</div>' +
                '<div ng-class="config.message" ng-switch on="toaster.bodyOutputType">' +
                '<div ng-switch-when="trustedHtml" ng-bind-html="toaster.html"></div>' +
                '<div ng-switch-when="template"><div ng-include="toaster.bodyTemplate"></div></div>' +
                '<div ng-switch-default >{{toaster.body}}</div>' +
                '</div>' +
                '</div>' +
                '</div>'
        };
    }
]);
