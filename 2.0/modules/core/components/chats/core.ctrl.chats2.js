angular.module('portalchat.core').
controller('ChatController', ['$rootScope', '$scope', '$window', '$log', 'CoreConfig', 'ChatManager', 'DirectoryChatManager', 'UserManager', 'OnlineService', 'UtilityManager', 'BrowserService', 'ChatRecordService', 'AudioService', '$timeout', 'EmojiService', 'states', 'NotificationService', '$sce', '$filter', 'localStorageService', function($rootScope, $scope, $window, $log, CoreConfig, ChatManager, DirectoryChatManager, UserManager, OnlineService, UtilityManager, BrowserService, ChatRecordService, AudioService, $timeout, EmojiService, states, NotificationService, $sce, $filter, localStorageService) {



    $scope.updateChatResize = function(chat) {
        ChatManager._active_sessions_user_location.child(chat.to_user_id || chat.session_key).update({
            'resize_adjust': chat.resize_adjustment
        });
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




    $scope.isTrue = function(bool) {
        if (bool) {
            $log.debug('it was true');

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





    /*     $scope.user_group = [UserManager.getUserField('user_id'), UserManager.getUserField('pc'), UserManager.getUserField('mc'), UserManager.getUserField('admin')]; */


    $scope.toggleFilterMenu = function() {
        $scope.showFilterMenu = !$scope.showFilterMenu;
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
