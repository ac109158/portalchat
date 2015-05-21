'use strict'; /* Factories */
angular.module('portalchat.core').
service('UxManager', ['$rootScope', '$firebase', '$log', '$http', '$sce', '$window', '$document', '$timeout', 'CoreConfig', 'UserManager', 'UtilityManager', 'SettingsManager', 'ChatModuleManager', 'PermissionsManager', 'NotificationManager', function($rootScope, $firebase, $log, $http, $sce, $window, $document, $timeout, CoreConfig,UserManager,UtilityManager,SettingsManager, ChatModuleManager, PermissionsManager, NotificationManager) {
    var that = this;

    this.ux = {};

    this.ux.fx = {};

    this.ux.fx.isBrowserOffline = function() {
        return $window.navigator.onLine;
    };

    this.ux.fx.hasAdminRights = function() {
        return PermissionsManager.hasAdminRights();
    };

    this.ux.fx.to_trusted = function(html_code) {
        return $sce.trustAsHtml(html_code);
    };

    this.ux.fx.isReferencedMessage = function(message) {
        if (message && message.priority) {
            return ChatModuleManager.isReferencedMessage(message);
        }
        return false;
    };

    this.ux.fx.isChatScrollAtBottom = function(type, session_key) {
        return ChatModuleManager.isChatScrollAtBottom();
    };

    this.ux.fx.getDirectoryMainPanelHeight = function(chat) {
        var size;
        if (angular.isUndefinedOrNull(chat)) {
            return false;
        }
        if (SettingsManager.ux.global.layout === 1) {
            if (chat.topic_location.$value !== false) {

                return $scope.cm_directory_chat_height - 20;
            }
            return $scope.cm_directory_chat_height;

        }
        if (SettingsManager.ux.global.layout === 3) {
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


    this.ux.fx.getChatBoxHeight = function(vertical_adjust) {
        return $scope.cm_chat_message_display_height + parseInt(vertical_adjust) - 75;
    };

    return this;
}]);
