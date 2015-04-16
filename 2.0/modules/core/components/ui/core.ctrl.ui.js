'use strict';
/*
 */
angular.module('portalchat.core').controller('core.ui', ['$rootScope', '$scope', '$log', '$timeout', '$window', 'CoreConfig', 'UtilityManager',
    function($rootScope, $scope, $log, $timeout, $window, CoreConfig, UtilityManager) {
        $scope.test = "This is the UI controller";
        $scope.utility = {};

        $scope.ui = {};

    }
]);
