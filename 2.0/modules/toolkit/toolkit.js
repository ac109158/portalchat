
/*!
* screenfull
* v2.0.0 - 2014-12-22
* (c) Sindre Sorhus; MIT License
*/
!function(){"use strict";var a="undefined"!=typeof module&&module.exports,b="undefined"!=typeof Element&&"ALLOW_KEYBOARD_INPUT"in Element,c=function(){for(var a,b,c=[["requestFullscreen","exitFullscreen","fullscreenElement","fullscreenEnabled","fullscreenchange","fullscreenerror"],["webkitRequestFullscreen","webkitExitFullscreen","webkitFullscreenElement","webkitFullscreenEnabled","webkitfullscreenchange","webkitfullscreenerror"],["webkitRequestFullScreen","webkitCancelFullScreen","webkitCurrentFullScreenElement","webkitCancelFullScreen","webkitfullscreenchange","webkitfullscreenerror"],["mozRequestFullScreen","mozCancelFullScreen","mozFullScreenElement","mozFullScreenEnabled","mozfullscreenchange","mozfullscreenerror"],["msRequestFullscreen","msExitFullscreen","msFullscreenElement","msFullscreenEnabled","MSFullscreenChange","MSFullscreenError"]],d=0,e=c.length,f={};e>d;d++)if(a=c[d],a&&a[1]in document){for(d=0,b=a.length;b>d;d++)f[c[0][d]]=a[d];return f}return!1}(),d={request:function(a){var d=c.requestFullscreen;a=a||document.documentElement,/5\.1[\.\d]* Safari/.test(navigator.userAgent)?a[d]():a[d](b&&Element.ALLOW_KEYBOARD_INPUT)},exit:function(){document[c.exitFullscreen]()},toggle:function(a){this.isFullscreen?this.exit():this.request(a)},raw:c};return c?(Object.defineProperties(d,{isFullscreen:{get:function(){return!!document[c.fullscreenElement]}},element:{enumerable:!0,get:function(){return document[c.fullscreenElement]}},enabled:{enumerable:!0,get:function(){return!!document[c.fullscreenEnabled]}}}),void(a?module.exports=d:window.screenfull=d)):void(a?module.exports=!1:window.screenfull=!1)}();


