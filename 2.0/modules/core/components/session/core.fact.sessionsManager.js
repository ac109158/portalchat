angular.module('portalchat.core').
service('SessionsManager', ['$rootScope', '$log', 'CoreConfig', '$firebaseObject', '$firebaseArray', 'ChatStorage', 'UserManager', function($rootScope, $log, CoreConfig, $firebaseObject, $firebaseArray, ChatStorage, UserManager) {
    var that = this;

    this.session = {};
    this.session.id = undefined;

    this.update = {};

    this.fb = {}; // firebase domain
    this.fb.user = {};
    this.fb.user.location = {}; // location of values
    this.fb.user.target = {}; // specific value in a location .. uses $value

    this.fb.group = {};
    this.fb.group.location = {}; // location of values
    this.fb.group.target = {}; // specific value in a location .. uses $value

    this.load = function() {
        that.setFirebaseLocations();
        that.setFirebaseTargets();
        console.log('sessionsManager loaded', that.fb.user.location.sessions.toString());
        if (UserManager.user.isAdmin) {
            that.validateGroupChatSessions();
        }
    };

    this.setFirebaseLocations = function() {
        if (CoreConfig.user.id) {
            that.fb.user.location.sessions = new Firebase(CoreConfig.chat.url_root + CoreConfig.user.id + '/' + CoreConfig.session.root_reference);
            if (UserManager.user.isAdmin) {
                that.fb.group.location.sessions = new Firebase(CoreConfig.group_chat.url_root + CoreConfig.group_chat.active_session_reference);
            }
        }
    };

    this.setFirebaseTargets = function() {
        if (CoreConfig.user.id) {
            // that.fb.target.is_external_window = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_settings_reference + CoreConfig.user.id + '/is_external_window/'));
            // that.fb.target.is_panel_open = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_settings_reference + CoreConfig.user.id + '/is_open/'));
            return true;
        }
        return false;
    };

    this.validateGroupChatSessions = function() {
        // clear all unused group active sessions
        if (UserManager.user.isAdmin && that.fb.group.location.sessions) {
            that.fb.group.location.sessions.once('value', function(snapshot) {
                var group_chat_sessions = snapshot.val();
                if (group_chat_sessions) {
                    angular.forEach(group_chat_sessions, function(group_chat_session, key) {
                        if (!group_chat_session.admin) {
                            $log.debug('removed active session' + key);
                            that.fb.group_chat.location.sessions.child(key).remove();
                        }
                    });
                }
            });
        }
    };



    this.monitorUserSessionActivity = function() {
        that.fb.chat.location.sessions.on('child_added', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
            var session = snapshot.val();
            if (angular.isUndefined(session)) {
                $log.debug('New chat session detected -> Undefined');
                return false;
            } else if (angular.isUndefined(session.user_id) && angular.isUndefined(session.session_key)) {
                $log.debug('Rejected: ' + angular.toJson(session));
                return false;
            } else if (ChatStorage.contact.session.list['user_' + String(session.user_id)] === true || ChatStorage.contact.session.list[String(session.session_key)] === true) {
                $log.debug('Chat Session has already been created');
                return false;
            } else {
                $log.debug('New chat session detected after sessions established -> create');
                if (session.directoryChat) {
                    that.getDirectoryChat(session.session_key);
                } else {
                    session.is_focus = false;
                    that.registerChatRequest(session);
                }
            }
        });
    };

    that.__setActiveSessionLocation = function(scope, contact, isGroupChat) { // this function will detect if this chatSession gets changed to a group chat and will call the necessary functions
        var active_session_root = that._url_root + CoreConfig.user.id + '/' + that._active_session_reference + contact + '/';
        var active_session_location = new Firebase(active_session_root);
        var index = null;
        var chat_log;
        if (isGroupChat === false) {
            active_session_location.on('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                {
                    if (snapshot.val() === null) {
                        var removed_index = -1;
                        angular.forEach(that.active_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                            if (value.contact_id === contact) {
                                removed_index = value.index_position;
                            }
                        });
                        if (removed_index > -1) {
                            var removed_key = that.active_chats[removed_index].contact_id || that.active_chats[removed_index].session_key;
                            if (scope.last_deactivated_chat != removed_key) {
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

                                if (that.active_chats[index].nudge === false && data.nudge === true) {
                                    that.active_chats[index].nudge = true;

                                    if (scope.layout != 2) {
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
                                    } else {
                                        scope.moveChatToFirst(index);
                                        that.active_chats[index].isopen = true;
                                    }
                                    $timeout(function() {
                                        NotificationService.__nudge(NotificationService._nudge);
                                    }, 1500);

                                    $timeout(function() {
                                        that._active_sessions_user_location.child(that.active_chats[index].contact_id).update({
                                            nudge: false
                                        });
                                    }, 5000);
                                }
                            }
                        }
                        return true;
                    }
                });
        }
        return active_session_location;
    };



    this.updateSessionStatus = function(data, location, index_position, isGroupChat) { // listen for a change to a existing chat session
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

    that.__setSessionLocationforGroupInvitee = function(session_key, invitee) {
        var invitee_session_root = that._url_root + invitee + '/' + that._active_session_reference + session_key + '/';
        return new Firebase(invitee_session_root);
    };



    this.updateContactUserActiveSession = function(chat) {
        chat.active_session_contact_location.update({
            admin: chat.admin,
            avatar: chat.user_avatar,
            groupChat: chat.isGroupChat,
            name: UserManager._user_profile.name,
            session_key: chat.session_key,
            nudge: chat.nudge,
            /*
                        tag: chat.tag,
                        topic: chat.topic,
            */
            time: chat.time,
            user_id: UserManager._user_profile.user_id
        });
    };

    this.nudgeUser = function(chat) {
        chat.active_session_contact_location.update({
            nudge: true
        });
        $timeout(function() {
            chat.active_session_contact_location.update({
                nudge: false
            });
        }, 5000);
    };

    this.set_active_session_contact_location = function() { // The service needs know where to write the calling card info of the user when  they want to chat that person. Users will look at this location for themselves  and when an new calling card object is written here  it creates the chat session connections and opens a new chatbox in the view
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_session_contact_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return new Firebase(that._url_root + that._contact._user_id + '/' + that._active_session_reference + that._sub_category_reference);
    };

    this.set_active_session_from_user_location = function() { // this firebase folder the service will watch for an calling card objects, if someone is chatting the user they will have to write their info to this location to trigger the service to create a chatbox/session for that user in the view
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_session_from_user_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return $firebase(new Firebase(that._url_root + CoreConfig.user.id + '/' + that._active_session_reference + that._contact._user_id + '/'));
    };
    this.deactivate_session_from_user_location = function(chat, scope, removeScope, removeLocation) { // this funciton will remove the chatSession/connections and chat box in the view
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
                chat.active_typing_contact_location.update({
                    'is-typing': null
                });
                chat.active_typing_contact_location.off();
            }
            if (angular.isDefined(chat.active_typing_user_location)) {
                chat.active_typing_user_location.update({
                    'is-typing': null
                });
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
                    $timeout(function() {
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

    this.setContactChatsPriority = function() {
        var contact_chat_index = -1;
        angular.forEach(ChatStorage.contact.chat.list, function(contact_chat) {
            ++contact_chat_index;
            contact_chat.index_position = contact_chat_index;
            if (contact_chat.is_group_chat) {
                that.fb.user.location.sessions.child(contact_chat.session_key).setPriority(contact_chat_index);
                /*              console.log( contact_chat.session_key + ' was set with the priority ' + $scope.active_chats_index); */
            } else {
                that.fb.user.location.sessions.child(contact_chat.contact.id).setPriority(contact_chat_index);
                /*              console.log( contact_chat.to_user_name + ' was set with the priority ' + $scope.active_chats_index); */
            }
            that.fb.user.location.sessions.child(contact_chat.contact.id || contact_chat.session_key).update({
                'index_position': contact_chat_index
            });
        });
    };

    this.updateSessionDetail = function(session_key, detail, value) {
        if (session_key && detail && value) {
            that.update = {};
            that.update[detail] = value;
            that.fb.user.location.sessions.child(session_key).update(that.update);
        }
    };

    return this;
}]);
