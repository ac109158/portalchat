angular.module('portalchat.core').factory('PermissionsManager', ['$rootScope', '$log', '$timeout', 'UserManager', function($rootScope, $log, $timeout, UserManager) {
    var that = this;

    this.setting = {};
    this.setting.admin_group = '3424258';

    this.group = {};
    this.group.super_admin = ['113'];
    this.group.admin = ['Administrator', 'Shift Manager', 'PlusOne Admin'];


    this.permissions = {};

    this.permissions.isDirectoryChatAvailable = function(group) {
        if (group === 'mc') {
            if ((UserManager.user.supervisors && UserManager.user.supervisors.mc) || UserManager.user.role === 'Mentor Coach') {
                return true;
            }
        } else if (group === 'admin') {
            if (UserManager.user.role === 'Administrator' || UserManager.user.role === 'Shift Manager') {
                return true;
            }
        }
        return false;
    };

    this.permissions.hasAdminRights = function(){
        if(that.group.admin.indexOf(UserManager.user.role) != -1){
            return true;
        }
        return false;
    };

    this.permissions.hasNudgePrivilege = function(){
        if(that.group.super_admin.indexOf(UserManager.user.id) != -1){
            return true;
        }
        return false;
    };

    this.load = function() {
    };

    this.setFirebaseLocation = function() {
    };

    return this.permissions;
}]);
