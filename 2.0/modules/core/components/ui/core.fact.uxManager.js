'use strict'; /* Factories */
angular.module('portalchat.core').
service('UxManager', ['$rootScope', '$firebase', '$log', '$http', '$sce', '$window', '$document', '$timeout', 'CoreConfig', 'UserManager', 'ContactsManager', 'UtilityManager', 'SettingsManager', 'PermissionsManager', 'NotificationManager', 'ChatStorage', 'BrowserService', function($rootScope, $firebase, $log, $http, $sce, $window, $document, $timeout, CoreConfig, UserManager, ContactsManager, UtilityManager, SettingsManager, PermissionsManager, NotificationManager, ChatStorage, BrowserService) {
    var that = this;

    this.ux = {};

    this.reference = {};
    this.reference.allow = false;
    this.reference.priority = null;

    this.ux.platform = BrowserService.platform;

    this.ux.main_panel = {};

    this.ux.main_panel.header = {};

    this.ux.main_panel.content = {};

    this.ux.main_panel.content.wrapper = {};

    this.ux.main_panel.content.wrapper.upper_panel = {};

    this.ux.main_panel.content.wrapper.lower_panel = {};

    this.ux.main_panel.content.wrapper.lower_panel.contacts_list = {};
    this.ux.main_panel.content.wrapper.lower_panel.messages_list = {};
    this.ux.main_panel.content.wrapper.lower_panel.message_section = {};


    this.ux.fx = {};

    this.setChatModuleSectionHeights = function() {
        if (document.getElementById('cm-main-panel')) {
            that.ux.main_panel.height = window.innerHeight;
            that.ux.main_panel.header.height = document.getElementById('cm-main-panel-header').offsetHeight;
            that.ux.main_panel.content.wrapper.height = that.ux.main_panel.height - that.ux.main_panel.header.height;
            that.ux.main_panel.content.wrapper.upper_panel.height = document.getElementById('cm-main-panel-upper-panel').offsetHeight;
            that.ux.main_panel.content.wrapper.lower_panel.height = that.ux.main_panel.content.wrapper.height - that.ux.main_panel.content.wrapper.upper_panel.height;
            $rootScope.$evalAsync(function() {
                document.getElementById('cm-main-panel').style.height = that.ux.main_panel.height + "px";
                document.getElementById('cm-main-panel-content-wrapper').style.height = that.ux.main_panel.content.wrapper.height + "px";
                document.getElementById('cm-main-panel-lower-panel').style.height = that.ux.main_panel.content.wrapper.lower_panel.height + "px";

                if (document.getElementById("cm-main-panel-contacts-list")) {
                    that.ux.main_panel.content.wrapper.lower_panel.contacts_list.top = document.getElementById("cm-main-panel-contacts-list").offsetTop;
                    that.ux.main_panel.content.wrapper.lower_panel.contacts_list.height = that.ux.main_panel.content.wrapper.lower_panel.height - that.ux.main_panel.content.wrapper.lower_panel.contacts_list.top - 10;
                    document.getElementById("cm-main-panel-contacts-list").style.height = that.ux.main_panel.content.wrapper.lower_panel.contacts_list.height + "px";
                }
            });
        }

    };

    this.ux.fx.referenceMessage = function(type, session_key, reference_priority) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (angular.isDefined(reference_priority)) {
                that.reference.allow = true;
                that.reference.type = type;
                that.reference.session_key = session_key;
                that.reference.priority = reference_priority;
            }
        }
    };
    this.ux.fx.isReferencedMessage = function(priority) {
        if (that.reference.allow && that.reference.priority == priority) {
            $timeout(function() {
                that.reference.allow = false;
                that.reference.type = null;
                that.reference.session_key = null;
                that.reference.priority = null;
            }, 3000);
            return true;
        }
        return false;
    };

    this.ux.fx.evaluateChatModuleLayout = function() {
        that.setChatModuleSectionHeights();
    };
    this.ux.fx.alertNewChat = function() {
        NotificationManager.playSound('new_chat');
    };

    this.ux.fx.isBrowserOffline = function() {
        return $window.navigator.onLine;
    };

    this.ux.fx.hasAdminRights = function() {
        return PermissionsManager.hasAdminRights();
    };

    this.ux.fx.hasTopicRights = function(session_key) {
        return PermissionsManager.hasTopicRights(session_key);
    };

    this.ux.fx.hasMediaRights = function(session_key) {
        return PermissionsManager.hasMediaRights(session_key);
    };

    this.ux.fx.toTrusted = function(html_code) {
        return $sce.trustAsHtml(html_code);
    };
    this.ux.fx.getMessageHtml = function(type, session_key, message) {
        return that.returnMessageHtml(type, session_key, message);
    };

    // this.ux.fx.isReferencedMessage = function(message) {
    //     if (message && message.priority) {
    //         return ChatModuleManager.isReferencedMessage(message);
    //     }
    //     return false;
    // };

    // this.ux.fx.isChatScrollAtBottom = function(type, session_key) {
    //     return ChatModuleManager.isChatScrollAtBottom();
    // };


    this.returnMessageHtml = function(type, session_key, message) {
        var config = {};
        config.is_user_author = that.isMessageFromUser(message);
        if (!config.is_user_author) {
            config.contact = ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[CoreConfig.common.reference.user_prefix + message.author]];
        }
        config.is_full = that.isMessageAuthorDifferentLast(type, session_key, message);
        config.different_author = that.isMessageAuthorDifferentLast(type, session_key, message);
        if (!config.different_author) {
            config.time_lapse = that.isMessageTimeLapse(type, session_key, message);
            config.minute_from_last = that.isLastMessagePastMinute(type, session_key, message);
        }
        config.message_time_format = that.returnMessageTimeFormat(message);
        var html = '';
        if (config.different_author || config.time_lapse) {
            html += '<div class="cm-chat-message-wrapper-full">';
        } else {
            html += '<div class="cm-chat-message-wrapper-ext">';
        }
        html += that.getMessageTemplate(type, session_key, message, config);
        html += '</div>';
        return html;
    };

    this.getMessageTemplate = function(type, session_key, message, config) {
        if (message.author == CoreConfig.internal_reference) {
            //internal message
        } else if (message.author == UserManager.user.profile.id) {
            config.is_user_author = true;
            return that.returnUserMessage(type, session_key, message, config);
        } else {
            config.is_user_author = false;
            return that.returnContactMessage(type, session_key, message, config);
        }

    };

    this.returnUserMessage = function(type, session_key, message, config) {
        var html = '';
        if (config.different_author || config.time_lapse) {
            html += '<div class="cm-chat-message-user-avatar-wrapper img-circle">';
            html += '<img title=""class="cm-chat-message-avatar img-circle" ng-src="{{chat.user.profile.avatar_url}}" alt="...">';
            html += '</div>';
        }
        if (config.different_author || config.time_lapse) {
            html += '<div class="cm-chat-message-user-content-wrapper-full" style="background-color:rgba({{chat.session.primary_color}}, .4); color:rgba({{chat.session.primary_color}}, 1);">';
            html += '<div class="cm-chat-message-user-header-bar" style="background-color:rgba({{chat.session.primary_color}}, 1);">';
            html += '<span style="margin-right: 20px;" class="pull-left" ng-bind="chat.user.self_name"></span>';
            html += '<span class="pull-right" ng-bind="message.timestamp | ' + config.message_time_format + '"></span>';
            html += '</div>';
        } else {
            html += '<div class="cm-chat-message-user-content-wrapper-ext" ng-class="{' + "'cm-chat-message-author-break' : message.is_author_break || $last" + '}" style="background-color:rgba({{chat.session.primary_color}}, .4); color:rgba({{chat.session.primary_color}}, 1);">';
            if (config.minute_from_last) {
                html += '<div class="no-select cm-contact-chat-extend-timestamp">';
                html += '<span ng-bind="message.timestamp | ' + config.message_time_format + '"></span>';
                html += '</div>';

            }
        }
        if (config.different_author) {
            html += '<div class="cm-chat-message-text-wrapper-full">';
        } else {
            html += '<div class="cm-chat-message-text-wrapper-ext">';
        }
        html += '<span class="cm-chat-message-text" scroll-on-click="ux.fx.isReferencedMessage(message.priority);" ng-dblclick="ui.fx.addReferenceToChatMessage(chat.session.type, chat.session.session_key, message);" ng-bind-html="message.text | parseUrl | colonToSmiley" id="{{message.session_key + ' + "':'" + ' + message.priority}}"></span>';
        if (message.reference && message.reference.key) {
            html += '<br><div ng-click="ux.fx.referenceMessage(chat.session.type, chat.session.session_key, message.reference.priority);" class="cm-chat-message-text-ref';
            if (message.reference.author === UserManager.user.profile.id) {
                html += ' cm-chat-message-text-ref-self';
            } else {
                html += ' cm-chat-message-text-ref-other';
            }
            html += '" ng-class="{' + "'pointer'" + ': message.reference.priority >= chat.priority.first}">';
            html += '<span ng-bind="' + "'@'" + ' + message.reference.name"></span><span ng-bind-html="' + "' : '" + ' + message.reference.text | colonToSmiley"></span>';
            html += '</div>';
        }
        html += '<div class="clearfix"></div>';
        html += '</div>';
        html += '</div>';

        return html;
    };

    this.returnContactMessage = function(type, session_key, message, config) {
        var html = '';
        if (config.different_author || config.time_lapse) {
            html += '<div class="cm-chat-message-contact-avatar-wrapper img-circle">';
            html += '<img class="cm-chat-message-avatar img-circle" src="' + config.contact.avatar_url + '" alt="...">';
            html += '</div>';
        }
        if (config.different_author || config.time_lapse) {
            html += '<div class="cm-chat-message-contact-content-wrapper-full"  style="background-color:rgba({{chat.session.other_color}}, .4); color:rgba({{chat.session.other_color}}, 1);">';
            html += '<div class="cm-chat-message-contact-header-bar" style="background-color:rgba({{chat.session.other_color}}, 1);">';
            html += '<span style="margin-right: 20px;" class="pull-left">' + config.contact.name + '</span>';
            html += '<span class="pull-right" ng-bind="message.timestamp | ' + config.message_time_format + '"></span>';
            html += '</div>';
        } else {
            html += '<div class="cm-chat-message-contact-content-wrapper-ext" ng-class="{' + "'cm-chat-message-author-break' : message.is_author_break || $last" + '}" style="background-color:rgba({{chat.session.other_color}}, .4); color:rgba({{chat.session.other_color}}, 1);">';
            if (config.minute_from_last) {
                html += '<div class="no-select cm-contact-chat-extend-timestamp">';
                html += '<span ng-bind="message.timestamp | ' + config.message_time_format + '"></span>';
                html += '</div>';
            }
        }
        if (config.different_author) {
            html += '<div class="cm-chat-message-text-wrapper-full">';
        } else {
            html += '<div class="cm-chat-message-text-wrapper-ext">';
        }
        html += '<span class="cm-chat-message-text" scroll-on-click="ux.fx.isReferencedMessage(message.priority);" ng-dblclick="ui.fx.addReferenceToChatMessage(chat.session.type, chat.session.session_key, message);" ng-bind-html="message.text | parseUrl | colonToSmiley" id="{{message.session_key + ' + "':'" + ' + message.priority}}"></span>';
        if (message.reference && message.reference.key) {
            html += '<br><div ng-click="ux.fx.referenceMessage(chat.session.type, chat.session.session_key, message.reference.priority);" class="cm-chat-message-text-ref';
            if (message.reference.author === UserManager.user.profile.id) {
                html += ' cm-chat-message-text-ref-self';
            } else {
                html += ' cm-chat-message-text-ref-other';
            }
            html += '" ng-class="{' + "'pointer'" + ': message.reference.priority >= chat.priority.first}">';
            html += '<span ng-bind="' + "'@'" + ' + message.reference.name"></span><span ng-bind-html="' + "' : '" + ' + message.reference.text | colonToSmiley"></span>';
            html += '</div>';
        }
        html += '<div class="clearfix"></div>';
        html += '</div>';
        html += '</div>';
        return html;
    };

    this.isMessageInChatHistory = function(type, session_key, message) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && angular.isDefined(ChatStorage[type].chat.list[session_key].messages.map[message.key])) {
            return true;
        }
        return false;
    };

    this.returnMessageTimeFormat = function(message) {
        if ((3600000 + message.timestamp) - (new Date().getTime()) <= 0) {
            return "date:'MM/dd @ h:mma'";
        } else {
            return 'timeago';
        }
    };

    this.isMessageAuthorDifferentLast = function(type, session_key, message) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && ChatStorage[type].chat.list[session_key].messages.map[message.key] - 1 > -1) {
                if (ChatStorage[type].chat.list[session_key].messages.list[ChatStorage[type].chat.list[session_key].messages.map[message.key] - 1].author == message.author) {
                    return false;
                }
            }
        }
        if (ChatStorage[type].chat.list[session_key].messages.list[ChatStorage[type].chat.list[session_key].messages.map[message.key] - 1]) {
            ChatStorage[type].chat.list[session_key].messages.list[ChatStorage[type].chat.list[session_key].messages.map[message.key] - 1].is_author_break = true;
        }

        return true;
    };


    this.isMessageTimeLapse = function(type, session_key, message) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && (message.priority - 1) > -1) {
            if (360000 + ChatStorage[type].chat.list[session_key].messages.list[ChatStorage[type].chat.list[session_key].messages.map[message.key] - 1].timestamp - message.timestamp <= 0) {
                ChatStorage[type].chat.list[session_key].messages.list[ChatStorage[type].chat.list[session_key].messages.map[message.key] - 1].is_author_break = true;
                return true;
            }
        }
        return false;
    };

    this.isLastMessagePastMinute = function(type, session_key, message) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && (ChatStorage[type].chat.list[session_key].messages.map[message.key] - 1) > -1) {
            if (60000 + ChatStorage[type].chat.list[session_key].messages.list[ChatStorage[type].chat.list[session_key].messages.map[message.key] - 1].timestamp - message.timestamp <= 0) {
                return true;
            }
        }
        return false;
    };



    this.isMessageFromUser = function(message) {
        if (message.author === UserManager.user.profile.id) {
            message.author_is_self = true;
            return;
        }
        message.author_is_self = false;
        return;
    };
    this.ux.colors = [
        '210, 77, 87',
        '242, 38, 19',
        '217, 30, 24',
        '150, 40, 27',
        '239, 72, 54',
        '214, 69, 65',
        '192, 57, 43',
        '207, 0, 15',
        '231, 76, 60',
        '219, 10, 91',
        '246, 71, 71',
        '241, 169, 160',
        '210, 82, 127',
        '224, 130, 131',
        '246, 36, 89',
        '226, 106, 106',
        '220, 198, 224',
        '102, 51, 153',
        '103, 65, 114',
        '174, 168, 211',
        '145, 61, 136',
        '154, 18, 179',
        '191, 85, 236',
        '190, 144, 212',
        '142, 68, 173',
        '155, 89, 182',
        '68,108,179',
        '65, 131, 215',
        '89, 171, 227',
        '129, 207, 224',
        '82, 179, 217',
        '34, 167, 240',
        '52, 152, 219',
        '44, 62, 80',
        '25, 181, 254',
        '51, 110, 123',
        '34, 49, 63',
        '107, 185, 240',
        '30, 139, 195',
        '58, 83, 155',
        '52, 73, 94',
        '103, 128, 159',
        '37, 116, 169',
        '31, 58, 147',
        '137, 196, 244',
        '75, 119, 190',
        '92, 151, 191',
        '78,205,196',
        '135, 211, 124',
        '144, 198, 149',
        '38, 166, 91',
        '3, 201, 169',
        '104, 195, 163',
        '101, 198, 187',
        '27, 188, 155',
        '27, 163, 156',
        '102, 204, 153',
        '54, 215, 183',
        '134, 226, 213',
        '46, 204, 113',
        '22, 160, 133',
        '63, 195, 128',
        '1, 152, 117',
        '3, 166, 120',
        '77, 175, 124',
        '42, 187, 155',
        '0, 177, 106',
        '30, 130, 76',
        '4, 147, 114',
        '38, 194, 129',
        '245, 215, 110',
        '247, 202, 24',
        '244, 208, 63',
        '253, 227, 167',
        '248, 148, 6',
        '235, 149, 50',
        '232, 126, 4',
        '244, 179, 80',
        '242, 120, 75',
        '235, 151, 78',
        '245, 171, 53',
        '211, 84, 0',
        '243, 156, 18',
        '249, 105, 14',
        '249, 191, 59',
        '242, 121, 53',
        '230, 126, 34',
        '108, 122, 137',
        '189, 195, 199',
        '149, 165, 166',
        '171, 183, 183',
        '191, 191, 191'
    ];


    return this;
}]);
