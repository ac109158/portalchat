angular.module('portalchat.core').factory('OnlineManager', ['$root', '$log', '$timeout', '$firebaseObject', 'CoreConfig', 'UserManager', 'ContactsManager', function($root, $log, $timeout, $firebaseObject, CoreConfig, UserManager, ContactsManager) {
    var that = this;
    this.isTimestamps = false;

    this.online_check_reference = "Online-Check-In" + "/";

    this.fb = {};
    this.fb.location = {};
    this.fb.targets = {};


    this.load = function() {
        if (CoreConfig.user && CoreConfig.user.id) {
            that.setFirebaseLocations();
            return true;
        }
        return false;
    };

    this.setFirebaseLocations = function() {
        that.fb.locations.online_check = new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.online_check_reference);
        that.fb.locations.user_check_in = new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.online_check_reference + CoreConfig.user.id);
        that.fb.locations.user_check_in.onDisconnect().remove();
    };


    this.setOnlineTracking = function() {
        if (UserManager.fb.target.presence.$value != 'Offline') {
            that.fb.locations.online_check.child(CoreConfig.user.id).set(Firebase.ServerValue.TIMESTAMP);
        }
        that.user_check_in = setInterval(function() {
            if (UserManager.fb.target.presence && UserManager.fb.target.presence.$value !== 'Offline') {
                that.fb.locations.online_check.child(CoreConfig.user.id).set(Firebase.ServerValue.TIMESTAMP);
            }
        }, 30000);
        that.fb.locations.user_check_in.on('value', function(snapshot) {
            if (!snapshot.val()) {
                $timeout(function() {
                    if (UserManager.fb.target.presence && UserManager.fb.target.presence.$value != 'Offline') {
                        $timeout(function() {
                            that.fb.locations.online_check.child(CoreConfig.user.id).set(Firebase.ServerValue.TIMESTAMP);
                        }, 1000);
                    } else if (UserManager.fb.target.presence && UserManager.fb.target.presence.$value === 'Offline') {
                        that.fb.locations.user_check_in.remove();
                    }
                });
            }
        });
        that.online_update = $timeout(function() {
            if (UserManager.fb.target.presence && UserManager.fb.target.presence.$value !== 'Offline') {
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
        if (UserService._user_chat_presence.$value != 'Offline') {
            if (UserManager.isManagerLevel()) {
                that.updateOnlineTimestamps();
            }
        } else if (UserService._user_chat_presence.$value == 'Offline') {
            that.user_online_check_location.remove();
        }
    };
    this.updateOnlineTimestamps = function() {
        that.fb.locations.online_check.once('value', function(snapshot) {
            $log.debug('getting user stamps');
            var user_timestamps = snapshot.val();
            var i = 1;
            var stamp_index = 1;
            angular.forEach(user_timestamps, function(value, user_id_key) {
                var contact_tag = CoreConfig.default.user_tag + user_id_key;
                if (that.isTimestamps) {
                    i++;
                    if (user_id_key == CoreConfig.user.id) {
                        stamp_index = i;
                    }
                    if (ContactsManager.contacts.profiles[contact_tag] && value > ContactsManager.contacts.profiles[contact_tag].last_check_in) {} else {
                        UserService.__storeOfflineQueue('user_' + user_id_key);
                        $timeout(function() {
                            if (ContactsManager.isOfflineQueued(contact_tag)) {
                                that.fb.locations.online_check.child(user_id_key).remove();
                                ContactsManager.setContactOffline(contact_tag);
                                ContactsManager.fb.location.online.child(user_id_key).update({
                                    'online': false
                                });
                            }
                        }, 4000);
                    }
                }
                if (ContactsManager.contacts.profiles[contact_tag]) {
                    ContactsManager.contacts.profiles[contact_tag].last_check_in = value;
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