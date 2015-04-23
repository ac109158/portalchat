angular.module('portalchat.core').
service('DirectoryChatManager', ['$log', '$timeout', 'CoreConfig', 'UserManager', 'ChatBuilder', 'UtilityManager', 'NotificationManager', '$firebaseObject', function($log, $timeout, CoreConfig, UserManager, ChatBuilder, UtilityManager, NotificationManager, $firebaseObject) {
    var that = this;
    this.parent_category_reference = "Chat-System/Group-Chats" + '/'; // parent folder name variable
    this.is_typing_reference = 'is-typing';
    this.group_message_reference = "stored-messages" + '/'; // parent folder reference to store chat messages
    this.group_active_users_reference = 'active-users/';
    this.topic_reference = 'topic/';
    this.store_time = 86400000; // 24 hours
    this.message_load_size = 20;
    this.message_fetch_size = 50;

    this.setDirectoryChatReference = function(chat_reference) {
        that._directory_chat_reference = chat_reference + '/';
    };
    this.setUrlRootReference = function() {
        that._url_root = CoreConfig.fb_url + that._parent_category_reference + that._directory_chat_reference.split('_')[0] + '/' + that._directory_chat_reference; // combine with global url variable
    };
    this.setIsTypingLoction = function() {
        that._is_typing_location = that._url_root + ChatService._is_typing_reference;
    };
    this.setGroupActiveUsersLoction = function() {
        that._group_user_location = that._url_root + that._active_users_reference;
    };
    this.buildNewDirectoryChat = function(config) // this function builds out the details of an individual chat sesssion
    {
        var newDirectoryChat = {};
        that._directory_chat_reference = '';
        that._url_root = '';
        that._is_typing_location = '';
        that._group_user_location = '';
        ChatBuilder.setDefaultChatSettings(newDirectoryChat);
        that.__setDirectoryChatReference(config.chat_reference);
        that.__setUrlRootReference();
        that.__setIsTypingLoction();
        that.__setGroupActiveUsersLoction();
        newDirectoryChat.user_chat_presence = UserManager.__setChatPresenceforUser(UserManager._user_profile.user_id);
        newDirectoryChat.session_key = config.chat_reference;
        newDirectoryChat.isMandatory = config.mandatory;
        newDirectoryChat.monitor = false;
        newDirectoryChat.isGroupChat = true;
        newDirectoryChat.isDirectoryChat = true;
        newDirectoryChat.admin = config.admin;
        newDirectoryChat.time = 0;
        newDirectoryChat.firebase_location = new Firebase(that._url_root);
        newDirectoryChat.group_message_location = new Firebase(that._url_root + that._group_message_reference);
        newDirectoryChat.topic_location = $firebase(new Firebase(that._url_root + that._topic_reference));
        newDirectoryChat.smod = "SM on Duty";
        newDirectoryChat.is_sound = false;
        newDirectoryChat.is_open = true;
        newDirectoryChat.chat_description = chat_description; // used at the top of the chat box
        newDirectoryChat.message_list_query = that.__returnMessageListQuery(scope, newDirectoryChat, store_length);
        if (config.watch_users) {
            newDirectoryChat.group_user_location = new Firebase(that._url_root + that._group_active_users_reference);
            newDirectoryChat.group_user_location.child(UserManager._user_profile.user_id).update({
                user_id: UserManager._user_profile.user_id,
                name: UserManager._user_profile.name,
                avatar: UserManager._user_profile.avatar
            });
            newDirectoryChat.group_user_location.on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
            { // this event will detect when another user is added to a group chat, and each user that participating will update that person into their user_log
                if (angular.isDefined(snapshot.val()) && snapshot.val() !== null) {
                    var data = snapshot.val();
                    var val = data.user_id;
                    if (angular.isDefined(newDirectoryChat.user_log)) {
                        newDirectoryChat.user_log[val] = data;
                        var User = {};
                        User.user_id = val;
                        User.name = data.name;
                        User.avatar = data.avatar;
                        User.profile_location = UserManager.__setProfileOnlineLocationforUser(val);
                        User.session_location = ChatManager.__setSessionLocationforGroupInvitee(newDirectoryChat.session_key, val);
                        newDirectoryChat.user_details[val] = User;
                        newDirectoryChat.participant_log['user_' + User.user_id] = User.name;
                        UtilityManager.removeByAttr(newDirectoryChat.invite_list, 'user_id', val);
                        if (User.user_id != UserManager._user_profile.user_id) {
                            newDirectoryChat.group_count++;
                        }
                        $log.debug(newDirectoryChat.user_details);
                    } else {
                        $log.debug(val + 'newDirectoryChat.user_log was not defined');
                    }
                } else {
                    $log.debug('Child was undefined/null');
                }
            });
            newDirectoryChat.group_user_location.on('child_removed', function(childSnapshot) { // detects a ref_location.remove(JsonObjKey) made to the reference location
                var data = childSnapshot.val();
                var val = data.user_id;
                if (angular.isDefined(newDirectoryChat.user_details) && angular.isDefined(newDirectoryChat.user_details[val])) {
                    if (angular.isDefined(newDirectoryChat.user_details[val].profile_location)) {
                        newDirectoryChat.user_details[val].profile_location.$off();
                    }
                    if (angular.isDefined(newDirectoryChat.user_details[val].session_location)) {
                        newDirectoryChat.user_details[val].session_location.off();
                    }
                    delete newDirectoryChat.user_details[val];
                    delete newDirectoryChat.user_log[val]; /*                   var d = new Date(); */
                    var n = Firebase.ServerValue.TIMESTAMP;
                    var chat_text = data.name + ' has left';
                    newDirectoryChat.group_chats.push({
                        author: ChatManager._internal_reference,
                        to: newDirectoryChat.session_key,
                        text: chat_text,
                        time: n,
                        priority: -1,
                        session_key: newDirectoryChat.session_key
                    });
                    newDirectoryChat.group_chat_log.push(ChatManager._internal_reference);
                    if (data.user_id != UserManager._user_profile.user_id) {
                        newDirectoryChat.group_count--;
                        newDirectoryChat.invite_list.push({
                            avatar: data.avatar,
                            name: data.name,
                            user_id: data.user_id
                        });
                    }
                }
            });
        }
        else{
            newDirectoryChat.user_log = UserManager._users_profiles_obj;
        }
        newDirectoryChat.group_typing_location = new Firebase(that._url_root + 'is-typing/');
        newDirectoryChat.group_typing_location.on('child_added', function(snapshot) {
            if (snapshot.name() == UserManager._user_profile.user_id) {
                return;
            }
            $timeout(function() {
                newDirectoryChat.is_typing_list.push(snapshot.val());
            });
        });
        newDirectoryChat.group_typing_location.on('child_removed', function(snapshot) {
            $timeout(function() {
                newDirectoryChat.is_typing_list.splice(newDirectoryChat.is_typing_list.indexOf(snapshot.val(), 1));
            });
        });
        return newDirectoryChat;
    };
    this.returnMessageListQuery = function(scope, directory_chat, store_length) // this will query the message storage loction for the chat_session and create callbacks for when a child is added or removed, it can  also limit the amount of chat message that can be stored
    {
        $log.debug("WARNING: GERNERATING A MESSAGE QUERY FOR " + directory_chat.group_message_location.name());
        if (angular.isUndefined(directory_chat.group_message_location)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: location error: ' + directory_chat.group_message_location);
            ////////////////////////////////////////////////////////////
            return false;
        }

        if (UserManager._user_profile.role == 'PlusOne Admin' || UserManager._user_profile.user_id == 113)
        {
            directory_chat.group_message_location.once('value', function(snapshot){
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
        }
        ChatManager._last_query_location = directory_chat.group_message_location.name();
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A messageListQuery connection is  being created");
        ////////////////////////////////////////////////////////////
        var time = new Date().getTime();
        var timestamp = time - (that._store_time * store_length);
        var messageListQuery = directory_chat.group_message_location.endAt().limit(that._message_load_size);
        messageListQuery.on('child_removed', function(snapshot) {
            var data = snapshot.val();
            if (ChatManager._storage_limit) {
                $log.debug('Message ' + messageInfo.text + ' from user ' + data.user_id + ' should no longer be displayed. ' + angular.toJson(data));
                var firekey = snapshot.name();
                $log.debug(data);
                directory_chat.group_message_location.child(firekey).set(null);
            }
        });
        $timeout(function() {
            messageListQuery.endAt().limit(1).on('value', function(snapshot) {
                var index = null;
                var obj = snapshot.val();
                var log = [];
                angular.forEach(obj, function(value, key) { // only a single object so for loop isnt expensive
                    this.push(key);
                }, log);
                if (obj === null || ChatManager.last_chat_logged == log[0] || obj[log[0]] === null) {
                    $log.debug('Value change is not needed');
                    return false;
                }
                var data = obj[log[0]];
                if (data.text === null || data.author == UserManager._user_profile.user_id) {
                    $log.debug('This is what you just wrote,  return false');
                    return false;
                }
                if (data.encryption) {
                    data.session_key = sjcl.decrypt(ENCRYPT_PASS, data.session_key);
                    data.text = sjcl.decrypt(data.session_key, data.text);
                }
                var i = directory_chat.group_chats.length; //or 10
                while (i--) {
                    if (directory_chat.group_chats[i].key == log[0]) {
                        directory_chat.group_chats[i].text = data.text;
                        $rootScope.$apply();
                        break;
                    }
                }
                return;
            });
        }, 500);
        $timeout(function() {
            messageListQuery.on('child_added', function(snapshot) { // detects a ref_location.push(Json) made to the reference location
                if (snapshot.name() != ChatManager.last_chat_logged) {
                    var data = snapshot.val();
                    data.key = ChatManager.last_chat_logged = snapshot.name();
                    if (data.encryption) {
                        data.session_key = sjcl.decrypt(ENCRYPT_PASS, data.session_key);
                        data.text = sjcl.decrypt(data.session_key, data.text);
                    }
                    if (directory_chat.first_priority === false) {
                        directory_chat.first_priority = data.priority;
                    }
                    if (data.priority > -1) {
                        directory_chat.next_priority = data.priority + 1;
                    } else {
                        directory_chat.next_priority++;
                    }
                    var is_new_chat = ((parseInt(data.time) + 5000) > directory_chat.time_reference);
                    var el = scope.isScrollAtBottom(directory_chat.index_position);
                    directory_chat.group_chat_log.push(data.author); // we are logging the chat, so we can do some conditional formatting and css based of the an log array;
                    directory_chat.group_chats.push(data);
                    if (is_new_chat && data.author != UserManager._user_profile.user_id) {
                        if ( data.author != UserManager._user_profile.user_id && directory_chat.monitor === true)
                        {
                            if (scope.external_monitor && directory_chat.monitor)
                            {
                                scope.notifyUser(data, directory_chat.index_position,  directory_chat.chat_description);
                                scope.unread++;
                                document.title = scope.default_window_title + ' - ' + scope.unread + ' New';

                            }
                            else if (scope.page_status == 'visible' && scope.layout != 2 && scope.isChatModuleOpen === false) {
                                scope.alertToOpen = true;
                                scope.unread++;
                                scope.notifyUser(data, directory_chat.index_position, directory_chat.chat_description);
                            }
                            else if (scope.page_status == 'hidden')
                            {
                                scope.notifyUser(data, directory_chat.index_position, directory_chat.chat_description);
                                scope.unread++;
                                document.title = scope.default_window_title + ' - ' + scope.unread + ' New';
                            }
                        }
                        if (!(ChatManager._is_playing_sound) && angular.equals(directory_chat.isSound, true)) {
                            ChatManager._is_playing_sound = true;
                            $timeout(function() {
                                NotificationService.__playSound(NotificationService._chat); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                                ChatManager._is_playing_sound = false;
                            }, 500);
                        }
                        if (directory_chat.isTextFocus === false) {
                            directory_chat.unread = directory_chat.unread + 1;
                            directory_chat.isNewMessage = true;
                            if (scope.priority_queue.indexOf(directory_chat.index_position) == -1) {
                                scope.priority_queue.unshift(directory_chat.index_position);
                            }
                            scope.last_unread_index = directory_chat.index_position;
                        }
                        if (el) {
                            scope.safeApply(function() {
                                $timeout(function() {
                                    el.scrollTop = el.scrollHeight;
                                });
                            });
                        }
                        $timeout(function() {
                            if (ChatManager.last_chat_logged == data.key) {
                                ChatManager.last_chat_logged = '';
                            }
                        }, 500);
                    }
                    return;
                } else {
                    $log.debug('Looks like this is a tremor request');
                    return false;
                }
            });
        }, 1000);
        return messageListQuery;
    };
    this.fetchMoreMessages = function(scope, directory_chat) {
        var chats, log, location;
        $log.debug('DirectoryChatManager.__fetchMoreMessages');
        $log.debug(directory_chat);
        scope.temp_chats = Array();
        var endAt = directory_chat.first_priority - 1;
        var startAt = endAt - that._message_fetch_size;
        $log.debug('startAt: ' + startAt + ' endAt: ' + endAt);
        /*      directory_chat.reload = true;    */
        if (directory_chat.isGroupChat) {
            chats = directory_chat.group_chats;
            log = directory_chat.group_chat_log;
            location = directory_chat.group_message_location;
        } else {
            chats = directory_chat.chats;
            log = directory_chat.chat_log;
            location = directory_chat.user_message_location;
        }
        location.endAt(endAt).limit(that._message_fetch_size).once('value', function(snapshot) {
            var prev = snapshot.val();
            var i;
            if (prev) {
/*              console.log('fetching'); */
                directory_chat.reload = true;
                var prev_array = Array();
                for( i in prev ) {
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
                        scope.isMessagePastHour(chats[1], directory_chat.time_reference);
                    });
                    scope.getAuthorAvatar(chats[0], false);
                    scope.getAuthorFirstName(chats[0]);
                    scope.isMessageFromUser(chats[0]);
                    scope.isAuthorSameAsLast(chats[0], undefined);
                    scope.isLastMessagePastMinute(chats[0], undefined);
                    scope.isMessagePastHour(chats[0], directory_chat.time_reference);
                    directory_chat.first_priority = chats[0].priority;
                    if (directory_chat.first_priority == 1) {
                        directory_chat.isMorePrev = false;
                    }
                }, 900);
                $timeout(function() {
                    directory_chat.scroll_top = false;
                    directory_chat.scroll_bottom = false; /*                    console.log('done fetching'); */
                    $("#" + 'message_display_' + directory_chat.index_position).animate({
                        scrollTop: 0
                    }, 2000);
                }, 500);
            } else {
                directory_chat.scroll_top = false;
                directory_chat.scroll_bottom = false;
                directory_chat.scroll_top = true;
                directory_chat.isMorePrev = false;
                directory_chat.reload = false;
                directory_chat.first_priority = chats[0].priority; /*               console.log('done fetching'); */
                return false;
            }
        });
    };
    return this;

}]);
