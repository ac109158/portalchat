'use strict'; /* Factories */
angular.module('portalchat.core').
service('UtilityManager', ['$rootScope', '$firebase', '$log', '$http', '$window', '$timeout', 'CoreConfig', 'UserManager', 'NotificationManager', function($rootScope, $firebase, $log, $http, $window, $timeout, CoreConfig, UserManager, NotificationManager) {
    var that = this;
    this.firebase_connection = true;
    this._network = true;
    this._portal_online = true;
    this.isHostReachable = function(scope, host) {
        var imageAddr = host + new Date().getTime();
        var download = new Image();         // jshint ignore:line
        download.onload = function() {
            scope.isHost = true;
        };
        download.timeout = 2000;
        download.src = imageAddr;
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
    this.getObjectLength = function(obj) {
        var result = 0;
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                // or Object.prototype.hasOwnProperty.call(obj, prop)
                result++;
            }
        }
        return result;
    };
    this.isObjectLengthAtLeast = function(obj, length) {
        var result = 0;
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                // or Object.prototype.hasOwnProperty.call(obj, prop)
                result++;
                if (result == length) {
                    return true;
                }
            }
        }
        return false;
    };
    this.onComplete = function(error) {
        if (error) { /*             console.log('Synchronization failed.'); */
            if (that.isHostReachable()) {
                $log.debug("Firebase is Down");
            } else {
                $window.navigator.onLine = false;
            }
        }
    };
    this.setFirebaseOffline = function() {
        $log.debug('UtilityService.setFirebaseOffline');
        Firebase.goOffline();         // jshint ignore:line
    };
    this.setFirebaseOnline = function() {
        $log.debug('UtilityService.setFirebaseOnline');
        Firebase.goOnline();         // jshint ignore:line
    };
    this.pingTest = function(network_model) {
        $log.debug('running ping test');
        network_model.pinging = true;
        var imageAddr = "/components/com_callcenter/views/training/ng/img/ping_test_5mb" + "?n=" + Math.random();
        var startTime, endTime;
        var downloadSize = 5245329;
        var download = new Image();         // jshint ignore:line
        download.onload = function() {
            endTime = (new Date()).getTime();
            showResults();
        };
        startTime = (new Date()).getTime();
        download.src = imageAddr;

        function showResults() {
            var duration = (endTime - startTime) / 1000;
            var bitsLoaded = downloadSize * 8;
            var speedBps = (bitsLoaded / duration).toFixed(2);
            var speedKbps = (speedBps / 1024).toFixed(2);
            var speedMbps = (speedKbps / 1024).toFixed(2);
            $log.debug(downloadSize + " : " + duration);
            $log.debug("Connection speed is: \n" + speedBps + " bps\n" + speedKbps + " kbps\n" + speedMbps + " Mbps\n");
            network_model.ping = speedMbps;
            network_model.pinging = false;

            // that.__sendResponseChat(scope, chat, "Connection Rating is: \n" + Math.ceil(speedMbps / 10) + "/10 \n");
        }
    };
    this.safeApply = function(fn) //util function
        {
            var phase = this.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };
    this.__observeOnlineChange = function(online) {
        if (angular.isDefined(UserManager.user_profile_location) && online === true) {
            $timeout(function() {
                UserManager.user_profile_location.update({
                    'online': true,
                    'state': 'Online'
                });
                NotificationManager.playSound(NotificationManager.sound.update_alert);
                that._browser_online = true;
            }, 1000);
        } else if (angular.isDefined(UserManager.user_profile_location) && online === false) {
            UserManager.user_profile_location.update({
                'Online': false,
                'state': 'Offline'
            });
            that._browser_online = false;
        }
    };
    this.__observeNetworkChange = function(online) {
        if (angular.isDefined(UserManager.user_profile_location) && online === true) {
            $timeout(function() {
                UserManager.firebase_connection = online;
                UserManager.user_profile_location.update({
                    'online': online,
                    'state': 'Idle'
                });
                NotificationManager.playSound(NotificationManager.sound.money);
                that._network = true;
            }, 1000);
        } else if (angular.isDefined(UserManager.user_profile_location) && online === false) { /*           UtilityService.firebase_connection = online; */
            UserManager.user_profile_location.update({
                'Online': false,
                'state': 'Offline'
            });
            NotificationManager.playSound(NotificationManager.sound.bash_error);
            that._network = false;
        }
    };
    this.__observePortalChange = function(online) {
        if (angular.isDefined(UserManager.user_profile_location) && online === true) {
            that._portal_online = true;
        } else if (angular.isDefined(UserManager.user_profile_location) && online === false) {
            that._portal_online = false;
        }
    };


    this.__getGeolocation = function(scope, chat) {
        if ($window.navigator.geolocation) {
            $window.navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            that.__sendResponseChat(scope, chat, "Geolocation is not supported by this browser.");
            $log.debug("Geolocation is not supported by this browser.");
        }

        function showPosition(pos) {
            that.__sendResponseChat(scope, chat, "Latitude: " + pos.coords.latitude + "\nLongitude: " + pos.coords.longitude);
        }
    };
    this.__sendResponseChat = function(scope, chat, response) {
        var check_for_text = setInterval(function() {         // jshint ignore:line
            if (chat.chat_text === null || chat.chat_text === '') {
                clearInterval(check_for_text);         // jshint ignore:line
                chat.chat_text = response;
                scope.addChatMessage(chat);
            }
        }, 1000);
    };
    return this;
}]).service('popupService', ['$log', '$window', function($log, $window) {
    var popupWindow = $window.open('/modules/mod_chat/mod_chat.php');
}]);
