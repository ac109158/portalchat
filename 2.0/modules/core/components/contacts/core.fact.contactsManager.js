angular.module('portalchat.core').
factory("ContactsManager", ['$rootScope', '$log', '$http', '$timeout', '$window', '$firebaseObject', '$firebaseArray', 'CoreConfig', 'CoreApi', 'UserManager', 'PermissionsManager',
    function($rootScope, $log, $http, $timeout, $window, $firebaseObject, $firebaseArray, CoreConfig, CoreApi, UserManager, PermissionsManager) {
        // Firebase.enableLogging(true);
        var that = this;

        this.smod = false;
        this.tod = false;
        this.page_loaded = false;


        this.contacts = {};
        //
        this.offline_queue = {};

        this.contacts.profiles = {};
        this.contacts.profiles.list = [];
        this.contacts.profiles.map = {};

        this.fb = {};
        this.fb.location = {};


        this.register_contact_online_queue = [];
        // this.registerContactPresenceQueue = [];
        this.register_contact_state_queue = [];

        this.load = function() {
            if (CoreConfig.user.id) {
                that.setFirebaseLocations();
                that.setProfiles();
                that.watchForNewProfiles();
                that.watchForRemovedProfiles();
                that.setAdditionalResources();
                that.page_loaded = true;
                return true;
            }
            return false;
        };


        this.setFirebaseLocations = function() {
            that.fb.location.public_settings = new Firebase(CoreConfig.url.firebase_database + CoreConfig.public_settings_reference);
            that.fb.location.geolocation = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.geolocation_reference);
            that.fb.location.profiles = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.profile_reference);
            that.fb.location.online = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.online_reference);
            that.fb.location.state = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.state_reference);
            that.fb.location.presence = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.presence_reference);
        };

        that.setProfiles = function() {
            if (angular.isUndefined(that.fb.location.profiles)) {
                $log.debug('that.fb.location.profiles was undefined');
                return false;
            }
            that.fb.location.profiles.once('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var user_profiles = snapshot.val();
                console.log('user_profiles:', user_profiles);
                if (user_profiles) {
                    angular.forEach(user_profiles, function(profile) {
                        if (!UserManager.user.group[profile.id]) {
                            that.setContactProfile(profile);
                        }
                    });
                }
            });
        };

        this.setAdditionalResources = function() {
            that.fb.location.public_settings.child('smod').on('value', function(snapshot) {
                var smod = snapshot.val();
                if (smod && smod.user) {
                    that.smod = that.contacts.profiles.list[that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + smod.user]];
                    $rootScope.$broadcast('smodChange');
                } else {
                    that.smod = false;
                    $rootScope.$broadcast('smodChange');
                }

            });

            that.fb.location.public_settings.child('tod').on('value', function(snapshot) {
                // console.log('page refresh value has changed to ' + snapshot.val());
                var tod = snapshot.val();
                if (tod && tod.user) {
                    that.tod = that.contacts.profiles.list[that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + tod.user]];
                    $rootScope.$broadcast('todChange');
                } else {
                    that.tod = false;
                    $rootScope.$broadcast('todChange');
                }

            });

            that.fb.location.public_settings.child('require-refresh').on('value', function(snapshot) {
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
                if (profile.alias) {
                    profile.name = profile.alias;
                    delete profile.alias;
                }
                profile.first_name = profile.name.match(/\S+/g)[0];
                profile.avatar_url =  CoreConfig.url.avatar_path + profile.avatar + '-90.jpg';
                if (profile.avatar === false) {
                    profile.avatar = 'no-photo';
                }
                if (angular.isDefined(that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + profile.user_id]) && that.contacts.profiles.list[that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + profile.user_id]]) {
                    that.contacts.profiles.list[that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + profile.user_id]] = profile;
                } else {
                    that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + profile.user_id] = that.contacts.profiles.list.length;
                    that.contacts.profiles.list.push(profile);
                }
            }
            return false;
        };

        this.monitorContactBehaviour = function(contact_profile) {
            if (angular.isDefined(that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + contact_profile.user_id])) {
                that.watchForAvatarChange(contact_profile.user_id);
                that.monitorContactOnline(contact_profile.user_id);
                that.monitorContactState(contact_profile.user_id);
                return true;
            }
        };

        this.monitorContactOnline = function(contact_id) {
            if (angular.isUndefined(that.fb.location.online)) {
                $log.debug('failure: that.fb.location.online is undefined');
                return false;
            }
            that.fb.location.online.child(contact_id).on('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                that.registerContactOnlineChange(CoreConfig.common.reference.user_prefix + snapshot.key(), snapshot.val());
            });
        };

        this.registerContactOnlineChange = function(contact_tag, online_status) {
            if (!that.register_contact_online_queue[contact_tag]) {
                that.register_contact_online_queue[contact_tag] = true;
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
            if (angular.isUndefined(that.fb.location.state)) {
                $log.debug('that.fb.location.state is undefined');
                return false;
            }
            that.fb.location.state.child(user).on('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                that.registerContactStateChange(CoreConfig.common.reference.user_prefix + snapshot.key(), snapshot.val());
            });
        };

        this.registerContactStateChange = function(contact_tag, contact_state) {
            if (!that.register_contact_state_queue[contact_tag]) {
                if (contact_tag && contact_state && contact_state.state) {
                    that.register_contact_state_queue[contact_tag] = true;
                    if (angular.isDefined(that.contacts.profiles.map[contact_tag]) && that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]]) {
                        $rootScope.$evalAsync(function() {
                            that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]].state = contact_state.state;
                        });
                    }
                }
                $timeout(function() {
                    delete that.register_contact_state_queue[contact_tag];
                });
            }
        };

        this.setContactOnline = function(contact_tag) {
            if (angular.isDefined(that.contacts.profiles.map[contact_tag]) && that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]]) {
                that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]].online = true;
                $timeout(function() {
                    delete that.register_contact_online_queue[contact_tag];
                });
            }
        };

        this.setContactOffline = function(contact_tag) {
            if (angular.isDefined(that.contacts.profiles.map[contact_tag]) && that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]]) {
                that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]].online = false;
                $timeout(function() {
                    delete that.register_contact_online_queue[contact_tag];
                });
            }
        };

        this.isOfflineQueued = function(user_id) {
            if (that.offline_queue[user_id]) {
                return true;
            }
            return false;
        };

        // this.sortProfile = function(profile, online) {
        //     if (angular.isUndefined(profile.user_id) || profile.user_id === CoreConfig.user.id) {
        //         return false;
        //     }
        //     if (online) {
        //         delete that.contacts.offline[CoreConfig.common.reference.user_prefix + profile.user_id];
        //         that.contacts.online[CoreConfig.common.reference.user_prefix + profile.user_id] = profile;
        //     } else {
        //         delete that.contacts.online[CoreConfig.common.reference.user_prefix + profile.user_id];
        //         that.contacts.offline[CoreConfig.common.reference.user_prefix + profile.user_id] = profile;
        //     }
        // };

        this.watchForAvatarChange = function(user) {
            if (angular.isUndefined(that.fb.location.profiles)) {
                $log.debug('that.fb.location.state is undefined');
                return false;
            }
            that.fb.location.profiles.child(user).on('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var avatarObj = snapshot.val();
                if (avatarObj && avatarObj != 'false') {
                    var contact_tag = CoreConfig.common.reference.user_prefix + snapshot.key();
                    if (angular.isUndefined(that.contacts.profiles.map[contact_tag])) {
                        $log.debug('that.contacts.profiles is undefined');
                        return false;
                    }
                    if (angular.isDefined(that.contacts.profiles.map[contact_tag]) && that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]]) {
                        that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]].avatar = avatarObj.avatar;
                    }
                }
            });
        };



        this.watchForNewProfiles = function() {
            that.fb.location.profiles.startAt().on('child_added', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var profile = snapshot.val();
                // console.log('adding: ', profile);
                if (angular.isUndefined(profile.user_id) || profile.user_id === CoreConfig.user.id) {
                    return false;
                }
                that.setContactProfile(profile);
                if (CoreConfig.monitorContactsBehavior) {
                    that.monitorContactBehaviour(profile);
                }
            });
        };

        this.watchForRemovedProfiles = function() {
            that.fb.location.profiles.on('child_removed', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var profile = snapshot.val();
                // console.log('removing: ', profile);
                $timeout(function() {
                    // delete that.contacts.profiles[CoreConfig.common.reference.user_prefix + profile.user_id];
                    // delete that.contacts.offline[CoreConfig.common.reference.user_prefix + profile.user_id];
                    // delete that.contacts.online[CoreConfig.common.reference.user_prefix + profile.user_id];
                });
            });
        };

        this.storeOfflineQueue = function(user_id) {
            that.offline_queue[user_id] = true;
        };


        that.updateUsersListValueChange = function(profile) {
            if (profile === null || profile.state === null) {
                return false;
            }
            if (profile.online && profile['chat-presence'] != 'Offline') {
                that.setContactOnline(CoreConfig.common.reference.user_prefix  + profile.user_id);
            } else {
                that.setContactOffline(CoreConfig.common.reference.user_prefix  + profile.user_id);
            }
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
        return this;
    }
]);
