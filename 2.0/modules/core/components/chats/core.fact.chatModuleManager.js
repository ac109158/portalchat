angular.module('portalchat.core').
service('ChatModuleManager', ['$log', '$timeout', 'CoreConfig', 'UserManager', 'SettingsManager', 'SessionsManager', 'ChatStorage', 'ChatBuilder', 'ChatManager', 'GroupChatManager', 'DirectoryChatManager', 'UtilityManager', 'localStorageService', function($log, $timeout, CoreConfig, UserManager, SettingsManager, SessionsManager, ChatStorage, ChatBuilder, ChatManager, GroupChatManager, DirectoryChatManager, UtilityManager, localStorageService) {
    var that = this;
    this.fb = {};
    this.fb.chat = {};
    this.fb.chat.location = {};
    this.fb.chat.targets = {};

    this.fb.group_chat = {};
    this.fb.group_chat.location = {};
    this.fb.group_chat.targets = {};

    this.module = {};

    this.module.session = {};

    this.module.current = {};
    this.module.current.chat = undefined;

    this.module.video = {};
    this.module.video.code = '';
    this.module.video.url = '';
    this.module.video.message = '';
    this.module.video.heading = '';

    this.module.image = {};
    this.module.image.url = '';
    this.module.image.heading = '';
    this.module.image.message = '';

    this.module.audio = {};
    this.module.audio.heading = '';
    this.module.audio.message = '';
    this.module.audio.url = '';
    this.module.audio.cid = '';

    this.module.contacts = {};
    this.module.contacts.search = {};
    this.module.contacts.search_text = '';
    this.module.contacts.filtered = [];

    this.module.presence = {};
    this.module.presence.states = ['Online', 'Offline', 'Busy', 'Invisible'];


    this.module.reference = {};
    this.module.reference.current = undefined;
    this.module.reference.message = null;
    this.module.reference.index = undefined;
    this.module.reference.name = '';

    this.module.config = {};
    this.module.config.directory = {};
    this.module.config.directory.models = ['chat_reference', 'chat_description', 'admin', 'mandatory', 'watch_users', 'store_length'];
    this.module.config.directory.default_chats = [];


    this.module.setting = {};
    this.module.setting.allow_group_chats = true;
    this.module.setting.is_typing_presence = CoreConfig.is_typing_presence;
    this.module.setting.directory_limit = 30;

    this.module.attr = {};
    this.module.attr.is_referencing = false;
    this.module.attr.is_page_loaded = false;
    this.module.attr.last_unread_index = null;
    this.module.attr.is_chat_ping = false;
    this.module.attr.tmp = 1;
    this.module.attr.tmp_chat = '';
    this.module.attr.updated_text = '';
    this.module.attr.lact_active_chat = undefined;
    this.module.attr.is_child_window = false;
    this.module.attr.is_child_window_instance = undefined;

    this.module.current = {};
    this.module.current.directory = {};
    this.module.current.directory.chat = {};
    this.module.current.directory.chat.setting = {};
    this.module.current.directory.chat.setting.default_index = 'contacts';
    this.module.current.directory.chat.setting.allow_host_ping = true;
    this.module.current.directory.chat.index = null;
    this.module.current.directory.chat.stored_index = null;
    this.module.current.directory.chat.session_key = undefined;


    this.module.current.contact = {};
    this.module.current.contact.chat = {};
    this.module.current.contact.chat.setting = {};
    this.module.current.contact.chat.setting.allow_host_ping = true;
    this.module.current.contact.chat.active = undefined;
    this.module.current.contact.chat.priority_queue = [];
    this.module.current.contact.chat.current_request = '';
    this.module.current.contact.chat.temp = '';
    this.module.current.contact.chat.unactive = {};
    this.module.current.contact.chat.unactive.list = ChatStorage.contact.chat.list.slice(that.contact.chat.max_count).reverse();
    this.module.current.contact.chat.unactive.show = true;
    this.module.current.contact.chat.unactive.count = 0;
    this.module.current.contact.marker = {};
    this.module.current.contact.marker.last_requested_chat = undefined;
    this.module.current.contact.marker.is_invite = undefined;
    this.module.current.contact.marker.session_key = undefined;

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
            } else if ($scope.layout === 3) {
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

    this.resetDirectoryChatListMarkers = function() {
        angular.forEach(ChatStorage.directory.chat.list, function(directory_chat) {
            directory_chat.scroll_bottom = directory_chat.scroll_top = directory_chat.is_text_focus = false;

        });
        if (that.module.current.chat) {
            that.module.current.chat.is_text_focus = false;
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
        // $scope.setActiveChatsPriority();
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
        $scope.setActiveChatsPriority();
        /*      ChatManager.__setLastPushed($scope.activeChats[index_b].to_user_id || $scope.activeChats[index_b].session_key); */

    };

    this.setContactChatsPriority = function() {
        SessionsManager.setContactChatsPriority();
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

    return this;

}]);
