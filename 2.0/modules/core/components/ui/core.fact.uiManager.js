'use strict'; /* Factories */
angular.module('portalchat.core').
service('UiManager', ['$rootScope', '$firebase', '$log', '$http', '$window', '$document', '$timeout', 'CoreConfig', 'SettingsManager', 'ChatModuleManager', function($rootScope, $firebase, $log, $http, $window, $document, $timeout, CoreConfig, SettingsManager, ChatModuleManager) {
    var that = this;
    this.fb = {};
    this.fb.location = {};

    this.fb.target = {};
    this.ux = {};

    this.ux.module = {};
    this.ux.module.setting = {};
    this.ux.module.setting.alert_to_open = false;
    this.ux.module.setting.innerHeight = $window.innerHeight;
    this.ux.module.setting.is_external_window = undefined;
    this.ux.module.setting.is_external_window_instance = undefined;
    if (String($window.location.href).split('?')[1] == CoreConfig.ext_link) {
        this.ux.module.setting.backdrop = true;
    } else {
        this.ux.module.setting.backdrop = false;
    }

    this.ux.module.marker = {};

    this.ux.module.marker.is_setting_layout = true;
    this.ux.module.marker.allow_chat_request = true;


    this.ux.module.state = {};
    this.ux.module.state.is_unactive_listed = false;
    this.ux.module.state.is_locked = false;
    this.ux.module.state.is_open = false;
    this.ux.module.state.is_opening = false;
    this.ux.module.state.is_closing = false;
    this.ux.module.state.is_playing_sound = false;
    this.ux.module.state.is_setting_layout = false;


    this.ux.queue = {};
    this.ux.queue.setting = {};
    this.ux.queue.setting.width = 110;

    this.ux.panel = {};
    this.ux.panel.setting = {};
    this.ux.panel.setting.panel_width = 250;
    this.ux.panel.setting.panel_height = parseInt($window.height, 10) || 0;
    this.ux.panel.setting.tracker_panel_size = 115;
    this.ux.panel.setting.resize_vertical = 0;
    this.ux.panel.setting.resize_vertical_2 = 0;
    this.ux.panel.setting.resize_vertical_3 = 0;
    this.ux.panel.setting.resize_width = 0;
    this.ux.panel.setting.resize_width_2 = 0;
    this.ux.panel.setting.resize_width_3 = 0;

    this.ux.panel.marker = {};
    this.ux.panel.marker.layout = 1;

    this.ux.panel.menu = {};
    this.ux.panel.menu.profile = false;
    this.ux.panel.menu.presence = false;
    this.ux.panel.menu.nav = false;
    this.ux.panel.menu.filter = false;
    this.ux.panel.menu.volume = false;

    this.ux.chat = {};
    this.ux.chat.contact = {};
    this.ux.chat.contact = {};
    this.ux.chat.contact.setting = {};
    this.ux.chat.contact.setting.panel_width = 237;
    this.ux.chat.contact.setting.textarea_height = 35;
    this.ux.chat.contact.setting.label_height = 25;
    this.ux.chat.contact.setting.margin = 2;

    this.ux.chat.directory = {};
    this.ux.chat.directory.setting = {};
    this.ux.chat.directory.setting.panel_width = 237;
    this.ux.chat.directory.setting.textarea_height = 35;
    this.ux.chat.directory.setting.label_height = 25;

    this.ux.window = {};
    this.ux.window.setting = {};
    this.ux.window.setting.hidden = "hidden";
    this.ux.window.setting.status = 'visible';
    this.ux.window.setting.default_window_title = 'Dashboard';
    this.ux.window.attr = {};
    this.ux.window.attr.unread = 0;

    this.ui = {};
    this.ui.settings = {};
    this.ui.markers = {};
    this.ui.fx = {};


    this.addVisiblityListener = function() {
        // Standards:
        if (that.ux.window.hidden in $document)
            $document.addEventListener("visibilitychange", onchange);
        else if ((that.ux.window.hidden = "mozHidden") in $document)
            $document.addEventListener("mozvisibilitychange", onchange);
        else if ((that.ux.window.hidden = "webkitHidden") in $document)
            $document.addEventListener("webkitvisibilitychange", onchange);
        else if ((that.ux.window.hidden = "msHidden") in $document)
            $document.addEventListener("msvisibilitychange", onchange);
        // IE 9 and lower:
        else if ('onfocusin' in $document)
            $document.onfocusin = $document.onfocusout = onchange;
        // All others:
        else
            $window.onpageshow = $window.onpagehide = $window.onfocus = $window.onblur = onchange;

        function onchange(evt) {
            var v = 'visible',
                h = 'hidden',
                evtMap = {
                    focus: v,
                    focusin: v,
                    pageshow: v,
                    blur: h,
                    focusout: h,
                    pagehide: h
                };

            evt = evt || $window.event;
            if (evt.type in evtMap) {
                that.ux.window.setting.status = evtMap[evt.type];
            } else {
                that.ux.window.setting.status = this[that.ux.window.hidden] ? "hidden" : "visible";
            }
            if (that.ux.window.setting.status === 'visible') {
                SettingsManager.module.is_window_visible = true;
                that.ux.window.attr.unread = 0;
                $document.title = that.ux.window.setting.default_window_title;
            } else {
                SettingsManager.module.is_window_visible = false;
            }
            $rootScope.$apply();
        }
    };




    this.ui.fx.setModuleLayout = function() {
        that.ux.module.setting.innerHeight = $window.innerHeight;
        if (SettingsManager.module.is_open) {
            if (SettingsManager.module.layout === 1 || angular.isUndefined(SettingsManager.module.layout)) {

            } else if (SettingsManager.module.layout === 2) {

            } else if (SettingsManager.module.layout === 3) {

            }
        }
    };

    this.ui.fx.externalWindowchange = function(status) {
        if (status === false && that.ux.module.setting.is_external_window_instance === false) {
            that.ux.module.setting.is_external_window = false;
            that.setModuleLayout();
        } else if (status === true && that.ux.module.setting.is_external_window_instance === false) {
            $timeout(function() {
                that.ux.module.setting.is_external_window = true;
            }, 750);

        }
        if (status && that.ux.module.setting.is_external_window_instance) {
            that.ui.panel.setting.panel_width = $window.innerWidth;
        } else {
            that.ui.panel.setting.panel_width = 250;
        }
    };

    this.ui.fx.increaseFontSize = function() {
        if (SettingsManager.module.font_size < 16) {
            SettingsManager.update('font_size', (SettingsManager.module.font_size + 1));
        }
    };

    this.ui.fx.decreaseFontSize = function() {
        if (SettingsManager.module.font_size > 12) {
            SettingsManager.update('font_size', (SettingsManager.module.font_size - 1));
        }
    };

    this.ui.fx.updateSoundLevel = function(level) {
        if (parseInt(level) && level > -1 && level <= 50) {
            SettingsManager.update('sound_level', level);
        }
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
        console.log('close');
        ChatModuleManager.resetDirectoryChatListMarkers();
        $rootScope.$evalAsync(function() {
            that.ux.module.state.is_closing = true;
        });
        $timeout(function() {
            that.ux.module.state.is_open = false;
            that.ux.module.state.is_closing = false;
        }, 1000);
        SettingsManager.update('is_open', false);
    };

    this.ui.fx.openChatModule = function() {
        that.ux.module.state.is_closing = false;
        that.ux.module.state.is_locked = true;
        $rootScope.$evalAsync(function() {
            that.ux.module.state.is_opening = true;
            that.ux.module.state.is_open = true;
        });
        $timeout(function() {
            $rootScope.$evalAsync(function() {
                that.ux.module.state.is_opening = false;
                that.ui.fx.setModuleLayout();
            });
        }, 1000);
        SettingsManager.update('is_open', true);
        $rootScope.$broadcast('clear_notifications');
    };

    this.ui.fx.toggleChatPanelOpen = function(value) {
        if (parseInt(SettingsManager.module.layout, 10) === 2 && angular.isDefined(value)) {
            SettingsManager.update('is_open', value);
        }
        if (value) {
            $timeout(function() {
                that.ui.fx.setModuleLayout();
            });
        }
    };

    this.ui.fx.toggleChatModuleLayout = function() {
        if (SettingsManager.module.layout === 1) {
            that.ui.fx.switchChatModuleLayout(2);
        } else {
            that.ui.fx.switchChatModuleLayout(1);
        }
    };

    this.ui.fx.switchChatModuleLayout = function(layout) {
        if (layout === 3 && ChatModuleManager.chat.contact.list.length === 0 || layout === SettingsManager.module.layout) {
            return false;
        }
        $rootScope.$evalAsync(function() {
            that.ux.module.state.is_setting_layout = true;
            SettingsManager.update('layout', layout);
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
        that.ux.panel.menu.nav = false;
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
                SettingsManager.update(setting, value);
            } else {
                SettingsManager.update(setting, !SettingsManager.module[setting]);
            }
        }
    };



    this.load = function() {
        that.addVisiblityListener();
        // that.setModuleLayout();
    };

    this.load();

    return this;
}]);
