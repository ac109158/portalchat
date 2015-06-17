'use strict'; /* Factories */
angular.module('portalchat.core').
service('UtilityManager', ['$rootScope', '$firebase', '$log', '$http', '$window', '$timeout', '$interval', 'CoreConfig', 'UserManager', 'NotificationManager', function($rootScope, $firebase, $log, $http, $window, $interval, $timeout, CoreConfig, UserManager, NotificationManager) {
    var that = this;


    this.engine = {};
    this.engine.portal = {};
    this.engine.portal.title = "Portal";
    this.engine.portal.online = true;

    this.engine.firebase = {};
    this.engine.firebase.title = "Firebase";
    this.engine.firebase.online = true;

    this.engine.network = {};
    this.engine.network.title = "Network";
    this.engine.network.is_pinging = false;
    this.engine.network.ping = undefined;
    this.engine.network.online = true;

    this.interval = {};

    this.fb = {};
    this.fb.location = {};



    // $rootScope.$on('browser_offline', function(event) {
    //     $rootScope.browser.online = false;
    //     if ($scope.platform.browser === "Firefox") {
    //         $window.navigator.offline = true;
    //     }
    // });


    this.load = function() {
        that.fb.location.fb_connected = new Firebase(CoreConfig.url.firebase_database + ".info/connected");
        that.fb.location.fb_connected.on("value", function(snap) {
            if (snap.val()) {
                $rootScope.$evalAsync(function() {
                    that.engine.firebase.online = true;
                    that.engine.network.online = true;
                });

            } else {
                $rootScope.$evalAsync(function() {
                    that.engine.firebase.online = false;
                    that.engine.network.online = false;
                    NotificationManager.playSound('bash_error');
                });
            }
        });



        $window.addEventListener("offline", function() {
            $rootScope.$apply(function() {
                that.engine.network.online = false;
            });
        }, false);
        $window.addEventListener("online", function() {
            $rootScope.$apply(function() {
                that.pingPortal();
                that.pingGoogle();
            });
        }, false);
    };

    this.pingPortal = function() {
        that.engine.portal.online = false;
        var imageAddr = "//favicon.ico?rand=" + new Date().getTime();
        var download = new Image(); // jshint ignore:line
        download.onload = function() {
            that.engine.portal.online = true;
            // that.engine.portal.online = true;
        };
        download.timeout = 2000;
        download.src = imageAddr;
    };

    this.pingGoogle = function() {
        that.engine.network.online = false;
        var imageAddr = "//www.google.com/favicon.ico?rand=" + new Date().getTime();
        var download = new Image(); // jshint ignore:line
        download.onload = function() {
            that.engine.network.online = true;
            // that.engine.portal.online = true;
        };
        download.timeout = 2000;
        download.src = imageAddr;
    };

    this.isHostReachable = function(host) {
        var imageAddr = host + new Date().getTime();
        var download = new Image(); // jshint ignore:line
        download.onload = function() {
            that.engine.network.online = true;
            // that.engine.portal.online = true;
        };
        download.timeout = 2000;
        download.src = imageAddr;
    };

    this.onComplete = function(error) {
        if (error) {
            if (that.isHostReachable()) {
                $log.debug("Firebase is Down");
            } else {
                $window.navigator.onLine = false;
            }
        }
    };
    this.setFirebaseOffline = function() {
        $log.debug('UtilityService.setFirebaseOffline');
        Firebase.goOffline(); // jshint ignore:line
        that.engine.firebase.online = false;
    };
    this.setFirebaseOnline = function() {
        $log.debug('UtilityService.setFirebaseOnline');
        Firebase.goOnline(); // jshint ignore:line
        that.engine.firebase.online = true;
    };

    this.setNetworkOffline = function() {
        $log.debug('UtilityService.setNetworkOffline');
        that.engine.network.online = false;
    };

    this.setNetworkOnline = function() {
        $log.debug('UtilityService.setNetworkOnline');
        that.engine.network.online = true;
    };

    this.setNetworkOffline = function() {
        $log.debug('UtilityService.setNetworkOffline');
        that.engine.network.online = false;
    };

    this.setNetworkOnline = function() {
        $log.debug('UtilityService.setNetworkOnline');
        that.engine.network.online = true;
    };

    this.pingTest = function() {
        $log.debug('running ping test');
        that.engine.network.is_pinging = true;
        var imageAddr = "/components/com_callcenter/views/training/ng/img/ping_test_5mb" + "?n=" + Math.random();
        var startTime, endTime;
        var downloadSize = 5245329;
        var download = new Image(); // jshint ignore:line
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
            that.engine.network.ping = speedMbps;
            $timeout(function() {
                that.engine.network.is_pinging = false;
            });


            // that.__sendResponseChat(scope, chat, "Connection Rating is: \n" + Math.ceil(speedMbps / 10) + "/10 \n");
        }
    };

    this.getGeolocation = function(scope, chat) {
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
    this.sendResponseChat = function(scope, chat, response) {
        var check_for_text = setInterval(function() { // jshint ignore:line
            if (chat.chat_text === null || chat.chat_text === '') {
                clearInterval(check_for_text); // jshint ignore:line
                chat.chat_text = response;
                scope.addChatMessage(chat);
            }
        }, 1000);
    };

    this.pingHost = function() {
        if (that.engine.network.is_pinging) {
            return false;
        }
        that.is_host_reachable = false;
        that.engine.network.is_pinging = true;
        var host_ping_promise = $http.get();
        host_ping_promise.then(function(response) {
            console.log(response);
            if (response.status === 200) {
                that.is_host_reachable = true;
                that.engine.network.is_pinging = false;
                return true;
            } else {
                var ping_interval = $timeout(function() {
                    host_ping_promise = $http.get("./assets/img/favicon.ico?rand=" + new Date().getTime());
                    host_ping_promise.then(function(response) {
                        console.log(response);
                        if (response.status === 200) {
                            that.engine.portal.online = true;
                            that.is_host_reachable = true;
                            that.engine.network.is_pinging = false;
                            $timeout.cancel(ping_interval);
                            return true;
                        } else {
                            that.engine.portal.online = false;
                            var google_ping_promise = $http.get("//www.google.com/favicon.ico?rand=" + new Date().getTime());
                            google_ping_promise.then(function(response) {
                                console.log(response);
                                if (response.status === 200) {
                                    that.engine.network.online = true;
                                    that.is_host_reachable = true;
                                    that.engine.network.is_pinging = false;
                                    return true;
                                } else {
                                    that.engine.network.online = false;
                                }
                            });
                        }
                    });
                }, 5000);
            }
        }); // jshint ignore:line

    };



    this.safeApply = function(fn) { //util function
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
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
    return this;
}]).service('popupService', ['$log', '$window', function($log, $window) {
    var popupWindow = $window.open('/modules/mod_chat/mod_chat.php');
}]);
