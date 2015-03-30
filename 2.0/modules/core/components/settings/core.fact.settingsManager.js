angular.module('portalchat.core').
service('SettingsManager', ['$rootScope', '$log','$timeout','$window', 'CoreConfig', '$firebaseObject', 'localStorageService', 'NotificationManager', function($rootScope, $log, $timeout, $window, CoreConfig, $firebaseObject, localStorageService, NotificationManager) {
    var that = this;

    this.settings = {};
    this.settings.isExternalInstance = undefined;
    this.settings.layout = undefined;
    this.settings.font_size = undefined;
    this.settings.vertical_adjust = undefined;
    this.settings.vertical_adjust_2 = undefined;
    this.settings.width_adjust = undefined;
    this.settings.external_monitor = undefined;
    this.settings.sound_level = undefined;

    this.fb = {}; // firebase domain
    this.fb.location = {}; // location of values
    this.fb.target = {}; // specific value in a location .. uses $value


    this.load = function() {
        if (CoreConfig.user.id) {
            that.setFirebaseLocations();
            that.setFirebaseTargets();
            $timeout(function() {
                that.setExternalWindow();
                that.manageUserSettings();
            });
            return true;
        }
        return false;
    };

    this.setFirebaseLocations = function() {
        if (CoreConfig.user.id) {
            that.fb.location.settings = new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_settings_reference + CoreConfig.user.id + '/');
        }
    };

    this.setFirebaseTargets = function() {
        if (CoreConfig.user.id) {
            that.fb.target.is_external_window = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_settings_reference + CoreConfig.user.id + '/is-external-window/'));
            that.fb.target.is_panel_open = $firebaseObject(new Firebase(CoreConfig.fb_url + CoreConfig.users_reference + CoreConfig.users_settings_reference + CoreConfig.user.id + '/module-open/'));
            return true;
        }
        return false;
    };

    this.setExternalWindow = function() {
        if (String(window.location.href).split('?')[1] === String(CoreConfig.ext_link).split('?')[1]) {
            that.settings.isExternalWindow = true;
            that.fb.location.settings.update({
                'is-external-window': true
            });
            that.settings.isExternalInstance = true;
        } else {
            that.settings.isExternalInstance = false;
        }
        that.fb.location.settings.child('/external-window-activate/').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.fb.location.settings.update({
                    'external-window-activate': false
                });
            }
        });

        if (that.settings.isExternalInstance) {
            localStorageService.add('isExternalWindow', true);
            that.fb.location.settings.onDisconnect().update({
                'is-external-window': false
            });
            that.fb.location.settings.child('is-external-window').on('value', function(snapshot) {
                if (snapshot.val()) {} else {
                    $rootScope.$broadcast('closeExternalWindow');
                }
            });

        } else {
            window.onbeforeunload = function() {
                if (that.session.id === localStorageService.get('isExistingChat')) {
                    localStorageService.remove('isExistingChat');
                }
                $rootScope.$broadcast('clear_notifications');
            };
        }

        that.fb.location.settings.child('/external-window-activate/').on('value', function(snapshot) {
            if (snapshot.val()) {
                if (that.settings.isExternalWindow === true && that.settings.isExternalInstance === true) {
                    $timeout(function() {
                        self.focus();
                    });
                    $rootScope.$broadcast('activateExternalWindow');
                }
            }
            $timeout(function() {
                that.fb.location.settings.update({
                    'external-window-activate': false
                });
            }, 3000);
        });
        $log.debug(String(window.location.href).split('?')[1] + '  : ' + String(CoreConfig.ext_link).split('?')[1]);
    };

    this.manageUserSettings = function() {
        that.fb.location.settings.child('layout').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.settings.layout = CoreConfig.default.layout;
            } else {
                that.settings.layout = snapshot.val();
            }
        });

        that.fb.location.settings.child('font-size').once('value', function(snapshot) {
            var font = snapshot.val();
            if (font) {
                that.settings.font_size = font;
            } else {
                that.settings.font_size = CoreConfig.default.font_size;
            }
        });

        that.fb.location.settings.child('vertical-adjust').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.settings.vertical_adjust = 0;
            } else {
                that.settings.vertical_adjust = parseInt(snapshot.val());
            }
        });

        that.fb.location.settings.child('vertical-adjust-2').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.settings.vertical_adjust_2 = 0;
            } else {
                that.settings.vertical_adjust_2 = parseInt(snapshot.val());
            }
        });

        that.fb.location.settings.child('width-adjust').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.settings.width_adjust = 0;
            } else {
                that.settings.width_adjust = snapshot.val();
            }
        });

        that.fb.location.settings.child('external-monitor').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.settings.external_monitor = false;
            } else {
                that.settings.external_monitor = snapshot.val();
            }
        });
        that.fb.location.settings.child('is-external-window').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.fb.location.settings.update({
                    'is-external-window': false
                });
            }
        });

        that.fb.location.settings.child('/sound-level/').once('value', function(snapshot) {
            if (snapshot.val() === null) {
                that.settings.sound_level = CoreConfig.default.sound_level;
                that.fb.location.settings.update({
                    'sound-level': parseInt(that.settings.sound_level)
                });
            } else {
                that.settings.sound_level = snapshot.val();
            }
            if (that.settings.sound_level) {
                NotificationManager.updateSoundLevel(that.settings.sound_level);
            }
        });
    };

    this.activateExternalWindow = function() {
        that.fb.location.settings.update({
            'external-window-activate': true
        });
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

    this.updateSoundLevel = function(level) {
        if (parseInt(level) && level > -1 && level <= 50) {
            that.fb.location.settings.update({
                'sound-level': parseInt(level)
            });
        }
    };

    return this;
}]);