/**
 * An Angular module that gives you access to the browsers local storage
 * @version v0.1.5 - 2014-11-04
 * @link https://github.com/grevory/angular-local-storage
 * @author grevory <greg@gregpike.ca>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(window, angular, undefined) {
    /*jshint globalstrict:true*/
    'use strict';

    var isDefined = angular.isDefined,
        isUndefined = angular.isUndefined,
        isNumber = angular.isNumber,
        isObject = angular.isObject,
        isArray = angular.isArray,
        extend = angular.extend,
        toJson = angular.toJson,
        fromJson = angular.fromJson;


    // Test if string is only contains numbers
    // e.g '1' => true, "'1'" => true
    function isStringNumber(num) {
        return /^-?\d+\.?\d*$/.test(num.replace(/["']/g, ''));
    }

    var angularLocalStorage = angular.module('LocalStorageModule', []);

    angularLocalStorage.provider('localStorageService', function() {

        // You should set a prefix to avoid overwriting any local storage variables from the rest of your app
        // e.g. localStorageServiceProvider.setPrefix('youAppName');
        // With provider you can use config as this:
        // myApp.config(function (localStorageServiceProvider) {
        //    localStorageServiceProvider.prefix = 'yourAppName';
        // });
        this.prefix = 'ls';

        // You could change web storage type localstorage or sessionStorage
        this.storageType = 'localStorage';

        // Cookie options (usually in case of fallback)
        // expiry = Number of days before cookies expire // 0 = Does not expire
        // path = The web path the cookie represents
        this.cookie = {
            expiry: 30,
            path: '/'
        };

        // Send signals for each of the following actions?
        this.notify = {
            setItem: true,
            removeItem: false
        };

        // Setter for the prefix
        this.setPrefix = function(prefix) {
            this.prefix = prefix;
            return this;
        };

        // Setter for the storageType
        this.setStorageType = function(storageType) {
            this.storageType = storageType;
            return this;
        };

        // Setter for cookie config
        this.setStorageCookie = function(exp, path) {
            this.cookie = {
                expiry: exp,
                path: path
            };
            return this;
        };

        // Setter for cookie domain
        this.setStorageCookieDomain = function(domain) {
            this.cookie.domain = domain;
            return this;
        };

        // Setter for notification config
        // itemSet & itemRemove should be booleans
        this.setNotify = function(itemSet, itemRemove) {
            this.notify = {
                setItem: itemSet,
                removeItem: itemRemove
            };
            return this;
        };

        this.$get = ['$rootScope', '$window', '$document', '$parse', function($rootScope, $window, $document, $parse) {
            var self = this;
            var prefix = self.prefix;
            var cookie = self.cookie;
            var notify = self.notify;
            var storageType = self.storageType;
            var webStorage;

            // When Angular's $document is not available
            if (!$document) {
                $document = document;
            } else if ($document[0]) {
                $document = $document[0];
            }

            // If there is a prefix set in the config lets use that with an appended period for readability
            if (prefix.substr(-1) !== '.') {
                prefix = !!prefix ? prefix + '.' : '';
            }
            var deriveQualifiedKey = function(key) {
                return prefix + key;
            };
            // Checks the browser to see if local storage is supported
            var browserSupportsLocalStorage = (function() {
                try {
                    var supported = (storageType in $window && $window[storageType] !== null);

                    // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
                    // is available, but trying to call .setItem throws an exception.
                    //
                    // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage
                    // that exceeded the quota."
                    var key = deriveQualifiedKey('__' + Math.round(Math.random() * 1e7));
                    if (supported) {
                        webStorage = $window[storageType];
                        webStorage.setItem(key, '');
                        webStorage.removeItem(key);
                    }

                    return supported;
                } catch (e) {
                    storageType = 'cookie';
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return false;
                }
            }());



            // Directly adds a value to local storage
            // If local storage is not available in the browser use cookies
            // Example use: localStorageService.add('library','angular');
            var addToLocalStorage = function(key, value) {
                // Let's convert undefined values to null to get the value consistent
                if (isUndefined(value)) {
                    value = null;
                } else if (isObject(value) || isArray(value) || isNumber(+value || value)) {
                    value = toJson(value);
                }

                // If this browser does not support local storage use cookies
                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    if (notify.setItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.setitem', {
                            key: key,
                            newvalue: value,
                            storageType: 'cookie'
                        });
                    }
                    return addToCookies(key, value);
                }

                try {
                    if (isObject(value) || isArray(value)) {
                        value = toJson(value);
                    }
                    if (webStorage) {
                        webStorage.setItem(deriveQualifiedKey(key), value)
                    };
                    if (notify.setItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.setitem', {
                            key: key,
                            newvalue: value,
                            storageType: self.storageType
                        });
                    }
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return addToCookies(key, value);
                }
                return true;
            };

            // Directly get a value from local storage
            // Example use: localStorageService.get('library'); // returns 'angular'
            var getFromLocalStorage = function(key) {

                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    return getFromCookies(key);
                }

                var item = webStorage ? webStorage.getItem(deriveQualifiedKey(key)) : null;
                // angular.toJson will convert null to 'null', so a proper conversion is needed
                // FIXME not a perfect solution, since a valid 'null' string can't be stored
                if (!item || item === 'null') {
                    return null;
                }

                if (item.charAt(0) === "{" || item.charAt(0) === "[" || isStringNumber(item)) {
                    return fromJson(item);
                }

                return item;
            };

            // Remove an item from local storage
            // Example use: localStorageService.remove('library'); // removes the key/value pair of library='angular'
            var removeFromLocalStorage = function(key) {
                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    if (notify.removeItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {
                            key: key,
                            storageType: 'cookie'
                        });
                    }
                    return removeFromCookies(key);
                }

                try {
                    webStorage.removeItem(deriveQualifiedKey(key));
                    if (notify.removeItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {
                            key: key,
                            storageType: self.storageType
                        });
                    }
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return removeFromCookies(key);
                }
                return true;
            };

            // Return array of keys for local storage
            // Example use: var keys = localStorageService.keys()
            var getKeysForLocalStorage = function() {

                if (!browserSupportsLocalStorage) {
                    $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    return false;
                }

                var prefixLength = prefix.length;
                var keys = [];
                for (var key in webStorage) {
                    // Only return keys that are for this app
                    if (key.substr(0, prefixLength) === prefix) {
                        try {
                            keys.push(key.substr(prefixLength));
                        } catch (e) {
                            $rootScope.$broadcast('LocalStorageModule.notification.error', e.Description);
                            return [];
                        }
                    }
                }
                return keys;
            };

            // Remove all data for this app from local storage
            // Also optionally takes a regular expression string and removes the matching key-value pairs
            // Example use: localStorageService.clearAll();
            // Should be used mostly for development purposes
            var clearAllFromLocalStorage = function(regularExpression) {

                regularExpression = regularExpression || "";
                //accounting for the '.' in the prefix when creating a regex
                var tempPrefix = prefix.slice(0, -1);
                var testRegex = new RegExp(tempPrefix + '.' + regularExpression);

                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    return clearAllFromCookies();
                }

                var prefixLength = prefix.length;

                for (var key in webStorage) {
                    // Only remove items that are for this app and match the regular expression
                    if (testRegex.test(key)) {
                        try {
                            removeFromLocalStorage(key.substr(prefixLength));
                        } catch (e) {
                            $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                            return clearAllFromCookies();
                        }
                    }
                }
                return true;
            };

            // Checks the browser to see if cookies are supported
            var browserSupportsCookies = (function() {
                try {
                    return $window.navigator.cookieEnabled ||
                        ("cookie" in $document && ($document.cookie.length > 0 ||
                            ($document.cookie = "test").indexOf.call($document.cookie, "test") > -1));
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return false;
                }
            }());

            // Directly adds a value to cookies
            // Typically used as a fallback is local storage is not available in the browser
            // Example use: localStorageService.cookie.add('library','angular');
            var addToCookies = function(key, value) {

                if (isUndefined(value)) {
                    return false;
                } else if (isArray(value) || isObject(value)) {
                    value = toJson(value);
                }

                if (!browserSupportsCookies) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
                    return false;
                }

                try {
                    var expiry = '',
                        expiryDate = new Date(),
                        cookieDomain = '';

                    if (value === null) {
                        // Mark that the cookie has expired one day ago
                        expiryDate.setTime(expiryDate.getTime() + (-1 * 24 * 60 * 60 * 1000));
                        expiry = "; expires=" + expiryDate.toGMTString();
                        value = '';
                    } else if (cookie.expiry !== 0) {
                        expiryDate.setTime(expiryDate.getTime() + (cookie.expiry * 24 * 60 * 60 * 1000));
                        expiry = "; expires=" + expiryDate.toGMTString();
                    }
                    if (!!key) {
                        var cookiePath = "; path=" + cookie.path;
                        if (cookie.domain) {
                            cookieDomain = "; domain=" + cookie.domain;
                        }
                        $document.cookie = deriveQualifiedKey(key) + "=" + encodeURIComponent(value) + expiry + cookiePath + cookieDomain;
                    }
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return false;
                }
                return true;
            };

            // Directly get a value from a cookie
            // Example use: localStorageService.cookie.get('library'); // returns 'angular'
            var getFromCookies = function(key) {
                if (!browserSupportsCookies) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
                    return false;
                }

                var cookies = $document.cookie && $document.cookie.split(';') || [];
                for (var i = 0; i < cookies.length; i++) {
                    var thisCookie = cookies[i];
                    while (thisCookie.charAt(0) === ' ') {
                        thisCookie = thisCookie.substring(1, thisCookie.length);
                    }
                    if (thisCookie.indexOf(deriveQualifiedKey(key) + '=') === 0) {
                        var storedValues = decodeURIComponent(thisCookie.substring(prefix.length + key.length + 1, thisCookie.length))
                        try {
                            var obj = JSON.parse(storedValues);
                            return fromJson(obj)
                        } catch (e) {
                            return storedValues
                        }
                    }
                }
                return null;
            };

            var removeFromCookies = function(key) {
                addToCookies(key, null);
            };

            var clearAllFromCookies = function() {
                var thisCookie = null,
                    thisKey = null;
                var prefixLength = prefix.length;
                var cookies = $document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    thisCookie = cookies[i];

                    while (thisCookie.charAt(0) === ' ') {
                        thisCookie = thisCookie.substring(1, thisCookie.length);
                    }

                    var key = thisCookie.substring(prefixLength, thisCookie.indexOf('='));
                    removeFromCookies(key);
                }
            };

            var getStorageType = function() {
                return storageType;
            };

            // Add a listener on scope variable to save its changes to local storage
            // Return a function which when called cancels binding
            var bindToScope = function(scope, key, def, lsKey) {
                lsKey = lsKey || key;
                var value = getFromLocalStorage(lsKey);

                if (value === null && isDefined(def)) {
                    value = def;
                } else if (isObject(value) && isObject(def)) {
                    value = extend(def, value);
                }

                $parse(key).assign(scope, value);

                return scope.$watch(key, function(newVal) {
                    addToLocalStorage(lsKey, newVal);
                }, isObject(scope[key]));
            };

            // Return localStorageService.length
            // ignore keys that not owned
            var lengthOfLocalStorage = function() {
                var count = 0;
                var storage = $window[storageType];
                for (var i = 0; i < storage.length; i++) {
                    if (storage.key(i).indexOf(prefix) === 0) {
                        count++;
                    }
                }
                return count;
            };

            return {
                isSupported: browserSupportsLocalStorage,
                getStorageType: getStorageType,
                set: addToLocalStorage,
                add: addToLocalStorage, //DEPRECATED
                get: getFromLocalStorage,
                keys: getKeysForLocalStorage,
                remove: removeFromLocalStorage,
                clearAll: clearAllFromLocalStorage,
                bind: bindToScope,
                deriveKey: deriveQualifiedKey,
                length: lengthOfLocalStorage,
                cookie: {
                    isSupported: browserSupportsCookies,
                    set: addToCookies,
                    add: addToCookies, //DEPRECATED
                    get: getFromCookies,
                    remove: removeFromCookies,
                    clearAll: clearAllFromCookies
                }
            };
        }];
    });
})(window, window.angular);




