angular.module('portalchat.core').
controller('ChatController', ['$rootScope', '$scope', '$window', '$log', 'CoreConfig', 'ChatModuleManager', 'EmojiService', function($rootScope, $scope, $window, $log, CoreConfig, ChatModuleManager, EmojiService) {
    angular.isUndefinedOrNull = function(val) {
        return angular.isUndefined(val) || val === null;
    };

    $scope.emojis = EmojiService.contents;

    $scope.$on('init-chat-system', function() {
        $scope.init();
    });



    $scope.init = function() {
        if (CoreConfig.user && CoreConfig.user.id) {
            if (CoreConfig.user.role === CoreConfig.admin_role) {
                ChatModuleManager.validateChatModels();
            }
            $scope.$on('LocalStorageModule.notification.setItem', function(event, parameters) {
                $log.debug('local storage: ' + parameters.key + ' ; ' + parameters.newvalue);
                // parameters.key;  // contains the key that changed
                // parameters.newvalue;  // contains the new value
            });
            ChatModuleManager.setOnlineTracking();
        } else {
            console.log('User does not exist!');
        }
    };

    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $scope.$watch('activeChats.length', function(length) {
        if (length > $scope.max_count) {
            $scope.unactive_chat_count = length - $scope.max_count;
        } else {
            $scope.unactive_chat_count = 0;
        }
        $scope.unactiveChats = null;
        $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
        $scope.setActiveChatsPriority();
        /*          $scope.resetChatUnread(); */
        if ($scope.layout != 2) {
            $scope.$evalAsync(function() {
                UiManager.setModuleLayout();
            });
        }
    });

    $scope.$watch('max_count', function(newStatus) {
        $scope.max_count = newStatus;
        if ($scope.activeChats.length > $scope.max_count) {
            $scope.unactive_chat_count = $scope.activeChats.length - $scope.max_count;
        } else {
            $scope.unactive_chat_count = 0;
        }
        $scope.unactiveChats = null;
        $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
        $scope.resetChatUnread();
    });

    $scope.$watch('video.url', function(newValue) {
        if (newValue) {
            $scope.video.code = '';
            $timeout(function() {
                $scope.video.code = $scope.video.url.split('v=')[1];
                $scope.video.code = $scope.video.code.split('&')[0];
            }, 250);

        }
    });

    $scope.$watch('audio.cid', function(newValue) {
        if (newValue && newValue.length > 0) {
            $scope.audio.url = null;
            $timeout(function() {
                AudioService.async($scope, newValue);
            }, 250);

        }
    });

    $scope.$watch('audio.url', function(newValue) {
        if (newValue && newValue.length > 0) {
            $scope.audio.url = null;
            $scope.audio.url = $sce.trustAsResourceUrl(newValue);

        }
    });

    $scope.$on('requestChatSession', function(event, to_user) {
        ChatModuleManager.__requestChatSession($scope, to_user, true);
    });

    $scope.$on('set-chat-into-focus', function(event, type, session_key){
        ChatModuleManager.setChatIntoFocus(type, session_key);
    });

}]);
