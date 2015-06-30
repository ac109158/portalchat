'use strict'; /* Factories */
angular.module('portalchat.core').
service('UiManager', ['$rootScope', '$interval', '$firebase', '$log', '$http', '$sce', '$window', '$document', '$timeout', 'CoreConfig', 'UserManager', 'UtilityManager', 'SettingsManager', 'ChatModuleManager', 'PermissionsManager', 'NotificationManager','localStorageService',  function($rootScope, $interval, $firebase, $log, $http, $sce, $window, $document, $timeout, CoreConfig, UserManager, UtilityManager, SettingsManager, ChatModuleManager, PermissionsManager, NotificationManager, localStorageService) {
    var that = this;

    this.ui = {};


    this.ui.fx = {};

    this.ui.fx.setModuleLayout = function(value) {
        ChatModuleManager.setModuleLayout(value);
    };

    this.ui.fx.increaseFontSize = function() {
        if (SettingsManager.global.font_size < CoreConfig.max.font_size) {
            SettingsManager.updateGlobalSetting('font_size', (SettingsManager.global.font_size + 1), true);
            NotificationManager.playSound('action');
        }
    };

    this.ui.fx.decreaseFontSize = function() {
        if (SettingsManager.global.font_size > CoreConfig.min.font_size) {
            SettingsManager.updateGlobalSetting('font_size', (SettingsManager.global.font_size - 1), true);
            NotificationManager.playSound('action');
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

    this.ui.fx.log = function() {
        $rootScope.$broadcast('assign-task', {
            id: 'log',
            param: 'Test'
        });
    };

    this.ui.fx.resetDefaultSettings = function(type, session_key) {
        ChatModuleManager.resetDefaultSettings(type, session_key);
    };

    this.ui.fx.chatContact = function(contact) {
        ChatModuleManager.chatContact(contact);
    };

    this.ui.fx.setChatAsCurrent = function(type, session_key){
        if(SettingsManager.global.layout === 1){
            ChatModuleManager.setMainPanelTab(3);
        }
        ChatModuleManager.setChatAsCurrent(type, session_key);
    };

    this.ui.fx.sendChatMessage = function(type, session_key, media) {
        ChatModuleManager.sendChatMessage(type, session_key, media);
    };
    this.ui.fx.showChatThatUserIsTyping = function(type, session_key) {
        ChatModuleManager.showChatThatUserIsTyping(type, session_key);
    };

    this.ui.fx.setChatTag = function(type, session_key) {
        ChatModuleManager.setChatTag(type, session_key);
    };

    this.ui.fx.removeChatTag = function(type, session_key) {
        ChatModuleManager.removeChatTag(type, session_key);
    };

    this.ui.fx.setChatTopic = function(type, session_key) {
        ChatModuleManager.setChatTopic(type, session_key);
    };
    this.ui.fx.updateChatTopic = function(type, session_key) {
        ChatModuleManager.updateChatTopic(type, session_key);
    };
    this.ui.fx.removeChatTopic = function(type, session_key) {
        ChatModuleManager.removeChatTopic(type, session_key);
    };

    this.ui.fx.inviteIntoChat = function(type, session_key){
        ChatModuleManager.inviteIntoChat(type, session_key);
    };

    this.ui.fx.removeContactFromChat = function(type, session_key, contact_id){
        console.log('here');
        ChatModuleManager.removeContactFromChat(type, session_key, contact_id);
    };

    
    this.ui.fx.updateSoundLevel = function(level) {
        if (parseInt(level) && level > -1 && level <= CoreConfig.max.sound_level) {
            NotificationManager.updateSoundLevel(level);
            SettingsManager.updateGlobalSetting('sound_level', level);
            NotificationManager.playSound('new_chat');
        }
    };

    this.ui.fx.toggleChatSound = function(type, session_key) {
        ChatModuleManager.toggleChatSound(type, session_key);
        NotificationManager.playSound('action');
    };


    this.ui.fx.increasePanelVerticalAdjustment = function() {
        SettingsManager.increasePanelVerticalAdjustment();
    };

    this.ui.fx.decreasePanelVerticalAdjustment = function() {
        SettingsManager.decreasePanelVerticalAdjustment();
    };


    this.ui.fx.toggleMainPanelMenu = function(menu, value) {
        ChatModuleManager.toggleMainPanelMenu(menu, value);
    };

    this.ui.fx.toggleChatMenu = function(type, session_key, menu, value) {
        ChatModuleManager.toggleChatMenu(type, session_key, menu, value);
    };

    this.ui.fx.toggleContactListShowOffline = function(value) {
        ChatModuleManager.toggleContactListShowOffline(value);
    };

    this.ui.fx.chatContactListSearch = function() {
        ChatModuleManager.chatContactListSearch();
    };

    this.ui.fx.setMainPanelTab = function(tab_index) {
        ChatModuleManager.setMainPanelTab(tab_index);
    };

    this.ui.fx.setUserChatPresence = function(clear) {
        UserManager.setUserChatPresence(clear);
    };
    this.ui.fx.updatePresenceMessagePost = function() {
        UserManager.updatePresenceMessagePost();
    };
    this.ui.fx.updatePresenceMessage = function() {
        UserManager.updatePresenceMessage();
    };

    this.ui.fx.openChatModuleInExternalWindow = function() {
        ChatModuleManager.openChatModuleInExternalWindow();
    };
    this.ui.fx.focusExternalWindowInstance = function() {
        ChatModuleManager.focusExternalWindowInstance();
    };

    this.ui.fx.closeChatModule = function() {
        ChatModuleManager.toggleMainPanelMenu(null);
        ChatModuleManager.closeChatModule();
    };

    this.ui.fx.openChatModule = function() {
        if(SettingsManager.global.is_external_window && localStorageService.get('is_external_window')){
            SettingsManager.focusExternalWindowInstance();
        } else{
            ChatModuleManager.openChatModule();
        }
    };

    this.ui.fx.addReferenceToChatMessage = function(type, session_key, message) {
        ChatModuleManager.addReferenceToChatMessage(type, session_key, message);
    };

    this.ui.fx.toggleChatModuleLayout = function() {
        if (SettingsManager.global.layout === 1) {
            that.ui.fx.switchChatModuleLayout(2);
        } else {
            that.ui.fx.switchChatModuleLayout(1);
        }
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
    this.ui.fx.deactivateChat = function(type, session_key) {
        ChatModuleManager.deactivateChat(type, session_key);
    };

    this.ui.fx.leaveChat = function(type, session_key) {
        ChatModuleManager.leaveChat(type, session_key);
    };

    this.ui.fx.loadPreviousChatMessages = function(type, session_key) {
        ChatModuleManager.loadPreviousChatMessages(type, session_key);
    };

    this.ui.fx.createDirectoryListChat = function(session_key) {
        ChatModuleManager.createDirectoryListChat(session_key);
    };
    this.ui.fx.clearBrowserNotificationList = function(event) {
        ChatModuleManager.clearBrowserNotificationList();
    };

    return this;
}]);