/**
 * pop.toolkit Module
 *
 * Description
 */
angular.module('pop.toolkit', ['LocalStorageModule']);



//Directives

angular.module('pop.toolkit').directive('summernote', function() {
    return {
        scope: true,
        restrict: 'A',
        link: function(scope, elm, attrs) {
            elm.summernote({
                airMode: true,
                toolbar: [
                    //[groupname, [button list]]
                    ['style', ['bold', 'italic', 'underline', 'clear']],
                    ['font', ['strikethrough']],
                    ['fontsize', ['fontsize']],
                    ['color', ['color']],
                    ['para', ['ul', 'ol', 'paragraph']],
                    ['height', ['height']],
                ]
            });
        }
    };
});

angular.module('pop.toolkit').directive('focusMe', function() {
    return {
        restrict: 'A',
        scope: {
            focusMe: '='
        },
        link: function(scope, elt) {
            scope.$watch('focusMe', function(val) {
                if (val) {
                    elt[0].focus();
                }
            });
        }
    };
});

angular.module('pop.toolkit').directive('popDraggable', function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var options = scope.$eval(attrs.popDraggable); //allow options to be passed in
      console.log('this ' + elm + 'should be draggable: ' + options);
      elm.draggable(options);
    }
  };
});

angular.module('pop.toolkit').directive('dynamic', function($compile) {
    return {
        restrict: 'A',
        replace: true,
        link: function(scope, ele, attrs) {
            scope.$watch(attrs.dynamic, function(html) {
                ele.html(html);
                $compile(ele.contents())(scope);
            });
        }
    };
});
// this directive is used to track the scroll
angular.module('pop.toolkit').directive("scroll", function($window) {
    return function(scope, element, attrs) {

        angular.element($window).bind("scroll", function() {
            scope.scrollY = this.scrollTop;
            scope.scrollX = this.pageXOffset;
            scope.$apply();
        });
    };
});
// Use this directive to allow the user to scroll vertically and horizontally by dragging the mouse
// after you remove the ugly scroll bars. The directive tag needs to be placed just inside the div that controls the overflow-css;
angular.module('pop.toolkit').directive('scrollDrag', function($window) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            var x, y, top, left, down;


            $(element.parent()).mousedown(function(e) {
                e.preventDefault();
                down = true;
                // console.log(e);
                x = e.clientX;
                y = e.clientY;
                top = $(this).scrollTop();
                left = $(this).scrollLeft();
            });

            $(element.parent()).mousemove(function(e) {
                if (down) {
                    var newX = e.pageX;
                    var newY = e.pageY;

                    //console.log(y+", "+newY+", "+top+", "+(top+(newY-y)));

                    $(element.parent()).scrollTop(top - newY + y);
                    $(element.parent()).scrollLeft(left - newX + x);
                }
            });

            $('body').mouseup(function(e) {
                down = false;
            });
        }
    };
});

