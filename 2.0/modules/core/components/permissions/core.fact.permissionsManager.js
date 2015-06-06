angular.module('portalchat.core').factory('PermissionsManager', ['$rootScope', '$log', '$timeout', 'UserManager', 'ContactsManager', function($rootScope, $log, $timeout, UserManager, ContactsManager) {
    var that = this;

    this.setting = {};
    this.setting.admin_group = '3424258';

    this.group = {};
    this.group.super_admin = ['113', '379'];
    this.group.admin = ['Administrator', 'Shift Manager', 'PlusOne Admin'];


    this.permissions = {};

    this.permissions.isDirectoryChatAvailable = function(group) {
        if (group === 'mc') {
            if ((UserManager.user.supervisors && UserManager.user.supervisors.mc) || UserManager.user.additional_profile.role === 'Mentor Coach') {
                return true;
            }
        } else if (group === 'admin') {
            if (UserManager.user.additional_profile.role === 'Administrator' || UserManager.user.additional_profile.role === 'Shift Manager') {
                return true;
            }
        }
        return false;
    };
    this.permissions.hasSuperAdminRights = function(){
        if(that.group.super_admin.indexOf(UserManager.user.profile.id) != -1){
            return true;
        }
        return false;
    };

    this.permissions.hasAdminRights = function(){
        if(that.group.admin.indexOf(UserManager.user.additional_profile.role) != -1){
            return true;
        }
        return false;
    };

    this.permissions.hasSupervisorRights = function(){
        if(that.group.admin.indexOf(UserManager.user.additional_profile.role) != -1){
            return true;
        }
        return false;
    };

    this.permissions.hasTopicRights = function(session_key){
        if(session_key === 'sm_group_chat'){
            if (UserManager.user.profile.id === ContactsManager.contacts.tod || that.permissions.hasSuperAdminRights()){
                return true;
            }
        } else if(session_key === 'sm_tech_chat'){
            if(UserManager.user.profile.id === ContactsManager.contacts.tod || that.permissions.hasSuperAdminRights()){
                return true;
            }
        }
        return false;
    };

    this.permissions.hasMediaRights = function(session_key){
        if(session_key === 'sm_group_chat'){
            if (UserManager.user.profile.id === ContactsManager.contacts.tod || that.permissions.hasSuperAdminRights()){
                return true;
            }
        } else if(session_key === 'sm_tech_chat'){
            if(UserManager.user.profile.id === ContactsManager.contacts.tod || that.permissions.hasSuperAdminRights()){
                return true;
            }
        }
        return false;
    };

    this.permissions.hasNudgePrivilege = function(){
        if(that.group.super_admin.indexOf(UserManager.user.profile.id) != -1){
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
