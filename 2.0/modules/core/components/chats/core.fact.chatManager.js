angular.module('portalchat.core').
service('ChatManager', ['$log', '$http', '$timeout', '$sce', 'CoreConfig', 'UtilityManager', 'UserManager', 'ContactsManager', 'SessionsManager', 'PermissionsManager', 'ChatBuilder', 'ChatStorage', 'AudioService', function($log, $http, $timeout, $sce, CoreConfig, UtilityManager, UserManager, ContactsManager, SessionsManager, PermissionsManager, ChatBuilder, ChatStorage, AudioService) {
    var that = this;

    this.setting = {};
    this.setting.command_key = CoreConfig.module.setting.command_key;

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
            if (ChatStorage[type].chat.list[session_key].fb.group.location.session) {
                ChatStorage[type].chat.list[session_key].fb.group.location.session.child('is_typing/' + UserManager.user.profile.id).set(UserManager.user.avatar);

            }
            ChatStorage[type].chat.list[session_key].interval.is_user_typing = $timeout(function() {
                ChatStorage[type].chat.list[session_key].fb.group.location.session.child('is_typing/' + UserManager._user_profile.user_id).set(null);
                $timeout.cancel(ChatStorage[type].chat.list[session_key].interval.is_user_typing);
            }, 2000);
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

            ChatStorage[type].chat.list[session_key].ux.header_color = CoreConfig.chat.ui.header_color;
            ChatStorage[type].chat.list[session_key].ux.nudge = false;
            ChatStorage[type].chat.list[session_key].ux.unread = 0;


            ChatStorage[type].chat.list[session_key].invite.show = false;
            ChatStorage[type].chat.list[session_key].invite.contact = '';
            ChatStorage[type].chat.list[session_key].invite.set_contact = false;

            ChatStorage[type].chat.list[session_key].reference.key = false;
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
            that.resetCommonDefaultSettings(type, session_key);
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
                if (angular.isDefined(ChatStorage[type].chat.list[session_key].fb.group.location.session)) {
                    ChatStorage[type].chat.list[session_key].fb.group.location.session.update({
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
            if (angular.isDefined(ChatStorage[type].chat.list[session_key].fb.group.location.session)) {
                ChatStorage[type].chat.list[session_key].fb.group.location.session.update({
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
            if (ChatStorage[type].chat.list[session_key].fb.group.location.session) {
                ChatStorage[type].chat.list[session_key].fb.group.location.session.update({
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
        } else if (angular.isDefined(ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + message.author]) && ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + message.author]] ) {
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
        /*      console.log(message); */

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

    this.updateChatMessage = function(type, session_key, priority, message_index) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isUndefined(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message) || angular.isUndefined(ChatStorage[type].chat.list[session_key].attr.last_sent_user_message)) return false;
            var encrypted_text;
            var updated_text = $('#ID_' + ChatStorage[type].chat.list[session_key].contact.id + '_' + priority).text();
            if (updated_text === 'null' || updated_text === '') {
                return false;
            }
            /*      updated_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string */
            ChatStorage[type].chat.list[session_key].messages_list[message_index].text = updated_text;
            if (UserManager.user.encryption === true) {
                var encrypt_session_key = sjcl.encrypt(CoreConfig.encrypt_pass, session_key);
                encrypted_text = sjcl.encrypt(session_key, updated_text);
                if (encrypted_text === 'null' || new_text === '') {
                    return false;
                }
            }
            if (ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                ChatStorage[type].chat.list[session_key].fb.group.location.messages.push(message);
                chat.attr.last_sent_user_message = firekey.name();
                ChatStorage[type].chat.list[session_key].fb.group.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_user_message).update({
                    text: encrypted_text || updated_text
                });
            } else {
                ChatStorage[type].chat.list[session_key].fb.user.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_user_message).update({
                    text: encrypted_text || updated_text
                });
                ChatStorage[type].chat.list[session_key].fb.contact.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message).update({
                    text: encrypted_text || updated_text
                });
            }
            ChatStorage[type].chat.list[session_key].attr.is_text_focus = true;
            $timeout(function() {
                that.resetUserIsTyping(type, session_key);
            }, 500);
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

                /*          var message_text = String(ChatStorage[type].chat.list[session_key].message.text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string */
                chat.scroll_bottom = false;
                var message_text = ChatStorage[type].chat.list[session_key].message.text;
                ChatStorage[type].chat.list[session_key].message.text = null;
                chat.unread = 0;
                /*          var d = new Date(); */
                var n = Firebase.ServerValue.TIMESTAMP;
                clearInterval(chat.typing_presence_timeout);
                if (UserManager.encryption === true) {
                    session_key = sjcl.encrypt(CoreConfig.encrypt_pass, session_key);
                    message_text = sjcl.encrypt(session_key, ChatStorage[type].chat.list[session_key].message.text);
                }

                var message = {
                    author: UserManager.user.profile.id,
                    authorName: UserManager.user.name,
                    to: ChatStorage[type].chat.list[session_key].to_user_id,
                    text: message_text,
                    encryption: UserManager.user.encryption,
                    offline: !(ChatStorage[type].chat.list[session_key].fb.contact.target.online.$value),
                    reference: ChatStorage[type].chat.list[session_key].reference.key,
                    referenceAuthor: ChatStorage[type].chat.list[session_key].reference.author,
                    referenceName: ChatStorage[type].chat.list[session_key].reference.name,
                    referenceText: ChatStorage[type].chat.list[session_key].reference.text,
                    time: n,
                    priority: ChatStorage[type].chat.list[session_key].next_priority,
                    'session_key': session_key || ChatStorage[type].chat.list[session_key].session_key
                };

                $timeout(function() {
                    var contactFbKey = chat.to_user_message_location.push(message); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                    ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message = contactFbKey.name();
                    ChatStorage[type].chat.list[session_key].fb.contact.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message).setPriority(ChatStorage[type].chat.list[session_key].last_sent_contact_message.priority.next);


                    var selfFireKey = ChatStorage[type].chat.list[session_key].fb.user.location.messages.push(message); // assign this task after sending to the to_user location !important
                    ChatStorage[type].chat.list[session_key].attr.last_sent_user_message = selfFireKey.name();
                    ChatStorage[type].chat.list[session_key].fb.user.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].last_sent_contact_message.priority.next);
                }, chat_delay);
                ChatStorage[type].chat.list[session_key].fb.contact.location.is_typing.update({
                    'is-typing': false
                });
                SessionsManager.updateChatContactActiveSession(type, session_key);
                UtilityManager.pingHost();
                $timeout(function() {
                    ChatStorage[type].chat.list[session_key].reference.key = null;
                    ChatStorage[type].chat.list[session_key].reference.author = null;
                    ChatStorage[type].chat.list[session_key].reference.name = null;
                    ChatStorage[type].chat.list[session_key].reference.text = null;
                    if (ChatStorage[type].chat.list[session_key].scroll.to_top === true) {
                        ChatStorage[type].chat.list[session_key].scroll.to_top = false;
                    }
                    ChatStorage[type].chat.list[session_key].scroll.to_bottom = true;
                }, (chat_delay + 250));
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
                chat.attr.last_sent_user_message = firekey.name();
                ChatStorage[type].chat.list[session_key].fb.group.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);
            } else {
                var contactFirekey = ChatStorage[type].chat.list[session_key].fb.contact.location.messages.push(message); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message = contactFirekey.name();
                ChatStorage[type].chat.list[session_key].fb.contact.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);

                var selfFireKey = ChatStorage[type].chat.list[session_key].fb.user.location.messages.push(message); // assign this task after sending to the to_user location !important
                ChatStorage[type].chat.list[session_key].last_sent_user_message = selfFireKey.name();
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
                ChatStorage[type].chat.list[session_key].last_sent_user_message = firekey.name();
                ChatStorage[type].chat.list[session_key].fb.group.location.messages.child(ChatStorage[type].chat.list[session_key].last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);
            } else {
                var toFirekey = ChatStorage[type].chat.list[session_key].fb.contact.location.messages.push(message); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message = toFirekey.name();
                ChatStorage[type].chat.list[session_key].fb.contact.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);

                var selfFireKey = ChatStorage[type].chat.list[session_key].fb.user.location.messages.push(message); // assign this task after sending to the to_user location !important
                ChatStorage[type].chat.list[session_key].last_sent_user_message = selfFireKey.name();
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
                ChatStorage[type].chat.list[session_key].last_sent_user_message = firekey.name();
                ChatStorage[type].chat.list[session_key].fb.group.location.messages.child(ChatStorage[type].chat.list[session_key].last_sent_user_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);

            } else {
                var toFirekey = ChatStorage[type].chat.list[session_key].fb.contact.location.messages.push(message); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message = toFirekey.name();
                ChatStorage[type].chat.list[session_key].fb.contact.location.messages.child(ChatStorage[type].chat.list[session_key].attr.last_sent_contact_message).setPriority(ChatStorage[type].chat.list[session_key].priority.next);

                var selfFireKey = ChatStorage[type].chat.list[session_key].fb.user.location.messages.push(message); // assign this task after sending to the to_user location !important
                ChatStorage[type].chat.list[session_key].last_sent_user_message = selfFireKey.name();
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
            if (message.author === UserManager.user.profile.id) {
                ChatStorage[type].chat.list[session_key].reference.name = ChatStorage[type].chat.list[session_key].user.self_name;
            } else if (!ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                ChatStorage[type].chat.list[session_key].reference.name = ChatStorage[type].chat.list[session_key].contact.first_name;
            } else {
                var name_split = message.authorName.match(/\S+/g); // splits the contact's first and last name
                ChatStorage[type].chat.list[session_key].reference.name = name_split[0];
            }
            ChatStorage[type].chat.list[session_key].reference.key = message.priority;
            ChatStorage[type].chat.list[session_key].reference.text = message.text;
            ChatStorage[type].chat.list[session_key].reference.author = message.author;
            ChatStorage[type].chat.list[session_key].attr.is_text_focus = true;
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
            var el = document.getElementById('message_display_' + session_key);
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
                    referenceText: value.reference.text || null
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
