angular.module('portalchat.core').service('CoreApi', ['$rootScope', '$http', '$timeout', '$log', 'CoreConfig', 'BrowserService',
    function($rootScope, $http, $timeout, $log, CoreConfig, BrowserService) {
        return {
            __getUser: function() {
                if (true) {
                    console.log(angular.copy(BrowserService.platform.browser));
                    // var promise = $http({
                    //     method: "POST",
                    //     headers: {
                    //         'Content-Type': 'application/x-www-form-urlencoded'
                    //     },
                    //     url: '',
                    //     data: $.param({ // jshint ignore:line
                    //         userID: model.id,
                    //     })
                    // });
                    // return the promise to the controllerx
                    if (BrowserService.platform.browser == "Firefox") {
                        var promise = $http.get('./modules/core/user.json')
                            .success(function(data) {
                                return data;
                            }).error(function(msg, code) {
                                $log.error(msg, code);
                                $rootScope.$broadcast('user-toast', {
                                    type: 'warning',
                                    body: code + ' : ' + msg
                                });
                            });
                        return promise;
                    } else {
                        var promise = $http.get('./modules/core/user2.json')
                            .success(function(data) {
                                return data;
                            }).error(function(msg, code) {
                                $log.error(msg, code);
                                $rootScope.$broadcast('user-toast', {
                                    type: 'warning',
                                    body: code + ' : ' + msg
                                });
                            });
                        return promise;
                    }

                }
            },
        };
    }
]);
