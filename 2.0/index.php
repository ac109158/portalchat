<!DOCTYPE html>
<html>
<head>
    <title>Portal Chat</title>
     <link href="./assets/css/chat_module.css" rel="stylesheet" type="text/css">
     <link href="./assets/css/bootstrap.min.css" rel="stylesheet" type="text/css">
     <link href="./assets/css/compiled_vendor.css" rel="stylesheet" type="text/css">
     <link href="//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">
</head>
<body>
    <div ng-cloak presence="MOUSE TOUCH KEYBOARD" ng-controller="core.main" ng-init="initUser();">
        <div class="well well-sm" style="width: 300px; height: 500px; overlow-y:auto; overflow-x:hidden; float:left; clear:none; margin-right: 15px;">
            <legend>User</legend>
            <div ng-repeat="(key, value) in module.user"><label>{{key}}: </label><span ng-bind="value"></span><br></div>
        </div>
        <div class="well well-sm" style="width: 300px; height: 500px; overlow-y:auto; overflow-x:hidden; float:left; clear:none; margin-right: 15px;">
            <legend>Contacts</legend>
            <div ng-repeat="(key, value) in module.contacts"><label>{{key}}: </label><span ng-bind="value"></span><br></div>
        </div>
        <div class="well well-sm" style="width: 300px; height: 500px; overlow-y:auto; overflow-x:hidden; float:left; clear:none; margin-right: 15px;" >
            <div class="well well-sm" ng-repeat="(key, value) in module.engine track by $index">
                <legend>{{key}}</legend>
                <label>Online: </label><span ng-bind="value.online || value.onLine"></span>
            </div>
            Browser Online: <span ng-bind="ux.fx.isBrowserOffline();"></span><br>
            <span class="btn btn-sm btn-success" ng-click="ui.fx.setFirebaseOnline();">Online</span><br>
            <span class="btn btn-sm btn-success" ng-click="ui.fx.setFirebaseOffline();">Offline</span>
        </div>
        <div class="well well-sm" style="width: 300px; height: 500px; overlow-y:auto; overflow-x:hidden; float:left; clear:none; margin-right: 15px;">
                <legend>Settings</legend>
                <hr>
                <label>Globals</label>
                <div ng-repeat="(key, value) in module.global track by $index">
                    <label>{{key}}</label>: {{value}}
                </div>
                <hr>
                <label>Misc</label>
                <div ng-repeat="(key, value) in module.setting track by $index">
                        <label>{{key}}</label>: {{value}}
                </div>
        </div>

        <div class="well well-sm" style="width: 300px; height: 500px; overlow-y:auto; overflow-x:hidden; float:left; clear:none; margin-right: 15px;">
                <legend>UI</legend>
                <label>Font Size</label>
                <button class="glyphicon glyphicon-chevron-up" ng-click="ui.fx.increaseFontSize()"></button>
                <button class="glyphicon glyphicon-chevron-down" ng-click="ui.fx.decreaseFontSize()"></button>
                <br>
                <label>Open</label>
                <button class="btn btn-sm" ng-class="{'btn-default': !module.global.is_open, 'btn-success': module.global.is_open}" ng-click="ui.fx.openChatModule()">Open</button>
                <button class="btn btn-sm" ng-class="{'btn-default': module.global.is_open, 'btn-danger': !module.global.is_open}" ng-click="ui.fx.closeChatModule()">Close</button>
                <br>
                <div>
                    <label>Ping Host: </label><div class="btn btn-default" ng-click="ui.fx.pingHost();" >Ping</div>
                </div>
                <div>
                    <label>Sound: </label><div class="btn btn-default" ng-click="ui.fx.playSound();" >Play Sound</div>
                </div>
        </div>





    </div>
