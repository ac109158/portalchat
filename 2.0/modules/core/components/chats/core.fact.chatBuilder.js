'use strict'; /* Factories */
angular.module('portalchat.core').
service('ChatBuilder', ['$rootScope', '$log', '$sce', '$compile', '$http', '$document', '$timeout', '$firebaseArray', 'CoreConfig', 'UserManager', 'ChatStorage', 'SettingsManager', 'SessionsManager', 'ContactsManager', 'NotificationManager', 'PermissionsManager', 'UxManager', function($rootScope, $log, $sce, $compile, $http, $document, $timeout, $firebaseArray, CoreConfig, UserManager, ChatStorage, SettingsManager, SessionsManager, ContactsManager, NotificationManager, PermissionsManager, UxManager) {
    var that = this;

    this.builder = {};

    this.builder.attr = {};
    this.builder.attr.last_created_chat = undefined;

    this.builder.session = {};
    this.builder.session.models = {};
    this.builder.session.models.contact_group_chat = ['session_key', 'type', 'active', 'order', 'name', 'is_directory_chat', 'is_group_chat', 'is_open', 'is_sound'];
    this.builder.session.models.contact = ['session_key', 'type', 'active', 'order', 'contact_id', 'name', 'avatar', 'is_directory_chat', 'is_group_chat', 'is_open', 'is_sound'];
    this.builder.session.models.directory = ['session_key', 'type', 'active', 'order', 'monitor', 'name', 'is_directory_chat', 'is_group_chat', 'is_open', 'is_sound'];

    this.fb = {};
    this.fb.location = {};

    this.load = function() {
        that.fb.location.additonal_profiles = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.additional_profile_reference);
    };


    this.setLastCreatedChat = function(session_key) {
        that.builder.attr.last_created_chat = session_key;
        $timeout(function() {
            that.builder.attr.last_created_chat = undefined;
        }, 1000);
    };

    this.validateSessionModel = function(session) {
        if (!angular.isObject(session)) {
            return false;
        }
        var pass = true;
        if (session.type === 'contact') {
            if (session.is_group_chat) {

            } else {
                angular.forEach(that.builder.session.models.contact, function(model) {
                    if (angular.isUndefined(session[model])) {
                        pass = false;
                        console.log('validateSessionModel: ', model, 'is undefined.');
                    }
                });
            }
        } else if (session.type === 'directory') {
            angular.forEach(that.builder.session.models.directory, function(model) {
                if (angular.isUndefined(session[model])) {
                    pass = false;
                    console.log('validateSessionModel: ', model, 'is undefined.');
                }
            });
        }

        return pass;
    };

    this.setDefaultChatTemplate = function(session) {
        if (session) {
            if (session.active && session.order === -1) {
                session.order = 0;
                angular.forEach(Object.keys(ChatStorage[session.type].chat.list), function(key) {
                    ChatStorage[session.type].chat.list[key].session.order++;
                    SessionsManager.setUserChatSessionStorage(session.type, key);
                });
            } else {
                session.order = Object.size(ChatStorage[session.type].chat.order_map);
            }
            ChatStorage[session.type].chat.list[session.session_key] = {};

            ChatStorage[session.type].chat.list[session.session_key].message = {};
            ChatStorage[session.type].chat.list[session.session_key].message.text = '';


            ChatStorage[session.type].chat.list[session.session_key].messages = {};
            ChatStorage[session.type].chat.list[session.session_key].messages.list = [];
            ChatStorage[session.type].chat.list[session.session_key].messages.map = [];

            ChatStorage[session.type].chat.list[session.session_key].video = {};
            ChatStorage[session.type].chat.list[session.session_key].video.code = '';
            ChatStorage[session.type].chat.list[session.session_key].video.url = '';
            ChatStorage[session.type].chat.list[session.session_key].video.message = '';
            ChatStorage[session.type].chat.list[session.session_key].video.heading = '';

            ChatStorage[session.type].chat.list[session.session_key].image = {};
            ChatStorage[session.type].chat.list[session.session_key].image.url = '';
            ChatStorage[session.type].chat.list[session.session_key].image.heading = '';
            ChatStorage[session.type].chat.list[session.session_key].image.message = '';

            ChatStorage[session.type].chat.list[session.session_key].audio = {};
            ChatStorage[session.type].chat.list[session.session_key].audio.heading = '';
            ChatStorage[session.type].chat.list[session.session_key].audio.message = '';
            ChatStorage[session.type].chat.list[session.session_key].audio.url = '';
            ChatStorage[session.type].chat.list[session.session_key].audio.cid = '';

            //tagging

            ChatStorage[session.type].chat.list[session.session_key].tag = {};
            ChatStorage[session.type].chat.list[session.session_key].tag.description = '';
            // on the bubble

            // topic values
            ChatStorage[session.type].chat.list[session.session_key].topic = {};
            ChatStorage[session.type].chat.list[session.session_key].topic.description = '';
            ChatStorage[session.type].chat.list[session.session_key].topic.height = 0;
            ChatStorage[session.type].chat.list[session.session_key].topic.truncated = false;
            ChatStorage[session.type].chat.list[session.session_key].topic.set = '';

            //scroll control
            ChatStorage[session.type].chat.list[session.session_key].scroll = {};
            ChatStorage[session.type].chat.list[session.session_key].scroll.to_bottom = true;
            ChatStorage[session.type].chat.list[session.session_key].scroll.to_top = false;
            //chat refernencing
            ChatStorage[session.type].chat.list[session.session_key].reference = {};
            ChatStorage[session.type].chat.list[session.session_key].reference.key = null;
            ChatStorage[session.type].chat.list[session.session_key].reference.author = null;
            ChatStorage[session.type].chat.list[session.session_key].reference.name = null;
            ChatStorage[session.type].chat.list[session.session_key].reference.text = null;
            ChatStorage[session.type].chat.list[session.session_key].reference.priority = null;
            //typing presence
            ChatStorage[session.type].chat.list[session.session_key].typing = {};
            ChatStorage[session.type].chat.list[session.session_key].typing.monitor = CoreConfig.is_typing_presence; // this is used to turn chat typing presence on or off
            ChatStorage[session.type].chat.list[session.session_key].typing.active = false; // this is used to alert the contact if the user is currently typing
            ChatStorage[session.type].chat.list[session.session_key].typing.active_list = [];
            //adding another user

            ChatStorage[session.type].chat.list[session.session_key].invite = {};
            ChatStorage[session.type].chat.list[session.session_key].invite.admin = false;
            ChatStorage[session.type].chat.list[session.session_key].invite.add_topic = false;
            ChatStorage[session.type].chat.list[session.session_key].invite.topic = null;
            ChatStorage[session.type].chat.list[session.session_key].invite.contact_list = [];
            ChatStorage[session.type].chat.list[session.session_key].invite.contact_id = ''; // this is used the track the name of the user that is to be invited into the group chat ie a string such as "Andy Cook";
            //states
            ChatStorage[session.type].chat.list[session.session_key].session = session;

            ChatStorage[session.type].chat.list[session.session_key].topic = {};
            ChatStorage[session.type].chat.list[session.session_key].topic.allow = true;
            ChatStorage[session.type].chat.list[session.session_key].topic.description = '';
            ChatStorage[session.type].chat.list[session.session_key].topic.height = 0;
            ChatStorage[session.type].chat.list[session.session_key].topic.truncated = false;
            ChatStorage[session.type].chat.list[session.session_key].topic.set = '';


            ChatStorage[session.type].chat.list[session.session_key].attr = {};
            ChatStorage[session.type].chat.list[session.session_key].attr.self_fb_ref = 'user';
            if (session.is_group_chat) {
                ChatStorage[session.type].chat.list[session.session_key].attr.other_fb_ref = 'group';
            } else {
                ChatStorage[session.type].chat.list[session.session_key].attr.other_fb_ref = 'contact';
            }
            ChatStorage[session.type].chat.list[session.session_key].attr.is_init = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.min_width = 1;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_converted = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_new_message = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_previous_messages = true;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_reloading = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_reloaded = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_tag_focus = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_text_focus = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_topic_focus = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_top_spacer = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_bottom_lock = true;
            ChatStorage[session.type].chat.list[session.session_key].attr.last_logged_chat = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.last_sent_user_message = '';
            ChatStorage[session.type].chat.list[session.session_key].attr.last_sent_contact_message = '';
            // priority/indexing

            ChatStorage[session.type].chat.list[session.session_key].priority = {};
            ChatStorage[session.type].chat.list[session.session_key].priority.current = false;
            ChatStorage[session.type].chat.list[session.session_key].priority.first = 0;
            ChatStorage[session.type].chat.list[session.session_key].priority.next = 0;

            ChatStorage[session.type].chat.list[session.session_key].ux = {};
            ChatStorage[session.type].chat.list[session.session_key].ux.is_header = true;
            ChatStorage[session.type].chat.list[session.session_key].ux.topic_height = 0;
            ChatStorage[session.type].chat.list[session.session_key].ux.time_reference = session.timestamp;
            ChatStorage[session.type].chat.list[session.session_key].ux.time_format = 'timeago';
            ChatStorage[session.type].chat.list[session.session_key].ux.unread = 0; // this tracks the count of the messages sent to the user while the chat box is closed
            ChatStorage[session.type].chat.list[session.session_key].ux.resize_adjustment = 0;
            ChatStorage[session.type].chat.list[session.session_key].ux.internal_reference = CoreConfig.chat.internal_reference;
            ChatStorage[session.type].chat.list[session.session_key].ux.header_color = CoreConfig.module.setting.header_color; // default color to restore after a alert changes has happened

            ChatStorage[session.type].chat.list[session.session_key].menu = {};
            ChatStorage[session.type].chat.list[session.session_key].menu.options = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.profile = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.tag = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.topic = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.emoticons = false; // toggle flag tht determines if the emotion dox should be displayed to the user
            ChatStorage[session.type].chat.list[session.session_key].menu.user_list = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.image = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.audio = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.video = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.media = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.invite = false; // this is used to toggle ability to invite user into the chat
            ChatStorage[session.type].chat.list[session.session_key].menu.color = false;

            ChatStorage[session.type].chat.list[session.session_key].interval = {};
            ChatStorage[session.type].chat.list[session.session_key].interval.invite_menu_close = undefined;
            ChatStorage[session.type].chat.list[session.session_key].interval.is_user_typing = undefined;


            ChatStorage[session.type].chat.list[session.session_key].user = UserManager.user;
            ChatStorage[session.type].chat.list[session.session_key].user.self_name = 'Me'; // variable for what the chat session should label messages that came from the user/self ex. "Me"



            ChatStorage[session.type].session.list[session.session_key] = {};
            ChatStorage[session.type].session.list[session.session_key].fb = {};


            ChatStorage[session.type].chat.list[session.session_key].contacts = {};
            ChatStorage[session.type].chat.list[session.session_key].contacts.name_list = '';

            if (!session.is_group_chat && !session.is_directory_chat) {
                ChatStorage[session.type].chat.list[session.session_key].signals = {};
                ChatStorage[session.type].chat.list[session.session_key].signals.user = {};
                ChatStorage[session.type].chat.list[session.session_key].signals.user.type = session.type;
                ChatStorage[session.type].chat.list[session.session_key].signals.user.active = false;
                ChatStorage[session.type].chat.list[session.session_key].signals.user.nudge = false;
                ChatStorage[session.type].chat.list[session.session_key].signals.user.is_typing = null;
                ChatStorage[session.type].chat.list[session.session_key].signals.user.topic = session.topic;

                ChatStorage[session.type].chat.list[session.session_key].signals.contact = {};
                ChatStorage[session.type].chat.list[session.session_key].signals.contact.type = session.type;
                ChatStorage[session.type].chat.list[session.session_key].signals.contact.active = false;
                ChatStorage[session.type].chat.list[session.session_key].signals.contact.nudge = false;
                ChatStorage[session.type].chat.list[session.session_key].signals.contact.is_typing = [];
                ChatStorage[session.type].chat.list[session.session_key].signals.contact.topic = session.topic;

                ChatStorage[session.type].chat.list[session.session_key].contact = {};
                ChatStorage[session.type].session.list[session.session_key].contact = {};

                ChatStorage[session.type].chat.list[session.session_key].contact.profile = ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + session.contact_id]];
                that.setContactAdditionalProfile(session.type, session.session_key, session.contact_id);

                ChatStorage[session.type].chat.list[session.session_key].contacts.active = {};
                ChatStorage[session.type].chat.list[session.session_key].contacts.active[UserManager.user.profile.id] = session.timestamp;
                ChatStorage[session.type].chat.list[session.session_key].contacts.active[session.contact_id] = session.timestamp;
                ChatStorage[session.type].chat.list[session.session_key].contacts.participated = [UserManager.user.profile.id, session.contact_id];

                ChatStorage[session.type].session.list[session.session_key].fb.user = {};
                ChatStorage[session.type].session.list[session.session_key].fb.user.location = {};
                ChatStorage[session.type].session.list[session.session_key].fb.user.location.messages = new Firebase(CoreConfig.chat.url_root + CoreConfig.chat.message_storage_reference + UserManager.user.profile.id + '/' + session.contact_id);

                ChatStorage[session.type].session.list[session.session_key].fb.contact = {};
                ChatStorage[session.type].session.list[session.session_key].fb.contact.location = {};
                ChatStorage[session.type].session.list[session.session_key].fb.contact.location.messages = new Firebase(CoreConfig.chat.url_root + CoreConfig.chat.message_storage_reference + session.contact_id + '/' + UserManager.user.profile.id);

            } else {
                ChatStorage[session.type].chat.list[session.session_key].ux.icon = 'fa fa-comments fa-2x';;

                ChatStorage[session.type].chat.list[session.session_key].signals = {};
                ChatStorage[session.type].chat.list[session.session_key].signals.user = {};
                ChatStorage[session.type].chat.list[session.session_key].signals.user.is_typing = null;
                ChatStorage[session.type].chat.list[session.session_key].signals.user.type = 'group';

                ChatStorage[session.type].chat.list[session.session_key].signals.group = {};
                ChatStorage[session.type].chat.list[session.session_key].signals.group.is_typing = [];

                ChatStorage[session.type].session.list[session.session_key].fb.group = {};
                ChatStorage[session.type].session.list[session.session_key].fb.group.location = {};
                ChatStorage[session.type].session.list[session.session_key].fb.group.location.messages = new Firebase(CoreConfig.chat.url_root + CoreConfig.chat.message_storage_reference + session.session_key + '/');


                ChatStorage[session.type].chat.list[session.session_key].description = session.name || 'Chat Description';

                if (!session.is_directory_chat) {
                    ChatStorage[session.type].chat.list[session.session_key].contacts.active = {};
                    ChatStorage[session.type].chat.list[session.session_key].contacts.participated = {}
                    ChatStorage[session.type].session.list[session.session_key].fb.group.location.contacts = SessionsManager.getGroupChatContacts(session);
                }


            }
            if (session.type === 'contact') {
                SessionsManager.setContactChatOrderMap();
                $timeout(function() {
                    UxManager.ux.fx.evaluateChatModuleLayout();
                });
            }

            return true;
        }
        return false;
    };

    this.setContactAdditionalProfile = function(type, session_key, contact_id) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            that.fb.location.additonal_profiles.child(contact_id).once('value', function(snapshot) {
                var additional_profile = snapshot.val();
                if (additional_profile) {
                    if (additional_profile.mc && additional_profile.mc.name) {
                        additional_profile.mc.name = additional_profile.mc.name.replace('*', '');
                    }
                    if (PermissionsManager.hasSupervisorRights()) {
                        ChatStorage[type].chat.list[session_key].contact.additional_profile = additional_profile;
                    } else {
                        delete additional_profile.platform;
                        ChatStorage[type].chat.list[session_key].contact.additional_profile = additional_profile;
                    }

                }
            });
        }
    };

    this.clearSessionExpiredMessages = function(session, fb_ref_type) {
        if (ChatStorage[session.type] && ChatStorage[session.type].chat.list[session.session_key]) {
            if (session.type === 'directory') {
                return true;
            }
            var expiration_timestamp = session.timestamp - CoreConfig.module.setting.store_time;
            ChatStorage[session.type].session.list[session.session_key].fb[fb_ref_type].location.messages.once('value', function(snapshot) {
                var messages = snapshot.val();
                if (messages) {
                    angular.forEach(messages, function(message, key) {
                        if (message.timestamp < expiration_timestamp) // delete message if it has exceeded its life span
                        {
                            ChatStorage[session.type].session.list[session.session_key].fb[fb_ref_type].location.messages.child(key).remove();
                        }
                    });
                }
            });
            return true;
        }
        return false;
    };



    this.watchForChangedChatMessages = function(session, fb_ref_type) {
        return true;
        if (ChatStorage[session.type] && ChatStorage[session.type].session.list[session.session_key]) {
            ChatStorage[session.type].session.list[session.session_key].fb.user.location.messages.on("child_changed", function(snapshot, previous) {
                var key = snapshot.key();
                var message = snapshot.val();
                message.key = key;
                if (message) {
                    if (message.encryption) {
                        message.session_key = sjcl.decrypt(CoreConfig.encrypt_pass, message.session_key);
                        message.text = sjcl.decrypt(message.session_key, message.text);
                    }
                }
                if (angular.isDefined(ChatStorage[session.type].chat.list[session.session_key].messages.map[message.key]) && ChatStorage[session.type].chat.list[session.session_key].messages.list[ChatStorage[session.type].chat.list[session.session_key].messages.map[message.key]]) {
                    ChatStorage[session.type].chat.list[session.session_key].messages.list[ChatStorage[session.type].chat.list[session.session_key].messages.map[message.key]] = message;
                }
            });
            return true;
        }
        return false;
    };

    this.monitorContactsinChat = function(session) {
        if (ChatStorage[session.type] && ChatStorage[session.type].session.list[session.session_key]) {
            if (!session.is_directory_chat && session.is_group_chat) {
                ChatStorage[session.type].session.list[session.session_key].fb.group.location.contacts.child(UserManager.user.profile.id).set(session.start_at_priority);
                ChatStorage[session.type].session.list[session.session_key].fb.group.location.contacts.once('value', function(snapshot) {
                    angular.forEach(snapshot.val(), function(value, key) {
                        ChatStorage[session.type].chat.list[session.session_key].contacts.active[key] = value;
                        ChatStorage[session.type].chat.list[session.session_key].contacts.participated[key] = value;
                    });
                    that.setGroupListNames(session.type, session.session_key);
                    that.setGroupCount(session.type, session.session_key);
                });
                ChatStorage[session.type].session.list[session.session_key].fb.group.location.contacts.on('child_added', function(snapshot) {
                    var key = snapshot.key();
                    var value = snapshot.val();
                    if (angular.isUndefined(ChatStorage[session.type].chat.list[session.session_key].contacts.active[key])) {
                        $rootScope.$evalAsync(function() {
                            ChatStorage[session.type].chat.list[session.session_key].contacts.active[key] = value;
                            if(angular.isUndefined(ChatStorage[session.type].chat.list[session.session_key].contacts.participated[key])){
                                ChatStorage[session.type].chat.list[session.session_key].contacts.participated[key] = value;
                            }
                            that.setGroupListNames(session.type, session.session_key);
                            that.setGroupCount(session.type, session.session_key);
                        });
                    }
                });
                ChatStorage[session.type].session.list[session.session_key].fb.group.location.contacts.on('child_removed', function(snapshot) {
                    $rootScope.$evalAsync(function() {
                        delete ChatStorage[session.type].chat.list[session.session_key].contacts.active[snapshot.key()];
                        that.setGroupListNames(session.type, session.session_key);
                        that.setGroupCount(session.type, session.session_key);
                    });
                });
            }
            return true;
        }
    }

    this.setNewExistingChatMessages = function(session, fb_ref_type) {
        if (ChatStorage[session.type] && ChatStorage[session.type].session.list[session.session_key] && fb_ref_type) {
            var last_message, keys, messages;
            ChatStorage[session.type].session.list[session.session_key].fb[fb_ref_type].location.messages.orderByPriority().startAt(session.start_at_priority).once("value", function(snapshot) {
                keys = Object.keys(snapshot.val() || {});
                messages = snapshot.val();
                session.last_message = keys[keys.length - 1] || null;
                angular.forEach(messages, function(message, key) {
                    message.key = key;
                    if (message && message.key) {
                        that.storeChatMessageInChatMessageList(session.type, session.session_key, message);
                    }

                });
                $timeout(function() {
                    ChatStorage[session.type].session.list[session.session_key].fb[fb_ref_type].location.messages.orderByKey().startAt(session.last_message || '').on('child_added', function(snapshot) { // detects a ref_location.push(Json) made to the reference location
                        if (ChatStorage[session.type] && ChatStorage[session.type].chat.list[session.session_key]) {
                            if (session.last_message) {
                                session.last_message = null;
                            } else {
                                var key = snapshot.key();
                                var message = snapshot.val();
                                message.key = key;
                                if (message && key != ChatStorage[session.type].chat.list[session.session_key].attr.last_logged_chat) {
                                    if (!ChatStorage[session.type].chat.list[session.session_key].session.active) {
                                        ChatStorage[session.type].chat.list[session.session_key].session.active = true;
                                        SessionsManager.setContactChatOrderMap();
                                    }
                                    that.storeChatMessageInChatMessageList(session.type, session.session_key, message);
                                    UxManager.ux.fx.alertNewChat(session.type, session.session_key, message);
                                    return;
                                } else {
                                    $log.debug('Looks like this is a tremor request recieving an message', message);
                                }
                            }
                            return;
                        }
                    });
                }, 1000);
            });
            return true;
        }
        return false;
    };


    this.storeChatMessageInChatMessageList = function(type, session_key, message) {
        ChatStorage[type].chat.list[session_key].attr.last_logged_chat = message.key;
        if (message.encryption) {
            message.session_key = sjcl.decrypt(CoreConfig.encrypt_pass, message.session_key);
            message.text = sjcl.decrypt(message.session_key, message.text);
        }
        if (!ChatStorage[type].chat.list[session_key].priority.current) {
            ChatStorage[type].chat.list[session_key].priority.current = true;
            ChatStorage[type].chat.list[session_key].priority.first = message.priority;
            ChatStorage[type].chat.list[session_key].priority.next = message.priority + 1;
        } else if (ChatStorage[type].chat.list[session_key].priority.current > -1) {
            ChatStorage[type].chat.list[session_key].priority.next = message.priority + 1;
        } else {
            ChatStorage[type].chat.list[session_key].priority.next++;
        }
        ChatStorage[type].chat.list[session_key].session.start_at_priority = message.priority;
        ChatStorage[type].chat.list[session_key].messages.map[message.key] = ChatStorage[type].chat.list[session_key].messages.list.length;
        message.text = $sce.trustAsHtml(message.text);
        ChatStorage[type].chat.list[session_key].messages.list.push(message);

    };
    this.setGroupListNames = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            var name_list = '';
            angular.forEach(ChatStorage[type].chat.list[session_key].contacts.active, function(value, key) {
                if (key != UserManager.user.profile.id) {
                    var contact_tag = "user_" + key;
                    console.log(contact_tag, ContactsManager.contacts.profiles.map)
                    name_list += ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map['user_' + key]].first_name + ', ';
                } else {
                    console.log(UserManager.user);
                    name_list += UserManager.user.profile.first_name + ', ';
                }

            });
            name_list = name_list.replace(/,\s*$/, "");
            console.log('name_list', name_list)
            ChatStorage[type].chat.list[session_key].contacts.name_list = name_list;
        }
    };

    this.setGroupCount = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].contacts.count = Object.size(ChatStorage[type].chat.list[session_key].contacts.active);
        }
    };

    this.buildChatForSession = function(session) { // this function builds out the details of an individual chat sesssion
        if (ChatStorage[session.type].chat.list[session.session_key]) {
            return false;
        }
        if (angular.isUndefined(session) || !session.session_key) {
            ///////////////////////////////////////////////////////////
            $log.debug('that.__buildChatSession failed. Undefined session');
            ////////////////////////////////////////////////////////////
            return false;
        }
        var fb_ref_type;
        if (session.type === 'contact') {
            if (session.is_group_chat) {
                fb_ref_type = 'group';
            } else {
                fb_ref_type = 'user';
            }
        } else {
            fb_ref_type = 'group';
        }
        if (that.validateSessionModel(session)) {
            if (that.setDefaultChatTemplate(session)) {
                if (SessionsManager.setUserChatSessionStorage(session.type, session.session_key)) {
                    if (!session.is_group_chat) {
                        SessionsManager.updateChatSignals(session.type, session.session_key)
                    } else if (!session.is_directory_chat && session.is_group_chat) {
                        that.monitorContactsinChat(session);
                    }
                    if (that.clearSessionExpiredMessages(session, fb_ref_type)) {
                        if (that.setNewExistingChatMessages(session, fb_ref_type)) {
                            if (that.watchForChangedChatMessages(session, fb_ref_type)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    };


    return this;
}]);
