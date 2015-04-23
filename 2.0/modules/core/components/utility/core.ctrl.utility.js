'use strict';
/*
 */
angular.module('portalchat.core').controller('core.utility', ['$rootScope', '$scope', '$log', '$timeout', '$window', 'CoreConfig', 'UtilityManager',
    function($rootScope, $scope, $log, $timeout, $window, CoreConfig, UtilityManager) {
        $scope.test = "This is the Utility controller";
        $scope.utility = {};

        $scope.utility.engine = UtilityManager.engine;

        $scope.utility.setFirebaseOffline = function() {
            $log.debug('setting offline');
            UtilityManager.setFirebaseOffline();
        };

        $scope.utility.setFirebaseOnline = function() {
            $log.debug('setting Online');
            UtilityManager.setFirebaseOnline();
        };

        $scope.utility.runPingTest = function() {
            UtilityManager.pingTest($scope.engine.network);
        };

        $scope.utility.isBrowserOffline = function() {
            return $window.navigator.onLine;
        };

        $scope.utility.pingHost= function(){
            UtilityManager.pingHost();
        };
    }
]);
