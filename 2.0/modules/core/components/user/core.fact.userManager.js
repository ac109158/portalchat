angular.module('portalchat.core').
factory("UserManager", ['$rootScope', '$log', '$http', '$timeout', '$window', '$firebaseObject', 'CoreConfig', 'CoreApi', 'BrowserService', 'localStorageService', function($rootScope, $log, $http, $timeout, $window, $firebaseObject, CoreConfig, CoreApi, BrowserService, localStorageService) {
    // Firebase.enableLogging(true);
    var that = this;
    this.user_init = false;
    this.page_loaded = false;

    this.user = {}; // user domain
    this.user.group = [];
    this.user.profile = {};
    this.user.additional_profile = {};

    this.settings = {};


    this.fb = {}; // firebase domain
    this.fb.location = {}; // location of values
    this.fb.target = {}; // specific value in a location .. uses $value

    this.load = function() {
        var promise = CoreApi.__getUser();
        promise.then(function(response) {
            if (response.status === 200 && angular.isObject(response.data)) {
                if (response.data.result) {
                    that.setUserProfile(response.data);
                    that.manageUser();
                }
            }
        }).finally(function(val) {
            if (that.user.profile.id) {
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
        if (that.user.profile.id) {
            that.setUserFirebaseLocations();
            that.setUserFirebaseTargets();
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

    this.setUserProfile = function(model) {
        that.user.profile.id = model.user_id;
        that.user.profile.name = model.name;
        that.user.profile.avatar = model.avatar || false;

        that.user.profile.online = false;
        that.user.profile.state = "Offline";

        that.user.profile.presence = {};
        that.user.profile.presence.state = CoreConfig.inital.presence;
        that.user.profile.presence.message = '';
        that.user.profile.presence.show_message = false;
        that.user.profile.presence.post = false;

        that.user.additional_profile.position = model.position;
        // that.user.profile.ip = sjcl.encrypt(CoreConfig.encrypt_pass, that.user.ip) || false;
        that.user.additional_profile.encryption = model.encryption;
        that.user.additional_profile.ip = model.ip;
        that.user.additional_profile.role = model.role;
        that.user.additional_profile.office = model.office;

        if (model.office === false) {
            that.getCityState(model.ip, 2);
        } else {
            that.user.additional_profile.lat = model.ip.location.lat;
            that.user.additional_profile.lng = model.ip.location.lng;
            that.user.additional_profile.city = model.ip.location.city;
            that.user.additional_profile.state = model.ip.location.region;
        }
        that.user.additional_profile.email = model.email;
        that.user.additional_profile.phone = model.phone;
        that.user.additional_profile.pc = angular.copy(model.supervisors.pc) || false;
        that.user.additional_profile.mc = angular.copy(model.supervisors.mc) || false;
        if (that.user.additional_profile.mc && that.user.additional_profile.mc.name) {
            that.user.additional_profile.mc = that.user.additional_profile.mc.replace('*', '');
        }
        that.user.additional_profile.admin = angular.copy(model.supervisors.admin) || false;
    };

    this.setUserFirebaseLocations = function() {
        that.fb.location.fb_connection = new Firebase(CoreConfig.url.firebase_database + ".info/connected");
        if (that.user.profile.id) {
            that.fb.location.profile = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.profile_reference + that.user.profile.id + '/');
            that.fb.location.additional_profile = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.additional_profile_reference + that.user.profile.id + '/');
            // that.fb.location.settings = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.settings_reference + that.user.profile.id + '/');
            that.fb.location.online = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.online_reference + that.user.profile.id + '/');
            that.fb.location.state = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.state_reference + that.user.profile.id + '/');
            that.fb.location.presence = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.presence_reference + that.user.profile.id + '/');
        }
    };

    this.setUserFirebaseTargets = function() {
        if (that.user.profile.id) {
            // that.fb.target.presence = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.presence_reference + that.user.profile.id + '/chat_presence'));
            // that.fb.target.online = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.online_reference + that.user.profile.id + '/' + CoreConfig.online_reference));
            return true;
        }
        return false;
    };

    this.manageFireBaseConnection = function() {
        that.fb.location.fb_connection.on("value", function(snap) {
            if (snap.val()) {
                that.firebase_connection = true;
                // scope.firebase_connection = true;
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
            if (online_value.online === false && that.user.profile.presence.state != 'Offline') {
                /*                              console.log('hey, im still online, yo'); */
                that.fb.location.online.update({
                    'online': true
                });
            } else if (online_value.online === false && that.user.profile.presence.state === 'Offline') {
                that.fb.location.presence.update({
                    'state': 'Offline'
                });
                that.user.profile.online = false;
            } else {
                that.user.profile.online = true;
            }
        });

    };

    this.manageUserState = function() {
        that.fb.location.state.child('state').on('value', function(snapshot) {
            var user_state = snapshot.val();
            if (user_state === 'Offline' && that.fb.target.presence && that.user.profile.presence.state != 'Offline') {
                // console.log('hey, im still have  a state, yo');
                that.fb.location.state.update({
                    'state': that.user.profile.state
                });
            } else {
                that.user.profile.state = user_state;
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
        that.fb.location.presence.on('value', function(snapshot) {
            var presence = snapshot.val();
            console.log('presence: ', presence);
            if (presence && presence.state) {
                if (presence.state !== 'Offline') {
                    that.fb.location.online.update({
                        'online': true
                    });
                    that.fb.location.state.update({
                        'state': 'Idle'
                    });
                }
                if (presence.state === 'Offline' && that.user.profile.presence.state != 'Offline') {
                    // console.log('Hey, I still have chat presence, you');
                    that.fb.location.presence.update(that.user.profile.presence);
                } else {
                    if (presence.state === 'Offline' && that.user.profile.presence.state === 'Offline') {
                        that.fb.location.online.update({
                            'online': false
                        });
                    }
                    that.user.profile.presence = presence;
                }
            } else {
                that.fb.location.presence.update(that.user.profile.presence);
            }
        });

    };

    this.manageUserSupervisors = function() {
        that.user.group = {};
        that.user.group[that.user.profile.id] = that.user.name;
        if (that.user.profile.id && that.user.additional_profile) {
            if (that.user.additional_profile.pc) {
                that.user.group[that.user.additional_profile.pc.user_id] = that.user.additional_profile.pc.name;
            }
            if (that.user.additional_profile.mc) {
                that.user.group[that.user.additional_profile.mc.user_id] = that.user.additional_profile.mc.name;
            }
            if (that.user.additional_profile.admin) {}
        }
    };

    this.manageProfile = function() {
        window.onbeforeunload = function() {
            localStorageService.remove('is_external_window');
            that.fb.location.additional_profile.update({
                'checkOutTime': Firebase.ServerValue.TIMESTAMP
            });
            that.fb.location.presence.update({
                'state': 'Offline'
            });
            that.fb.location.online.onDisconnect().update({
                'online': false
            });
        };
        that.fb.location.profile.update({
            user_id: that.user.profile.id,
            avatar: that.user.profile.avatar,
            name: that.user.profile.name
        });
        that.fb.location.additional_profile.update(that.user.additional_profile);
        that.fb.location.additional_profile.child('platform').update(BrowserService.platform);
        that.fb.location.additional_profile.child('platform').update({
            'ip': that.user.additional_profile.ip
        });

        that.fb.location.online.update({
            'online': true
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

    this.setUserChatPresence = function(clear) {
        if (that.user.profile.presence.state) {
            if (clear) {
                that.clearPresenceOptions();
            }
            that.fb.location.presence.update(that.user.profile.presence);
            if (that.user.profile.presence.state == 'Offline') {
                that.user.profile.online = false;
                $timeout(function() {
                    that.fb.location.online.update({
                        'online': false
                    });
                }, 1000);
            } else {
                that.user.profile.online = true;
                $timeout(function() {
                    that.fb.location.online.update({
                        'online': true
                    });
                }, 1000);
            }
        }
    };


    this.clearPresenceOptions = function() {
        that.user.profile.presence.message = '';
        that.user.profile.presence.show_message = false;
        that.user.profile.presence.post = false;
        that.fb.location.presence.update(that.user.profile.presence);

    };

    this.updateState = function(state) {
        // console.log('update state being called with ' + state);
        if (angular.isDefined(that.fb.location.profile)) {
            if (that.fb.target.presence && that.user.profile.presence.state != 'Offline') {
                that.fb.location.state.update({
                    'state': state
                });
            }
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

    this.getCityState = function(ip, option) {
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
                that.user.additional_profile.lat = response.latitude;
                that.user.additional_profile.lng = response.longitude;
                that.user.additional_profile.city = response.city;
                that.user.additional_profile.state = response.region_code;
                if (that.user.additional_profile.city === 'Colorado City') {
                    that.user.additional_profile.city = 'Hildale';
                    that.user.additional_profile.state = 'Ut';
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

                that.user.additional_profile.lat = response.loc.split(',')[0];
                that.user.additional_profile.lng = response.loc.split(',')[1];
                that.user.additional_profile.city = response.city;
                that.user.additional_profile.state = response.region;
                if (that.user.additional_profile.city === 'Colorado City') {
                    that.user.additional_profile.city = 'Hildale';
                    that.user.additional_profile.state = 'Ut';
                }
                that.user.additional_profile.isp = response.org;


            }).
            error(function(response) {
                var codeStatus = response || "Request failed";
            });
        }

    };


    this.setUserOnline = function(online_value) {
        if (online_value) {
            that.fb.location.profile.update({
                'online': online,
                'state': 'Idle'
            });

        } else {
            that.fb.location.profile.update({
                'Online': false,
                'state': 'Offline'
            });
        }
    };

    return this;
}]);
