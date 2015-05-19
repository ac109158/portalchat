angular.module('portalchat.core').
controller('ChatController', ['$rootScope', '$scope', '$window', '$log', 'CoreConfig', 'ChatManager', 'DirectoryChatManager', 'UserManager', 'OnlineService', 'UtilityManager', 'BrowserService', 'ChatRecordService', 'AudioService', '$timeout', 'EmojiService', 'states', 'NotificationService', '$sce', '$filter', 'localStorageService', function($rootScope, $scope, $window, $log, CoreConfig, ChatManager, DirectoryChatManager, UserManager, OnlineService, UtilityManager, BrowserService, ChatRecordService, AudioService, $timeout, EmojiService, states, NotificationService, $sce, $filter, localStorageService) {

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
