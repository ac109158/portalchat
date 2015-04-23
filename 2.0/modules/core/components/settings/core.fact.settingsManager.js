angular.module('portalchat.core').
service('SettingsManager', ['$rootScope', '$log', '$timeout', '$window', 'CoreConfig', '$firebaseObject', 'localStorageService', 'NotificationManager', 'UserManager', function($rootScope, $log, $timeout, $window, CoreConfig, $firebaseObject, localStorageService, NotificationManager, UserManager) {
    var that = this;


    this.module = {};
    this.module.is_external_window = false;
    this.module.is_external_window_instance = false;
    this.module.is_open = false;
    this.module.layout = 1;
    this.module.font_size = 12;
    this.module.panel_vertical_adjust = 0;
    this.module.panel_vertical_adjust_2 = 0;
    this.module.panel_width_adjust = 0;
    this.module.show_external_notifications = false;
    this.module.sound_level = 2;
    this.module.last_contact_chat = false;
    this.module.last_directory_chat = false;
    this.module.is_window_visible = true;

    this.fb = {}; // firebase domain
    this.fb.location = {}; // location of values
    this.fb.target = {}; // specific value in a location .. uses $value


    this.load = function() {
        if (UserManager.user.id) {
            that.setFirebaseLocations();
            that.setFirebaseTargets();
            $timeout(function() {
                that.setExternalWindow();
                that.setFirebaseSettings();
                that.addUnloadListener();

            });

            return true;
        }
        return false;
    };

    this.addUnloadListener = function() {
        $window.onbeforeunload = function(e) {
            that.fb.location.settings.update(that.module);
        };
    };

    this.setFirebaseLocations = function() {
        if (UserManager.user.id) {
            console.log(CoreConfig.fb_url + CoreConfig.users.reference + CoreConfig.users.settings_reference + UserManager.user.id + '/');
            that.fb.location.settings = new Firebase(CoreConfig.fb_url + CoreConfig.users.reference + CoreConfig.users.settings_reference + UserManager.user.id + '/');
        }
    };

    this.setFirebaseTargets = function() {
        if (UserManager.user.id) {
            // that.fb.target.is_external_window = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users.reference + CoreConfig.users.settings_reference + CoreConfig.user.id + '/is-external-window/'));
            that.fb.target.is_module_open = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users.reference + CoreConfig.users.settings_reference + UserManager.user.id + '/module-open/'));
            return true;
        }
        return false;
    };

    this.setExternalWindow = function() {
        if (String(window.location.href).split('?')[1] === String(CoreConfig.ext_link).split('?')[1]) {
            that.module.is_external_window_instance = true;
            that.module.is_open = true;
            that.fb.location.settings.update({
                'is_external_window': true
            });
            that.module.is_external_window = true;
        } else {
            that.module.is_external_window = false;
        }
        that.fb.location.settings.child('/external_window_activate/').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.fb.location.settings.update({
                    'external_window_activate': false
                });
            }
        });

        that.fb.location.settings.child('is_external_window').on('value', function(snapshot) {
            if (snapshot.val()) {
                that.module.is_external_window = true;
                $rootScope.$broadcast('setting-change', {
                    is_external_window: true
                });
            } else {
                that.module.is_external_window = false;
                $rootScope.$broadcast('close-external-window');
                $rootScope.$broadcast('setting-change', {
                    is_external_window: false
                });
            }
        });


        if (that.module.is_external_window) {
            localStorageService.add('is_external_window', true);
            that.fb.location.settings.onDisconnect().update({
                'is_external_window': false
            });

        } else {
            window.onbeforeunload = function() {
                if (that.session.id === localStorageService.get('is_existing_chat')) {
                    localStorageService.remove('is_existing_chat');
                }
                $rootScope.$broadcast('clear-notifications');
            };
        }

        that.fb.location.settings.child('/external_window_activate/').on('value', function(snapshot) {
            if (snapshot.val()) {
                if (that.module.is_external_window === true && that.module.is_external_window_instance === true) {
                    $timeout(function() {
                        self.focus();
                    });
                    $rootScope.$broadcast('activate-external-window');
                }
            }
            $timeout(function() {
                that.fb.location.settings.update({
                    'external_window_activate': false
                });
            }, 3000);
        });
        $log.debug(String(window.location.href).split('?')[1] + '  : ' + String(CoreConfig.ext_link).split('?')[1]);
    };

    this.setFirebaseSettings = function() {
        that.fb.location.settings.child('is_open').once('value', function(snapshot) {
            var open = snapshot.val();
            if (open || angular.isUndefined(open)) {
                that.module.is_open = true;
                $rootScope.$broadcast('setting-change', {
                    is_open: true
                });
            } else {
                that.module.is_open = false;
                $rootScope.$broadcast('setting-change', {
                    is_open: false
                });
            }
        });

        that.fb.location.settings.child('layout').once('value', function(snapshot) {
            var layout = snapshot.val();
            if (layout) {
                that.module.layout = layout;
            } else {
                that.module.layout = CoreConfig.default.layout;
            }
        });

        that.fb.location.settings.child('font_size').once('value', function(snapshot) {
            var font = snapshot.val();
            if (font) {
                that.module.font_size = parseInt(font, 10);
            } else {
                that.module.font_size = CoreConfig.default.font_size;
            }
        });

        that.fb.location.settings.child('panel_vertical_adjust').once('value', function(snapshot) {
            var panel_vertical_adjust = snapshot.val();
            if (panel_vertical_adjust) {
                that.module.panel_vertical_adjust = parseInt(panel_vertical_adjust);
            } else {
                that.module.panel_vertical_adjust = 0;
            }
        });
        that.fb.location.settings.child('panel_width_adjust').once('value', function(snapshot) {
            var panel_width_adjust = snapshot.val();
            if (panel_width_adjust) {
                that.module.panel_width_adjust = parseInt(panel_width_adjust, 10);
            } else {
                that.module.panel_width_adjust = 0;
            }
        });

        that.fb.location.settings.child('panel_vertical_adjust_2').once('value', function(snapshot) {
            var panel_vertical_adjust_2 = snapshot.val();
            if (panel_vertical_adjust_2) {
                that.module.panel_vertical_adjust_2 = parseInt(panel_vertical_adjust_2, 10);
            } else {
                that.module.panel_vertical_adjust_2 = 0;
            }
        });

        that.fb.location.settings.child('show_external_notifications').once('value', function(snapshot) {
            var show_external_notifications = snapshot.val();
            if (angular.isDefined(show_external_notifications)) {
                that.module.show_external_notifications = show_external_notifications;
            } else {
                that.module.show_external_notifications = false;
            }
        });
        that.fb.location.settings.child('is_external_window').once('value', function(snapshot) {
            var is_external_window = snapshot.val();
            if (angular.isDefined(is_external_window)) {
                that.module.is_external_window = is_external_window;

            } else {
                that.module.is_external_window = false;
            }
        });

        that.fb.location.settings.child('last_contact_chat').once('value', function(snapshot) {
            that.module.last_contact_chat = snapshot.val();
        });

        that.fb.location.settings.child('last_directory_chat').once('value', function(snapshot) {
            that.module.last_directory_chat = snapshot.val();
        });


        that.fb.location.settings.child('sound_level').once('value', function(snapshot) {
            var sound_level = snapshot.val();
            if (angular.isDefined(sound_level)) {
                that.module.sound_level = sound_level;
            } else {
                that.module.sound_level = CoreConfig.default.sound_level;
            }
            if (that.module.sound_level) {
                NotificationManager.updateSoundLevel(that.module.sound_level);
            }
        });

    };

    this.activateExternalWindow = function() {
        that.fb.location.settings.update({
            'external_window_activate': true
        });
    };

    this.update = function(setting, value, firebase) {
        if (angular.isDefined(that.module[setting]) && angular.isDefined(value)) {
            that.module[setting] = value;
        }
        if (firebase) {
            that.fb.location.settings.update(that.module);
        }
    };

    this.detectLayout = function() { /*      console.log('detecting layout'); */
        if ($window.innerHeight > 900) {
            return 3;
        } else if ($window.innerHeight > 700) {
            return 1;
        } else {
            return 2;
        }
    };




    return this;
}]);
