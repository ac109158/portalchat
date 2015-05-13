angular.module('portalchat.core').
service('ChatManager', ['$log', '$timeout', 'CoreConfig', 'UserManager', 'ContactsManager', 'SessionsManager', 'PermissionsManager', 'ChatBuilder', 'ChatStorage',
    function($log, $timeout, CoreConfig, UserManager, ContactsManager, SessionsManager, PermissionsManager, ChatBuilder, ChatStorage) {
        var that = this;

        this.setting = {};
        this.setting.command_key = CoreConfig.chat.setting.command_key;

        this.showContactThatUserIsTyping = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                if (!ChatStorage[type].chat.list[session_key].message.text) {
                    return false;
                }
                if (angular.isDefined(ChatStorage[type].chat.list[session_key].interval.is_user_typing)) {
                    $timeout.cancel(ChatStorage[type].chat.list[session_key].interval.is_user_typing);
                }
                if (ChatStorage[type].chat.list[session_key].fb.contact.location.typing_presence)
                    ChatStorage[type].chat.list[session_key].fb.contact.location.typing_presence.update({
                        'is_typing': true
                    });
                ChatStorage[type].chat.list[session_key].interval.is_user_typing = $timeout(function() {
                    ChatStorage[type].chat.list[session_key].fb.contact.location.typing_presence.update({
                        'is_typing': false
                    });
                    $timeout.cancel(ChatStorage[type].chat.list[session_key].interval.is_user_typing);
                }, 2000);
            }
        };

        this.showGroupthatUserIsTyping = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                if (!ChatStorage[type].chat.list[session_key].message.text) {
                    return false;
                }
                if (angular.isDefined(ChatStorage[type].chat.list[session_key].interval.is_user_typing)) {
                    $timeout.cancel(ChatStorage[type].chat.list[session_key].interval.is_user_typing);
                }
                if (ChatStorage[type].chat.list[session_key].fb.location.session) {
                    ChatStorage[type].chat.list[session_key].fb.location.session.child('is_typing/' + UserManager.user.id).set(UserManager.user.avatar);

                }
                ChatStorage[type].chat.list[session_key].interval.is_user_typing = $timeout(function() {
                    ChatStorage[type].chat.list[session_key].fb.location.session.child('is_typing/' + UserManager._user_profile.user_id).set(null);
                    $timeout.cancel(ChatStorage[type].chat.list[session_key].interval.is_user_typing);
                }, 2000);
            }
        };

        this.toggleChatInviteMenu = function(type, session_key, value) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                that.resetCommonDefaultSettings(type, session_key);
                if (angular.isDefined(value)) {
                    ChatStorage[type].chat.list[session_key].menu.invite = value;
                } else {
                    ChatStorage[type].chat.list[session_key].menu.invite = !ChatStorage[type].chat.list[session_key].menu.invite;
                }
                if (angular.isDefined(ChatStorage[type].chat.list[session_key].interval.invite_menu_close)) {
                    $timeout.cancel(ChatStorage[type].chat.list[session_key].interval.invite_menu_close);
                }
                if (ChatStorage[type].chat.list[session_key].menu.invite === true) {
                    that.toggleChatMenu(type, session_key, 'options', false);
                    ChatStorage[type].chat.list[session_key].interval.invite_menu_close = $timeout(function() {
                        that.resetCommonDefaultSettings(type, session_key);
                        that.toggleChatAttr(type, session_key, 'is_text_focus', true, false);
                        $timeout.cancel(ChatStorage[type].chat.list[session_key].interval.invite_menu_close);
                    }, 15000);
                }
            }
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

        this.toggleChatMenu = function(type, session_key, menu, value) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && ChatStorage[type].chat.list[session_key].menu && angular.isDefined(ChatStorage[type].chat.list[session_key].menu[menu])) {
                if (!ChatStorage[type].chat.list[session_key].attr.is_open) {
                    ChatStorage[type].chat.list[session_key].attr.is_open = true;
                }
                if (angular.isDefined(value)) {
                    ChatStorage[type].chat.list[session_key].menu[menu] = value;
                } else {
                    ChatStorage[type].chat.list[session_key].menu[menu] = !ChatStorage[type].chat.list[session_key].menu[menu];
                }
            }
        };

        this.toggleChatOpen = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                ChatStorage[type].chat.list[session_key].attr.is_open = !ChatStorage[type].chat.list[session_key].attr.is_open;
                if (ChatStorage[type].chat.list[session_key].attr.is_open === true) {
                    ChatStorage[type].chat.list[session_key].ux.header_color = CoreConfig.chat.ui.header_color;
                    ChatStorage[type].chat.list[session_key].ux.unread = 0;
                    ChatStorage[type].chat.list[session_key].attr.is_text_focus = true;
                    that.setChatTimeReference(type, session_key);
                } else {
                    that.resetCommonDefaultSettings(type, session_key);
                }
                SessionManager.updateSessionDetail(session_key, 'is_open', ChatStorage[type].chat.list[session_key].attr.is_open);
                ChatManager.__updateIsOpen(chat);
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
                    ChatStorage[type].chat.list[session_key].topic.description = ChatStorage[type].chat.list[session_key].topic.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
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

        this.updateChatTopic = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                var new_chat_topic = String($('#topic_' + session_key).text()).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string
                if (new_chat_topic === 'null' || new_chat_topic === '' || new_chat_topic.length < 5) {
                    return false;
                }
                ChatStorage[type].chat.list[session_key].topic.set = new_chat_topic;
                if (ChatStorage[type].chat.list[session_key].fb.location.session) {
                    ChatStorage[type].chat.list[session_key].fb.location.session.update({
                        topic: new_chat_topic
                    });
                }
                that.setChatTopicHeight(type, session_key);
                that.resetCommonDefaultSettings(type, session_key);
                that.toggleChatAttr(type, session_key, 'is_text_focus', true, false);
                return true;
            }
        };

        this.clearChatMessageHistory = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                ChatStorage[type].chat.list[session_key].messages.list = [];
                ChatStorage[type].chat.list[session_key].messages.map = {};
                that.resetCommonDefaultSettings(type, session_key);
            }
        };

        this.initChatMessageDetails = function(type, session_key, message) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                if (message.index_position - 1 > -1) {
                    that.isMessageTimeLapse(type, session_key, message);
                    that.isMessagePastHour(type, session_key, message);
                    that.isLastMessagePastMinute(type, session_key, message);
                    that.isAuthorSameAsLast(type, session_key, message);
                    that.isMessageFromUser(message);
                } else {
                    that.isMessagePastHour(type, session_key, message);
                    that.isLastMessagePastMinute(type, session_key, message);
                    that.isAuthorSameAsLast(type, session_key, message);
                    that.isMessageFromUser(message);
                }
            }
        };

        this.getAuthorAvatar = function(message, user_details) {
            if (message.author === CoreConfig.chat.internal_reference) {
                message.avatar = false;
                return;
            } else if (angular.isDefined(ContactsManager.contacts.profiles['user_' + message.author])) {
                message.avatar = '/components/com_callcenter/images/avatars/' + ContactsManager.contacts.profiles['user_' + message.author].avatar + '-90.jpg';
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


        this.getAuthorFirstName = function(message) {
            if (message.authorName) {
                var name_split = message.authorName.match(/\S+/g); // splits the to_users first and last name
                message.author_f_name = name_split[0];
            }

        };

        this.isMessagePastHour = function(type, session_key, message) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                if (((3600000 + message.time) - ChatStorage[type].chat.list[session_key].ux.time_reference) <= 0) {
                    message.past_hour = true;
                } else {
                    message.past_hour = false;
                }
            }
        };

        this.isMessageTimeLapse = function(type, session_key, message) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                if (message.index_position - 1 > -1) {
                    if (((120000 + ChatStorage[type].chat.list[session_key].messages.list[message.index_position - 1].time) - message.time) <= 0) {
                        message.time_lapse = true;
                        ChatStorage[type].chat.list[session_key].messages.list[message.index_position - 1].was_time_lapse = true;
                    } else {
                        ChatStorage[type].chat.list[session_key].messages.list[message.index_position - 1].time_lapse = false;
                        ChatStorage[type].chat.list[session_key].messages.list[message.index_position - 1].was_time_lapse = false;
                    }
                }
            }
        };

        this.isLastMessagePastMinute = function(type, session_key, message) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                if (((60000 + ChatStorage[type].chat.list[session_key].messages.list[message.index_position - 1]) - message.time) <= 0) {
                    message.minute_from_last = true;
                    return;
                }
            }
            message.minute_from_last = false;
            return;
        };

        this.isAuthorSameAsLast = function(type, session_key, message) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                if (message.index_position - 1 > -1) {
                    if (ChatStorage[type].chat.list[session_key].messages.list[message.index_position - 1].author === message.author) {
                        message.from_prev_author = true;
                        return;
                    }
                }
            }
            message.from_prev_author = false;
            return;
        };

        this.isMessageFromUser = function(message) {
            if (message.author === UserManager.user.id) {
                message.author_is_self = true;
                return;
            }
            message.author_is_self = false;
            return;
        };

        this.setChatTimeReference = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                ChatStorage[type].chat.list[session_key].ux.time_reference = new Date().getTime();
            }
        };

        this.setNextContactChatIntoFocus = function(session_key, index_position) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                if (ChatStorage.contact.chat.list[session_key]) {
                    var next_session_index;
                    var next_session_key;
                    ChatStorage.contact.chat.list[session_key].ux.unread = 0;
                    that.toggleChatAttr('contact', session_key, 'is_text_focus', false, false);
                    that.toggleChatAttr('contact', session_key, 'is_new_message', false, false);
                    if (SettingsManager.module.layout != 2) {
                        if (that.contact.chat.priority_queue.length > 0) {
                            next_session_key = that.contact.chat.priority_queue.pop();
                            $log.debug('next_session_key from priority is ' + next_session_key);
                        } else {
                            var contact_chat_count = Object.size(ChatStorage.contact.chat.list);
                            var current_chat_index = ChatStorage.contact.chat.map[ChatStorage.contact.chat.list[session_key].index];
                            next_session_index = current_chat_index + 1;
                            if (next_session_index > contact_chat_count - 1) {
                                next_session_index = 0;
                            }
                            next_session_index = ChatStorage.contact.chat.map[next_session_index];
                        }
                        $log.debug('next_session_key  is ' + next_session_key);
                        $timeout(function() {
                            $scope.directory_index = next_session_key;
                            $scope.setDirectoryChat(next_session_key, true);
                            $scope.referenceDirectoryItem();
                        }, 250);
                        return;
                    } else if ($scope.layout === 2) {
                        next_session_key = index - 1;
                        $scope.activeChats[index].isTextFocus = false;
                        if (next_session_key < 0) {
                            next_session_key = $scope.activeChats.length - 1;
                        }
                        if (next_session_key >= $scope.max_count) {
                            next_session_key = $scope.max_count - 1;
                        }
                        $scope.activeChats[next_session_key].isopen = true;
                        $scope.activeChats[next_session_key].isTextFocus = true;
                        return;
                    }
                }
            }
        };

        this.sendChatMessage = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                var chat_delay;
                /*      console.log(ChatStorage[type].chat.list[session_key].message.text); */
                if (angular.isUndefined(ChatStorage[type].chat.list[session_key].message.text) || ChatStorage[type].chat.list[session_key].message.text === null) {
                    that.setNextContactChatIntoFocus(session_key);
                } else if (ChatStorage[type].chat.list[session_key].message.text.substring(0, 1) === that.setting.command_key) {
                    that.checkForCommand(type, session_key, ChatStorage[type].chat.list[session_key].message);
                    return;
                } else if (angular.isDefined(ChatStorage[type].chat.list[session_key].message.text) && ChatStorage[type].chat.list[session_key].message.text !== '' && ChatStorage[type].chat.list[session_key].message.text.length < 1000) {
                    if (angular.isUndefined(chat.to_user_session) || chat.to_user_session === null) {
                        chat_delay = 500;
                        $scope.locationValue = '';
                        ChatManager.__getLocationValue(chat.to_user_session_location, $scope);
                        chat.to_user_session = $scope.locationValue;
                    } else {
                        chat_delay = 0;
                    }

                    /*          var chat_text = String(ChatStorage[type].chat.list[session_key].message.text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string */
                    chat.scroll_bottom = false;
                    var chat_text = ChatStorage[type].chat.list[session_key].message.text;
                    ChatStorage[type].chat.list[session_key].message.text = null;
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
            }
        };

        this.fetchPreviousChatMessages = function(type, session_key) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                var temp_chats = [];
                var end_point = ChatStorage[type].chat.list[session_key].priority.first - 1;
                var start_point = end_point - CoreConfig.chat.setting.message_fetch_size;
                $log.debug('start_point: ' + start_point + ' end_point: ' + end_point);
                ChatStorage[type].chat.list[session_key].fb.user.location.messages.endAt(endAt).limit(CoreConfig.chat.setting.message_fetch_size).once('value', function(snapshot) {
                    var prev = snapshot.val();
                    if (prev) {
                        ChatStorage[type].chat.list[session_key].attr.is_reloading = true;
                        var prev_array = [];
                        for (var i in prev) {
                            prev_array.push(prev[i]);
                        }
                        $log.debug(prev_array);
                        i = prev_array.length;
                        while (i--) {
                            temp_chats.push(prev_array[i]);
                        }
                        $timeout(function() {
                            angular.forEach(temp_chats, function(value) {
                                // console.log(value);
                                ChatStorage[type].chat.list[session_key].messages.unshift(value);
                                that.getAuthorAvatar(ChatStorage[type].chat.list[session_key].messages[1], false);
                                that.getAuthorFirstName(ChatStorage[type].chat.list[session_key].messages[1]);
                                that.isMessageFromUser(ChatStorage[type].chat.list[session_key].messages[1]);
                                that.isAuthorSameAsLast(type, session_key, ChatStorage[type].chat.list[session_key].messages[1]);
                                that.isLastMessagePastMinute(ChatStorage[type].chat.list[session_key].messages[1], undefined);
                                that.isMessagePastHour(type, session_key, ChatStorage[type].chat.list[session_key].messages[1]);
                            });
                            that.getAuthorAvatar(ChatStorage[type].chat.list[session_key].messages[0], false);
                            that.getAuthorFirstName(ChatStorage[type].chat.list[session_key].messages[0]);
                            that.isMessageFromUser(ChatStorage[type].chat.list[session_key].messages[0]);
                            that.isAuthorSameAsLast(type, session_key, ChatStorage[type].chat.list[session_key].messages[0]);
                            that.isLastMessagePastMinute(ChatStorage[type].chat.list[session_key].messages[0], undefined);
                            that.isMessagePastHour(type, session_key, ChatStorage[type].chat.list[session_key].messages[0]);
                            ChatStorage[type].chat.list[session_key].priority.first = ChatStorage[type].chat.list[session_key].messages[0].priority;
                            if (ChatStorage[type].chat.list[session_key].priority.first === 1) {
                                ChatStorage[type].chat.list[session_key].attr.is_previous_messages = false;
                            }
                            ChatStorage[type].chat.list[session_key].attr.is_reloading = false;
                        }, 900);
                        $timeout(function() {
                            ChatStorage[type].chat.list[session_key].scroll.to_top = false;
                            ChatStorage[type].chat.list[session_key].scroll.to_bottom = false;
                            // console.log('done fetching');
                            $("#" + 'message_display_' + ChatStorage[type].chat.list[session_key].attr.index).animate({
                                scrollTop: 0
                            }, 2000);
                        }, 500);
                    } else {
                        ChatStorage[type].chat.list[session_key].scroll.to_top = false;
                        ChatStorage[type].chat.list[session_key].scroll.to_bottom = false;
                        ChatStorage[type].chat.list[session_key].scroll.to_top = true;
                        ChatStorage[type].chat.list[session_key].attr.is_previous_messages = false;
                        ChatStorage[type].chat.list[session_key].attr.is_reloading = false;
                        ChatStorage[type].chat.list[session_key].priority.first = ChatStorage[type].chat.list[session_key].messages[0].priority; /*                 console.log('done fetching'); */
                        return false;
                    }
                });
            }

        };

        this.checkForCommand = function(type, session_key, message) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
                if (message.text === that.setting.command_key + 'c') {
                    $scope.toggleChatOpen(type, session_key);
                } else if (message.text === that.setting.command_key + 'q') {
                    $scope.removeChatSession(type, session_key);
                } else if (message.text === that.setting.command_key + 'clear' || message.text === that.setting.command_key + 'clr') {
                    chat.chats = Array();
                    chat.chat_log = Array();
                    chat.isMorePrev = false;

                } else if (message.text === that.setting.command_key + 's') {
                    $scope.toggleChatSound(chat);
                } else if (message.text === that.setting.command_key + 'at') {
                    $scope.tagChatOn(chat);
                } else if (message.text === that.setting.command_key + 'rt') {
                    $scope.removeTag(chat);
                } else if (message.text === that.setting.command_key + 'last') {
                    $scope.moveChatToLast(chat.index_position);
                    if ($scope.layout != 2) {
                        $scope.setDirectoryChat($scope.activeChats.length - 1, true);
                    }
                } else if (message.text === that.setting.command_key + 'first') {
                    $scope.moveChatToFirst(chat.index_position);
                    if ($scope.layout != 2) {
                        $scope.setDirectoryChat(0, true);
                    }
                } else if (message.text === that.setting.command_key + 'chat') {
                    console.log(chat);
                } else if (message.text === that.setting.command_key + 'chats') {
                    console.log(chat.chats);
                    console.log(chat.group_chats);
                } else if (message.text === that.setting.command_key + 'self') {
                    console.log(chat);
                } else if (message.text === that.setting.command_key + 'user') {
                    console.log(UserManager._user_profile);
                } else if (message.text === that.setting.command_key + 'scope') {
                    console.log($scope);
                } else if (message.text === that.setting.command_key + 'browser') {
                    message.text = BrowserService.platform.browser + " | " + BrowserService.platform.browserVersion + " | " + BrowserService.platform.os + ' - ' + BrowserService.platform.osVersion + ' |';
                    $scope.addChatMessage(chat);
                } else if (message.text === that.setting.command_key + 'os') {
                    message.text = BrowserService.platform.os + ' | ' + BrowserService.platform.osVersion;
                    $scope.addChatMessage(chat);
                } else if (message.text === that.setting.command_key + 'platform') {
                    console.log(BrowserService.platform);
                } else if (message.text === that.setting.command_key + 'online') {
                    console.log(UserManager._online_users_list);
                } else if (message.text === that.setting.command_key + 'offline') {
                    console.log(UserManager._offline_users_list);
                } else if (message.text === that.setting.command_key + 'profiles') {
                    console.log(UserManager._users_profiles_obj);
                } else if (message.text === that.setting.command_key + 'ping') {
                    $scope.runPingTest(chat);
                } else if (message.text === that.setting.command_key + 'require-refresh') {
                    console.log('require-refresh requested');
                    if (PermissionsManager.hasAdminRights()) {
                        console.log('request allowed');
                        UserManager.__requireRefresh();
                    } else {
                        console.log('refresh denied');
                        console.log(UserManager._user_profile.position + ' not in admin');
                    }
                }
                message.text = null;
                return;
            };
        };

        return this;
    }
]);
