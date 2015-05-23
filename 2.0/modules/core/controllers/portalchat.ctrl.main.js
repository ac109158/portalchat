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
            $timeout(function() {
                init_scope();
            }, 750);

        });

        var init_scope = function() {
            $scope.module = CoreManager.returnModule();
            $scope.ui = CoreManager.returnUi();
            $scope.ux = CoreManager.returnUx();
            console.log($scope);
        };

        $scope.$on('core-task-assignment', function(event, task) {
            if (task && task.id) {
                CoreManager.assignTask(task);
            }
        });

        $scope.$on('clear-browser-notifications', function() {
            CoreManager.clearBrowserNotificationList();
        });

        $scope.$on('close-external-window-instance', function(event) {
            $log.debug('close-external-window-instance');
            CoreManager.closeExternalWindowInstance();
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
