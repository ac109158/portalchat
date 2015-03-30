angular.module('portalchat.core').
factory("UserManager", ['$rootScope', '$log', '$http', '$timeout', '$window', '$firebaseObject', 'CoreConfig', 'CoreApi', 'BrowserService','localStorageService', function($rootScope, $log, $http, $timeout, $window, $firebaseObject, CoreConfig, CoreApi, BrowserService, localStorageService) {
    // Firebase.enableLogging(true);
    var that = this;
    this.user_init = false;
    this.page_loaded = false;

    this.user = {}; // user domain

    this.profile = {};
    this.profile.main = {};
    this.profile.main.presence = {};
    this.profile.additional = {};
    this.profile.fb = {};

    this.settings = {};


    this.fb = {}; // firebase domain
    this.fb.location = {}; // location of values
    this.fb.target = {}; // specific value in a location .. uses $value

    this.stored = {};
    this.stored.presence = CoreConfig.default.presence;
    this.stored.state = undefined;

    this.load = function() {
        var promise = CoreApi.__getUser();
        promise.then(function(response) {
            if (response.status === 200 && angular.isObject(response.data)) {
                if (response.data.result) {
                    that.storeUser(response.data);
                    that.manageUser();
                }
            }
        }).finally(function(val) {
            if (that.user.id) {
                // console.log('We now have a user : ', that.user);
                return true;
            } else {
                $rootScope.broadcast('user-toast', {
                    type: 'error',
                    body: 'User does not exist!'
                });
                return false;
            }
        });
        return promise;

    };

    this.manageUser = function() {
        if (that.user.id) {
            that.setUserFirebaseLocations();
            that.setUserFirebaseTargets();
            that.setUserProfile();
            that.manageProfile();
            that.manageUserOnline();
            that.manageUserState();
            that.manageUserPresence();
            that.manageUserSupervisors();
            that.manageFireBaseConnection();
            CoreConfig.user = that.user;
            $rootScope.$broadcast('user-ready');
        }
    };

    this.storeUser = function(model) {
        that.user.id = model.user_id;
        that.user.name = model.name;
        that.user.role = model.role;
        that.user.position = model.position;
        that.user.avatar = model.avatar;
        that.user.email = model.email;
        that.user.phone = model.phone;
        that.user.encryption = model.encryption;
        that.user.supervisors = model.supervisors;
        that.user.ip = model.ip;
        that.user.office = model.office;
    };

    this.setUserProfile = function() {
        if (that.user.id) {
            that.profile.main.name = that.user.name || false;
            that.profile.main.user_id = that.user.id || false;
            that.profile.main.avatar = that.user.avatar || false;

            that.profile.main.presence.message = '';
            that.profile.main.presence.show_message = false;
            that.profile.main.presence.auto_post = false;

            that.profile.main.position = that.user.position || false;
            // that.profile.main.ip = sjcl.encrypt(CoreConfig.encrypt_pass, that.user.ip) || false;
            that.profile.main.ip = that.user.ip || false;

            if (that.user.role) {
                that.profile.additional.role = that.profile.main.role = that.user.role || false;
            }
            if (that.user.office === false) {
                that.getCityState(that.user.ip, that.profile.additional, 2);
            } else {
                that.getCityState(that.user, that.profile.additional, 3);
            }
            that.profile.main.email = that.user.email || false;
            that.profile.main.phone = that.user.phone || false;
            that.profile.main.pc = angular.copy(that.user.supervisors.pc) || false;
            that.profile.main.mc = angular.copy(that.user.supervisors.mc) || false;
            that.profile.main.admin = angular.copy(that.user.supervisors.admin) || false;

            that.profile.additional.office = that.user.office;
            that.profile.additional.phone = that.profile.main.phone;
            that.profile.additional.email = that.profile.main.email;
            that.profile.additional.pc = that.profile.main.pc;
            that.profile.additional.mc = that.profile.main.mc;

            that.profile.fb.user_id = that.profile.main.user_id;
            that.profile.fb.avatar = that.profile.main.avatar;
            that.profile.fb.name = that.profile.main.name;
        }
    };

    this.setUserFirebaseLocations = function() {
        that.fb.location.fb_connection = new Firebase(CoreConfig.fb_url + ".info/connected");
        if (that.user.id) {
            that.fb.location.profile = new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_profile_reference + that.user.id + '/');
            that.fb.location.additional_profile = new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_additional_profile_reference + that.user.id + '/');
            that.fb.location.settings = new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_settings_reference + that.user.id + '/');
            that.fb.location.online = new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_online_reference + that.user.id + '/');
            that.fb.location.state = new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_state_reference + that.user.id + '/');
            that.fb.location.presence = new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_presence_reference + that.user.id + '/');
        }
    };

    this.setUserFirebaseTargets = function() {
        if (that.user.id) {
            that.fb.target.presence = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_presence_reference + that.user.id + '/chat-presence'));
            return true;
        }
        return false;
    };

    this.manageFireBaseConnection = function() {
        that.fb.location.fb_connection.on("value", function(snap) {
            if (snap.val()) {
                that.firebase_connection = true;
                // scope.firebase_connection = true;
                $timeout(function() {
                    /*                              that.fb.location.profile.update(that.User); */
                    that.fb.location.online.update({
                        'online': true
                    });
                    that.fb.location.state.update({
                        'state': 'Idle'
                    });
                    // Remove ourselves when we disconnect.
                    /*                              that.fb.location.profile.onDisconnect().update(that.User); */
                    that.fb.location.online.onDisconnect().update({
                        'online': false
                    });
                    that.fb.location.state.onDisconnect().update({
                        'state': 'Offline'
                    }); /*                           clearInterval(set_presence); */
                }, 1000);
            } else {
                that.firebase_connection = false;
                // scope.firebase_connection = false;
                that.fb.location.online.onDisconnect().update({
                    'online': false
                });
                that.fb.location.state.onDisconnect().update({
                    'state': 'Offline'
                });
            }
        });
    };

    this.manageUserOnline = function() {
        that.fb.location.online.on('value', function(snapshot) {
            var online_value = snapshot.val();
            if (!online_value) {
                return false;
            }
            if (online_value.online === false && that.fb.target.presence.$value != 'Offline') {
                /*                              console.log('hey, im still online, yo'); */
                that.fb.location.online.update({
                    'online': true
                });
            } else if (online_value.online === false && that.fb.target.presence.$value === 'Offline') {
                that.fb.location.presence.update({
                    'chat-presence': 'Offline'
                });
                that.user_stored_online = false;
            } else {
                that.user_stored_online = true;
            }
        });

    };

    this.manageUserState = function() {
        that.fb.location.state.child('state').on('value', function(snapshot) {
            var user_state = snapshot.val();
            if (user_state === 'Offline' && that.fb.target.presence && that.fb.target.presence.$value != 'Offline') {
                // console.log('hey, im still have  a state, yo');
                that.fb.location.state.update({
                    'state': that.stored.state
                });
            } else {
                that.stored.state = user_state;
            }
        });

        that.fb.location.state.child('state').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.fb.location.state.update({
                    'state': 'Idle'
                });
            }
        });
    };

    this.manageUserPresence = function() {
        that.fb.location.presence.child('chat-presence').once('value', function(snapshot) { // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
            var presence = snapshot.val(); // store decrypted snap shot object
            if (CoreConfig.force_online) {
                $rootScope.$broadcast('chat_presence_change', CoreConfig.default.presence);
            } else if (angular.isUndefined(presence) || presence === null || presence === '') {
                that.fb.location.presence.update({
                    'chat-presence': CoreConfig.default.presence
                });
                $rootScope.$broadcast('chat_presence_change', CoreConfig.default.presence);
            } else {
                that.fb.location.presence.update({
                    'chat-presence': presence
                });
                $rootScope.$broadcast('chat_presence_change', presence);
            }
        });

        that.fb.location.presence.child('message').once('value', function(snapshot) {
            var message = snapshot.val();
            if (message) {
                that.profile.main.presence.message = message;
            }
        });

        that.fb.location.presence.child('show-message').once('value', function(snapshot) {
            var bool = snapshot.val();
            if (angular.isDefined(bool)) {
                that.profile.main.presence.show_message = bool;
            }
        });

        that.fb.location.presence.child('auto-post').once('value', function(snapshot) {
            var bool = snapshot.val();
            if (angular.isDefined(bool)) {
                that.profile.main.presence.auto_post = bool;
            }
        });

        that.fb.location.presence.child('chat-presence').on('value', function(snapshot) {
            var presence = snapshot.val();

            if (presence !== 'Offline') {
                that.fb.location.online.update({
                    'online': true
                });
                that.fb.location.state.update({
                    'state': 'Idle'
                });
            }
            if (presence === 'Offline' && that.stored.presence != 'Offline') {
                // console.log('Hey, I still have chat presence, you');
                that.fb.location.presence.update({
                    'chat-presence': that.stored.presence
                });
            } else if (presence === 'Offline' && that.stored.presence === 'Offline') {
                that.fb.location.online.update({
                    'online': false
                });
            } else {
                that.stored.presence = presence;
            }
            $rootScope.$broadcast('chat_presence_change', presence);
        });


    };

    this.manageUserSupervisors = function() {
        if (that.user.id && that.user.supervisors) {
            if (that.user.supervisors.pc) {
                that.fb.locations.pc_online = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + that.users_online_reference + that.user.supervisors.pc.user_id + that.online_reference));
                that.fb.locations.pc_presence = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + that.user_presence_reference + that.user.supervisors.pc.user_id + '/' + that.chat_presence_reference));
                that.fb.target.pc_state = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_state_reference + that.user.supervisors.pc.user_id + that.state_reference));
            }
            that.user.mc = that.user.supervisors.mc;
            if (that.user.supervisors.mc) {
                if (that.user.supervisors.mc.name.slice(0, 4) != 'Ramp') {
                    that.fb.locations.mc_online = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + that.users_online_reference + that.user.supervisors.mc.user_id + that.online_reference));
                    that.fb.locations.mc_presence = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + that.user_presence_reference + that.user.supervisors.mc.user_id + '/' + that.chat_presence_reference));
                    that.fb.target.mc_state = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_state_reference + that.user.supervisors.mc.user_id + that.state_reference));
                }
            }
            that.user.admin = that.user.supervisors.admin;
            if (that.user.supervisors.admin) {
                that.fb.locations.admin_online = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + that.users_online_reference + that.user.supervisors.admin.user_id + that.online_reference));
                that.fb.locations.admin_presence = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + that.user_presence_reference + that.user.supervisors.admin.user_id + '/' + that.chat_presence_reference));
                that.fb.targets.admin_state = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_state_reference + that.user.supervisors.admin.user_id + that.state_reference));
            }
            if (that.user.isSupervisor === true) {
                that.user.isSupervisor = true;
                that.isSupervisor = true;
                that.user.teamMargin = 35;
            } else {
                that.isSupervisor = false;
                that.user.isSupervisor = false;
            }
        }
    };

    this.manageProfile = function() {
        window.onbeforeunload = function() {
            localStorageService.remove('isExternalWindow');
            that.fb.location.additional_profile.update({
                'checkOutTime': Firebase.ServerValue.TIMESTAMP
            });
        };
        that.fb.location.profile.update(that.profile.fb);
        that.fb.location.additional_profile.update(that.profile.additional);
        that.fb.location.additional_profile.child('platform').update(BrowserService.platform);
        that.fb.location.additional_profile.child('platform').update({
            'ip': that.profile.main.ip
        });

        that.fb.location.additional_profile.child('checkOutTime').once('value', function(snapshot) {
            var lastCheckOut = snapshot.val();
            if (lastCheckOut) {
                if (lastCheckOut + 100000 < new Date().getTime()) {
                    $log.debug((lastCheckOut + 100000) + ' > ' + new Date().getTime());
                    that.fb.location.additional_profile.update({
                        'checkInTime': Firebase.ServerValue.TIMESTAMP
                    });
                } else {
                    $log.debug('last check out was too recent to update new check in time');
                }
            } else {
                that.fb.location.additional_profile.update({
                    'checkInTime': Firebase.ServerValue.TIMESTAMP
                });
            }
        });

        that.fb.location.additional_profile.update({
            'checkInTime': Firebase.ServerValue.TIMESTAMP
        });
    };

    this.setPresence = function(presence) {
        if (presence) {
            that.clearPresenceOptions();
            that.storeChatPresence(presence);
            that.fb.location.presence.update({
                'chat-presence': presence
            });
            if (presence == 'Offline') {
                that.storeUserOnline(false);
                $timeout(function() {
                    that.fb.location.online.update({
                        'online': false
                    });
                }, 1000);
            } else {
                that.storeUserOnline(true);
                $timeout(function() {
                    that.fb.location.online.update({
                        'online': true
                    });
                }, 1000);
            }
        }
    };


    this.updatePresenceMessage = function() {
        if (!that.profile.main.presence.message) {
            that.profile.main.presence.message_show = false;
            that.updatePresenceMessageShow();
            that.profile.main.presence.auto_post = false;
            that.updatePresenceMessagePost();
        }
        that.fb.location.presence.update({
            message: that.profile.main.presence.message
        });
    };

    this.clearPresenceOptions = function() {
        that.profile.main.presence.message = '';
        that.updatePresenceMessage();
        that.profile.main.presence.show_message = false;
        that.updatePresenceMessageShow();
        that.profile.main.presence.auto_post = false;
        that.updatePresenceMessagePost();

    };

    this.updatePresenceMessageShow = function() {
        $log.debug('updatePresenceMessageShow');
        if (angular.isDefined(that.profile.main.presence.show_message)) {
            that.fb.location.presence.update({
                'show-message': that.profile.main.presence.show_message
            });
        }
    };

    this.updatePresenceMessagePost = function() {
        $log.debug('updatePresenceMessageShowPost');
        if (angular.isDefined(that.profile.main.presence.auto_post)) {
            that.fb.location.presence.update({
                'auto-post': that.profile.main.presence.auto_post
            });
        }
    };


    this.storeChatPresence = function(presence) {
        if (presence) {
            that.stored.presence = presence;
        }
    };
    this.storeUserOnline = function(online) {
        if (angular.isDefined(online)) {
            that.stored.presence = online;
        }
    };

    this.setChatPresenceforUser = function(user_key) {
        return $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_presence_reference + user_key + '/' + that.chat_presence_reference + '/'));
    };
    this.setProfileOnlineLocationforUser = function(user_key) {
        return $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + that.users_online_reference + user_key + '/' + that.online_reference));
    };


    this.getUserArray = function() {
        that.user_array = Array();
        angular.forEach(that.users_profiles_obj, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
            this.push(value);
        }, that.user_array);
        return that.user_array;
    };

    this.updateState = function(state) {
        // console.log('update state being called with ' + state);
        if (angular.isDefined(that.fb.location.profile)) {
            if (that.fb.target.presence && that.fb.target.presence.$value != 'Offline') {
                that.fb.location.state.update({
                    'state': state
                });
            } else {
                // console.log('update state was denied');
            }
        }
    };

    this.getUserField = function(field) {
        if (field && that.user[field]) {
            return that.user[field];
        }
        return false;
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

    this.setGeolocation = function(user) {
        function updatePosition(pos) {
            that.users_geolocation_location.child(user).update({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            });
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(updatePosition);
        } else {
            that.users_geolocation_location.child(user).update({
                lat: false,
                lng: false
            });
            $log.debug("Geolocation is not supported by this browser.");
        }

    };

    this.getCityState = function(ip, store, option) {
        if (option === 1) {
            $http({
                method: 'GET',
                contentType: 'application/json',
                dataType: 'json',
                cache: true,
                url: 'http://freegeoip.net/json/' + ip,
            }).
            success(function(response) {
                /*
                                delete location.lat
                                delete location.lng;
                */
                /*              console.log(response.results[0]['address_components']); */
                store.lat = response.latitude;
                store.lng = response.longitude;
                store.city = response.city;
                store.state = response.region_code;
                if (store.city === 'Colorado City') {
                    store.city = 'Hildale';
                    store.state = 'Ut';
                }


            }).
            error(function(response) {
                var codeStatus = response || "Request failed";
            });
        } else if (option === 2) {
            $http({
                method: 'GET',
                contentType: 'application/json',
                dataType: 'json',
                cache: true,
                url: 'http://ipinfo.io/' + ip + '/json',
            }).
            success(function(response) {
                /*
                                delete location.lat
                                delete location.lng;
                */
                /*              console.log(response.results[0]['address_components']); */

                store.lat = response.loc.split(',')[0];
                store.lng = response.loc.split(',')[1];
                store.city = response.city;
                store.state = response.region;
                if (store.city === 'Colorado City') {
                    store.city = 'Hildale';
                    store.state = 'Ut';
                }
                store.isp = response.org;


            }).
            error(function(response) {
                var codeStatus = response || "Request failed";
            });
        } else if (option === 3) {
            store.lat = ip.location.lat;
            store.lng = ip.location.lng;
            store.city = ip.location.city;
            store.state = ip.location.region;
        }

    };

    return this;
}]);
