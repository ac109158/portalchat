AngularJS Toolkit

Concept: This module will be a global collection of useful snippets and modules that will came in handy from project to project.

To qualify to be added to this toolkit the code should something that transfers effortlessly from from project to project, and should not have very specific use cases to only certain projects.

Please log your contribution and provide a minimal example  of how to use use it.

Contributors:
Jared Timpson
Andrew Cook
World Wide Web
https://github.com/grevory/angular-local-storage

Dependencies so far:
AngularJs
  - ngSanitize
Bootstrap
Jquery

History Log:

11/7/2014: Created inital readme.txt file with everthing that has happened so far : A.C.
11/20/2014 : Added ui-select module from https://github.com/angular-ui/ui-select : A.C.
12/08/2014 : Added draggable directive : A.C.
12/08/2014 : Added draggable directive : A.C.
12/08/2014 : Added unique filter : A.C.





The toolkit currently provides the following:

Directives

* summernote air-mode instance, ex.  <div summernote> </div>

* dynamic $compile function for injecting angular elements into the dom after load, ex. <div dynamic="myDynamicHtml"></div>

* scroll attribute to bind the x & y scroll positions a div to scope , ex. <div scroll></div> , $scope.scrollX = x, $scope.scrollY = y

* scroll drag attribute that allows user to scroll vertical and horizontal with mouse drag, ex. <div scroll-drag></div>

* draggable directive that allows user to drag an html element ex. <div pop-draggable></div> || <div pop-draggable="options_object"></div>

* contextMenu directive that creates a menu when the user right clicks within a div,
    ex.
        <div class="node" context-menu data-target="node-menu"</div>
        ...
        <div class="dropdown position-fixed" id="node-menu">
            <ul class="dropdown-menu" role="menu" id="....">
                <div class="label label-default">Title</div>
                <hr>
                <li>
                    <a class="pointer" role="menuitem" tabindex="1" ng-click="...">
                        ....
                    </a>
                </li>
                ....
            </ul>
        </div>



Filters

* currencyFormat filter to specify $0.00, ex. <div format="number"></div>
 - only supports 2 decimal at this time
 - to do: expand to other types and formats

* orderObjectBy filter to allow the use of objects aka.. not arrays in ng-repeats, ex. <div ng-repeat=item in items | orderByObject: 'fieldName'</div>

* trusted filter to allow the page to render raw html content that will not be sanitized by angular, ex. <div ng-bind="myTrustedHtml | trusted"></div>

* chars ellipsis filter to auto set at certain character length, ex. <span ng-bind="myVariableName | chars: 10"></span>

* word ellipsis filter to auto set at certain word count, ex. <span ng-bind="mySentence | words: 10"></span>

* capitalize filter to capitalize the first letter of a string, ex. <span ng-bind="firstName | capitalize"></span> turns john into John

* unique filter to ensure items in an ng-repeat are not duplicates of each other, ex. <div ng-repeat="items in template.items | unique:'id'></div>


Modules Packages

* Angular ui-selct

  - AngularJS-native version of Select2 and Selectize


* angular-local-storage @ https://github.com/grevory/angular-local-storage
    -  An Angular module that gives you access to the browsers local storage,
    - demo @ http://gregpike.net/demos/angular-local-storage/demo.html
     API Documentation
        isSupported

        Checks if the browser support the current storage type(e.g: localStorage, sessionStorage). Returns: Boolean

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          if(localStorageService.isSupported) {
            //...
          }
          //...
        });

        getStorageType

        Returns: String

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          var storageType = localStorageService.getStorageType(); //e.g localStorage
          //...
        });

        set

        Directly adds a value to local storage.
        If local storage is not supported, use cookies instead.
        Returns: Boolean

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          function submit(key, val) {
           return localStorageService.set(key, value);
          }
          //...
        });

        get

        Directly get a value from local storage.
        If local storage is not supported, use cookies instead.
        Returns: value from local storage

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          function getItem(key) {
           return localStorageService.get(key);
          }
          //...
        });

        keys

        Return array of keys for local storage, ignore keys that not owned.
        Returns: value from local storage

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          var lsKeys = localStorageService.keys();
          //...
        });

        remove

        Remove an item from local storage by key.
        If local storage is not supported, use cookies instead.
        Returns: Boolean

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          function removeItem(key) {
           return localStorageService.remove(key);
          }
          //...
        });

        clearAll

        Remove all data for this app from local storage.
        If local storage is not supported, use cookies instead.
        Note: Optionally takes a regular expression string and removes matching.
        Returns: Boolean

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          function clearNumbers(key) {
           return localStorageService.clearAll(/^\d+$/);
          }
          //...
          function clearAll() {
           return localStorageService.clearAll();
          }
        });

        bind

        Bind $scope key to localStorageService.
        Usage: localStorageService.bind(scope, property, value[optional], key[optional])
        key: The corresponding key used in local storage Returns: deregistration function for this listener.

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          localStorageService.set('property', 'oldValue');
          $scope.unbind = localStorageService.bind($scope, 'property');

          //Test Changes
          $scope.update = function(val) {
            $scope.property = val;
            $timeout(function() {
              alert("localStorage value: " + localStorageService.get('property'));
            });
          }
          //...
        });

        <div ng-controller="MainCtrl">
          <p>{{property}}</p>
          <input type="text" ng-model="lsValue"/>
          <button ng-click="update(lsValue)">update</button>
          <button ng-click="unbind()">unbind</button>
        </div>

        deriveKey

        Return the derive key Returns String

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          localStorageService.set('property', 'oldValue');
          //Test Result
          console.log(localStorageService.deriveKey('property')); // ls.property
          //...
        });

        length

        Return localStorageService.length, ignore keys that not owned.
        Returns Number

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          var lsLength = localStorageService.length(); // e.g: 7
          //...
        });

        Cookie

        Deal with browser's cookies directly.
        cookie.isSupported

        Checks if cookies are enabled in the browser. Returns: Boolean

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          if(localStorageService.cookie.isSupported) {
            //...
          }
          //...
        });

        cookie.set

        Directly adds a value to cookies.
        Note: Typically used as a fallback if local storage is not supported.
        Returns: Boolean

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          function submit(key, val) {
           return localStorageService.cookie.set(key, value);
          }
          //...
        });

        cookie.get

        Directly get a value from a cookie.
        Returns: value from local storage

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          function getItem(key) {
           return localStorageService.cookie.get(key);
          }
          //...
        });

        cookie.remove

        Remove directly value from a cookie.
        Returns: Boolean

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          function removeItem(key) {
           return localStorageService.cookie.remove(key);
          }
          //...
        });

        clearAll

        Remove all data for this app from cookie.

        myApp.controller('MainCtrl', function($scope, localStorageService) {
          //...
          function clearAll() {
           return localStorageService.cookie.clearAll();
          }
        });


