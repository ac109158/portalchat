angular.module('portalchat.core').service('CoreApi', ['$rootScope', '$http', '$timeout', '$log', 'CoreConfig',
    function($rootScope, $http, $timeout, $log, CoreConfig) {
        return {
            __getUser: function() {
                if (true) {
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
                }
            },
        };
    }
]);
