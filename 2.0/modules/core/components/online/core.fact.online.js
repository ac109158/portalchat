angular.module('portalchat.core').factory('OnlineManager', ['$rootScope', '$log', '$timeout', '$firebaseObject', 'CoreConfig', 'UserManager', 'ContactsManager', function($rootScope, $log, $timeout, $firebaseObject, CoreConfig, UserManager, ContactsManager) {
    var that = this;
    this.isTimestamps = false;

    this.online_check_reference = "Online-Check-In" + "/";

    this.fb = {};
    this.fb.location = {};
    this.fb.targets = {};


    this.load = function() {
        if (CoreConfig.user && CoreConfig.user.id) {
            that.setFirebaseLocation();
            $timeout(function() {
                that.setOnlineTracking();
            }, 2000);
            return true;
        }
        return false;
    };

    this.setFirebaseLocation = function() {
        that.fb.location.online_check = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.online_check_reference);
        that.fb.location.user_check_in = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.online_check_reference + CoreConfig.user.id);
        that.fb.location.user_check_in.onDisconnect().remove();
    };


    this.setOnlineTracking = function() {
        if (UserManager.user.presence != 'Offline') {
            that.fb.location.online_check.child(CoreConfig.user.id).set(Firebase.ServerValue.TIMESTAMP);
            UserManager.user.timestamp = new Date().getTime();
        }
        that.user_check_in = setInterval(function() {
            if (UserManager.user.presence !== 'Offline') {
                that.fb.location.online_check.child(CoreConfig.user.id).set(Firebase.ServerValue.TIMESTAMP);
                UserManager.user.timestamp = new Date().getTime();
            }
        }, 30000);
        that.fb.location.user_check_in.on('value', function(snapshot) {
            if (!snapshot.val()) {
                $timeout(function() {
                    if (UserManager.user.presence != 'Offline') {
                        $timeout(function() {
                            that.fb.location.online_check.child(CoreConfig.user.id).set(Firebase.ServerValue.TIMESTAMP);
                            UserManager.user.timestamp = new Date().getTime();
                        }, 1000);
                    } else if (UserManager.user.presence === 'Offline') {
                        that.fb.location.user_check_in.remove();
                    }
                });
            }
        });
        that.online_update = $timeout(function() {
            if (UserManager.user.presence !== 'Offline') {
                that.updateTimestamp();
            }
        }, 5000);
    };

    this.resetTimeout = function(interval) {
        that.online_update = $timeout(function() {
            if (UserManager.fb.target.online.$value != 'Offline') {
                that.updateTimestamp();
            }
            $timeout.cancel(that.online_update);
        }, interval);
    };

    this.updateTimestamp = function() {
        if (UserManager.fb.target.presence != 'Offline') {
            if (UserManager.isManagerLevel()) {
                that.updateOnlineTimestamps();
            }
        } else if (UserManagerfb.target.presence == 'Offline') {
            that.user_online_check_location.remove();
        }
    };
    this.updateOnlineTimestamps = function() {
        that.fb.location.online_check.once('value', function(snapshot) {
            $log.debug('getting user stamps');
            var user_timestamps = snapshot.val();
            var i = 1;
            var stamp_index = 1;
            angular.forEach(user_timestamps, function(value, user_id_key) {
                var contact_tag = CoreConfig.common.reference.user_prefix + user_id_key;
                if (that.isTimestamps) {
                    i++;
                    if (user_id_key == CoreConfig.user.id) {
                        stamp_index = i;
                    }
                    if (angular.isDefined(ContactsManager.contacts.profiles.map[contact_tag]) && ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[contact_tag]]) {
                        if (value > ContactsManager.contacts.profiles[contact_tag].last_check_in) {} else {
                            ContactsManager.storeOfflineQueue(CoreConfig.common.reference.user_prefix + user_id_key);
                            $timeout(function() {
                                if (ContactsManager.isOfflineQueued(contact_tag)) {
                                    that.fb.location.online_check.child(user_id_key).remove();
                                    ContactsManager.setContactOffline(contact_tag);
                                    console.log('setting offline: ', user_id_key);
                                    ContactsManager.fb.location.online.child(user_id_key).update({
                                        'online': false
                                    });
                                }
                            }, 4000);
                        }
                    }
                }
                if (angular.isDefined(ContactsManager.contacts.profiles.map[contact_tag]) && ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[contact_tag]]) {
                    ContactsManager.contacts.profiles.list[ContactsManager.contacts.profiles.map[contact_tag]].last_check_in = value;
                }
            });
            that.isTimestamps = true;
            $timeout(function() {
                that.resetTimeout(62000 * stamp_index);
            }, 6000);
        });
    };
    return this;
}]);
