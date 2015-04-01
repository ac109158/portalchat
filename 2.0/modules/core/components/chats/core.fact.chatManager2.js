angular.module('portalchat.core').
service('ChatManager2', ['$rootScope', '$timeout','$window', '$log', '$firebaseObject', 'CoreConfig', 'UserManager', 'NotificationService', function($rootScope, $timeout, $window, $log, $firebaseObject, CoreConfig, UserManager, NotificationService) {
    var that = this;
    this.is_typing_presence = CoreConfig.is_typing_presence;
    this.is_playing_sound = false;

    this.active_chats = [];

    this.active_sessions = [];

    this.new_session_key = undefined;

    this.fb = {};
    this.fb.chat = {};
    this.fb.chat.locations = {};
    this.fb.chat.locations.session = {};

    this.fb.group_chat = {};
    this.fb.group_chat.locations = {};
    this.fb.group_chat.locations.session = {};


    this.retrieveSessionKey = function(chatSession, contact) {
        if (that.active_sessions[CoreConfig.default.user_tag + contact.user_id] === true) {
            $log.debug('Failure : Session Key denied');
            return false;
        }
        var contact_session_key;
        chatSession.contact_session_location = new Firebase(CoreConfig.chat.url_root + contact.user_id + '/' + CoreConfig.session.root_reference + CoreConfig.user.id + '/' + 'session_key/');
        chatSession.contact_session_location.on('value', function(snapshot) {
            if (angular.isDefined(snapshot.val())) {
                that.updateSessionStatus(scope, snapshot, chatSession.contact_session_location, chatSession.index_position, chatSession.isGroupChat);
            }
        });
        if (angular.isUndefined(contact.session_key) || contact.session_key === null) {
            chatSession.contact_session_location.once('value', function(snapshot) {
                if (snapshot.val() === null) {
                    var user_id = UserManager._user_profile.user_id;
                    var firekey = that._group_active_session_location.push({
                        admin: UserManager._user_profile.user_id,
                        topic: false
                    });
                    that.new_session_key = firekey.name();
                } else {
                    that.new_session_key = snapshot.val();
                }
            });
        } else {
            chatSession.session_key = contact.session_key;
        }
    };

    this.updateSessionStatus = function(data, location, index_position, isGroupChat) // listen for a change to a existing chat session
    {
        var index = null;
        var chat_log;
        if (angular.isDefined(index_position) && angular.isDefined(that.active_chats[index_position])) {
            if (isGroupChat) {
                if (that.active_chats[index_position].session_key === location.parent().parent().parent().name()) {
                    index = data.index_position;
                }
            } else {
                if (that.active_chats[index_position].contact_id === location.parent().parent().parent().name()) {
                    index = data.index_position;
                }
            }
        }
        if (index === null) {
            chat_log = [];
            angular.forEach(that.active_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                if (angular.isDefined(value.contact_id)) {
                    this.push(value.contact_id);
                } else {
                    this.push(value.session_key);
                }
            }, chat_log);
            index = chat_log.indexOf(location.parent().parent().parent().name());
        }
        if (index > -1) {
            $log.debug('To user session key has changed to : ' + data.val());
            that.active_chats[index].contact_session = data.val();
        } else {
            $log.debug(location.parent().parent().parent().name() + ' was not in ' + angular.toJson(chat_log));
        }
    };
    this.retrieveUsersLocation = function(session_key) {
        return that._new_session_location.child(that._group_active_users_reference);
    };
    this.retrieveUsersFiresocket = function(session_key) {
        if (session_key === that._new_session_key) {
            return $firebase(that._new_session_user_location.child(that._group_active_users_reference));
        }
    };
    this.returnChatPresenceStates = function() // this function provides the caller with the predefined states that are available
    {
        return this._chat_presence_states;
    };
    this.storeToUser = function(contact) // this function is called whenever connections need to be created to a user
    {
        $log.debug('Storing To User:' + angular.toJson(contact));
        that._contact = {};
        that._contact._user_id = contact.user_id;
        that._contact._name = contact.name;
        that._contact._avatar = contact.avatar;
    };
    this.set_active_sessions_user_location = function() // this function is an initial process that looks at any existing objects in the users active session folder location and will generate new chat sessions for each of them, then well go inactive.
    {
        that._active_sessions_user_location = null;
        that.active_sessions = Array();
        that.active_chats = Array();
        that._active_sessions_user_location = new Firebase(that._url_root + CoreConfig.user.id + '/' + that._active_session_reference);
        that._active_sessions_user_location.on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
        {
            var data = snapshot.val();
            if (angular.isUndefined(snapshot)) {
                $log.debug('New chat session detected -> Undefined');
                return false;
            } else if (angular.isUndefined(data.user_id) && angular.isUndefined(data.session_key)) {
                $log.debug('Rejected: ' + angular.toJson(data));
                return false;
            } else if (that.active_sessions['user_' + String(data.user_id)] === true || that.active_sessions[String(data.session_key)] === true) {
                $log.debug('Chat Session has already been created');
                return false;
            } else {
                $log.debug('New chat session detected after sessions established -> create');
                if (data.directoryChat) {
                    scope.getDirectoryChat(data.session_key);
                } else {
                    that.__requestChatSession(scope, data, false);
                }
            }
        });
    };
    this.requestChatSession = function(scope, contact, isfocus) {
        var index;
        $log.debug('Requesting chat session');
        if (!(UtilityService.firebase_connection)) {
            $log.debug('Request Denied: Firebase is Offline');
            return false;
        } else if (scope.requested_chat === contact.user_id || scope.requested_chat === contact.session_key) {
            $log.debug('This appears to be a duplicate rquest, return false'); /*           console.log('requested: ' + scope.requested_chat + ' contact.user_id: ' + contact.user_id); */
            scope.requested_chat = false;
            return false;
        }
        if (angular.isDefined(contact.groupChat) && contact.groupChat === true && angular.isDefined(contact.session_key)) {
            scope.requested_chat = contact.session_key;
            if (that.active_sessions[contact.session_key] === true && angular.isDefined(that.active_chats)) {
                $log.debug('Chat Session already exists in active_sessions');
                angular.forEach(that.active_sessions, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                    this.push(value.key);
                }, chat_log);
                index = chat_log.indexOf(contact.session_key);
                if (scope.layout != 2) {
                    scope.setDirectoryChat(index, true);
                } else {
                    that.active_chats[index].isopen = true;
                    that.active_chats[index].isTextFocus = true;
                }
                return false;
            } /*            console.log('building as group chat'); */
            that.__buildGroupChatSession(scope, contact, contact.isOpen || true, isfocus, 1); // function(scope, value, isopen, isfocus)
            return true;
        } else {
            scope.requested_chat = contact.user_id;
            if (angular.isUndefined(contact) || contact.user_id === UserManager._user_profile.user_id) {
                $log.debug('Chat session denied - undefined/self');
                return false;
            } else if (angular.isDefined(contact.user_id) && that.active_sessions['user_' + contact.user_id] === true) {
                $log.debug('This chat shows as registered');
                var chat_log = [];
                angular.forEach(that.active_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                    if (angular.isDefined(value.contact_id)) {
                        this.push(value.contact_id);
                    } else {
                        this.push(value.session_key);
                    }
                }, chat_log);
                index = chat_log.indexOf(contact.user_id);
                if (angular.isDefined(that.active_chats[index]) && that.active_chats[index].contact_id === contact.user_id) {
                    $log.debug('Chat is already in the list of active chats');
                    $log.debug(angular.toJson(chat_log));
                    if (scope.layout != 2) {
                        scope.safeApply(function() {
                            $timeout(function() {
                                scope.setDirectoryChat(index, true);
                            }, 50);
                        });
                    } else if (scope.layout === 2 && that.active_chats[index].index_position >= scope.max_count) {
                        scope.swapChatPositions(that.active_chats[index].index_position, scope.max_count - 1);
                        that.__setLastPushed(that.active_chats[scope.max_count - 1].contact_id);
                        that.active_chats[scope.max_count - 1].isopen = true;
                        that.active_chats[scope.max_count - 1].isTextFocus = true;
                    } else {
                        that.active_chats[index].isopen = true;
                        that.active_chats[index].isTextFocus = true;
                        that.__setLastPushed(that.active_chats[index].contact_id);
                    }
                    $timeout(function() {
                        if (!(that._is_playing_sound)) {
                            NotificationService.__playSound(NotificationService._new_chat);
                        }
                    }, 250);
                    return true;
                }
                return false;
            }
            $log.debug('all checks passed, build chat');
            that.__buildChatSession(scope, contact, contact.isOpen, isfocus, 14); // (scope, contact, isopen, isfocus)
            return true;
        }
    };
    this.setDefaultSettings = function(chat) {
        chat.user_log = {}; //used to track users if this is a group chat
        chat.user_details = {};
        chat.participant_log = Array(); // this is used to include everyone that particpated in a chat receipt
        chat.is_typing_list = Array();
        chat.chats = Array(); // this is where each chat message will be stored
        chat.chat_log = Array();
        chat.group_chats = Array(); // this is where each chat message will be stored
        chat.group_chat_log = Array(); // this is used to store the user_id of each chat message, it gives the ability to determine the length of each chat, last active user, and is also used for conditional formating in the chat view ex. ['82, 63, 63, 63, 82, 82'];
        // topic values
        chat.isTopicFocus = false;
        chat.topic_description = '';
        chat.topic_height = 0;
        chat.isTopicTruncated = false;
        //tagging
        chat.tag_description = '';
        chat.tag = false;
        // on the bubble
        chat.isHeader = true;
        //scroll control
        chat.scroll_bottom = true;
        chat.scroll_top = false;
        //chat refernencing
        chat.reference = null;
        chat.referenceAuthor = null;
        chat.referenceName = null;
        chat.referenceText = null;
        //typing presence
        chat.isTypingPresence = that._is_typing_presence; // this is used to turn chat typing presence on or off
        chat.isTyping = false; // this is used to alert the other user is the user is currently typing
        //adding another user
        chat.invite = false; // this is used to toggle ability to invite user into the chat
        chat.invited = ''; // this is used the track the name of the user that is to be invited into the group chat. .ie a string such as "Andy Cook";
        chat.invitee_set = false; // this flag is used to determine that the host user has selected  a name to invite into the chat and that name has been verified to exist within the invite_list
        //states
        chat.isNewMessage = false;
        chat.reload = false;
        chat.reloaded = false;
        // priority/indexing
        chat.first_priority = false;
        chat.next_priority = 1;
        chat.isMorePrev = true;
        //display flags
        chat.isTopSpacer = false;
        chat.isopen = true;
        chat.isSound = true;
        chat.isGroupChat = false;
        chat.showUserList = false;
        chat.showUserOptions = false;
        chat.emotions = false; // toggle flag tht determines if the emotion dox should be displayed to the user
        // internal values
        chat.addVideo = false;
        chat.addImage = false;
        chat.addAudio = false;
        chat.nudge = false;
        chat.resize_adjustment = 0;
        chat.chat_text = null;
        chat.self_name = that._self_reference; // variable for what the chat session should label messages that came from the user/self ex. "Me"
        chat.header_color = that._header_color;
        chat.time_reference = new Date().getTime();
        chat.time_format = 'timeago';
        chat.convert = false;
        chat.unread = 0; // this tracks the count of the messages sent to the user while the chat box is closed
        chat.group_count = 0;
        chat.user_avatar = UserManager._user_profile.avatar;
        chat.user_id = UserManager._user_profile.user_id;
        chat.header_color = that._header_color; // default color to restore after a alert changes has happened
        chat.internal_reference = that._internal_reference;
        chat.isTextFocus = false;
        chat.isTagFocus = false;
        chat.isTopicFocus = false;
        chat.isDirectoryChat = false;
        return;
    };
    this.buildChatSession = function(scope, contact, isopen, isfocus, store_length) // this function builds out the details of an individual chat sesssion
    {
        if (angular.isUndefined(scope) || angular.isUndefined(contact)) {
            ///////////////////////////////////////////////////////////
            $log.debug('that.__buildChatSession failed. Undefined scope/contact');
            ////////////////////////////////////////////////////////////
            return false;
        }
        var chatSession = {};
        that.__setDefaultSettings(chatSession);
        that.__retrieveSessionKey(scope, chatSession, contact); // establish a unique session key for this chat
        if (angular.isDefined(contact.time)) {
            $log.debug('Setting session time. ' + contact.time);
            chatSession.time = contact.time;
        } else {
            var d = new Date();
            chatSession.time = d.getTime();
            $log.debug('Creating new time stamp:  ' + chatSession.time);
        }
        if (angular.isDefined(contact.admin)) {
            $log.debug('Setting session admin. Should be an user_id ' + contact.admin);
            chatSession.admin = contact.admin;
        } else {
            $log.debug('Setting session admin as self:  ' + UserManager._user_profile.user_id);
            chatSession.admin = UserManager._user_profile.user_id;
        }
        if (angular.isDefined(isopen)) // this flag controls whether the chatbox should be open when it is created. Useful to close page reloads chatSessions so the messages can gracefully load
        {
            chatSession.isopen = isopen;
        }
        if (angular.isDefined(contact.resize_adjust)) // this flag loads any  previous resize adjustments
        {
            chatSession.resize_adjustment = contact.resize_adjust;
        }
        if (angular.isDefined(contact.name)) {
            chatSession.contact_name = contact.name; // used at the top of the chat box
            var name_split = contact.name.match(/\S+/g); // splits the contacts first and last name
            chatSession.contact_f_name = name_split[0]; // used to display only  the contacts first_name next to the chat message
        }
        if (angular.isDefined(isfocus)) {
            chatSession.isTextFocus = isfocus; // used at the top of the chat box
        } else {
            chatSession.isTextFocus = false;
        }
        if (angular.isDefined(contact['groupChat'])) {         // jshint ignore:line
            chatSession.isGroupChat = contact['groupChat'];         // jshint ignore:line
        }
        if (angular.isDefined(contact.isSound) && contact.isSound !== null) {
            chatSession.isSound = contact.isSound;
        }
        if (angular.isDefined(contact.tag)) {
            chatSession.tag = contact.tag;
        }
        if (angular.isDefined(contact.index_position)) {
            chatSession.index_position = contact.index_position;
        }
        chatSession.active_session_location = that.__setActiveSessionLocation(scope, contact.user_id, false); // used to see if the chat is turned into a group chat by some adding someone
        chatSession.topic_location = $firebase(chatSession.active_session_location.child('topic'));
        // define to user info and firebase  connections
        chatSession.user_log[contact.user_id] = {
            avatar: contact.avatar,
            name: contact.name,
            user_id: contact.user_id
        };
        chatSession.contact_role = contact.role;
        chatSession.contact_id = contact.user_id;
        chatSession.contact_avatar = contact.avatar;
        that.__setToUserChatPresenceLocation(chatSession,contact); // also sets the contact info, so must be called firest // fetches the contact chat state .. active, offline, busy, etc
/*      chatSession.contact_chat_presence = that.__setToUserChatPresence(contact); // also sets the contact info, so must be called firest // fetches the contact chat state .. active, offline, busy, etc */
        chatSession.contact_message_location = that.__returnToUserMessageLocation(); // firebase location of the to user, so we know where to write chat message for this chat session.
        chatSession.active_typing_contact_location = that.__set_active_typing_contact_location(); // firebase folder that is written true whenever the user is typing
        chatSession.active_typing_contact_location.update({
            'is-typing': false
        });
        chatSession.active_session_contact_location = that.__set_active_session_contact_location(); // firebase folder that the service writes the to users info into , so the the contact knows that there is a chat going on between them
        chatSession.contact_online = UserManager.__setProfileOnlineLocationforUser(contact.user_id);
        // define user info and firebse connections
        chatSession.user_id = UserManager._user_profile.user_id;
        chatSession.user_avatar = UserManager._user_profile.avatar;
        chatSession.user_message_location = that.__returnFromUserMessageLocation(scope); // firebase location of the from_user/self, so we know where to write chat message for this chat session.
        chatSession.user_online = UserManager.__setProfileOnlineLocationforUser(UserManager._user_profile.user_id);
        chatSession.user_chat_presence = UserManager.__setChatPresenceforUser(UserManager._user_profile.user_id);
        chatSession.active_typing_user_location = that.__set_active_typing_user_location(scope); // this is a fireabse folder location where other users write true under their own uid to let the user know that they are typing
        chatSession.active_typing_user_location.update({
            'is-typing': false
        });
        chatSession.active_typing_user_location.onDisconnect().remove();
        chatSession.active_typing_user_socket = that.__set_active_typing_user_socket(scope); // this is a fireabse folder location where other users write true under their own uid to let the user know that they are typing
        chatSession.user_log[UserManager._user_profile.user_id] = {
            avatar: UserManager._user_profile.avatar,
            name: UserManager._user_profile.name,
            user_id: UserManager._user_profile.user_id
        };
        $timeout(function() {
            if (angular.isUndefined(chatSession.session_key)) {
                chatSession.session_key = scope.new_session_key;
            }
            chatSession.messageListQuery = that.__returnMessageListQuery(scope, chatSession.time, chatSession.user_message_location, that._contact._user_id, chatSession.isGroupChat, store_length); // this creates a query of the messages pointed at the from_user storage location , messages must be written in both the user and contact chatbox pointer locations
            // set pointer to user-group, used to remove the session if no one is longer using it
            var session_root = that._group_url_root + that._group_active_session_reference + chatSession.session_key + '/';
            chatSession.firebase_location = new Firebase(session_root);
            if (chatSession.topic_location.$value === null) {
                chatSession.firebase_location.update({
                    'topic': false
                });
            }
            chatSession.group_user_location = chatSession.firebase_location.child(that._group_active_users_reference);
            $log.debug('session_key is : ' + chatSession.session_key);
            that.__pushChatSession(chatSession, contact, scope); // pushes the chat session into the scope of the view
            /*          clearInterval(build_delay); */
        }, 500);
    };



    this.buildGroupChatSession = function(scope, value, isopen, isfocus, store_length) // this function builds out the details of an individual chat sesssion
    {
        $log.debug('building group chat');
        if (angular.isUndefined(scope) || angular.isUndefined(value.session_key) || angular.isUndefined(value.admin)) {
            ///////////////////////////////////////////////////////////
            $log.debug('that.__buildGroupChatSession failed. Undefined scope/session_key');
            ////////////////////////////////////////////////////////////
            return false;
        }
        var groupChatSession = {};
        that.__setDefaultSettings(groupChatSession);
        groupChatSession.session_key = value.session_key;
        groupChatSession.time = value.time;
        groupChatSession.isGroupChat = true;
        var session_root = that._group_url_root + that._group_active_session_reference + groupChatSession.session_key + '/';
        groupChatSession.firebase_location = new Firebase(session_root);
        groupChatSession.group_message_location = new Firebase(that._group_url_root + that._group_active_session_reference + groupChatSession.session_key + '/' + that._group_message_location_reference);
        groupChatSession.messageListQuery = that.__returnMessageListQuery(scope, groupChatSession.time, groupChatSession.group_message_location, groupChatSession.session_key, groupChatSession.isGroupChat, 1); // this creates a query of the messages pointed at the from_user storage location , messages must be written in both the user and contact chatbox pointer locations
        groupChatSession.active_session_location = that.__setActiveSessionLocation(null, groupChatSession.session_key, true);
        groupChatSession.group_active_typing_location = that.__set_active_typing_group_location(scope, groupChatSession.session_key); //point to where the typing-presence values will be stored
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
            groupChatSession.isTextFocus = isfocus;
        }
        if (angular.isDefined(value.isSound)) {
            groupChatSession.isSound = value.isSound;
        }
        if (angular.isDefined(value.tag)) {
            chatSession.tag = value.tag;
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
                    if (user.user_id != UserManager._user_profile.user_id) {
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
                    if (user.user_id != UserManager._user_profile.user_id) {
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
            if (snapshot.name() === UserManager._user_profile.user_id) {
                return;
            }
            scope.safeApply(function() {
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
            if (data.user_id === UserManager._user_profile.user_id)
            {
                if (scope.last_deactivated_chat !=  groupChatSession.session_key)
                {
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
                if (data.user_id != UserManager._user_profile.user_id) {
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
            groupChatSession.admin = UserManager._user_profile.user_id;
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
            groupChatSession.isTextFocus = chat.isTextFocus;
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
        groupChatSession.isGroupChat = true;
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
                            if (user.user_id != UserManager._user_profile.user_id) {
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
                if (data.user_id != UserManager._user_profile.user_id) {
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
    this.getLocationValue = function(location, scope) {
        if (angular.isUndefined(location)) {
            return false;
        }
        location.once('value', function(snapshot) {
            if (angular.isUndefined(snapshot)) {
                ////////////////////////////////////////////////////////////
                $log.debug("Failure: Something went wrong.");
                ////////////////////////////////////////////////////////////
            }
            scope.locationValue = snapshot.val();
        });
    };
    this.pushInternalMessage = function(display, msgText) {
        var element = document.createElement("div");
        element.appendChild(document.createTextNode(msgText));
        element.className = "cm-chat-internal-message text-muted";
        document.getElementById(display).appendChild(element);
    };
    that.__setSessionLocationforGroupInvitee = function(session_key, invitee) {
        var invitee_session_root = that._url_root + invitee + '/' + that._active_session_reference + session_key + '/';
        return new Firebase(invitee_session_root);
    };
    that.__setActiveSessionLocation = function(scope, contact, isGroupChat) // this function will detect if this chatSession gets changed to a group chat and will call the necessary functions
    {
        var active_session_root = that._url_root + CoreConfig.user.id + '/' + that._active_session_reference + contact + '/';
        var active_session_location = new Firebase(active_session_root);
        var index = null;
        var chat_log;
        if (isGroupChat === false) {
            active_session_location.on('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
            {
                if (snapshot.val() === null)
                {
                    var removed_index = -1;
                    angular.forEach(that.active_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                        if (value.contact_id === contact) {
                            removed_index = value.index_position;
                        }
                    });
                    if (removed_index > -1)
                    {
                        var removed_key = that.active_chats[removed_index].contact_id || that.active_chats[removed_index].session_key;
                        if (scope.last_deactivated_chat !=  removed_key)
                        {
                            scope.removeChatSession(that.active_chats[removed_index]);
                        }

                    }
                }
                if (angular.isUndefined(snapshot)) {
                    ////////////////////////////////////////////////////////////
                    $log.debug("Failure: Something went wrong.");
                    ////////////////////////////////////////////////////////////
                } else {
                    if (angular.isObject(snapshot.val())) {
                        var data = angular.fromJson(snapshot.val());
                        if (data.index_position > -1 && angular.isDefined(that.active_chats[data.index_position])) {
                            if (data.groupChat) {
                                if (data.user_id === that.active_chats[data.index_position].session_key) {
                                    index = data._index_position;
                                }
                            } else {
                                if (data.user_id === that.active_chats[data.index_position].contact_id) {
                                    index = data._index_position;
                                }
                            }
                        }
                        if (index === null) {
                            chat_log = [];
                            angular.forEach(that.active_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                                if (angular.isDefined(value.contact_id)) {
                                    this.push(value.contact_id);
                                } else {
                                    this.push(value.session_key);
                                }
                            }, chat_log);
                            index = chat_log.indexOf(data.user_id); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
                        }
                        if (angular.isDefined(that.active_chats[index])) {
                            if (that.active_chats[index].isGroupChat === false && data.groupChat === true) {
                                var new_group_chat = that.__convertToGroupChat(that.active_chats[index], index, scope, false);
                                if (new_group_chat === false) {
                                    $log.debug('Create new_group_chat failed');
                                    return false;
                                } else {
                                    $log.debug('new_group_chat was created');
                                    $log.debug(new_group_chat);
                                    that.active_chats[index].isGroupChat = data.groupChat;
                                }
                                //change the appearnace of this existing chatbox into a group chat box
                                if (angular.isDefined(data.index_position > 1 && that.active_chats[data.index_position]) && that.active_chats[data.index_position].contact_id === data.user_id) {
                                    index = data.index_position;
                                } else { /*                                     console.log(data.user_id + ' did not match ' + data.index_position); */
                                    chat_log = [];
                                    angular.forEach(that.active_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                                        this.push(value.contact_id);
                                    }, chat_log);
                                    index = chat_log.indexOf(data.user_id); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
                                }
                                if (index > -1) {
                                    var old_chat = that.active_chats[index];
                                    that.active_chats.splice(index, 1, new_group_chat);
                                    delete that.active_sessions['user_' + data.user_id];
                                    that.active_sessions[data.session_key] = true;
                                } else {
                                    scope.that.active_chats.push(new_group_chat);
                                    that.active_sessions[chat.session_key] = true;
                                }
                                $timeout(function() {
                                    that.__deactivate_session_from_user_location(old_chat, scope, false, false);
                                }, 500);
                            }
                            if (that.active_chats[index].isMuted === false && data.isMuted === true) {
                                that.active_chats[index].isMuted = true;
                            } else if (that.active_chats[index].isMuted === true && data.isMuted === false) {
                                that.active_chats[index].isMuted = false;
                            }

                            if (that.active_chats[index].nudge === false && data.nudge === true)
                            {
                                that.active_chats[index].nudge = true;

                                if (scope.layout != 2)
                                {
                                    scope.openChatModule();
                                    scope.setDirectoryChat(index, true);
                                    /*
var n = Firebase.ServerValue.TIMESTAMP;
                                    var chat_text = scope.to_trusted('<i class="fa fa-bolt fa-2x chat-nudge-icon"></i> You were just nudged by ' + that.active_chats[index].contact_f_name + ' <i class="fa fa-bolt fa-2x chat-nudge-icon"></i>');
                                    that.active_chats[index].chats.push({
                                        author: that._internal_reference,
                                        to: that.active_chats[index].session_key,
                                        text: chat_text,
                                        time: n,
                                        priority: -1,
                                        session_key: that.active_chats[index].session_key
                                    });
*/
/*                                  that.active_chats[index].chat_log.push(that._internal_reference); */
                                }
                                else
                                {
                                    scope.moveChatToFirst(index);
                                    that.active_chats[index].isopen = true;
                                }
                                $timeout(function(){
                                    NotificationService.__nudge(NotificationService._nudge);
                                }, 1500);

                                $timeout(function(){
                                    that._active_sessions_user_location.child(that.active_chats[index].contact_id).update({nudge:false});
                                },5000);
                            }
                        }
                    }
                    return true;
                }
            });
        }
        return active_session_location;
    };
    this.updateToUserActiveSession = function(chat) {
        chat.active_session_contact_location.update({
            admin: chat.admin,
            avatar: chat.user_avatar,
            groupChat: chat.isGroupChat,
            name: UserManager._user_profile.name,
            session_key: chat.session_key,
            nudge : chat.nudge,
/*
            tag: chat.tag,
            topic: chat.topic,
*/
            time: chat.time,
            user_id: UserManager._user_profile.user_id
        });
    };

    this.nudgeUser = function(chat) {
        chat.active_session_contact_location.update({ nudge : true});
        $timeout(function(){
            chat.active_session_contact_location.update({ nudge : false});
        }, 5000);
    };
    this.setToUserChatPresenceLocation = function(chatSession,contact) // The purpose of this function is to keep listening to the presence of the contact after a page load, when another user  refreshes their page the firesoscket to their presence is destroyed and we need to recreate it.
    {
        that.__storeToUser(contact);
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A contact_chat_presence_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        chatSession.contact_chat_presence = $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/chat-presence/'));
        chatSession.contact_chat_presence_message = $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/message/'));
        chatSession.contact_chat_presence_message_show = $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/show-message/'));
        chatSession.contact_chat_presence_message_post = $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/auto-post/'));
        return;
    };
    /*
that.__setToUserChatPresence = function(contact) // creates a pointer to the chat presence of the specific contact, will let us know if the availability of the contact changes
    {
        that.__storeToUser(contact);
        if (angular.isUndefined(that._contact._user_id)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: contact not defined: ' + that._contact.user_id);
            ////////////////////////////////////////////////////////////
            return false;
        }
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A contact_chat_presence_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/chat-presence/'));
    }
*/
    this.set_active_session_contact_location = function() // The service needs know where to write the calling card info of the user when  they want to chat that person. Users will look at this location for themselves  and when an new calling card object is written here  it creates the chat session connections and opens a new chatbox in the view
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_session_contact_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return new Firebase(that._url_root + that._contact._user_id + '/' + that._active_session_reference + that._sub_category_reference);
    };
    this.set_active_typing_contact_location = function() //  The service will write true to this location whenever the user is typing. The contact points to this location to know when the user is typing a message to them
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_typing_contact_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return new Firebase(that._url_root + that._contact._user_id + '/' + 'Typing-Presence/' + that._sub_category_reference);
    };
    this.set_active_typing_group_location = function(scope, session_key) //  The service will write true to this location whenever the user is typing. The contact points to this location to know when the user is typing a message to them
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_typing_group_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        var active_typing_group_location = new Firebase(that._group_url_root + that._group_active_session_reference + session_key + '/' + that._is_typing_reference + '/');
        active_typing_group_location.on('value', function(snapshot) {
            var log = [];
            angular.forEach(that.active_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push(value.session_key);
            }, log);
            var index = log.indexOf(active_typing_group_location.parent().name()); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
            if (angular.isDefined(that.active_chats[index])) {
                that.active_chats[index].isTyping = snapshot.val();
            } else {
                $log.debug(index + ' could not get typing-presence updated');
            }
        });
        return active_typing_group_location; /*         return $firebase(active_typing_contact_location); */
    };
    this.set_active_typing_user_location = function(scope) // The user will point to this  folder location under a uid child for each chat session. The chat session will watch this location for whenever the contact is typing a message
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_typing_user_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return new Firebase(that._url_root + CoreConfig.user.id + '/' + 'Typing-Presence/' + that._contact._user_id);
    };
    this.set_active_typing_user_socket = function(scope) // The user will point to this  folder location under a uid child for each chat session. The chat session will watch this location for whenever the contact is typing a message
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_typing_user_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return $firebase(new Firebase(that._url_root + CoreConfig.user.id + '/' + 'Typing-Presence/' + that._contact._user_id + '/' + 'is-typing/'));
    };
    this.set_active_session_from_user_location = function() // this firebase folder the service will watch for an calling card objects, if someone is chatting the user they will have to write their info to this location to trigger the service to create a chatbox/session for that user in the view
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_session_from_user_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return $firebase(new Firebase(that._url_root + CoreConfig.user.id + '/' + that._active_session_reference + that._contact._user_id + '/'));
    };
    this.deactivate_session_from_user_location = function(chat, scope, removeScope, removeLocation) // this funciton will remove the chatSession/connections and chat box in the view
    {
        //individula chat connections
        var delay = 0;
        $log.debug('deactivating session');
        $log.debug('removeScope: ' + removeScope);
        $log.debug('removeLocation: ' + removeLocation);
        if (angular.equals(that._last_pushed_session, chat.session_key) || angular.equals(that._last_pushed_session, chat.contact_id)) {
            that._last_pushed_session = null;
        }
        if (scope.layout != 2 && that.active_chats.length === 1) {
            delay = 500;
            if (scope.layout === 3) {
                scope.switchLayout(1);
            }
            scope.safeApply(function() {
                $timeout(function() {
                    document.getElementById(scope.mandatory_index + '_link').click();
                }, 250);
            });
        }
        $timeout(function() {
            if (angular.equals(that._last_query_location, chat.session_key) || angular.equals(that._last_query_location, chat.contact_id)) {
                that._last_query_location = '';
            }
            if (angular.equals(scope.requested_chat, chat.session_key) || angular.equals(scope.requested_chat, chat.contact_id)) {
                scope.requested_chat = '';
            }
            if (angular.isDefined(chat.close_invite)) {
                clearInterval(chat.close_invite);
            }
            if (angular.isDefined(that._active_sessions_user_location && angular.isDefined(chat.contact_id))) {
                that._active_sessions_user_location.child(chat.contact_id || chat.session_key).remove();
            }
            if (angular.isDefined(chat.contact_chat_presence)) {
                chat.contact_chat_presence.$off();
            }
            if (angular.isDefined(chat.user_chat_presence)) {
                chat.user_chat_presence.$off();
            }
            if (angular.isDefined(chat.contact_message_location)) {
                chat.contact_message_location.off();
            }
            if (angular.isDefined(chat.user_message_location)) {
                chat.user_message_location.off();
            }
            if (angular.isDefined(chat.active_typing_contact_location)) {
                chat.active_typing_contact_location.update({'is-typing' : null});
                chat.active_typing_contact_location.off();
            }
            if (angular.isDefined(chat.active_typing_user_location)) {
                chat.active_typing_user_location.update({'is-typing' : null});
                chat.active_typing_user_location.off();
            }
            if (angular.isDefined(chat.active_typing_user_socket)) {
                chat.active_typing_user_socket.$off();
                chat.active_typing_user_socket.$remove();
            }
            if (angular.isDefined(chat.contact_session_location)) {
                chat.contact_session_location.off();
            } /*        if (angular.isDefined( chat.messageListQuery ) ) { chat.messageListQuery.off(); };       */
            //group chats connections
            if (angular.isDefined(chat.group_message_location)) {
                chat.group_message_location.off();
            }
            if (angular.isDefined(chat.active_typing_group_location)) {
                chat.active_typing_group_location.off();
            }
            var remaining_users = null;
            if (removeLocation && angular.isDefined(chat.group_user_location)) {
                scope.wasDirectoryChat = chat.isDirectoryChat;
                chat.group_user_location.child(UserManager._user_profile.user_id).remove();
                scope.closing_group_user_connection = chat.group_user_location;
                chat.group_user_location.off();
                scope.closing_firebase_location = chat.firebase_location;
                chat.firebase_location.off();
                chat.group_user_location.transaction(function(current_value) {
                    return current_value;
                }, function(error, committed, snapshot) {
                    scope.remaining_users = snapshot.val();
                });
                $timeout(function() {
                    end_group_session(count, chat, scope);
                }, 500);
                var count = 0;
                var end_group_session = function() {
                        if (angular.isDefined(scope.remaining_users) && angular.isDefined(scope.wasDirectoryChat)) {
                            if (scope.remaining_users === null && scope.wasDirectoryChat === false) {
                                if (angular.isDefined(scope.closing_firebase_location)) {
                                    scope.closing_group_user_connection.off();
                                    scope.closing_firebase_location.remove();
                                } else {
                                    $log.debug('last user, but failed to remove session because chat was undefined');
                                }
                            } else {
                                if (angular.isDefined(scope.closing_firebase_location)) {
                                    $log.debug('remaining users/directory chat,  turn off listner');
                                    scope.closing_firebase_location.off();
                                } else {
                                    $log.debug('remaining users,  but failed because chat is not defined');
                                }
                            }
                            delete scope.closing_group_user_connection;
                            delete scope.closing_firebase_location;
                            scope.remaining_users = null;
                            scope.wasDirectoryChat = null;
                        }
                    };
            }
            if (removeScope === true) {
                var index = null;
                var session_lookup;
                if (chat.isGroupChat === true) {
                    index_lookup = chat.session_key;
                    session_lookup = chat.session_key;
                } else {
                    index_lookup = chat.contact_id;
                    session_lookup = 'user_' + chat.contact_id;
                }
                if (angular.isDefined(chat.index_position)) {
                    if (chat.isGroupChat === true) {
                        if (that.active_chats[chat.index_position] && that.active_chats[chat.index_position].session_key === chat.session_key) {
                            index = chat.index_position;
                        } /*                        console.log('Used index_position'); */
                    } else if (angular.isDefined(that.active_chats[chat.index_position]) && that.active_chats[chat.index_position].contact_id === chat.contact_id) {
                        index = chat.index_position; /*                         console.log('Used index_position'); */
                    }
                }
                if (index === null) // fall back for loop function
                { /*                    console.log('Used fallback'); */
                    var log = [];
                    var index_lookup;
                    angular.forEach(that.active_chats, function(value, key) {
                        if (angular.isDefined(value.contact_id)) {
                            this.push(value.contact_id || value.session_key);
                        }
                    }, log);
                    index = log.indexOf(index_lookup);
                }
                $log.debug('index: ' + index);
                if (index > -1) {
                    that.active_chats.splice(index, 1);
                }
                $log.debug('session_lookup: ' + session_lookup);
                that.active_sessions[session_lookup] = false;
                delete that.active_sessions[session_lookup];
                chat = null;
                if (!that._is_playing_sound) {
                    that._is_playing_sound = true;
                    NotificationService.__playSound(NotificationService._chat_close);
                    $timeout(function(){
                        that._is_playing_sound = false;
                    }, 1000);
                }
            } else {
                chat = null;
            }
            if (that.active_chats.length - 1 >= scope.stored_directory_index) {
                scope.setDirectoryChat(scope.stored_directory_index, false);
            } else if (that.active_chats.length > 0) {
                scope.setDirectoryChat(0, false);
            }
        }, delay);
        scope.last_deactivated_chat = '';
    };
    this.setUserChatPresence = function(chat_presence) // this function is used to set the chat_presence of a user to the firebase location, once it is chaged all user loking at it will know the the user chage in the users chat_presence
    {
        if (angular.isUndefined(chat_presence)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: Arguments are undefined: chat_presence: ' + chat_presence + ' location: ' + that._chat_presence_location);
            ////////////////////////////////////////////////////////////
            return false;
        }
        UserManager._user_presence_location.update({
            'chat-presence': chat_presence
        });
/*
if (chat_presence === "Offline")
        {
            UserManager._user_online_location.update({'online':false});
        }
*/
    };
    this.returnToUserMessageLocation = function() {
        if (angular.isUndefined(that._contact._user_id)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: contact not defined: ' + that._contact._user_id);
            ////////////////////////////////////////////////////////////
            return false;
        }
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A contact_message_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        /*      var tuml_root = that._url_root + that._contact._user_id  + '/' + that._chat_message_storage_reference +  CoreConfig.user.id + '/' + that.__getDateReference(); */
        var tuml_root = that._url_root + that._contact._user_id + '/' + that._chat_message_storage_reference + that._sub_category_reference;
        var contact_message_location = new Firebase(tuml_root);
        return contact_message_location; /*         return $firebase(contact_message_location); */
    };
    this.returnMessageListQuery = function(scope, time, refLocation, to_address, isGroupChat, store_length) // this will query the message storage loction for the chat_session and create callbacks for when a child is added or removed, it can  also limit the amount of chat message that can be stored
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
        if (isGroupChat) {
            query_limit_size = that._group_query_size;
            timestamp = time - (Directorythat._store_time * store_length);
        } else {
            query_limit_size = that._single_query_size;
            timestamp = time - that._store_time;
        }
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A messageListQuery connection is  being created");
        ////////////////////////////////////////////////////////////
        refLocation.once('value', function(snapshot){
            var location_list = snapshot.val();
            if (location_list)
            {
                angular.forEach(location_list, function(value, key){
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
                if (isGroupChat === false) {
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
                    if (that.active_chats[index] && that.active_chats[index].isGroupChat === false) {
                        i = that.active_chats[index].chats.length; //or 10
                        while (i--) {
                            if (that.active_chats[index].chats[i].key === log[0]) {
                                that.active_chats[index].chats[i].text = data.text;
                                break;
                            }
                        }
                        return;
                    } else if (that.active_chats[index] && that.active_chats[index].isGroupChat === true) {
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
            if (isGroupChat === false) {
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
            } else if (isGroupChat === true) {
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
    this.fetchMoreMessages = function(scope, index, location, endAt) {
        $log.debug('that.__fetchMoreMessages');
        var chats, log, i;
        var chat = that.active_chats[index];
        $log.debug(chat);
        scope.temp_chats = Array();

        endAt = chat.first_priority - 1;
        var startAt = endAt - that._message_fetch_size;
        $log.debug('startAt: ' + startAt + ' endAt: ' + endAt);
        /*      directory_chat.reload = true;    */
        if (chat.isGroupChat) {
            chats = chat.group_chats;
            log = chat.group_chat_log;
            location = chat.group_message_location;
        } else {
            chats = chat.chats;
            log = chat.chat_log;
            location = chat.user_message_location;
        }
        location.endAt(endAt).limit(that._message_fetch_size).once('value', function(snapshot) {
            var prev = snapshot.val();
            if (prev) {
/*              console.log('fetching'); */
                chat.reload = true;
                var prev_array = Array();
                for( var i in prev ) {
                    prev_array.push(prev[i]);
                }
                $log.debug(prev_array);
                i = prev_array.length;
                while (i--) {
/*                  console.log(prev_array[i]); */
/*                  console.log('seting priority as ' + parseInt(endAt - (prev_array.length - (i + 1) ))); */
/*                  prev_array[i].key = endAt - ((prev_array.length) - (i)); */
                    scope.temp_chats.push(prev_array[i]);
                }
                $timeout(function() {
                    angular.forEach(scope.temp_chats, function(value) { /*                          console.log(value); */
                        log.unshift(value.author);
                        chats.unshift(value);
                        scope.getAuthorAvatar(chats[1], false);
                        scope.getAuthorFirstName(chats[1]);
                        scope.isMessageFromUser(chats[1]);
                        scope.isAuthorSameAsLast(chats[1], chats[0].author);
                        scope.isLastMessagePastMinute(chats[1], chats[0].time);
                        scope.isMessagePastHour(chats[1], chat.time_reference);
                    });
                    scope.getAuthorAvatar(chats[0], false);
                    scope.getAuthorFirstName(chats[0]);
                    scope.isMessageFromUser(chats[0]);
                    scope.isAuthorSameAsLast(chats[0], undefined);
                    scope.isLastMessagePastMinute(chats[0], undefined);
                    scope.isMessagePastHour(chats[0], chat.time_reference);
                    chat.first_priority = chats[0].priority;
                    if (chat.first_priority === 1) {
                        chat.isMorePrev = false;
                    }
                    chat.reload = false;
                }, 900);
                $timeout(function() {
                    chat.scroll_top = false;
                    chat.scroll_bottom = false; /*                  console.log('done fetching'); */
                    $("#" + 'message_display_' + chat.index_position).animate({
                        scrollTop: 0
                    }, 2000);
                }, 500);
            } else {
                chat.scroll_top = false;
                chat.scroll_bottom = false;
                chat.scroll_top = true;
                chat.isMorePrev = false;
                chat.reload = false;
                chat.first_priority = chats[0].priority; /*                 console.log('done fetching'); */
                return false;
            }
        });

    };
    this.returnFromUserMessageLocation = function(scope) // defines the firebase folder location that the user will point their chatSession to
    {
        if (angular.isUndefined(that._contact._user_id)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: contact not defined: ' + that._contact._user_id);
            ////////////////////////////////////////////////////////////
            return false;
        } else if (angular.isDefined(scope._active_sessions) && scope._active_sessions.indexOf(that._contact._user_id) > -1) {
            $log.debug('Failure: contact not defined: ' + that._contact._user_id);
            return false;
        } else {
            ////////////////////////////////////////////////////////////
            $log.debug("Warning: A fromUserMessageLocation is  being created");
            ////////////////////////////////////////////////////////////
            return new Firebase(that._url_root + CoreConfig.user.id + '/' + that._chat_message_storage_reference + that._contact._user_id + '/');
        }
    };
    this.establishUserChat = function(scope) //  Step 1 this function will initialize the that variables and set the user chat presence.
    {
        $log.debug('calling that.__establishUserChat');
        var check_for_user = setInterval(function() // delays fetch unitl user info is in place
        {
            $log.debug('Looking for chat user');
            if (angular.isDefined(UserManager._user_profile.user_id)) {
                $log.debug('User was defined');
                clearInterval(check_for_user);
                that.active_chats = Array();
                UserManager.user_group = Array();
                UserManager.user_group.push('user_' + UserManager._user_profile.user_id);
                if (UserManager.pc) {
                    UserManager.user_group.push('user_' + UserManager.pc.user_id);
                }
                if (UserManager._user_profile.mc) {
                    UserManager.user_group.push('user_' + UserManager._user_profile.mc.user_id);
                }
                if (UserManager._user_profile.admin && UserManager._user_profile.role === 'Mentor Coach') {
                    UserManager.user_group.push('user_' + UserManager._user_profile.admin.user_id);
                }

                CoreConfig.user.id + '/' = UserManager._user_profile.user_id + '/'; // user_id of user
                that.__set_active_sessions_user_location(scope); // looks at the active session folder of the user, and create chatSession for an calling card objects present
            }
        }, 250);
        $log.debug('Finished that.__establishUserChat');
        return true;
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
                            if (scope.is_external_window.$value && scope.isExternalInstance === false) { /*                              console.log('Blocked SOund'); */
                            } else {
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
            if (that.active_sessions['user_' + contact.user_id] !== true && !(angular.equals(contact.user_id, that._last_pushed_session))) {
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
                that.active_sessions['user_' + contact.user_id] = true;
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
    this.setLastPushed = function(session) {
        that._last_pushed_session = session;
        $timeout(function() {
            that._last_pushed_session = null;
        }, 1000);
    };
    this.updateIsOpen = function(chat) {
        if (angular.isDefined(chat.contact_id)) {
            that._active_sessions_user_location.child(chat.contact_id).update({
                isOpen: chat.isopen
            });
        } else {
            that._active_sessions_user_location.child(chat.session_key).update({
                isOpen: chat.isopen
            });
        }
    };
    this.updateIsSound = function(session_id, bool) {
        that._active_sessions_user_location.child(session_id).update({
            isSound: bool
        });
    };
    return this;
}]);
