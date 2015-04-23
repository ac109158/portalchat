'use strict'; /* Factories */
angular.module('portalchat.core').
service('ChatBuilder', ['$rootScope', '$log', '$http', '$document', '$timeout', '$firebaseObject', 'CoreConfig', 'UserManager', 'ChatStorage', 'SessionsManager', function($rootScope, $log, $http, $document, $timeout, $firebaseObject, CoreConfig, UserManager, ChatStorage, SessionsManager) {
    var that = this;

    this.setDefaultChatSettings = function(chat) {

        chat.session_key = '';

        chat.fb = {};
        chat.fb.location = {};
        chat.fb.target = {};

        chat.contacts = {};
        chat.contacts.active_list = [];
        chat.contacts.active_list_map = [];
        chat.contacts.participated_list = [];
        chat.contacts.details = [];
        chat.contacts.detailsMap = {};

        chat.message = {};
        chat.message.text = '';


        chat.messages = {};
        chat.messages.list = [];
        chat.messages.listMap = [];

        // topic values
        chat.topic = {};
        chat.topic.description = '';
        chat.topic.height = 0;
        chat.topic.truncated = false;
        chat.topic.set = '';
        //tagging

        chat.tag = {};
        chat.tag.description = '';
        chat.tag.set = '';
        // on the bubble

        //scroll control
        chat.scroll = {};
        chat.scroll.to_bottom = true;
        chat.scroll.to_top = false;
        //chat refernencing
        chat.reference = {};
        chat.reference.active = false;
        chat.reference.author = null;
        chat.reference.name = null;
        chat.reference.text = null;
        //typing presence
        chat.typing = {};
        chat.typing.monitor = that.is_typing_presence; // this is used to turn chat typing presence on or off
        chat.typing.active = false; // this is used to alert the contact if the user is currently typing
        chat.typing.active_list = [];
        //adding another user

        chat.invite = {};
        chat.invite.contact = ''; // this is used the track the name of the user that is to be invited into the group chat. .ie a string such as "Andy Cook";
        chat.invite.set_contact = false; // this flag is used to determine that the host user has selected  a name to invite into the chat and that name has been verified to exist within the invite_list
        //states

        chat.attr = {};
        chat.attr.is_converted = false;
        chat.attr.is_directory_chat = false;
        chat.attr.is_group_chat = false;
        chat.attr.is_new_message = false;
        chat.attr.is_open = true;
        chat.attr.is_previous_messages = true;
        chat.attr.is_reloading = false;
        chat.attr.is_reloaded = false;
        chat.attr.is_sound = true;
        chat.attr.is_tag_focus = false;
        chat.attr.is_text_focus = false;
        chat.attr.is_topic_focus = false;
        chat.attr.is_top_spacer = false;
        // priority/indexing

        chat.priority = {};
        chat.priority.first = false;
        chat.priority.next = 1;




        chat.ux = {};
        chat.ux.nudge = false;
        chat.ux.is_header = true;
        chat.ux.header_color = CoreConfig.chat.ui.header_color;
        chat.ux.topic_height = 0;
        chat.ux.time_reference = new Date().getTime();
        chat.ux.time_format = 'timeago';
        chat.ux.unread = 0; // this tracks the count of the messages sent to the user while the chat box is closed
        chat.ux.resize_adjustment = 0;
        chat.ux.internal_reference = CoreConfig.chat.internal_reference;
        chat.ux.header_color = that._header_color; // default color to restore after a alert changes has happened

        chat.menu = {};
        chat.menu.options = false;
        chat.menu.tag = false;
        chat.menu.topic = false;
        chat.menu.emoticons = false; // toggle flag tht determines if the emotion dox should be displayed to the user
        chat.menu.user_list = false;
        chat.menu.image = false;
        chat.menu.audio = false;
        chat.menu.video = false;
        chat.menu.media = false;
        chat.menu.invite = false; // this is used to toggle ability to invite user into the chat

        chat.user = {};
        chat.user.avatar = UserManager.user.avatar;
        chat.user.id = UserManager.user.id;
        chat.user.self_name = that._self_reference; // variable for what the chat session should label messages that came from the user/self ex. "Me"

        chat.contact = {};
        chat.contact.avatar = '';
        chat.contact.id = false;

        chat.interval = {};
        chat.interval.invite_menu_close = undefined;

        return;
    };

    this.resetCommonDefaultSettings = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isDefined(ChatStorage[type].chat.list[session_key].interval.invite_menu_close)) {
                clearInterval(ChatStorage[type].chat.list[session_key].interval.invite_menu_close);
            }
            ChatStorage[type].chat.list[session_key].attr.is_new_message = false;
            ChatStorage[type].chat.list[session_key].attr.is_text_focus = false;
            ChatStorage[type].chat.list[session_key].attr.is_tag_focus = false;
            ChatStorage[type].chat.list[session_key].attr.is_topic_focus = false;
            ChatStorage[type].chat.list[session_key].attr.is_top_spacer = false;

            ChatStorage[type].chat.list[session_key].menu.tag = false;
            ChatStorage[type].chat.list[session_key].menu.topic = false;
            ChatStorage[type].chat.list[session_key].menu.emoticons = false;
            ChatStorage[type].chat.list[session_key].menu.options = false;
            ChatStorage[type].chat.list[session_key].menu.profile = false;
            ChatStorage[type].chat.list[session_key].menu.user_list = false;

            ChatStorage[type].chat.list[session_key].ux.header_color = CoreConfig.chat.ui.header_color;
            ChatStorage[type].chat.list[session_key].ux.nudge = false;
            ChatStorage[type].chat.list[session_key].ux.unread = 0;


            ChatStorage[type].chat.list[session_key].invite.show = false;
            ChatStorage[type].chat.list[session_key].invite.contact = '';
            ChatStorage[type].chat.list[session_key].invite.set_contact = false;

            ChatStorage[type].chat.list[session_key].reference.active = false;
            ChatStorage[type].chat.list[session_key].reference.author = null;
            ChatStorage[type].chat.list[session_key].reference.name = null;
            ChatStorage[type].chat.list[session_key].reference.text = null;


            if (angular.isDefined(ChatStorage[type].chat.list[session_key].fb.target.topic)) {
                if (ChatStorage[type].chat.list[session_key].fb.target.topic) {
                    ChatStorage[type].chat.list[session_key].attr.topic_height = 0;
                } else {
                    ChatStorage[type].chat.list[session_key].attr.topic_height = $document.getElementById('topic_' + session_key + '_wrapper').clientHeight || 0;
                }
            }
        }
    };

    this.getChatType = function(session_key) {
        if (parseInt(session_key) > 0) {
            return 'contact';
        }
        return 'directory';
    };
    this.isContactChat = function(session_key) {
        if (parseInt(session_key) > 0) {
            return true;
        }
        return false;
    };

    this.toggleChatAttr = function(type, session_key, attr, value, fb_sync) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && ChatStorage[type].chat.list[session_key].attr && angular.isDefined(ChatStorage[type].chat.list[session_key].attr[attr]) && angular.isDefined(value)) {
            ChatStorage[type].chat.list[session_key].attr[attr] = value;
            if (fb_sync) {
                SessionsManager.updateSessionDetail(session_key, attr, value);
            }
        }
    };

    this.showContactChatTagInput = function(session_key) {
        that.resetCommonDefaultSettings('contact', session_key);
        $timeout(function() {
            that.toggleChatAttr('contact', session_key, 'is_tag_option', true, false);
            that.toggleChatAttr('contact', session_key, 'is_tag_focus', true, false);
            that.toggleChatAttr('contact', session_key, 'is_top_spacer', true, false);
        });
    };

    this.updateContactChatTag = function(session_key, fb_sync) {
        if (ChatStorage.contact.chat.list[session_key]) {
            if (angular.isDefined(ChatStorage.contact.chat.list[session_key].tag.description) && ChatStorage.contact.chat.list[session_key].tag.description.length > 2 && ChatStorage.contact.chat.list[session_key].tag.description.length <= 20) {
                that.resetCommonDefaultSettings('contact', session_key);
                ChatStorage.contact.chat.list[session_key].tag_description = String(ChatStorage.contact.chat.list[session_key].tag_description).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
                if (ChatStorage.contact.chat.list[session_key].attr.is_group_ChatStorage.contact.chat.list[session_key]) {
                    ChatStorage.contact.chat.list[session_key].tag.description = 'Group - #' + ChatStorage.contact.chat.list[session_key].tag.description;
                } else {
                    ChatStorage.contact.chat.list[session_key].tag.description = '#' + ChatStorage.contact.chat.list[session_key].tag.description;
                }
                ChatStorage.contact.chat.list[session_key].tag.active = ChatStorage.contact.chat.list[session_key].tag.description;
                ChatStorage.contact.chat.list[session_key].tag.description = '';
                ChatStorage.contact.chat.list[session_key].attr.is_text_focus = true;
                if (fb_sync) {
                    SessionsManager.updateSessionDetail(session_key, 'tag', ChatStorage.contact.chat.list[session_key].tag.active);
                }
            }
        }
        return false;
    };

    this.toggleChatTopicDisplay = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (ChatStorage[type].chat.list[session_key].fb.target.topic.length > 30) {
                ChatStorage[type].chat.list[session_key].topic.truncated = !ChatStorage[type].chat.list[session_key].topic.truncated;
            }
            $rootScope.evalAsync(function() {
                that.setChatTopicHeight(type, session_key);
            });
        }
    };

    this.setChatTopicHeight = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (ChatStorage[type].chat.list[session_key].fb.target.topic) {
                ChatStorage[type].chat.list[session_key].topic.height = $document.getElementById('topic_' + session_key + '_wrapper').clientHeight;
            } else {
                ChatStorage[type].chat.list[session_key].topic.height = 0;
            }
        }
    };

    this.addChatTopic = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            /*      console.log('adding topic'); */
            if (angular.isDefined(ChatStorage[type].chat.list[session_key].topic.description) && ChatStorage[type].chat.list[session_key].topic.description.length > 5 && ChatStorage[type].chat.list[session_key].topic.description.length <= 36) {
                if (angular.isDefined(ChatStorage[type].chat.list[session_key].fb.location.session)) {
                    ChatStorage[type].chat.list[session_key].fb.location.session.update({
                        topic: ChatStorage[type].chat.list[session_key].topic.description
                    });
                }
                that.resetCommonDefaultSettings(type, session_key);
                that.toggleChatAttr(type, session_key, 'is_text_focus', true, false);
                return true;
            }
        }
        return false;
    };

    this.removeChatTopic = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isDefined(ChatStorage[type].chat.list[session_key].fb.location.session)) {
                ChatStorage[type].chat.list[session_key].fb.location.session.update({
                    topic: false
                });
                ChatStorage[type].chat.list[session_key].topic.description = '';
                ChatStorage[type].chat.list[session_key].topic.height = 0;
                ChatStorage[type].chat.list[session_key].topic.set = false;
                ChatStorage[type].chat.list[session_key].menu.topic = false;
            }
        }
    };

    this.toggleChatMenu = function(type, session_key, menu) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && ChatStorage[type].chat.list[session_key].menu && angular.isDefined(ChatStorage[type].chat.list[session_key].menu[menu])) {
            if (!ChatStorage[type].chat.list[session_key].attr.is_open) {
                ChatStorage[type].chat.list[session_key].attr.is_open = true;
            }
            ChatStorage[type].chat.list[session_key].menu[menu] = !ChatStorage[type].chat.list[session_key].menu[menu];
        }
    };

    this.buildChatSession = function(session) // this function builds out the details of an individual chat sesssion
        {
            if (angular.isUndefined(session)) {
                ///////////////////////////////////////////////////////////
                $log.debug('that.__buildChatSession failed. Undefined session');
                ////////////////////////////////////////////////////////////
                return false;
            }
            var chat_session = {};


            that.__setDefaultSettings(chat_session);
            that.__retrieveSessionKey(chat_session, session.contact); // establish a unique session key for this chat
            if (angular.isDefined(session.contact.time)) {
                $log.debug('Setting session time. ' + session.contact.time);
                chat_session.time = session.contact.time;
            } else {
                var d = new Date();
                chat_session.time = d.getTime();
                $log.debug('Creating new time stamp:  ' + chat_session.time);
            }
            if (angular.isDefined(session.contact.admin)) {
                $log.debug('Setting session admin. Should be an user_id ' + session.contact.admin);
                chat_session.admin = session.contact.admin;
            } else {
                $log.debug('Setting session admin as self:  ' + UserManager.user.id);
                chat_session.admin = UserManager.user.id;
            }
            if (angular.isDefined(session.is_open)) // this flag controls whether the chatbox should be open when it is created. Useful to close page reloads chat_sessions so the messages can gracefully load
            {
                chat_session.isopen = session.is_open;
            }
            if (angular.isDefined(session.contact.resize_adjust)) // this flag loads any  previous resize adjustments
            {
                chat_session.resize_adjustment = session.contact.resize_adjust;
            }
            if (angular.isDefined(session.contact.name)) {
                chat_session.contact_name = session.contact.name; // used at the top of the chat box
                var name_split = session.contact.name.match(/\S+/g); // splits the contacts first and last name
                chat_session.contact_f_name = name_split[0]; // used to display only  the contacts first_name next to the chat message
            }
            if (angular.isDefined(session.is_focus)) {
                chat_session.is_text_focus = session.is_focus; // used at the top of the chat box
            } else {
                chat_session.is_text_focus = false;
            }
            if (angular.isDefined(session['groupChat'])) { // jshint ignore:line
                chat_session.is_group_chat = session['groupChat']; // jshint ignore:line
            }
            if (angular.isDefined(session.contact.is_sound) && session.contact.is_sound !== null) {
                chat_session.is_sound = session.contact.is_sound;
            }
            if (angular.isDefined(session.contact.tag)) {
                chat_session.tag = session.contact.tag;
            }
            if (angular.isDefined(session.contact.index_position)) {
                chat_session.index_position = session.contact.index_position;
            }
            chat_session.fb.location.session = that.__setActiveSessionLocation(session.contact.user_id, false); // used to see if the chat is turned into a group chat by some adding someone
            chat_session.fb.target.topic = $firebaseObject(chat_session.fb.location.session.child('topic'));
            // define to user info and firebase  connections
            chat_session.user_log[session.contact.user_id] = {
                avatar: session.contact.avatar,
                name: session.contact.name,
                user_id: session.contact.user_id
            };
            chat_session.contact_role = session.contact.role;
            chat_session.contact_id = session.contact.user_id;
            chat_session.contact_avatar = session.contact.avatar;
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
            chat_session.user_id = UserManager.user.id;
            chat_session.user_avatar = UserManager._user_profile.avatar;
            chat_session.user_message_location = that.__returnFromUserMessageLocation(); // firebase location of the from_user/self, so we know where to write chat message for this chat session.
            chat_session.user_online = UserManager.__setProfileOnlineLocationforUser(UserManager.user.id);
            chat_session.user_chat_presence = UserManager.__setChatPresenceforUser(UserManager.user.id);
            chat_session.active_typing_user_location = that.__set_active_typing_user_location(); // this is a fireabse folder location where other users write true under their own uid to let the user know that they are typing
            chat_session.active_typing_user_location.update({
                'is-typing': false
            });
            chat_session.active_typing_user_location.onDisconnect().remove();
            chat_session.active_typing_user_socket = that.__set_active_typing_user_socket(); // this is a fireabse folder location where other users write true under their own uid to let the user know that they are typing
            chat_session.user_log[UserManager.user.id] = {
                avatar: UserManager._user_profile.avatar,
                name: UserManager._user_profile.name,
                user_id: UserManager.user.id
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
                            groupChatSession.participant_log['user_' + user.user_id] = user.name;
                            if (user.user_id != UserManager.user.id) {
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
                            if (user.user_id != UserManager.user.id) {
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
                if (snapshot.name() === UserManager.user.id) {
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
                if (data.user_id === UserManager.user.id) {
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
                    if (data.user_id != UserManager.user.id) {
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
            groupChatSession.admin = UserManager.user.id;
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
                                    groupChatSession.participant_log['user_' + user.user_id] = user.name;
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
                                        groupChatSession.participant_log['user_' + user.user_id] = user.name; /*                                    groupChatSession.firebase_location.child('active-users').child(key).update(val); */
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
                                groupChatSession.participant_log['user_' + user.user_id] = user.name;
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
                                if (user.user_id != UserManager.user.id) {
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
                if (data.user_id != UserManager.user.id) {
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
    return this;
}]);