</body>
</html>
<script type="text/javascript">
var ApplicationConfiguration = (function() { // stores as a window global intentionally so that files from other directories can use it once they are called
    // Init module configuration options
    var debug = true;
    applicationModuleDependencies = [];
    return {
        applicationModuleName: 'portalchat', // name your Parent/wrapper app

        applicationModuleCoreVendorDependenciesScripts: [ // list any js framework/tool that you are going to use in your app project here
            './vendor/jquery/jquery-2.1.3.min.js',
            './vendor/angular/angular.min.js',
            './vendor/firebase/firebase.js',
        ],
        applicationModuleVendorDependenciesScripts: [ // list any js framework/tool that you are going to use in your app project here
            './vendor/angular/angular-sanitize.min.js',
            './vendor/angular/angular-animate.min.js',
            './vendor/angular/ui-bootstrap-tpls-0.12.1.min.js',
            './vendor/firebase/angularfire.min.js',
            './vendor/bootstrap/bootstrap.min.js', //bootstrap
            './modules/toaster/toaster.module.js', //remove
            './modules/toolkit/toolkit.js', //remove
        ],

        applicationModuleDependencies: applicationModuleDependencies,

        applicationModuleVendorDependencies: ['firebase', 'ngSanitize','ngAnimate', 'ui.bootstrap', 'toaster', 'pop.toolkit'],
        registerModule: function(moduleName, dependencies) { // Add a new vertical module
            // Create angular module
            if ( debug) { console.debug(moduleName + ' is registering as a module'); }
            angular.module(moduleName, []);
            applicationModuleDependencies.push(moduleName);
        }
    };
})();
(function(){
    var debug = false;


    window.onerror = function (errorMsg, url, lineNumber, columnNumber, errorObject) {
        var errMsg;
        //check the errorObject as IE and FF don't pass it through (yet)
        if (errorObject && errorObject !== undefined) {
                errMsg = errorObject.message;
            }
            else {
                errMsg = errorMsg;
            }
        console.log('Error: ' + errMsg);
    };

    var script_files = [
        './modules/core/core.module.js',
        './modules/core/services/core.fact.config.js',
        './modules/core/controllers/portalchat.ctrl.main.js',
        './modules/core/services/core.fact.coreManager.js',
        './modules/core/services/core.srv.coreApi.js',
        './modules/core/core.directives.js',
        './modules/core/core.filters.js',
        './modules/core/components/browser/core.srv.browser.js',

        './modules/core/components/audio/core.srv.audio.js',

        './modules/core/components/chats/core.fact.chatBuilder.js',
        './modules/core/components/chats/core.ctrl.chats.js',
        './modules/core/components/chats/core.fact.chatManager.js',
        './modules/core/components/chats/core.fact.chatModuleManager.js',
        './modules/core/components/chats/core.fact.chatStorage.js',
        './modules/core/components/chats/core.fact.directoryChatManager.js',
        './modules/core/components/chats/core.fact.groupChatManager.js',

        './modules/core/components/contacts/core.fact.contactsManager.js',

        './modules/core/components/emoji/core.service.emoji.js',

        './modules/core/components/notifications/core.srv.notificationsManager.js',

        './modules/core/components/online/core.fact.online.js',

        './modules/core/components/presence/core.fact.presence.js',

        './modules/core/components/permissions/core.fact.permissionsManager.js',

        './modules/core/components/session/core.fact.sessionsManager.js',

        './modules/core/components/settings/core.fact.settingsManager.js',

        './modules/core/components/user/core.fact.userManager.js',

        './modules/core/components/utility/core.fact.utility.js',

        './modules/core/components/ui/core.fact.uiManager.js',
        './modules/core/components/ui/core.fact.uxManager.js',

        './vendor/howler.min.js',
        './vendor/sjcl.js'
    ];
            // include a third-party async loader library
    /*!
     * $script.js v1.3
     * https://github.com/ded/script.js
     * Copyright: @ded & @fat - Dustin Diaz, Jacob Thornton 2011
     * Follow our software http://twitter.com/dedfat
     * License: MIT
     */
    !function(a,b,c){function t(a,c){var e=b.createElement("script"),f=j;e.onload=e.onerror=e[o]=function(){e[m]&&!/^c|loade/.test(e[m])||f||(e.onload=e[o]=null,f=1,c())},e.async=1,e.src=a,d.insertBefore(e,d.firstChild)}function q(a,b){p(a,function(a){return!b(a)})}var d=b.getElementsByTagName("head")[0],e={},f={},g={},h={},i="string",j=!1,k="push",l="DOMContentLoaded",m="readyState",n="addEventListener",o="onreadystatechange",p=function(a,b){for(var c=0,d=a.length;c<d;++c)if(!b(a[c]))return j;return 1};!b[m]&&b[n]&&(b[n](l,function r(){b.removeEventListener(l,r,j),b[m]="complete"},j),b[m]="loading");var s=function(a,b,d){function o(){if(!--m){e[l]=1,j&&j();for(var a in g)p(a.split("|"),n)&&!q(g[a],n)&&(g[a]=[])}}function n(a){return a.call?a():e[a]}a=a[k]?a:[a];var i=b&&b.call,j=i?b:d,l=i?a.join(""):b,m=a.length;c(function(){q(a,function(a){h[a]?(l&&(f[l]=1),o()):(h[a]=1,l&&(f[l]=1),t(s.path?s.path+a+".js":a,o))})},0);return s};s.get=t,s.ready=function(a,b,c){a=a[k]?a:[a];var d=[];!q(a,function(a){e[a]||d[k](a)})&&p(a,function(a){return e[a]})?b():!function(a){g[a]=g[a]||[],g[a][k](b),c&&c(d)}(a.join("|"));return s};var u=a.$script;s.noConflict=function(){a.$script=u;return this},typeof module!="undefined"&&module.exports?module.exports=s:a.$script=s}(this,document,setTimeout)

    // if(!angular){console.log('PLease include AngularJS');}
    if(!localStorage){
        console.log('Local Storage is not Supported');
    }

    // Init the application configuration module for AngularJS application

    //Sortfiles into applications files(are executed after module files) and module files( execute right after main dependencies are called ) tagged as modules ie ... ends in .module.js
    var applicationModules = [];
    var split;
    var module;
    var i = script_files.length;
    var index = -1;
    var module_files = [];
    while (i--) {
        index = script_files[i].search('module.js');
        if ( index > -1) {
            module_files.push(script_files[i]);
            // split = script_files[i].split('/');
            // module = split[split.length -1].split('.')[0];
            // applicationModules.push( module );
            script_files.splice(i, 1);
        }
    }
    if ( debug) {
        console.debug( module_files, ' : module_files');
        console.debug( script_files, ' : Application Files');
    }

    //initate each module in angualrjs
    // angular.forEach(applicationModules, function(module){
    //  console.log(module);
 //     angular.module(module, []);
 //    });

    i = 0;
    for (; i < applicationModules.length; i++) {
        angular.module(applicationModules[i], []);
        //Do something
    }


    $script( ApplicationConfiguration.applicationModuleCoreVendorDependenciesScripts , function() {
      // dependencies are ready
      if ( debug) { console.debug(' Primary dependencies are ready '); }
      loadModuleVendorDependencies();
    });

    var loadModuleVendorDependencies = function() {
        $script(ApplicationConfiguration.applicationModuleVendorDependenciesScripts , function() {
            //  module files are ready
            if ( debug) { console.debug('Module Vendor Dependencies are ready', ' '); }
            loadModuleFiles();
        });
    };

    var loadModuleFiles = function() {
        $script(module_files, function() {
            //  module files are ready
            if ( debug) { console.debug('module files are ready', ' '); }
            loadApplicationFiles();
        });
    };

    var loadApplicationFiles = function(){
        $script(script_files, function() {
            //  application files are ready
            if ( debug) { console.debug(' application files are ready '); }
            bootstrap();
        });
    };

    var bootstrap = function(){
        if ( debug) { console.debug('app has been bootstrapped', ' '); }
        // when all is done, execute bootstrap angular application
        //Start by defining the main module and adding the module dependencies
        var dependencies = ApplicationConfiguration.applicationModuleVendorDependencies.concat(ApplicationConfiguration.applicationModuleDependencies);
        if ( debug) { console.debug( dependencies, ': Dependencies'); }
        angular.module(ApplicationConfiguration.applicationModuleName, dependencies);

        // Setting HTML5 Location Mode
        angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider','$logProvider','$httpProvider',
            function($locationProvider, $logProvider, $httpProvider) {
            $locationProvider.html5Mode(true);
                $locationProvider.hashPrefix('!');
                $logProvider.debugEnabled(false);
                $httpProvider.defaults.timeout = 5000;
            }
        ]);

        angular.module(ApplicationConfiguration.applicationModuleName).config(function (localStorageServiceProvider) {
          localStorageServiceProvider.setPrefix(ApplicationConfiguration.applicationModuleName);
        });
         angular.isUndefinedOrNull = function(val) {
            return angular.isUndefined(val) || val === null;
        };

        Object.size = function(obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };

        //Then define the init function for starting up the application

        //Fixing facebook bug with redirect
        if (window.location.hash === '#_=_') window.location.hash = '#!';
        //Then init the app
        angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
    };
}() );

</script>
