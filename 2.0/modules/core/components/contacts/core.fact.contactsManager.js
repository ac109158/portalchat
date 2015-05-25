angular.module('portalchat.core').
factory("ContactsManager", ['$rootScope', '$log', '$http', '$timeout', '$window', '$firebaseObject', '$firebaseArray', 'CoreConfig', 'CoreApi', 'UserManager', 'PermissionsManager',
    function($rootScope, $log, $http, $timeout, $window, $firebaseObject, $firebaseArray, CoreConfig, CoreApi, UserManager, PermissionsManager) {
        // Firebase.enableLogging(true);
        var that = this;


        this.page_loaded = false;

        this.contacts = {};
        this.contacts.smod = false;
        this.contacts.tod = false;

        this.contacts.profiles = {};
        this.contacts.profiles.list = [];
        this.contacts.profiles.map = {};

        this.fb = {};
        this.fb.location = {};
        this.offline_queue = {};

        this.load = function() {
            if (UserManager.user.profile.id) {
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
                if (user_profiles) {
                    angular.forEach(user_profiles, function(profile) {
                        that.setContactProfile(profile);
                    });
                    $timeout(function() {
                        that.fb.location.online.once('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                            var user_online_profiles = snapshot.val();
                            if (user_online_profiles) {
                                angular.forEach(user_online_profiles, function(status, key) {
                                    if (angular.isDefined(that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + key])) {
                                        that.contacts.profiles.list[that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + key]].online = status.online;
                                    }
                                });
                            }
                        });
                        that.fb.location.state.once('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                            var user_state_profiles = snapshot.val();
                            if (user_state_profiles) {
                                angular.forEach(user_state_profiles, function(status, key) {
                                    if (angular.isDefined(that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + key])) {
                                        that.contacts.profiles.list[that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + key]].state = status.state;
                                    }
                                });
                            }
                        });
                        that.fb.location.presence.once('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                            var user_presence_profiles = snapshot.val();
                            if (user_presence_profiles) {
                                angular.forEach(user_presence_profiles, function(presence, key) {
                                    if (angular.isDefined(that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + key])) {
                                        that.contacts.profiles.list[that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + key]].presence = presence;
                                    }
                                });
                            }
                        });
                    });
                }
            });
        };

        this.setAdditionalResources = function() {
            that.fb.location.public_settings.child('smod').on('value', function(snapshot) {
                var smod = snapshot.val();
                if (smod && smod.user) {
                    that.contacts.smod = that.contacts.profiles.list[that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + smod.user]];
                } else {
                    that.contacts.smod = false;
                }

            });

            that.fb.location.public_settings.child('tod').on('value', function(snapshot) {
                var tod = snapshot.val();
                if (tod && tod.user) {
                    that.contacts.tod = that.contacts.profiles.list[that.contacts.profiles.map[CoreConfig.common.reference.user_prefix + tod.user]];
                } else {
                    that.contacts.tod = false;
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
                if (angular.isUndefined(profile.user_id) || profile.user_id === UserManager.user.profile.id) {
                    return false;
                }
                if (profile.alias) {
                    profile.name = profile.alias;
                    delete profile.alias;
                }
                profile.first_name = profile.name.match(/\S+/g)[0];
                // profile.avatar_url = CoreConfig.url.avatar_path + profile.avatar + '-90.jpg';
                profile.avatar_url = CoreConfig.url.default_avatar;
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

        this.monitorContactsBehaviour = function() {
            that.watchForContactProfileChange();
            that.monitorContactsOnlineChange();
            that.monitorContactsStateChange();
            that.monitorContactsPresenceChange();
            return true;
        };

        this.monitorContactsOnlineChange = function() {
            that.fb.location.online.on('child_changed', function(child_snapshot, prev_child_snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                that.registerContactOnlineChange(CoreConfig.common.reference.user_prefix + child_snapshot.key(), child_snapshot.val().online);
            });
        };

        this.registerContactOnlineChange = function(contact_tag, online_status) {
            if (contact_tag != CoreConfig.common.reference.user_prefix + UserManager.user.profile.id) {
                if (online_status) {
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

        this.monitorContactsPresenceChange = function() {
            that.fb.location.presence.on('child_changed', function(child_snapshot, prev_child_snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                that.registerContactPresenceChange(CoreConfig.common.reference.user_prefix + child_snapshot.key(), child_snapshot.val());
            });
        };


        this.registerContactPresenceChange = function(contact_tag, presence) {
            console.log('registerContactPresenceChange: ', contact_tag, presence);
            if (contact_tag != CoreConfig.common.reference.user_prefix + UserManager.user.profile.id) {
                if (contact_tag && presence) {
                    if (angular.isDefined(that.contacts.profiles.map[contact_tag]) && that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]]) {
                        $rootScope.$evalAsync(function() {
                            that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]].presence = presence;
                        });
                    }
                }
            }
        };

        this.monitorContactsStateChange = function() {
            that.fb.location.state.on('child_changed', function(child_snapshot, prev_child_snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var state_snapshot = child_snapshot.val();
                var contact_tag = CoreConfig.common.reference.user_prefix + child_snapshot.key();
                if (angular.isUndefined(that.contacts.profiles.map[contact_tag])) {
                    $log.debug('that.contacts.profiles is undefined');
                    return false;
                }
                that.registerContactStateChange(contact_tag, state_snapshot.state);
            });
        };


        this.registerContactStateChange = function(contact_tag, state) {
            if (contact_tag != CoreConfig.common.reference.user_prefix + UserManager.user.profile.id) {
                if (contact_tag && state) {
                    if (angular.isDefined(that.contacts.profiles.map[contact_tag]) && that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]]) {
                        $rootScope.$evalAsync(function() {
                            that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]].state = state;
                        });
                    }
                }
            }
        };

        this.setContactOnline = function(contact_tag) {
            if (angular.isDefined(that.contacts.profiles.map[contact_tag]) && that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]]) {
                delete that.offline_queue[contact_tag];
                $rootScope.$evalAsync(function() {
                    that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]].online = true;
                });
            }
        };

        this.setContactOffline = function(contact_tag) {
            if (angular.isDefined(that.contacts.profiles.map[contact_tag]) && that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]]) {
                that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]].online = false;
            }
        };

        this.storeOfflineQueue = function(contact_tag) {
            that.offline_queue[contact_tag] = true;
        };

        this.isOfflineQueued = function(user_id) {
            if (that.offline_queue[user_id]) {
                return true;
            }
            return false;
        };

        this.watchForContactProfileChange = function(user) {
            that.fb.location.profiles.on('child_changed', function(child_snapshot, prev_child_snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var profile_snapshot = child_snapshot.val();
                var contact_tag = CoreConfig.common.reference.user_prefix + child_snapshot.key();
                if (angular.isDefined(that.contacts.profiles.map[contact_tag]) && that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]]) {
                    angular.forEach(profile_snapshot, function(value, key){
                        that.contacts.profiles.list[that.contacts.profiles.map[contact_tag]][key] = value;
                    });
                }
            });
        };



        this.watchForNewProfiles = function() {
            that.fb.location.profiles.startAt().on('child_added', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var profile = snapshot.val();
                if (angular.isUndefined(profile.user_id) || profile.user_id === UserManager.user.profile.id) {
                    return false;
                }
                that.setContactProfile(profile);
            });
        };

        this.watchForRemovedProfiles = function() {
            that.fb.location.profiles.on('child_removed', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
                var profile = snapshot.val();
                console.log('removing: ', profile);
            });
        };
        return this;
    }
]);