// DIRECTIVES
angular.module('pop.toolkit').directive('format', ['$filter', function($filter) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if (!ctrl) {
                // console.log("returning");
                return;
            }

            var format = {
                prefix: '',
                thousandsSeparator: ''
            };

            ctrl.$parsers.unshift(function(value) {
                elem.priceFormat(format);
                // console.log(elem);
                return elem[0].value;
            });

            ctrl.$formatters.unshift(function(value) {
                elem[0].value = ctrl.$modelValue * 100;
                elem.priceFormat(format);
                // console.log(elem);
                return elem[0].value;
            });
        }
    };
}]);


//Filters


angular.module('pop.toolkit').filter('orderObjectBy', function() {
    return function(items, field, reverse) {
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        filtered.sort(function(a, b) {
            return (a[field].toLowerCase() > b[field].toLowerCase() ? 1 : -1);
        });
        if (reverse) filtered.reverse();

        return filtered;
    };
});

angular.module('pop.toolkit').filter('unique', function() {
    return function(items, filterOn) {
        if (filterOn === false) {
            return items;
        }
        if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
            var hashCheck = {},
                newItems = [];
            var extractValueToCompare = function(item) {
                if (angular.isObject(item) && angular.isString(filterOn)) {
                    return item[filterOn];
                } else {
                    return item;
                }
            };
            angular.forEach(items, function(item) {
                var valueToCheck, isDuplicate = false;
                for (var i = 0; i < newItems.length; i++) {
                    if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    newItems.push(item);
                }
            });
            items = newItems;
        }
        return items;
    };
});

