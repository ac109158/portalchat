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



    this.returnChatPresenceStates = function() // this function provides the caller with the predefined states that are available
    {
        return this._chat_presence_states;
    };
    this.storeContactUser = function(contact) // this function is called whenever connections need to be created to a user
    {
        $log.debug('Storing To User:' + angular.toJson(contact));
        that._contact = {};
        that._contact._user_id = contact.user_id;
        that._contact._name = contact.name;
        that._contact._avatar = contact.avatar;
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




    this.setContactUserChatPresenceLocation = function(chatSession,contact) // The purpose of this function is to keep listening to the presence of the contact after a page load, when another user  refreshes their page the firesoscket to their presence is destroyed and we need to recreate it.
    {
        that.__storeContactUser(contact);
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
that.__setContactUserChatPresence = function(contact) // creates a pointer to the chat presence of the specific contact, will let us know if the availability of the contact changes
    {
        that.__storeContactUser(contact);
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
    this.returnContactUserMessageLocation = function() {
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
