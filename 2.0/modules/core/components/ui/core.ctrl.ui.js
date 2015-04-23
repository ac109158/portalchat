'use strict';
/*
 */
angular.module('portalchat.core').controller('core.ui', ['$rootScope', '$scope', '$log', '$timeout', '$window', 'CoreConfig', 'UtilityManager', 'UiManager', 'localStorageService',
    function($rootScope, $scope, $log, $timeout, $window, CoreConfig, UtilityManager, UiManager, localStorageService) {
        $scope.ui = UiManager.ui;
        $scope.ux = UiManager.ux;
        $scope.$watch('is_external_window.$value', function(newStatus) {
            if (newStatus === false && $scope.isExternalInstance === false) {
                /*                         UtilityManager.setFirebaseOnline(); */
                if ($scope.externalWindowObject) {
                    $scope.externalWindowlistener = null;
                    $scope.externalWindowObject = null;
                }
                $scope.isExternalWindow = false;
                $scope.isChildWindow = false;
                ChatManager.__set_active_sessions_user_location($scope);
                $timeout(function() {
                    $scope.establishLayout();
                }, 1000);

            } else if (newStatus === true && $scope.isExternalInstance === false) {
                $timeout(function() {
                    $scope.isExternalWindow = true;
                    $scope.isPageLoaded = false;
                    $scope.mute();

                }, 750);

            } else if (!localStorageService.get('isExternalWindow')) {

            }
            if (newStatus && $scope.isExternalInstance) {
                $scope.chat_panel_width = $window.innerWidth;
            } else {
                $scope.chat_panel_width = 250;
            }
        });
    }
]);