angular.module('pop.toolkit').filter('trusted', ['$sce', function($sce) {
    return function(val) {
        if (typeof val == "string") {
            return $sce.trustAsHtml(val);
        } else {
            return val;
        }
    };
}]);

angular.module('pop.toolkit').filter('chars', function() {
    return function(input, chars, breakOnWord) {
        if (isNaN(chars)) return input;
        if (chars <= 0) return '';
        if (input && input.length > chars) {
            input = input.substring(0, chars);

            if (!breakOnWord) {
                var lastspace = input.lastIndexOf(' ');
                //get last space
                if (lastspace !== -1) {
                    input = input.substr(0, lastspace);
                }
            } else {
                while (input.charAt(input.length - 1) === ' ') {
                    input = input.substr(0, input.length - 1);
                }
            }
            return input + '...';
        }
        return input;
    };
});

angular.module('pop.toolkit').filter('words', function() {
    return function(input, words) {
        if (isNaN(words)) return input;
        if (words <= 0) return '';
        if (input) {
            var inputWords = input.split(/\s+/);
            if (inputWords.length > words) {
                input = inputWords.slice(0, words).join(' ') + '...';
            }
        }
        return input;
    };
});

// FILTERS
angular.module('pop.toolkit').filter('capitalize', function() {
    return function(input, scope) {
        if (input !== null)
            input = input.toLowerCase();
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
});


/**
 * ng-context-menu - v1.0.1 - An AngularJS directive to display a context menu
 * when a right-click event is triggered
 *
 * @author Ian Kennington Walter (http://ianvonwalter.com)
 */

angular.module('pop.toolkit').factory('ContextMenuService', function() {
    return {
        element: null,
        menuElement: null
    };
});

angular.module('pop.toolkit').directive('contextMenu', [
    '$document',
    'ContextMenuService',
    function($document, ContextMenuService) {
        return {
            restrict: 'A',
            scope: {
                'callback': '&contextMenu',
                'disabled': '&contextMenuDisabled',
                'closeCallback': '&contextMenuClose'
            },
            link: function($scope, $element, $attrs) {
                var opened = false;

                function open(event, menuElement) {
                    menuElement.addClass('open');

                    var doc = $document[0].documentElement;
                    var docLeft = (window.pageXOffset || doc.scrollLeft) -
                        (doc.clientLeft || 0),
                        docTop = (window.pageYOffset || doc.scrollTop) -
                        (doc.clientTop || 0),
                        elementWidth = menuElement[0].scrollWidth,
                        elementHeight = menuElement[0].scrollHeight;
                    var docWidth = doc.clientWidth + docLeft,
                        docHeight = doc.clientHeight + docTop,
                        totalWidth = elementWidth + event.pageX,
                        totalHeight = elementHeight + event.pageY,
                        left = Math.max(event.pageX - docLeft, 0),
                        top = Math.max(event.pageY - docTop, 0);

                    if (totalWidth > docWidth) {
                        left = left - (totalWidth - docWidth);
                    }

                    if (totalHeight > docHeight) {
                        top = top - (totalHeight - docHeight);
                    }

                    menuElement.css('top', top + 'px');
                    menuElement.css('left', left + 'px');
                    opened = true;
                }

                function close(menuElement) {
                    menuElement.removeClass('open');

                    if (opened) {
                        $scope.closeCallback();
                    }

                    opened = false;
                }

                $element.bind('contextmenu', function(event) {
                    if (!$scope.disabled()) {
                        if (ContextMenuService.menuElement !== null) {
                            close(ContextMenuService.menuElement);
                        }
                        ContextMenuService.menuElement = angular.element(
                            document.getElementById($attrs.target)
                        );
                        ContextMenuService.element = event.target;
                        //console.log('set', ContextMenuService.element);

                        event.preventDefault();
                        event.stopPropagation();
                        $scope.$apply(function() {
                            $scope.callback({
                                $event: event
                            });
                        });
                        $scope.$apply(function() {
                            open(event, ContextMenuService.menuElement);
                        });
                    }
                });

                function handleKeyUpEvent(event) {
                    //console.log('keyup');
                    if (!$scope.disabled() && opened && event.keyCode === 27) {
                        $scope.$apply(function() {
                            close(ContextMenuService.menuElement);
                        });
                    }
                }

                function handleClickEvent(event) {
                    if (!$scope.disabled() &&
                        opened &&
                        (event.button !== 2 ||
                            event.target !== ContextMenuService.element)) {
                        $scope.$apply(function() {
                            close(ContextMenuService.menuElement);
                        });
                    }
                }

                $document.bind('keyup', handleKeyUpEvent);
                // Firefox treats a right-click as a click and a contextmenu event
                // while other browsers just treat it as a contextmenu event
                $document.bind('click', handleClickEvent);
                $document.bind('contextmenu', handleClickEvent);

                $scope.$on('$destroy', function() {
                    //console.log('destroy');
                    $document.unbind('keyup', handleKeyUpEvent);
                    $document.unbind('click', handleClickEvent);
                    $document.unbind('contextmenu', handleClickEvent);
                });
            }
        };
    }
]);



// HELPER
(function($) {
    $.fn.priceFormat = function(options) {
        var defaults = {
            prefix: 'US$ ',
            suffix: '',
            centsSeparator: '.',
            thousandsSeparator: ',',
            limit: false,
            centsLimit: 2,
            clearPrefix: false,
            clearSufix: false,
            allowNegative: false,
            insertPlusSign: false
        };
        options = $.extend(defaults, options);
        return this.each(function() {
            var obj = $(this);
            var is_number = /[0-9]/;
            var prefix = options.prefix;
            var suffix = options.suffix;
            var centsSeparator = options.centsSeparator;
            var thousandsSeparator = options.thousandsSeparator;
            var limit = options.limit;
            var centsLimit = options.centsLimit;
            var clearPrefix = options.clearPrefix;
            var clearSuffix = options.clearSuffix;
            var allowNegative = options.allowNegative;
            var insertPlusSign = options.insertPlusSign;
            if (insertPlusSign) allowNegative = true;

            function to_numbers(str) {
                var formatted = '';
                for (var i = 0; i < (str.length); i++) {
                    var char_ = str.charAt(i);
                    if (formatted.length === 0 && char_ === 0) char_ = false;
                    if (char_ && char_.match(is_number)) {
                        if (limit) {
                            if (formatted.length < limit) formatted = formatted + char_;
                        } else {
                            formatted = formatted + char_;
                        }
                    }
                }
                return formatted;
            }

            function fill_with_zeroes(str) {
                while (str.length < (centsLimit + 1)) str = '0' + str;
                return str;
            }

            function price_format(str) {
                var formatted = fill_with_zeroes(to_numbers(str));
                var thousandsFormatted = '';
                var thousandsCount = 0;
                if (centsLimit === 0) {
                    centsSeparator = "";
                    centsVal = "";
                }
                var centsVal = formatted.substr(formatted.length - centsLimit, centsLimit);
                var integerVal = formatted.substr(0, formatted.length - centsLimit);
                formatted = (centsLimit === 0) ? integerVal : integerVal + centsSeparator + centsVal;
                if (thousandsSeparator || $.trim(thousandsSeparator) !== "") {
                    for (var j = integerVal.length; j > 0; j--) {
                        char_ = integerVal.substr(j - 1, 1);
                        thousandsCount++;
                        if (thousandsCount % 3 === 0) char_ = thousandsSeparator + char_;
                        thousandsFormatted = char_ + thousandsFormatted;
                    }
                    if (thousandsFormatted.substr(0, 1) == thousandsSeparator) thousandsFormatted = thousandsFormatted.substring(1, thousandsFormatted.length);
                    formatted = (centsLimit === 0) ? thousandsFormatted : thousandsFormatted + centsSeparator + centsVal;
                }
                if (allowNegative && (integerVal !== 0 || centsVal !== 0)) {
                    if (str.indexOf('-') != -1 && str.indexOf('+') < str.indexOf('-')) {
                        formatted = '-' + formatted;
                    } else {
                        if (!insertPlusSign) formatted = '' + formatted;
                        else formatted = '+' + formatted;
                    }
                }
                if (prefix) formatted = prefix + formatted;
                if (suffix) formatted = formatted + suffix;
                return formatted;
            }

            function key_check(e) {
                var code = (e.keyCode ? e.keyCode : e.which);
                var typed = String.fromCharCode(code);
                var functional = false;
                var str = obj.val();
                var newValue = price_format(str + typed);
                if ((code >= 48 && code <= 57) || (code >= 96 && code <= 105)) functional = true;
                if (code == 8) functional = true;
                if (code == 9) functional = true;
                if (code == 13) functional = true;
                if (code == 46) functional = true;
                if (code == 37) functional = true;
                if (code == 39) functional = true;
                if (allowNegative && (code == 189 || code == 109)) functional = true;
                if (insertPlusSign && (code == 187 || code == 107)) functional = true;
                if (!functional) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (str != newValue) obj.val(newValue);
                }
            }

            function price_it() {
                var str = obj.val();
                var price = price_format(str);
                if (str != price) obj.val(price);
            }

            function add_prefix() {
                var val = obj.val();
                obj.val(prefix + val);
            }

            function add_suffix() {
                var val = obj.val();
                obj.val(val + suffix);
            }

            function clear_prefix() {
                if ($.trim(prefix) !== '' && clearPrefix) {
                    var array = obj.val().split(prefix);
                    obj.val(array[1]);
                }
            }

            function clear_suffix() {
                if ($.trim(suffix) !== '' && clearSuffix) {
                    var array = obj.val().split(suffix);
                    obj.val(array[0]);
                }
            }
            $(this).bind('keydown.price_format', key_check);
            $(this).bind('keyup.price_format', price_it);
            $(this).bind('focusout.price_format', price_it);
            if (clearPrefix) {
                $(this).bind('focusout.price_format', function() {
                    clear_prefix();
                });
                $(this).bind('focusin.price_format', function() {
                    add_prefix();
                });
            }
            if (clearSuffix) {
                $(this).bind('focusout.price_format', function() {
                    clear_suffix();
                });
                $(this).bind('focusin.price_format', function() {
                    add_suffix();
                });
            }
            if ($(this).val().length > 0) {
                price_it();
                clear_prefix();
                clear_suffix();
            }
        });
    };
    $.fn.unpriceFormat = function() {
        return $(this).unbind(".price_format");
    };
    $.fn.unmask = function() {
        var field = $(this).val();
        var result = "";
        for (var f in field) {
            if (!isNaN(field[f]) || field[f] == "-") result += field[f];
        }
        return result;
    };
})(jQuery);

