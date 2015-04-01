angular.module('portalchat.core').
service('ChatManager', ['$log', '$timeout', 'CoreConfig', 'OnlineManager', function($log, $timeout, CoreConfig, OnlineManager) {
    var that = this;

    this.is_typing_presence = CoreConfig.is_typing_presence;
    this.is_playing_sound = false;

    this.active_chats = [];

    this.active_sessions = [];

    this.new_session_key = undefined;

    this.fb = {};
    this.fb.chat.location = {};
    this.fb.chat.targets = {};

    this.fb.group_chat = {};
    this.fb.group_chat.location = {};
    this.fb.group_chat.targets = {};

    this.last_requested_chat = undefined;

    this.validateChatModels = function() {
        // clear all unused group active sessions
        that.fb.group_chat.location.sessions = new Firebase(CoreConfig.group_chat.url_root + CoreConfig.group_chat.active_session_reference);
        that.fb.group_chat.location.sessions.once('value', function(snapshot) {
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
    };

    this.setOnlineTracking = function() {
        OnlineManager.setOnlineTracking();
    };

    this.establishUserChat = function(scope) { //  Step 1 this function will initialize the that variables and set the user chat presence.
        if (CoreConfig.user && CoreConfig.user.id) {
            that.active_sessions = [];
            that.active_chats = [];
            that.monitorUserActiveSessions(); // looks at the active session folder of the user, and create chatSession for an calling card objects present
        }
        $log.debug('Finished that.establishUserChat');
        return true;
    };

    this.monitorUserActiveSessions = function() { // this function is an initial process that looks at any existing objects in the users active session folder location and will generate new chat sessions for each of them, then well go inactive.
        that.fb.chat.location.sessions = new Firebase(CoreConfig.url_root + CoreConfig.user.id + '/' + that.active_session_reference);
        that.fb.chat.location.sessions.on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
            {
                var session = snapshot.val();
                if (angular.isUndefined(session)) {
                    $log.debug('New chat session detected -> Undefined');
                    return false;
                } else if (angular.isUndefined(session.user_id) && angular.isUndefined(session.session_key)) {
                    $log.debug('Rejected: ' + angular.toJson(session));
                    return false;
                } else if (that.active_sessions['user_' + String(session.user_id)] === true || that.active_sessions[String(session.session_key)] === true) {
                    $log.debug('Chat Session has already been created');
                    return false;
                } else {
                    $log.debug('New chat session detected after sessions established -> create');
                    if (session.directoryChat) {
                        that.getDirectoryChat(session.session_key);
                    } else {
                        that.registerChatRequest(session, false);
                    }
                }
            });
    };

    this.registerChatRequest = function(session, isfocus) {
        if (session && angular.isObject(session)) {
            var index;
            $log.debug('Requesting chat session');
            if (!(UtilityService.engine.firebase.online)) {
                $log.debug('Request Denied: Firebase is Offline');
                return false;
            } else if (that.last_requested_chat === session.user_id || that.last_requested_chat === session.session_key) {
                $log.debug('This appears to be a duplicate rquest, return false'); /*           console.log('requested: ' + that.last_requested_chat + ' session.user_id: ' + session.user_id); */
                that.last_requested_chat = false;
                return false;
            }
            if (angular.isDefined(session.session_key) && angular.isDefined(session.groupChat) && session.groupChat === true) {
                that.last_requested_chat = session.session_key;
                if (that.active_sessions[session.session_key] === true && angular.isDefined(that.active_chats)) {
                    $log.debug('Chat Session already exists in active_sessions');
                    angular.forEach(that.active_sessions, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                        this.push(value.key);
                    }, chat_log);
                    index = chat_log.indexOf(session.session_key);
                    if (that.layout != 2) {
                        that.setDirectoryChat(index, true);
                    } else {
                        that.active_chats[index].isopen = true;
                        that.active_chats[index].isTextFocus = true;
                    }
                    return false;
                } /*            console.log('building as group chat'); */
                that.__buildGroupChatSession(that, session, session.isOpen || true, isfocus, 1); // function(that, value, isopen, isfocus)
                return true;
            } else {
                that.last_requested_chat = session.user_id;
                if (angular.isUndefined(session) || session.user_id === UserManager._user_profile.user_id) {
                    $log.debug('Chat session denied - undefined/self');
                    return false;
                } else if (angular.isDefined(session.user_id) && that.active_sessions['user_' + session.user_id] === true) {
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
                        if (that.layout != 2) {
                            that.safeApply(function() {
                                $timeout(function() {
                                    that.setDirectoryChat(index, true);
                                }, 50);
                            });
                        } else if (that.layout === 2 && that.active_chats[index].index_position >= that.max_count) {
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


    return this;

}]);
