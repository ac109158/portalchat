'use strict'; /* Factories */
angular.module('portalchat.core').
service('UiManager', ['$rootScope', '$interval', '$firebase', '$log', '$http', '$sce', '$window', '$document', '$timeout', 'CoreConfig', 'UtilityManager', 'SettingsManager', 'ChatModuleManager', 'PermissionsManager', 'NotificationManager', function($rootScope, $interval, $firebase, $log, $http, $sce, $window, $document, $timeout, CoreConfig, UtilityManager, SettingsManager, ChatModuleManager, PermissionsManager, NotificationManager) {
    var that = this;

    this.ui = {};


    this.ui.fx = {};

    this.ui.fx.setModuleLayout = function(value) {
        ChatModuleManager.setModuleLayout(value);
    };

    this.ui.fx.increaseFontSize = function() {
        if (SettingsManager.global.font_size < CoreConfig.max.font_size) {
            SettingsManager.updateGlobalSetting('font_size', (SettingsManager.global.font_size + 1));
        }
    };

    this.ui.fx.decreaseFontSize = function() {
        if (SettingsManager.global.font_size > CoreConfig.min.font_size) {
            SettingsManager.updateGlobalSetting('font_size', (SettingsManager.global.font_size - 1));
        }
    };

    this.ui.fx.setFirebaseOffline = function() {
        $log.debug('setting offline');
        UtilityManager.setFirebaseOffline();
    };

    this.ui.fx.setFirebaseOnline = function() {
        $log.debug('setting Online');
        UtilityManager.setFirebaseOnline();
    };

    this.ui.fx.runPingTest = function() {
        UtilityManager.pingTest(UtilityManager.engine.network);
    };

    this.ui.fx.pingHost = function() {
        UtilityManager.pingHost();
    };



    this.ui.fx.updateSoundLevel = function(level) {
        if (parseInt(level) && level > -1 && level <= CoreConfig.max.sound_level ) {
            SettingsManager.updateGlobalSetting('sound_level', level);
        }
    };

    this.ui.fx.increasePanelVerticalAdjustment = function() {
        SettingsManager.increasePanelVerticalAdjustment();
    };

    this.ui.fx.decreasePanelVerticalAdjustment = function() {
        SettingsManager.decreasePanelVerticalAdjustment();
    };


    this.ui.fx.broadcastPresenceStatus = function(status) {
        if (status) {
            $rootScope.$broadcast('chat-presence-change', status);
        }
    };

    this.ui.fx.togglePanelMenu = function(menu) {
        if (angular.isDefined(that.ux.panel.menu[menu])) {
            that.ux.panel.menu[menu] = !that.ux.panel.menu[menu];
        }

    };

    this.ui.fx.setPresence = function(presence) {
        if (presence) {
            SettingsManager.setPresence(presence);
        }
    };

    this.ui.fx.activateExternalWindow = function() {
        if (that.externalWindowObject) {
            console.log('activateExternalWindow');
            that.externalWindowObject.focus();
        } else {
            $rootScope.$broadcast('activate-external-window');
        }
    };

    this.ui.fx.closeChatModule = function() {
        ChatModuleManager.closeChatModule();
    };

    this.ui.fx.openChatModule = function() {
        ChatModuleManager.openChatModule();
    };

    this.ui.fx.lookUpChatReference = function(priority, message_id, display_id) {
        ChatModuleManager.lookUpChatReference(priority, message_id, display_id);
    };

    this.ui.fx.toggleChatPanelOpen = function(value) {
        if (parseInt(SettingsManager.global.layout, 10) === 2 && angular.isDefined(value)) {
            SettingsManager.updateGlobalSetting('is_open', value);
        }
        if (value) {
            $timeout(function() {
                that.ui.fx.setModuleLayout();
            });
        }
    };

    this.ui.fx.toggleChatModuleLayout = function() {
        if (SettingsManager.global.layout === 1) {
            that.ui.fx.switchChatModuleLayout(2);
        } else {
            that.ui.fx.switchChatModuleLayout(1);
        }
    };

    this.ui.fx.switchChatModuleLayout = function(layout) {
        if (layout === 3 && ChatModuleManager.chat.contact.list.length === 0 || layout === SettingsManager.global.layout) {
            return false;
        }
        $rootScope.$evalAsync(function() {
            that.ux.module.state.is_setting_layout = true;
            SettingsManager.updateGlobalSetting('layout', layout);
            if (layout === 2) {
                $timeout(function() {
                    if (ChatModuleManager.directory.chat.marker.index != "contacts") {
                        $document.getElementById(ChatModuleManager.directory.chat.marker.index + '_link').click();
                    }
                    that.ui.fx.setModuleLayout();
                    that.ux.module.state.is_setting_layout = false;
                }, 500);
            } else if (layout === 3) {
                $timeout(function() {
                    if (!ChatModuleManager.module.current.chat) {
                        ChatModuleManager.setDirectoryChat(ChatModuleManager.directory.chat.marker.stored_index || 0, true);
                    }
                    $document.getElementById(ChatModuleManager.directory.chat.marker.index + '_link').click();
                    that.ux.module.state.is_setting_layout = false;
                }, 500);
            } else if (layout === 1) {
                $timeout(function() {
                    if (ChatModuleManager.directory.chat.marker.stored_index === 'contacts') {
                        ChatModuleManager.setContactsFocus();
                    } else {
                        ChatModuleManager.setDirectoryChatFocus(ChatModuleManager.directory.chat.marker.stored_index);
                    }
                    that.ux.module.state.is_setting_layout = false;
                }, 250);
            }
        });
    };

    this.ui.fx.resetDirectoryChatListMarkers = function() {
        ChatModuleManager.resetDirectoryChatListMarkers();
    };

    this.ui.fx.toggleChatModuleState = function(state, value) {
        if (angular.isDefined(that.ux.module.state[state])) {
            if (angular.isDefined(value)) {
                that.ux.module.state[state] = value;
            } else {
                that.ux.module.state[state] = !that.ux.module.state[state];
            }
        }
    };

    this.ui.fx.toggleChatModuleSetting = function(setting, value) {
        if (angular.isDefined(SettingsManager.module[setting])) {
            if (angular.isDefined(value)) {
                SettingsManager.updateGlobalSetting(setting, value);
            } else {
                SettingsManager.updateGlobalSetting(setting, !SettingsManager.module[setting]);
            }
        }
    };

    this.ui.fx.mute = function(duration) {
        if (duration && duration > 0) {
            NotificationManager.mute(duration);
        } else {
            NotificationManager.mute(null);
        }
    };

    this.ui.fx.unmute = function() {
        NotificationManager.unmute();
    };

    this.ui.fx.playSound = function() {
        NotificationManager.playSound('new_chat');
    };

    this.ui.fx.clearChatMessageHistory = function(type, session_key) {
        ChatModuleManager.clearChatMessageHistory(type, session_key);
    };

    this.ui.fx.removeChat = function(type, session_key) {
        ChatModuleManager.removeChat(type, session_key);
    };

    this.ui.fx.loadPreviousChatMessages = function(type, session_key) {
        ChatModuleManager.loadPreviousChatMessages(type, session_key);
    };

    this.ui.fx.addReferenceToChatMessage = function(type, session_key, message) {
        ChatModuleManager.addReferenceToChatMessage(type, session_key, message);
    };

    this.ui.fx.createDirectoryListChat = function(session_key) {
        ChatModuleManager.createDirectoryListChat(session_key);
    };
    this.ui.fx.clearBrowserNotificationList = function(event) {
        ChatModuleManager.clearBrowserNotificationList();
    };

    return this;
}]);
