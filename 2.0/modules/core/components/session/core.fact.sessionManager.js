angular.module('portalchat.core').
service('SessionManager',['$rootScope', '$log', 'CoreConfig', '$firebaseObject', 'localStorageService', function($rootScope, $log, CoreConfig, $firebaseObject, localStorageService) {
    var that = this;

    this.session = {};
    this.session.id = undefined;

    this.fb = {}; // firebase domain
    this.fb.location = {}; // location of values
    this.fb.target = {}; // specific value in a location .. uses $value

    this.load = function(){
        that.setFirebaseLocations();
        that.setFirebaseTargets();
        that.initSessionVar();
    };

    this.setFirebaseLocations = function() {
        if (CoreConfig.user.id) {
            that.fb.location.settings = new Firebase(FBURL + CoreConfig.users_reference + CoreConfig.users_settings_reference + CoreConfig.user.id + '/');
        }
    };

    this.setFirebaseTargets = function() {
        if (CoreConfig.user.id) {
            that.fb.target.is_external_window = $firebaseObject(new Firebase(FBURL + CoreConfig.users_reference + CoreConfig.users_settings_reference + CoreConfig.user.id + '/is-external-window/'));
            that.fb.target.is_panel_open = $firebaseObject(new Firebase(FBURL + CoreConfig.users_reference + CoreConfig.users_settings_reference + CoreConfig.user.id + '/module-open/'));
            return true;
        }
        return false;
    };

    this.initSessionVar = function(){
        if (localStorageService.get('isExistingChat')) {
            $log.debug('need to Destroy Chat');
            // var current = window.open('','_self');

            // $timeout(function(){
            //     current.close();
            //     self.close(); 
            //     window.close();
            // }, 500)

        } else {
            localStorageService.add('isExistingChat', (Math.random() + 1).toString(36).substring(7));
            that.session.id = localStorageService.get('isExistingChat');
            $log.debug('that.current_sesson set to ' + that.session.id);

        }
    };

    return this;
}]);
