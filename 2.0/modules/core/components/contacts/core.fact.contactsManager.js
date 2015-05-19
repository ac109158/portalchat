angular.module('portalchat.core').
factory("ContactsManager", ['$rootScope', '$log', '$http', '$timeout', '$window', '$firebaseObject', '$firebaseArray', 'CoreConfig', 'CoreApi', 'UserManager','PermissionsManager',
    function($rootScope, $log, $http, $timeout, $window, $firebaseObject, $firebaseArray, CoreConfig, CoreApi, UserManager,PermissionsManager) {
        // Firebase.enableLogging(true);
        var that = this;

        this.smod = false;
        this.tod = false;
        this.page_loaded = false;


        this.contacts = {};
        this.contacts.online = {};
        this.contacts.offline = {};
        this.contacts.offline_queue = {};
        this.contacts.profiles = {};

        this.registerContactOnlineQueue = [];
        // this.registerContactPresenceQueue = [];
        this.registerContactStateQueue = [];

        this.load = function() {
            if (CoreConfig.user.id) {
                that.setFirebaseLocations();
                that.setProfiles();
                that.watchForNewProfiles();
                that.watchForRemovedProfiles();
                that.setAdditionalResources();
                if(CoreConfig.monitorContactsBehavior){
                    angular.forEach(that.contacts.profiles, function(contact_profile){
                        that.monitorContactBehaviour(contact_profile);
                    });
                }
                that.page_loaded = true;
                return true;
            }
            return false;
        };


        this.setFirebaseLocations = function() {
            that.public_settings_location = new Firebase(CoreConfig.url.firebase_database + CoreConfig.public_settings_reference);
            that.contacts_geolocation_location = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.geolocation_reference);
            that.contacts_profiles_location = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.profile_reference);
            that.contacts_additional_profiles_location = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.additional_profile_reference);
            that.contacts_online_location = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.online_reference);
            that.contacts_state_location = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.state_reference);
            that.contacts_presence_location = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.presence_reference);
        };

        that.setProfiles = function() {
            if (angular.isUndefined(that.contacts_profiles_location)) {
                $log.debug('that.contacts_profiles_location was undefined');
                return false;
            }
            that.contacts_profiles_location.once('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
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
                    that.smod = that.contacts.profiles[CoreConfig.common.reference.user_prefix + smod.user];
                    $rootScope.$broadcast('smodChange');
                } else {
                    that.smod = false;
                    $rootScope.$broadcast('smodChange');
                }

            });

            that.public_settings_location.child('tod').on('value', function(snapshot) {
                // console.log('page refresh value has changed to ' + snapshot.val());
                var tod = snapshot.val();
                if (tod && tod.user) {
                    that.tod = that.contacts.profiles[CoreConfig.common.reference.user_prefix + tod.user];
                    $rootScope.$broadcast('todChange');
                } else {
                    that.tod = false;
                    $rootScope.$broadcast('todChange');
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


        this.setContactProfile = function(profile) {
            if (profile) {
                // profile.name = profile.name;
                if (angular.isUndefined(profile.user_id) || profile.user_id === UserManager.user.id) {
                    return false;
                }
                that.contacts.profiles[CoreConfig.common.reference.user_prefix + profile.user_id] = profile;
                if (profile.alias) {
                    that.contacts.profiles[CoreConfig.common.reference.user_prefix + profile.user_id].name = profile.alias;
                }
                if (profile.avatar === false) {
                    that.contacts.profiles[CoreConfig.common.reference.user_prefix + profile.user_id].avatar = 'no-photo';
                }
            }
            return false;
        };

        this.monitorContactBehaviour = function(contact_profile) {
            if (that.contacts.profiles[CoreConfig.common.reference.user_prefix + contact_profile.user_id]) {
                that.watchForAvatarChange(contact_profile.user_id);
                that.monitorContactOnline(contact_profile.user_id);
                that.monitorContactState(contact_profile.user_id);
                return true;
            }
        };

        this.monitorContactOnline = function(contact_id) {
            if (angular.isUndefined(that.contacts_online_location)) {
                $log.debug('failure: that.contacts_online_location is undefined');
                return false;
            }
            that.contacts_online_location.child(contact_id).on('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                that.registerContactOnlineChange(CoreConfig.common.reference.user_prefix + snapshot.key(), snapshot.val());
            });
        };

        this.registerContactOnlineChange = function(contact_tag, online_status) {
            if (!that.registerContactOnlineQueue[contact_tag]) {
                that.registerContactOnlineQueue[contact_tag] = true;
                // console.log('contact_tag:', contact_tag, 'online:', online_status);
                if (online_status && online_status.online) {
                    that.setContactOnline(contact_tag);

                } else {
                    if (that.page_loaded) {
                        that.storeOfflineQueue(contact_tag);
                        $timeout(function() {
                            if (that.isOfflineQueued(contact_tag)) {
                                // $log.debug('remove check was ' + that.isOfflineQueued(contact_tag));
                                // $log.debug('removing ' + contact_tag + 'from online list');
                                that.setContactOffline(contact_tag);
                            }
                        }, 10000);
                    } else {
                        that.setContactOffline(contact_tag);
                    }
                }
            }
        };

        this.monitorContactState = function(user) {
            if (angular.isUndefined(that.contacts_state_location)) {
                $log.debug('that.contacts_state_location is undefined');
                return false;
            }
            that.contacts_state_location.child(user).on('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                that.registerContactStateChange(CoreConfig.common.reference.user_prefix + snapshot.key(), snapshot.val());
            });
        };

        this.registerContactStateChange = function(contact_tag, contact_state) {
            if (!that.registerContactStateQueue[contact_tag]) {
                if (contact_tag && contact_state && contact_state.state) {
                    that.registerContactStateQueue[contact_tag] = true;
                    if (that.contacts.profiles[contact_tag]) {
                        $rootScope.$evalAsync(function() {
                            that.contacts.profiles[contact_tag].state = contact_state.state;
                        });
                    }
                }
                $timeout(function() {
                    delete that.registerContactStateQueue[contact_tag];
                });
            }
        };

        this.setContactOnline = function(contact_tag) {
            if (that.contacts.offline_queue[contact_tag]) {
                that.contacts.offline_queue[contact_tag] = false;
                delete that.contacts.offline_queue[contact_tag];
            }
            that.contacts.online[contact_tag] = that.contacts.profiles[contact_tag];
            delete that.contacts.offline[contact_tag];
            $timeout(function() {
                delete that.registerContactOnlineQueue[contact_tag];
            });

        };

        this.setContactOffline = function(contact_tag) {
            if (that.contacts.offline_queue[contact_tag]) {
                that.contacts.offline_queue[contact_tag] = false;
                delete that.contacts.offline_queue[contact_tag];
            }
            that.contacts.offline[contact_tag] = that.contacts.profiles[contact_tag];
            delete that.contacts.online[contact_tag];
            $timeout(function() {
                delete that.registerContactOnlineQueue[contact_tag];
            });



        };

        this.isOfflineQueued = function(user_id) {
            if (that.contacts.offline_queue[user_id]) {
                return true;
            }
            return false;
        };

        this.sortProfile = function(profile, online) {
            if (angular.isUndefined(profile.user_id) || profile.user_id === CoreConfig.user.id) {
                return false;
            }
            if (online) {
                delete that.contacts.offline[CoreConfig.common.reference.user_prefix + profile.user_id];
                that.contacts.online[CoreConfig.common.reference.user_prefix + profile.user_id] = profile;
            } else {
                delete that.contacts.online[CoreConfig.common.reference.user_prefix + profile.user_id];
                that.contacts.offline[CoreConfig.common.reference.user_prefix + profile.user_id] = profile;
            }
        };

        this.watchForAvatarChange = function(user) {
            if (angular.isUndefined(that.contacts_profiles_location)) {
                $log.debug('that.contacts_state_location is undefined');
                return false;
            }
            that.contacts_profiles_location.child(user).on('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var avatarObj = snapshot.val();
                if (avatarObj && avatarObj != 'false') {
                    var user_id = CoreConfig.common.reference.user_prefix + snapshot.key();
                    if (angular.isUndefined(that.contacts.profiles[user_id])) {
                        $log.debug('that.contacts.profiles is undefined');
                        return false;
                    }
                    that.contacts.profiles[user_id].avatar = avatarObj.avatar;
                }
            });
        };



        this.watchForNewProfiles = function() {
            that.contacts_profiles_location.startAt().on('child_added', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var profile = snapshot.val();
                // console.log('adding: ', profile);
                if (angular.isUndefined(profile.user_id) || profile.user_id === CoreConfig.user.id) {
                    return false;
                }
                that.setContactProfile(profile);
                if(CoreConfig.monitorContactsBehavior){
                    that.monitorContactBehaviour(profile);
                }
            });
        };

        this.watchForRemovedProfiles = function() {
            that.contacts_profiles_location.on('child_removed', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var profile = snapshot.val();
                // console.log('removing: ', profile);
                $timeout(function() {
                    delete that.contacts.profiles[CoreConfig.common.reference.user_prefix + profile.user_id];
                    delete that.contacts.offline[CoreConfig.common.reference.user_prefix + profile.user_id];
                    delete that.contacts.online[CoreConfig.common.reference.user_prefix + profile.user_id];
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

        this.getContactAdditionalProfile = function(contact_id) {
            that.contacts_additional_profiles_location.child(contact_id).once('value', function(snapshot) {
                var additional_profile = snapshot.val();
                if (additional_profile) {
                    if (additional_profile.platform && PermissionsManager.hasSupervisorRights()) {
                        store_object.additional_profile = additional_profile;
                    }
                }
                return additional_profile;
            });
        };
        return this;
    }
]);
