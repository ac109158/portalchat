angular.module('portalchat.core').
service('SettingsManager', ['$rootScope', '$log', '$timeout', '$window', '$document', 'CoreConfig', '$firebaseObject', 'localStorageService', 'NotificationManager', 'UserManager', function($rootScope, $log, $timeout, $window, $document, CoreConfig, $firebaseObject, localStorageService, NotificationManager, UserManager) {
    var that = this;

    this.setting = {};
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
    this.global.is_global_sound = CoreConfig.inital.is_global_sound;
    this.global.sound_level = CoreConfig.inital.sound_level;
    this.global.last_contact_chat = false;
    this.global.last_panel_tab = false;
    this.global.session_id = undefined;
    this.global.is_window_visible = true;
    this.global.panel_width_adjust = 0;
    this.global.panel_vertical_adjust = 0;
    this.global.panel_split_vertical_adjust = 0;

    this.fb = {}; // firebase domain
    this.fb.location = {}; // location of values
    this.fb.target = {}; // specific value in a location .. uses $value


    this.load = function() {
        if (UserManager.user.id) {
            that.initSessionVar();
            that.addVisiblityListener();
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

    this.initSessionVar = function() {
        if (localStorageService.get('is_existing_chat')) {
            $log.debug('is_existing_chat: ', localStorageService.get('is_existing_chat'));
            // var current = window.open('','_self');

            // $timeout(function(){
            //     current.close();
            //     self.close(); 
            //     window.close();
            // }, 500)

        } else {
            localStorageService.add('is_existing_chat', (Math.random() + 1).toString(36).substring(7));
            that.global.session_id = localStorageService.get('isExistingChat');
            $log.debug(' that.global.session.id set to ' + that.global.session_id);
        }
    };

    this.addUnloadListener = function() {
        $window.onbeforeunload = function(e) {
            if (that.global.session_id === localStorageService.get('is_existing_chat')) {
                localStorageService.remove('is_existing_chat');
            }
            that.fb.location.settings.update(that.global);
        };
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
        }
    };

    this.setFirebaseLocations = function() {
        if (UserManager.user.id) {
            console.log(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.settings_reference + UserManager.user.id + '/');
            that.fb.location.settings = new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.settings_reference + UserManager.user.id + '/');
        }
    };

    this.setFirebaseTargets = function() {
        if (UserManager.user.id) {
            // that.fb.target.is_external_window = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.settings_reference + CoreConfig.user.id + '/is-external-window/'));
            that.fb.target.is_module_open = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.contacts.reference + CoreConfig.contacts.settings_reference + UserManager.user.id + '/module-open/'));
            return true;
        }
        return false;
    };

    this.setFirebaseSettings = function() {
        that.fb.location.settings.once('value', function(snapshot) {
            angular.forEach(snapshot.val(), function(value, key){
                console.log(key, ":", value);
                that.global[key] = value;
            });

        });
    };

    this.setExternalWindow = function() {
        if (String(window.location.href).split('?')[1] === String(CoreConfig.url.external).split('?')[1]) {
            that.global.is_open = true;
            that.fb.location.settings.update({
                'is_external_window': true
            });
            that.global.is_external_window = true;
        } else {
            that.global.is_external_window = false;
        }

        that.fb.location.settings.child('is_external_window').on('value', function(snapshot) {
            if (snapshot.val()) {
                that.global.is_external_window = true;
                $rootScope.$broadcast('setting-change', {
                    is_external_window: true
                });
                if (status && CoreConfig.module.setting.is_external_window_instance) {
                    CoreConfig.module.setting.main_panel.width = angular.copy($window.innerWidth);
                } else {
                    CoreConfig.module.setting.main_panel.width = CoreConfig.module.setting.main_panel.default_width;
                }
            } else {
                that.global.is_external_window = false;
                $rootScope.$broadcast('close-external-window');
                $rootScope.$broadcast('setting-change', {
                    is_external_window: false
                });
                console.log('we need to restablish the chat for the main browser window ');
            }
        });


        if (that.global.is_external_window) {
            localStorageService.add('is_external_window', that.global.session_id);
            that.fb.location.settings.onDisconnect().update({
                'is_external_window': false
            });

        }

        that.fb.location.settings.child('/is_external_window_instance_focus/').on('value', function(snapshot) {
            if (snapshot.val()) {
                if (that.global.is_external_window === true && CoreConfig.module.setting.is_external_window_instance === true) {
                    $timeout(function() {
                        self.focus();
                    });
                    $timeout(function() {
                        that.fb.location.settings.update({
                            'is_external_window_instance_focus': false
                        });
                    }, 3000);
                }
            }

        });
        $log.debug(String(window.location.href).split('?')[1] + '  : ' + String(CoreConfig.url.external).split('?')[1]);
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

    this.detectLayout = function() { /*      console.log('detecting layout'); */
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
        if(that.interval.vertical_adjust){
            $interval.cancel(that.interval.vertical_adjust);
        }
        that.interval.vertical_adjust = $interval(function() {
            console.log('increase vertical_adjust');
            if (that.ui.state.is_vertical_increase === true && that.global.panel_vertical_adjust < CoreConfig.max.panel_vertical_adjust) {
                that.global.panel_vertical_adjust+=4;
            }
            if (that.global.panel_vertical_adjust  >= CoreConfig.max.panel_vertical_adjust) {
                that.stopVerticalPanelAdjust();
            }
        }, 100);
    };

    this.decreasePanelVerticalAdjustment = function() {
        that.ui.state.is_vertical_decrease = true;
        if(that.interval.vertical_adjust){
            $interval.cancel(that.interval.vertical_adjust);
        }
        that.interval.vertical_adjust = $interval(function() {
            console.log('decrease vertical_adjust');
            if (that.ui.state.is_vertical_decrease === true && that.global.panel_vertical_adjust > -(CoreConfig.max.panel_vertical_adjust)) {
                that.global.panel_vertical_adjust-=4;
            }
            if (that.global.panel_vertical_adjust  <= -(CoreConfig.max.panel_vertical_adjust)) {
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
