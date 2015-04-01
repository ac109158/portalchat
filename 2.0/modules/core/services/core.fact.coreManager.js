angular.module('portalchat.core').factory('CoreManager', ['$rootScope', '$log', '$timeout', 'UserManager', 'SettingsManager', 'ContactsManager', 'BrowserService', 'UtilityManager', 'NotificationManager', 'states', 'localStorageService',
    function($rootScope, $log, $timeout, UserManager, SettingsManager, ContactsManager, BrowserService, UtilityManager, NotificationManager, states, localStorageService) {
        var that = this;

        this.initUser = function() {
            UserManager.load();
        };

        this.initApp = function() {
            if (UserManager.user.id) {
                $timeout(function() {
                    UtilityManager.load();
                    ContactsManager.load();
                    SettingsManager.load();
                });
            }
            states.onChange(function(state) {
                UserManager.updateState(state.text);
            });
        };

        this.returnUser = function() {
            var user = UserManager.user;
            user.platform = BrowserService.platform;
            user.settings = SettingsManager.settings;
            return user;
        };

        this.returnContacts = function() {
            return ContactsManager.contacts;
        };

        this.returnEngine = function() {
            return UtilityManager.engine;
        };

        this.setPresence = function(presence) {
            UserManager.setPresence(presence);
        };

        this.updateSoundLevel = function(level) {
            if (parseInt(level) && level > -1 && level <= 50) {
                NotificationManager.updateSoundLevel(level);
                SettingsManager.updateSoundLevel(level);
                $timeout(function() {
                    NotificationManager.playSound(NotificationManager.sound.new_chat);
                });

            }
        };

        this.observeSystemChange = function(notification){
            if(notification.system === 'network' || notification.system === 'network'){
                that.observeNetworkChange(notification.value);
            } else if(notification.system === 'firebase') {

            } else if(notification.system === 'portal'){
                that.observePortalChange(notification.value);
            }
        };

        this.observeNetworkChange = function(online) {
            if (online === true) {
                $timeout(function() {
                    UserManager.setUserOnline(true);
                    NotificationManager.playSound(NotificationManager.sound.money);
                    UtilityManager.setNetworkOnline();
                });
            } else {
                UserManager.setUserOnline(false);
                NotificationManager.playSound(NotificationManager.sound.bash_error);
                UtilityManager.setNetworkOffline();
            }
        };

        this.observePortalChange = function(online_state) {
            if (online_state === true) {
                UtilityManager.setPortalOnline();
            } else {
                UtilityManager.setPortalOffline();
            }
        };

        return this;
    }
]);
