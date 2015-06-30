angular.module('portalchat.core').
service('SettingsManager', ['$rootScope', '$log', '$location', '$timeout', '$window', '$document', 'CoreConfig', '$firebaseObject', 'localStorageService', 'NotificationManager', 'UserManager', function($rootScope, $log, $location, $timeout, $window, $document, CoreConfig, $firebaseObject, localStorageService, NotificationManager, UserManager) {
    var that = this;

    this.setting = {};
    this.setting.session_id = undefined;
    this.state = {};
    this.state.is_vertical_increase = false;
    this.state.is_vertical_decrease = false;

    this.interval = {};
    this.interval.vertical_adjust = undefined;

    this.ux = {};

    this.global = {};
    this.global.is_external_window = false;
    this.global.is_external_window_instance_focus = false;
    this.global.is_open = false;
    this.global.layout = CoreConfig.inital.layout;
    this.global.font_size = CoreConfig.inital.font_size;
    this.global.show_external_notifications = false;
    this.global.sound_level = CoreConfig.inital.sound_level;
    this.global.last_contact_chat = false;
    this.global.last_panel_tab = 1;
    this.global.session_id = null;
    this.global.is_window_visible = true;
    this.global.panel_width_adjust = 0;
    this.global.panel_vertical_adjust = 0;
    this.global.panel_split_vertical_adjust = 0;

    this.fb = {}; // firebase domain
    this.fb.location = {}; // location of values
    this.fb.target = {}; // specific value in a location .. uses $value


    this.load = function() {
        if (UserManager.user.profile.id) {
            that.addVisiblityListener();
            that.setFirebaseLocations();
            that.setFirebaseTargets();
            $timeout(function() {
                that.setFirebaseSettings();
            });

            return true;
        }
        return false;
    };

    this.unload = function() {
        if (CoreConfig.module.setting.is_external_window_instance) {
            that.updateGlobalSetting('is_external_window', false, true);
            localStorageService.remove('is_external_window');
        }
        if (!CoreConfig.module.setting.is_external_window_instance) {
            if (CoreConfig.module.setting.session_id === localStorageService.get('session_id')) {
                localStorageService.remove('session_id');
            }
        }
        // that.fb.location.settings.update(that.global);
    };

    this.addVisiblityListener = function() {
        // Standards:
        if (CoreConfig.module.setting.dom_window.hidden in $document)
            $document.addEventListener("visibilitychange", onchange);
        else if ((CoreConfig.module.setting.dom_window.hidden = "mozHidden") in $document)
            $document.addEventListener("mozvisibilitychange", onchange);
        else if ((CoreConfig.module.setting.dom_window.hidden = "webkitHidden") in $document)
            $document.addEventListener("webkitvisibilitychange", onchange);
        else if ((CoreConfig.module.setting.dom_window.hidden = "msHidden") in $document)
            $document.addEventListener("msvisibilitychange", onchange);
        // IE 9 and lower:
        else if ('onfocusin' in $document)
            $document.onfocusin = $document.onfocusout = onchange;
        // All others:
        else
            $window.onpageshow = $window.onpagehide = $window.onfocus = $window.onblur = onchange;

        function onchange(evt) {
            $rootScope.$evalAsync(function() {
                var v = 'visible',
                    h = 'hidden',
                    evtMap = {
                        focus: v,
                        focusin: v,
                        pageshow: v,
                        blur: h,
                        focusout: h,
                        pagehide: h
                    };

                evt = evt || $window.event;
                if (evt.type in evtMap) {
                    CoreConfig.module.setting.dom_window.status = evtMap[evt.type];
                } else {
                    CoreConfig.module.setting.dom_window.status = this[CoreConfig.module.setting.dom_window.hidden] ? "hidden" : "visible";
                }
                if (CoreConfig.module.setting.dom_window.status === 'visible') {
                    that.global.is_window_visible = true;
                    CoreConfig.module.setting.dom_window.unread = 0;
                    $document.title = CoreConfig.module.setting.dom_window.default_window_title;
                } else {
                    that.global.is_window_visible = false;
                }

                that.fb.location.settings.update({
                    'is_window_visible': that.global.is_window_visible
                });
            });
        }
    };

    this.setFirebaseLocations = function() {
        if (UserManager.user.profile.id) {
            that.fb.location.settings = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.settings_reference + UserManager.user.profile.id + '/');
        }
    };

    this.setFirebaseTargets = function() {
        if (UserManager.user.profile.id) {
            // that.fb.target.is_external_window = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.settings_reference + UserManager.user.profile.id + '/is-external-window/'));
            // that.fb.target.is_module_open = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.settings_reference + UserManager.user.profile.id + '/module-open/'));
            return true;
        }
        return false;
    };

    this.setFirebaseSettings = function() {
        that.fb.location.settings.once('value', function(snapshot) {
            angular.forEach(snapshot.val(), function(value, key) {
                that.global[key] = value;
            });

        });
    };

    this.focusExternalWindowInstance = function() {
        that.fb.location.settings.update({
            'is_external_window_instance_focus': true
        });
    };

    this.updateGlobalSetting = function(setting, value, firebase) {
        if (angular.isDefined(that.global[setting]) && angular.isDefined(value)) {
            that.global[setting] = value;
        }
        if (firebase) {
            var update = {};
            update[setting] = value;
            that.fb.location.settings.update(update);
        }
    };

    this.detectLayout = function() {
        if ($window.innerHeight > 900) {
            return 3;
        } else if ($window.innerHeight > 700) {
            return 1;
        } else {
            return 2;
        }
    };
    this.increasePanelVerticalAdjustment = function() {
        that.ui.state.is_vertical_increase = true;
        if (that.interval.vertical_adjust) {
            $interval.cancel(that.interval.vertical_adjust);
        }
        that.interval.vertical_adjust = $interval(function() {
            console.log('increase vertical_adjust');
            if (that.ui.state.is_vertical_increase === true && that.global.panel_vertical_adjust < CoreConfig.max.panel_vertical_adjust) {
                that.global.panel_vertical_adjust += 4;
            }
            if (that.global.panel_vertical_adjust >= CoreConfig.max.panel_vertical_adjust) {
                that.stopVerticalPanelAdjust();
            }
        }, 100);
    };

    this.decreasePanelVerticalAdjustment = function() {
        that.ui.state.is_vertical_decrease = true;
        if (that.interval.vertical_adjust) {
            $interval.cancel(that.interval.vertical_adjust);
        }
        that.interval.vertical_adjust = $interval(function() {
            console.log('decrease vertical_adjust');
            if (that.ui.state.is_vertical_decrease === true && that.global.panel_vertical_adjust > -(CoreConfig.max.panel_vertical_adjust)) {
                that.global.panel_vertical_adjust -= 4;
            }
            if (that.global.panel_vertical_adjust <= -(CoreConfig.max.panel_vertical_adjust)) {
                that.stopVerticalPanelAdjust();
            }
        }, 100);
    };

    this.stopVerticalPanelAdjust = function() {
        $rootScope.$evalAsync(function() {
            $interval.cancel(that.interval.vertical_adjust);
            that.ui.state.is_vertical_increase = false;
            that.ui.state.is_vertical_decrease = false;
        });
    };




    return this;
}]);
