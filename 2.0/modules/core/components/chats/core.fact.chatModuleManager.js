angular.module('portalchat.core').
service('ChatModuleManager', ['$rootScope', '$log', '$window', '$timeout', 'CoreConfig', 'UserManager', 'ContactsManager', 'SettingsManager', 'SessionsManager', 'NotificationManager', 'ChatStorage', 'ChatBuilder', 'ChatManager', 'GroupChatManager', 'DirectoryChatManager', 'UtilityManager', 'UxManager', 'BrowserService', 'localStorageService', function($rootScope, $log, $window, $timeout, CoreConfig, UserManager, ContactsManager, SettingsManager, SessionsManager, NotificationManager, ChatStorage, ChatBuilder, ChatManager, GroupChatManager, DirectoryChatManager, UtilityManager, UxManager, BrowserService, localStorageService) {
    var that = this;
    this.fb = {};
    this.fb.chat = {};
    this.fb.chat.location = {};
    this.fb.chat.targets = {};

    this.fb.group_chat = {};
    this.fb.group_chat.location = {};
    this.fb.group_chat.targets = {};

    this.module = {};
    this.module.user = UserManager.user;
    this.module.contacts = ContactsManager.contacts;
    this.module.engine = UtilityManager.engine;
    this.module.platform = BrowserService.platform;
    this.module.global = SettingsManager.global;
    this.module.chats = ChatStorage;

    this.module.asset = {};
    this.module.asset.external_window_instance = undefined;



    this.module.state = {};
    this.module.state.is_ready = false;
    this.module.state.alert_to_open = false;
    this.module.state.is_locked = false;
    this.module.state.is_open = false;
    this.module.state.is_opening = false;
    this.module.state.is_closing = false;
    this.module.state.is_setting_layout = false;
    this.module.state.allow_chat_request = true;

    this.module.contact_list = {};
    this.module.contact_list.search_text = '';
    this.module.contact_list.is_text_focus = false;
    this.module.contact_list.selected = undefined;
    this.module.contact_list.setting = {};
    this.module.contact_list.setting.show_offline = false;
    this.module.contact_list.setting.filter = {
        online: true
    };
    this.module.contact_list.setting.default_avatar = CoreConfig.url.default_avatar;

    this.module.session = {};
    this.module.session.id = '';

    this.module.priority = {};
    this.module.priority.queue = [];

    this.module.browser = {};
    this.module.browser.platform = BrowserService.platoform;
    this.module.browser.notification = {};
    this.module.browser.notification.list = [];


    this.module.tab = {};
    this.module.tab.list = CoreConfig.module.tab.list;
    this.module.tab.current = SettingsManager.global.last_panel_tab || CoreConfig.module.tab.list[0];


    this.module.referenced = {};
    this.module.referenced.priority = null;
    this.module.referenced.display_id = null;
    this.module.referenced.message_id = null;

    this.module.config = {};
    this.module.config.directory = {};
    this.module.config.directory.models = ['name', 'session_key', 'admin', 'monitor', 'active'];
    this.module.config.directory.default_chats = {};

    this.module.setting = CoreConfig.module.setting;

    this.module.attr = {};
    this.module.attr.total_unread_messages = 0;
    this.module.attr.tmp = 1;
    this.module.attr.tmp_chat = '';
    this.module.attr.updated_text = '';
    this.module.attr.is_referencing = false;
    this.module.attr.is_page_loaded = false;
    this.module.attr.is_chat_ping = false;
    this.module.attr.lact_active_chat = undefined;
    this.module.attr.last_unread_chat = undefined;
    this.module.attr.last_removed_chat = undefined;
    this.module.attr.last_requested_chat = undefined;
    this.module.attr.last_query_location = undefined;

    this.module.current = {};
    this.module.current.session_key = null;

    this.module.current.directory = {};
    this.module.current.directory.chat = {};
    this.module.current.directory.stored_session_key = null;
    this.module.current.directory.session_key = undefined;

    this.module.current.contact = {};
    this.module.current.contact.chat = {};
    this.module.current.contact.session_key = undefined;
    this.module.current.contact.stored_session_key = undefined;

    this.module.menu = {};
    this.module.menu.profile = false;
    this.module.menu.presence = false;
    this.module.menu.filter = false;
    this.module.menu.directory_chat_list = false;
    this.module.menu.setting = false;

    this.module.interval = {};
    this.module.interval.window_resize = null;

    this.load = function() {
        that.setDefaultDirectoryChatConfiguration();
        that.establishUserChat();
        ChatBuilder.load();
        $timeout(function() {
            if (CoreConfig.monitorContactsBehavior) {
                ContactsManager.monitorContactsBehaviour();
            }
            $timeout(function() {
                that.module.state.is_ready = true;
                $timeout(function() {
                    $timeout(function() {
                        that.evaluateChatModuleLayout();
                        that.addUnloadListener();
                        that.module.attr.is_page_loaded = true;
                    }, 1000);
                });
            });
        });
    };

    this.addUnloadListener = function() {
        $window.onbeforeunload = function(e) {
            SettingsManager.unload();
            SessionsManager.unload();
        };
    };

    this.establishUserChat = function() { //  Step 1 this function will initialize the that variables and set the user chat presence.
        if (CoreConfig.user && UserManager.user.profile.id) {
            NotificationManager.mute();
            ChatStorage.contact.session.list = [];
            ChatStorage.contact.session.map = {};

            // look at the active session folder of the user, and create chatSession for an calling card objects present
            SessionsManager.fb.location.sessions.child(UserManager.user.profile.id).once('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var sessions = snapshot.val();
                angular.forEach(sessions, function(session) {
                    if (session) {
                        ChatBuilder.buildChatForSession(session);
                    }
                });
                $timeout(function() {
                    var discard_last_child = true;
                    var last_child;
                    SessionsManager.fb.location.signals.child('contact').child(UserManager.user.profile.id).once("value", function(snap) {
                        var signals = snap.val();
                        var keys = Object.keys(signals || {});
                        angular.forEach(keys, function(key) {
                            session_key = UserManager.user.profile.id + ':' + key;
                            if (that.createSessionifNotExists('contact', session_key)) {};
                        });
                        angular.forEach(signals, function(signal, key) {
                            var session_key = UserManager.user.profile.id + ':' + key;
                            if (ChatStorage['contact'] && ChatStorage['contact'].chat.list[session_key]) {
                                if (angular.isDefined(signal.priority) && signal.priority > ChatStorage['contact'].chat.list[session_key].session.last_read_priority) {
                                    $timeout(function() {
                                        ChatStorage['contact'].chat.list[session_key].session.active = true;
                                        SessionsManager.setContactChatOrderMap();
                                    });

                                }
                            }
                        });
                        last_child = keys[keys.length - 1];
                        if (angular.isUndefined(last_child)) {
                            discard_last_child = false;
                        }

                        SessionsManager.fb.location.signals.child('contact').child(UserManager.user.profile.id).on("child_changed", function(snapshot) {
                            var key = snapshot.key();
                            var signals = snapshot.val();
                            var session_key = UserManager.user.profile.id + ':' + key;
                            if (ChatStorage[signals.type].chat.list[session_key].session.active && signals && signals.type) {
                                if (ChatStorage[signals.type] && ChatStorage[signals.type].chat.list[session_key]) {
                                    $rootScope.$evalAsync(function() {
                                        ChatStorage[signals.type].chat.list[session_key].signals.contact = signals;
                                        if (signals.topic != ChatStorage[signals.type].chat.list[session_key].session.topic) {
                                            ChatStorage[signals.type].chat.list[session_key].session.topic = signals.topic;
                                            ChatStorage[signals.type].chat.list[session_key].signals.user.topic = signals.topic;
                                            ChatStorage[signals.type].chat.list[session_key].topic.truncated = false;
                                            SessionsManager.setUserChatSessionStorage(signals.type, session_key);
                                        }
                                    });
                                }
                            }
                        });
                        SessionsManager.fb.location.signals.child('contact').child(UserManager.user.profile.id).startAt(null, last_child).on("child_added", function(snapshot) {
                            var location_id = snapshot.ref().key();
                            var signal = snapshot.val();
                            if (signal) {
                                if (discard_last_child) {
                                    discard_last_child = false;
                                } else {
                                    if (signal && signal.type) {
                                        if (signal.type === 'contact') {
                                            var contact_tag = CoreConfig.common.reference.user_prefix + location_id;
                                            if (angular.isDefined(ContactsManager.contacts.profiles.map[contact_tag]) && ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[contact_tag]]) {
                                                that.createSessionifNotExists('contact', that.getSessionKey(location_id));
                                            }
                                        } else if (signal.type === 'group' && signal.session_key) {
                                            if (signal.type === 'group') {
                                                if (signal.exit) {
                                                    $rootScope.$evalAsync(function() {
                                                        that.toggleChatMenu('contact', signal.session_key, 'settings', false);
                                                        SessionsManager.closeChatSession('contact', signal.session_key);
                                                        SessionsManager.fb.location.signals.child('contact').child(UserManager.user.profile.id).child(signal.session_key).set(null);
                                                    });
                                                    return;
                                                } else {
                                                    var set_as_current = false;
                                                    var config;
                                                    if (ChatStorage.contact && ChatStorage.contact.chat.list[signal.session_key]) {
                                                        config = angular.copy(ChatStorage.contact.chat.list[signal.session_key].session);
                                                        config.end_at_priority = -1;
                                                        config.admin = signal.admin || false;
                                                        config.topic = signal.topic || '';
                                                        config.active = true;
                                                        if (that.module.current.contact.session_key === signal.session_key) {
                                                            that.module.current.contact.session_key = undefined;
                                                            that.module.current.contact.chat = undefined;
                                                            set_as_current = true;
                                                        }
                                                        delete ChatStorage.contact.chat.list[signal.session_key];
                                                        delete ChatStorage.contact.session.list[signal.session_key];
                                                    } else {

                                                        config = {};
                                                        config.type = 'contact',
                                                            config.start_at_priority = signal.priority,
                                                            config.session_key = signal.session_key;
                                                        config.admin = signal.admin || false;
                                                        config.name = 'Group Chat';
                                                        config.topic = signal.topic || '';
                                                        config.active = true;
                                                    }
                                                    if (ChatBuilder.buildChatForSession(that.getContactGroupChatSessionDetails(config))) {
                                                        if (set_as_current) {
                                                            that.setChatAsCurrent(config.type, config.session_key);
                                                        }
                                                        SessionsManager.fb.location.signals.child('contact').child(UserManager.user.profile.id).child(signal.session_key).set(null);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        that.setActiveContactChatMap();
                    });
                    $timeout(function() {
                        that.setDefaultDirectoryChats();
                    }, 750);
                }, 750);
            });
            $timeout(function() {
                NotificationManager.unmute();
            }, 500);
        }
        $log.debug('Finished that.establishUserChat');
        return true;
    };
    this.chatContactListSearch = function() {
        that.chatContact(that.module.contact_list.selected);
        that.module.contact_list.selected = undefined;
    };

    this.getSessionKey = function(contact_id) {
        return UserManager.user.profile + ':' + contact_id;
    };

    this.createSessionifNotExists = function(type, session_key) {
        if (ChatStorage[type].chat.list[session_key]) {
            return false;
        } else {
            if (type == 'contact' && ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + session_key.split(':')[1]]]) {
                var contact = angular.copy(ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + session_key.split(':')[1]]]);
                that.registerContactChatSession(that.getContactChatSessionDetails(contact), false);
            }
            return true;
        }
    };

    this.getContactChatSessionDetails = function(contact) {
        if (contact && contact.user_id && ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + contact.user_id]]) {
            var session = {};
            session.admin = false;
            session.type = 'contact';
            session.session_key = UserManager.user.profile.id + ':' + contact.user_id;
            session.active = false;
            session.avatar = contact.avatar;
            session.name = contact.name;
            session.contact_id = contact.user_id;
            session.is_directory_chat = false;
            session.is_group_chat = false;
            session.is_open = true;
            session.timestamp = new Date().getTime();
            session.is_sound = true;
            session.primary_color = '82, 179, 217';
            session.other_color = '244, 179, 80';
            session.accent_color = '149, 165, 166';
            session.topic = '';
            session.tag = '';
            session.order = -1;
            session.start_at_priority = 0;
            session.end_at_priority = -1;
            session.last_read_priority = -1;
            return session;
        }
        return false;
    };

    this.getContactGroupChatSessionDetails = function(config) {
        if (angular.isObject(config)) {
            var session = {};
            session.admin = config.admin || false;
            session.type = 'contact';
            session.session_key = config.session_key || null;
            session.active = config.active || false;
            session.name = config.name;
            session.is_directory_chat = false;
            session.is_group_chat = true;
            session.is_open = true;
            session.timestamp = new Date().getTime();
            session.is_sound = config.is_sound || true;
            session.primary_color = '82, 179, 217';
            session.other_color = '244, 179, 80';
            session.accent_color = '149, 165, 166';
            session.topic = config.topic || '';
            session.tag = config.tag || '';
            session.order = -1;
            session.start_at_priority = config.start_at_priority;
            session.end_at_priority = -1;
            session.last_read_priority = -1;
            return session;
        }
        return false;
    };

    this.getDirectoryChatSessionDetails = function(config) {
        if (config && config.session_key) {
            var session = {};
            session.admin = config.admin;
            session.type = 'directory';
            session.session_key = config.session_key;
            session.active = config.active;
            session.name = config.name;
            session.is_directory_chat = true;
            session.is_group_chat = true;
            session.is_open = true;
            session.timestamp = new Date().getTime();
            session.monitor = config.monitor;
            session.is_sound = config.is_sound;
            session.primary_color = config.primary_color;
            session.other_color = config.other_color;
            session.accent_color = config.accent_color;
            session.topic = '';
            session.tag = '';
            session.order = config.order;
            session.start_at_priority = 0;
            session.end_at_priority = -1;
            session.last_read_priority = -1;
            return session;
        }
        return false;
    };

    this.chatContact = function(contact) {
        if (contact && contact.user_id && that.module.state.allow_chat_request) {
            if (SettingsManager.global.layout === 1) {
                that.setMainPanelTab(3);
            }
            that.module.state.allow_chat_request = false;
            var session = that.getContactChatSessionDetails(contact);
            if (that.registerContactChatSession(angular.copy(session))) {
                $timeout(function() {
                    that.module.state.allow_chat_request = true;
                    that.activateUserContactChatSession(session.type, session.session_key);
                    that.setChatAsCurrent(session.type, session.session_key);
                    NotificationManager.playSound('action');
                });
            }
        }
    };

    this.activateUserContactChatSession = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].session.active = true;
            SessionsManager.setUserChatSessionStorage(type, session_key);
        }
    };

    this.registerContactChatSession = function(session) {
        if (session && angular.isObject(session) && session.session_key && session.user_id !== UserManager.user.profile.id) {
            var index;
            $log.debug('Requesting chat session');
            if (!(UtilityManager.engine.firebase.online)) {
                $log.debug('Request Denied: Firebase is Offline');
                return false;
            } else if (that.module.attr.last_requested_chat === session.session_key) {
                $log.debug('This appears to be a duplicate rquest, return false');
                that.module.attr.last_requested_chat = undefined;
                return true;
            }
            that.module.attr.last_requested_chat = session.session_key;
            if (ChatStorage.contact.chat.list[session.session_key]) {
                that.module.attr.last_requested_chat = undefined;
                $log.debug('Chat is already in chat list');
                return true;
            }
            return ChatBuilder.buildChatForSession(session);
        }
    };

    this.registerDirectoryChatSession = function(session_key, set_focus) {
        $log.debug('registerDirectoryChatSession(' + session_key + ')');
        var type = session_key.split('_')[0];
        $log.debug('type: ' + type);
        var id = session_key.split('_')[1];
        $log.debug('id: ' + id);
        that.module.menu.directory_chat_list = false;
        if (ChatStorage.directory.chat.list[session_key]) {
            $log.debug(session_key + 'already exists');
            that.setChatAsCurrent('directory', session_key);
            return;
        } else {
            if (type === 'mc') {
                ChatManager.__pushChatSession(DirectoryChatManager.__buildNewDirectoryChat($scope, (chat_name), UserManager._users_profiles_obj[CoreConfig.common.reference.user_prefix + id].name + ' - MC Team Chat', id, false, false, 3), false, $scope); //scope, chat_reference, chat_description, admin, watch_users
            } else if (session_key === 'admin_group_chat') {
                ChatManager.__pushChatSession(DirectoryChatManager.__buildNewDirectoryChat($scope, ('admin_group_chat'), 'Admin - Group Chat', UserManager._user_profile.user_id, false, true, 3), false, $scope);
            } else {
                return false;
            }
            $timeout(function() {
                that.setChatAsCurrent('directory', session_key);
            }, 1000);
            return;
        }
    };

    this.setDefaultDirectoryChatConfiguration = function() {
        if (!that.module.state.is_ready) {
            that.module.config.directory.default_chats['sm_group_chat'] = {
                type: 'directory',
                session_key: 'sm_group_chat',
                name: 'PlusOne Chat',
                admin: true,
                watch_users: false,
                store_length: 1,
                order: 0,
                monitor: false,
                is_sound: false,
                active: true,
                primary_color: '82, 179, 217',
                other_color: '244, 179, 80',
                accent_color: '149, 165, 166',
                icon_class: 'fa fa-users fa-2x'
            };
            that.module.config.directory.default_chats['sm_tech_chat'] = {
                type: 'directory',
                session_key: 'sm_tech_chat',
                name: 'Tech Support',
                admin: true,
                watch_users: false,
                store_length: 2,
                order: 1,
                monitor: false,
                is_sound: false,
                active: true,
                primary_color: '82, 179, 217',
                other_color: '244, 179, 80',
                accent_color: '149, 165, 166',
                icon_class: 'fa fa-wrench fa-2x'
            };
        }
    };

    this.setDefaultDirectoryChats = function() {
        if (that.module.config.directory.default_chats) {
            angular.forEach(that.module.config.directory.default_chats, function(config) {
                if (that.validateDirectoryChatConfiguration(config)) {
                    if (!ChatStorage.directory.chat.list[config.session_key]) {
                        ChatBuilder.buildChatForSession(that.getDirectoryChatSessionDetails(config));
                    }
                    $timeout(function() {
                        if (ChatStorage.directory && ChatStorage.directory.chat.list[config.session_key]) {
                            ChatStorage.directory.chat.list[config.session_key].ux.icon = config.icon_class;
                            SessionsManager.fb.location.signals.child('directory').child(config.session_key).on("value", function(snapshot) {
                                var signals = snapshot.val();
                                if (ChatStorage.directory.chat.list[config.session_key].session.active && signals) {
                                    if (ChatStorage.directory && ChatStorage.directory.chat.list[config.session_key]) {
                                        $rootScope.$evalAsync(function() {
                                            if (signals.is_typing) {
                                                delete signals.is_typing[UserManager.user.profile.id];
                                            }
                                            if (!Object.size(signals.is_typing)) {
                                                signals.is_typing = [];
                                            }
                                            ChatStorage.directory.chat.list[config.session_key].signals.group = signals;
                                            if (signals.topic != ChatStorage.directory.chat.list[config.session_key].session.topic) {
                                                if (signals.topic) {
                                                    ChatStorage.directory.chat.list[config.session_key].session.topic = signals.topic;
                                                } else {
                                                    ChatStorage.directory.chat.list[config.session_key].session.topic = '';
                                                }

                                                ChatStorage.directory.chat.list[config.session_key].topic.truncated = false;
                                                SessionsManager.setUserChatSessionStorage('directory', config.session_key);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    })

                    return;
                }
            });
        }
    };



    this.validateDirectoryChatConfiguration = function(directory_chat_config) {
        var pass = false;
        if (directory_chat_config && angular.isObject(directory_chat_config)) {
            pass = true;
            var len = that.module.config.directory.models.length;
            while (len--) {
                if (angular.isUndefined(directory_chat_config[that.module.config.directory.models[len]])) {
                    pass = false;
                    $log.error('validateDirectoryChatConfiguration: Fail : ', that.module.config.directory.models[len], ' is undefined');
                    break;
                }
            }
        }
        return pass;
    };

    this.validateChatModels = function() {
        // clear all unused group active sessions

    };

    this.setDefaultSettings = function(chat) {
        if (angular.isUndefinedOrNull(chat) || angular.isUndefinedOrNull(chat.index_position)) {
            return;
        }
        chat.is_sound = SettingsManager.is_sound;
        chat.monitor = SettingsManager.monitor;
        $timeout(function() {
            if (chat.topic_location.$value === null || chat.topic_location.$value === undefined) {
                chat.firebase_location.child('topic').set(false);
            } else {
                if (document.getElementById('topic_' + chat.session_key + '_wrapper')) {
                    chat.topic_height = document.getElementById('topic_' + chat.session_key + '_wrapper').clientHeight;
                }
            }
        });
    };

    this.resetDefaultSettings = function(type, session_key) {
        if (that.module.current.directory.chat.menu) {
            angular.forEach(that.module.current.directory.chat.menu, function(value, key) {
                that.module.current.directory.chat.menu[key] = false;
            });
        }
        if (that.module.current.contact.chat.menu) {
            angular.forEach(that.module.current.contact.chat.menu, function(value, key) {
                that.module.current.contact.chat.menu[key] = false;
            });
        }
        ChatManager.resetCommonDefaultSettings(type, session_key);
    };

    this.openChatModuleInExternalWindow = function() {
        $scope.switchLayout(1);
        if (UserManager._user_settings_location) {
            UserManager._user_settings_location.update({
                'is-external-window': false
            });
        }
        $timeout(function() {
            that.module.asset.external_window_instance = window.open(CoreConfig.url.external, "PlusOnePortalChat", "left=1600,resizable=false, scrollbars=no, status=no, location=no,top=0");
            if (that.module.asset.external_window_instance) {
                // that.module.asset.external_window_instance.resizeTo(350, window.innerHeight + 50);
                $timeout(function() {
                    $rootScope.$evalAsync(function() {
                        that.module.attr.is_external_window = true;
                        that.module.attr.isExternalWindow = true;
                        that.module.asset.external_window_instance.focus();
                        NotificationManager.mute();


                        /*                  UtilityManager.setFirebaseOffline(); */

                        that.module.asset.external_window_listener = $(that.module.asset.external_window_instance).bind("beforeunload", function() {
                            SettingsManager.updateGlobalSetting('is_external_window', false, true);
                        });

                        that.module.asset.external_window_listener = $scope.$watch('externalWindowObject.closed', function(newValue) {
                            if (newValue) {
                                UserManager._user_settings_location.update({
                                    'is-external-window': false
                                });
                                localStorageService.remove('is_external_window');
                                $scope.isExternalWindow = false;
                            }
                        });
                        that.module.asset.external_window_instance.addEventListener('DOMContentLoaded', resizeExternalWindowInstance, true);

                        function resizeExternalWindowInstance() {
                            $timeout(function() {
                                that.module.asset.external_window_instance.document.documentElement.style.overflow = 'hidden'; // firefox, chrome
                                that.module.asset.external_window_instance.document.body.scroll = "no"; // ie only

                                localStorageService.add('isExternalWindow', true);
                            }, 2000);
                        }
                    });
                }, 1000);
            }
            return false;
        }, 750);
    };
    this.closeExternalWindowInstance = function() {

    };

    this.externalWindowChange = function(status) {
        if (status === false && CoreConfig.module.setting.is_external_window_instance === false) {
            if (that.module.asset.external_window_instance) {
                that.module.asset.external_window_listener = null;
                that.module.asset.external_window_instance = null;
            }
        }
        that.evaluateChatModuleLayout();
    };

    this.focusExternalWindowInstance = function() {
        if (that.module.asset.external_window_instance) {
            that.module.asset.external_window_instance.focus();
        } else {
            NotificationManager.mute(10000);
            that.openChatModuleInExternalWindow();
        }
    };


    this.establishChatLayout = function() {
        $log.debug('calling this.establishLayout()');
        if (SettingsManager.global.is_external_window === true && CoreConfig.module.setting.is_external_window_instance === false) {
            return;
        }

        if (SettingsManager.global.is_external_window && CoreConfig.module.setting.is_external_window_instance) {
            $document.documentElement.style.overflow = 'hidden'; // firefox, chrome
            $document.body.scroll = "no"; // ie only
        }
        var init_tab = 'contacts';

        if (SettingsManager.global.layout === 1 && angular.isDefined(SettingsManager.global.last_active_chat)) {
            if (typeof SettingsManager.global.lact_active_chat === 'string') {
                if (ChatStorage.contact.chat.list.length > 0) {
                    that.directory.chat.active = ChatStorage.contact.chat.list[0];
                    that.directory.chat.marker.index = 0;
                    that.directory.chat.marker.stored_index = 0;
                }
                init_tab = SettingsManager.global.lact_active_chat + '_link';

            } else {
                init_tab = 'contacts_link';
            }
            that.module.marker.is_page_loaded = true;

            if (SettingsManager.global.is_open) {
                if (angular.isDefined(SettingsManager.global.last_mandatory_chat) && typeof SettingsManager.global.last_mandatory_chat === 'string') {
                    that.setMandatoryFocus(SettingsManager.global.last_mandatory_chat);
                } else if (angular.isDefined(SettingsManager.global.last_mandatory_chat) && typeof SettingsManager.global.last_active_chat === 'number') {
                    that.setDirectoryChat(SettingsManager.global.last_active_chat, true);
                } else {
                    if (init_tab) {
                        if (document.getElementById(init_tab)) {
                            document.getElementById(init_tab).click();
                        }
                    }
                }
            } else if (SettingsManager.global.layout === 3) {
                if (angular.isUndefinedOrNull(SettingsManager.global.last_active_chat) || angular.isDefined(SettingsManager.global.last_active_chat) && typeof SettingsManager.global.last_active_chat === 'string') {
                    if (ChatStorage.contact.chat.list.length > 0) {
                        that.directory.chat.active = ChatStorage.contact.chat.list[0];
                        that.directory.chat.stored_index = that.directory.chat.index = 0;
                    }
                }
                if (angular.isDefined(SettingsManager.global.last_mandatory_chat) && typeof SettingsManager.global.last_mandatory_chat_index === 'string') {
                    init_tab = SettingsManager.global.last_mandatory_chat + '_link';
                } else {
                    init_tab = 'contacts_link';
                }
                if (ChatStorage.contact.chat.list.length > 0) {
                    if (angular.isDefined(SettingsManager.global.last_active_chat) && typeof SettingsManager.global.last_active_chat === 'number') {
                        that.setDirectoryChat(ettingsManager.module.last_active_chat, SettingsManager.global.is_open);
                    } else {
                        $scope.setDirectoryChat(0, SettingsManager.global.is_open);
                    }
                }
            } else {
                if (angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_mandatory_chat_index.$value === 'string') {
                    init_tab = $scope.last_mandatory_chat_index.$value + '_link';
                } else {
                    init_tab = 'contacts_link';
                }
                if (init_tab && SettingsManager.global.is_open) {
                    $timeout(function() {
                        if (document.getElementById(init_tab)) {
                            document.getElementById(init_tab).click();
                        }
                    });
                }


            }
            that.clearMandatoryList();
            that.setLayout();
            that.module.marker.is_page_loaded = true;
        }
        $log.debug('finished $scope.establishLayout()');
    };

    this.toggleMainPanelMenu = function(menu, value) {
        if (that.module.menu && angular.isDefined(that.module.menu[menu])) {
            if (that.module.current.contact.chat && that.module.current.contact.chat.menu) {
                angular.forEach(that.module.current.contact.chat.menu, function(value, key) {
                    that.module.current.contact.chat.menu[key] = false;
                });
            }
            if (that.module.current.directory.chat && that.module.current.directory.chat.menu) {
                angular.forEach(that.module.current.directory.chat.menu, function(value, key) {
                    that.module.current.directory.chat.menu[key] = false;
                });
            }

            angular.forEach(that.module.menu, function(value, key) {
                if (key != menu) {
                    that.module.menu[key] = false;
                }
            });
            if (angular.isDefined(value)) {
                that.module.menu[menu] = value;
            } else {
                that.module.menu[menu] = !that.module.menu[menu];
            }
        } else {
            angular.forEach(that.module.menu, function(value, key) {
                that.module.menu[key] = false;
            });
        }
    };

    this.toggleChatMenu = function(type, session_key, menu, value) {
        angular.forEach(that.module.menu, function(value, key) {
            that.module.menu[key] = false;
        });
        ChatManager.toggleChatMenu(type, session_key, menu, value);
    };
    this.toggleContactListShowOffline = function(value) {
        $rootScope.$evalAsync(function() {
            that.module.menu.filter = false;
            if (angular.isDefined(value)) {
                that.module.contact_list.setting.show_offline = value;
            } else {
                that.module.contact_list.setting.show_offline = !that.module.contact_list.setting.show_offline;
            }
        });
    };

    this.setChatTag = function(type, session_key) {
        ChatManager.addChatTag(type, session_key);
    };

    this.removeChatTag = function(type, session_key) {
        ChatManager.removeChatTag(type, session_key);
    };

    this.setChatTopic = function(type, session_key) {
        ChatManager.addChatTopic(type, session_key);
    };

    this.updateChatTopic = function(type, session_key) {
        ChatManager.updateChatTopic(type, session_key);
    };

    this.removeChatTopic = function(type, session_key) {
        ChatManager.removeChatTopic(type, session_key);
    };

    this.resetDirectoryChatListFocusSettings = function() {
        angular.forEach(ChatStorage.directory.chat.list, function(directory_chat) {
            ChatManager.resetCommonFocusSettings(directory_chat.type, directory_chat.session_key);
        });
    };

    this.closeChatModule = function() {
        that.resetDirectoryChatListFocusSettings();
        $rootScope.$evalAsync(function() {
            that.module.state.is_closing = true;
        });
        $timeout(function() {
            that.module.state.is_open = false;
            that.module.state.is_closing = false;
        }, 1000);
        SettingsManager.updateGlobalSetting('is_open', false, true);
    };

    this.openChatModule = function() {
        that.module.state.is_closing = false;
        that.module.state.is_locked = true;
        $rootScope.$evalAsync(function() {
            that.module.state.is_opening = true;
            that.module.state.is_open = true;
        });
        $timeout(function() {
            $rootScope.$evalAsync(function() {
                that.module.state.is_opening = false;
                that.setModuleLayout(SettingsManager.global.layout || 1);
            });
        }, 1000);
        SettingsManager.updateGlobalSetting('is_open', true, true);
        that.clearBrowserNotificationList();
        $timeout(function() {
            UxManager.ux.fx.evaluateChatModuleLayout();
        });
    };


    this.evaluateChatModuleLayout = function() {
        console.log('layout', SettingsManager.global.layout)
        if (SettingsManager.global.last_panel_tab && that.module.tab.current.index_position != SettingsManager.global.last_panel_tab) {
            that.setMainPanelTab(SettingsManager.global.last_panel_tab);
        }
        if (SettingsManager.global.layout === 1) {

        }
        if (SettingsManager.global.layout === 2) {
            if (!that.module.current.contact.session_key) {
                if (SettingsManager.global.last_contact_chat) {
                    console.log('SettingsManager.global.last_contact_chat', SettingsManager.global.last_contact_chat);
                    that.setChatAsCurrent('contact', SettingsManager.global.last_contact_chat);
                } else {
                    that.setChatAsCurrent('contact', that.module.chats.contact.chat.order_map[0]);
                }
            }
            if (that.module.tab.current.index_position === 3) {
                that.setMainPanelTab(0);
            }
        }
        $timeout(function() {
            UxManager.ux.fx.evaluateChatModuleLayout();
        });
    }

    this.setModuleLayout = function(value) {
        if (angular.isNumber(value) && SettingsManager.global.layout != value) {
            that.toggleMainPanelMenu('settings', false);
            SettingsManager.updateGlobalSetting('layout', value, true);
            $timeout(function() {
                that.evaluateChatModuleLayout();
            });
        }
    };

    this.openOverFlowContactChat = function(index, max_count_index) {
        // that.module.marker.tmp_chat = chat;
        // $scope.unactiveChats[index] = $scope.activeChats[max_count_index + ($scope.activeChats.length - (max_count_index + 1) - index)] = $scope.activeChats[max_count_index];
        // $scope.activeChats[max_count_index] = $scope.temp_chat;
        // $scope.activeChats[max_count_index].isopen = true;
        // $scope.activeChats[max_count_index].isTextFocus = true;
        // $scope.activeChats[max_count_index].unread = 0;
        // $scope.activeChats[max_count_index].header_color = ChatManager._header_color;
        // ChatManager.__setLastPushed($scope.activeChats[max_count_index].to_user_id || $scope.activeChats[max_count_index].session_key);
        // $scope.temp_chat = null;
        // SessionsManager.setContactChatsSessionPriority();
    };
    this.setNewChatMessageAlert = function(type, session_key, internal, message) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (SettingsManager.global.is_external_window && !CoreConfig.module.setting.is_external_window_instance) {
                return false;
            }
            var el = ChatManager.isChatScrollAtBottom(type, session_key);
            if (internal) {
                if (ChatStorage[type].chat.list[session_key].session.is_open === true || that.module.current.session_key === session_key) {
                    if (ChatStorage[type].chat.list[session_key].session.is_sound === true) {
                        $timeout(function() {
                            NotificationManager.playSound('close'); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                        }, 50);
                        if (el) {
                            $timeout(function() {
                                el.scrollTop = el.scrollHeight;
                            }, 500);
                        }
                        return;
                    }
                }
            } else {
                if (!SettingsManager.global.is_external_window) {
                    if (ChatStorage[type].chat.list[session_key].session.is_sound === true) {
                        NotificationManager.playSound('new_chat'); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                    }
                    if (!SettingsManager.global.is_window_visible) {
                        if (SettingsManager.global.show_external_notifications && message) {
                            that.sendChatMessageAsBrowserNotification(type, session, message, null);
                        }
                        that.module.window.attr.unread++;
                        document.title = that.module.window.setting.default_window_title + ' - ' + that.module.window.attr.unread + ' New';

                    }
                    if (SettingsManager.global.layout !== 2) {
                        if (SettingsManager.global.is_open === false) {
                            that.module.state.alert_to_open = true;
                        }

                        if (that.module.current.session_key != session_key) {
                            ChatStorage[type].chat.list[session_key].ux.unread++;
                            ChatStorage[type].chat.list[session_key].attr.is_new_message = true;
                            that.module.attr.last_unread_chat = session_key;
                        }
                        if (that.module.priority.queue.indexOf(index) === -1) {
                            that.module.priority.queue.unshift(index);
                        }
                    } else if (SettingsManager.global.layout === 2) {
                        if (ChatStorage[type].chat.list[session_key].order >= that.module.setting.start_overlow_count || ChatStorage[type].chat.list[session_key].session.is_open === false || ChatStorage[type].chat.list[session_key].attr.is_text_focus === false) {
                            ChatStorage[type].chat.list[session_key].ux.unread++;
                            if (ChatStorage[type].chat.list[session_key].session.is_open === false) {
                                ChatStorage[type].chat.list[session_key].header_color = that.module.setting.closed_header_alert_color;
                            } else if (ChatStorage[type].chat.list[session_key].attr.is_text_focus === false) {
                                ChatStorage[type].chat.list[session_key].header_color = that.module.setting.open_header_alert_color;
                            }
                            ChatStorage[type].chat.list[session_key].attr.is_new_message = true;
                            if (that.module.priority.queue.indexOf(index) === -1) {
                                that.module.priority.queue.unshift(index);
                            }
                            that.module.attr.last_unread_chat = session_key;
                        }
                    }
                } else if (SettingsManager.global.is_external_window && CoreConfig.module.setting.is_external_window_instance) {
                    if (ChatStorage[type].chat.list[session_key].session.is_sound === true) {
                        NotificationManager.playSound('new_chat'); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                    }
                    if (SettingsManager.global.show_external_notifications && message) {
                        that.sendChatMessageAsBrowserNotification(type, session, message, null);
                    }
                    if (SettingsManager.global.layout !== 2) {
                        if (SettingsManager.global.is_open === false) {
                            that.module.state.alert_to_open = true;
                        }
                        if (that.module.current.session_key != session_key) {
                            ChatStorage[type].chat.list[session_key].ux.unread++;
                            ChatStorage[type].chat.list[session_key].attr.is_new_message = true;
                            that.module.attr.last_unread_chat = session_key;
                        }
                        if (that.module.priority.queue.indexOf(index) === -1) {
                            that.module.priority.queue.unshift(index);
                        }
                    }
                    if (el) {
                        $timeout(function() {
                            el.scrollTop = el.scrollHeight;
                        }, 500);
                    }
                }

                return;
            }
        }
    };
    this.setNextContactChatIntoFocus = function(session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (ChatStorage.contact.chat.list[session_key]) {
                var next_session_index;
                var next_session_key;
                ChatManager.resetCommonFocusSettings('contact', session_key);
                if (that.module.priority.queue.length > 0) {
                    next_session_key = that.module.priority.queue.pop();
                    $log.debug('next_session_key from priority is ' + next_session_key);
                } else {
                    var contact_chat_count = Object.size(ChatStorage.contact.chat.list);
                    var current_chat_order = ChatStorage.contact.chat.order_map[ChatStorage.contact.chat.list[session_key].order];
                    next_session_order = current_chat_order + 1;
                    if (next_session_order > contact_chat_count - 1) {
                        next_session_order = 0;
                    }
                    next_session_key = ChatStorage.contact.chat.order_map[next_session_order];
                }
                $log.debug('next_session_key  is ' + next_session_key);
                that.setChatAsCurrent('contact', next_session_key);
                return;
            }
        }
    };

    this.setChatAsCurrent = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (type === 'directory' && that.module.current.directory.session_key != session_key) {
                if (false && ChatStorage[type].chat.list[session_key].messages.list.length > CoreConfig.module.setting.max_message_count) {
                    var i = 0;
                    ChatStorage[type].chat.list[session_key].messages.list = ChatStorage[type].chat.list[session_key].messages.list.slice(-(CoreConfig.module.setting.max_message_count));
                    ChatStorage[type].chat.list[session_key].priority.next = ChatStorage[type].chat.list[session_key].messages.list[ChatStorage[type].chat.list[session_key].messages.list.length - 1].priority + 1;
                    ChatStorage[type].chat.list[session_key].priority.first = ChatStorage[type].chat.list[session_key].messages.list[0].priority;
                    while (!ChatStorage[type].chat.list[session_key].priority.first) {
                        i++;
                        ChatStorage[type].chat.list[session_key].priority.first = chat.group_chats[i].priority;
                    }
                }
                if (that.module.current.directory.session_key) {
                    ChatStorage.directory.chat.list[that.module.current.directory.session_key].attr.is_active = false;
                }
                UxManager.ux.fx.setMessagesInit(type, session_key);
                that.module.current.directory.session_key = session_key;
                that.module.current.directory.stored_session_key = session_key;
                ChatStorage.directory.chat.list[session_key].attr.is_active = true;
                ChatStorage.directory.chat.list[session_key].ux.unread = 0;
                that.module.current.directory.chat = ChatStorage.directory.chat.list[session_key];
                ChatManager.resetCommonDefaultSettings(type, session_key);
                $timeout(function() {
                    UxManager.ux.fx.evaluateChatModuleLayout();
                    ChatManager.scrollChatToBottom(type, session_key);
                }, 250);
            }
            if (type === 'contact' && that.module.current.contact.session_key != session_key) {
                if (that.module.current.contact.session_key) {
                    ChatStorage.contact.chat.list[that.module.current.contact.session_key].attr.is_active = false;
                }
                UxManager.ux.fx.setMessagesInit(type, session_key);
                that.module.current.contact.session_key = session_key;
                that.module.current.contact.stored_session_key = session_key;
                ChatStorage[type].chat.list[session_key].attr.is_active = true;
                ChatStorage[type].chat.list[session_key].ux.unread = 0;
                ChatStorage[type].chat.list[session_key].session.last_read_priority = ChatStorage[type].chat.list[session_key].priority.next - 1;
                that.module.current.contact.chat = ChatStorage[type].chat.list[session_key];
                console.log(that.module.current.contact)

                SettingsManager.updateGlobalSetting('last_contact_chat', session_key, true);
                if (!ChatStorage[type].chat.list[session_key].session.active) {
                    ChatStorage[type].chat.list[session_key].session.active = true;
                    SessionsManager.setContactChatOrderMap();
                }
                $timeout(function() {
                    UxManager.ux.fx.evaluateChatModuleLayout();
                    ChatManager.scrollChatToBottom(type, session_key);
                }, 250);
            }


        }
    };


    this.setPanelContactListIntoFocus = function() {
        that.resetDirectoryChatListFocusSettings();
        if (SettingsManager.global.layout != 2) {
            if (that.module.current.contact.session_key) {
                ChatManager.resetCommonFocusSettings('contact', that.module.current.contact.session_key);
            }
        }
        that.module.current.directory.session_key = undefined;
        if (that.module.global.layout == 1) {
            that.module.current.contact.session_key = undefined;
        }

        SettingsManager.updateGlobalSetting('last_panel_tab', CoreConfig.module.tab.map['contacts'], true);

        $timeout(function() {
            that.module.contact_list.is_text_focus = true;
        }, 250);

    };
    this.getUserPermissionForBrowserNotifications = function() {
        Notification.requestPermission();
    };
    this.sendChatMessage = function(type, session_key, media) {
        if (!media) {
            ChatManager.sendChatMessage(type, session_key);
        } else {
            if (media === 'audio') {

            } else if (media === 'image') {

            } else if (media === 'video') {

            }
        }
    };

    this.showChatThatUserIsTyping = function(type, session_key) {
        ChatManager.showChatThatUserIsTyping(type, session_key);
    };

    this.sendChatMessageAsBrowserNotification = function(type, session_key, message, heading) {
        var title;
        if (heading) {
            if (BrowserService.platform.browser === "Firefox") {
                title = message.authorName + '   ' + heading;
            } else {
                title = heading + '\n' + message.authorName;
            }

        } else {
            title = message.authorName;
        }
        var notification = new Notification(title, {
            tag: message.session_key,
            icon: '/components/com_callcenter/images/avatars/' + ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + message.author]].avatar + '-90.jpg',
            body: message.text
        });
        notification.onclick = function() {
            if (SettingsManager.global.is_window_visible) {
                self.focus();
                that.setChatAsCurrent(type, session_key);
                if (that.module.tab.map[session_key]) {
                    that.setPanelTab(session_key);
                } else {
                    that.setPanelTab(that.module.tab.map.contact);
                }
                if (!SettingsManager.global.is_open) {
                    that.openChatModule();
                }
            }
        };
        that.module.browser.notifications.list.push(notification);
    };

    this.clearBrowserNotificationList = function() {
        angular.forEach(this.module.browser.notification.list, function(notification) {
            notification.close();
        });
        that.module.browser.notification.list = [];
    };

    this.sendUserBrowserNotification = function(title, tag, icon, body) {
        var notification = new Notification(title, {
            tag: tag,
            icon: icon,
            body: body
        });
    };

    this.unsetPanelContactListFocus = function() {
        if (that.module.global.layout == 1) {
            that.module.contact_list.search_text = '';
            that.module.contact_list.filtered = [];
            that.module.contact_list.is_text_focus = false;
        }

    };

    this.unsetModuleCurrentChats = function() {
        if (SettingsManager.global.layout === 1) {
            if (that.module.current.directory.chat && that.module.current.directory.chat.attr && that.module.current.directory.chat.attr.is_active) {
                that.module.current.directory.chat.attr.is_active = false
            }
            that.module.current.directory.chat = {};
            that.module.current.directory.stored_session_key = null;
            that.module.current.directory.session_key = undefined;

            if (that.module.current.contact.chat && that.module.current.contact.chat.attr && that.module.current.contact.chat.attr.is_active) {
                that.module.current.contact.chat.attr.is_active = false
            }
            that.module.current.contact.chat = {};
            that.module.current.contact.session_key = undefined;
            that.module.current.contact.stored_session_key = undefined;
        }

    };

    this.isCurrentDirectoryChat = function(session_key) {
        if (that.module.current.directory.session_key && that.module.current.directory.session_key === session_key) {
            return true;
        }
        return false;
    };

    this.isLastUnread = function(session_key) {
        if (this.module.attr.last_unread_chat && this.module.attr.last_unread_chat === session_key) {
            return true;
        }
        return false;
    };





    this.setNextPanelTab = function() {
        var next_tab = that.module.tab.current.order + 1;
        if (Object.size(ChatStorage.contact.chat.list) > 0 && SettingsManager.global.layout === 1) {
            if (next_tab >= that.module.tab.list.length - 1) {
                next_tab = 0;
            }
        } else {
            if (next_tab >= that.module.tab.list.length - 2) {
                next_tab = 0;
            }
        }
        that.setMainPanelTab(next_tab);
    };

    this.setMainPanelTab = function(tab_index_position) {
        if (parseInt(tab_index_position, 10) > -1 && that.module.tab.current.index_position != tab_index_position) {
            that.unsetModuleCurrentChats();
            that.module.tab.current = that.module.tab.list[tab_index_position];
            if (that.module.tab.current.type === 'contact') {
                that.module.tab.current.session_key = that.module.current.contact.session_key;
            }
            if (that.module.tab.current.session_key === 'contacts') {
                that.setPanelContactListIntoFocus();
            } else {
                that.unsetPanelContactListFocus();
                if (that.module.tab.current.session_key) {
                    that.setChatAsCurrent(that.module.tab.current.type, that.module.tab.current.session_key);
                }
            }
            $timeout(function() {
                SettingsManager.updateGlobalSetting('last_panel_tab', tab_index_position, true);
                UxManager.ux.fx.evaluateChatModuleLayout();
            }, 500);
        }
    };

    this.swapChatPositions = function(index_a, index_b) {
        if (index_b >= $scope.activeChats.length) {
            index_b = $scope.activeChats.length - 1;
        } else if (index_b < 0) {
            index_b = 0;
        }
        if (index_a === index_b) return false;
        $scope.temp_chat = $scope.activeChats[index_a];
        $scope.activeChats[index_a] = $scope.activeChats[index_b];
        $scope.activeChats[index_b] = $scope.temp_chat;
        $scope.temp_chat = null;
        $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
        $scope.resetChatUnread();
        SessionsManager.setContactChatsSessionPriority();
        /*      ChatManager.__setLastPushed($scope.activeChats[index_b].to_user_id || $scope.activeChats[index_b].session_key); */

    };

    this.moveContactChatToLast = function(index) {
        if (ChatStorage.contact.chat.order_map[index]) {
            $scope.activeChats.splice(index, 1);
            $scope.activeChats.push($scope.temp_chat);
            $scope.temp_chat = null;
            $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
            $scope.resetChatUnread();
            SessionsManager.setContactChatsSessionPriority();
        }
    };

    this.moveContactChatToFirst = function(index) {
        $scope.temp_chat = $scope.activeChats[index];
        $scope.activeChats.splice(index, 1);
        $scope.activeChats.unshift($scope.temp_chat);
        $scope.temp_chat = null;
        SessionsManager.setContactChatsSessionPriority();
        /*      ChatManager.__setLastPushed($scope.activeChats[0].to_user_id || $scope.activeChats[0].session_key); */
    };

    this.setContactChatsSessionPriority = function() {
        SessionsManager.setContactChatsSessionPriority();
    };

    this.resetAllContactChatUnread = function() {
        // var i = ChatStorage.contact.chat.list.activeChats.length;
        // while (i--) {
        //     if ($scope.activeChats[i].isopen && i < $scope.max_count) {
        //         $scope.activeChats[i].header_color = ChatManager._header_color;
        //         $scope.activeChats[i].unread = 0;
        //     }
        // }
        angular.forEach(ChatStorage.contact.chat.list, function(contact_chat) {
            contact_chat.header_color = CoreConfig.chat.ui.header_color;
            contact_chat.unread = 0;
        });
    };
    this.loadPreviousChatMessages = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isUndefined(ChatStorage[type].chat.list[session_key].prioity.first) || ChatStorage[type].chat.list[session_key].prioity.first === 0 || !(ChatStorage[type].chat.list[session_key].attr.is_previous_messages)) {
                ChatStorage[type].chat.list[session_key].attr.is_previous_messages = false;
                return false;
            }
            if (!(ChatStorage[type].chat.list[session_key].attr.is_reloading) && ChatStorage[type].chat.list[session_key].attr.is_previous_messages === true) {
                ChatStorage[type].chat.list[session_key].scroll.to_top = false;
                ChatManager.fetchPreviousChatMessages(type, session_key);
                $timeout(function() {
                    ChatStorage[type].chat.list[session_key].scroll.to_bottom = false;
                    ChatStorage[type].chat.list[session_key].scroll.to_top = true;
                });
            }
        }
    };


    this.addReferenceToChatMessage = function(type, session_key, message) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatManager.addReferenceToChatMessage(type, session_key, message);
        }
    };

    this.clearChatMessageHistory = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatManager.clearChatMessageHistory(type, session_key);
        }
    };

    this.isChatScrollAtBottom = function(type, session_key) {
        return ChatManager.isChatScrollAtBottom(type, session_key);
    };

    this.toggleChatSound = function(type, session_key) {
        ChatManager.toggleChatSound(type, session_key);
    };

    this.deactivateChat = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            that.module.current[type].chat = {};
            that.module.current[type].session_key = undefined;
            ChatStorage[type].chat.list[session_key].attr.active = false;
            ChatStorage[type].chat.list[session_key].session.active = false;

            var count = ChatStorage[type].chat.count;
            var current_order_position = ChatStorage[type].chat.list[session_key].session.order;
            while (count--) {
                if (count > current_order_position && ChatStorage[type].chat.order_map[count] && ChatStorage[type].chat.list[ChatStorage[type].chat.order_map[count]] && ChatStorage[type].chat.list[ChatStorage[type].chat.order_map[count]].session.active) {
                    ChatStorage[type].chat.list[ChatStorage[type].chat.order_map[count]].session.order--;
                }
            }

            ChatStorage[type].chat.list[session_key].session.order = -1
            delete ChatStorage[type].chat.order_map[current_order_position];
            SessionsManager.setContactChatOrderMap();
            that.module.current[type].chat = null;
            that.module.current[type].session_key = null;
            if (type === 'contact' && SettingsManager.global.layout === 2) {
                // if (that.module.chats.contact.chat.order_map[0]) {
                //     that.setChatAsCurrent('contact', that.module.chats.contact.chat.order_map[0]);
                // } else {
                //     that.setModuleLayout(1);
                // }

            }
            $timeout(function() {
                UxManager.ux.fx.evaluateChatModuleLayout();
            });

        }
    };
    this.removeContactFromChat = function(type, session_key, contact_id) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isDefined(ChatStorage[type].chat.list[session_key].contacts.active[contact_id])) {
                console.log('here 2')
                SessionsManager.sendChatExitSignal(type, session_key, contact_id);
            }
        }
    };
    this.leaveChat = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            that.toggleChatMenu(type, session_key, 'settings', false);
            if (ChatStorage[type].chat.list[session_key].session.is_directory_chat) {
                if (SettingsManager.global.layout === 1) {
                    that.setMainPanelTab(3);
                }
                if (SettingsManager.global.layout === 2) {
                    that.setMainPanelTab(0);
                }

                return;
            }
            that.deactivateChat(type, session_key);
            SessionsManager.closeChatSession(type, session_key);
        }
    };

    this.removeChat = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            var delay = 0;
            that.module.attr.last_removed_chat = session_key;
            if (angular.equals(that.module.attr.last_requested_chat, session_key)) {
                that.module.attr.last_requested_chat = null;
            }
            if (angular.equals(that.module.attr.last_query_location, session_key)) {
                that.module.attr.last_query_location = null;
            }
            if (angular.equals(scope.requested_chat, chat.session_key) || angular.equals(scope.requested_chat, chat.to_user_id)) {
                scope.requested_chat = '';
            }
            if (angular.isDefined(chat.close_invite)) {
                clearInterval(chat.close_invite);
            }

            SessionsManager.removeChatSession(type, session_key, true, true);
            ChatStorage[type].chat.list[session_key] = null;
            delete ChatStorage[type].chat.list[session_key];

            NotificationManager.playSound('close');
            that.evaluateChatModuleLayout();
        }
    };

    this.inviteIntoChat = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (ChatStorage[type].chat.list[session_key].session.is_group_chat === false) {
                that.toggleChatMenu(type, session_key, 'invite', false);

                if (ChatStorage[type].chat.list[session_key].invite.contact_list.indexOf(ChatStorage[type].chat.list[session_key].contact.profile.user_id == -1)) {
                    ChatStorage[type].chat.list[session_key].invite.contact_list.push(ChatStorage[type].chat.list[session_key].contact.profile.user_id);
                }

                var config = {};
                config.name = 'Group Chat';
                config.topic = ChatStorage[type].chat.list[session_key].invite.topic || null;
                config.active = true;
                config.type = 'contact'
                config.session_key = SessionsManager.getNewGroupChatSessionKey(ChatStorage[type].chat.list[session_key].invite);
                if (angular.copy(ChatStorage[type].chat.list[session_key].invite.admin)) {
                    config.admin = UserManager.user.profile.id;
                } else {
                    config.admin = false;
                }
                if (config.session_key) {
                    var signal = {
                        type: 'group',
                        admin: config.admin,
                        session_key: config.session_key,

                        priority: 0
                    };
                    angular.forEach(ChatStorage[type].chat.list[session_key].invite.contact_list, function(contact_id) {
                        SessionsManager.sendChatInviteSignal(contact_id, signal);
                    });
                    $rootScope.$evalAsync(function() {
                        ChatStorage[type].chat.list[session_key].invite.admin = false;
                        ChatStorage[type].chat.list[session_key].invite.add_topic = false;
                        ChatStorage[type].chat.list[session_key].invite.topic = null;
                        ChatStorage[type].chat.list[session_key].invite.contact_list = [];
                        ChatStorage[type].chat.list[session_key].invite.contact_id = '';

                        ChatBuilder.buildChatForSession(that.getContactGroupChatSessionDetails(config));
                        that.deactivateChat(type, session_key);
                        that.setChatAsCurrent(config.type, config.session_key);
                    });
                }

            } else {
                $rootScope.$evalAsync(function() {
                    that.toggleChatMenu(type, session_key, 'invite', false);
                    var signal = {
                        type: 'group',
                        admin: ChatStorage[type].chat.list[session_key].session.admin,
                        session_key: ChatStorage[type].chat.list[session_key].session.session_key,
                        topic: ChatStorage[type].chat.list[session_key].session.topic,
                        priority: ChatStorage[type].chat.list[session_key].priority.next
                    };
                    angular.forEach(ChatStorage[type].chat.list[session_key].invite.contact_list, function(contact_id) {
                        if (!ChatStorage[type].chat.list[session_key].contacts.active[contact_id]) {
                            ChatStorage[type].session.list[session_key].fb.group.location.contacts.child(contact_id).set(ChatStorage[type].chat.list[session_key].session.start_at_priority);
                            SessionsManager.sendChatInviteSignal(contact_id, signal);
                        }

                    });
                    ChatStorage[type].chat.list[session_key].invite.admin = false;
                    ChatStorage[type].chat.list[session_key].invite.add_topic = false;
                    ChatStorage[type].chat.list[session_key].invite.topic = null;
                    ChatStorage[type].chat.list[session_key].invite.contact_list = [];
                    ChatStorage[type].chat.list[session_key].invite.contact_id = '';
                });
            }
        }
    };

    this.setActiveContactChatMap = function() {
        ChatStorage.contact.chat.map = {};
        angular.forEach(ChatStorage.contact.chat.list, function(contact_chat) {
            if (contact_chat.session.active) {
                ChatStorage.contact.chat.map[contact_chat.session.session_key] = contact_chat.session.order;
            }
        });

    };


    this.showInGeneralPanelContactList = function(contact) { // this function will determine the client has filtered the user out of the general directory user list
        if (angular.isDefined(UserManager.user.group) && UserManager.user.group.indexOf(CoreConfig.common.reference.user_prefix + contact.user_id) > -1) {
            return false;
        }
        if (contact.user_id === ContactsManager.smod.id || contact.user_id === ContactsManager.tod.id) {
            return false;
        }
        if (!that.module.contact_list.setting.show_offline) {
            if (user.state === "Offline") {
                return false;
            }
        }
        return true;
    };



    this.isSessionLastRequested = function(session_key) {
        return session_key === that.module.attr.last_requested_chat;
    };

    this.isSessionLastRemoved = function(session_key) {
        return session_key === that.module.attr.last_removed_chat;
    };


    return this;

}]);
