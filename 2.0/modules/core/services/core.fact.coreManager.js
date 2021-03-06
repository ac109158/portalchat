angular.module('portalchat.core').factory('CoreManager', ['$rootScope', '$log', '$timeout', 'UserManager', 'SettingsManager', 'ContactsManager', 'BrowserService', 'UtilityManager', 'NotificationManager', 'states', 'localStorageService', 'ChatModuleManager', 'UiManager', 'UxManager', 'SessionsManager', 'OnlineManager',
    function($rootScope, $log, $timeout, UserManager, SettingsManager, ContactsManager, BrowserService, UtilityManager, NotificationManager, states, localStorageService, ChatModuleManager, UiManager, UxManager, SessionsManager, OnlineManager) {
        var that = this;

        this.initUser = function() {
            UserManager.load();
        };

        this.initApp = function() {
            if (UserManager.user.profile.id) {
                $timeout(function() {
                    NotificationManager.load();
                    UtilityManager.load();
                    ContactsManager.load();
                    OnlineManager.load();
                    SettingsManager.load();
                    SessionsManager.load();
                    ChatModuleManager.load();
                });
            } else {
                console.log('broken');
            }
            states.onChange(function(state) {
                UserManager.updateState(state.text);
            });
        };

        this.task_assignments = {
            'close-external-window-instance': function() {
                ChatModuleManager.closeExternalWindowInstance();
            },
            'clearBrowserNotificationList': function() {
                ChatModuleManager.clearBrowserNotificationList();
            },
            'evaluate-chat-module-layout': function() {
                UxManager.ux.fx.evaluateChatModuleLayout();
                UxManager.setChatModuleSectionWidths();
                $timeout(function() {
                    UxManager.setChatModuleSectionWidths();
                    UxManager.ux.fx.evaluateChatModuleLayout();
                }, 500)
            },
            'register-contact-chat-session': function() {
                ChatModuleManager.registerContactChatSession();
            }
        };

        this.assignTask = function(task) {
            if (task && task.id && that.task_assignments[task.id]) {
                that.task_assignments[task.id](task.param);
            }
        };


        this.returnModule = function() {
            return ChatModuleManager.module;
        };

        this.returnUi = function() {
            return UiManager.ui;
        };
        this.returnUx = function() {
            return UxManager.ux;
        };
        this.returnModule = function() {
            return ChatModuleManager.module;
        };

        this.setPresence = function(presence) {
            UserManager.setPresence(presence);
        };

        this.updateSoundLevel = function(level) {
            if (parseInt(level) && level > -1 && level <= 50) {
                NotificationManager.updateSoundLevel(level);
                SettingsManager.updateSoundLevel(level);
                $timeout(function() {
                    NotificationManager.playSound(NotificationManager.sound.new_chat);
                });

            }
        };

        this.handleUtilityChange = function(notification) {

        };

        this.observeSystemChange = function(notification) {
            if (notification.system === 'network' || notification.system === 'network') {
                that.observeNetworkChange(notification.value);
            } else if (notification.system === 'firebase') {

            } else if (notification.system === 'portal') {
                that.observePortalChange(notification.value);
            }
        };

        this.observeNetworkChange = function(online) {
            if (online === true) {
                $timeout(function() {
                    UserManager.setUserOnline(true);
                    NotificationManager.playSound(NotificationManager.sound.money);
                    UtilityManager.setNetworkOnline();
                });
            } else {
                UserManager.setUserOnline(false);
                NotificationManager.playSound(NotificationManager.sound.bash_error);
                UtilityManager.setNetworkOffline();
            }
        };

        this.observePortalChange = function(online_state) {
            if (online_state === true) {
                UtilityManager.setPortalOnline();
            } else {
                UtilityManager.setPortalOffline();
            }
        };

        this.externalWindowChange = function(status) {
            NotificationManager.mute(5000);
            UiManager.externalWindowChange(status);
            ChatModuleManager.externalWindowChange(status);
        };
        this.clearBrowserNotificationList = function() {
            ChatModuleManager.clearBrowserNotificationList();
        };
        this.closeExternalWindowInstance = function() {

        };

        return this;
    }
]);
