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

        $scope.engine = {};
        $scope.engine.portal = {};
        $scope.engine.portal.online = true;

        $scope.engine.firebase = {};
        $scope.engine.firebase.online = true;

        $scope.engine.network = {};
        $scope.engine.network.pinging = false;
        $scope.engine.network.ping = undefined;

        $scope.engine.network.online = true;

        var init_scope = function() {
            $scope.user = CoreManager.returnUser();
            $scope.contacts = CoreManager.returnContacts();

            if (String($window.location.href).split('?')[1] == CoreConfig.ext_link) {
                $scope.backdrop = true;
            } else {
                $scope.backdrop = false;
            }

            $scope.$on('network_online', function(event) {
                $scope.engine.network = true;
            });

            $scope.$on('network_offline', function(event) {
                $scope.engine.network = false;
            });

            $scope.$on('portal_online', function(event) {
                $scope.engine.portal.online = true;
            });

            $scope.$on('portal_offline', function(event) {
                $scope.engine.portal.online = false;
            });

            $scope.$on('firebase_online', function(event) {
                $scope.engine.firebase.online = true;
            });

            $scope.$on('firebase_offline', function(event) {
                $scope.engine.firebase.online = false;
            });

            $scope.$on('browser_online', function(event) {
                $rootScope.browser.online = true;
            });

            $scope.$on('browser_offline', function(event) {
                $rootScope.browser.online = false;
                if ($scope.platform.browser === "Firefox") {
                    $window.navigator.offline = true;
                }
            });

            console.log($scope);
        };

        $scope.initUser = function() {
            CoreManager.initUser();
        };

        $rootScope.$on('user-ready', function() {
            CoreManager.initApp();
            init_scope();
        });

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


        $scope.ui.setFirebaseOffline = function() {
            $log.debug('setting offline');
            $scope.engine.firebase.online  = false;
            UtilityManager.setFirebaseOffline();
        };

        $scope.ui.setFirebaseOnline = function() {
            $log.debug('setting Online');
            $scope.engine.firebase.online  = true;
            UtilityManager.setFirebaseOnline();
        };

        $scope.ui.runPingTest = function() {
            $scope.engine.network.isPing = true;
            UtilityManager.pingTest($scope.engin.network);
        };

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
