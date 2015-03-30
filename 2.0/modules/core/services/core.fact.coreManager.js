angular.module('portalchat.core').factory('CoreManager', ['$rootScope', '$log', '$timeout', 'UserManager', 'SettingsManager', 'ContactsManager', 'BrowserService', 'UtilityManager','NotificationManager', 'states', 'localStorageService',
    function($rootScope, $log, $timeout, UserManager, SettingsManager, ContactsManager, BrowserService, UtilityManager, NotificationManager, states, localStorageService) {
        var that = this;

        this.initUser = function() {
            UserManager.load();
        };

        this.initApp = function() {
            if (UserManager.user.id) {
                $timeout(function() {
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

        this.returnContacts = function(){
            return ContactsManager.contacts;
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

        return this;
    }
]);
