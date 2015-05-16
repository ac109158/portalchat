angular.module('portalchat.core').
service('ChatModuleManager', ['$rootScope', '$log', '$timeout', 'CoreConfig', 'UserManager', 'SettingsManager', 'SessionsManager', 'ChatStorage', 'ChatBuilder', 'ChatManager', 'GroupChatManager', 'DirectoryChatManager', 'UtilityManager', 'BrowserService', 'localStorageService', function($rootScope, $log, $timeout, CoreConfig, UserManager, SettingsManager, SessionsManager, ChatStorage, ChatBuilder, ChatManager, GroupChatManager, DirectoryChatManager, UtilityManager, BrowserService, localStorageService) {
    var that = this;
    this.fb = {};
    this.fb.chat = {};
    this.fb.chat.location = {};
    this.fb.chat.targets = {};

    this.fb.group_chat = {};
    this.fb.group_chat.location = {};
    this.fb.group_chat.targets = {};

    this.module = {};

    this.module.state = {};
    this.module.state.alert_to_open = false;
    this.module.state.is_locked = false;
    this.module.state.is_open = false;
    this.module.state.is_opening = false;
    this.module.state.is_closing = false;
    this.module.state.is_setting_layout = false;
    this.module.state.is_external_window = undefined;
    this.module.state.is_external_window_instance = undefined;
    this.module.state.allow_chat_request = true;



    this.module.contacts = {};
    this.module.contacts.search = {};
    this.module.contacts.search_text = '';
    this.module.contacts.filtered = [];
    this.module.contacts.is_text_focus = false;
    this.module.contacts.setting = {};
    this.module.contacts.setting.show_offline = false;

    that.module.session = {};
    that.module.session.id = '';

    this.module.priority = {};
    this.module.priority.queue = [];

    this.module.presence = {};
    this.module.presence.states = CoreConfig.module.presence.states;

    this.module.notification = {};
    this.module.notification.list = [];


    this.module.tab = {};
    this.module.tab.list = CoreConfig.module.tab.list;
    this.module.tab.current = CoreConfig.module.tab.list[0];


    this.module.referenced = {};
    this.module.referenced.priority = null;
    this.module.referenced.display_id = null;
    this.module.referenced.message_id = null;

    this.module.config = {};
    this.module.config.directory = {};
    this.module.config.directory.models = ['chat_reference', 'chat_description', 'admin', 'mandatory', 'watch_users', 'store_length'];
    this.module.config.directory.default_chats = [];

    this.module.setting = CoreConfig.module.setting;

    this.module.attr = {};
    this.module.attr.total_unread_messages = 0;
    this.module.attr.tmp = 1;
    this.module.attr.tmp_chat = '';
    this.module.attr.updated_text = '';
    this.module.attr.is_referencing = false;
    this.module.attr.is_page_loaded = false;
    this.module.attr.is_chat_ping = false;
    this.module.attr.is_child_window = false;
    this.module.attr.is_child_window_instance = undefined;
    this.module.attr.lact_active_chat = undefined;
    this.module.attr.last_unread_chat = null;
    this.module.attr.last_removed_chat = undefined;
    this.module.attr.last_requested_chat = undefined;
    this.module.attr.last_query_location = undefined;

    this.module.current = {};
    this.module.current.session_key = null;

    this.module.current.directory = {};
    this.module.current.directory.chat = {};
    this.module.current.directory.chat.stored_session_key = null;
    this.module.current.directory.chat.session_key = undefined;

    this.module.current.directory.chat.setting = {};
    this.module.current.directory.chat.setting.default_index = 'contacts';
    this.module.current.directory.chat.setting.allow_host_ping = true;


    this.module.current.contact = {};
    this.module.current.contact.chat = {};
    this.module.current.contact.chat.session_key = undefined;
    this.module.current.contact.chat.stored_session_key = undefined;
    this.module.current.contact.chat.active = undefined;
    this.module.current.contact.chat.current_request = '';
    this.module.current.contact.chat.temp = '';
    this.module.current.contact.chat.unactive = {};
    // this.module.current.contact.chat.unactive.list = ChatStorage.contact.chat.list.slice(that.contact.chat.max_count).reverse();
    this.module.current.contact.chat.unactive.show = true;
    this.module.current.contact.chat.unactive.count = 0;
    this.module.current.contact.is_invite = undefined;

    this.module.current.contact.chat.setting = {};
    this.module.current.contact.chat.setting.allow_host_ping = true;
    this.module.current.contact.chat.setting.start_overlow_count = 6;



    this.module.menu = {};
    this.module.menu.directory_chat_list = false;

    this.load = function() {
        that.initSessionVar();
        that.setFirebaseLocations();
        that.setFirebaseTargets();
        that.establishUserChat();
        // that.setDefaultDirectoryChats();
    };

    this.initSessionVar = function() {
        if (localStorageService.get('is_existing_chat')) {
            $log.debug('need to Destroy Chat');
            // var current = window.open('','_self');

            // $timeout(function(){
            //     current.close();
            //     self.close(); 
            //     window.close();
            // }, 500)

        } else {
            localStorageService.add('is_existing_chat', (Math.random() + 1).toString(36).substring(7));
            that.module.session.id = localStorageService.get('isExistingChat');
            $log.debug(' that.module.session.id set to ' + that.module.session.id);
        }
    };

    this.setFirebaseLocations = function() {
        if (UserManager.user.id) {
            console.log(CoreConfig.chat.url_root + CoreConfig.user.id + '/' + CoreConfig.session.root_reference);
            that.fb.chat.location.sessions = new Firebase(CoreConfig.chat.url_root + CoreConfig.user.id + '/' + CoreConfig.session.root_reference);
        }
    };

    this.setFirebaseTargets = function() {
        if (UserManager.user.id) {}
    };

    this.establishUserChat = function() { //  Step 1 this function will initialize the that variables and set the user chat presence.
        if (CoreConfig.user && CoreConfig.user.id) {
            ChatStorage.contact.session.list = [];
            ChatStorage.contact.session.map = {};
            // look at the active session folder of the user, and create chatSession for an calling card objects present
        }
        $log.debug('Finished that.establishUserChat');
        return true;
    };

    this.registerChatRequest = function(session, isfocus) {
        if (session && angular.isObject(session)) {
            var index;
            $log.debug('Requesting chat session');
            if (!(UtilityManager.engine.firebase.online)) {
                $log.debug('Request Denied: Firebase is Offline');
                return false;
            } else if (that.contact.marker.last_requested_chat === session.user_id || that.contact.marker.last_requested_chat === session.session_key) {
                $log.debug('This appears to be a duplicate rquest, return false'); /*           console.log('requested: ' + that.last_requested_chat + ' session.user_id: ' + session.user_id); */
                that.contact.marker.last_requested_chat = false;
                return false;
            }
            if (angular.isDefined(session.session_key) && angular.isDefined(session.groupChat) && session.groupChat === true) {
                that.contact.marker.last_requested_chat = session.session_key;
                if (angular.isDefined(ChatStorage.contact.chat.map[session.session_key])) {
                    $log.debug('Chat is already in chat list');
                    if (SettingsManager.module.layout != 2) {
                        that.setDirectoryChat(ChatStorage.contact.chat.map[session.session_key], true);
                    } else {
                        ChatStorage.contact.chat.list[ChatStorage.contact.chat.map[session.session_key]].is_open = true;
                        ChatStorage.contact.chat.list[ChatStorage.contact.chat.map[session.session_key]].is_text_focus = true;
                    }
                    return false;
                } /*            console.log('building as group chat'); */
                ChatBuilder.__buildGroupChatSession(session, session.isOpen || true, isfocus, 1); // function(that, value, isopen, isfocus)
                return true;
            } else {
                that.last_requested_chat = session.user_id;
                if (angular.isUndefined(session) || session.user_id === UserManager._user_profile.user_id) {
                    $log.debug('Chat session denied - undefined/self');
                    return false;
                } else if (angular.isDefined(session.user_id) && ChatStorage.contact.session.list['user_' + session.user_id] === true) {
                    $log.debug('This chat shows as registered');
                    var chat_log = [];
                    angular.forEach(that.active_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                        if (angular.isDefined(value.session_id)) {
                            this.push(value.session_id);
                        } else {
                            this.push(value.session_key);
                        }
                    }, chat_log);
                    index = chat_log.indexOf(session.user_id);
                    if (angular.isDefined(that.active_chats[index]) && that.active_chats[index].session_id === session.user_id) {
                        $log.debug('Chat is already in the list of active chats');
                        $log.debug(angular.toJson(chat_log));
                        if (SettingsManager.settings.layout != 2) {
                            that.safeApply(function() {
                                $timeout(function() {
                                    that.setDirectoryChat(index, true);
                                }, 50);
                            });
                        } else if (SettingsManager.settings.layout === 2 && that.active_chats[index].index_position >= that.max_count) {
                            that.swapChatPositions(that.active_chats[index].index_position, that.max_count - 1);
                            that.__setLastPushed(that.active_chats[that.max_count - 1].session_id);
                            that.active_chats[that.max_count - 1].isopen = true;
                            that.active_chats[that.max_count - 1].isTextFocus = true;
                        } else {
                            that.active_chats[index].isopen = true;
                            that.active_chats[index].isTextFocus = true;
                            that.__setLastPushed(that.active_chats[index].session_id);
                        }
                        $timeout(function() {
                            if (!(that._is_playing_sound)) {
                                NotificationService.playSound(NotificationService.sound.new_chat);
                            }
                        }, 250);
                        return true;
                    }
                    return false;
                }
                $log.debug('all checks passed, build chat');
                that.__buildChatSession(that, session, session.isOpen, isfocus, 14); // (that, contact, isopen, isfocus)
                return true;
            }
        }
        return false;
    };

    this.setDefaultDirectoryChatConfiguration = function() {
        that.module.config.directory.default_chats.push({
            chat_reference: 'sm_group_chat',
            chat_description: 'PlusOne - Group Chat',
            admin: 'smod',
            mandatory: true,
            watch_users: false,
            store_length: 1
        });
        that.module.config.directory.default_chats.push({
            chat_reference: 'sm_tech_chat',
            chat_description: 'Tech Support - Group Chat',
            admin: 'tod',
            mandatory: true,
            watch_users: false,
            store_length: 2
        });
        if (UserManager.user && UserManager.user.supervisors && UserManager.user.supervisors.mc) {
            that.module.config.directory.default_chats.push({
                chat_reference: ('mc_' + UserManager.user.supervisors.mc.user_id + '_group_chat'),
                chat_description: UserManager.user.supervisors.mc.name + ' - MC Team Chat',
                admin: UserManager.user.supervisors.mc.user_id,
                mandatory: false,
                watch_users: false,
                store_length: 3
            });
        }
    };

    this.setDefaultDirectoryChats = function() {
        that.setDefaultDirectoryChatConfiguration();
        if (that.module.config.directory.default_chats) {
            angular.forEach(that.module.config.directory.default_chats, function(config) {
                if (that.validateDirectoryChatConfiguration(config)) {
                    var new_dc = DirectoryChatManager.buildNewDirectoryChat(config);
                    new_dc.index_position = config.chat_reference;
                    that.setDefaultSettings(new_dc);
                    ChatStorage.directory.chat.map[config.chat_reference] = ChatStorage.directory.chat.list.length;
                    ChatStorage.directory.chat.list.push(new_dc);
                }
            });
        }
    };

    this.createDirectoryListChat = function(session_key) {
        $log.debug('getDirectoryChat(' + chat_name + ')');
        var type = chat_name.split('_')[0];
        $log.debug('type: ' + type);
        var id = chat_name.split('_')[1];
        $log.debug('id: ' + id);
        that.module.menu.directory_chat_list = false;
        if (ChatStorage.directory.chat.list[session_key]) {
            $log.debug(session_key + 'already exists');
            that.setChatAsCurrent('directory', session_key);
            return;
        } else {
            if (type === 'mc') {
                ChatManager.__pushChatSession(DirectoryChatManager.__buildNewDirectoryChat($scope, (chat_name), UserManager._users_profiles_obj['user_' + id].name + ' - MC Team Chat', id, false, false, 3), false, $scope); //scope, chat_reference, chat_description, admin, watch_users
            } else if (chat_name === 'admin_group_chat') {
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

    this.externalWindowchange = function(status) {
        if (status === false && that.ui.module.setting.is_external_window_instance === false) {
            if (that.externalWindowObject) {
                that.externalWindowlistener = null;
                that.externalWindowObject = null;
                that.module.marker.is_child_window = false;
                that.module.marker.is_child_window_instance = false;
            }
        }

        that.__setLastPushed('empty');
        angular.forEach(ChatStorage.contact.chat.list, function(val, key) {
            val.is_text_focus = false;
            that.resetTyping(val);
        });
    };


    this.establishChatLayout = function() {
        $log.debug('calling this.establishLayout()');
        if (SettingsManager.module.is_external_window === true && SettingsManager.module.is_external_window_instance === false) {
            return;
        }

        if (SettingsManager.module.is_external_window && SettingsManager.module.is_external_window_instance) {
            $document.documentElement.style.overflow = 'hidden'; // firefox, chrome
            $document.body.scroll = "no"; // ie only
        }
        var init_tab = 'contacts';

        if (SettingsManager.module.layout === 1 && angular.isDefined(SettingsManager.module.last_active_chat)) {
            if (typeof SettingsManager.module.lact_active_chat === 'string') {
                if (ChatStorage.contact.chat.list.length > 0) {
                    that.directory.chat.active = ChatStorage.contact.chat.list[0];
                    that.directory.chat.marker.index = 0;
                    that.directory.chat.marker.stored_index = 0;
                }
                init_tab = SettingsManager.module.lact_active_chat + '_link';

            } else {
                init_tab = 'contacts_link';
            }
            that.module.marker.is_page_loaded = true;

            if (SettingsManager.module.is_open) {
                if (angular.isDefined(SettingsManager.module.last_mandatory_chat) && typeof SettingsManager.module.last_mandatory_chat === 'string') {
                    that.setMandatoryFocus(SettingsManager.module.last_mandatory_chat);
                } else if (angular.isDefined(SettingsManager.module.last_mandatory_chat) && typeof SettingsManager.module.last_active_chat === 'number') {
                    that.setDirectoryChat(SettingsManager.module.last_active_chat, true);
                } else {
                    if (init_tab) {
                        if (document.getElementById(init_tab)) {
                            document.getElementById(init_tab).click();
                        }
                    }
                }
            } else if (SettingsManager.module.layout === 3) {
                if (angular.isUndefinedOrNull(SettingsManager.module.last_active_chat) || angular.isDefined(SettingsManager.module.last_active_chat) && typeof SettingsManager.module.last_active_chat === 'string') {
                    if (ChatStorage.contact.chat.list.length > 0) {
                        that.directory.chat.active = ChatStorage.contact.chat.list[0];
                        that.directory.chat.stored_index = that.directory.chat.index = 0;
                    }
                }
                if (angular.isDefined(SettingsManager.module.last_mandatory_chat) && typeof SettingsManager.module.last_mandatory_chat_index === 'string') {
                    init_tab = SettingsManager.module.last_mandatory_chat + '_link';
                } else {
                    init_tab = 'contacts_link';
                }
                if (ChatStorage.contact.chat.list.length > 0) {
                    if (angular.isDefined(SettingsManager.module.last_active_chat) && typeof SettingsManager.module.last_active_chat === 'number') {
                        that.setDirectoryChat(ettingsManager.module.last_active_chat, SettingsManager.module.is_open);
                    } else {
                        $scope.setDirectoryChat(0, SettingsManager.module.is_open);
                    }
                }
            } else {
                if (angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_mandatory_chat_index.$value === 'string') {
                    init_tab = $scope.last_mandatory_chat_index.$value + '_link';
                } else {
                    init_tab = 'contacts_link';
                }
                if (init_tab && SettingsManager.module.is_open) {
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

    this.setContactChatOrderMap = function() {
        ChatStorage.contact.chat.order_map = {};
        angular.forEach(ChatStorage.contact.chat.list, function(value, key) {
            ChatStorage.contact.chat.order_map[value.order] = key;
        });
    };
    this.toggleModulePanelMenu = function(menu, value) {
        if (that.module.menu && angular.isDefined(that.module.menu[menu])) {
            if (angular.isDefined(value)) {
                that.module.menu[menu] = value;
            } else {
                that.module.menu[menu] = !that.module.menu[menu];
            }
        }
    };

    this.resetDirectoryChatListFocusSettings = function() {
        angular.forEach(ChatStorage.directory.chat.list, function(directory_chat) {
            ChatManager.resetCommonFocusSettings(directory_chat.type, directory_chat.session_key);
        });
    };

    this.closeChatModule = function() {
        console.log('close');
        that.resetDirectoryChatListFocusSettings();
        $rootScope.$evalAsync(function() {
            that.module.state.is_closing = true;
        });
        $timeout(function() {
            that.module.state.is_open = false;
            that.module.state.is_closing = false;
        }, 1000);
        SettingsManager.update('is_open', false);
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
                that.setModuleLayout();
            });
        }, 1000);
        SettingsManager.update('is_open', true);
        that.clearNotificationList();
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
        // SessionManager.setContactChatsSessionPriority();
    };
    this.setNewChatMessageAlert = function(type, session_key, internal, message) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (SettingsManager.module.is_external_window && !SettingsManager.module.is_external_window_instance) {
                return false;
            }
            var el = ChatManager.isChatScrollAtBottom(type, session_key);
            if (internal) {
                if (ChatStorage[type].chat.list[session_key].attr.is_open === true || that.module.current.session_key === session_key) {
                    if (ChatStorage[type].chat.list[session_key].attr.is_sound === true) {
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
                if (!SettingsManager.module.is_external_window) {
                    if (ChatStorage[type].chat.list[session_key].attr.is_sound === true) {
                        NotificationManager.playSound('new_chat'); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                    }
                    if (!SettingsManager.module.is_window_visible) {
                        if (SettingsManager.module.show_external_notifications && message) {
                            that.sendChatMessageAsBrowserNotification(type, session, message, null);
                        }
                        that.module.attr.total_unread_messages++;
                        document.title = that.module.setting.default_page_title + ' - ' + that.module.attr.total_unread_messages + ' New';

                    }
                    if (SettingsManager.module.layout !== 2) {
                        if (SettingsManager.module.is_open === false) {
                            that.module.state.alert_to_open = true;
                        }

                        if (that.module.current.session_key != session_key) {
                            ChatStorage[type].chat.list[session_key].ux.unread++;
                            ChatStorage[type].chat.list[session_key].attr.is_new_message = true;
                            that.module.atrr.last_unread_chat = session_key;
                        }
                        if (that.module.priority.queue.indexOf(index) === -1) {
                            that.module.priority.queue.unshift(index);
                        }
                    } else if (SettingsManager.module.layout === 2) {
                        if (ChatStorage[type].chat.list[session_key].order >= that.module.current.contact.chat.setting.start_overlow_count || ChatStorage[type].chat.list[session_key].attr.is_open === false || ChatStorage[type].chat.list[session_key].attr.is_text_focus === false) {
                            ChatStorage[type].chat.list[session_key].ux.unread++;
                            if (ChatStorage[type].chat.list[session_key].attr.is_open === false) {
                                ChatStorage[type].chat.list[session_key].header_color = that.module.setting.closed_header_alert_color;
                            } else if (ChatStorage[type].chat.list[session_key].attr.is_text_focus === false) {
                                ChatStorage[type].chat.list[session_key].header_color = that.module.setting.open_header_alert_color;
                            }
                            ChatStorage[type].chat.list[session_key].attr.is_new_message = true;
                            if (that.module.priority.queue.indexOf(index) === -1) {
                                that.module.priority.queue.unshift(index);
                            }
                            that.module.atrr.last_unread_chat = session_key;
                        }
                    }
                } else if (SettingsManager.module.is_external_window && SettingsManager.module.is_external_window_instance) {
                    if (ChatStorage[type].chat.list[session_key].attr.is_sound === true) {
                        NotificationManager.playSound('new_chat'); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                    }
                    if (SettingsManager.module.show_external_notifications && message) {
                        that.sendChatMessageAsBrowserNotification(type, session, message, null);
                    }
                    if (SettingsManager.module.layout !== 2) {
                        if (SettingsManager.module.is_open === false) {
                            that.module.state.alert_to_open = true;
                        }
                        if (that.module.current.session_key != session_key) {
                            ChatStorage[type].chat.list[session_key].ux.unread++;
                            ChatStorage[type].chat.list[session_key].attr.is_new_message = true;
                            that.module.atrr.last_unread_chat = session_key;
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

    this.setChatAsCurrent = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (type === 'directory') {
                if (ChatStorage[type].chat.list[session_key].messages.list.length > CoreConfig.chat.setting.max_message_count) {
                    var i = 0;
                    ChatStorage[type].chat.list[session_key].messages.list = ChatStorage[type].chat.list[session_key].messages.list.slice(-(CoreConfig.chat.setting.max_message_count));
                    ChatStorage[type].chat.list[session_key].priority.next = ChatStorage[type].chat.list[session_key].messages.list[ChatStorage[type].chat.list[session_key].messages.list.length - 1].priority + 1;
                    ChatStorage[type].chat.list[session_key].priority.first = ChatStorage[type].chat.list[session_key].messages.list[0].priority;
                    while (!ChatStorage[type].chat.list[session_key].priority.first) {
                        i++;
                        ChatStorage[type].chat.list[session_key].priority.first = chat.group_chats[i].priority;
                    }
                }
                if (that.module.current.directory.chat.session_key) {
                    ChatStorage.contact.chat.list[that.module.current.directory.chat.session_key].attr.is_active = false;
                }
                that.module.current.directory.chat.session_key = session_key;
                that.module.current.directory.chat.stored_session_key = session_key;
                ChatStorage.directory.chat.list[session_key].attr.is_active = true;
                SettingsManager.update('last_panel_tab', session_key, true);
            }
            if (type === 'contact') {
                if (that.module.current.contact.chat.session_key) {
                    ChatStorage.contact.chat.list[that.module.current.contact.chat.session_key].attr.is_active = false;
                }
                that.module.current.contact.chat.session_key = session_key;
                that.module.current.contact.chat.stored_session_key = session_key;
                ChatStorage[type].chat.list[session_key].attr.is_active = true;
                SettingsManager.update('last_contact_chat', session_key, true);
            }
            ChatManager.resetCommonDefaultSettings(type, session_key);
            $timeout(function() {
                ChatManager.scrollChatToBottom(type, session_key);
            }, 250);
        }
    };


    this.setPanelContactListIntoFocus = function() {
        that.resetDirectoryChatListFocusSettings();
        if (SettingsManager.module.layout != 2) {
            if (that.module.current.contact.chat.session_key) {
                ChatManager.resetCommonFocusSettings('contact', that.module.current.contact.chat.session_key);
            }
        }

        that.module.current.directory.chat.session_key = undefined;
        that.module.current.contact.chat.session_key = undefined;

        SettingsManager.update('last_panel_tab', 'contacts', true);

        $timeout(function() {
            that.module.contacts.is_text_focus = true;
        }, 250);

    };
    this.getUserPermissionForBrowserNotifications = function() {
        Notification.requestPermission();
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
            icon: '/components/com_callcenter/images/avatars/' + ContactsManager.contacts.profiles['user_' + message.author].avatar + '-90.jpg',
            body: message.text
        });
        notification.onclick = function() {
            if (SettingsManager.module.is_window_visible) {
                self.focus();
                that.setChatAsCurrent(type, session_key);
                if (that.module.tab.map[session_key]) {
                    that.setPanelTab(session_key);
                } else {
                    that.setPanelTab(that.module.tab.map.contact);
                }
                if (!SettingsManager.module.is_open) {
                    that.openChatModule();
                }
            }
        };
        that.module.notifications.list.push(notification);
    };

    this.clearNotificationList = function() {
        angular.forEach(that.module.notifications.list, function(notification) {
            notification.close();
        });
        that.module.notifications.list = [];
    };

    this.sendUserBrowserNotification = function(title, tag, icon, body) {
        var notification = new Notification(title, {
            tag: tag,
            icon: icon,
            body: body
        });
    };

    this.unsetPanelContactListFocus = function() {
        that.module.contacts.search_text = '';
        that.module.contacts.filtered = [];
        that.module.contacts.is_text_focus = false;
    };

    this.isCurrentDirectoryChat = function(session_key) {
        if (that.module.current.directory.chat.session_key && that.module.current.directory.chat.session_key === session_key) {
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
        if (Object.size(ChatStorage.contact.chat.list) > 0 && SettingsManager.module.layout === 1) {
            if (next_tab >= that.module.tab.list.length - 1) {
                next_tab = 0;
            }
        } else {
            if (next_tab >= that.module.tab.list.length - 2) {
                next_tab = 0;
            }
        }
        that.setPanelTab(next_tab);
    };

    this.setPanelTab = function(tab_index_position) {
        if (parseInt(tab_index_position, 10) > 0 && that.module.tab.current.index_position != tab_index_position) {
            that.module.tab.current = that.module.tab.list[tab_index_position];
            if (that.module.tab.current.type === 'contact') {
                that.module.tab.current.session_key = that.module.current.contact.chat.stored_session_key;
            }
            if (that.module.tab.current.session_key === 'contacts') {
                that.setPanelContactListIntoFocus();
            } else {
                that.unsetPanelContactListFocus();
                that.setChatAsCurrent(that.module.tab.current.type, that.module.tab.current.session_key);
            }
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
        SessionManager.setContactChatsSessionPriority();
        /*      ChatManager.__setLastPushed($scope.activeChats[index_b].to_user_id || $scope.activeChats[index_b].session_key); */

    };

    this.moveContactChatToLast = function(index) {
        if (ChatStorage.contact.chat.order_map[index]) {
            $scope.activeChats.splice(index, 1);
            $scope.activeChats.push($scope.temp_chat);
            $scope.temp_chat = null;
            $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
            $scope.resetChatUnread();
            SessionManager.setContactChatsSessionPriority();
        }
    };

    this.moveContactChatToFirst = function(index) {
        $scope.temp_chat = $scope.activeChats[index];
        $scope.activeChats.splice(index, 1);
        $scope.activeChats.unshift($scope.temp_chat);
        $scope.temp_chat = null;
        SessionManager.setContactChatsSessionPriority();
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

    this.lookUpChatReference = function(priority, message_id, display_id) {
        that.module.referenced.priority = null;
        that.module.referenced.message_id = null;
        that.module.referenced.display_id = null;
        if (reference !== null) {
            that.module.referenced.priority = message;
            that.module.referenced.message_id = message_id;
            that.module.referenced.display_id = display_id;
        }
    };

    this.isReferencedMessage = function(message) {
        if (that.module.referenced.priority !== null && that.module.referenced.priority === message.priority && !that.module.attr.is_referencing) {
            that.module.attr.is_referencing = true;
            $timeout(function() {
                that.module.referenced.priority = null;
                that.module.referenced.message_id = null;
                that.module.referenced.display_id = null;
                that.module.attr.is_referencing = false;
            }, 3000);
            return true;
        }
        return false;
    };

    this.addReferenceToChatMessage = function(type, session_key, message) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatManager.addReferenceToChatMessage(type, session_key, message);
        }
    };

    this.clearChatMessageHistory = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatModuleManager.clearChatMessageHistory(type, session_key);
        }
    };

    this.isChatScrollAtBottom = function(type, session_key) {
        return ChatManager.isChatScrollAtBottom(type, session_key);
    };

    this.evaluateModuleLayout = function() {
        if (Object.size(ChatStorage[contact].chat.list) - 1 >= scope.stored_directory_index) {
            scope.setDirectoryChat(scope.stored_directory_index, false);
        } else if (scope.activeChats.length > 0) {
            scope.setDirectoryChat(0, false);
        }
        if (SettingsManager.module.layout != 2 && !(Object.size(ChatStorage[contact].chat.list))) {
            if (SettingsManager.module.layout == 3) {
                $rootScope.$broadcast('set-module-layout', 1);
            }
            $timeout(function() {
                $rootScope.$evalAsync(function() {
                    document.getElementById(that.module.current.directory.chat.index + '_link').click();
                });
            }, 750);
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
            that.evaluateModuleLayout();
        }
    };

    this.showInGeneralPanelContactList = function(user) { // this function will determine the client has filtered the user out of the general directory user list
        if (angular.isDefined(UserManager.user.group) && UserManager.user.group.indexOf('user_' + user.user_id) > -1) {
            /*          console.log(user.name + 'is in user_group' + angular.toJson(UserManager.user_group)); */
            return false;
        }
        if (user.user_id === ContactsManager.smod.id || user.user_id === ContactsManager.tod.id) {
            return false;
        }
        if (!that.module.contacts.setting.show_offline) {
            if (user.state === "Offline") {
                return false;
            }
        }
        return true;
    };



    this.isSessionLastRequested = function(session_key) {
        /*      console.log(session + ' : ' + ChatManager._last_pushed_session); */
        /*      console.log(session === ChatManager._last_pushed_session) */
        return session_key === that.module.attr.last_requested_chat;
    };

    this.isSessionLastRemoved = function(session_key) {
        /*      console.log(session + ' : ' + $scope.last_deactivated_chat); */
        /*      console.log(session === $scope.last_deactivated_chat); */
        return session_key === that.module.attr.last_removed_chat;
    };
    return this;

}]);
