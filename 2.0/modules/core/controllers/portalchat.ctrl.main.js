'use strict';
/*
 */
angular.module('portalchat.core').controller('core.main', ['$rootScope', '$scope', '$log', '$timeout', '$window', 'CoreConfig', 'CoreManager', 'UtilityManager', 'localStorageService',
    function($rootScope, $scope, $log, $timeout, $window, CoreConfig, CoreManager, UtilityManager, localStorageService) {
        $scope.runApp = false;

        $scope.initUser = function() {
            CoreManager.initUser();
        };

        $rootScope.$on('user-ready', function() {
            CoreManager.initApp();
            init_scope();
        });

        var init_scope = function() {
            $scope.settings = CoreManager.returnSettings();
            $scope.user = CoreManager.returnUser();
            $scope.contacts = CoreManager.returnContacts();
            console.log($scope);
        };

        $scope.chat = function(agent) {
            if ($scope.request_chat === true) {
                $scope.request_chat = false;
                $rootScope.$broadcast('requestChatSession', agent);
                $timeout(function() {
                    $scope.request_chat = true;
                }, 2000);
            }
        };

        $scope.$on('closeExternalWindow', function(event) {
            $log.debug('broadcast closeExternalWindow');
            if ($scope.externalWindowObject) {
                $scope.externalWindowObject.close();
                $scope.externalWindowObject = null;
            }
            if ($scope.isExternalInstance) {
                $window.close();
            }
            $scope.ischildWindow = false;
            localStorageService.remove("isExternalWindow");
        });

        $scope.$on('activateExternalWindow', function(event) {
            $log.debug('broadcast activateExternalWindow');
            if ($scope.externalWindowObject) {
                $scope.externalWindowObject.focus();
            }
            if ($scope.isExternalInstance) {
                $window.focus();
            }
        });

        $scope.$on('external-window-change', function(event, newStatus) {
            CoreManager.externalWindowChange(newStatus);
        });

        $scope.$on(['system-change'], function(event, notification) {
            CoreManager.observeSystemChange(notification);
        });

        $scope.$on('tod-change', function(event, to_user) {
            $scope.$evalAsync(function() {
                $scope.tod = UserManager._tod;
            });
        });

        $scope.$on('smod-change', function(event, to_user) {
            $scope.$evalAsync(function() {
                $scope.smod = UserManager._smod;
            });
        });

        $scope.$on('activateExternalWindow', function(event) {
            if ($scope.externalWindowObject) {
                $scope.externalWindowObject.focus();
            } else {
                $scope.openExternalWindow();
            }
        });
    }
]);
