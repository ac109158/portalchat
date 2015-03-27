angular.module('portalchat.core').
factory("ContactsManager", ['$log', '$http', '$timeout', '$window', '$firebaseObject', 'FBURL', 'EXT_LINK', 'ENCRYPT_PASS', 'CoreConfig', 'CoreApi', 'UserManager',
    function($log, $http, $timeout, $window, $firebaseObject, FBURL, EXT_LINK, ENCRYPT_PASS, CoreConfig, CoreApi, UserManager) {
        // Firebase.enableLogging(true);
        var that = this;

        this.smod = false;
        this.tod = false;
        this.page_loaded = false;


        this.contacts = {};
        this.contacts.online = {};
        this.contacts.offline = {};
        this.contatcs.offline_queue = {};
        this.contacts.profiles = {};

        this.load = function() {
            that.setFirebaseLocations();
            that.setProfiles();
            that.watchForNewProfiles();
            that.watchForRemovedProfiles();
            that.setAdditionalResources();
            that.page_loaded = true;
        };


        this.setFirebaseLocations = function() {
            that.public_settings_location = new Firebase(FBURL + that.public_settings_reference);
            that.users_geolocation_location = new Firebase(FBURL + that.users_reference + that.users_geolocation_reference);
            that.users_profiles_location = new Firebase(FBURL + that.users_reference + that.users_profile_reference);
            that.users_additional_profiles_location = new Firebase(FBURL + that.users_reference + that.users_additional_profile_reference);
            that.users_online_location = new Firebase(FBURL + that.users_reference + that.users_online_reference);
            that.users_geolocation_location = new Firebase(FBURL + that.users_reference + that.users_geolocation_reference);
            that.users_state_location = new Firebase(FBURL + that.users_reference + that.users_state_reference);
            that.users_presence_location = new Firebase(FBURL + that.users_reference + that.users_presence_reference);
            that.user_presence_location = new Firebase(FBURL + that.users_reference + that.users_presence_reference + response.user_id + '/');
        };

        that.setProfiles = function() {
            if (angular.isUndefined(that.users_profiles_location)) {
                $log.debug('that.users_profiles_location was undefined');
                return false;
            }
            that.users_profiles_location.once('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var user_profiles = snapshot.val();
                if (user_profiles) {
                    angular.forEach(user_profiles, function(profile) {
                        that.setContactProfile(profile);
                    });
                }
            });

        };

        this.setAdditionalResources = function() {
            that.public_settings_location.child('smod').on('value', function(snapshot) {
                var smod = snapshot.val();
                if (smod && smod.user) {
                    that.smod = that.contacts.profiles['user_' + smod.user];
                    scope.$broadcast('smodChange');
                } else {
                    that.smod = false;
                    scope.$broadcast('smodChange');
                }

            });

            that.public_settings_location.child('tod').on('value', function(snapshot) {
                /*                          console.log('page refresh value has changed to ' + snapshot.val()); */
                var tod = snapshot.val();
                if (tod && tod.user) {
                    that.tod = that.contacts.profiles['user_' + tod.user];
                    scope.$broadcast('todChange');
                } else {
                    that.tod = false;
                    scope.$broadcast('todChange');
                }

            });

            that.public_settings_location.child('require-refresh').on('value', function(snapshot) {
                var page_refresh = snapshot.val();
                if (page_refresh && that.block_refresh === false) {
                    window.location.reload(true);
                    that.block_refresh = false;
                }
            });
        };


        that.setContactProfile = function(profile) {
            if (profile) {
                // profile.name = profile.name;
                if (angular.isUndefined(profile.user_id) || profile.user_id === UserManager.user.id) {
                    return false;
                }
                that.contacts.profiles['user_' + profile.user_id] = profile;
                if (profile.alias) {
                    that.contacts.profiles['user_' + profile.user_id].name = profile.alias;
                }
                if (profile.avatar === false) {
                    that.contacts.profiles['user_' + profile.user_id].avatar = 'no-photo';
                }
                if (that.contacts.profiles['user_' + profile.user_id]) {
                    that.watchForAvatarChange(profile.user_id);
                    that.monitorContactOnline(profile.user_id);
                    that.watchContactState(profile.user_id);
                    return true;
                }
            }
            return false;
        };

        this.monitorContactOnline = function(contact_user) {
            if (angular.isUndefined(that.users_online_location)) {
                $log.debug('failure: that.users_online_location is undefined');
                return false;
            }
            that.users_online_location.child(contact_user).on('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var contact_id = 'user_' + snapshot.name();
                var online_status = snapshot.val();
                if (online_status && online_status.online) {
                    that.setContactOnline(contact_id);

                } else {
                    if (that.page_loaded) {
                        that.storeOfflineQueue(contact_id);
                        $timeout(function() {
                            if (that.isOfflineQueued(contact_id)) {
                                $log.debug('remove check was ' + that.isOfflineQueued(contact_id));
                                $log.debug('removing ' + contact_id + 'from online list');
                                that.setContactOffline(contact_id);
                            }
                        }, 10000);
                    } else {
                        that.setContactOffline(contact_id);
                    }
                }
            });
        };

        this.setContactOnline = function(contact_id) {
            if (that.contacts.offline_queue[user_id]) {
                that.contacts.offline_queue[user_id] = false;
                delete that.contacts.offline_queue[user_id];
            }
            that.contacts.online[contact_id] = that.contacts.profiles[contact_id];
            delete that.contacts.offline[contact_id];
        };

        this.setContactOffline = function(contact_id) {
            if (that.contacts.offline_queue[user_id]) {
                that.contacts.offline_queue[user_id] = false;
                delete that.contacts.offline_queue[user_id];
            }
            delete that.contacts.online[contact_id];
            that.contacts.offline[contact_id] = that.contacts.profiles[contact_id];
            delete that.contacts.offline[contact_id];
        };

        this.isOfflineQueued = function(user_id) {
            if (that.contacts.offline_queue[user_id]) {
                return true;
            }
            return false;
        };

        this.sortProfile = function(profile, online) {
            if (angular.isUndefined(profile.user_id) || profile.user_id === that.user_profile.user_id) {
                return false;
            }
            if (online) {
                delete that.contacts.offline['user_' + profile.user_id];
                that.contacts.online['user_' + profile.user_id] = profile;
            } else {
                delete that.contacts.online['user_' + profile.user_id];
                that.contacts.offline['user_' + profile.user_id] = profile;
            }
        };

        this.watchForAvatarChange = function(user) {
            if (angular.isUndefined(that.users_profiles_location)) {
                $log.debug('that.users_state_location is undefined');
                return false;
            }
            that.users_profiles_location.child(user).on('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var avatarObj = snapshot.val();
                if (avatarObj && avatarObj != 'false') {
                    var user_id = 'user_' + snapshot.name();
                    if (angular.isUndefined(that.contacts.profiles[user_id])) {
                        $log.debug('that.contacts.profiles is undefined');
                        return false;
                    }
                    that.contacts.profiles[user_id].avatar = avatarObj.avatar;
                }
            });
        };

        this.watchContactState = function(user) {
            if (angular.isUndefined(that.users_state_location)) {
                $log.debug('that.users_state_location is undefined');
                return false;
            }
            that.users_state_location.child(user).on('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                {
                    var user_state = snapshot.val();
                    if (user_state && user_state.state) {
                        var user_id = 'user_' + snapshot.name();
                        if (that.contacts.profiles[user_id]) {
                            $rootScope.$evalAsync(function() {
                                $log.debug(that.contacts.profiles[user_id].name + ' is ' + user_state.state);
                                that.contacts.profiles[user_id].state = user_state.state;
                            });
                        }
                    }
                });
        };

        this.watchForNewProfiles = function() {
            that.users_profiles_location.startAt().on('child_added', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var profile = snapshot.val();
                if (angular.isUndefined(profile.user_id) || profile.user_id === that.user_profile.user_id) {
                    return false;
                }
                that.setContactProfile(profile);
            });
        };

        this.watchForRemovedProfiles = function() {
            that.users_profiles_location.on('child_removed', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var profile = snapshot.val();
                scope.safeApply(function() {
                    $timeout(function() {
                        delete that.contacts.profiles['user_' + profile.user_id];
                        delete that.contacts.offline['user_' + profile.user_id];
                        delete that.contacts.online['user_' + profile.user_id];
                    });
                });
            });
        };

        this.storeOfflineQueue = function(user_id) {
            that.contacts.offline_queue[user_id] = true;
        };



        that.updateUsersListValueChange = function(profile) {
            if (profile === null || profile.state === null) {
                return false;
            }
            if (profile.online && profile['chat-presence'] != 'Offline') {
                that.setContactOnline(profile.user_id);
            } else {
                that.setContactOffline(profile.user_id);
            }
        };

        this.getContactsArray = function() {
            that.contacts_array = Array();
            angular.forEach(that.contacts.profiles, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push(value);
            }, that.contacts_array);
            return that.contacts_array;
        };

        this.removeByAttr = function(arr, attr, value) {
            if (angular.isDefined(arr)) {
                var i = arr.length;
                while (i--) {
                    if (arr[i] && arr[i].hasOwnProperty(attr) && (arguments.length > 2 && arr[i][attr] === value)) {
                        arr.splice(i, 1);
                    }
                }
                return arr;
            }
        };

        this.getUserAdditionalProfile = function(user, store_object) {
            that.users_additional_profiles_location.child(user).once('value', function(snapshot) {
                var additional_profile = snapshot.val();
                if (additional_profile && store_object) {
                    store_object.additional_profile = additional_profile;
                    // console.log('The additonal profile that was fetched was V');
                    // console.log(store_object.additional_profile);
                    if (additional_profile.platform && additional_profile.platform.ip && that.user_profile.position != 31 && that.user_profile.position != 32 && that.user_profile.position != 33) {

                        // $timeout(function(){
                        //     additional_profile.platform.ip = sjcl.decrypt(ENCRYPT_PASS, additional_profile.platform.ip );
                        // })
                        store_object.additional_profile = additional_profile;
                    } else {
                        delete additional_profile.platform.id;
                        store_object.additional_profile = additional_profile;
                    }
                    // that.getGeolocation(user, store_object.additional_profile);
                }
            });
        };
        return this;
    }
]);
