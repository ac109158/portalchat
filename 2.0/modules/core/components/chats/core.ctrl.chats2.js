angular.module('portalchat.core').
controller('ChatController', ['$rootScope', '$scope', '$window', '$log', 'CoreConfig', 'ChatManager', 'DirectoryChatManager', 'UserManager', 'OnlineService', 'UtilityManager', 'BrowserService', 'ChatRecordService', 'AudioService', '$timeout', 'EmojiService', 'states', 'NotificationService', '$sce', '$filter', 'localStorageService', function($rootScope, $scope, $window, $log, CoreConfig, ChatManager, DirectoryChatManager, UserManager, OnlineService, UtilityManager, BrowserService, ChatRecordService, AudioService, $timeout, EmojiService, states, NotificationService, $sce, $filter, localStorageService) {
    angular.isUndefinedOrNull = function(val) {
        return angular.isUndefined(val) || val === null;
    };









    $scope.getDirectoryMainPanelHeight = function(chat) {
        var size;
        if (angular.isUndefinedOrNull(chat)) {
            return false;
        }
        if ($scope.layout === 1) {
            if (chat.topic_location.$value !== false) {

                return $scope.cm_directory_chat_height - 20;
            }
            return $scope.cm_directory_chat_height;

        }
        if ($scope.layout === 3) {
            if (chat.isMandatory) {
                if (angular.isDefined(chat) && chat !== null && chat.topic_location.$value !== false) {
                    size = ($scope.cm_directory_chat_height + $scope.vertical_adjust);
                    return size;
                }
                size = (parseInt($scope.cm_directory_chat_height) + parseInt($scope.vertical_adjust));
                return size;
            } else {
                if (angular.isDefined(chat) && chat !== null && chat.topic_location.$value !== false) {
                    size = ($scope.cm_directory_chat_height - $scope.vertical_adjust);
                    return size;
                }
                size = ($scope.cm_directory_chat_height - $scope.vertical_adjust);
                return size;
            }
        }
    };


    $scope.getChatBoxHeight = function(vertical_adjust) {
        return $scope.cm_chat_message_display_height + parseInt(vertical_adjust) - 75;
    };







    $scope.updateChatSettings = function(chat) {
        UserManager._user_settings_location.child(chat.index_position).update({
            isSound: chat.isSound,
            monitor: chat.monitor
        });
    };



    $scope.updateChatResize = function(chat) {
        ChatManager._active_sessions_user_location.child(chat.to_user_id || chat.session_key).update({
            'resize_adjust': chat.resize_adjustment
        });
    };

    $scope.toggleUserList = function(chat) {
        chat.showUserList = !chat.showUserList;
    };

    $scope.removeActiveUser = function(chat, user) {
        chat.group_user_location.child(user).set(null);
    };


    $scope.updateTopic = function(chat) {
        var new_topic = String($('#topic_' + chat.session_key).text()).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string
        if (new_topic === 'null' || new_topic === '' || new_topic.length < 5) {
            return false;
        }
        if (angular.isDefined(chat.firebase_location)) {
            chat.firebase_location.update({
                topic: new_topic
            });
        } else if (angular.isDefined(chat.active_session_location)) {
            chat.active_session_location.update({
                topic: chat.new_topic
            });
        }
        $scope.getTopicHeight(chat);
        $scope.clear(chat);
        chat.isTextFocus = true;
        return false;
    };

    $scope.updateDirectoryTopic = function(chat) {
        var new_topic = String($('#topic_' + chat.session_key).text()); // sanitze the string
        if (new_topic === 'null' || new_topic === '' || new_topic.length < 5) {
            return false;
        }
        if (angular.isDefined(chat.firebase_location)) {
            chat.firebase_location.update({
                topic: new_topic
            });
        }
        $scope.clearDirectory(chat);
        chat.isTextFocus = true;
        return false;
    };

    $scope.inviteToggle = function(chat) {
        $scope.clear(chat);
        chat.invite = !chat.invite;
        if (angular.isUndefined(chat.invite_list)) {
            chat.invite_list = Array();
        }
        if (angular.isDefined(chat.close_invite)) {
            clearInterval(chat.close_invite);
        }
        if (chat.invite === true) {
            chat.showUserOptions = false;
            chat.invite_list = Array();
            angular.forEach($scope.online_users_list, function(val, key) {
                if ($scope.isGroupChatEligibile(chat, val)) {
                    chat.invite_list.push({
                        avatar: val.avatar,
                        name: val.name,
                        user_id: val.user_id
                    });
                }
            });
            $scope.watch_text = chat.chat_text;
            $scope.last_invite_text = chat.chat_text;
            chat.close_invite = setInterval(function() {
                $scope.clear(chat);
                chat.isTextFocus = true;
                clearInterval(chat.close_invite);
            }, 15000);
        }
    };




    $scope.closeInvite = function(chat) {
        $scope.clear(chat);
        chat.isTextFocus = true;
        chat.invited = '';
    };

    $scope.resetTyping = function(chat) {
        if (angular.isUndefined(chat) || chat === null) {
            return false;
        }
        if (angular.isDefined(chat.typing_presence_timeout)) {
            clearInterval(chat.typing_presence_timeout);
        }
        if (angular.isDefined(chat.active_typing_to_user_location)) {
            chat.active_typing_to_user_location.update({
                'is-typing': false
            });
        }
    };


    $scope.showAsTyping = function(chat) {
        if (angular.isUndefined(chat.chat_text) || chat.chat_text === null) {
            /*          console.log('returning false'); */
            return false;
        }
        if (angular.isDefined(chat.typing_presence_timeout)) {
            $timeout.cancel(chat.typing_presence_timeout);
        }
        chat.active_typing_to_user_location.update({
            'is-typing': true
        });
        chat.typing_presence_timeout = $timeout(function() {
            chat.active_typing_to_user_location.update({
                'is-typing': false
            });
            $timeout.cancel(chat.typing_presence_timeout);
            chat.typing_presence_timeout = null;
        }, 2000);
    };

    $scope.isGroupTyping = function(chat) {
        if (!chat || chat.chat_text === null || UtilityManager.firebase_connection === false) {
            return false;
        }
        /*
if ( angular.isUndefined(chat) || angular.isDefined(chat.group_chats) && chat.group_chats.length < 1 || chat.chat_text === null  )
        {
            return false;
        }
        var user_id = UserManager._user_profile.user_id;
        var avatar = UserManager._user_profile.avatar;
*/
        if (chat.typing_presence_timeout) {
            $timeout.cancel(chat.typing_presence_timeout);
        }
        /*      chat.firebase_location.child('is-typing').update({ UserManager._user_profile.user_id : avatar});     */
        chat.firebase_location.child('is-typing/' + UserManager._user_profile.user_id).set(UserManager._user_profile.avatar);
        chat.typing_presence_timeout = $timeout(function() {
            /*          chat.firebase_location.child('is-typing').update({ UserManager._user_profile.user_id : null}); */
            chat.firebase_location.child('is-typing/' + UserManager._user_profile.user_id).set(null);
            $timeout.cancel(chat.typing_presence_timeout);
        }, 750);
    };


    $scope.toggleChatBox = function(chat) {
        chat.isopen = !chat.isopen;
        if (chat.isopen === true) {
            chat.header_color = ChatManager._header_color;
            chat.unread = 0;
            chat.isTextFocus = true;
            $scope.getTimeReference(chat);
        } else {

            $scope.clear(chat);
        }
        $scope.getTopicHeight(chat);
        ChatManager.__updateIsOpen(chat);
    };



    $scope.setNextChatFocus = function(index) {
        if ($scope.activeChats.length === 1) {
            $log.debug('returning false');
            return false;
        }
        var next;
        $scope.activeChats[index].unread = 0;
        $scope.activeChats[index].isTextFocus = false;
        $scope.activeChats[index].isNewMessage = false;
        if ($scope.layout != 2) {
            $log.debug('setting next');
            if ($scope.priority_queue.length > 0) {
                next = $scope.priority_queue.pop();
                $log.debug('next from priority is ' + next);
            } else {
                next = index + 1;
            }
            if (next > $scope.activeChats.length - 1) {
                next = 0;
            }
            $log.debug('next is ' + next);
            $timeout(function() {
                $scope.directory_index = next;
                $scope.setDirectoryChat(next, true);
                $scope.referenceDirectoryItem();
            }, 250);
            return;
        } else if ($scope.layout === 2) {
            next = index - 1;
            $scope.activeChats[index].isTextFocus = false;
            if (next < 0) {
                next = $scope.activeChats.length - 1;
            }
            if (next >= $scope.max_count) {
                next = $scope.max_count - 1;
            }
            $scope.activeChats[next].isopen = true;
            $scope.activeChats[next].isTextFocus = true;
            return;
        }
    };


    $scope.clearHistory = function(chat) {
        chat.chats = Array();
        chat.group_chats = Array();
        chat.chat_log = Array();
        /*      chat.isMorePrev = false; */
        if (chat.isDirectoryChat) {
            $scope.clearDirectory(chat);
        } else {
            $scope.clear(chat);
        }

    };

    $scope.checkForCommand = function(chat) {
        if (chat.chat_text === $scope.command_key + 'c') {
            $scope.toggleChatBox(chat);
        } else if (chat.chat_text === $scope.command_key + 'q') {
            $scope.removeChatSession(chat);
        } else if (chat.chat_text === $scope.command_key + 'clear' || chat.chat_text === $scope.command_key + 'clr') {
            chat.chats = Array();
            chat.chat_log = Array();
            chat.isMorePrev = false;

        } else if (chat.chat_text === $scope.command_key + 's') {
            $scope.toggleChatSound(chat);
        } else if (chat.chat_text === $scope.command_key + 'at') {
            $scope.tagChatOn(chat);
        } else if (chat.chat_text === $scope.command_key + 'rt') {
            $scope.removeTag(chat);
        } else if (chat.chat_text === $scope.command_key + 'last') {
            $scope.moveChatToLast(chat.index_position);
            if ($scope.layout != 2) {
                $scope.setDirectoryChat($scope.activeChats.length - 1, true);
            }
        } else if (chat.chat_text === $scope.command_key + 'first') {
            $scope.moveChatToFirst(chat.index_position);
            if ($scope.layout != 2) {
                $scope.setDirectoryChat(0, true);
            }
        } else if (chat.chat_text === $scope.command_key + 'chat') {
            console.log(chat);
        } else if (chat.chat_text === $scope.command_key + 'chats') {
            console.log(chat.chats);
            console.log(chat.group_chats);
        } else if (chat.chat_text === $scope.command_key + 'self') {
            console.log(chat);
        } else if (chat.chat_text === $scope.command_key + 'user') {
            console.log(UserManager._user_profile);
        } else if (chat.chat_text === $scope.command_key + 'scope') {
            console.log($scope);
        } else if (chat.chat_text === $scope.command_key + 'browser') {
            chat.chat_text = BrowserService.platform.browser + " | " + BrowserService.platform.browserVersion + " | " + BrowserService.platform.os + ' - ' + BrowserService.platform.osVersion + ' |';
            $scope.addChatMessage(chat);
        } else if (chat.chat_text === $scope.command_key + 'os') {
            chat.chat_text = BrowserService.platform.os + ' | ' + BrowserService.platform.osVersion;
            $scope.addChatMessage(chat);
        } else if (chat.chat_text === $scope.command_key + 'platform') {
            console.log(BrowserService.platform);
        } else if (chat.chat_text === $scope.command_key + 'online') {
            console.log(UserManager._online_users_list);
        } else if (chat.chat_text === $scope.command_key + 'offline') {
            console.log(UserManager._offline_users_list);
        } else if (chat.chat_text === $scope.command_key + 'profiles') {
            console.log(UserManager._users_profiles_obj);
        } else if (chat.chat_text === $scope.command_key + 'ping') {
            $scope.runPingTest(chat);
        } else if (chat.chat_text === $scope.command_key + 'require-refresh') {
            console.log('require-refresh requested');
            if ($scope.admin_group.indexOf(UserManager._user_profile.position) != -1) {
                console.log('request allowed');
                UserManager.__requireRefresh();
            } else {
                console.log('refresh denied');
                console.log(UserManager._user_profile.position + ' not in admin');
            }
        }
        chat.chat_text = null;
        return;
    };
    $scope.inAdminGroup = function() {
        $log.debug(UserManager._user_profile.position);
        if ($scope.admin_group.indexOf(UserManager._user_profile.position) != -1) {
            return true;
        }
        return false;
    };


    $scope.addChatMessage = function(chat) {
        var chat_delay;
        /*      console.log(chat.chat_text); */
        if (angular.isUndefined(chat.chat_text) || chat.chat_text === null) {
            $scope.setNextChatFocus(chat.index_position);
        } else if (chat.chat_text.substring(0, 1) === $scope.command_key) {
            $scope.checkForCommand(chat);
            return;
        } else if (angular.isDefined(chat.chat_text) && chat.chat_text !== '' && chat.chat_text.length < 1000) {
            if (angular.isUndefined(chat.to_user_session) || chat.to_user_session === null) {
                chat_delay = 500;
                $scope.locationValue = '';
                ChatManager.__getLocationValue(chat.to_user_session_location, $scope);
                chat.to_user_session = $scope.locationValue;
            } else {
                chat_delay = 0;
            }

            /*          var chat_text = String(chat.chat_text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string */
            chat.scroll_bottom = false;
            var chat_text = chat.chat_text;
            chat.chat_text = null;
            chat.unread = 0;
            /*          var d = new Date(); */
            var n = Firebase.ServerValue.TIMESTAMP;
            clearInterval(chat.typing_presence_timeout);
            if (UserManager.encryption === true) {
                var session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
                chat_text = sjcl.encrypt(chat.session_key, chat_text);
            }
            if (chat.reference) {
                /*              console.log(chat.reference); */
            }
            $timeout(function() {
                var toFirekey = chat.to_user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: chat_text,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    reference: chat.reference,
                    referenceAuthor: chat.referenceAuthor,
                    referenceName: chat.referenceName,
                    referenceText: chat.referenceText,
                    time: n,
                    priority: chat.next_priority,
                    'session_key': session_key || chat.session_key
                }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                chat.to_user_last_chat = toFirekey.name();
                chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
                var selfFireKey = chat.user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: chat_text,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    reference: chat.reference,
                    referenceAuthor: chat.referenceAuthor,
                    referenceName: chat.referenceName,
                    referenceText: chat.referenceText,
                    time: n,
                    priority: chat.next_priority,
                    'session_key': session_key || chat.session_key
                }); // assign this task after sending to the to_user location !important
                chat.user_last_chat = selfFireKey.name();
                chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            }, chat_delay);
            chat.active_typing_to_user_location.update({
                'is-typing': false
            });
            ChatManager.__updateToUserActiveSession(chat);
            $scope.pingHost();
            $timeout(function() {
                chat.reference = null;
                chat.referenceAuthor = null;
                chat.referenceName = null;
                chat.referenceText = null;
                if (chat.scroll_top === true) {
                    chat.scroll_top = false;
                }
                chat.scroll_bottom = true;
            }, (chat_delay + 250));
            $scope.directory_index = chat.index_position;

        }
    };

    $scope.getPrivateKey = function(key) {
        $log.debug('getting private key');
        if (UserManager._user_profile.role === 'PlusOne Admin' && $scope.isPageComplete) {
            $log.debug('ALLOWED private key');
            return key;
            /*          return sjcl.decrypt(CoreConfig.encrypt_pass,key) */
        }
        $log.debug('DENIED private key');
        return null;
    };

    $scope.addGroupChatMessage = function(chat) {
        var session_key;
        if (angular.isUndefined(chat.chat_text) || chat.chat_text === null) {
            $scope.setNextChatFocus(chat.index_position);
            return;
        } else if (chat.chat_text.substring(0, 1) === $scope.command_key) {
            $scope.checkForCommand(chat);
        } else if (chat.chat_text !== '') {
            chat.scroll_bottom = false;
            /*          var chat_text = String(chat.chat_text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string */
            var chat_text = chat.chat_text;
            if (UserManager.encryption === true) {
                session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
                chat_text = sjcl.encrypt(chat.session_key, chat_text);
            }
            /*          var d = new Date(); */
            var n = Firebase.ServerValue.TIMESTAMP;
            var firekey = chat.group_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                avatarId: UserManager._user_profile.avatar,
                encryption: UserManager.encryption,
                reference: chat.reference,
                referenceAuthor: chat.referenceAuthor,
                referenceName: chat.referenceName,
                referenceText: chat.referenceText,
                to: chat.session_key,
                text: chat_text,
                time: n,
                priority: chat.next_priority,
                'session_key': session_key || chat.session_key
            });
            chat.user_last_chat = firekey.name();
            chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            chat.chat_text = null;
            chat.unread = 0;

            $timeout(function() {
                chat.reference = null;
                chat.referenceAuthor = null;
                chat.referenceName = null;
                chat.referenceText = null;
                if (chat.scroll_top === true) {
                    chat.scroll_top = false;
                }
                chat.scroll_bottom = true;
            }, 250);
            $timeout(function() {
                chat.scroll_bottom = false;
            }, 500);


            $scope.pingHost();
        }
    };

    $scope.to_trusted = function(html_code) {
        return $sce.trustAsHtml(html_code);
    };

    $scope.logValue = function(value) {
        $log.debug(value);
    };

    //ng-init="isMessagePastHour(message, directory_chat.time_reference); isLastMessagePastMinute(message, directory_chat.chats[$index-1].time); isAuthorSameAsLast(message, directory_chat.chat_log[$index-1]); isMessageFromUser(message);


    $scope.setChatMessage = function(message, chat, index) {
        if (chat.isGroupChat === false) {
            if (index - 1 > -1) {
                $scope.checkTimeLapse(message, chat.chats[index - 1].time, chat.chats, index - 1);
                $scope.isMessagePastHour(message, chat.time_reference);
                $scope.isLastMessagePastMinute(message, chat.chats[index - 1].time);
                $scope.isAuthorSameAsLast(message, chat.chat_log[index - 1]);
                $scope.isMessageFromUser(message);
            } else {
                $scope.isMessagePastHour(message, chat.time_reference);
                $scope.isLastMessagePastMinute(message, chat.time_reference);
                $scope.isAuthorSameAsLast(message, 0);
                $scope.isMessageFromUser(message);
            }
        } else {
            if (index - 1 > -1 && chat.group_chats[index - 1].time) {
                $scope.getAuthorFirstName(message);
                $scope.checkTimeLapse(message, chat.group_chats[index - 1].time, chat.group_chats, index - 1);
                $scope.getAuthorAvatar(message, chat.user_details);
                $scope.isMessagePastHour(message, chat.time_reference);
                $scope.isLastMessagePastMinute(message, chat.group_chats[index - 1].time);
                $scope.isAuthorSameAsLast(message, chat.group_chat_log[index - 1]);
                $scope.isMessageFromUser(message);
            } else {
                $scope.getAuthorFirstName(message);
                $scope.getAuthorAvatar(message, chat.user_details);
                $scope.isMessagePastHour(message, chat.time_reference);
                $scope.isLastMessagePastMinute(message, 0);
                $scope.isAuthorSameAsLast(message, 0);
                $scope.isMessageFromUser(message);
            }
        }
    };

    $scope.getAuthorAvatar = function(message, user_details) {
        if (message.author === ChatManager._internal_reference) {
            message.avatar = false;
            return;
        } else if (angular.isDefined(UserManager._users_profiles_obj['user_' + message.author])) {
            message.avatar = '/components/com_callcenter/images/avatars/' + UserManager._users_profiles_obj['user_' + message.author].avatar + '-90.jpg';
            return;
        } else if (angular.isDefined(user_details[message.author])) {
            message.avatar = '/components/com_callcenter/images/avatars/' + user_details[message.author].avatar + '-90.jpg';
            return;
        }
        if (angular.isDefined(message.avatarId)) {
            message.avatar = '/components/com_callcenter/images/avatars/' + message.avatarId + '-90.jpg';
            return;
        }
        /*      console.log(message); */

    };


    $scope.getAuthorFirstName = function(message) {
        if (message.authorName) {
            var name_split = message.authorName.match(/\S+/g); // splits the to_users first and last name
            message.author_f_name = name_split[0];
        }

    };

    $scope.isMessagePastHour = function(message, time_reference) {
        if (((3600000 + message.time) - time_reference) <= 0) {
            message.past_hour = true;
        } else {
            message.past_hour = false;
        }
    };

    $scope.checkTimeLapse = function(message, prev_chat_time, chats, prev_index) {
        if (prev_index > -1) {
            if (((120000 + prev_chat_time) - message.time) <= 0) {
                message.time_lapse = true;
                chats[prev_index].was_time_lapse = true;
            } else {
                message.time_lapse = false;
                chats[prev_index].was_time_lapse = false;
            }
        }
    };

    $scope.isLastMessagePastMinute = function(message, prev_chat_time) {
        if (((60000 + prev_chat_time) - message.time) <= 0) {
            message.minute_from_last = true;
        } else {
            message.minute_from_last = false;
        }
    };

    $scope.isAuthorSameAsLast = function(message, prev_author) {
        if (prev_author === message.author) {
            message.from_prev_author = true;
        } else {
            message.from_prev_author = false;
        }
    };

    $scope.isMessageFromUser = function(message) {
        if (message.author === UserManager._user_profile.user_id) {
            message.author_is_self = true;
        } else {
            message.author_is_self = false;
        }
    };

    $scope.getTimeReference = function(chat) {
        chat.time_reference = new Date().getTime();
    };

    $scope.removeChatSession = function(chat) {
        $scope.last_deactivated_chat = chat.to_user_id || chat.session_key;
        $timeout(function() {
            ChatManager.__deactivate_session_from_user_location(chat, $scope, true, true);
        }, 250);

    };

    $scope.nudgeUser = function(chat) {
        ChatManager.__updateToUserActiveSession(chat);
        $timeout(function() {
            ChatManager.__nudgeUser(chat);
            var n = Firebase.ServerValue.TIMESTAMP;
            var chat_text = $scope.to_trusted('<i class="fa fa-bolt"></i> ' + chat.to_user_f_name + ' has been nudged. <i class="fa fa-bolt"></i>');
            chat.chats.push({
                author: ChatManager._internal_reference,
                to: chat.to_user_id,
                text: chat_text,
                time: n,
                priority: -1,
                session_key: chat.session_key
            });
            chat.chat_log.push(ChatManager._internal_reference);
            if (chat.isDirectoryChat) {
                $scope.clearDirectory(chat);
            } else {
                $scope.clear(chat);
            }
        }, 1000);
    };

    $scope.addEmoji = function(emoji, chat) {
        chat.emotions = false;
        if (angular.isUndefinedOrNull(chat.chat_text)) {
            chat.chat_text = '';
        }
        chat.chat_text = chat.chat_text + emoji + ' ';
        chat.isTextFocus = true;
    };

    $scope.toggleEmoji = function(chat) {
        chat.emotions = !chat.emotions;
    };

    $scope.chat_sound = new Howl({
        urls: ['/components/com_callcenter/views/training/ng/js/chat.mp3'],
        volume: 0.05
    });


    $scope.mute = function() {
        NotificationService.__mute();

    };

    $scope.unmute = function() {
        NotificationService.__unmute();
    };

    $scope.toggleChatSound = function(chat) {
        chat.isSound = !chat.isSound;
        ChatManager.__updateIsSound(chat.to_user_id || chat.session_key, chat.isSound);
        $scope.clear(chat);
    };

    $scope.toggleVideo = function(chat) {
        $scope.video.heading = '';
        $scope.video.url = '';
        $scope.video.code = '';
        $scope.video.message = '';
        chat.addVideo = !chat.addVideo;
        $scope.clear(chat);

    };

    $scope.toggleAudio = function(chat) {
        $scope.audio.heading = '';
        $scope.audio.heading = '';
        $scope.audio.url = '';
        $scope.audio.cid = '';
        chat.addAudio = !chat.addAudio;

        $scope.clear(chat);
    };

    $scope.initAudio = function(message) {
        if (message.showAudio) {
            message.showAudio = !message.showAudio;
            return false;
        }
        if (message.cid) {
            AudioService.asyncMessage($scope, message, message.cid);
        } else if (message.audio && angular.isUndefined(message.init_audio)) {
            message.audio = $sce.trustAsResourceUrl(message.audio);
        }
        if (angular.isUndefined(message.init_audio)) {
            $timeout(function() {
                message.init_audio = true;
                message.showAudio = !message.showAudio;
            }, 1000);
        } else {
            message.showAudio = !message.showAudio;
        }
    };

    $scope.toggleImage = function(chat) {
        chat.addImage = !chat.addImage;
        if (!chat.addImage) {
            $scope.image.url = '';
            $scope.image.heading = '';
            $scope.image.message = '';
        }
        $scope.clear(chat);
    };

    $scope.getTrustedUrl = function(message) {
        if (message && message.audio) {
            message.audio = $sce.trustAsResourceUrl(message.audio);
        }
    };

    $scope.addVideoMessage = function(chat) {
        chat.scroll_bottom = false;
        var n = Firebase.ServerValue.TIMESTAMP;
        if (chat.isGroupChat) {
            var firekey = chat.group_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                avatarId: UserManager._user_profile.avatar,
                encryption: UserManager.encryption,
                to: chat.session_key,
                text: $scope.video.message,
                code: $scope.video.code,
                heading: $scope.video.heading,
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            });
            chat.user_last_chat = firekey.name();
            chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
        } else {
            var toFirekey = chat.to_user_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                to: chat.to_user_id,
                text: $scope.video.message,
                code: $scope.video.code,
                heading: $scope.video.heading,
                encryption: UserManager.encryption,
                offline: !(chat.to_user_online.$value),
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
            chat.to_user_last_chat = toFirekey.name();
            chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
            var selfFireKey = chat.user_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                to: chat.to_user_id,
                text: $scope.video.message,
                code: $scope.video.code,
                heading: $scope.video.heading,
                encryption: UserManager.encryption,
                offline: !(chat.to_user_online.$value),
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            }); // assign this task after sending to the to_user location !important
            chat.user_last_chat = selfFireKey.name();
            chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            ChatManager.__updateToUserActiveSession(chat);

        }
        $scope.video.heading = '';
        $scope.video.url = '';
        $scope.video.code = '';
        $scope.video.message = '';
        chat.unread = 0;

        $timeout(function() {
            if (chat.scroll_top === true) {
                chat.scroll_top = false;
            }
            chat.scroll_bottom = true;
        }, 250);
        $timeout(function() {
            chat.scroll_bottom = false;
        }, 500);
        chat.addVideo = false;
    };

    $scope.addAudioMessage = function(chat) {
        chat.scroll_bottom = false;
        var firekey, toFirekey, selfFireKey;
        var n = Firebase.ServerValue.TIMESTAMP;
        $log.debug($scope.audio.cid);
        $log.debug($scope.audio.url);
        if ($scope.audio.cid.length === 10) {
            if (chat.isGroupChat) {
                firekey = chat.group_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    avatarId: UserManager._user_profile.avatar,
                    encryption: UserManager.encryption,
                    to: chat.session_key,
                    text: $scope.audio.message,
                    cid: $scope.audio.cid,
                    heading: $scope.audio.heading,
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                });
                chat.user_last_chat = firekey.name();
                chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            } else {
                toFirekey = chat.to_user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: $scope.audio.message,
                    cid: $scope.audio.cid,
                    heading: $scope.audio.heading,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                chat.to_user_last_chat = toFirekey.name();
                chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
                selfFireKey = chat.user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: $scope.audio.message,
                    cid: $scope.audio.cid,
                    heading: $scope.audio.heading,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                }); // assign this task after sending to the to_user location !important
                chat.user_last_chat = selfFireKey.name();
                chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
                ChatManager.__updateToUserActiveSession(chat);

            }
        } else {
            if (chat.isGroupChat) {
                firekey = chat.group_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    avatarId: UserManager._user_profile.avatar,
                    encryption: UserManager.encryption,
                    to: chat.session_key,
                    text: $scope.audio.message,
                    audio: $scope.audio.url.toString(),
                    heading: $scope.audio.heading,
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                });
                chat.user_last_chat = firekey.name();
                chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            } else {
                toFirekey = chat.to_user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: $scope.audio.message,
                    audio: $scope.audio.url.toString(),
                    heading: $scope.audio.heading,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                chat.to_user_last_chat = toFirekey.name();
                chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
                selfFireKey = chat.user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: $scope.audio.message,
                    audio: $scope.audio.url.toString(),
                    heading: $scope.audio.heading,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                }); // assign this task after sending to the to_user location !important
                chat.user_last_chat = selfFireKey.name();
                chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
                ChatManager.__updateToUserActiveSession(chat);
            }
        }

        $scope.audio.cid = '';
        $scope.audio.url = '';
        $scope.audio.heading = '';
        $scope.audio.message = '';
        chat.unread = 0;

        $timeout(function() {
            if (chat.scroll_top === true) {
                chat.scroll_top = false;
            }
            chat.scroll_bottom = true;
        }, 250);
        $timeout(function() {
            chat.scroll_bottom = false;
        }, 500);
        chat.addAudio = false;
    };


    $scope.addImageMessage = function(chat) {
        chat.scroll_bottom = false;
        var n = Firebase.ServerValue.TIMESTAMP;
        if (chat.isGroupChat) {
            var firekey = chat.group_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                avatarId: UserManager._user_profile.avatar,
                encryption: UserManager.encryption,
                to: chat.session_key,
                text: $scope.image.message,
                image: $scope.image.url,
                heading: $scope.image.heading,
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            });
            chat.user_last_chat = firekey.name();
            chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);

        } else {
            var toFirekey = chat.to_user_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                to: chat.to_user_id,
                text: $scope.image.message,
                image: $scope.image.url,
                heading: $scope.image.heading,
                encryption: UserManager.encryption,
                offline: !(chat.to_user_online.$value),
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
            chat.to_user_last_chat = toFirekey.name();
            chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
            var selfFireKey = chat.user_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                to: chat.to_user_id,
                text: $scope.image.message,
                image: $scope.image.url,
                heading: $scope.image.heading,
                encryption: UserManager.encryption,
                offline: !(chat.to_user_online.$value),
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            }); // assign this task after sending to the to_user location !important
            chat.user_last_chat = selfFireKey.name();
            chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            ChatManager.__updateToUserActiveSession(chat);
        }
        $scope.image.heading = '';
        $scope.image.url = '';
        $scope.image.message = '';
        chat.unread = 0;

        $timeout(function() {
            if (chat.scroll_top === true) {
                chat.scroll_top = false;
            }
            chat.scroll_bottom = true;
        }, 250);
        $timeout(function() {
            chat.scroll_bottom = false;
        }, 500);
        chat.addImage = false;
    };

    $scope.updateMessage = function(chat, priority, index) {
        var encrypted_text;
        if (angular.isUndefined(chat.to_user_last_chat) || angular.isUndefined(chat.user_last_chat)) return false;
        var updated_text = $('#ID_' + chat.to_user_id + '_' + priority).text();
        if (updated_text === 'null' || updated_text === '') return false;
        /*      updated_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string */
        chat.chats[index].text = updated_text;
        if (UserManager.encryption === true) {
            var session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
            encrypted_text = sjcl.encrypt(chat.session_key, updated_text);
            if (encrypted_text === 'null' || new_text === '') return false;
        }
        chat.user_message_location.child(chat.user_last_chat).update({
            text: encrypted_text || updated_text
        });
        chat.to_user_message_location.child(chat.to_user_last_chat).update({
            text: encrypted_text || updated_text
        });
        chat.isTextFocus = true;
        $timeout(function() {
            $scope.resetTyping(chat);
        }, 500);
        return false;
    };

    $scope.updateGroupMessage = function(chat, priority, index) {
        /*      console.log('start'); */
        var encrypted_text;
        if (angular.isUndefined(chat.user_last_chat)) return false;
        var updated_text = $('#ID_' + chat.session_key + '_' + priority + '_group').text();
        /*      console.log('updated_text: ' + updated_text); */
        if (updated_text === 'null' || updated_text === '') return false;
        /*      updated_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string */
        chat.group_chats[index].text = updated_text;
        if (UserManager.encryption === true) {
            var session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
            encrypted_text = sjcl.encrypt(chat.session_key, updated_text);
            if (encrypted_text === 'null' || new_text === '') return false;
        }
        chat.group_message_location.child(chat.user_last_chat).update({
            text: encrypted_text || updated_text
        });
        chat.isTextFocus = true;
        return false;
    };

    /*
        $scope.updateGroupMessage = function(chat, index)
        {
            chat.isTextFocus = true;
            var updated_text =  $( '#ID' + chat.session_key + '_' + index ).text();
            if (updated_text === 'null' || updated_text === '') return false;
            var new_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string
            if ( UserManager.encryption === true)
            {
                var session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
                new_text = sjcl.encrypt(chat.session_key, new_text);
            }
            if (new_text === 'null' || new_text === '') return false;
            chat.group_message_location.child(chat.group_chats[index].key).update({text: new_text});
            chat.isTextFocus = true;
            return false;
        }
    */



    $scope.last_pushed = function(session) {
        /*      console.log(session + ' : ' + ChatManager._last_pushed_session); */
        /*      console.log(session === ChatManager._last_pushed_session) */
        return session === ChatManager._last_pushed_session;
    };

    $scope.last_deactivated = function(session) {
        /*      console.log(session + ' : ' + $scope.last_deactivated_chat); */
        /*      console.log(session === $scope.last_deactivated_chat); */
        return session === $scope.last_deactivated_chat;
    };

    $scope.isTrue = function(bool) {
        if (bool) {
            $log.debug('it was true');

            return true;

        }
        return false;
    };

    $scope.isReloading = function(chat) {
        if (chat === null) {
            return false;
        }
        if (angular.isDefined(chat) && chat.reload === true) {
            $timeout(function() {
                chat.reload = false;
            }, 1000);

            return true;

        }
        return false;
    };



    $scope.reloadChat = function(index) {
        $scope.temp_chat = $scope.activeChats[index];
        $scope.activeChats[index] = null;
        $scope.activeChats[index] = $scope.temp_chat;
        $scope.temp_chat = null;
    };

    $scope.moveChatToLast = function(index) {
        $scope.temp_chat = $scope.activeChats[index];
        $scope.activeChats.splice(index, 1);
        $scope.activeChats.push($scope.temp_chat);
        $scope.temp_chat = null;
        $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
        $scope.resetChatUnread();
        $scope.setActiveChatsPriority();
    };

    $scope.moveChatToFirst = function(index) {
        $scope.temp_chat = $scope.activeChats[index];
        $scope.activeChats.splice(index, 1);
        $scope.activeChats.unshift($scope.temp_chat);
        $scope.temp_chat = null;
        $scope.setActiveChatsPriority();
        /*      ChatManager.__setLastPushed($scope.activeChats[0].to_user_id || $scope.activeChats[0].session_key); */
    };

    $scope.loadMore = function(chat) {
        if (angular.isUndefined(chat.first_priority) || chat.first_priority === 0 || !(chat.isMorePrev)) {
            chat.isMorePrev = false;
            /*          console.log('there is no more'); */
            return false;
        }
        if (!(chat.reload) && chat.isMorePrev === true) {
            /*          console.log('is more'); */
            var previous = chat.next_priority;
            if (chat.isGroupChat) {
                ChatManager.__fetchMoreMessages($scope, chat.index_position, chat.group_message_location, chat.first_priority - 1);
            } else {
                ChatManager.__fetchMoreMessages($scope, chat.index_position, chat.user_message_location, chat.first_priority - 1);
            }
            $timeout(function() {
                chat.scroll_bottom = false;
                chat.scroll_top = true;
            });
        }
    };

    $scope.loadMoreGroupChat = function(chat) {
        if (chat.reload) {
            console.log("returning false");
            return false;
        }
        if (angular.isUndefined(chat.first_priority) || chat.first_priority === 0 || !(chat.isMorePrev)) {
            chat.isMorePrev = false;
            $log.debug('there is no more');
            return false;
        }
        DirectoryChatManager.__fetchMoreMessages($scope, chat);

    };

    $scope.addReferenceMessage = function(chat, message) {
        if (message.author === UserManager._user_profile.user_id) {
            chat.referenceName = chat.self_name;
        } else if (!chat.isGroupChat) {
            chat.referenceName = chat.to_user_f_name;
        } else {
            var name_split = message.authorName.match(/\S+/g); // splits the to_users first and last name
            chat.referenceName = name_split[0];
        }
        chat.reference = message.priority;
        chat.referenceText = message.text;
        chat.referenceAuthor = message.author;
        chat.isTextFocus = true;
    };

    $scope.referenceMessage = function(reference, reference_id, display_id) {
        /*      console.log('referencing ' + reference); */
        $scope.referenced_message = null;
        $scope.referenced_display = null;
        $scope.referenced_message_id = null;
        /*      console.log(reference ); */
        if (reference !== null) {
            /*          console.log('referencing message:' + reference); */
            $scope.referenced_message = reference;
            $scope.referenced_message_id = reference_id;
            /*          console.log($scope.referenced_message_id);           */
            $scope.referenced_display = display_id;
        } else {
            $log.debug('Reference was null');
        }

    };

    $scope.isReferencedMessage = function(message) {

        if ($scope.referenced_message !== null && $scope.referenced_message === message.priority && !$scope.referencing) {
            $scope.referencing = true;
            /*          console.log($scope.referenced_message + ' : ' + message.priority); */
            /*          console.log('Reference was true'); */
            $timeout(function() {
                $scope.referenced_message = null;
                $scope.referenced_message_id = null;
                $scope.referenced_display = null;
                $scope.referencing = false;
            }, 3000);
            return true;
        }
        return false;
    };


    $scope.isDirectoryItem = function(index) {
        if (index === null || index === undefined) {
            return false;
        }
        if (angular.isDefined($scope.referenced_index) && $scope.referenced_index === index) {
            /*          console.log('Reference was true'); */
            $scope.referenced_index = null;
            return true;
        }
        return false;
    };

    $scope.isLastUnread = function(index) {
        if (angular.isDefined($scope.last_unread_index) && $scope.last_unread_index === index) {
            /*          console.log('Reference was true' + $scope.last_unread_index + ' : ' + index ); */
            $scope.last_unread_index = null;
            return true;
        }
        return false;
    };

    $scope.setTextFocus = function(chat) {
        /*      chat.isTextFocus = true; */
        $scope.$evalAsync(function() {
            chat.unread = 0;
            chat.isNewMessage = false;
            chat.showProfile = false;
            chat.nudge = false;
            if (chat.header_color != ChatManager._header_color) {
                chat.header_color = ChatManager._header_color;
            }
            chat.isTextFocus = true;
        });
    };

    $scope.setDirectoryFocus = function(chat) {
        /*      chat.isTextFocus = true; */
        if (chat === null) {
            return false;
        }
        chat.unread = 0;
        chat.isNewMessage = false;
        chat.showProfile = false;
        chat.isTextFocus = true;
        chat.nudge = false;
    };



    $scope.setMandatoryFocus = function(chat) {
        if (chat) {
            if (chat.group_chat_log.length > $scope.directory_limit) {
                var i = 0;
                chat.group_chats = chat.group_chats.slice(-($scope.directory_limit));
                chat.group_chat_log = chat.group_chat_log.slice(-($scope.directory_limit));
                $log.debug(chat.group_chats);
                /*              chat.group_chats.length = 20; */
                chat.next_priority = chat.group_chats[chat.group_chats.length - 1].priority + 1;
                chat.first_priority = chat.group_chats[0].priority;
                while (!chat.first_priority) {
                    i++;
                    chat.first_priority = chat.group_chats[i].priority;
                }

            }
            $scope.clearMandatoryList();
            $scope.mandatory_index = chat.session_key;
            $log.debug(chat.index_position);
            if ($scope.layout === 1) {
                $scope.directory_index = null;
                if ($scope.directory_chat) {
                    $scope.directory_chat.isTextFocus = false;
                    $scope.directory_chat.nudge = false;
                }
                UserManager._user_settings_location.update({
                    'last-active-chat': chat.session_key,
                    'last-mandatory-chat': chat.session_key
                });
            } else if ($scope.layout != 1) {
                UserManager._user_settings_location.update({
                    'last-mandatory-chat': chat.session_key
                });
            }
            $timeout(function() {
                chat.isTextFocus = true;
                chat.scroll_bottom = true;
                chat.unread = 0;
            }, 250);

        }
    };
    $scope.tablist = ['blank', 'contacts', 'sm_group_chat', 'sm_tech_chat', 'mc_group_chat', 'directory_chat'];
    $scope.setNexTab = function() {
        var next_tmp = $scope.tmp + 1;
        if ($scope.activeChats.length > 0 && $scope.layout === 1) {
            if (next_tmp > 5) {
                next_tmp = 1;
            }
        } else {
            if (next_tmp > 4) {
                next_tmp = 1;
            }
        }
        $scope.updateTmp(next_tmp);
        $timeout(function() {
            if (next_tmp === 1) {
                $scope.setContactsFocus();
            } else if (next_tmp === 5) {
                $scope.setDirectoryChat($scope.stored_directory_index, true);
            } else {
                $scope.setMandatoryFocus($scope[$scope.tablist[next_tmp]]);
            }
        }, 250);
    };

    $scope.setContactsFocus = function() {
        $scope.clearMandatoryList();
        if ($scope.layout === 1) {
            $scope.directory_index = null;
            if ($scope.directory_chat) {
                $scope.directory_chat.isTextFocus = false;
            }
            UserManager._user_settings_location.update({
                'last-active-chat': 'contacts'
            });
        } else if ($scope.layout === 3) {
            UserManager._user_settings_location.update({
                'last-mandatory-chat': 'contacts'
            });
        }
        $scope.updateTmp(0);
        $timeout(function() {
            $scope.directory_search.isFocusText = true;
            $scope.mandatory_index = 'contacts';
        }, 250);

    };

    $scope.sendChatReceipt = function(chat) {
        $log.debug(chat.isGroupChat);
        if (angular.isUndefined(chat)) {
            return false;
        }
        var options = {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        };
        var chat_record = {};
        chat_record.participants = Array();
        chat_record.messages = Array();
        chat_record.timestamp = new Date().toLocaleTimeString("en-us", options);
        if (chat.isGroupChat) {
            if (chat.group_chats.length === 0) {
                return false;
            }
            chat_record.type = 'Group Chat';
            angular.forEach(chat.participant_log, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push(value);
            }, chat_record.participants);
            angular.forEach(chat.group_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push({
                    author: value.authorName,
                    avatar: value.avatar,
                    time: Math.ceil(value.time / 1000),
                    text: value.text,
                    referenceName: value.referenceName || null,
                    referenceText: value.referenceText || null
                });
            }, chat_record.messages);
        } else {
            if (chat.chats.length === 0) {
                return false;
            }
            chat_record.type = "Personal";
            chat_record.participants.push(UserManager._user_profile.name);
            chat_record.participants.push(chat.to_user_name);
            angular.forEach(chat.chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push({
                    author: value.authorName,
                    time: Math.ceil(value.time / 1000),
                    text: value.text,
                    referenceName: value.referenceName || null,
                    referenceText: value.referenceText || null
                });
            }, chat_record.messages);
        }
        ChatRecordService.async(chat_record);
        var time = Firebase.ServerValue.TIMESTAMP;
        var chat_text = 'Chat Log sent to email.';
        if (chat.isGroupChat) {
            chat.group_chats.push({
                author: ChatManager._internal_reference,
                to: chat.session_key,
                text: chat_text,
                'time': time,
                priority: 'internal',
                session_key: chat.session_key
            });
            chat.group_chat_log.push(ChatManager._internal_reference);
        } else {
            chat.chats.push({
                author: ChatManager._internal_reference,
                to: chat.session_key,
                text: chat_text,
                'time': time,
                priority: 'internal',
                session_key: chat.session_key
            });
            chat.chat_log.push(ChatManager._internal_reference);
        }

        $scope.clear(chat);
    };

    /*     $scope.user_group = [UserManager.getUserField('user_id'), UserManager.getUserField('pc'), UserManager.getUserField('mc'), UserManager.getUserField('admin')]; */


    $scope.toggleFilterMenu = function() {
        $scope.showFilterMenu = !$scope.showFilterMenu;
    };

    $scope.toggleOffline = function() {
        $scope.showFilterMenu = false;
        $scope.directory_show_online_only = !$scope.directory_show_online_only;
    };


    $scope.directory_show_online_only = true;
    $scope.directory_show_offline_only = false;
    $scope.directory_show_position_only = false;
    $scope.directory_show_team_only = false;

    $scope.showInGeneralDirectory = function(user) // this function will determine the client has filtered the user out of the general directory user list
        {
            if (angular.isDefined(UserManager.user_group) && UserManager.user_group.indexOf('user_' + user.user_id) > -1) {
                /*          console.log(user.name + 'is in user_group' + angular.toJson(UserManager.user_group)); */
                return false;
            }
            if ($scope.smod && $scope.tod) {
                if (user.user_id === $scope.smod.user_id || user.user_id === $scope.tod.user_id) {
                    return false;
                }
            }
            if ($scope.directory_show_online_only) {
                if (user.state === "Offline") {
                    /*              console.log(user.name + 'is not online'); */
                    return false;
                }
            }
            if ($scope.directory_show_position_only) // filter by position
            {
                if (user.position != $scope.directory_show_position) {
                    /*              console.log(user.name + 'is not a' + $scope.directory_show_position_only); */
                    return false;
                }
            }
            /*
if ($scope.directory_show_team_only)
        {
            if ( TeamService.user_team.indexOf(user.user_id) === -1)
            {
                console.log(user.name + 'is not in ');
                return false;
            }
        }
*/
            return true;
        };

    $scope.selectDirectorySelection = function() {
        /*      console.log($scope.filtered_directory_array); */
        if ($scope.directory_search.text.length > 0 && angular.isDefined($scope.filtered_directory_array[0])) {
            /*          console.log($scope.filtered_directory_array[0].name + " : " + $scope.users_list[0].name); */
            $rootScope.$broadcast('requestChatSession', $scope.filtered_directory_array[0]);
            $scope.directory_search.text = '';
        }
    };


    $scope.$watch('directory_search.text', function(newVal, oldVal) {
        $scope.filtered_directory_array = $filter('filter')($scope.users_list, newVal);
        $scope.filtered_directory_array = $filter('orderBy')($scope.filtered_directory_array, 'name');
    });

    $scope.isCurrentDirectorySelection = function(user_id) {
        if ($scope.directory_search.text.length > 0 && angular.isDefined($scope.filtered_directory_array[0]) && $scope.filtered_directory_array[0].user_id === user_id) {
            return true;
        }
        return false;
    };

    $scope.updateDirectoryChat = function(index) {
        UserManager._user_settings_location.update({
            'last-active-chat': index
        });
    };

    $scope.setDirectoryChat = function(index, link) {

        if (index === undefined || index === null || $scope.activeChats.length === 0) {
            $log.debug('error/no chats');
            $scope.safeApply(function() {
                $timeout(function() {
                    document.getElementById($scope.mandatory_index + "_link").click();
                });
            });
            $log.debug('broken 1');
            return false;
        }
        $scope.stored_directory_index = $scope.directory_index = index;
        UserManager._user_settings_location.update({
            'last-active-chat': index
        });
        if ($scope.directory_index === $scope.last_unread_index) {
            $scope.last_unread_index = '';
        }
        if ($scope.directory_chat) {
            $scope.directory_chat.unread = 0;
            $scope.isNewMessage = false;
            $scope.isTextFocus = false;
        }
        $timeout(function() {
            $scope.directory_chat = null;
        });
        $scope.safeApply(function() {
            $timeout(function() {
                $scope.directory_chat = $scope.activeChats[$scope.directory_index];
            }, 250);
            $timeout(function() {
                if ($scope.directory_chat) {
                    $scope.directory_chat.scroll_bottom = false;
                    $scope.directory_chat.isTextFocus = true;
                    $scope.directory_chat.unread = 0;
                    $scope.directory_chat.isNewMessage = false;
                    $scope.chat_module_lock = true;
                    $scope.directory_chat.scroll_bottom = true;
                    if ($scope.layout === 1 && link) {
                        document.getElementById('directory_chat_link').click();
                    }
                }
            }, 300);
        });
        return false;
    };

    $scope.referenceDirectoryItem = function() {
        if (angular.isUndefinedOrNull($scope.directory_index)) {
            $scope.directory_index = $scope.stored_directory_index;
            $scope.setDirectoryChat($scope.directory_index, false);
        }
        if ($scope.directory_index !== null) {
            $timeout(function() {
                $scope.referenced_index = $scope.directory_index;
            });
            $timeout(function() {
                $scope.referenced_index = null;
            });
        }
    };


    $scope.toggleNavMenu = function() {
        $scope.showNavMenu = !$scope.showNavMenu;
    };

    $scope.getDirectoryChat = function(chat_name) {
        $log.debug('getDirectoryChat(' + chat_name + ')');
        var type = chat_name.split('_')[0];
        $log.debug('type: ' + type);
        var id = chat_name.split('_')[1];
        $log.debug('id: ' + id);
        $scope.showNavMenu = false;
        if ($scope.active_sessions[chat_name] === true) {
            $log.debug(chat_name + 'already exists');
            var i = $scope.activeChats.length;
            while (i--) {
                if ($scope.activeChats[i].session_key === chat_name && $scope.isPageLoaded) {
                    $scope.directory_index = i;
                    $scope.setDirectoryChat($scope.directory_index, true);
                    break;
                }
            }
            return;
        } else {
            if (type === 'mc') {
                ChatManager.__pushChatSession(DirectoryChatManager.__buildNewDirectoryChat($scope, (chat_name), UserManager._users_profiles_obj['user_' + id].name + ' - MC Team Chat', id, false, false, 3), false, $scope); //scope, chat_reference, chat_description, admin, watch_users
                /*
                                else if (UserManager._user_profile.position === 33)
                                {
                                    ChatManager.__pushChatSession(DirectoryChatManager.__buildNewDirectoryChat($scope, ('mc_' + UserManager._user_profile.user_id + '_group_chat'), 'MC - Group Chat', UserManager._user_profile.user_id, false, true, 3), false, $scope ); //chatSession, to_user,  scope
                                }
                */
            } else if (chat_name === 'admin_group_chat') {
                ChatManager.__pushChatSession(DirectoryChatManager.__buildNewDirectoryChat($scope, ('admin_group_chat'), 'Admin - Group Chat', UserManager._user_profile.user_id, false, true, 3), false, $scope);
            } else {
                return false;
            }

            if ($scope.directory_index === $scope.last_unread_index) {
                $scope.last_unread_index = '';
            }
            if ($scope.isPageComplete === true) {
                $timeout(function() {
                    $scope.setDirectoryChat($scope.activeChats.length - 1, true);
                }, 1000);
            }
        }
    };

    $scope.isScrollAtBottom = function(index) {
        if ($scope.isPageComplete === false) {
            return false;
        }
        var el = document.getElementById('message_display_' + index);
        if (el === null) {
            $log.debug('element was not found');
            return false;
        }
        if (angular.isDefined(el) && angular.isDefined(el.scrollTop)) {
            if (el.scrollTop + el.clientHeight + 10 >= el.scrollHeight) {
                return el;
            } else {
                return false;
            }
        }
        return false;

    };

    $scope.alertNewChat = function(index, internal, message) {
        if ($scope.is_external_window.$value && $scope.isExternalInstance === false) {
            $log.debug('Blocked SOund');
            return false;
        }
        /*      console.log(index); */
        var el = $scope.isScrollAtBottom(index);
        if (internal) {
            if ($scope.activeChats[index] && $scope.activeChats[index].isopen === true || $scope.directory_chat && $scope.directory_chat.index_position === index) {
                if ((!ChatManager._is_playing_sound) && angular.equals($scope.activeChats[index].isSound, true)) {
                    ChatManager._is_playing_sound = true;
                    $timeout(function() {
                        $scope.resetTyping($scope.activeChats[index]);
                        NotificationService.__playSound(NotificationService._chat_close); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                        ChatManager._is_playing_sound = false;
                    }, 50);
                }

            }

        } else {
            if ((!ChatManager._is_playing_sound) && angular.equals($scope.activeChats[index].isSound, true)) {
                ChatManager._is_playing_sound = true;
                $timeout(function() {
                    $scope.resetTyping($scope.activeChats[index]);
                    NotificationService.__playSound(NotificationService._chat); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                    ChatManager._is_playing_sound = false;
                }, 50);
            }
            if ($scope.external_monitor && $scope.isExternalWindow && message) {
                $scope.notifyUser(message, index, null);
                $scope.unread++;
                document.title = $scope.default_window_title + ' - ' + $scope.unread + ' New';

            } else if ($scope.page_status === 'visible' && $scope.layout != 2 && $scope.isChatModuleOpen === false) {
                $scope.alertToOpen = true;
                $scope.unread++;
                if (message) {
                    $scope.notifyUser(message, index, null);
                }

            } else if ($scope.page_status === 'hidden') {
                if (message) {
                    $scope.notifyUser(message, index, null);
                    $scope.unread++;
                    document.title = $scope.default_window_title + ' - ' + $scope.unread + ' New';
                }
            }
            if ($scope.layout != 2 && $scope.activeChats[index].isTextFocus === false) {
                $log.debug('notify 1');
                $scope.activeChats[index].unread = $scope.activeChats[index].unread + 1; // this condition will change the color of the chat header if the user has it closed.
                $scope.activeChats[index].isNewMessage = true;
                if ($scope.directory_index != index) {
                    /*                  console.log(' 1-A added to  priority queue') */
                    if ($scope.priority_queue.indexOf(index) === -1) {
                        $scope.priority_queue.unshift(index);
                    }
                    $scope.last_unread_index = index;
                }

            } else {
                if (index > ($scope.max_count - 1) || $scope.activeChats[index].isopen === false || $scope.activeChats[index].isopen === 'false') {
                    /*                  console.log('notify 2');     */
                    $scope.activeChats[index].unread = $scope.activeChats[index].unread + 1; // this condition will change the color of the chat header if the user has it closed.
                    $scope.activeChats[index].header_color = ChatManager._closed_header_alert_color;
                    $scope.activeChats[index].isNewMessage = true;
                    /*                  console.log(' 1-A added to  priority queue') */
                    if ($scope.priority_queue.indexOf(index) === -1) {
                        $scope.priority_queue.unshift(index);
                    }
                    $scope.last_unread_index = index;
                } else if ($scope.activeChats[index].isTextFocus === false) {
                    /*                  console.log('notify 3'); */
                    $scope.activeChats[index].unread = $scope.activeChats[index].unread + 1;
                    $scope.activeChats[index].isNewMessage = true;
                    $scope.activeChats[index].header_color = ChatManager._open_header_alert_color;
                    /*                  console.log(' 1-A added to  priority queue') */
                    if ($scope.priority_queue.indexOf(index) === -1) {
                        $scope.priority_queue.unshift(index);
                    }
                    $scope.last_unread_index = index;
                } else {
                    $scope.activeChats[index].unread = 0;
                    $scope.activeChats[index].isNewMessage = false;
                    $scope.activeChats[index].header_color = ChatManager._header_color;
                }

            }
        }
        if (el) {
            $timeout(function() {
                el.scrollTop = el.scrollHeight;
            }, 500);
        }
    };

    $scope.getNotifyPermission = function() {
        Notification.requestPermission();
    };

    $scope.user_notifications = Array();

    $scope.notifyUser = function(message, index, heading) {
        /*        console.log('notifying user'); */
        var title;
        if (heading) {
            if (BrowserService.platform.browser === "Firefox") {
                title = message.authorName + '   ' + heading;
            } else {
                title = heading + '\n' + message.authorName;
            }

        } else {
            title = message.authorName;
        }
        var notification = new Notification(title, {
            tag: message.session_key,
            icon: '/components/com_callcenter/images/avatars/' + UserManager._users_profiles_obj['user_' + message.author].avatar + '-90.jpg',
            body: message.text
        });
        if (typeof index === "number" && index > -1) {
            notification.onclick = function() {
                if ($scope.page_status === 'visible') {
                    self.focus();
                    $scope.setDirectoryChat(index, true);
                    $scope.updateTmp(5);
                    if (!$scope.isChatModuleOpen) {
                        $scope.openChatModule();
                    }
                }
            };
        } else if (typeof index === "string") {
            notification.onclick = function() {
                if ($scope.page_status === 'visible') {
                    self.focus();
                    $scope.setMandatoryFocus($scope[index]);
                    $scope.updateTmp($scope.tablist.indexOf(index));
                    if (!$scope.isChatModuleOpen) {
                        $scope.openChatModule();
                    }
                }
            };
        }
        $scope.user_notifications.push(notification);
    };

    $scope.sendNotification = function(title, tag, icon, body) {
        var notification = new Notification(title, {
            tag: tag,
            icon: icon,
            body: body
        });
    };

    $scope.$on('clear_notifications', function(event) {
        angular.forEach($scope.user_notifications, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
            value.close();
        });
    });


    $scope.setReference = function(message, start) {
        if (parseInt(message.reference) >= parseInt(start)) {
            message.isReference = true;
            if (message.referenceAuthor === UserManager._user_profile.user_id) {
                message.isReferencedSelf = true;
            } else {
                message.isReferencedSelf = false;
            }
        } else {
            message.isReference = false;
            message.isReferencedSelf = false;
        }
        return;
    };

    /*
        $scope.resizeUp = function()
        {
            $scope.resize_up = true;
            $scope.resizeUpInterval = setInterval(function()
            {
                console.log('resizing up');
                if ( $scope.resize_up === true && $scope.vertical_adjust < 100)
                {
                    $scope.vertical_adjust = $scope.vertical_adjust + 4;

                }
                if ($scope.vertical_adjust >= 100)
                {
                    $scope.resizeStop();
                }
                $scope.$apply();
            }, 100);
        }

        $scope.resizeDown = function()
        {
            $scope.resize_down = true;
            $scope.resizeDownInterval = setInterval(function()
            {
                $scope.safeApply(function(){
                    console.log('resizing down');
                    if ( $scope.resize_down === true && $scope.vertical_adjust > -100)
                    {
                            $scope.vertical_adjust = $scope.vertical_adjust - 4;
                    }
                    if ($scope.vertical_adjust <= -100)
                    {
                        $scope.resizeStop();
                    }
                });


            }, 100);
        }
    */

    $scope.resizeStop = function() {
        $scope.safeApply(function() {
            clearInterval($scope.resizeUpInterval);
            clearInterval($scope.resizeDownInterval);
            $scope.resize_down = false;
            $scope.resize_up = false;
            $scope.$apply();
        });

    };

    $scope.muteGlobalSound = function() {
        NotificationService.__mute();
    };

    $scope.allowGlobalSound = function() {
        NotificationService.__unmute();
    };

    $scope.openExternalWindow = function() {
        $scope.switchLayout(1);
        if (UserManager._user_settings_location) {
            UserManager._user_settings_location.update({
                'is-external-window': false
            });
        }
        $timeout(function() {
            $scope.externalWindowObject = window.open(CoreConfig.ext_link, "PlusOnePortalChat", "left=1600,resizable=false, scrollbars=no, status=no, location=no,top=0");
            if ($scope.externalWindowObject) {
                $scope.externalWindowObject.resizeTo(350, window.innerHeight + 50);
                $timeout(function() {
                    $scope.$evalAsync(function() {
                        $scope.isChildWindow = true;
                        $scope.isExternalWindow = true;
                        $scope.externalWindowObject.focus();
                        $scope.isPageLoaded = false;
                        $scope.isExternalWindow = true;
                        $scope.mute();


                        /*                  UtilityManager.setFirebaseOffline(); */

                        $scope.externalWindowlistener = $scope.$watch('externalWindowObject.closed', function(newValue) {
                            if (newValue) {
                                UserManager._user_settings_location.update({
                                    'is-external-window': false
                                });
                                localStorageService.remove('isExternalWindow');
                                $scope.isExternalWindow = false;
                            }
                        });
                        $scope.externalWindowObject.addEventListener('DOMContentLoaded', resizeChild, true);

                        function resizeChild() {
                            /*                              console.log('calling resize child'); */
                            $timeout(function() {
                                $scope.externalWindowObject.document.documentElement.style.overflow = 'hidden'; // firefox, chrome
                                $scope.externalWindowObject.document.body.scroll = "no"; // ie only

                                localStorageService.add('isExternalWindow', true);
                            }, 2000);
                        }
                    });
                }, 1000);
            }
            return false;
        }, 750);
    };

    $scope.toggleExternalWindow = function() {
        console.log('external focus');
        if ($scope.externalWindowObject) {
            $scope.externalWindowObject.focus();
        } else {
            $scope.mute();
            $scope.openExternalWindow();
            $timeout(function() {
                $scope.unmute();
            }, 4000);
        }
    };

    $scope.viewProfile = function(chat) {
        if (chat) {
            if (!chat.additional_profile) {
                $scope.getUserAdditionalProfile(chat);
                $timeout(function() {
                    chat.showUserOptions = false;
                    chat.showProfile = true;
                }, 1000);
            } else {
                chat.showUserOptions = false;
                chat.showProfile = true;
            }
        }
    };

    $scope.closeProfile = function(chat) {
        if (chat) {
            chat.showProfile = false;
            /*          chat.additional_profile = null; */
        }
    };


    $scope.getUserAdditionalProfile = function(chat) {
        /*      console.log('calling controller to get additonal profile'); */
        UserManager.__getUserAdditionalProfile(chat.to_user_id, chat);
    };
}]);
