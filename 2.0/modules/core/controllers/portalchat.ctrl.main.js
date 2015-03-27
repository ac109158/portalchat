'use strict';
/*
 */
angular.module('portalchat.core').controller('core.main', ['$rootScope', '$scope', '$log', '$timeout', 'UserManager', 'BrowserService', 'UtilityManager', 'states', 'localStorageService',
    function($rootScope, $scope, $log, $timeout, UserManager, BrowserService, UtilityManager, states, localStorageService) {
        $scope.test = "This is the core controller";
        $scope.runApp = false;
        $scope.showProfileMenu = false;
        $scope.showPresenceMenu = false;
        $scope.showVolumeMenu = false;
        $scope.sound_level = 2;

        $scope.initApp = function() {
            UserManager.load();
            $scope.user = UserManager.user;
            console.log(UserManager.fb);

            states.onChange(function(state) {
                $scope.text = state.text;
                UserManager.updateState(state.text);
            });
        };

        $scope.states = states;
        $scope.browser = BrowserService.platform.browser;
        $scope.os = BrowserService.platform.os;
        $scope.browserVersion = BrowserService.platform.browserVersion;

        $scope.request_chat = true;

        $scope.chat = function(agent) {
            if ($scope.request_chat === true) {
                $scope.request_chat = false;
                $rootScope.$broadcast('requestChatSession', agent);
                $timeout(function() {
                    $scope.request_chat = true;
                }, 2000);
            }
        };
        $scope.network = true;
        $scope.portal_online = true;
        $scope.firebase_connection = true;

        $scope.$on('closeExternalWindow', function(event) {
            $log.debug('broadcast closeExternalWindow');
            if ($scope.externalWindowObject) {
                $scope.externalWindowObject.close();
                $scope.externalWindowObject = null;
            }
            if ($scope.isExternalInstance) {
                window.close();
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
                window.focus();
            }
        });

        jQuery(document).ready(function() {
            $scope.$on('network_online', function(event) {
                $scope.network = true;
            });

            $scope.$on('network_offline', function(event) {
                $scope.network = false;
            });

            $scope.$on('portal_online', function(event) {
                $scope.portal_online = true;
            });

            $scope.$on('portal_offline', function(event) {
                $scope.portal_online = false;;
            });

            $scope.$on('firebase_online', function(event) {
                $scope.firebase_connection = true;;
            });

            $scope.$on('firebase_offline', function(event) {
                $scope.firebase_connection = false;;
            });

            $scope.$on('browser_online', function(event) {
                $rootScope.browser_online = true
            });

            $scope.$on('browser_offline', function(event) {
                $rootScope.browser_online = false
                if (BrowserService.browser = "Firefox") {
                    window.navigator.offline = true;
                }
            });
        });


        $scope.setFirebaseOffline = function() {
            $log.debug('setting offline');
            UtilityManager.setFirebaseOffline();
        };

        $scope.setFirebaseOnline = function() {
            $log.debug('setting Online');
            UtilityManager.setFirebaseOnline();
        };

        $scope.isPing = false;
        $scope.runPingTest = function(chat) {
            UtilityManager.__pingTest($scope, chat);
        };

        $scope.returnFalse = function() {
            return false;
        };

        if (String(window.location.href).split('?')[1] == 'option=com_content&view=article&id=100&Itemid=1111') {
            $scope.backdrop = true;
        } else {
            $scope.backdrop = false;
        }

        $scope.broadcastPresenceStatus = function(status) {
            if (status) {
                $rootScope.$broadcast('chat_presence_change', status);
            }
        };

        $scope.toggleProfileMenu = function() {
            $scope.showProfileMenu = !$scope.showProfileMenu;
        };

        $scope.togglePresenceMenu = function() {
            $scope.showPresenceMenu = !$scope.showPresenceMenu;
        };
        $scope.setPresence = function(presence) {
            if (presence) {
                $scope.clearPresenceOptions();
                UserManager.storeChatPresence(presence);
                UserManager.user_presence_location.update({
                    'chat-presence': presence
                });
                if (presence == 'Offline') {
                    UserManager.storeUserOnline(false);
                    $timeout(function() {
                        UserManager.user_online_location.update({
                            'online': false
                        });
                    }, 1000);
                } else {
                    UserManager.storeUserOnline(true);
                    $timeout(function() {
                        UserManager.user_online_location.update({
                            'online': true
                        });
                    }, 1000);

                }
            }
        };

        $scope.toggleVolumeMenu = function() {
            $scope.showVolumeMenu = !$scope.showVolumeMenu;
        };

        $scope.updateSoundLevel = function(level) {
            if (parseInt(level) && level > -1 && level <= 50) {
                NotificationService.__updateSoundLevel(parseInt(level));
                UserManager.user_settings_location.update({
                    'sound-level': parseInt(level)
                });
                $scope.sound_level = level;
                $timeout(function() {
                    NotificationService.__playSound(NotificationService._new_chat);
                });

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


        $scope.updatePresenceMessage = function() {
            if (!$scope.user_profile.presence.message) {
                $scope.user_profile.presence.message_show = false;
                $scope.updatePresenceMessageShow();
                $scope.user_profile.presence.auto_post = false;
                $scope.updatePresenceMessagePost();
            }
            UserManager.user_presence_location.update({
                message: $scope.user_profile.presence.message
            });
        };

        $scope.clearPresenceOptions = function() {
            $scope.user_profile.presence.message = '';
            $scope.updatePresenceMessage();
            $scope.user_profile.presence.show_message = false;
            $scope.updatePresenceMessageShow();
            $scope.user_profile.presence.auto_post = false;
            $scope.updatePresenceMessagePost();

        };

        $scope.updatePresenceMessageShow = function() {
            $log.debug('updatePresenceMessageShow');
            if (angular.isDefined($scope.user_profile.presence.show_message)) {
                UserManager.user_presence_location.update({
                    'show-message': $scope.user_profile.presence.show_message
                });
            }
        };

        $scope.updatePresenceMessagePost = function() {
            $log.debug('updatePresenceMessageShowPost');
            if (angular.isDefined($scope.user_profile.presence.auto_post)) {
                UserManager.user_presence_location.update({
                    'auto-post': $scope.user_profile.presence.auto_post
                });
            }
        };
    }
]);
