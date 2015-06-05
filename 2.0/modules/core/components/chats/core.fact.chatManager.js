angular.module('portalchat.core').
service('ChatManager', ['$log', '$http', '$timeout', '$sce', 'CoreConfig', 'UtilityManager', 'UserManager', 'ContactsManager', 'SessionsManager', 'PermissionsManager', 'ChatBuilder', 'ChatStorage', 'AudioService', function($log, $http, $timeout, $sce, CoreConfig, UtilityManager, UserManager, ContactsManager, SessionsManager, PermissionsManager, ChatBuilder, ChatStorage, AudioService) {
    var that = this;

    this.setting = {};
    this.setting.command_key = CoreConfig.module.setting.command_key;

    this.showChatThatUserIsTyping = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            // if (!ChatStorage[type].chat.list[session_key].message.text || !ChatStorage[type].chat.list[session_key].signals.user.active) {
            if (!ChatStorage[type].chat.list[session_key].message.text) {
                return false;
            }
            if (angular.isDefined(ChatStorage[type].chat.list[session_key].interval.is_user_typing)) {
                $timeout.cancel(ChatStorage[type].chat.list[session_key].interval.is_user_typing);
            }
            var signal = {};
            ChatStorage[type].chat.list[session_key].signals.user.is_typing = UserManager.user.profile.id;
            SessionsManager.updateChatIsTypingSignal(type, session_key, UserManager.user.profile.id);
            ChatStorage[type].chat.list[session_key].interval.is_user_typing = $timeout(function() {
                ChatStorage[type].chat.list[session_key].signals.user.is_typing = null;
                // SessionsManager.updateContactChatSignals(type, session_key);
                SessionsManager.updateChatIsTypingSignal(type, session_key, null);
                $timeout.cancel(ChatStorage[type].chat.list[session_key].interval.is_user_typing);
            }, 1000);
        }
    };

    this.resetCommonFocusSettings = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].attr.is_active = false;
            ChatStorage[type].chat.list[session_key].attr.is_text_focus = false;
            ChatStorage[type].chat.list[session_key].attr.is_tag_focus = false;
            ChatStorage[type].chat.list[session_key].attr.is_topic_focus = false;
            ChatStorage[type].chat.list[session_key].scroll.to_bottom = false;
            ChatStorage[type].chat.list[session_key].scroll.to_top = false;
        }
    };
    this.resetCommonMenuSettings = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].menu.tag = false;
            ChatStorage[type].chat.list[session_key].menu.topic = false;
            ChatStorage[type].chat.list[session_key].menu.emoticons = false;
            ChatStorage[type].chat.list[session_key].menu.options = false;
            ChatStorage[type].chat.list[session_key].menu.profile = false;
            ChatStorage[type].chat.list[session_key].menu.user_list = false;
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

            ChatStorage[type].chat.list[session_key].ux.header_color = CoreConfig.module.setting.header_color;
            ChatStorage[type].chat.list[session_key].ux.nudge = false;
            ChatStorage[type].chat.list[session_key].ux.unread = 0;


            ChatStorage[type].chat.list[session_key].invite.show = false;
            ChatStorage[type].chat.list[session_key].invite.contact = '';
            ChatStorage[type].chat.list[session_key].invite.set_contact = false;

            ChatStorage[type].chat.list[session_key].reference.key = null;
            ChatStorage[type].chat.list[session_key].reference.author = null;
            ChatStorage[type].chat.list[session_key].reference.name = null;
            ChatStorage[type].chat.list[session_key].reference.text = null;
            ChatStorage[type].chat.list[session_key].reference.priority = null;


            // if (angular.isDefined(ChatStorage[type].chat.list[session_key].fb.target.topic)) {
            //     if (ChatStorage[type].chat.list[session_key].fb.target.topic) {
            //         ChatStorage[type].chat.list[session_key].attr.topic_height = 0;
            //     } else {
            //         ChatStorage[type].chat.list[session_key].attr.topic_height = $document.getElementById('topic_' + session_key + '_wrapper').clientHeight || 0;
            //     }
            // }
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
            angular.forEach(ChatStorage[type].chat.list[session_key].menu, function(value, key) {
                if (key != menu) {
                    ChatStorage[type].chat.list[session_key].menu[key] = false;
                }
            });
            if (!ChatStorage[type].chat.list[session_key].session.is_open) {
                ChatStorage[type].chat.list[session_key].session.is_open = true;
            }
            if (angular.isDefined(value)) {
                ChatStorage[type].chat.list[session_key].menu[menu] = value;
            } else {
                ChatStorage[type].chat.list[session_key].menu[menu] = !ChatStorage[type].chat.list[session_key].menu[menu];
            }
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

    this.toggleVideoPanel = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].video.heading = '';
            ChatStorage[type].chat.list[session_key].video.url = '';
            ChatStorage[type].chat.list[session_key].video.code = '';
            ChatStorage[type].chat.list[session_key].video.message = '';
            ChatStorage[type].chat.list[session_key].menu.video = !ChatStorage[type].chat.list[session_key].menu.video;
            that.resetCommonDefaultSettings(type, session_key);
        }
    };

    this.toggleAudioPanel = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].audio.heading = '';
            ChatStorage[type].chat.list[session_key].audio.message = '';
            ChatStorage[type].chat.list[session_key].audio.url = '';
            ChatStorage[type].chat.list[session_key].audio.cid = '';
            ChatStorage[type].chat.list[session_key].menu.audio = !ChatStorage[type].chat.list[session_key].menu.audio;
            that.resetCommonDefaultSettings(type, session_key);
        }
    };

    this.toggleChatAudioMessage = function(message) {
        if (message.show_audio) {
            message.show_audio = !message.show_audio;
            return false;
        }
        if (message.cid) {
            AudioService.asyncMessage(message, message.cid);
        }
        $timeout(function() {
            message.show_audio = !message.show_audio;
        }, 500);
    };

    this.toggleImagePanel = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].image.url = '';
            ChatStorage[type].chat.list[session_key].image.heading = '';
            ChatStorage[type].chat.list[session_key].image.message = '';
            ChatStorage[type].chat.list[session_key].menu.image = !ChatStorage[type].chat.list[session_key].menu.image;
            that.resetCommonDefaultSettings(type, session_key);
        }
    };

    this.toggleChatOpen = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].session.is_open = !ChatStorage[type].chat.list[session_key].session.is_open;
            if (ChatStorage[type].chat.list[session_key].session.is_open === true) {
                ChatStorage[type].chat.list[session_key].ux.header_color = CoreConfig.module.setting.header_color;
                ChatStorage[type].chat.list[session_key].ux.unread = 0;
                ChatStorage[type].chat.list[session_key].attr.is_text_focus = true;
                that.setChatTimeReference(type, session_key);
            } else {
                that.resetCommonDefaultSettings(type, session_key);
            }
            SessionManager.updateSessionDetail(session_key, 'is_open', ChatStorage[type].chat.list[session_key].session.is_open);
        }
    };

    this.updateContactChatTag = function(session_key, fb_sync) {
        if (ChatStorage.contact.chat.list[session_key]) {
            if (angular.isDefined(ChatStorage.contact.chat.list[session_key].tag.description) && ChatStorage.contact.chat.list[session_key].tag.description.length > 2 && ChatStorage.contact.chat.list[session_key].tag.description.length <= 20) {
                that.resetCommonDefaultSettings('contact', session_key);
                ChatStorage.contact.chat.list[session_key].tag_description = String(ChatStorage.contact.chat.list[session_key].tag_description).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
                if (ChatStorage.contact.chat.list[session_key].session.is_group_chatStorage.contact.chat.list[session_key]) {
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

    this.removeChatTag = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].session.tag = '';
            ChatStorage[type].chat.list[session_key].tag.description = '';
            SessionsManager.setUserChatSessionStorage(type, session_key);
            that.resetCommonDefaultSettings(type, session_key);
            $timeout(function() {
                that.toggleChatAttr(type, session_key, 'is_text_focus', true, false);
            }, 250);
        }
    };

    this.addChatTag = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isDefined(ChatStorage[type].chat.list[session_key].tag.description) && ChatStorage[type].chat.list[session_key].tag.description.length > 2 && ChatStorage[type].chat.list[session_key].tag.description.length <= 20) {
                ChatStorage[type].chat.list[session_key].tag.description = ChatStorage[type].chat.list[session_key].tag.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
                if (ChatStorage[type].chat.list[session_key].tag.description.length >= 2) {
                    ChatStorage[type].chat.list[session_key].session.tag = ChatStorage[type].chat.list[session_key].tag.description;
                    SessionsManager.setUserChatSessionStorage(type, session_key);
                }
            }
            ChatStorage[type].chat.list[session_key].tag.description = '';
            that.resetCommonDefaultSettings(type, session_key);
            $timeout(function() {
                that.toggleChatAttr(type, session_key, 'is_text_focus', true, false);
            }, 250);

        }
    };


    this.addChatTopic = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isDefined(ChatStorage[type].chat.list[session_key].session.topic) && ChatStorage[type].chat.list[session_key].session.topic.length > 5 && ChatStorage[type].chat.list[session_key].session.topic.length <= 100) {
                ChatStorage[type].chat.list[session_key].session.topic = ChatStorage[type].chat.list[session_key].session.topic.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
                ChatStorage[type].chat.list[session_key].signals.user.topic = ChatStorage[type].chat.list[session_key].session.topic;
                if (ChatStorage[type].chat.list[session_key].signals.user.topic.length) {
                    if (type === 'contact') {
                        SessionsManager.updateContactChatSignals(type, session_key);
                    } else {
                        SessionsManager.updateDirectoryChatSignals(type, session_key);
                    }
                    SessionsManager.setUserChatSessionStorage(type, session_key);
                    ChatStorage[type].chat.list[session_key].topic.set = true;
                    that.resetCommonDefaultSettings(type, session_key);
                    $timeout(function() {
                        that.toggleChatAttr(type, session_key, 'is_text_focus', true, false);
                    }, 250);
                    return true;
                }
            }
        }
        return false;
    };

    this.removeChatTopic = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].session.topic = '';
            ChatStorage[type].chat.list[session_key].signals.user.topic = '';
            if (type === 'contact') {
                SessionsManager.updateContactChatSignals(type, session_key);
            } else {
                SessionsManager.updateDirectoryChatSignals(type, session_key);
            }
            SessionsManager.setUserChatSessionStorage(type, session_key);
            that.resetCommonDefaultSettings(type, session_key);
            $timeout(function() {
                that.toggleChatAttr(type, session_key, 'is_text_focus', true, false);
            }, 250);
        }
    };

    this.updateChatTopic = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            console.log('#' + session_key + ':topic');
            var new_chat_topic = $(document.getElementById(session_key + ':topic')).text().replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string
            console.log('new_chat_topic: ', new_chat_topic);
            if (new_chat_topic === 'null' || new_chat_topic === '' || new_chat_topic.length < 5) {
                ChatStorage[type].chat.list[session_key].session.topic = ChatStorage[type].chat.list[session_key].signals.user.topic;
                $(document.getElementById(session_key + ':topic')).text(ChatStorage[type].chat.list[session_key].signals.user.topic);
                return false;
            }
            ChatStorage[type].chat.list[session_key].session.topic = new_chat_topic;
            ChatStorage[type].chat.list[session_key].signals.user.topic = new_chat_topic;
            if (type === 'contact') {
                SessionsManager.updateContactChatSignals(type, session_key);
            } else {
                SessionsManager.updateDirectoryChatSignals(type, session_key);
            }
            SessionsManager.setUserChatSessionStorage(type, session_key);
            that.resetCommonDefaultSettings(type, session_key);
            $timeout(function() {
                that.toggleChatAttr(type, session_key, 'is_text_focus', true, false);
            }, 250);
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
            }
            that.isMessagePastHour(type, session_key, message);
            that.isLastMessagePastMinute(type, session_key, message);
            that.isAuthorSameAsLast(type, session_key, message);
            that.isMessageFromUser(message);
            that.setMessageReference(message, ChatStorage[type].chat.list[session_key].priority.first);
        }
    };

    this.getAuthorAvatar = function(message, user_details) {
        if (message.author === CoreConfig.chat.internal_reference) {
            message.avatar = false;
            return;
        } else if (angular.isDefined(ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + message.author]) && ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + message.author]]) {
            message.avatar = '/components/com_callcenter/images/avatars/' + ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + message.author]].avatar + '-90.jpg';
            return;
        } else if (angular.isDefined(user_details[message.author])) {
            message.avatar = '/components/com_callcenter/images/avatars/' + user_details[message.author].avatar + '-90.jpg';
            return;
        }
        if (angular.isDefined(message.avatarId)) {
            message.avatar = '/components/com_callcenter/images/avatars/' + message.avatarId + '-90.jpg';
            return;
        }

    };

    this.setMessageReference = function(message, start) {
        if (parseInt(message.reference) >= parseInt(start)) {
            message.is_reference = true;
            if (message.reference.author === UserManager.user.profile.id) {
                message.is_self_referenced = true;
            } else {
                message.is_self_referenced = false;
            }
        } else {
            message.is_reference = false;
            message.is_self_referenced = false;
        }
        return;
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
        if (message.author === UserManager.user.profile.id) {
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

    this.setChatContactAdditonalProfile = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].contact.additional_profile = ContactsManager.getContactAdditionalProfile(ChatStorage[type].chat.list[session_key].contact.id);
        }
    };
    this.viewChatContactProfile = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (!ChatStorage[type].chat.list[session_key].contact.additional_profile) {
                ChatStorage[type].chat.list[session_key].contact.additional_profile = ContactsManager.getContactAdditionalProfile(ChatStorage[type].chat.list[session_key].contact.id);
                $timeout(function() {
                    ChatStorage[type].chat.list[session_key].menu.options = false;
                    ChatStorage[type].chat.list[session_key].menu.profile = true;
                }, 1000);
            } else {
                ChatStorage[type].chat.list[session_key].menu.options = false;
                ChatStorage[type].chat.list[session_key].menu.profile = true;
            }
        }
    };

    this.sendChatMessage = function(type, session_key) {
        console.log('sendChatMessage', type, session_key);
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isUndefined(ChatStorage[type].chat.list[session_key].message.text) || ChatStorage[type].chat.list[session_key].message.text === null) {
                that.setNextContactChatIntoFocus(session_key);
            } else if (ChatStorage[type].chat.list[session_key].message.text.substring(0, 1) === that.setting.command_key) {
                that.checkForCommand(type, session_key, ChatStorage[type].chat.list[session_key].message);
                return;
            } else if (angular.isDefined(ChatStorage[type].chat.list[session_key].message.text) && ChatStorage[type].chat.list[session_key].message.text !== '' && ChatStorage[type].chat.list[session_key].message.text.length < 1000) {
                var message_text = String(ChatStorage[type].chat.list[session_key].message.text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
                message_text = message_text.replace(/\n/g, '<br>');
                ChatStorage[type].chat.list[session_key].scroll.to_bottom = false;
                ChatStorage[type].chat.list[session_key].message.text = null;
                ChatStorage[type].chat.list[session_key].ux.unread = 0;
                /*          var d = new Date(); */

                if (UserManager.user.profile.encryption === true) {
                    session_key = sjcl.encrypt(CoreConfig.encrypt_pass, session_key);
                    message_text = sjcl.encrypt(session_key, ChatStorage[type].chat.list[session_key].message.text);
                }

                var message = {
                    author: UserManager.user.profile.id,
                    text: message_text,
                    encryption: UserManager.user.profile.encryption || null,
                    reference: ChatStorage[type].chat.list[session_key].reference,
                    timestamp: Firebase.ServerValue.TIMESTAMP,
                    priority: ChatStorage[type].chat.list[session_key].priority.next
                };
                if (ChatStorage[type].chat.list[session_key].session.is_group_chat === false) {
                    message.session_key = session_key.split(':')[1] + ':' + session_key.split(':')[0];
                    message.offline =  !(ChatStorage[type].chat.list[session_key].contact.profile.online) || null;
                    var contactFbKey = ChatStorage[type].session.list[session_key].fb.contact.location.messages.push(message); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                    ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message = contactFbKey.key();
                    ChatStorage[type].session.list[session_key].fb.contact.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);

                    message.session_key = session_key;
                    var selfFireKey = ChatStorage[type].session.list[session_key].fb.user.location.messages.push(message); // assign this task after sending to the to_user location !important
                    ChatStorage[type].chat.list[session_key].attr.last_sent_user_message = selfFireKey.key();
                    ChatStorage[type].session.list[session_key].fb.user.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);
                } else {
                    message.session_key = session_key;
                    var fireKey = ChatStorage[type].session.list[session_key].fb.group.location.messages.push(message); // assign this task after sending to the to_user location !important
                    ChatStorage[type].chat.list[session_key].attr.last_sent_user_message = fireKey.key();
                    ChatStorage[type].session.list[session_key].fb.group.location.messages.child(fireKey.key()).setPriority(ChatStorage[type].chat.list[session_key].priority.next);
                }

                // SessionsManager.updateChatContactActiveSession(type, session_key);
                $timeout(function() {
                    // ChatStorage[type].chat.list[session_key].signals.user.active = true;
                    // SessionsManager.updateContactChatSignals(type, session_key);
                    ChatStorage[type].chat.list[session_key].reference.key = null;
                    ChatStorage[type].chat.list[session_key].reference.author = null;
                    ChatStorage[type].chat.list[session_key].reference.name = null;
                    ChatStorage[type].chat.list[session_key].reference.text = null;
                    ChatStorage[type].chat.list[session_key].reference.priority = null;
                    if (ChatStorage[type].chat.list[session_key].scroll.to_top === true) {
                        ChatStorage[type].chat.list[session_key].scroll.to_top = false;
                    }
                    ChatStorage[type].chat.list[session_key].scroll.to_bottom = true;
                });
                // $scope.directory_index = chat.attr.index_position;

            }
        }
    };
    this.sendVideoChatMessage = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].scroll.to_bottom = false;
            var fb_timestamp = Firebase.ServerValue.TIMESTAMP;
            var message = {
                author: UserManager.user.profile.id,
                authorName: UserManager.user.name,
                avatarId: UserManager.user.avatar,
                encryption: UserManager.user.encryption,
                to: session_key,
                text: ChatStorage[type].chat.list[session_key].video.message,
                code: ChatStorage[type].chat.list[session_key].video.code,
                heading: ChatStorage[type].chat.list[session_key].video.heading,
                time: fb_timestamp,
                priority: ChatStorage[type].chat.list[session_key].priority.next,
                'session_key': session_key
            };
            if (ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                var firekey = ChatStorage[type].chat.list[session_key].fb.group.location.messages.push(message);
                chat.attr.last_sent_user_message = firekey.key();
                ChatStorage[type].chat.list[session_key].fb.group.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);
            } else {
                var contactFirekey = ChatStorage[type].chat.list[session_key].fb.contact.location.messages.push(message); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message = contactFirekey.key();
                ChatStorage[type].chat.list[session_key].fb.contact.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);

                var selfFireKey = ChatStorage[type].chat.list[session_key].fb.user.location.messages.push(message); // assign this task after sending to the to_user location !important
                ChatStorage[type].chat.list[session_key].last_sent_user_message = selfFireKey.key();
                ChatStorage[type].chat.list[session_key].fb.user.location.messages.child(ChatStorage[type].chat.list[session_key].last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);
            }
            if (!ChatStorage[type].chat.list[session_key].session.is_group_chat && !ChatStorage[type].chat.list[session_key].attr.is_directory_chat) {
                SessionsManager.updateChatContactActiveSession(type, session_key);
            }
            that.toggleVideoPanel(type, session_key);
            that.scrollChatToBottom(type, session_key);
        }
    };

    this.addAudioMessage = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].scroll.to_bottom = false;
            var fb_timestamp = Firebase.ServerValue.TIMESTAMP;
            var message = {
                author: UserManager.user.profile.id,
                authorName: UserManager.user.name,
                avatarId: UserManager.user.avatar,
                encryption: UserManager.user.encryption,
                to: session_key,
                text: ChatStorage[type].chat.list[session_key].audio.message,
                cid: ChatStorage[type].chat.list[session_key].audio.cid,
                heading: ChatStorage[type].chat.list[session_key].audio.heading,
                time: fb_timestamp,
                priority: ChatStorage[type].chat.list[session_key].priority.next,
                'session_key': session_key
            };
            if (ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                var firekey = ChatStorage[type].chat.list[session_key].fb.group.location.messages.push(message);
                ChatStorage[type].chat.list[session_key].last_sent_user_message = firekey.key();
                ChatStorage[type].chat.list[session_key].fb.group.location.messages.child(ChatStorage[type].chat.list[session_key].last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);
            } else {
                var toFirekey = ChatStorage[type].chat.list[session_key].fb.contact.location.messages.push(message); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message = toFirekey.key();
                ChatStorage[type].chat.list[session_key].fb.contact.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);

                var selfFireKey = ChatStorage[type].chat.list[session_key].fb.user.location.messages.push(message); // assign this task after sending to the to_user location !important
                ChatStorage[type].chat.list[session_key].last_sent_user_message = selfFireKey.key();
                ChatStorage[type].chat.list[session_key].fb.user.location.messages.child(ChatStorage[type].chat.list[session_key].last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);


            }
            if (!ChatStorage[type].chat.list[session_key].session.is_group_chat && !ChatStorage[type].chat.list[session_key].attr.is_directory_chat) {
                SessionsManager.updateChatContactActiveSession(type, session_key);
            }
            that.toggleAudioPanel(type, session_key);
            that.scrollChatToBottom(type, session_key);
        }
    };

    this.addImageMessage = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            ChatStorage[type].chat.list[session_key].scroll.to_bottom = false;
            var fb_timestamp = Firebase.ServerValue.TIMESTAMP;
            var message = {
                author: UserManager.user.profile.id,
                authorName: UserManager.user.name,
                avatarId: UserManager.user.avatar,
                encryption: UserManager.user.encryption,
                to: session_key,
                text: ChatStorage[type].chat.list[session_key].image.message,
                image: ChatStorage[type].chat.list[session_key].image.url,
                heading: ChatStorage[type].chat.list[session_key].image.heading,
                time: fb_timestamp,
                priority: ChatStorage[type].chat.list[session_key].priority.next,
                'session_key': session_key
            };
            if (ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                var firekey = chat.group_message_location.push(message);
                ChatStorage[type].chat.list[session_key].last_sent_user_message = firekey.key();
                ChatStorage[type].chat.list[session_key].fb.group.location.messages.child(ChatStorage[type].chat.list[session_key].last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);

            } else {
                var toFirekey = ChatStorage[type].chat.list[session_key].fb.contact.location.messages.push(message); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message = toFirekey.key();
                ChatStorage[type].chat.list[session_key].fb.contact.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);

                var selfFireKey = ChatStorage[type].chat.list[session_key].fb.user.location.messages.push(message); // assign this task after sending to the to_user location !important
                ChatStorage[type].chat.list[session_key].last_sent_user_message = selfFireKey.key();
                ChatStorage[type].chat.list[session_key].fb.user.location.messages.child(ChatStorage[type].chat.list[session_key].last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);
            }
            if (!ChatStorage[type].chat.list[session_key].session.is_group_chat && !ChatStorage[type].chat.list[session_key].attr.is_directory_chat) {
                SessionsManager.updateChatContactActiveSession(type, session_key);
            }
            that.toggleImagePanel(type, session_key);
            that.scrollChatToBottom(type, session_key);
        }
    };

    this.addReferenceToChatMessage = function(type, session_key, message) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            console.log('addReferenceToChatMessage: ', type, session_key, message);
            $timeout(function() {
                if (message.author === UserManager.user.profile.id) {
                    ChatStorage[type].chat.list[session_key].reference.name = ChatStorage[type].chat.list[session_key].user.self_name;
                } else {
                    if (angular.isDefined(ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + message.author])) {
                        ChatStorage[type].chat.list[session_key].reference.name = ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + message.author]].first_name;
                    }
                }
                ChatStorage[type].chat.list[session_key].reference.key = message.key;
                ChatStorage[type].chat.list[session_key].reference.text = message.text;
                ChatStorage[type].chat.list[session_key].reference.author = message.author;
                ChatStorage[type].chat.list[session_key].reference.priority = message.priority;
                $timeout(function() {
                    ChatStorage[type].chat.list[session_key].attr.is_text_focus = true;
                });
            }, 250);
        }
    };

    this.fetchPreviousChatMessages = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            var temp_chats = [];
            var end_point = ChatStorage[type].chat.list[session_key].priority.first - 1;
            var start_point = end_point - CoreConfig.chat.setting.message_fetch_size;
            var fb_ref;
            if (type === 'contact') {
                fb_ref = 'user';
            } else {
                fb_ref = 'group';
            }
            $log.debug('start_point: ' + start_point + ' end_point: ' + end_point);
            ChatStorage[type].chat.list[session_key].fb[fb_ref].location.messages.endAt(endAt).limit(CoreConfig.chat.setting.message_fetch_size).once('value', function(snapshot) {
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
                    ChatStorage[type].chat.list[session_key].priority.first = ChatStorage[type].chat.list[session_key].messages[0].priority;
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
                    console.log(UserManager.user.position + ' not in admin');
                }
            }
            message.text = null;
            return;
        }
    };

    this.scrollChatToBottom = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            $timeout(function() {
                if (ChatStorage[type].chat.list[session_key].scroll.to_top === true) {
                    ChatStorage[type].chat.list[session_key].scroll.to_top = false;
                }
                ChatStorage[type].chat.list[session_key].scroll.to_bottom = true;
                ChatStorage[type].chat.list[session_key].attr.is_text_focus = true;
            }, 250);
            $timeout(function() {
                ChatStorage[type].chat.list[session_key].scroll.to_bottom = false;
            }, 500);
        }
    };

    this.isChatScrollAtBottom = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (!ChatStorage[type].chat.list[session_key].attr.is_init) {
                return false;
            }
            var el = document.getElementById('list:' + session_key);
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
        }
        return false;
    };

    this.isChatReloading = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (ChatStorage[type].chat.list[session_key].attr.is_reloading === true) {
                $timeout(function() {
                    ChatStorage[type].chat.list[session_key].attr.is_reloading = false;
                }, 1000);
                return true;
            }
        }
        return false;
    };


    this.resetUserIsTyping = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isDefined(chat.interval.is_user_typing)) {
                clearInterval(chat.interval.is_user_typing);
            }
            if (ChatStorage[type].chat.list[session_key].fb.contact.location.is_typing) {
                ChatStorage[type].chat.list[session_key].fb.contact.location.is_typing.update({
                    'is-typing': false
                });
            }
        }
    };

    this.nudgeChatContact = function(type, session_key) {
        if (PermissonsManager.hasNudgePrivilege() && type === 'contact' && ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            SessionsManager.updateChatContactActiveSession(type, session_key);
            $timeout(function() {
                ChatStorage[type].chat.list[session_key].fb.contact.location.session.update({
                    nudge: true
                });
                var fb_timestamp = Firebase.ServerValue.TIMESTAMP;
                var message_text = $scope.to_trusted('<i class="fa fa-bolt"></i> ' + chat.to_user_f_name + ' has been nudged. <i class="fa fa-bolt"></i>');
                ChatStorage[type].chat.list[session_key].messages.list.push({
                    author: CoreConfig.chat.internal_reference,
                    to: ChatStorage[type].chat.list[session_key].contact.id,
                    text: message_text,
                    time: fb_timestamp,
                    priority: -1,
                    session_key: session_key
                });
                that.resetCommonDefaultSettings(type, session_key);
                $timeout(function() {
                    ChatStorage[type].chat.list[session_key].fb.contact.location.session.update({
                        nudge: false
                    });
                }, 5000);
            }, 1000);
        }
    };

    this.addEmoji = function(type, session_key, emoji) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && angular.isString(emoji)) {
            that.toggleChatMenu(type, session_key, 'emoticons', false);
            if (angular.isUndefinedOrNull(ChatStorage[type].chat.list[session_key].message.text)) {
                ChatStorage[type].chat.list[session_key].message.text = '';
            }
            ChatStorage[type].chat.list[session_key].message.text = ChatStorage[type].chat.list[session_key].message.text + emoji + ' ';
            that.toggleChatAttr(type, session_key, 'is_text_focus', true, false);
        }
    };

    this.sendChatReceipt = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (ChatStorage[type].chat.list[session_key].messages.list.length === 0) {
                return false;
            }
            var chat_record = {};
            chat_record.participants = [];
            chat_record.messages = [];
            chat_record.timestamp = new Date().toLocaleTimeString("en-us", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
            if (ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                chat_record.type = 'Group Chat';
            } else {
                chat_record.type = "Personal";
            }
            angular.forEach(ChatStorage[type].chat.list[session_key].contacts.participated_list, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push(value);
            }, chat_record.participants);
            angular.forEach(ChatStorage[type].chat.list[session_key].messages.list, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push({
                    author: value.authorName,
                    avatar: value.avatar,
                    time: Math.ceil(value.time / 1000),
                    text: value.text,
                    referenceName: value.reference.name || null,
                    referenceText: value.reference.text || null,
                    referencePriority: value.reference.priority || null
                });
            }, chat_record.messages);

            var time = Firebase.ServerValue.TIMESTAMP;
            var chat_text = 'Chat Log sent to email.';
            ChatStorage[type].chat.list[session_key].messages.list.push({
                author: CoreConfig.chat.internal_reference,
                to: session_key,
                text: chat_text,
                'time': time,
                priority: 'internal',
                session_key: session_key
            });
            that.resetCommonDefaultSettings(type, session_key);
            $http({
                method: 'POST',
                url: 'index.php?option=com_callcenter&controller=trainings&task=recordChat&format=raw',
                data: {
                    parameters: chat_record
                }
            });
        }
    };
    return this;
}]);
