angular.module('portalchat.core').
service('GroupChatManager', ['$log', '$timeout', 'CoreConfig', 'UserManager', 'ChatStorage',
    function($log, $timeout, CoreConfig, UserManager, ChatStorage) {
        var that = this;

        this.removeActiveContactFromChat = function(chat, user) {
            chat.group_user_location.child(user).set(null);
        };

        this.removeUserFromGroupChat = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                ChatStorage[type].chat.list[session_key].fb.contacts.list.child(UserManager.user.id).remove();
            }
        };
        this.getGroupChatRemainingContacts = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                var remaining_contacts;
                if (ChatStorage[type].chat.list[session_key].fb.contacts.list) {
                    ChatStorage[type].chat.list[session_key].fb.contacts.list.transaction(function(current_value) {
                        return current_value;
                    }, function(error, committed, snapshot) {
                        remaining_contacts = snapshot.val();
                    });
                }
                return remaining_contacts;
            }
            return null;
        };

        this.addGroupChatMessage = function(chat) {
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



        return this;
    }
]);
