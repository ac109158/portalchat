'use strict';
/*
 */
angular.module('portalchat.core').controller('core.main', ['$rootScope', '$scope', '$log', '$timeout', '$window', 'CoreConfig', 'CoreManager', 'UtilityManager',
    function($rootScope, $scope, $log, $timeout, $window, CoreConfig, CoreManager, UtilityManager) {
        $scope.test = "This is the core controller";
        $scope.runApp = false;

        $scope.ui = {};
        $scope.ui.settings = {};

        $scope.ui.settings.showProfileMenu = false;
        $scope.ui.settings.showPresenceMenu = false;
        $scope.ui.settings.showVolumeMenu = false;
        $scope.ui.settings.requestChat = true;

        $scope.initUser = function() {
            CoreManager.initUser();
        };

        $rootScope.$on('user-ready', function() {
            CoreManager.initApp();
            init_scope();
        });

        var init_scope = function() {
            $scope.user = CoreManager.returnUser();
            $scope.contacts = CoreManager.returnContacts();

            if (String($window.location.href).split('?')[1] == CoreConfig.ext_link) {
                $scope.ui.settings.backdrop = true;
            } else {
                $scope.ui.settings.backdrop = false;
            }
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

        $scope.$on(['system-change'], function(event, notification){
            CoreManager.observeSystemChange(notification);
        });

        $scope.ui.returnFalse = function() {
            return false;
        };

        $scope.ui.broadcastPresenceStatus = function(status) {
            if (status) {
                $rootScope.$broadcast('chat_presence_change', status);
            }
        };

        $scope.ui.toggleProfileMenu = function() {
            $scope.ui.settings.showProfileMenu = !$scope.ui.settings.showProfileMenu;
        };

        $scope.ui.togglePresenceMenu = function() {
            $scope.ui.settings.showPresenceMenu = !$scope.ui.settings.showPresenceMenu;
        };
        $scope.ui.setPresence = function(presence) {
            if (presence) {
                CoreManager.setPresence(presence);
            }
        };

        $scope.ui.toggleVolumeMenu = function() {
            $scope.ui.settings.showVolumeMenu = !$scope.ui.settings.showVolumeMenu;
        };

        $scope.ui.updateSoundLevel = function(level) {
            if (parseInt(level) && level > -1 && level <= 50) {
                CoreManager.updateSoundLevel(level);
                $scope.sound_level = level;
            }
        };

        $scope.activateExternalWindow = function() {
            if ($scope.externalWindowObject) {
                console.log('activateExternalWindow');
                $scope.externalWindowObject.focus();
            } else {
                $scope.$broadcast('activateExternalWindow');
            }
        };
    }
]);
