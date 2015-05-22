'use strict'; /* Factories */
angular.module('portalchat.core').
service('ChatBuilder', ['$rootScope', '$log', '$http', '$document', '$timeout', '$firebaseObject', 'CoreConfig', 'UserManager', 'ChatStorage', 'SettingsManager', 'SessionsManager', 'ContactsManager', 'NotificationManager', 'PermissionsManager', 'UxManager', function($rootScope, $log, $http, $document, $timeout, $firebaseObject, CoreConfig, UserManager, ChatStorage, SettingsManager, SessionsManager, ContactsManager, NotificationManager, PermissionsManager, UxManager) {
    var that = this;

    this.builder = {};

    this.builder.attr = {};
    this.builder.attr.last_created_chat = undefined;

    this.builder.session = {};
    this.builder.session.models = ['session_key', 'type', 'active', 'order', 'contact_id', 'name', 'avatar', 'is_directory_chat', 'is_group_chat', 'is_open', 'is_sound', 'nudge'];

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
        angular.forEach(that.builder.session.models, function(model) {
            if (angular.isUndefined(session[model])) {
                pass = false;
                console.log('validateSessionModel: ', model, 'is undefined.');
            }
        });
        return pass;
    };
    this.setContactChatOrderMap = function() {
        ChatStorage.contact.chat.order_map = {};
        angular.forEach(ChatStorage.contact.chat.list, function(value, key) {
            ChatStorage.contact.chat.order_map[value.order] = key;
        });
        ChatStorage.contact.chat.count = Object.size(ChatStorage.contact.chat.list);
    };

    this.setDefaultChatTemplate = function(session) {
        if (session) {
            if (session.order === 0) {
                angular.forEach(Object.keys(ChatStorage[session.type].chat.list), function(key) {
                    ChatStorage[session.type].chat.list[key].order++;
                });
            } else {
                session.order = Object.size(ChatStorage[session.type].chat.list);
            }
            ChatStorage[session.type].chat.list[session.session_key] = {};
            ChatStorage[session.type].chat.list[session.session_key].session_key = session.session_key;
            ChatStorage[session.type].chat.list[session.session_key].order = session.order;
            ChatStorage[session.type].chat.list[session.session_key].active = session.active;

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

            // topic values
            ChatStorage[session.type].chat.list[session.session_key].topic = {};
            ChatStorage[session.type].chat.list[session.session_key].topic.description = '';
            ChatStorage[session.type].chat.list[session.session_key].topic.height = 0;
            ChatStorage[session.type].chat.list[session.session_key].topic.truncated = false;
            ChatStorage[session.type].chat.list[session.session_key].topic.set = '';
            //tagging

            ChatStorage[session.type].chat.list[session.session_key].tag = {};
            ChatStorage[session.type].chat.list[session.session_key].tag.description = '';
            ChatStorage[session.type].chat.list[session.session_key].tag.set = '';
            // on the bubble

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
            //typing presence
            ChatStorage[session.type].chat.list[session.session_key].typing = {};
            ChatStorage[session.type].chat.list[session.session_key].typing.monitor = CoreConfig.is_typing_presence; // this is used to turn chat typing presence on or off
            ChatStorage[session.type].chat.list[session.session_key].typing.active = false; // this is used to alert the contact if the user is currently typing
            ChatStorage[session.type].chat.list[session.session_key].typing.active_list = [];
            //adding another user

            ChatStorage[session.type].chat.list[session.session_key].invite = {};
            ChatStorage[session.type].chat.list[session.session_key].invite.contact_list = [];
            ChatStorage[session.type].chat.list[session.session_key].invite.contact = ''; // this is used the track the name of the user that is to be invited into the group chat ie a string such as "Andy Cook";
            ChatStorage[session.type].chat.list[session.session_key].invite.set_contact = false; // this flag is used to determine that the host user has selected  a name to invite into the chat and that name has been verified to exist within the invite_list
            //states

            ChatStorage[session.type].chat.list[session.session_key].attr = {};
            ChatStorage[session.type].chat.list[session.session_key].attr.is_init = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_converted = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_directory_chat = session.is_directory_chat;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_group_chat = session.is_group_chat;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_new_message = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_open = true;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_previous_messages = true;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_reloading = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_reloaded = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_sound = true;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_tag_focus = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_text_focus = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_topic_focus = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_top_spacer = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.is_active = false;
            ChatStorage[session.type].chat.list[session.session_key].attr.last_sent_user_message = '';
            ChatStorage[session.type].chat.list[session.session_key].attr.last_sent_contact_message = '';
            // priority/indexing

            ChatStorage[session.type].chat.list[session.session_key].priority = {};
            ChatStorage[session.type].chat.list[session.session_key].priority.first = 0;
            ChatStorage[session.type].chat.list[session.session_key].priority.next = 1;




            ChatStorage[session.type].chat.list[session.session_key].ux = {};
            ChatStorage[session.type].chat.list[session.session_key].ux.nudge = false;
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
            ChatStorage[session.type].chat.list[session.session_key].menu.tag = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.topic = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.emoticons = false; // toggle flag tht determines if the emotion dox should be displayed to the user
            ChatStorage[session.type].chat.list[session.session_key].menu.user_list = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.image = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.audio = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.video = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.media = false;
            ChatStorage[session.type].chat.list[session.session_key].menu.invite = false; // this is used to toggle ability to invite user into the chat

            ChatStorage[session.type].chat.list[session.session_key].user = UserManager.user;
            ChatStorage[session.type].chat.list[session.session_key].user.self_name = 'Me'; // variable for what the chat session should label messages that came from the user/self ex. "Me"

            ChatStorage[session.type].chat.list[session.session_key].contacts = {};
            ChatStorage[session.type].chat.list[session.session_key].contacts.participated_list = [UserManager.user.profile.id, session.contact_id];

            if (!session.is_group_chat && !session.is_directory_chat) {
                ChatStorage[session.type].chat.list[session.session_key].contact = {};
                ChatStorage[session.type].chat.list[session.session_key].contact.profile = ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + session.contact_id]];
                that.setContactAdditionalProfile(session.type, session.session_key, session.contact_id);
            } else if (session.is_group_chat && !session.is_directory_chat) {
                ChatStorage[session.type].chat.list[session.session_key].contacts.active_list = {};
                ChatStorage[session.type].chat.list[session.session_key].contacts.profiles = {};
            } else if (session.is_directory_chat) {
                ChatStorage[session.type].chat.list[session.session_key].description = session.description || 'Chat Description';
                ChatStorage[session.type].chat.list[session.session_key].contacts.profiles = {};
            }


            ChatStorage[session.type].chat.list[session.session_key].interval = {};
            ChatStorage[session.type].chat.list[session.session_key].interval.invite_menu_close = undefined;
            ChatStorage[session.type].chat.list[session.session_key].interval.is_user_typing = undefined;

            ChatStorage[session.type].session.list[session.session_key] = {};
            ChatStorage[session.type].session.list[session.session_key].fb = {};
            ChatStorage[session.type].session.list[session.session_key].fb.user = {};
            ChatStorage[session.type].session.list[session.session_key].fb.user.location = {};
            ChatStorage[session.type].session.list[session.session_key].fb.contact = {};
            ChatStorage[session.type].session.list[session.session_key].fb.contact.location = {};
            ChatStorage[session.type].session.list[session.session_key].fb.group = {};
            ChatStorage[session.type].session.list[session.session_key].fb.group.location = {};

            ChatStorage[session.type].session.list[session.session_key].fb.user.target = {};
            ChatStorage[session.type].session.list[session.session_key].fb.contact.target = {};
            ChatStorage[session.type].session.list[session.session_key].fb.group.target = {};
            that.setContactChatOrderMap();
            $timeout(function() {
                UxManager.ux.fx.evaluateChatModuleLayout();
                NotificationManager.playSound('new_chat');
            });
            return true;
        }
        return false;
    };

    this.setContactAdditionalProfile = function(type, session_key, contact_id) {
        console.log('setContactAdditionalProfile: ', type, session_key, contact_id);
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            that.fb.location.additonal_profiles.child(contact_id).once('value', function(snapshot) {
                var additional_profile = snapshot.val();
                console.log('additional_profile: ', additional_profile);
                if (additional_profile) {
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

    this.setFirebaseLocationsForSession = function(session) {
        if (ChatStorage[session.type] && ChatStorage[session.type].chat.list[session.session_key]) {
            ChatStorage[session.type].session.list[session.session_key].fb.contact.location.session = new Firebase(CoreConfig.chat.url_root + session.contact_id + '/' + CoreConfig.chat.active_session_reference + UserManager.user.profile.id.user.id + 'session_key/');
        }
    };

    this.setSessionInContactLocation = function(session) {
        if (ChatStorage[session.type] && ChatStorage[session.type].chat.list[session.session_key]) {
            if (session.is_group_chat) {

            } else {
                ChatStorage[session.type].session.list[session.session_key].fb.contact.location.session.on('value', function(snapshot) {
                    if (angular.isDefined(snapshot.val())) {
                        ChatService.updateSessionStatus(scope, snapshot, chatSession.to_user_session_location, chatSession.index_position, chatSession.isGroupChat);
                    }
                });
                if (angular.isUndefined(to_user.session_key) || to_user.session_key === null) {
                    chatSession.to_user_session_location.once('value', function(snapshot) {
                        if (snapshot.val() === null) {
                            var user_id = UserService._user_profile.user_id;
                            var firekey = ChatService._group_active_session_location.push({
                                admin: UserService._user_profile.user_id,
                                topic: false
                            });
                            ChatService._new_session_key = firekey.name();
                            scope.new_session_key = firekey.name();
                        } else {
                            scope.new_session_key = snapshot.val();
                        }
                    });
                } else {
                    chatSession.session_key = to_user.session_key;
                }
            }
        }

    };

    this.updateSessionStatus = function(scope, data, location, index_position, isGroupChat) {
        var index = null;
        if (angular.isDefined(index_position) && angular.isDefined(scope.activeChats[index_position])) {
            if (isGroupChat) {
                if (scope.activeChats[index_position].session_key == location.parent().parent().parent().name()) {
                    index = data.index_position;
                }
            } else {
                if (scope.activeChats[index_position].to_user_id == location.parent().parent().parent().name()) {
                    index = data.index_position;
                }
            }
        }
        if (index == null) {
            var chat_log = [];
            angular.forEach(scope.activeChats, function(value, key) {
                if (angular.isDefined(value.to_user_id)) {
                    this.push(value.to_user_id);
                } else {
                    this.push(value.session_key);
                }
            }, chat_log);
            var index = chat_log.indexOf(location.parent().parent().parent().name());
        }
        if (index > -1) {
            $log.debug('To user session key has changed to : ' + data.val());
            scope.activeChats[index].to_user_session = data.val();
        } else {
            $log.debug(location.parent().parent().parent().name() + ' was not in ' + angular.toJson(chat_log));
        }
    };


    this.buildChatForSession = function(session) { // this function builds out the details of an individual chat sesssion
        if (angular.isUndefined(session) || !session.session_key) {
            ///////////////////////////////////////////////////////////
            $log.debug('that.__buildChatSession failed. Undefined session');
            ////////////////////////////////////////////////////////////
            return false;
        }
        if (that.validateSessionModel(session)) {
            if (that.setDefaultChatTemplate(session)) {
                // if(that.setSessionInContactLocation(session)){

                // }
            }
        }
        return false;


        that.__setToUserChatPresenceLocation(chat_session, session); // also sets the contact info, so must be called firest // fetches the contact chat state .. active, offline, busy, etc
        /*      chat_session.contact_chat_presence = that.__setToUserChatPresence(contact); // also sets the contact info, so must be called firest // fetches the contact chat state .. active, offline, busy, etc */
        chat_session.contact_message_location = that.__returnToUserMessageLocation(); // firebase location of the to user, so we know where to write chat message for this chat session.
        chat_session.active_typing_contact_location = that.__set_active_typing_contact_location(); // firebase folder that is written true whenever the user is typing
        chat_session.active_typing_contact_location.update({
            'is-typing': false
        });
        chat_session.active_session_contact_location = that.__set_active_session_contact_location(); // firebase folder that the service writes the to users info into , so the the contact knows that there is a chat going on between them
        chat_session.contact_online = UserManager.__setProfileOnlineLocationforUser(session.contact.user_id);
        // define user info and firebse connections
        chat_session.contact_id = UserManager.user.profile.id;
        chat_session.user_avatar = UserManager._user_profile.avatar;
        chat_session.user_message_location = that.__returnFromUserMessageLocation(); // firebase location of the from_user/self, so we know where to write chat message for this chat session.
        chat_session.user_online = UserManager.__setProfileOnlineLocationforUser(UserManager.user.profile.id);
        chat_session.user_chat_presence = UserManager.__setChatPresenceforUser(UserManager.user.profile.id);
        chat_session.active_typing_user_location = that.__set_active_typing_user_location(); // this is a fireabse folder location where other users write true under their own uid to let the user know that they are typing
        chat_session.active_typing_user_location.update({
            'is-typing': false
        });
        chat_session.active_typing_user_location.onDisconnect().remove();
        chat_session.active_typing_user_socket = that.__set_active_typing_user_socket(); // this is a fireabse folder location where other users write true under their own uid to let the user know that they are typing
        chat_session.user_log[UserManager.user.profile.id] = {
            avatar: UserManager._user_profile.avatar,
            name: UserManager._user_profile.name,
            user_id: UserManager.user.profile.id
        };
        $timeout(function() {
            if (angular.isUndefined(chat_session.session_key)) {
                chat_session.session_key = scope.new_session_key;
            }
            chat_session.messageListQuery = that.__returnMessageListQuery(scope, chat_session.time, chat_session.user_message_location, that._contact._user_id, chat_session.is_group_chat, store_length); // this creates a query of the messages pointed at the from_user storage location , messages must be written in both the user and contact chatbox pointer locations
            // set pointer to user-group, used to remove the session if no one is longer using it
            var session_root = that._group_url_root + that._group_active_session_reference + chat_session.session_key + '/';
            chat_session.firebase_location = new Firebase(session_root);
            if (chat_session.topic_location.$value === null) {
                chat_session.firebase_location.update({
                    'topic': false
                });
            }
            chat_session.group_user_location = chat_session.firebase_location.child(that._group_active_users_reference);
            $log.debug('session_key is : ' + chat_session.session_key);
            that.__pushChatSession(chat_session, session); // pushes the chat session into the scope of the view
            /*          clearInterval(build_delay); */
        }, 500);
    };

    this.buildGroupChatSession = function(value, isopen, isfocus, store_length) // this function builds out the details of an individual chat sesssion
        {
            $log.debug('building group chat');
            if (angular.isUndefined(value.session_key) || angular.isUndefined(value.admin)) {
                ///////////////////////////////////////////////////////////
                $log.debug('that.__buildGroupChatSession failed. Undefined session_key');
                ////////////////////////////////////////////////////////////
                return false;
            }
            var groupChatSession = {};
            that.__setDefaultSettings(groupChatSession);
            groupChatSession.session_key = value.session_key;
            groupChatSession.time = value.time;
            groupChatSession.is_group_chat = true;
            var session_root = that._group_url_root + that._group_active_session_reference + groupChatSession.session_key + '/';
            groupChatSession.firebase_location = new Firebase(session_root);
            groupChatSession.group_message_location = new Firebase(that._group_url_root + that._group_active_session_reference + groupChatSession.session_key + '/' + that._group_message_location_reference);
            groupChatSession.messageListQuery = that.__returnMessageListQuery(groupChatSession.time, groupChatSession.group_message_location, groupChatSession.session_key, groupChatSession.is_group_chat, 1); // this creates a query of the messages pointed at the from_user storage location , messages must be written in both the user and contact chatbox pointer locations
            groupChatSession.active_session_location = that.__setActiveSessionLocation(null, groupChatSession.session_key, true);
            groupChatSession.group_active_typing_location = that.__set_active_typing_group_location(groupChatSession.session_key); //point to where the typing-presence values will be stored
            groupChatSession.topic_location = $firebase(groupChatSession.firebase_location.child('topic'));
            groupChatSession.group_user_location = groupChatSession.firebase_location.child(that._group_active_users_reference);
            $log.debug(groupChatSession.group_user_location.toString());
            groupChatSession.user_details = {};
            groupChatSession.admin = value.admin;
            if (angular.isDefined(isopen)) {
                groupChatSession.isopen = isopen;
            } // this flag controls whether the chatbox should be open when it is created. Useful to close page reloads chatSessions so the messages can gracefully load
            //
            if (angular.isDefined(isfocus)) {
                groupChatSession.is_text_focus = isfocus;
            }
            if (angular.isDefined(value.isSound)) {
                groupChatSession.isSound = value.isSound;
            }
            if (angular.isDefined(value.tag)) {
                groupChatSession.tag = value.tag;
            }
            if (angular.isDefined(value.index_position)) {
                groupChatSession.index_position = value.index_position;
            }
            if (angular.isDefined(value.resize_adjust)) {
                groupChatSession.resize_adjustment = value.resize_adjust;
            }
            groupChatSession.group_user_location.on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                { // this event will detect when another user is added to a group chat, and each user that participating will update that person into their user_log
                    if (angular.isDefined(snapshot.val()) && snapshot.val() !== null) {
                        var data = snapshot.val();
                        var val = data.user_id;
                        $log.debug(val);
                        if (angular.isDefined(groupChatSession.user_log)) {
                            groupChatSession.user_log[val] = data;
                            var user = {};
                            user.user_id = val;
                            user.name = data.name;
                            user.avatar = data.avatar;
                            user.profile_location = UserManager.__setProfileOnlineLocationforUser(val);
                            user.session_location = that.__setSessionLocationforGroupInvitee(groupChatSession.session_key, val);
                            groupChatSession.user_details[val] = user;
                            groupChatSession.participant_log[CoreConfig.common.reference.user_prefix + user.user_id] = user.name;
                            if (user.user_id != UserManager.user.profile.id) {
                                /*
var n = parseInt(Firebase.ServerValue.TIMESTAMP);
                        var chat_text = user.name + ' was added to chat';
                        groupChatSession.group_chats.push({
                            author: that._internal_reference,
                            to: groupChatSession.session_key,
                            text: chat_text,
                            time: n,
                            priority: -1,
                            session_key: groupChatSession.session_key
                        });
                        groupChatSession.group_chat_log.push(that._internal_reference);
                        if (scope.isPageLoaded) {
                            scope.alertNewChat(groupChatSession.index_position, true);
                        }
*/
                                UtilityService.removeByAttr(groupChatSession.invite_list, 'user_id', val);
                            }
                            if (user.user_id != UserManager.user.profile.id) {
                                groupChatSession.group_count = groupChatSession.group_count + 1;
                            }
                            $log.debug(groupChatSession.user_details);
                        } else {
                            $log.debug(val + 'groupChatSession.user_log was not defined');
                        }
                    } else {
                        $log.debug('Child was undefined/null');
                    }
                });
            groupChatSession.group_typing_location = new Firebase(groupChatSession.firebase_location + 'is-typing/');
            groupChatSession.group_typing_location.on('child_added', function(snapshot) {
                if (snapshot.name() === UserManager.user.profile.id) {
                    return;
                }
                $timeout(function() {
                    groupChatSession.is_typing_list.push(snapshot.val());
                });
            });
            groupChatSession.group_typing_location.on('child_removed', function(snapshot) { /*          console.log(snapshot.val()); */
                /*              delete newDirectoryChat.is_typing_list[snapshot.name()]; */
                groupChatSession.is_typing_list.splice(groupChatSession.is_typing_list.indexOf(snapshot.val(), 1));
            });
            groupChatSession.group_user_location.on('child_removed', function(childSnapshot) { // detects a ref_location.remove(JsonObjKey) made to the reference location
                var data = childSnapshot.val();
                var val = data.user_id;
                if (data.user_id === UserManager.user.profile.id) {
                    if (scope.last_deactivated_chat != groupChatSession.session_key) {
                        scope.removeChatSession(groupChatSession);
                    }
                    return;
                }
                if (angular.isDefined(groupChatSession.user_details) && angular.isDefined(groupChatSession.user_details[val])) {
                    if (angular.isDefined(groupChatSession.user_details[val].profile_location)) {
                        groupChatSession.user_details[val].profile_location.$off();
                    }
                    if (angular.isDefined(groupChatSession.user_details[val].session_location)) {
                        groupChatSession.user_details[val].session_location.off();
                    }
                    delete groupChatSession.user_details[val];
                    delete groupChatSession.user_log[val];
                    var n = Firebase.ServerValue.TIMESTAMP;
                    var chat_text = data.name + ' has left';
                    groupChatSession.group_chats.push({
                        author: that._internal_reference,
                        to: groupChatSession.session_key,
                        text: chat_text,
                        time: n,
                        priority: -1,
                        session_key: groupChatSession.session_key
                    });
                    groupChatSession.group_chat_log.push(that._internal_reference);
                    if (scope.isPageLoaded) {
                        scope.alertNewChat(groupChatSession.index_position, true, null);
                    }
                    if (data.user_id != UserManager.user.profile.id) {
                        groupChatSession.group_count--;
                        if (groupChatSession.invite_list) {
                            groupChatSession.invite_list.push({
                                avatar: data.avatar,
                                name: data.name,
                                user_id: data.user_id
                            });
                        }
                    }
                }
            });
            if (angular.isDefined(value.name)) {
                groupChatSession.chat_description = value.name;
            } else {
                groupChatSession.chat_description = 'Group -' + groupChatSession.user_details[value.admin].name;
            } // used at the top of the chat box
            if (angular.isDefined(groupChatSession.session_key) && angular.isDefined(groupChatSession.user_log) && angular.isDefined(groupChatSession.user_details)) {
                $log.debug('Pushing chat session into scope');
                $timeout(function() {
                    that.__pushChatSession(groupChatSession, false, scope); // pushes the chat session into the scope of the view
                }, 500); //timeout helps keep chats in right order on reload, group chats spawn much faster so they will always be at the 0 index otherwise
            } else {
                $log.debug('Complete Failure');
                return false;
            }
        };


    this.convertToGroupChat = function(chat, index, scope) {
        $log.debug('Begin converting chat to a group chat');
        if (angular.isUndefined(chat.session_key)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: session_key not defined');
            ////////////////////////////////////////////////////////////
            return false;
        }
        if (angular.isUndefined(scope) || angular.isUndefined(chat)) {
            ///////////////////////////////////////////////////////////
            $log.debug('that.__convertToGroupChat, Undefined scope/chat');
            ////////////////////////////////////////////////////////////
            return false;
        }
        var groupChatSession = {};
        that.__setDefaultSettings(groupChatSession);
        if (angular.isDefined(chat.firebase_location)) {
            groupChatSession.firebase_location = chat.firebase_location;
        } else {
            var session_root = that._group_url_root + that._group_active_session_reference + chat.session_key + '/';
            groupChatSession.firebase_location = new Firebase(session_root);
        }
        groupChatSession.topic_location = $firebase(groupChatSession.firebase_location.child('topic'));
        groupChatSession.active_session_location = that.__setActiveSessionLocation(null, groupChatSession.session_key, true);
        if (angular.isDefined(chat.group_user_location)) {
            groupChatSession.group_user_location = chat.group_user_location;
        } else {
            groupChatSession.group_user_location = groupChatSession.firebase_location.child(that._group_active_users_reference);
        }
        groupChatSession.group_active_typing_location = that.__set_active_typing_group_location(scope, chat.session_key); //point to where the typing-presence values will be stored
        groupChatSession.group_message_location = new Firebase(that._group_url_root + that._group_active_session_reference + chat.session_key + '/' + that._group_message_location_reference); // point to where the chat message for this group converstion will be stored
        if (angular.isDefined(chat.time)) {
            groupChatSession.time = chat.time;
        } else {
            var d = new Date();
            groupChatSession.time = d.getTime();
        }
        groupChatSession.messageListQuery = that.__returnMessageListQuery(scope, chat.time, groupChatSession.group_message_location, chat.session_key, true, 1); // this creates a query of the messages pointed at the from_user storage location , messages must be written in both the user and contact chatbox pointer locations
        if (angular.isDefined(chat.user_log)) {
            groupChatSession.user_log = chat.user_log;
        } else {
            groupChatSession.user_log = {};
        }
        if (angular.isDefined(chat.admin)) {
            groupChatSession.admin = chat.admin;
        } else {
            groupChatSession.admin = UserManager.user.profile.id;
        }
        if (angular.isDefined(chat.adminName)) {
            groupChatSession.adminName = chat.adminName;
        } else {
            if (angular.isDefined(groupChatSession.user_log[groupChatSession.admin]) && angular.isDefined(groupChatSession.user_log[groupChatSession.admin].name)) {
                groupChatSession.adminName = groupChatSession.user_log[groupChatSession.admin].name;
            } else {
                groupChatSession.adminName = UserManager._user_profile.name;
            }
        }
        if (angular.isDefined(chat.chat_description)) {
            groupChatSession.chat_description = chat.chat_description;
        } else {
            groupChatSession.chat_description = 'Group - ' + groupChatSession.adminName;
        }
        if (angular.isDefined(chat.user_details)) {
            groupChatSession.user_details = chat.user_details;
        } else {
            groupChatSession.user_details = {};
        }
        if (angular.isDefined(chat.isopen)) {
            groupChatSession.isopen = chat.isopen;
        } // this flag controls whether the chatbox should be open when it is created. Useful to close page reloads chatSessions so the messages can gracefully load
        if (angular.isDefined(chat.isFocus)) {
            groupChatSession.is_text_focus = chat.is_text_focus;
        }
        if (angular.isDefined(chat.session_key)) {
            groupChatSession.session_key = chat.session_key;
        }
        if (angular.isDefined(chat.emotions)) {
            groupChatSession.emotions = chat.emotions;
        }
        if (angular.isDefined(chat.isSound)) {
            groupChatSession.isSound = chat.isSound;
        }
        if (angular.isDefined(chat.invite)) {
            groupChatSession.invite = chat.invite;
        }
        if (angular.isDefined(chat.invite_list)) {
            groupChatSession.invite_list = chat.invite_list;
        }
        if (angular.isDefined(chat.chats)) {
            groupChatSession.chats = chat.chats;
        }
        if (angular.isDefined(chat.user_online)) {
            groupChatSession.user_online = chat.user_online;
        }
        if (angular.isDefined(chat.contact_online)) {
            groupChatSession.contact_online = chat.contact_online;
        }
        if (angular.isDefined(chat.contact_chat_presence)) {
            groupChatSession.contact_chat_presence = chat.contact_chat_presence;
        }
        if (angular.isDefined(chat.user_chat_presence)) {
            groupChatSession.user_chat_presence = chat.user_chat_presence;
        }
        if (angular.isDefined(chat.contact_f_name)) {
            groupChatSession.contact_f_name = chat.contact_f_name;
        }
        if (angular.isDefined(chat.chat_log)) {
            groupChatSession.chat_log = chat.chat_log;
        }
        if (angular.isDefined(chat.group_chats)) {
            groupChatSession.group_chats = chat.group_chats;
        }
        if (angular.isDefined(chat.unread)) {
            groupChatSession.unread = chat.unread;
        } // this tracks the count of the messages sent to the user while the chat box is closed
        if (angular.isDefined(chat.showUserOptions)) {
            groupChatSession.showUserOptions = chat.showUserOptions;
        }
        if (angular.isDefined(chat.index_position)) {
            groupChatSession.index_position = chat.index_position;
        } else {
            groupChatSession.index_position = null;
        }
        if (angular.isDefined(chat.resize_adjustment)) {
            groupChatSession.resize_adjustment = chat.resize_adjustment;
        }
        // override  defaults
        groupChatSession.internal_reference = that._internal_reference;
        groupChatSession.convert = true;
        groupChatSession.is_group_chat = true;
        groupChatSession.contact_role = chat.contact_role;
        groupChatSession.contact_id = chat.session_key;
        groupChatSession.contact_avatar = chat.contact_avatar;
        groupChatSession.group_user_location.once('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
            {
                if (angular.isUndefined(snapshot)) {
                    ////////////////////////////////////////////////////////////
                    $log.debug("Failure: Something went wrong.");
                    ////////////////////////////////////////////////////////////
                } else {
                    if (angular.isDefined(snapshot.val()) && snapshot.val() !== null) {
                        $log.debug('User list was setup in the firebase');
                        var data = snapshot.val();
                        $log.debug(data);
                        angular.forEach(data, function(val, key) {
                            groupChatSession.user_log[key] = val;
                        });
                        $log.debug(' groupChatSession.user_log was created to be : ' + angular.toJson(groupChatSession.user_log));
                        angular.forEach(groupChatSession.user_log, function(val, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                            var user = {};
                            user.user_id = key;
                            user.name = val.name;
                            user.avatar = val.avatar;
                            user.profile_location = UserManager.__setProfileOnlineLocationforUser(key);
                            $timeout(function() {
                                if (user.profile_location.$value === true) { /*                              console.log(User.name + 'was online. : ' + User.profile_location.$value); */
                                    user.session_location = that.__setSessionLocationforGroupInvitee(chat.session_key, key);
                                    groupChatSession.user_details[key] = user;
                                    groupChatSession.participant_log[CoreConfig.common.reference.user_prefix + user.user_id] = user.name;
                                    groupChatSession.firebase_location.child('active-users').child(key).update(val);
                                }
                            }, 500);
                        });
                        groupChatSession.group_count = 2;
                        $log.debug("groupChatSession.user_details was setup to be : " + groupChatSession.user_details);
                    } else {
                        $log.debug('UserLocation came back as undefined');
                        if (angular.isDefined(groupChatSession.user_log)) {
                            angular.forEach(groupChatSession.user_log, function(val, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                                groupChatSession.firebase_location.child('active-users').child(key).set(val);
                                var user = {};
                                user.user_id = key;
                                user.name = val.name;
                                user.avatar = val.avatar;
                                user.profile_location = UserManager.__setProfileOnlineLocationforUser(key);
                                $timeout(function() {
                                    if (user.profile_location.$value === true) { /*                                  console.log(user.name + 'was online. : ' + user.profile_location.$value); */
                                        user.session_location = that.__setSessionLocationforGroupInvitee(chat.session_key, key);
                                        groupChatSession.user_details[key] = user;
                                        groupChatSession.participant_log[CoreConfig.common.reference.user_prefix + user.user_id] = user.name; /*                                    groupChatSession.firebase_location.child('active-users').child(key).update(val); */
                                    } else { /*                                     console.log(user.name + 'was offline. : ' + user.profile_location.$value); */
                                        val = null;
                                        return false;
                                    }
                                }, 500);
                            });
                            groupChatSession.group_count = 2;
                            $log.debug('GroupChat user_log and details are setup correctly ');
                            $log.debug(groupChatSession.user_details);
                        }
                    }
                }
            });
        groupChatSession.group_user_location.on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
            {
                if (angular.isDefined(snapshot.val()) && snapshot.val() !== null) {
                    var n, chat_text;
                    var data = snapshot.val();
                    var val = data.user_id;
                    if (angular.isDefined(groupChatSession.user_log) && angular.isUndefined(groupChatSession.user_log[val])) {
                        groupChatSession.user_log[val] = data;
                        var user = {};
                        user.user_id = val;
                        user.name = data.name;
                        user.avatar = data.avatar;
                        user.profile_location = UserManager.__setProfileOnlineLocationforUser(val);
                        $timeout(function() {
                            if (user.profile_location.$value) { /*                          console.log(user.name + 'was online. : ' + user.profile_location.$value); */
                                user.session_location = that.__setSessionLocationforGroupInvitee(groupChatSession.session_key, val);
                                groupChatSession.user_details[val] = User;
                                groupChatSession.participant_log[CoreConfig.common.reference.user_prefix + user.user_id] = user.name;
                                UtilityService.removeByAttr(groupChatSession.invite_list, 'user_id', val); /*                   var d = new Date(); */
                                n = Firebase.ServerValue.TIMESTAMP;
                                chat_text = user.name + ' has joined chat';
                                groupChatSession.group_chats.push({
                                    author: that._internal_reference,
                                    to: groupChatSession.session_key,
                                    text: chat_text,
                                    time: n,
                                    priority: -1,
                                    session_key: groupChatSession.session_key
                                });
                                groupChatSession.group_chat_log.push(that._internal_reference);
                                if (user.user_id != UserManager.user.profile.id) {
                                    groupChatSession.group_count++;
                                }
                            } else {
                                n = Firebase.ServerValue.TIMESTAMP;
                                chat_text = user.name + ' is not online';
                                groupChatSession.group_chats.push({
                                    author: that._internal_reference,
                                    to: groupChatSession.session_key,
                                    text: chat_text,
                                    time: n,
                                    priority: -1,
                                    session_key: groupChatSession.session_key
                                });
                                groupChatSession.group_chat_log.push(that._internal_reference);
                            }
                        }, 750);
                    } else {
                        $log.debug(val + ' : User was already in list');
                    }
                } else {
                    $log.debug('Child was undefined/null');
                }
            });
        groupChatSession.group_user_location.on('child_removed', function(childSnapshot) { // detects a ref_location.remove(JsonObjKey) made to the reference location
            var data = childSnapshot.val();
            var val = data.user_id;
            if (angular.isDefined(groupChatSession.user_details) && angular.isDefined(groupChatSession.user_details[val])) {
                if (angular.isDefined(groupChatSession.user_details[val].profile_location)) {
                    groupChatSession.user_details[val].profile_location.$off();
                }
                if (angular.isDefined(groupChatSession.user_details[val].session_location)) {
                    groupChatSession.user_details[val].session_location.off();
                }
                delete groupChatSession.user_details[val];
                delete groupChatSession.user_log[val]; /*               var d = new Date(); */
                var n = Firebase.ServerValue.TIMESTAMP;
                var chat_text = data.name + ' has left';
                groupChatSession.group_chats.push({
                    author: that._internal_reference,
                    to: groupChatSession.session_key,
                    text: chat_text,
                    time: n,
                    priority: -1,
                    session_key: groupChatSession.session_key
                });
                groupChatSession.group_chat_log.push(that._internal_reference);
                if (data.user_id != UserManager.user.profile.id) {
                    groupChatSession.group_count--;
                    if (groupChatSession.invite_list) {
                        groupChatSession.invite_list.push({
                            avatar: data.avatar,
                            name: data.name,
                            user_id: data.user_id
                        });
                    }
                }
            }
        });
        if (angular.isDefined(groupChatSession.session_key) && angular.isDefined(groupChatSession.user_log) && angular.isDefined(groupChatSession.user_details)) {
            $log.debug(groupChatSession);
            that._is_playing_sound = true;
            $timeout(function() {
                NotificationService.__playSound(NotificationService._chat_convert); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                that._is_playing_sound = false;
                groupChatSession.allowTopic = true;
            }, 200);
            return groupChatSession;
        } else {
            $log.debug('Complete Failure');
            return false;
        }
    };

    this.returnMessageListQuery = function(scope, time, refLocation, to_address, is_group_chat, store_length) // this will query the message storage loction for the chat_session and create callbacks for when a child is added or removed, it can  also limit the amount of chat message that can be stored
        {
            var query_limit_size, timestamp;
            $log.debug("WARNING: GERNERATING A MESSAGE QUERY FOR " + refLocation.name());
            if (angular.isUndefined(refLocation)) {
                ////////////////////////////////////////////////////////////
                $log.debug('Failure: location error: ' + refLocation);
                ////////////////////////////////////////////////////////////
                return false;
            }
            that._last_query_location = refLocation.name();
            if (is_group_chat) {
                query_limit_size = that._group_query_size;
                timestamp = time - (Directorythat._store_time * store_length);
            } else {
                query_limit_size = that._single_query_size;
                timestamp = time - that._store_time;
            }
            ////////////////////////////////////////////////////////////
            $log.debug("Warning: A messageListQuery connection is  being created");
            ////////////////////////////////////////////////////////////
            refLocation.once('value', function(snapshot) {
                var location_list = snapshot.val();
                if (location_list) {
                    angular.forEach(location_list, function(value, key) {
                        if (value.time < timestamp) // delete message if it has exceeded its life span
                        {
                            directory_chat.group_message_location.child(key).remove();
                        }
                    });
                }
            });

            var messageListQuery = refLocation;
            messageListQuery = messageListQuery.endAt().limit(that._message_load_size);
            messageListQuery.on('child_removed', function(snapshot) {
                var messageInfo = snapshot.val();
                if (that._storage_limit) {
                    $log.debug('Message ' + messageInfo.text + ' from user ' + messageInfo.user_id + ' should no longer be displayed. ' + angular.toJson(messageInfo));
                    var firekey = snapshot.name();
                    $log.debug(snapshot.val());
                    refLocation.child(firekey).set(null);
                }
            });
            $timeout(function() {
                var i;
                messageListQuery.endAt().limit(1).on('value', function(snapshot) {
                    var index = null;
                    var obj = snapshot.val();
                    var log = [];
                    angular.forEach(obj, function(value, key) { // only a single object so for loop isnt expensive
                        this.push(key);
                    }, log);
                    if (obj === null || that.last_chat_logged === log[0] || obj[log[0]] === null) {
                        $log.debug('Value change is not needed');
                        return false;
                    }
                    var data = obj[log[0]];
                    if (data.text === null || data.author === UserManager._user_profile.user_id) {
                        $log.debug('This is what you just wrote,  return false');
                        return false;
                    }
                    if (data.encryption) {
                        data.session_key = sjcl.decrypt(CoreConfig.encrypt_pass, data.session_key);
                        data.text = sjcl.decrypt(data.session_key, data.text);
                    }
                    if (is_group_chat === false) {
                        refLocation.parent().parent().parent().child('Active-Sessions').child(to_address).child('index_position').once('value', function(snapshot) {
                            index = snapshot.val();
                        });
                    }
                    if (index === null) {
                        var active_chat_log = [];
                        angular.forEach(that.active_chats, function(value, key) {
                            if (angular.isDefined(value.session_key)) {
                                this.push(value.session_key);
                            }
                        }, active_chat_log);
                        index = active_chat_log.indexOf(data.session_key);
                    }
                    if (index > -1) //check to see if  the user_id  of the other persons is still in the users active sessions
                    {
                        if (that.active_chats[index] && that.active_chats[index].is_group_chat === false) {
                            i = that.active_chats[index].chats.length; //or 10
                            while (i--) {
                                if (that.active_chats[index].chats[i].key === log[0]) {
                                    that.active_chats[index].chats[i].text = data.text;
                                    break;
                                }
                            }
                            return;
                        } else if (that.active_chats[index] && that.active_chats[index].is_group_chat === true) {
                            i = that.active_chats[index].group_chats.length; //or 10
                            while (i--) {
                                if (that.active_chats[index].group_chats[i].key === log[0]) {
                                    that.active_chats[index].group_chats[i].text = data.text;
                                    break;
                                }
                            }
                            scope.$apply();
                            return;
                        }
                    } else {
                        // $log.debug(data.session_key + ' was not in ' + angular.toJson(active_chat_log));
                    }
                });
            }, 500);
            $timeout(function() {
                if (is_group_chat === false) {
                    $timeout(function() {
                        messageListQuery.on('child_added', function(snapshot) { // detects a ref_location.push(Json) made to the reference location
                            if (snapshot.name() != that.last_chat_logged) {
                                var lookup;
                                var index;
                                var data = snapshot.val();
                                if (data.author === UserManager._user_profile.user_id) {
                                    lookup = data.to;
                                } else {
                                    lookup = data.author;
                                }
                                refLocation.parent().parent().parent().child('Active-Sessions').child(lookup).child('index_position').once('value', function(snapshot) {
                                    var snap = snapshot.val();
                                    if (angular.isDefined(that.active_chats[snap]) && that.active_chats[snap].contact_id === lookup) {
                                        index = snap;
                                    }
                                });
                                if (data.time < timestamp) // delete message if it has exceeded its life span
                                {
                                    refLocation.child(snapshot.name()).remove();
                                    return false;
                                }
                                that.last_chat_logged = data.key = snapshot.name();
                                if (data.encryption) {
                                    data.session_key = sjcl.decrypt(CoreConfig.encrypt_pass, data.session_key);
                                    data.text = sjcl.decrypt(data.session_key, data.text);
                                }
                                if (index === null) { /*                                 console.log('used fallback'); */
                                    var active_chat_log = [];
                                    angular.forEach(that.active_chats, function(value, key) {
                                        if (angular.isDefined(value.contact_id)) {
                                            this.push(value.contact_id);
                                        } else if (angular.isDefined(value.session_key)) {
                                            this.push(value.session_key);
                                        }
                                    }, active_chat_log);
                                    index = active_chat_log.indexOf(lookup); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
                                }
                                if (index > -1) //check to see if  the user_id  of the other persons is still in the users active sessions
                                {
                                    if (angular.isDefined(that.active_chats[index])) {
                                        if (that.active_chats[index].first_priority === false) {
                                            that.active_chats[index].first_priority = data.priority;
                                        }
                                        if (data.priority > -1) {
                                            that.active_chats[index].next_priority = data.priority + 1;
                                        } else {
                                            that.active_chats[index].next_priority++;
                                        }
                                        that.active_chats[index].chats.push(data);
                                        that.active_chats[index].chat_log.push(data.author); // we are logging the chat, so we can do some conditional formatting and css based of the an log array;
                                    }
                                    if (((parseInt(data.time) + 5000) > that.active_chats[index].time_reference) && data.author != UserManager._user_profile.user_id) {
                                        scope.alertNewChat(index, false, data);
                                    }
                                    $timeout(function() {
                                        if (that.last_chat_logged === data.key) {
                                            that.last_chat_logged = '';
                                        }
                                    }, 50);
                                } else { /*                                 console.log(lookup + ' was not in ' + angular.toJson(active_chat_log)); */
                                    return false;
                                }
                            } else { /*                             console.log('Looks like this is a tremor request recieving an message'); */
                                $log.debug('Looks like this is a tremor request recieving an message');
                                return false;
                            }
                        });
                        return messageListQuery;
                    }, 1500);
                } else if (is_group_chat === true) {
                    $timeout(function() {
                        messageListQuery.on('child_added', function(snapshot) { // detects a ref_location.push(Json) made to the reference location
                            if (snapshot.name() != that.last_chat_logged) {
                                var index = null;
                                var data = snapshot.val();
                                data.key = that.last_chat_logged = snapshot.name();
                                if (data.encryption) {
                                    data.session_key = sjcl.decrypt(CoreConfig.encrypt_pass, data.session_key);
                                    data.text = sjcl.decrypt(data.session_key, data.text);
                                }
                                refLocation.parent().parent().parent().parent().child('Users').child(UserManager._user_profile.user_id).child('Active-Sessions').child(data.to).child('index_position').once('value', function(snapshot) {
                                    var snap = snapshot.val();
                                    if (that.active_chats[snap] && that.active_chats[snap].session_key === data.to) {
                                        index = snap; /*                                    console.log('tada') */
                                    }
                                });
                                if (index === null) // use fallback for loop
                                {
                                    var active_chat_log = [];
                                    angular.forEach(that.active_chats, function(value, key) {
                                        if (angular.isDefined(value.contact_id)) {
                                            this.push(value.contact_id);
                                        } else if (angular.isDefined(value.session_key)) {
                                            this.push(value.session_key);
                                        }
                                    }, active_chat_log);
                                    index = active_chat_log.indexOf(data.to); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
                                }
                                if (index > -1) //check to see if  the user_id  of the other persons is still in the users active sessions
                                {
                                    if (angular.isDefined(that.active_chats[index])) {
                                        if (that.active_chats[index].first_priority === false) {
                                            that.active_chats[index].first_priority = data.priority;
                                        }
                                        if (data.priority > -1) {
                                            that.active_chats[index].next_priority = data.priority + 1;
                                        } else {
                                            that.active_chats[index].next_priority++;
                                        }
                                        that.active_chats[index].group_chat_log.push(data.author); // we are logging the chat, so we can do some conditional formatting and css based of the an log array;
                                        that.active_chats[index].group_chats.push(data); /*                                     console.log(data);   */
                                    }
                                    if ((parseInt(data.time) + 5000) > that.active_chats[index].time_reference && data.author != UserManager._user_profile.user_id) {
                                        scope.alertNewChat(index, false, data);
                                    }
                                    $timeout(function() {
                                        if (that.last_chat_logged === data.key) {
                                            that.last_chat_logged = '';
                                        }
                                    }, 200);
                                }
                            } else { /*                             console.log('Looks like this is a tremor request'); */
                                $log.debug('Looks like this is a tremor request');
                                return false;
                            }
                        });
                        return messageListQuery;
                    }, 1500);
                } // end of else is group chat
            }, 500);
        };

    this.pushChatSession = function(chatSession, contact, scope) { // nameRef.child('first').set('Fred');
        if (angular.isUndefined(chatSession.session_key)) {
            chatSession = null;
            return false;
        }
        if (contact === false) {
            if (chatSession.isGroupChat === true && that.active_sessions[chatSession.session_key] !== true && !(angular.equals(that._last_pushed_session, chatSession.session_key))) {
                that._last_pushed_session = chatSession.session_key;
                that.active_sessions[chatSession.session_key] = true;
                var group_session_info = {
                    directoryChat: chatSession.isDirectoryChat,
                    groupChat: chatSession.isGroupChat,
                    isOpen: contact.isOpen || true,
                    isSound: chatSession.isSound,
                    'session_key': chatSession.session_key,
                    name: chatSession.chat_description,
                    admin: chatSession.admin,
                    'time': chatSession.time
                };
                that._active_sessions_user_location.child(chatSession.session_key).update(group_session_info);
                $timeout(function() {
                    if (chatSession.isTextFocus && that.active_chats.length >= scope.max_count) {
                        scope.temp_chat = that.active_chats[scope.max_count - 1];
                        that.active_chats[scope.max_count - 1] = chatSession;
                        that.active_sessions[that.active_chats[scope.max_count - 1].session_key] = true;
                        that.active_chats.push(scope.temp_chat);
                    } else {
                        that.active_chats.push(chatSession);
                        scope.checkForTopic(chatSession);
                        that.active_sessions[that.active_chats[that.active_chats.length - 1].session_key] = true;
                    }
                    $timeout(function() {
                        if (!(that._is_playing_sound) && (chatSession.time + 5000) > new Date().getTime()) {
                            if (scope.is_external_window.$value && scope.isExternalInstance === false) { /*                              console.log('Blocked SOund'); */ } else {
                                NotificationService.__playSound(NotificationService._new_chat);
                            }
                            $timeout(function() {
                                that._last_pushed_session = null;
                                chatSession.loading = false;
                            }, 500);
                        }
                        chatSession.allowTopic = true;
                    }, 500);
                }, 1000);
            } else {
                $log.debug("Chat Session is already active / not group chat");
            }
            $timeout(function() {
                scope.resetTyping(chatSession);
                scope.checkForTopic(chatSession);
            }, 200);
        } else {
            if (that.active_sessions[CoreConfig.common.reference.user_prefix + contact.user_id] !== true && !(angular.equals(contact.user_id, that._last_pushed_session))) {
                that._last_pushed_session = contact.user_id; /*              console.log('last_pushed was set as ' + chatSession.contact_id); */
                var contact_info = {
                    avatar: contact.avatar,
                    groupChat: chatSession.isGroupChat,
                    'session_key': chatSession.session_key,
                    isOpen: chatSession.isopen || true,
                    isSound: chatSession.isSound || true,
                    name: contact.name,
                    user_id: contact.user_id,
                    time: chatSession.time
                };
                that._active_sessions_user_location.child(contact.user_id).update(contact_info);
                that.active_sessions[CoreConfig.common.reference.user_prefix + contact.user_id] = true;
                if (scope.layout === 2 && chatSession.isopen === false) {
                    chatSession.isopen = true;
                    $timeout(function() {
                        chatSession.isopen = false;
                        that._active_sessions_user_location.child(contact.user_id).update({
                            isOpen: false
                        });
                    }, 500);
                }
                if (scope.layout != 2) {
                    if (chatSession.isTextFocus) {
                        that.active_chats.unshift(chatSession); /*                      console.log('inital push'); */
                        scope.safeApply(function() {
                            $timeout(function() {
                                scope.setDirectoryChat(0, true);
                            }, 50);
                        });
                    } else {
                        that.active_chats.push(chatSession); /*                         document.getElementById('chat-module-queue-content').scrollTo(null,0); */
                    }
                } else if (scope.layout === 2 && chatSession.isTextFocus && that.active_chats.length >= scope.max_count) {
                    scope.temp_chat = that.active_chats[scope.max_count - 1];
                    that.active_chats[scope.max_count - 1] = chatSession;
                    that.active_chats.push(scope.temp_chat);
                    scope.temp_chat = null;
                } else {
                    that.active_chats.push(chatSession);
                }
                scope.checkForTopic(chatSession);
                if (!(that._is_playing_sound) && (chatSession.time_reference + 5000) > new Date().getTime()) {
                    NotificationService.__playSound(NotificationService._new_chat);
                }
            } else { /*                 console.log( "Chat Session is already active" ); */
                $log.debug("Chat Session is already active");
            }
        }
    };
    return this;
}]);
