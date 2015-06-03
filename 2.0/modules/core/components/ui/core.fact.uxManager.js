'use strict'; /* Factories */
angular.module('portalchat.core').
service('UxManager', ['$rootScope', '$firebase', '$log', '$http', '$sce', '$window', '$document', '$timeout', 'CoreConfig', 'UserManager', 'UtilityManager', 'SettingsManager', 'PermissionsManager', 'NotificationManager', 'ChatStorage', 'BrowserService', function($rootScope, $firebase, $log, $http, $sce, $window, $document, $timeout, CoreConfig, UserManager, UtilityManager, SettingsManager, PermissionsManager, NotificationManager, ChatStorage, BrowserService) {
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
                console.log('reference_priority', reference_priority);
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
            html += '<img class="cm-chat-message-avatar img-circle" ng-src="{{chat.user.profile.avatar_url}}" alt="...">';
            html += '</div>';
        }
        if (config.different_author || config.time_lapse) {
            html += '<div class="cm-chat-message-user-content-wrapper-full" ng-class="{' + "'cm-chat-message-author-break' : message.is_author_break || $last" + '}">';
            html += '<div class="cm-chat-message-user-header-bar">';
            html += '<span class="pull-left" ng-bind="chat.user.self_name"></span>';
            html += '<span class="pull-right" ng-bind="message.timestamp | ' + config.message_time_format + '"></span>';
            html += '</div>';
        } else {
            html += '<div class="cm-chat-message-user-content-wrapper-ext" ng-class="{' + "'cm-chat-message-author-break' : message.is_author_break || $last" + '}">';
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
        html += '<span id="{{message.session_key + ' + "':'" + '+ message.priority}}" class="cm-chat-message-text" scroll-on-click="ux.fx.isReferencedMessage(message.priority);" ng-dblclick="ui.fx.addReferenceToChatMessage(chat.session.type, chat.session.session_key, message);" ng-bind-html="message.text | linky:' + "'_blank'" + ' | colonToSmiley"></span>';
        if (message.reference && message.reference.key) {
            html += '<div ng-click="ux.fx.referenceMessage(chat.session.type, chat.session.session_key, message.reference.priority);" class="cm-chat-message-text-ref';
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
            html += '<img class="cm-chat-message-avatar img-circle" ng-src="{{chat.contact.profile.avatar_url}}" alt="...">';
            html += '</div>';
        }
        if (config.different_author || config.time_lapse) {
            html += '<div class="cm-chat-message-contact-content-wrapper-full" ng-class="{' + "'cm-chat-message-author-break' : message.is_author_break || $last" + '}">';
            html += '<div class="cm-chat-message-contact-header-bar">';
            html += '<span class="pull-left" ng-bind="chat.contact.profile.name"></span>';
            html += '<span class="pull-right" ng-bind="message.timestamp | ' + config.message_time_format + '"></span>';
            html += '</div>';
        } else {
            html += '<div class="cm-chat-message-contact-content-wrapper-ext" ng-class="{' + "'cm-chat-message-author-break' : message.is_author_break || $last" + '}">';
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
        html += '<span id="{{message.session_key + ' + "':'" + '+ message.priority}}" class="cm-chat-message-text" scroll-on-click="ux.fx.isReferencedMessage(message.priority);" ng-dblclick="ui.fx.addReferenceToChatMessage(chat.session.type, chat.session.session_key, message);" ng-bind-html="message.text | linky:' + "'_blank'" + ' | colonToSmiley"></span>';
        if (message.reference && message.reference.key) {
            html += '<div ng-click="ux.fx.referenceMessage(chat.session.type, chat.session.session_key, message.reference.priority);" class="cm-chat-message-text-ref';
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


    return this;
}]);
