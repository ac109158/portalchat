angular.module('portalchat.core').
service('SessionsManager', ['$rootScope', '$window', '$log', 'CoreConfig', '$firebaseObject', '$firebaseArray', 'ChatStorage', 'UserManager', 'PermissionsManager', function($rootScope, $window, $log, CoreConfig, $firebaseObject, $firebaseArray, ChatStorage, UserManager, PermissionsManager) {
    var that = this;

    this.session = {};
    this.session.id = undefined;

    this.update = {};

    this.fb = {}; // firebase domain
    this.fb.location = {};


    this.load = function() {
        that.setFirebaseLocations();
        that.setFirebaseTargets();
        if (UserManager.user.isAdmin) {
            // that.validateGroupChatSessions();
        }
    };
    this.unload = function() {
        angular.forEach(Object.keys(ChatStorage.contact.chat.list), function(key) {
            that.updateUserChatSessionStorage(contact, key);
        });
    };


    this.mapObjectWithKey = function(object, object_key_field) {
        var map = {};
        var index = 0;
        angular.forEach(object, function(value, key) {
            this[value[object_key_field].toString()] = index;
            index++;
        }, map);
        return map;
    };

    this.setFirebaseLocations = function() {
        if (UserManager.user.profile.id) {
            that.fb.location.signals = new Firebase(CoreConfig.session.signals_root);
            that.fb.location.storage = new Firebase(CoreConfig.session.storage_root);
            if (PermissionsManager.hasAdminRights()) {
                that.fb.group.location.sessions = new Firebase(CoreConfig.group_chat.url_root + CoreConfig.group_chat.active_session_reference);
            }
        }
    };

    this.setFirebaseTargets = function() {
        if (UserManager.user.profile.id) {
            // that.fb.target.is_external_window = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.users_reference + CoreConfig.users_settings_reference + UserManager.user.profile.id + '/is_external_window/'));
            // that.fb.target.is_panel_open = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.users_reference + CoreConfig.users_settings_reference + UserManager.user.profile.id + '/is_open/'));
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

    this.setUserChatSessionStorage = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].session.list[session_key]) {
            that.fb.location.storage.child(session_key.split(':')[0]).child(session_key.split(':')[1]).setWithPriority(ChatStorage[type].chat.list[session_key].session, ChatStorage[type].chat.list[session_key].session.order);
            return true;
        }
        return false;
    };

    this.updateContactChatSignals = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].session.list[session_key]) {
            that.fb.location.signals.child(session_key.split(':')[1]).child(session_key.split(':')[0]).update(ChatStorage[type].chat.list[session_key].signals);
            return true;
        }
        return false;
    };

    this.updateContactChatSession = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].session.list[session_key]) {
            that.fb.location.sessions.child(session_key.split(':')[1] + ':' + session_key.split(':')[0]).update(ChatStorage[type].session.list[session_key].session);
            return true;
        }
        return false;
    };


    this.monitorUserSessionChatSignals = function() {
        var discard_last_child = true;
        that.fb.location.signals.child(UserManager.user.profile.id).once("value", function(snap) {
            var keys = Object.keys(snap.val() || {});
            angular.forEach(keys, function(key){
                ChatBuilder.createSessionifNotExists('contact', UserManager.profile.id + ':' + key);
            });
            var last_child = keys[keys.length - 1];
            console.log('last_child:',last_child);
            if(angular.isUndefined(last_child)){
                discard_last_child = false;
            }
            that.fb.location.signals.child(UserManager.user.profile.id).startAt(null, last_child).on("child_added", function(snapshot) {
                var contact_id = snapshot.ref().key();
                var signals = snapshot.val();
                if (signals && signals.active) {
                    if(discard_last_child){
                        discard_last_child = false;
                    } else{
                        console.log('we need to prime a chat', contact_id, signals);
                    }
                }
            });
        });
    };












    //*************************************************************************//



    that.__setActiveSessionLocation = function(scope, contact, isGroupChat) { // this function will detect if this chatSession gets changed to a group chat and will call the necessary functions
        var active_session_root = that._url_root + UserManager.user.profile.id + '/' + that._active_session_reference + contact + '/';
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



    this.updateChatContactActiveSession = function(type, session_key) {
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
        return $firebase(new Firebase(that._url_root + UserManager.user.profile.id + '/' + that._active_session_reference + that._contact._user_id + '/'));
    };

    this.setContactChatsSessionPriority = function() {
        angular.forEach(ChatStorage.chat.list, function(contact_chat) {
            that.fb.location.sessions.child(contact_chat.session_key).setPriority(contact_chat.order);
            val.index_position = $scope.active_chats_index;
            Cthat.fb.location.sessions.child(contact_chat.session_key).update({
                'index_position': contact_chat.order
            });
        });
    };

    this.updateSessionDetail = function(session_key, detail, value) {
        if (session_key && detail && value) {
            that.update = {};
            that.update[detail] = value;
            that.fb.location.sessions.child(session_key).update(that.update);
        }
    };
    this.removeChatSession = function(type, session_key, removeScope, removeLocation) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            $log.debug('deactivating session');
            $log.debug('removeScope: ' + removeScope);
            $log.debug('removeLocation: ' + removeLocation);
            if (angular.isDefined(ChatService._active_sessions_user_location && angular.isDefined(chat.to_user_id))) {
                ChatService._active_sessions_user_location.child(chat.to_user_id || chat.session_key).remove();
            }
            if (angular.isDefined(chat.active_typing_to_user_location)) {
                chat.active_typing_to_user_location.update({
                    'is-typing': null
                });
                chat.active_typing_to_user_location.off();
            }
            if (angular.isDefined(chat.active_typing_user_location)) {
                chat.active_typing_user_location.update({
                    'is-typing': null
                });
                chat.active_typing_user_location.off();
            }
            if (angular.isDefined(chat.active_typing_user_socket)) {
                chat.active_typing_user_socket.$remove();
            }

            angular.forEach(ChatStorage[type].chat.list[session_key].fb.contact.location, function() {
                location.off();
            });
            angular.forEach(ChatStorage[type].chat.list[session_key].fb.contact.target, function() {
                target.$off();
            });
        }
    };



    return this;
}]);
