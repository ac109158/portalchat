'use strict';
if (window.angular)
{

// Declare app level module which depends on filters, and services
var pathArray = window.location.host.split( '.' );
if ( pathArray[1] === 'test')
{
	var database = 'https://portalchattest.firebaseio.com/';
	var external = 'index.php?option=com_content&view=article&id=100&Itemid=1111'
}
else
{
	var database = 'https://plusoneportal.firebaseio.com/';
	var external = 'index.php?option=com_content&view=article&id=233&Itemid=1112'
}

angular.module('chatModule', [
	'firebase',
	'ngSanitize',
	'emoji',
	'chatModule.filters',
	'chatModule.services',
	'chatModule.factories',
	'chatModule.directives',
	'chatModule.controllers',
	'LocalStorageModule'
	
])
.config(function($logProvider){
  $logProvider.debugEnabled(false);
}).
config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.timeout = 5000;
}])
.constant('ENCRYPT_PASS', 'Anything but plain text')
.constant('FBURL', database)
.constant('EXT_LINK', external)
.run(function($window, $rootScope) {
      $rootScope.browser_online = navigator.onLine;
      $window.addEventListener("offline", function () {
        $rootScope.$apply(function() {
          $rootScope.browser_online= false;
        });
      }, false);
      $window.addEventListener("online", function () {
        $rootScope.$apply(function() {
          $rootScope.browser_online = true;
        });
      }, false);
});


/* Controllers */

angular.module('chatModule.controllers', []).
controller('MainController', ['$rootScope', '$scope', '$log', 'UtilityService',  'NotificationService', 'UserService', 'BrowserService', 'states','$timeout', 'localStorageService',  function($rootScope, $scope, $log, UtilityService,  NotificationService, UserService, BrowserService, states, $timeout, localStorageService) 
{    
	$scope.runApp = false;
	$scope.showProfileMenu = false;
	$scope.showPresenceMenu = false;
	$scope.showVolumeMenu = false;
	$scope.sound_level = 2;

	UserService.profile($scope); //sets user info into $scope
	$timeout(function()
	{
		states.onChange(function(state) {
			$scope.text = state.text;
			UserService.__updateState(state.text);			
		});
	});
		 
	$scope.states = states;
	$scope.browser = BrowserService.platform.browser;
	$scope.os = BrowserService.platform.os;
	$scope.browserVersion = BrowserService.platform.browserVersion;

	$scope.request_chat = true;
	
	$scope.chat = function(agent)
	{
		if ( $scope.request_chat === true)
		{
			$scope.request_chat = false;
			$rootScope.$broadcast('requestChatSession', agent);
			$timeout(function()
			{
				$scope.request_chat = true;
			}, 2000);	
		}
	}		
	$scope.network = true;
	$scope.portal_online = true;
	$scope.firebase_connection = true;
	
	$scope.$on('closeExternalWindow', function(event) 
	{
		$log.debug('broadcast closeExternalWindow');
		if ( $scope.externalWindowObject)
		{
			$scope.externalWindowObject.close();
			$scope.externalWindowObject = null;
		}
		if ($scope.isExternalInstance)
		{
			window.close();
		}
		$scope.ischildWindow = false;
		localStorageService.remove("isExternalWindow");
	});
	
	$scope.$on('activateExternalWindow', function(event) 
	{
		$log.debug('broadcast activateExternalWindow');
		if ( $scope.externalWindowObject)
		{
			$scope.externalWindowObject.focus();
		}
		if($scope.isExternalInstance)
		{
			window.focus();
		}
	});
	
	jQuery(document).ready(function() {
		$scope.$on('network_online', function(event) 
		{
			$scope.network = true;
		});
		
		$scope.$on('network_offline', function(event) 
		{
			$scope.network = false;
		});
		
		$scope.$on('portal_online', function(event) 
		{
			$scope.portal_online = true;
		});
		
		$scope.$on('portal_offline', function(event) 
		{
			$scope.portal_online = false;;
		});
		
		$scope.$on('firebase_online', function(event) 
		{
			$scope.firebase_connection = true;;
		});
		
		$scope.$on('firebase_offline', function(event) 
		{
			$scope.firebase_connection = false;;
		});
		
		$scope.$on('browser_online', function(event) 
		{
			$rootScope.browser_online = true 
		});
		
		$scope.$on('browser_offline', function(event) 
		{
			$rootScope.browser_online = false
			if ( BrowserService.browser = "Firefox")
			{
				window.navigator.offline = true;
			}
		});
	});
	

	$scope.setFirebaseOffline = function()
	{
		$log.debug('setting offline');
		UtilityService.setFirebaseOffline();
	}
	
	$scope.setFirebaseOnline = function()
	{
		$log.debug('setting Online');
		UtilityService.setFirebaseOnline();
	}
	
	$scope.isPing = false;
	$scope.runPingTest = function(chat)
	{
		UtilityService.__pingTest($scope, chat);
	}
	
	$scope.returnFalse = function()
	{
		return false;
	}
	
	if (String(window.location.href).split('?')[1] == 'option=com_content&view=article&id=100&Itemid=1111')
	{
		$scope.backdrop = true;
	}
	else
	{
		$scope.backdrop = false;
	}
	
	$scope.broadcastPresenceStatus = function(status)
	{	if(status)
		{
			$rootScope.$broadcast('chat_presence_change', status);	
		}
		
	}
	
	$scope.toggleProfileMenu = function(){
		$scope.showProfileMenu = !$scope.showProfileMenu;
	}
	
	$scope.togglePresenceMenu = function(){
		$scope.showPresenceMenu = !$scope.showPresenceMenu;
	}
	$scope.setPresence = function(presence)
	{
		if(presence)
		{
			$scope.clearPresenceOptions();
			UserService.__storeChatPresence(presence);
			UserService._user_presence_location.update({'chat-presence':presence});
			if(presence == 'Offline')
			{
				UserService.__storeUserOnline(false);
				$timeout(function(){
					UserService._user_online_location.update({'online':false});
				}, 1000)
			}
			else
			{
				UserService.__storeUserOnline(true);
				$timeout(function(){
					UserService._user_online_location.update({'online':true});
				}, 1000)
				
			}	
		}
	}
	
	$scope.toggleVolumeMenu = function(){
		$scope.showVolumeMenu = !$scope.showVolumeMenu;
	}
	
	$scope.updateSoundLevel = function(level)
	{
		if (parseInt(level) && level > -1 && level <= 50 )
		{
			NotificationService.__updateSoundLevel(parseInt(level));
			UserService._user_settings_location.update({'sound-level': parseInt(level)})
			$scope.sound_level = level;
			$timeout(function()
			{
				NotificationService.__playSound(NotificationService._new_chat);
			})
			
		}
	}
	
	$scope.activateExternalWindow = function(){
		if ($scope.externalWindowObject)
		{
			console.log('activateExternalWindow');
			$scope.externalWindowObject.focus();
		}
		else
		{
			$scope.$broadcast('activateExternalWindow');
		}
	}
	
	
	$scope.updatePresenceMessage = function(){
		if (!$scope.user_profile.presence.message)
		{
			$scope.user_profile.presence.message_show = false;
			$scope.updatePresenceMessageShow();
			$scope.user_profile.presence.auto_post = false;
			$scope.updatePresenceMessagePost();
		}
		UserService._user_presence_location.update({message:$scope.user_profile.presence.message});
	}
	
	$scope.clearPresenceOptions = function()
	{
		$scope.user_profile.presence.message = '';
		$scope.updatePresenceMessage();
		$scope.user_profile.presence.show_message = false;
		$scope.updatePresenceMessageShow();
		$scope.user_profile.presence.auto_post = false;
		$scope.updatePresenceMessagePost();
		
	}
	
	$scope.updatePresenceMessageShow = function(){
		$log.debug('updatePresenceMessageShow');
		if (angular.isDefined($scope.user_profile.presence.show_message)){
			UserService._user_presence_location.update({'show-message':$scope.user_profile.presence.show_message});
		}
	}
	
	$scope.updatePresenceMessagePost = function(){
		$log.debug('updatePresenceMessageShowPost');
		if (angular.isDefined($scope.user_profile.presence.auto_post)){
			UserService._user_presence_location.update({'auto-post':$scope.user_profile.presence.auto_post});
		}
	}
}]).
controller('AlertController', ['$scope', '$log', 'UserService',   function($scope, $log, UserService) 
{

	$scope.addAlert = function() 
	{
		$scope.alerts.push({msg: "Another alert!"});
	};
	
	$scope.closeAlert = function(index) 
	{
		$scope.alerts.splice(index, 1);
	};
	
/* 	$scope.firebase_msg = '<strong>Firebase System is Offline.</strong> Please click <a href="#" class="alert-link">here </a>to alert your system admin. Firebase services will be unavailable at this time.'; */
	$scope.firebase_msg = '<strong>Firebase System is loading.';
	
	$scope.network_msg = '<strong>Network Failure.</strong>  Most services will be unavailable at this time.';
	
	$scope.portal_msg = '<strong>PlusOne Portal is Offline </strong>Please click <a href="#" class="alert-link">here </a>to alert your system admin. Most services will be unavailable at this time ';

}]).
controller('AudioController',['$scope', '$rootScope', 'AudioService', 'UserService',   function ($scope, $rootScope,AudioService, UserService) {

}]).
controller('ChatController', ['$rootScope', '$scope', '$window', '$log', 'ChatService', 'DirectoryChatService', 'UserService','OnlineService', 'UtilityService', 'BrowserService', 'ChatRecordService', 'AudioService', '$timeout',  'EmojiService', 'states', 'NotificationService', 'ENCRYPT_PASS', 'FBURL','EXT_LINK',  '$sce','$filter','localStorageService',   function( $rootScope, $scope, $window, $log, ChatService, DirectoryChatService, UserService, OnlineService,  UtilityService, BrowserService,ChatRecordService,AudioService,$timeout, EmojiService, states, NotificationService, ENCRYPT_PASS, FBURL, EXT_LINK,  $sce, $filter,localStorageService) {
	angular.isUndefinedOrNull = function(val){ return angular.isUndefined(val) || val === null}
	$scope.chat_ping = false;
	$scope.tmp = 1;
	$scope.directory_limit = 30;
	$scope.video = {};
	
	$scope.video.code = '';
	$scope.video.url = '';
	$scope.video.message = '';
	$scope.video.heading = '';
	
	$scope.image = {};
	$scope.image.url = '';
	$scope.image.heading = '';
	$scope.image.message = '';
	
	$scope.audio = {};
	$scope.audio.heading = '';
	$scope.audio.message = '';
	$scope.audio.url = '';
	$scope.audio.cid = '';
	

	$scope.chat_panel_width = window.innerWidth;
	$scope.admin_group = '3424258';
	$scope.users_list = Array();
	$scope.chat_module_lock = true;
	$scope.isChildWindow == false;
	$scope.isSettingLayout = true;
	$scope.chat_textarea_height = 35;
	$scope.chat_label_height = 25;
	$scope.tracker_panel_size = 115;
	$scope.resize_vertical = true;
	$scope.resize_adjustment_3 = 0;
	$scope.command_key = ';';
	$scope.directory_search = {};
	$scope.directory_search.text = '';
	$scope.priority_queue = Array();
	$scope.directory_chat = null;
	$scope.directory_index = null;
	$scope.mandatory_index = 'contacts';
	$scope.stored_directory_index = 0;
	$scope.last_unread_index = null;
	$scope.isChatModuleClosing = false;
	$scope.isChatModuleOpening = false;
	$scope.alertToOpen = false;
	$scope.showNavMenu = false;
	$scope.showFilterMenu = false;
	
	$scope.isPageLoaded = false;
	$scope.PageLoadComplete = false;
	$scope.isPageComplete = false;
	$scope.referencing = false;
	$scope.directoryChats = Array();
	$scope.activeChats = Array();
	$scope.filtered_directory_array = Array();
/*
	$scope.online_users_list = {};
	$scope.offline_users_list = {};
*/
	
	
	
	$scope.directory_group_chats = Array();
	$scope.directory_group_chats_log = Array();
	
	$scope.groupChatsAllowed = true;
	$scope.invite = false;
	$scope.isHost = true; // flag for allowing a ping to the host
	$scope.showUnactive = true;
	
	
	
	$scope.emojis = EmojiService.contents;	
	$scope.presence_states = ChatService.__returnChatPresenceStates();
	
	$scope.reference = undefined;
	$scope.referenced_message = null;
	$scope.referenced_index = undefined;
	$scope.referenceName = '';
	$scope.updated_text ='';
	$scope.requested_chat = '';
	$scope.temp_chat = null; // temp storage used in switching chats
	$scope.chat_module_directory_height = parseInt($scope.windowHeight, 10) || 0;
	$scope.unactive_chat_count = 0;
	$scope.chat_width = 237;
	if (!$scope.isExternalWindow)
	{
		$scope.chat_panel_width = 250;	
	}
	$scope.chat_queue_width = 110;
	$scope.chat_margin = 2;
	$scope.max_count =  Math.floor(( ($window.innerWidth - $scope.chat_queue_width - $scope.chat_panel_width ) / $scope.chat_width));
	$scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();	
	
	$scope.safeApply = function(fn) 
	{
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') 
		{
			if(fn && (typeof(fn) === 'function')) 
			{
				fn();
			}
		} 
		else 
		{
			this.$apply(fn);
		}
	};
	
	
    $scope.hidden = "hidden";
    $scope.page_status = 'visible';
    $scope.default_window_title = 'Dashboard';
    $scope.unread = 0;

    // Standards:
    if ($scope.hidden in document)
        document.addEventListener("visibilitychange", onchange);
    else if (($scope.hidden = "mozHidden") in document)
        document.addEventListener("mozvisibilitychange", onchange);
    else if (($scope.hidden = "webkitHidden") in document)
        document.addEventListener("webkitvisibilitychange", onchange);
    else if (($scope.hidden = "msHidden") in document)
        document.addEventListener("msvisibilitychange", onchange);
    // IE 9 and lower:
    else if ('onfocusin' in document)
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    else
        window.onpageshow = window.onpagehide 
            = window.onfocus = window.onblur = onchange;

    function onchange (evt) {
        var v = 'visible', h = 'hidden',
            evtMap = { 
                focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h 
            };

        evt = evt || window.event;
        if (evt.type in evtMap) {
            $scope.page_status = evtMap[evt.type];
        }
        else {      
           $scope.page_status = this[$scope.hidden] ? "hidden" : "visible";
        }
        if ($scope.page_status == 'visible')
        {
	        $scope.unread = 0;
	        document.title = $scope.default_window_title;
        }
    }
		
	jQuery(document).ready(function() {
		var check_for_user = setInterval(function() // delays fetch unitl user info is in place
		{
			if (UserService._user_profile.role == 'PlusOne Admin')
			{
				var sessions_root = new Firebase(ChatService._group_url_root + ChatService._group_active_session_reference);
				sessions_root.once('value', function(snapshot){
					var active_sessions = snapshot.val();
					if (active_sessions)
					{
						angular.forEach(active_sessions, function(val, key) {
							if (!val.admin)
							{
								$log.debug('removed active session' + key);
								sessions_root.child(key).remove();
							}
						});
					}
				});
			}
			if (UserService._user_profile.role == 'PlusOne Admin' || UserService._user_profile.role == 'Administrator' ||  UserService._user_profile.role == 'Shift Manager')
			{
				var mc_root = new Firebase(ChatService._group_url_root + 'mc');
				mc_root.once('value', function(snapshot){
					var mc_chats = snapshot.val();
					if (mc_chats)
					{
						$scope.mc_array = Array();
						angular.forEach(mc_chats, function(val, key) {
							$scope.mc_array.push(UserService._users_profiles_obj['user_' + key.split('_')[1]]);
						});
					}
				});
			}
			$scope.online_users_list = UserService._online_users_list;
			$scope.offline_users_list = UserService._offline_users_list;
			$log.debug('Looking for chat user');
			if ( UserService._user_profile && UserService._user_profile.user_id && angular.isDefined(UserService._user_profile_location) && UserService._user_init)
			{
				$scope.user_online = UserService.__setProfileOnlineLocationforUser(UserService._user_profile.user_id);
				
				$scope.user_chat_presence = UserService.__setChatPresenceforUser(UserService._user_profile.user_id);
				
				$timeout(function(){
					$scope.users_list = UserService.__getUserArray();
					UserService._page_loaded = true;
				}, 5000)
				
/* 				UserService.__setGeolocation(UserService._user_profile.user_id); */
				$scope.location = {};
/* 				UserService.__getGeolocation(UserService._user_profile.user_id, $scope.location) */
				

				clearInterval(check_for_user)
				$log.debug('User was defined');
				$log.debug(String(window.location.href).split('?')[1]);
				if ( String(window.location.href).split('?')[1] == String(EXT_LINK).split('?')[1] )
				{
					$scope.isExternalWindow = true;
					UserService._user_settings_location.update({'is-external-window': true})
					$scope.isExternalInstance = true;					
				}
				else
				{
					$scope.isExternalInstance = false;
			
				}
/*
				
				if ( String(window.location.href).split('?')[1] == 'option=com_content&view=category&layout=blog&id=8&Itemid=102')
				{
					$scope.isExternalInstance = false;
				}
*/
					
				$timeout(function(){
					OnlineService.__setOnlineTracking($scope);
					$scope.$on('LocalStorageModule.notification.setItem', function(event, parameters) {
				   $log.debug('local storage: ' + parameters.key + ' ; ' + parameters.newvalue);
				   parameters.key;  // contains the key that changed
				   parameters.newvalue;  // contains the new value
				});
				}, 5000)
				$log.debug($scope.is_external_window.$value);
				$scope.$watch('is_external_window.$value', function(newStatus) {	
					if(newStatus == false  && $scope.isExternalInstance == false)
					{
	/* 					   	   UtilityService.setFirebaseOnline(); */
					   if($scope.externalWindowObject)
					   {
						   	$scope.externalWindowlistener = null;
						   	$scope.externalWindowObject = null;   
					   }
					   $scope.isExternalWindow = false;
					   $scope.isChildWindow = false;
				   	   ChatService.__set_active_sessions_user_location($scope);
				   	   $timeout(function(){
					   	   $scope.establishLayout();
				   	   }, 1000)
							
					}
					else if( newStatus == true && $scope.isExternalInstance == false)
					{
						$timeout(function(){
							$scope.isExternalWindow = true;	
							$scope.isPageLoaded = false;
							$scope.mute();
													
						}, 750);
	
					}
					else if (!localStorageService.get('isExternalWindow'))
					{
					   /*
					   ChatService.__set_active_sessions_user_location($scope);
				   	   $timeout(function(){
					   	   $scope.establishLayout();
				   	   }, 1000)
*/
						
					}
					if (newStatus && $scope.isExternalInstance)
					{
						$scope.chat_panel_width = window.innerWidth;
					}
					else
					{
						$scope.chat_panel_width = 250;
					}
				
				});
				ChatService.__establishUserChat($scope);
				$scope.sm_group_chat = DirectoryChatService.__buildNewDirectoryChat($scope, 'sm_group_chat', 'PlusOne - Group Chat','smod', true, false, 1);
				$scope.sm_group_chat.index_position = 'sm_group_chat';
				$scope.checkForTopic($scope.sm_group_chat);
				$scope.sm_tech_chat = DirectoryChatService.__buildNewDirectoryChat($scope, 'sm_tech_chat', 'Tech Support - Group Chat','tod',true, false, 2);

				$scope.sm_tech_chat.index_position = 'sm_tech_chat';
				$scope.checkForTopic($scope.sm_tech_chat);
				
				if (UserService._user_profile.mc)
				{
				  $scope.mc_group_chat = DirectoryChatService.__buildNewDirectoryChat($scope, ('mc_' + UserService._user_profile.mc.user_id + '_group_chat'), UserService._user_profile.mc.name +  ' - MC Team Chat',  UserService._user_profile.mc.user_id, false, false, 3); //scope, chat_reference, chat_description, admin, watch_users
				  $scope.mc_group_chat.index_position = 'mc_group_chat';
				}
				/*
else if (UserService._user_profile.position == 33)
				{
					$scope.mc_group_chat = DirectoryChatService.__buildNewDirectoryChat($scope, ('mc_' + UserService._user_profile.user_id + '_group_chat'), UserService._user_profile.name + ' - MC Team Chat', UserService._user_profile.user_id, false, false);	//chatSession, to_user,  scope	
					$scope.mc_group_chat.index_position = 'mc_group_chat';	
				}
*/
				if($scope.mc_group_chat)
				{
					$scope.checkForTopic($scope.mc_group_chat);
				}
				
				if (true)
				{
					$timeout(function(){
						$scope.$evalAsync(function(){
							if ( $scope.layout == null)
							{
								UserService._user_settings_location.update({'layout': 1})
							}
							if ( $scope.isChatModuleOpen == null)
							{
								UserService._user_settings_location.update({'module-open': true});
							}
						}) 
						if ($scope.isExternalWindow == true && $scope.isExternalInstance == false)
						{
							return;
						}
						if($scope.isExternalWindow == false || $scope.isExternalWindow == true && $scope.isExternalInstance)
						{
							$scope.establishLayout();	
						}
					},100)
				}
			}
		}, 1000);		
		
	
	
		$scope.$watch('online', function(newStatus) {
			 UtilityService.__observeOnlineChange(newStatus)
		});
	 
		$scope.$watch('network', function(newStatus) {
			UtilityService.__observeNetworkChange(newStatus)
		});
	 
		$scope.$watch('portal_online', function(newStatus) {
			UtilityService.__observeNetworkChange(newStatus)
		});
	
		$scope.$on('requestChatSession', function(event, to_user) 
		{
			ChatService.__requestChatSession($scope, to_user, true);
		});	
		
		$scope.$on('todChange', function(event, to_user) 
		{
			$scope.$evalAsync(function(){
				$scope.tod = UserService._tod;
			})
			
		});	
		
		$scope.$on('smodChange', function(event, to_user) 
		{
			$scope.$evalAsync(function(){
				$scope.smod = UserService._smod;
			})
		})
		
		$scope.$on('activateExternalWindow', function(event) 
		{
			if ( $scope.externalWindowObject)
			{
				$scope.externalWindowObject.focus();
			}
			else{
				$scope.openExternalWindow();
			}
		});
	
	})
	
	$scope.fontUp = function()
	{
		if($scope.font_size < 16)
		{
			$scope.font_size++;
			UserService._user_settings_location.update({'font-size': $scope.font_size});
		}
		$scope.$evalAsync(function(){
			$scope.initializeWindowSize();
		});
	}
	
	$scope.fontDown = function()
	{
		if ($scope.font_size > 12)
		{
			$scope.font_size--;
			UserService._user_settings_location.update({'font-size': $scope.font_size});
		}
		$scope.$evalAsync(function(){
			$scope.initializeWindowSize();
		});
	}
	
	$scope.updateTmp = function(tmp)
	{
		if (tmp != $scope.tmp)
		{
			if (tmp)
			{
				$scope.tmp = tmp;
			}
		}
	}
	
	$scope.establishLayout = function()
	{
		$log.debug('calling $scope.establishLayout()');
		$scope.isChatModuleOpen = true;
		if($scope.isExternalInstance)
		{
			document.documentElement.style.overflow = 'hidden';  // firefox, chrome
			document.body.scroll = "no"; // ie only
			$timeout(function(){
				document.documentElement.style.overflow = 'hidden';  // firefox, chrome
				document.body.scroll = "no"; // ie only
			}, 4000)
		}
/* 					$timeout(function(){ */
		var check_for_layout = setInterval(function() // delays fetch unitl user info is in place
		{
			if (angular.isDefined($scope.isChatModuleOpen) && angular.isDefined($scope.layout))
			{
				clearInterval(check_for_layout);
				var init_tab = 'contacts';
				
				if ($scope.layout == 1 && angular.isDefined($scope.last_active_chat_index))
				{
					if (typeof $scope.last_active_chat_index.$value == 'string')
					{
						if ($scope.activeChats.length > 0)
						{
							$scope.directory_chat = $scope.activeChats[0];
							$scope.directory_index = 0;
							$scope.stored_directory_index = 0;
						}
						init_tab = $scope.last_active_chat_index.$value + '_link';
						
					}
					else
					{
						init_tab = 'contacts_link';				
					}
					
					$timeout(function(){
						$scope.isPageLoaded = true;
						$scope.setLayout();	
					}, 50)
					
					
					
					
					
					$timeout(function(){
						
						$scope.setLayout();
						$scope.isSettingLayout = false;
						$scope.isPageComplete = true;
						
						if ($scope.isChatModuleOpen)
						{
							$timeout(function(){
								if(angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_mandatory_chat_index.$value == 'sting')
								{
									$scope.setMandatoryFocus($scope[$scope.last_mandatory_chat_index.$value])
								}
								else if(angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_active_chat_index.$value == 'number')
								{
									$scope.setDirectoryChat($scope.last_active_chat_index.$value, true)
								}
								else
								{
									if(init_tab)
									{
										if(document.getElementById(init_tab))
										{
											document.getElementById(init_tab).click();
										}
										
									}
									
									$scope.clearMandatoryList();
								}
								
							})
						}
					}, 100)
					
					$timeout(function(){								
					UserService._user_settings_location.child('/module-open/').once('value', function(snapshot) 
						{
							if(snapshot.val() === null)	{ $scope.isChatModuleOpen = true; } else { $scope.isChatModuleOpen = snapshot.val()}
						});
					}, 90)
/*
					$timeout(function(){
						UserService._user_profiles_location.child(UserService._user_profile.user_id + '/module-open/').on('value', function(snapshot) 
						{
							if(snapshot.val())
							{
								$scope.isChatModuleOpen = true;
								$scope.$evalAsync(function(){
									$scope.openChatModule();
								})
								
							}
							else
							{
								$scope.isChatModuleOpen = true;
								$scope.$evalAsync(function(){
									$scope.closeChatModule();
								})
							}
						});
					
					}, 1000)
*/
					
					
				}
				
				else if ($scope.layout == 3)
				{
					if (angular.isUndefinedOrNull($scope.last_active_chat_index) || angular.isDefined($scope.active_chat_index) &&  typeof $scope.active_chat_index.$value == 'string')
					{
						if ($scope.activeChats.length > 0)
						{
							$scope.directory_chat = $scope.activeChats[0];
							$scope.stored_directory_index = $scope.directory_index = 0;
						}
						
					}
					
					if (angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_mandatory_chat_index.$value == 'string')
					{
						init_tab = $scope.last_mandatory_chat_index.$value + '_link';
					}
					else
					{
						init_tab = 'contacts_link';
					}
					
					$timeout(function(){
						$scope.isPageLoaded = true;	
					}, 50)
					
					
					$timeout(function(){
						$scope.setLayout();
					}, 100)
					
					$timeout(function(){
						if ($scope.activeChats.length > 0)
						{
							if(angular.isDefined($scope.last_active_chat_index) && typeof $scope.last_active_chat_index.$value == 'number')
							{
								$scope.setDirectoryChat($scope.last_active_chat_index.$value, $scope.isChatModuleOpen)
							}
							else
							{
								$scope.setDirectoryChat(0, $scope.isChatModuleOpen);
							}
						}
						
					}, 150)
					
					$timeout(function(){
						$scope.setLayout();
						$scope.isPageComplete = true;
						$scope.isSettingLayout = false;
						
					}, 200)
					
					$timeout(function(){								
				
						UserService._user_settings_location.child('/module-open/').once('value', function(snapshot) 
						{
							if(snapshot.val() === null)	{ $scope.isChatModuleOpen = true; } else { $scope.isChatModuleOpen = snapshot.val()}
						});
					}, 250)
				}
				else
				{
					if (angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_mandatory_chat_index.$value == 'string')
					{
						init_tab = $scope.last_mandatory_chat_index.$value + '_link';
					}
					else
					{
						init_tab = 'contacts_link';
					}
					$timeout(function(){
						$scope.isPageLoaded = true;	
					}, 50)
					
					$timeout(function(){
						$scope.setLayout();
						$scope.isPageComplete = true;
						$scope.isSettingLayout = false;
						if (init_tab && $scope.isChatModuleOpen)
						{
							$timeout(function(){
								if (document.getElementById(init_tab))
								{
									document.getElementById(init_tab).click();
								}
								$scope.clearMandatoryList();
							});
						}
						
					}, 100)
				}
				
				$timeout(function()
				{
					ChatService.__setLastPushed('empty');
					angular.forEach($scope.activeChats, function(val, key)
					{
						val.isTextFocus = false;
						$scope.resetTyping(val);
						
					});
					
					
					
					$scope.$watch('layout', function(newStatus){
						$scope.safeApply(function(){
							$timeout(function(){
								$scope.setLayout();
							}, 500);				
						})				
					})
					
					$scope.$watch('windowHeight', function(newStatus) {	
						$scope.safeApply(function(){
							$scope.setLayout();
						})
					});
					$timeout(function(){
						$scope.$watch('is_panel_open.$value', function(newStatus) {	
						if(newStatus == true)
						{
							$scope.openChatModule()
						}
						else
						{
							if($scope.isExternalInstance)
							{
								return false;
							}
							$scope.closeChatModule()
						}
						});
						
					}, 5000)
					
					
					$scope.$watch('vertical_adjust', function(newStatus) {	
						$scope.vertical_adjust = parseInt(newStatus);
						$scope.setLayout();
					});
					
					$scope.$watch('width_adjust', function(newStatus) {
						/*
if (parseInt(newStatus + 250) < 300)
						{
							$scope.font_size = 12;
							UserService._user_settings_location.update({'font-size': $scope.font_size});
						}
*/
						$scope.chat_panel_width = 250 + parseInt(newStatus);	
					});
					
					$scope.$watch('vertical_adjust_2', function(newStatus) {	
						$scope.setLayout();
					});
					
					$scope.$watch('resize_adjustment_3', function(newStatus) {	
						$scope.vertical_adjust = parseInt(-(newStatus));
						$scope.setLayout();
					});
					
					$scope.$watch('tracker_panel_size', function(newStatus) {
							$scope.setLayout();
					});
					
					$scope.$watch('video.url', function(newValue) {
							if (newValue)
							{
								$scope.video.code = '';
								$timeout(function(){
									$scope.video.code = $scope.video.url.split('v=')[1];
									$scope.video.code = $scope.video.code.split('&')[0];
								}, 250);
								
							}
					});
					
					$scope.$watch('audio.cid', function(newValue) {
							if (newValue && newValue.length > 0)
							{
								$scope.audio.url = null;
								$timeout(function(){
									AudioService.async($scope, newValue);
								}, 250);
								
							}
					});
					
					$scope.$watch('audio.url', function(newValue) {
							if (newValue && newValue.length > 0)
							{
								$scope.audio.url = null;
								$scope.audio.url = $sce.trustAsResourceUrl(newValue);
								
							}
					});	
					
					$scope.$watch('activeChats.length', function(newStatus) {	
						if ( newStatus > $scope.max_count)
						{
							$scope.unactive_chat_count = newStatus - $scope.max_count;
						}
						else 
						{
							$scope.unactive_chat_count = 0;
						}
						$scope.unactiveChats = null;
						$scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
						$scope.setActiveChatsPriority();
			/* 			$scope.resetChatUnread(); */
						if ($scope.layout != 2)
						{
							$scope.$evalAsync(function(){
								$scope.setLayout();					
							});
						}
					});
					
					$scope.$watch('max_count', function(newStatus) 
					{	
						$scope.max_count = newStatus;
						if ( $scope.activeChats.length > $scope.max_count)
						{
							$scope.unactive_chat_count = $scope.activeChats.length - $scope.max_count ;
						}
						else 
						{
							$scope.unactive_chat_count = 0;
						}
						$scope.unactiveChats = null;
						$scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
						$scope.resetChatUnread();
					});
					
					$timeout(function(){
						NotificationService.isGlobalSound = true;
					}, 3000)
				}, 1500);
			}
		}, 100)
		$log.debug('finished $scope.establishLayout()');
	}
	$scope.toggleUnactive = function()
	{
		$scope.showUnactive = !$scope.showUnactive;
	}
	
	$scope.openUnactiveChat = function(chat, index, max_count_index)
	{
		$scope.temp_chat = chat;
		$scope.unactiveChats[index] = $scope.activeChats[max_count_index + ($scope.activeChats.length - (max_count_index + 1) - index)] = $scope.activeChats[max_count_index];
		$scope.activeChats[max_count_index] = $scope.temp_chat;		
		$scope.activeChats[max_count_index].isopen = true;
		$scope.activeChats[max_count_index].isTextFocus = true;
		$scope.activeChats[max_count_index].unread = 0;
		$scope.activeChats[max_count_index].header_color = ChatService._header_color;
		ChatService.__setLastPushed($scope.activeChats[max_count_index].to_user_id || $scope.activeChats[max_count_index].session_key);
		$scope.temp_chat = null;
		$scope.setActiveChatsPriority();		
	}

	
	$scope.toggleModuleLock = function()
	{
		$scope.chat_module_lock = !$scope.chat_module_lock;
	}
	
	$scope.setModuleLock = function()
	{
		$scope.chat_module_lock = true;
	}
	
	$scope.unSetModuleLock = function()
	{
		$scope.chat_module_lock = false;
	}

	$scope.getDirectoryMainPanelHeight = function(chat)
	{
		if (angular.isUndefinedOrNull(chat))
		{
				return false;
		}
		if ($scope.layout == 1)
		{
			if (chat.topic_location.$value != false)
			{
				
				return $scope.cm_directory_chat_height -20;
			}
			return $scope.cm_directory_chat_height;
			
		}
		if ($scope.layout == 3)
		{
			if (chat.isMandatory)
			{
				if (angular.isDefined(chat) && chat != null && chat.topic_location.$value != false)
				{
					var size = ($scope.cm_directory_chat_height + $scope.vertical_adjust);
					return size;
				}
				var size = (parseInt($scope.cm_directory_chat_height) + parseInt($scope.vertical_adjust));
				return size;
			}
			else
			{
				if (angular.isDefined(chat) && chat != null && chat.topic_location.$value != false)
				{
					var size = ($scope.cm_directory_chat_height - $scope.vertical_adjust);
					return size;
				}
				var size = ($scope.cm_directory_chat_height - $scope.vertical_adjust);
				return size;
			}		
		}				
		
	}
	
	
	$scope.setLayout = function()
	{		
		
		$scope.windowHeight = $window.innerHeight;
		
		if($scope.isChatModuleOpen && $scope.isPageLoaded)
		{
			if ($scope.layout == 1 || $scope.layout == null )
			{
				$scope.chat_module_directory_height = parseInt($scope.windowHeight, 10) || 0;
				
				$scope.chat_module_header_height = parseInt(document.getElementById("cm-directory-header").clientHeight, 10) || 0;
				
				$scope.cm_directory_chat_height = $scope.chat_module_directory_height - $scope.chat_module_header_height;
/* 					console.log($scope.cm_directory_chat_height); */

				$scope.cm_directory_upper_panel = parseInt(document.getElementById("cm-directory-upper-panel").clientHeight, 10) || 0;
				
				$scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.cm_directory_upper_panel;
/* 					console.log($scope.cm_directory_chat_height); */

				$scope.chat_module_nav_height = parseInt(document.getElementById("cm-directory-nav").clientHeight, 10) || 0;
				
/* 					$scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.chat_module_nav_height;
/* 					console.log($scope.cm_directory_chat_height); */
				
				
/* 					$scope.cm_directory_chat_height = Math.floor($scope.cm_directory_chat_height /2); */
/* 					console.log($scope.cm_directory_chat_height); */
				
/* 					$scope.cm_directory_chat_height = $scope.cm_directory_chat_height - 10; */
/* 					console.log($scope.cm_directory_chat_height); */
				
				$scope.cm_directory_chat_message_display_height =  $scope.cm_directory_chat_height - 92;
/* 					console.log($scope.cm_directory_chat_message_display_height); */
				
			}	
			else if ( $scope.layout == 2 )
			{
				$scope.chat_module_directory_height = parseInt($scope.windowHeight / 2, 10) || 0;
				
				$scope.chat_module_header_height = parseInt(document.getElementById("cm-directory-header").clientHeight, 10) || 0;
/* 				console.log($scope.chat_module_header_height); */
				$scope.chat_module_upper_panel_height = parseInt(document.getElementById("cm-directory-upper-panel").clientHeight, 10) || 0;
				
				$scope.chat_module_resize_slider_height_2 = parseInt(document.getElementById("cm-directory-resize-slider-2").clientHeight, 10) || 0;
				
				$scope.chat_module_main_panel_height = $scope.chat_module_directory_height - $scope.chat_module_header_height - $scope.chat_module_upper_panel_height - $scope.chat_module_resize_slider_height_2;
/* 				console.log('main panel: '  + $scope.chat_module_main_panel_height); */
				$scope.cm_chat_message_display_height  = $scope.chat_module_main_panel_height - 80;
/* 				console.log($scope.cm_chat_message_display_height); */
				$scope.chat_module_directory_height = $scope.chat_module_directory_height  + parseInt($scope.vertical_adjust_2);
/* 				console.log($scope.chat_module_directory_height );	 */
				$scope.chat_module_main_panel_height = $scope.chat_module_main_panel_height + parseInt($scope.vertical_adjust_2);
/* 				console.log($scope.chat_module_main_panel_height); */
				$scope.cm_directory_chat_message_display_height = $scope.cm_chat_message_display_height + parseInt($scope.vertical_adjust_2);
				if (!$scope.isPageComplete)
				{
					$scope.cm_directory_chat_message_display_height = $scope.cm_directory_chat_message_display_height - 5;
				}
/* 				console.log($scope.cm_directory_chat_message_display_height);				 */
			}		
			
			else if ($scope.layout == 3 && $scope.isPageLoaded)
			{
/* 				console.log('setting layout 3'); */
				if ($scope.activeChats.length > 0)
				{
					$scope.chat_module_directory_height = parseInt($scope.windowHeight, 10) || 0;
					
					$scope.chat_module_header_height = parseInt(document.getElementById("cm-directory-header").clientHeight, 10) || 0;
					
					$scope.cm_directory_chat_height = $scope.chat_module_directory_height - $scope.chat_module_header_height;
/* 					console.log($scope.cm_directory_chat_height); */
	
					$scope.cm_directory_upper_panel = parseInt(document.getElementById("cm-directory-upper-panel").clientHeight, 10) || 0;
					
					$scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.cm_directory_upper_panel;
/* 					console.log($scope.cm_directory_chat_height); */
					
					$scope.cm_directory_tracker_height = parseInt(document.getElementById("cm-directory-tracker-3").clientHeight, 10) || 0;
					
					$scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.cm_directory_tracker_height;
/* 					console.log($scope.cm_directory_chat_height); */
	
					$scope.chat_module_nav_height = parseInt(document.getElementById("cm-directory-nav").clientHeight, 10) || 0;
					
					$scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.chat_module_nav_height;
/* 					console.log($scope.cm_directory_chat_height); */
					
					$scope.chat_module_resize_slider_height = parseInt(document.getElementById("cm-directory-resize-slider").clientHeight, 0) || 0;
					
					$scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.chat_module_resize_slider_height;
/* 					console.log($scope.cm_directory_chat_height); */

					$scope.chat_module_resize_slider_height_width = parseInt(document.getElementById("cm-directory-resize-slider-width").clientHeight, 0) || 0;
					
					$scope.cm_directory_chat_height = Math.floor($scope.cm_directory_chat_height /2);
/* 					console.log($scope.cm_directory_chat_height); */
					
/* 					$scope.cm_directory_chat_height = $scope.cm_directory_chat_height - 10; */
/* 					console.log($scope.cm_directory_chat_height); */
					
					$scope.cm_directory_chat_message_display_height =  $scope.cm_directory_chat_height - 90;
/* 					console.log($scope.cm_directory_chat_message_display_height); */
				}
			}		
		}
	}
	
	$scope.getChatBoxHeight = function(vertical_adjust)
	{
		return  $scope.cm_chat_message_display_height + parseInt(vertical_adjust) - 75;
	}
	
	$scope.toggleLayout = function()
	{
		if ($scope.layout == 1)
		{
			$scope.switchLayout(2);
		}
		else
		{
			$scope.switchLayout(1);
		}
	}

	$scope.switchLayout = function(layout)
	{
		if (layout == 3 && $scope.activeChats.length == 0 || layout == $scope.layout)
		{
			return false;
		}
		$scope.safeApply(function(){
			$scope.isSettingLayout = true;
			$scope.layout = layout;
			if (UserService._user_settings_location)
			{
				UserService._user_settings_location.update({'layout': layout});
			}
			if (layout == 2)
			{
				$timeout(function() {
					if ($scope.mandatory_index != "contacts")
					{
						document.getElementById($scope.mandatory_index + '_link').click();
					}
					$scope.setLayout();
					$scope.isSettingLayout = false;
				}, 500)
			}
			else if (layout == 3)
			{
				$timeout(function(){
					if (!$scope.directory_chat)
					{
						$scope.setDirectoryChat($scope.stored_directory_index || 0, true);
					}
					document.getElementById($scope.mandatory_index + '_link').click();
					$scope.isSettingLayout = false;
				}, 250)
			}
			else if (layout == 1)
			{
				$timeout(function(){
					
					if ( $scope.mandatory_index == 'contacts')
					{
						$scope.setContactsFocus();
					}
					else
					{
						$scope.setMandatoryFocus($scope[$scope.mandatory_index]);
					}
					$scope.isSettingLayout = false;
				}, 250)
			}
		})
	}
	
	$scope.updateVerticalSize = function()
	{
		UserService._user_settings_location.update({'vertical-adjust': parseInt($scope.vertical_adjust)});
	}
	
	$scope.updateVerticalSize2 = function()
	{
		UserService._user_settings_location.update({'vertical-adjust-2': parseInt($scope.vertical_adjust_2)});
	}
	
	$scope.updateWidthSize = function()
	{
		UserService._user_settings_location.update({'width-adjust': parseInt($scope.width_adjust)});
	}
	
	$scope.isGroupAvailable = function(group)
	{
		if ( group == 'mc')
		{
			if ( UserService._user_profile.mc || UserService._user_profile_role == 'Mentor Coach')
			{
				return true;
			}
		}
		else if ( group == 'admin')
		{
			if (UserService._user_profile.role == 'Administrator' || UserService._user_profile.role == 'Shift Manager')
			{
				return true;
			}
		}
		return false;
	}
	
	$scope.toggleChatModule = function(value)
	{
		if ($scope.layout == 2)
		{
			$scope.isChatModuleOpen = value;
			UserService._user_settings_location.update({'module-open': value});
		}
		if(value)
		{
			$timeout(function()
			{
				$scope.setLayout();
			}, 250)
		}
	}
	
	$scope.closeChatModule = function()
	{
/* 		console.log('closing'); */
		if ($scope.layout != 2)
		{
			if(true)
			{
				$scope.$evalAsync(function()
				{
					$scope.isChatModuleClosing = true;
				});
				$timeout(function(){
					$scope.isChatModuleOpen = false;
					$scope.isChatModuleClosing = false;
				},1000)
				$scope.clearMandatoryList();
				if($scope.directory_chat)
				{
					$scope.directory_chat.isTextFocus = false;
				}
				UserService._user_settings_location.update({'module-open': false});
				
			}			
		}
		else
		{
			UserService._user_settings_location.update({'module-open': false});
		}
	}
	
	$scope.openChatModule = function()
	{
		$scope.isChatModuleClosing = false;
		$scope.chat_module_lock = true;
		$scope.$broadcast('clear_notifications');
		if (UserService._user_settings_location)
		{
			UserService._user_settings_location.update({'module-open': true})	
			
		}
		$scope.$evalAsync(function(){
			$scope.isChatModuleOpening = true;
			$scope.isChatModuleOpen = true;
		})
			
		$timeout(function()
		{
			$scope.$evalAsync(function()
			{
/* 				$scope.detectLayout(); */
				$scope.alertToOpen = false;
				$scope.isChatModuleOpening = false;	
				$scope.setLayout();
			})
		}, 1000)			
	}

	$scope.resetChatUnread = function()
	{
		var i = $scope.activeChats.length;
		while(i--){
			if ($scope.activeChats[i].isopen && i < $scope.max_count)
			{
				$scope.activeChats[i].header_color = ChatService._header_color;
				$scope.activeChats[i].unread = 0;				
			}
		}
	}
	
	$scope.checkForTopic = function(chat)
	{
		if (angular.isUndefinedOrNull(chat) || angular.isUndefinedOrNull(chat.index_position))
		{
			return;
		}
		
		UserService._user_settings_location.child(chat.index_position).once('value', function(snapshot) {
			var chat_settings = snapshot.val();
			if (chat_settings) {
				chat.isSound = chat_settings.isSound;
				chat.monitor = chat_settings.monitor;
			}
		});
		
		$timeout(function(){
			
			if (chat.topic_location.$value == null || chat.topic_location.$value == undefined)
			{
				$scope.safeApply(function() {
					$timeout(function()
					{
						chat.firebase_location.child('topic').set(false);
					});
				})
			}
			else
			{
				if (document.getElementById('topic_' + chat.session_key + '_wrapper'))
				{
					chat.topic_height = document.getElementById('topic_' + chat.session_key + '_wrapper').clientHeight;
				}
				
			}		
		}, 2000)
		
	}
	
	$scope.updateExternalMonitor = function(){
		$scope.external_monitor = !$scope.external_monitor;
		UserService._user_settings_location.update({'external-monitor':$scope.external_monitor});
	}
	
	$scope.updateChatSettings = function(chat){
		UserService._user_settings_location.child(chat.index_position).update({isSound: chat.isSound, monitor: chat.monitor});
	}
	
	$scope.setActiveChatsPriority = function()
	{
		$scope.active_chats_index = -1;
		angular.forEach($scope.activeChats, function(val, key)
		{
			++$scope.active_chats_index;
			if (val.isGroupChat)
			{
				ChatService._active_sessions_user_location.child(val.session_key).setPriority($scope.active_chats_index);
/* 				console.log( val.session_key + ' was set with the priority ' + $scope.active_chats_index); */
			}
			else
			{
				ChatService._active_sessions_user_location.child(val.to_user_id).setPriority($scope.active_chats_index);
/* 				console.log( val.to_user_name + ' was set with the priority ' + $scope.active_chats_index); */
			}
			val.index_position = $scope.active_chats_index;
			ChatService._active_sessions_user_location.child(val.to_user_id || val.session_key).update({'index_position': $scope.active_chats_index}); 
			
		});
	}
	
/*
	$scope.setActiveChatsResizeAjustments= function()
	{
		var i = -1;
		angular.forEach($scope.activeChats, function(val, key)
		{
			++i;
			ChatService._active_sessions_user_location.child(val.to_user_id || val.session_key).update({'resize-adjust': val.resize_adjustment}); 
		});
	}
*/
	
	$scope.updateChatResize = function(chat)
	{
		ChatService._active_sessions_user_location.child(chat.to_user_id || chat.session_key).update({'resize_adjust': chat.resize_adjustment}); 
	}

	$scope.toggleUserList = function(chat)
	{
		chat.showUserList = !chat.showUserList;
	}
	
	$scope.removeActiveUser = function(chat,user){
		chat.group_user_location.child(user).set(null);
	}

	
	$scope.toggleUserOptions = function(chat)
	{
		if ( chat.isopen == false)
		{
			 chat.isopen = true;
		}
		chat.showUserOptions = !chat.showUserOptions;
	}
	
	$scope.tagChatOn = function(chat)
	{
		$scope.clear(chat);
		chat.showTagOption = true;
		chat.isTagFocus = true;
		chat.isTopSpacer = true;
	}
	
	$scope.removeTag = function(chat)
	{
		ChatService._active_sessions_user_location.child(chat.to_user_id || chat.session_key).update({tag:null});
		chat.tag = null;
	}
	
	
	
	$scope.tagChatOff = function(chat)
	{
		chat.showTagOption = false;
	}
	
	$scope.clear = function(chat)
	{
		if ( angular.isDefined(chat.close_invite))
		{
			clearInterval(chat.close_invite);
		}	
		chat.showUserOptions = false;
		chat.nudge = false;
		chat.showUserList = false;
		chat.showTagOption = false;
		chat.showProfile = false
		chat.addTopicOn = false;
		chat.isTopSpacer = false;
		chat.invite = false;
		chat.isTagFocus = false;
		chat.isTopicFocus = false;
		chat.emotions = false;
		chat.invited = '';
		chat.reference = null;
	    chat.referenceName = null;
	    chat.referenceText = null;
	    chat.unread = 0;
	    chat.header_color = ChatService._header_color;
	    chat.isNewMessage = false;
	    if(chat.topic_location){
	    	if(!chat.topic_location.$value){
		    	 chat.topic_height = 0;
	    	} else {
		    	chat.topic_height = document.getElementById('topic_' + chat.session_key + '_wrapper').clientHeight || 0;
	    	}
	    }
	}
	
	$scope.clearDirectory = function(chat)
	{
		if ( angular.isUndefinedOrNull(chat))
		{
			return false;
		}
		chat.showUserOptions = false;
		chat.showUserList = false;
		chat.showTagOption = false;
		chat.scroll_bottom = false;
		chat.nudge = false;
		chat.addTopicOn = false;
		chat.isTopicFocus = false;
		chat.emotions = false;
		chat.reference = null;
	    chat.referenceName = null;
	    chat.referenceText = null;
	    chat.unread = 0;
	    chat.isNewMessage = false;
	    $scope.showNavMenu = false;
	    chat.invite = false;
	    if(chat.topic_location){
	    	if(!chat.topic_location.$value){
		    	 chat.topic_height = 0;
	    	} else {
		    	chat.topic_height = document.getElementById('topic_' + chat.session_key + '_wrapper').clientHeight || 0;
	    	}
	    }
	    
	}
	
	$scope.updateTag = function(chat)
	{
		if ( angular.isDefined(chat.tag_description) && chat.tag_description.length > 2 && chat.tag_description.length <= 20)
		{
			ChatService._active_sessions_user_location.child(chat.to_user_id || chat.session_key).update({tag:chat.tag_description});
			$scope.clear(chat);
			chat.tag_description = String(chat.tag_description).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
			if ( chat.isgroupChat )
			{
				chat.tag_description = 'Group - #' + chat.tag_description;
			}
			else
			{
				chat.tag_description = '#' + chat.tag_description;
			}
			chat.tag = chat.tag_description;
			chat.tag_description = '';
			chat.isTextFocus = true;
			
		}
		return false;	
	}
	
	$scope.addTopicOn = function(chat)
	{
		$scope.clear(chat);
		chat.addTopicOn = true;
		chat.isTopicFocus = true;
		chat.isTopSpacer = true;
	}
	
	$scope.toggleTopic = function(chat)
	{
		if (chat.topic_location.$value.length > 30)
		{
			chat.isTopicTruncated = !chat.isTopicTruncated;
		}
		$scope.safeApply(function(){
			$timeout(function(){
				$scope.getTopicHeight(chat);
			})	
		})
	}
	
	$scope.getTopicHeight = function(chat)
	{
		if(chat.topic_location.$value != false && chat.topic_location.$value != null )
		{
			chat.topic_height = document.getElementById('topic_' + chat.session_key + '_wrapper').clientHeight;
		}
		else
		{
			chat.topic_height = 0;
		}
	}
	
	$scope.removeTopic = function(chat)
	{
		if ( angular.isDefined(chat.firebase_location) )
		{
			chat.firebase_location.update({topic:false});
			chat.topic_description = '';
			chat.topic_height = 0;
			chat.addTopicOn = false;
		}
	}
	
	$scope.addTopic = function(chat)
	{
/* 		console.log('adding topic'); */
		if ( angular.isDefined(chat.topic_description) && chat.topic_description.length > 5 && chat.topic_description.length <= 36)
		{
			
			if ( angular.isDefined(chat.firebase_location) )
			{
			   chat.firebase_location.update({topic:chat.topic_description});
			}
			else if ( angular.isDefined(chat.active_session_location ) )
			{
				  chat.active_session_location.update({topic:chat.topic_description});
			}
			$scope.clear(chat);
			chat.isTextFocus = true;
		}
		return false;	
	}
	
	$scope.addDirectoryTopic = function(chat)
	{
		if ( angular.isDefined(chat.topic_description) && chat.topic_description.length > 5 && chat.topic_description.length <= 36)
		{
			chat.topic_description = String(chat.topic_description).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
			chat.isTextFocus = true;
			if ( angular.isDefined(chat.firebase_location) )
			{
			   chat.firebase_location.update({topic:chat.topic_description});
			}
			$scope.clearDirectory(chat);
		}
		return false;	
		
	}
	
	$scope.updateTopic = function(chat)
	{
		var new_topic = String($( '#topic_' + chat.session_key ).text()).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string
		if (new_topic == 'null' || new_topic == '' || new_topic.length < 5 )
		{
			return false;
		}
		if ( angular.isDefined(chat.firebase_location) )
		{
		   chat.firebase_location.update({topic:new_topic});
		}
		else if ( angular.isDefined(chat.active_session_location ) )
		{
			  chat.active_session_location.update({topic:chat.new_topic});
		}
		$scope.getTopicHeight(chat);
		$scope.clear(chat);
		chat.isTextFocus = true;
		return false;	
	}
	
	$scope.updateDirectoryTopic = function(chat)
	{
		var new_topic = String($( '#topic_' + chat.session_key ).text()); // sanitze the string
		if (new_topic == 'null' || new_topic == '' || new_topic.length < 5 )
		{
			return false;
		}
		if ( angular.isDefined(chat.firebase_location) )
		{
		   chat.firebase_location.update({topic:new_topic});
		}
		$scope.clearDirectory(chat);
		chat.isTextFocus = true;
		return false;	
	}
	
	$scope.inviteToggle = function(chat)
	{
		$scope.clear(chat);
		chat.invite = !chat.invite;
		if ( angular.isUndefined(chat.invite_list) )
		{
			chat.invite_list = Array();
		}
		if ( angular.isDefined(chat.close_invite) )
		{
			clearInterval(chat.close_invite)
		}	
		if ( chat.invite === true )
		{
			chat.showUserOptions = false;
			chat.invite_list = Array();
			angular.forEach($scope.online_users_list, function(val, key)
			{
				if ( $scope.isGroupChatEligibile(chat, val))
				{
					chat.invite_list.push( {avatar: val.avatar, name: val.name, user_id : val.user_id} );
				}			
			});
			$scope.watch_text  = chat.chat_text;
			$scope.last_invite_text = chat.chat_text;
			chat.close_invite = setInterval(function()
			{
				$scope.clear(chat);
				chat.isTextFocus = true;
				clearInterval(chat.close_invite);
			}, 15000);				
		}
	}
	
	
	$scope.isGroupChatEligibile = function(chat, user)
	{
		if (user.user_id == UserService._user_profile.user_id)
		{
			return false;
		}
		if ( user.user_id in chat.user_log)
		{
			return false;
		}
		return true;
	}
	
	$scope.closeInvite = function(chat) 
	{
		$scope.clear(chat);
		chat.isTextFocus = true;
		chat.invited = '';
	}
	
	$scope.resetTyping = function(chat)
	{
		if (angular.isUndefined(chat) || chat == null)
		{
			return false;
		}
		if ( angular.isDefined(chat.typing_presence_timeout) )
		{
			clearInterval(chat.typing_presence_timeout);
		}
		if (angular.isDefined(chat.active_typing_to_user_location))
		{
			chat.active_typing_to_user_location.update({'is-typing' : false});
		}
	}
	
	
	$scope.showAsTyping = function(chat)
	{
		if ( angular.isUndefined(chat.chat_text) || chat.chat_text == null)
		{
/* 			console.log('returning false'); */
			return false;
		}
		if ( angular.isDefined(chat.typing_presence_timeout) )
		{
			$timeout.cancel(chat.typing_presence_timeout);
		}
		chat.active_typing_to_user_location.update({'is-typing' : true});
		chat.typing_presence_timeout = $timeout(function()
		{
			chat.active_typing_to_user_location.update({'is-typing' : false});
			$timeout.cancel(chat.typing_presence_timeout);
			chat.typing_presence_timeout = null;
		}, 2000);				
	}
	
	$scope.isGroupTyping = function(chat)
	{
		if ( !chat || chat.chat_text == null || UtilityService.firebase_connection == false)
		{
			return false;
		}
		/*
if ( angular.isUndefined(chat) || angular.isDefined(chat.group_chats) && chat.group_chats.length < 1 || chat.chat_text == null  )
		{
			return false;
		}
		var user_id = UserService._user_profile.user_id;
		var avatar = UserService._user_profile.avatar;
*/
		if (chat.typing_presence_timeout)
		{
			$timeout.cancel(chat.typing_presence_timeout);
		}
/* 		chat.firebase_location.child('is-typing').update({ UserService._user_profile.user_id : avatar});	 */
		chat.firebase_location.child('is-typing/' + UserService._user_profile.user_id).set(UserService._user_profile.avatar);	
		chat.typing_presence_timeout = $timeout(function()
		{
/* 			chat.firebase_location.child('is-typing').update({ UserService._user_profile.user_id : null}); */
			chat.firebase_location.child('is-typing/' + UserService._user_profile.user_id).set(null);	
			$timeout.cancel(chat.typing_presence_timeout);
		}, 750);			
	}
	
	
	$scope.toggleChatBox = function(chat)
	{
		chat.isopen = !chat.isopen;
		if ( chat.isopen  === true) 
		{
			chat.header_color = ChatService._header_color;
			chat.unread = 0;
			chat.isTextFocus = true;
			$scope.getTimeReference(chat);
		}
		else
		{
			
			$scope.clear(chat);
		}
		$scope.getTopicHeight(chat);
		ChatService.__updateIsOpen(chat);
	}
	
	$scope.pingHost = function()
	{
		if (!$scope.chat_ping){return false;}
		$scope.isHost = false;
		clearInterval($scope.network_failure);
		clearInterval($scope.monitor_pop);
		clearInterval($scope.pop_request);
		clearInterval($scope.google_failure);
		clearInterval($scope.monitor_google);
		UtilityService.isHostReachable($scope,  "/components/com_callcenter/views/training/ng/img//script-badge.png?rand=");
		$scope.network_failure = setInterval(function()
		{
			if ($scope.isHost )
			{
				clearInterval($scope.network_failure);
				if (UtilityService._network == false )
				{
					$rootScope.$broadcast('network_online' );
				}
				if (  UtilityService._portal_online == false)
				{
					$rootScope.$broadcast('portal_online' );
				}
/* 				console.log('ping was successful'); */
				
			}
			else
			{
				$rootScope.$broadcast('portal_offline' );
	/* 			console.log('2. POP was ' + $scope.isHost);		 */
				$scope.monitor_pop = setInterval(function()
				{
					$scope.isHost = false;
					UtilityService.isHostReachable($scope, "/components/com_callcenter/views/training/ng/img//script-badge.png?rand=" );
					$scope.pop_request = setInterval(function()
					{
						if ($scope.isHost )
						{
	/* 						console.log('1. Pop was ' + $scope.isHost); */
							clearInterval($scope.monitor_pop);
							$rootScope.$broadcast('portal_online' );
						}
						clearInterval($scope.pop_request);		
					}, 1000);
				}, 4000);			
				$scope.isHost = false;
				UtilityService.isHostReachable($scope,  "//www.google.com/favicon.ico?rand=");
				$scope.google_failure = setInterval(function()
				{
					if ($scope.isHost )
					{
						$rootScope.$broadcast('network_online' );
	/* 					console.log('1. Google was ' + $scope.isHost); */
						clearInterval($scope.network_failure);
					}
					else
					{
	/* 					console.log('2. Google was ' + $scope.isHost); */
						$rootScope.$broadcast('network_offline' );
						if ( BrowserService.browser ="FireFox")
						{
							$rootScope.$broadcast('browser_offline' );
						}
						$scope.monitor_google = setInterval(function()
						{
							$scope.isHost = false;
							if (Offline)
							{
								Offline.interceptRequests = false;
							}
							UtilityService.isHostReachable($scope,  "//www.google.com/favicon.ico?rand=");
							$scope.google_request = setInterval(function()
							{
								if ($scope.isHost )
								{
									if (Offline)
									{
										Offline.interceptRequests = true;
									}
									
	/* 								console.log('1. Google was ' + $scope.isHost); */
									clearInterval($scope.monitor_google);
									$rootScope.$broadcast('network_online' );
									if ( BrowserService.browser ="FireFox")
									{
										$rootScope.$broadcast('browser_online' );
									}
								}
	/* 							console.log('google_request'); */
								clearInterval($scope.google_request);		
							}, 1000);
	/* 					console.log('google_monitor'); */
						}, 4000);
					}
					clearInterval($scope.google_failure);
				}, 5000);
			clearInterval($scope.network_failure);
			}
		},4000)
	}

	$scope.setNextChatFocus = function(index)
	{
		if ($scope.activeChats.length == 1)
		{
			$log.debug('returning false');
			return false;
		}
		var next;
		$scope.activeChats[index].unread = 0;
		$scope.activeChats[index].isTextFocus = false;
		$scope.activeChats[index].isNewMessage = false;
		if ($scope.layout != 2)
		{
			$log.debug('setting next');
			if ( $scope.priority_queue.length > 0)
			{
				next = $scope.priority_queue.pop();
				$log.debug('next from priority is ' + next);
			}
			else
			{
				next = index + 1;
			}			
			if ( next > $scope.activeChats.length - 1 )
			{
				next = 0;		
			}
			$log.debug('next is ' + next);
			$timeout(function(){
				$scope.directory_index = next;
				$scope.setDirectoryChat(next, true);
				$scope.referenceDirectoryItem();			
			}, 250)			
			return;
		}
		else if ($scope.layout == 2)
		{
			var next = index - 1;
			$scope.activeChats[index].isTextFocus = false;
			if ( next < 0 )
			{
				next = $scope.activeChats.length -1;			
			}
			if ( next >= $scope.max_count)
			{
				next = $scope.max_count-1;
			}
			$scope.activeChats[next].isopen = true;
			$scope.activeChats[next].isTextFocus = true;
			return;		
		}	
	}
	
	
	$scope.clearHistory = function(chat){
		chat.chats = Array();
		chat.group_chats = Array();
		chat.chat_log = Array();
/* 		chat.isMorePrev = false; */
		if (chat.isDirectoryChat)
		{
			$scope.clearDirectory(chat);
		}
		else
		{
			$scope.clear(chat);
		}
			
		

	}
	
	$scope.checkForCommand = function(chat)
	{
		if (chat.chat_text == $scope.command_key + 'c' )
		{
			$scope.toggleChatBox(chat);
		}
		else if (chat.chat_text == $scope.command_key + 'q')
		{
			$scope.removeChatSession(chat);
		}
		else if (chat.chat_text == $scope.command_key + 'clear' || chat.chat_text == $scope.command_key + 'clr')
		{
			chat.chats = Array();
			chat.chat_log = Array();
			chat.isMorePrev = false;
			
		}
		else if (chat.chat_text == $scope.command_key + 's')
		{
			$scope.toggleChatSound(chat)
		}
		else if (chat.chat_text == $scope.command_key + 'at')
		{
			$scope.tagChatOn(chat)
		}
		else if (chat.chat_text == $scope.command_key + 'rt')
		{
			$scope.removeTag(chat);
		}
		else if (chat.chat_text == $scope.command_key + 'last')
		{
			$scope.moveChatToLast(chat.index_position);
			if($scope.layout != 2)
			{
				$scope.setDirectoryChat($scope.activeChats.length - 1, true)
			}   		
		}
		
		else if (chat.chat_text == $scope.command_key + 'first')
		{
			$scope.moveChatToFirst(chat.index_position);
			if($scope.layout != 2)
			{
				$scope.setDirectoryChat(0, true)
			} 		
		}
		
		else if (chat.chat_text == $scope.command_key + 'chat')
		{
			console.log(chat);	
		}
		
		else if (chat.chat_text == $scope.command_key + 'chats')
		{
			console.log(chat.chats);
			console.log(chat.group_chats);		
		}
		
		else if (chat.chat_text == $scope.command_key + 'self')
		{
			console.log(chat);	
		}
		
		else if (chat.chat_text == $scope.command_key + 'user')
		{
			console.log(UserService._user_profile);	
		}
		
		else if (chat.chat_text == $scope.command_key + 'scope')
		{
			console.log($scope);	
		}
		
		else if (chat.chat_text == $scope.command_key + 'browser')
		{
			chat.chat_text = BrowserService.platform.browser + " | " + BrowserService.platform.browserVersion + " | " + BrowserService.platform.os + ' - ' + BrowserService.platform.osVersion + ' |';
			$scope.addChatMessage(chat);
		}
		else if (chat.chat_text == $scope.command_key + 'os')
		{
			chat.chat_text = BrowserService.platform.os + ' | ' + BrowserService.platform.osVersion;
			$scope.addChatMessage(chat);
		}
		else if (chat.chat_text == $scope.command_key + 'platform')
		{
			console.log(BrowserService.platform);
		}
		
		else if (chat.chat_text == $scope.command_key + 'online')
		{
			console.log(UserService._online_users_list);
		}
		else if (chat.chat_text == $scope.command_key + 'offline')
		{
			console.log(UserService._offline_users_list);
		}
		else if (chat.chat_text == $scope.command_key + 'profiles')
		{
			console.log(UserService._users_profiles_obj);
		}
		
		else if (chat.chat_text == $scope.command_key + 'ping')
		{
			$scope.runPingTest(chat);
		}

		else if (chat.chat_text == $scope.command_key + 'require-refresh')
		{
			console.log('require-refresh requested');
			if ($scope.admin_group.indexOf(UserService._user_profile.position) != -1){
				console.log('request allowed');
				UserService.__requireRefresh();	
			} else{
				console.log('refresh denied');
				console.log(UserService._user_profile.position + ' not in admin');
			}
		}
		chat.chat_text = null;
		return;		
	}
	$scope.inAdminGroup = function()
	{
		$log.debug(UserService._user_profile.position);
		if ($scope.admin_group.indexOf(UserService._user_profile.position) != -1){
		return true;
		}
		return false;
	}
	

	$scope.addChatMessage= function(chat)
	{
/* 		console.log(chat.chat_text); */
		if ( angular.isUndefined(chat.chat_text) || chat.chat_text == null)
		{
			$scope.setNextChatFocus(chat.index_position);
		}
		else if ( chat.chat_text.substring(0,1) == $scope.command_key)
		{
			$scope.checkForCommand(chat);
			return;
		}
		else if (angular.isDefined(chat.chat_text) && chat.chat_text != ''  && chat.chat_text.length < 1000)
		{
			if ( angular.isUndefined(chat.to_user_session ) || chat.to_user_session === null )
			{
				var chat_delay = 500;
				$scope.locationValue = '';
				ChatService.__getLocationValue(chat.to_user_session_location, $scope);
				chat.to_user_session = $scope.locationValue;						
			}
			else 
			{
				chat_delay = 0;
			}

/* 			var chat_text = String(chat.chat_text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string */	
			chat.scroll_bottom = false;
			var chat_text = chat.chat_text;
			chat.chat_text = null;
			chat.unread = 0;
/* 			var d = new Date(); */
			var n = Firebase.ServerValue.TIMESTAMP;
			clearInterval(chat.typing_presence_timeout);
			if ( UserService.encryption === true)
			{
				var session_key = sjcl.encrypt(ENCRYPT_PASS, chat.session_key);
				chat_text = sjcl.encrypt(chat.session_key, chat_text);				
			}
			if (chat.reference)
			{
/* 				console.log(chat.reference); */
			}		
			$timeout(function(){
				var toFirekey = chat.to_user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name,  to: chat.to_user_id, text: chat_text, encryption: UserService.encryption, offline: !(chat.to_user_online.$value),  reference: chat.reference, referenceAuthor: chat.referenceAuthor, referenceName:chat.referenceName, referenceText: chat.referenceText, time: n, priority: chat.next_priority, 'session_key': session_key|| chat.session_key}); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
				chat.to_user_last_chat = toFirekey.name();
				chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
				var selfFireKey = chat.user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name, to: chat.to_user_id, text: chat_text, encryption: UserService.encryption, offline: !(chat.to_user_online.$value),  reference: chat.reference, referenceAuthor: chat.referenceAuthor, referenceName:chat.referenceName, referenceText: chat.referenceText, time: n, priority: chat.next_priority, 'session_key': session_key || chat.session_key }); // assign this task after sending to the to_user location !important
				chat.user_last_chat = selfFireKey.name();
				chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
			},chat_delay);
			chat.active_typing_to_user_location.update({'is-typing' : false});
			ChatService.__updateToUserActiveSession(chat);
			$scope.pingHost();
			$timeout(function()
			{
				chat.reference = null;
				chat.referenceAuthor = null;
				chat.referenceName = null;
				chat.referenceText = null;
				if (chat.scroll_top == true)
				{
					chat.scroll_top = false
				};
				chat.scroll_bottom = true;
			},(chat_delay + 250))	
			$scope.directory_index = chat.index_position;
					
		}
	}
	
	$scope.getPrivateKey = function(key)
	{
		$log.debug('getting private key');
		if (UserService._user_profile.role == 'PlusOne Admin' && $scope.isPageComplete)
		{
			$log.debug('ALLOWED private key');
			return key;
/* 			return sjcl.decrypt(ENCRYPT_PASS,key) */
		}
		$log.debug('DENIED private key');
		return null;
	}
		
	$scope.addGroupChatMessage= function(chat)
	{
		if ( angular.isUndefined(chat.chat_text) || chat.chat_text == null)
		{
			$scope.setNextChatFocus(chat.index_position);
			return;
		}
		else if ( chat.chat_text.substring(0,1) == $scope.command_key)
		{
			$scope.checkForCommand(chat);
		}
		else if (chat.chat_text != '')
		{
			chat.scroll_bottom = false;
/* 			var chat_text = String(chat.chat_text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string */
			var chat_text = chat.chat_text;
			if ( UserService.encryption === true)
			{
				var session_key = sjcl.encrypt(ENCRYPT_PASS, chat.session_key);
				chat_text = sjcl.encrypt(chat.session_key, chat_text);				
			}
/* 			var d = new Date(); */
			var n = Firebase.ServerValue.TIMESTAMP;
			var firekey = chat.group_message_location.push({author: UserService._user_profile.user_id, authorName : UserService._user_profile.name, avatarId: UserService._user_profile.avatar, encryption: UserService.encryption, reference: chat.reference, referenceAuthor: chat.referenceAuthor, referenceName:chat.referenceName, referenceText: chat.referenceText,  to: chat.session_key, text: chat_text, time: n, priority: chat.next_priority, 'session_key': session_key || chat.session_key});
			chat.user_last_chat = firekey.name();
			chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
		    chat.chat_text = null;
		    chat.unread = 0;	
		    
		    $timeout(function()
		    {
		    	chat.reference = null;
				chat.referenceAuthor = null;
				chat.referenceName = null;
				chat.referenceText = null;
		    	if (chat.scroll_top == true)
				{
					chat.scroll_top = false
				};
				chat.scroll_bottom = true;	    
		    },250)
			$timeout(function()
			{
				chat.scroll_bottom = false;					
			},500);
			
			
			$scope.pingHost();
		}
	}

	$scope.to_trusted = function(html_code) {
	    return $sce.trustAsHtml(html_code);
	}

	$scope.logValue = function(value)
	{
		$log.debug(value);
	}

	//ng-init="isMessagePastHour(message, directory_chat.time_reference); isLastMessagePastMinute(message, directory_chat.chats[$index-1].time); isAuthorSameAsLast(message, directory_chat.chat_log[$index-1]); isMessageFromUser(message);
	
	
	$scope.setChatMessage = function(message, chat, index)
	{
		if(chat.isGroupChat == false)
		{
			if (index - 1 > -1)
			{
				$scope.checkTimeLapse(message, chat.chats[index-1].time, chat.chats, index-1)
				$scope.isMessagePastHour(message, chat.time_reference);
				$scope.isLastMessagePastMinute(message, chat.chats[index-1].time);
				$scope.isAuthorSameAsLast(message, chat.chat_log[index-1]);
				$scope.isMessageFromUser(message);			
			}
			else
			{
				$scope.isMessagePastHour(message, chat.time_reference);
				$scope.isLastMessagePastMinute(message, chat.time_reference);
				$scope.isAuthorSameAsLast(message, 0);
				$scope.isMessageFromUser(message);
			}				
		}
		else
		{
			if (index - 1 > -1 && chat.group_chats[index-1].time)
			{
				$scope.getAuthorFirstName(message);
				$scope.checkTimeLapse(message, chat.group_chats[index-1].time, chat.group_chats, index-1)
				$scope.getAuthorAvatar(message, chat.user_details);
				$scope.isMessagePastHour(message, chat.time_reference);
				$scope.isLastMessagePastMinute(message, chat.group_chats[index-1].time);
				$scope.isAuthorSameAsLast(message, chat.group_chat_log[index-1]);
				$scope.isMessageFromUser(message);
			}
			else
			{
				$scope.getAuthorFirstName(message);
				$scope.getAuthorAvatar(message, chat.user_details);
				$scope.isMessagePastHour(message, chat.time_reference);
				$scope.isLastMessagePastMinute(message, 0);
				$scope.isAuthorSameAsLast(message, 0);
				$scope.isMessageFromUser(message);
			}
		}
	}	    
	
	$scope.getAuthorAvatar = function(message, user_details)
	{
		if  ( message.author == ChatService._internal_reference)
		{
			message.avatar = false;
			return;
		}
		else if ( angular.isDefined(UserService._users_profiles_obj['user_' + message.author]) )
		{
			message.avatar = '/components/com_callcenter/images/avatars/' + UserService._users_profiles_obj['user_' + message.author].avatar + '-90.jpg';
			return;
		}
		else if ( angular.isDefined(user_details[message.author]) )
		{
			message.avatar = '/components/com_callcenter/images/avatars/' + user_details[message.author].avatar + '-90.jpg';
			return;
		}
		if (angular.isDefined(message.avatarId))
		{
			message.avatar = '/components/com_callcenter/images/avatars/' + message.avatarId + '-90.jpg';
			return;
		}
/* 		console.log(message); */
		
	}
	
	
	$scope.getAuthorFirstName = function(message)
	{
		if (message.authorName)
		{
			var name_split = message.authorName.match(/\S+/g); // splits the to_users first and last name
			message.author_f_name = name_split[0];
		}
		
	}
	
	$scope.isMessagePastHour = function(message, time_reference)
	{
		if ( ((3600000 + message.time) - time_reference) <= 0)
		{
			message.past_hour = true
		}
		else
		{
			message.past_hour = false;
		}
	}
	
	$scope.checkTimeLapse = function(message, prev_chat_time, chats, prev_index)
	{
		if ( prev_index > -1 )
		{
			if  (((120000 + prev_chat_time) - message.time)  <= 0)
			{
				message.time_lapse = true;
				chats[prev_index].was_time_lapse = true;
			}
			else
			{
				message.time_lapse = false;
				chats[prev_index].was_time_lapse = false;
			}			
		}
	}
	
	$scope.isLastMessagePastMinute = function(message, prev_chat_time)
	{
		if  (((60000 + prev_chat_time) - message.time)  <= 0)
		{
			message.minute_from_last = true;
		}
		else
		{
			message.minute_from_last = false;
		}
	}
	
	$scope.isAuthorSameAsLast = function(message, prev_author)
	{
		if ( prev_author == message.author)
		{
			message.from_prev_author = true;
		}
		else
		{
			message.from_prev_author = false;
		}	
	}
	
	$scope.isMessageFromUser = function(message)
	{
		if ( message.author == UserService._user_profile.user_id )
		{
			message.author_is_self = true;
		}
		else
		{
			message.author_is_self = false;
		}
	}
	
	$scope.getTimeReference= function(chat)
	{
		chat.time_reference = new Date().getTime();
	}

	$scope.removeChatSession= function(chat)
	{
		$scope.last_deactivated_chat = chat.to_user_id || chat.session_key;
		$timeout(function()
		{
			ChatService.__deactivate_session_from_user_location(chat, $scope, true,  true);			
		},250);
		
	}
	
	$scope.nudgeUser = function(chat)
	{
		ChatService.__updateToUserActiveSession(chat);
		$timeout(function(){
			ChatService.__nudgeUser(chat);
			var n = Firebase.ServerValue.TIMESTAMP;
			var chat_text = $scope.to_trusted('<i class="fa fa-bolt"></i> ' + chat.to_user_f_name + ' has been nudged. <i class="fa fa-bolt"></i>');
			chat.chats.push({
				author: ChatService._internal_reference,
				to: chat.to_user_id,
				text: chat_text,
				time: n,
				priority: -1,
				session_key: chat.session_key
			});
			chat.chat_log.push(ChatService._internal_reference);
			if(chat.isDirectoryChat)
			{
				$scope.clearDirectory(chat);
			}
			else
			{
				$scope.clear(chat);
			}
		}, 1000);
	}

	$scope.addEmoji = function(emoji, chat) {
		chat.emotions = false;
		if (angular.isUndefinedOrNull(chat.chat_text ))
		{
			chat.chat_text = '';
		}
		chat.chat_text = chat.chat_text + emoji + ' ';
		chat.isTextFocus = true;		
	}
	
	$scope.toggleEmoji =function(chat) {
		chat.emotions = !chat.emotions;
	}
	
	$scope.chat_sound = new Howl({
	  urls: ['/components/com_callcenter/views/training/ng/js/chat.mp3'],
	  volume: 0.05
	});
	
	
	$scope.mute = function()
	{
		NotificationService.__mute()
		
	}
	
	$scope.unmute = function()
	{
		NotificationService.__unmute()
	}
	 
	$scope.toggleChatSound = function(chat)
	{
		chat.isSound = !chat.isSound;
		ChatService.__updateIsSound(chat.to_user_id || chat.session_key, chat.isSound);
		$scope.clear(chat);
	}
	
	$scope.toggleVideo = function(chat)
	{
		$scope.video.heading = '';
	    $scope.video.url = '';
	    $scope.video.code = '';
	    $scope.video.message = '';
		chat.addVideo = !chat.addVideo;
		$scope.clear(chat);
		
	}
	
	$scope.toggleAudio = function(chat)
	{
		$scope.audio.heading = '';
		$scope.audio.heading = '';
		$scope.audio.url = '';
		$scope.audio.cid = '';
		chat.addAudio = !chat.addAudio;
		
		$scope.clear(chat);
	}
	
	$scope.initAudio = function(message)
	{
		if (message.showAudio)
		{
			message.showAudio = !message.showAudio;
			return false;
		}
		if (message.cid)
		{
			AudioService.asyncMessage($scope, message, message.cid);
		}
		else if (message.audio && angular.isUndefined(message.init_audio))
		{
			message.audio = $sce.trustAsResourceUrl(message.audio);
		}
		if (angular.isUndefined(message.init_audio))
		{
			$timeout(function(){
				message.init_audio = true;
				message.showAudio = !message.showAudio;
			}, 1000);
		}
		else
		{
			message.showAudio = !message.showAudio;
		}
	}
	
	$scope.toggleImage = function(chat)
	{
		chat.addImage = !chat.addImage;
		if(!chat.addImage)
		{
			$scope.image.url = '';
			$scope.image.heading = '';
			$scope.image.message = '';
		}
		$scope.clear(chat);
	}
	
	$scope.getTrustedUrl = function(message)
	{
		if (message && message.audio)
		{
			message.audio = $sce.trustAsResourceUrl(message.audio);
		}
	}
	
	$scope.addVideoMessage = function(chat){
		chat.scroll_bottom = false;
		var n = Firebase.ServerValue.TIMESTAMP;
		if (chat.isGroupChat)
		{
			var firekey = chat.group_message_location.push({author: UserService._user_profile.user_id, authorName : UserService._user_profile.name, avatarId: UserService._user_profile.avatar, encryption: UserService.encryption, to: chat.session_key, text: $scope.video.message, code: $scope.video.code, heading: $scope.video.heading, time: n, priority: chat.next_priority, 'session_key': chat.session_key});
			chat.user_last_chat = firekey.name();
			chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
		}
		else
		{
			var toFirekey = chat.to_user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name,  to: chat.to_user_id, text: $scope.video.message, code: $scope.video.code, heading: $scope.video.heading, encryption: UserService.encryption, offline: !(chat.to_user_online.$value),  time: n, priority: chat.next_priority, 'session_key':chat.session_key}); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
			chat.to_user_last_chat = toFirekey.name();
			chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
			var selfFireKey = chat.user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name, to: chat.to_user_id, text: $scope.video.message, code: $scope.video.code, heading: $scope.video.heading, encryption: UserService.encryption, offline: !(chat.to_user_online.$value), time: n, priority: chat.next_priority, 'session_key':chat.session_key }); // assign this task after sending to the to_user location !important
			chat.user_last_chat = selfFireKey.name();
			chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
			ChatService.__updateToUserActiveSession(chat);
			
		}
	    $scope.video.heading = '';
	    $scope.video.url = '';
	    $scope.video.code = '';
	    $scope.video.message = '';
	    chat.unread = 0;	
	    
	    $timeout(function()
	    {
	    	if (chat.scroll_top == true)
			{
				chat.scroll_top = false
			};
			chat.scroll_bottom = true;	    
	    },250)
		$timeout(function()
		{
			chat.scroll_bottom = false;					
		},500);
		chat.addVideo = false;
	}
	
	$scope.addAudioMessage = function(chat){
		chat.scroll_bottom = false;
		var n = Firebase.ServerValue.TIMESTAMP;
		$log.debug($scope.audio.cid);
		$log.debug($scope.audio.url);
		if ($scope.audio.cid.length == 10)
		{
			if (chat.isGroupChat)
			{
				var firekey = chat.group_message_location.push({author: UserService._user_profile.user_id, authorName : UserService._user_profile.name, avatarId: UserService._user_profile.avatar, encryption: UserService.encryption, to: chat.session_key, text: $scope.audio.message, cid: $scope.audio.cid, heading: $scope.audio.heading, time: n, priority: chat.next_priority, 'session_key': chat.session_key});
				chat.user_last_chat = firekey.name();
				chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
			}
			else
			{
				var toFirekey = chat.to_user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name,  to: chat.to_user_id, text: $scope.audio.message, cid: $scope.audio.cid, heading: $scope.audio.heading, encryption: UserService.encryption, offline: !(chat.to_user_online.$value),  time: n, priority: chat.next_priority, 'session_key':chat.session_key}); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
				chat.to_user_last_chat = toFirekey.name();
				chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
				var selfFireKey = chat.user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name, to: chat.to_user_id, text: $scope.audio.message, cid: $scope.audio.cid, heading: $scope.audio.heading, encryption: UserService.encryption, offline: !(chat.to_user_online.$value), time: n, priority: chat.next_priority, 'session_key':chat.session_key }); // assign this task after sending to the to_user location !important
				chat.user_last_chat = selfFireKey.name();
				chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
				ChatService.__updateToUserActiveSession(chat);
				
			}
		}
		else
		{
			if (chat.isGroupChat)
			{
				var firekey = chat.group_message_location.push({author: UserService._user_profile.user_id, authorName : UserService._user_profile.name, avatarId: UserService._user_profile.avatar, encryption: UserService.encryption, to: chat.session_key, text: $scope.audio.message, audio: $scope.audio.url.toString(), heading: $scope.audio.heading, time: n, priority: chat.next_priority, 'session_key': chat.session_key});
				chat.user_last_chat = firekey.name();
				chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
			}
			else
			{
				var toFirekey = chat.to_user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name,  to: chat.to_user_id, text: $scope.audio.message, audio: $scope.audio.url.toString(), heading: $scope.audio.heading, encryption: UserService.encryption, offline: !(chat.to_user_online.$value),  time: n, priority: chat.next_priority, 'session_key':chat.session_key}); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
				chat.to_user_last_chat = toFirekey.name();
				chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
				var selfFireKey = chat.user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name, to: chat.to_user_id, text: $scope.audio.message, audio: $scope.audio.url.toString(), heading: $scope.audio.heading, encryption: UserService.encryption, offline: !(chat.to_user_online.$value), time: n, priority: chat.next_priority, 'session_key':chat.session_key }); // assign this task after sending to the to_user location !important
				chat.user_last_chat = selfFireKey.name();
				chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
				ChatService.__updateToUserActiveSession(chat);
			}
		}
		
	    $scope.audio.cid = ''
	    $scope.audio.url = '';
	    $scope.audio.heading = '';
	    $scope.audio.message = '';
	    chat.unread = 0;	
	    
	    $timeout(function()
	    {
	    	if (chat.scroll_top == true)
			{
				chat.scroll_top = false
			};
			chat.scroll_bottom = true;	    
	    },250)
		$timeout(function()
		{
			chat.scroll_bottom = false;					
		},500);
		chat.addAudio = false;
	}
	
	
	$scope.addImageMessage = function(chat){
		chat.scroll_bottom = false;
		var n = Firebase.ServerValue.TIMESTAMP;
		if(chat.isGroupChat)
		{
			var firekey = chat.group_message_location.push({author: UserService._user_profile.user_id, authorName : UserService._user_profile.name, avatarId: UserService._user_profile.avatar, encryption: UserService.encryption, to: chat.session_key, text: $scope.image.message, image: $scope.image.url, heading: $scope.image.heading, time: n, priority: chat.next_priority, 'session_key': chat.session_key});
			chat.user_last_chat = firekey.name();
			chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
			
		}
		else
		{
			var toFirekey = chat.to_user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name,  to: chat.to_user_id, text: $scope.image.message, image: $scope.image.url, heading: $scope.image.heading, encryption: UserService.encryption, offline: !(chat.to_user_online.$value),  time: n, priority: chat.next_priority, 'session_key':chat.session_key}); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
			chat.to_user_last_chat = toFirekey.name();
			chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
			var selfFireKey = chat.user_message_location.push({author: UserService._user_profile.user_id, authorName: UserService._user_profile.name, to: chat.to_user_id, text: $scope.image.message, image: $scope.image.url, heading: $scope.image.heading, encryption: UserService.encryption, offline: !(chat.to_user_online.$value), time: n, priority: chat.next_priority, 'session_key':chat.session_key }); // assign this task after sending to the to_user location !important
			chat.user_last_chat = selfFireKey.name();
			chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
			ChatService.__updateToUserActiveSession(chat);
		}
	    $scope.image.heading = '';
	    $scope.image.url = '';
	    $scope.image.message = '';
	    chat.unread = 0;	
	    
	    $timeout(function()
	    {
	    	if (chat.scroll_top == true)
			{
				chat.scroll_top = false
			};
			chat.scroll_bottom = true;	    
	    },250)
		$timeout(function()
		{
			chat.scroll_bottom = false;					
		},500);
		chat.addImage = false;
	}

	$scope.updateMessage = function(chat, priority, index)
	{
/* 		console.log('calling updateMessage(chat, ' + priority + ', ' + index + ')'); */
		if ( angular.isUndefined( chat.to_user_last_chat) || angular.isUndefined( chat.user_last_chat) ) return false;
		var updated_text =  $( '#ID_' + chat.to_user_id + '_' + priority).text();
		if (updated_text == 'null' || updated_text == '') return false;
/* 		updated_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string */
		chat.chats[index].text = updated_text;
		if ( UserService.encryption === true)
		{
			var session_key = sjcl.encrypt(ENCRYPT_PASS, chat.session_key);
			var encrypted_text = sjcl.encrypt(chat.session_key, updated_text);
			if (encrypted_text == 'null' || new_text == '') return false;				
		}
		chat.user_message_location.child(chat.user_last_chat).update({text: encrypted_text || updated_text});		
		chat.to_user_message_location.child(chat.to_user_last_chat).update({text: encrypted_text || updated_text});
		chat.isTextFocus = true;
		$timeout(function()
		{
			$scope.resetTyping(chat);
		}, 500);
		return false;
	}

	$scope.updateGroupMessage = function(chat, priority, index)
	{
/* 		console.log('start'); */
		if ( angular.isUndefined( chat.user_last_chat) ) return false;
		var updated_text =  $( '#ID_' + chat.session_key + '_' + priority + '_group').text();
/* 		console.log('updated_text: ' + updated_text); */
		if (updated_text == 'null' || updated_text == '') return false;
/* 		updated_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string */
		chat.group_chats[index].text = updated_text;
		if ( UserService.encryption === true)
		{
			var session_key = sjcl.encrypt(ENCRYPT_PASS, chat.session_key);
			var encrypted_text = sjcl.encrypt(chat.session_key, updated_text);
			if (encrypted_text == 'null' || new_text == '') return false;				
		}	
		chat.group_message_location.child(chat.user_last_chat).update({text: encrypted_text || updated_text});
		chat.isTextFocus = true;
		return false;
	}
	
/*
	$scope.updateGroupMessage = function(chat, index)
	{
		chat.isTextFocus = true;
		var updated_text =  $( '#ID' + chat.session_key + '_' + index ).text();
		if (updated_text == 'null' || updated_text == '') return false;
		var new_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string
		if ( UserService.encryption === true)
		{
			var session_key = sjcl.encrypt(ENCRYPT_PASS, chat.session_key);
			new_text = sjcl.encrypt(chat.session_key, new_text);				
		}
		if (new_text == 'null' || new_text == '') return false;
		chat.group_message_location.child(chat.group_chats[index].key).update({text: new_text});	
		chat.isTextFocus = true;
		return false;
	}
*/
	
	
	
	$scope.last_pushed = function(session)
	{
/* 		console.log(session + ' : ' + ChatService._last_pushed_session); */
/* 		console.log(session == ChatService._last_pushed_session) */
		return session == ChatService._last_pushed_session;
	}
	
	$scope.last_deactivated = function(session)
	{
/* 		console.log(session + ' : ' + $scope.last_deactivated_chat); */
/* 		console.log(session == $scope.last_deactivated_chat); */
		return session == $scope.last_deactivated_chat;
	}
	
	$scope.isTrue= function(bool){
		if (bool)
		{
			$log.debug('it was true');
			
			return true;
			
		}
		return false;
	}
	
	$scope.isReloading = function(chat)
	{
		if (chat == null) {return false};
		if (angular.isDefined(chat) && chat.reload == true)
		{
			$timeout(function()
			{
				chat.reload = false;	
			}, 1000)
			
			return true;
			
		}
		return false;		
	}
	
	$scope.swapChatPositions = function(index_a, index_b) 
	{
		if (index_b >= $scope.activeChats.length)
		{
			index_b = $scope.activeChats.length-1;
		}
		else if ( index_b < 0)
		{
			index_b = 0
		}
		if ( index_a == index_b) return false;
	    $scope.temp_chat = $scope.activeChats[index_a];
	    $scope.activeChats[index_a] = $scope.activeChats[index_b];
	    $scope.activeChats[index_b] = $scope.temp_chat;
	    $scope.temp_chat = null;
		$scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
		$scope.resetChatUnread();		    
	    $scope.setActiveChatsPriority();
/* 	    ChatService.__setLastPushed($scope.activeChats[index_b].to_user_id || $scope.activeChats[index_b].session_key); */
	    
    }
    
    $scope.reloadChat = function(index) 
	{
	    $scope.temp_chat = $scope.activeChats[index];
	    $scope.activeChats[index] = null;
	    $scope.activeChats[index] = $scope.temp_chat;
	    $scope.temp_chat = null;	    
    }
    
    $scope.moveChatToLast = function(index)
    {
	    $scope.temp_chat = $scope.activeChats[index];
	    $scope.activeChats.splice(index, 1);
	    $scope.activeChats.push($scope.temp_chat);
	    $scope.temp_chat = null;
	    $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
	    $scope.resetChatUnread();		    
	    $scope.setActiveChatsPriority();
    }
    
    $scope.moveChatToFirst = function(index)
    {
	    $scope.temp_chat = $scope.activeChats[index];
	    $scope.activeChats.splice(index, 1);
	    $scope.activeChats.unshift($scope.temp_chat);
	    $scope.temp_chat = null;
	    $scope.setActiveChatsPriority();
/* 	    ChatService.__setLastPushed($scope.activeChats[0].to_user_id || $scope.activeChats[0].session_key); */
    }
    
    $scope.loadMore = function(chat) 
    {
    	if (angular.isUndefined(chat.first_priority) || chat.first_priority == 0 || !(chat.isMorePrev))
    	{
	    	chat.isMorePrev = false;
/* 	    	console.log('there is no more'); */
	    	return false;
    	}
    	if (!(chat.reload) && chat.isMorePrev == true)
    	{
/* 			console.log('is more'); */
			var previous = chat.next_priority
			if ( chat.isGroupChat)
	    	{
		    	ChatService.__fetchMoreMessages($scope,chat.index_position, chat.group_message_location, chat.first_priority -1);
	    	}
	    	else
	    	{
		    	ChatService.__fetchMoreMessages($scope, chat.index_position, chat.user_message_location, chat.first_priority -1);
	    	}
	    	$timeout(function()
	    	{
	    		chat.scroll_bottom = false;
	    		chat.scroll_top = true;		    	
	    	})  	
    	} 	
    };
	
	$scope.loadMoreGroupChat = function(chat)
    {
		if (chat.reload)
		{
			console.log("returning false");
			return false;
		}
	    if (angular.isUndefined(chat.first_priority) || chat.first_priority == 0 || !(chat.isMorePrev))
    	{
	    	chat.isMorePrev = false;
	    	$log.debug('there is no more');
	    	return false;
    	}
    	DirectoryChatService.__fetchMoreMessages($scope, chat);
    	
    }
    
    $scope.addReferenceMessage = function(chat, message)
    {
    	if (message.author == UserService._user_profile.user_id)
    	{
	    	chat.referenceName = chat.self_name;
    	}
    	else if ( !chat.isGroupChat)
    	{
	    	chat.referenceName = chat.to_user_f_name;
    	}
    	else
    	{
	    	var name_split = message.authorName.match(/\S+/g); // splits the to_users first and last name
			chat.referenceName = name_split[0];
    	}
	    chat.reference = message.priority;
	    chat.referenceText = message.text;
	    chat.referenceAuthor = message.author;
	    chat.isTextFocus = true;   
    }
    
    $scope.referenceMessage = function(reference, reference_id, display_id)
    {
/*     	console.log('referencing ' + reference); */
    	$scope.referenced_message = null;
		$scope.referenced_display = null;
		$scope.referenced_message_id  = null;
/* 		console.log(reference ); */
    	if (reference != null)
    	{
/* 	    	console.log('referencing message:' + reference); */
			$scope.referenced_message = reference;
			$scope.referenced_message_id = reference_id;
/* 			console.log($scope.referenced_message_id);			 */
			$scope.referenced_display = display_id;
    	}
    	else
    	{
	    	$log.debug('Reference was null');
    	}
    	
    }
    
    $scope.isReferencedMessage = function(message)
    {
    	
	    if ($scope.referenced_message != null && $scope.referenced_message == message.priority && !$scope.referencing )
	    {
			$scope.referencing = true;
/* 	    	console.log($scope.referenced_message + ' : ' + message.priority); */
/* 	    	console.log('Reference was true'); */
	    	$timeout(function()
	    	{
		    	$scope.referenced_message = null;
		    	$scope.referenced_message_id = null;
		    	$scope.referenced_display = null
		    	$scope.referencing = false;
	    	}, 3000)	    	
			return true;	    
	    }
	    return false;
    }
    
  
	$scope.isDirectoryItem = function(index)
    {
    	if (index == null || index == undefined)
    	{
	    	return false;
    	}
	    if (angular.isDefined($scope.referenced_index) &&  $scope.referenced_index == index )
	    {
/* 	    	console.log('Reference was true'); */
			$scope.referenced_index = null; 	
			return true		    
	    }
	    return false;
    }
    
    $scope.isLastUnread = function(index)
    {
	    if (angular.isDefined($scope.last_unread_index) && $scope.last_unread_index == index )
	    {
/* 	    	console.log('Reference was true' + $scope.last_unread_index + ' : ' + index ); */
	    	$scope.last_unread_index = null;
	    	return true;			    
	    }
	    return false;
    }
    
    $scope.setTextFocus = function(chat)
    {
/* 	    chat.isTextFocus = true; */
		$scope.$evalAsync(function(){
		    chat.unread = 0;
		    chat.isNewMessage = false;
		    chat.showProfile = false;
		    chat.nudge = false;
		    if ( chat.header_color != ChatService._header_color) 
		    {
		    	chat.header_color = ChatService._header_color
		    };
		    chat.isTextFocus = true;
		})
    }
    
    $scope.setDirectoryFocus = function(chat)
    {
/* 	    chat.isTextFocus = true; */
		if(chat == null) {return false};
	    chat.unread = 0;
	    chat.isNewMessage = false;
	    chat.showProfile = false;
	    chat.isTextFocus = true;
	    chat.nudge = false;
    }
    
    $scope.clearMandatoryList = function()
    {
    	$scope.showNavMenu = false;
    	if ($scope.sm_group_chat)
    	{
	    	$scope.sm_group_chat.scroll_bottom = $scope.sm_group_chat.scroll_top  = $scope.sm_group_chat.isTextFocus = false;
    	}
    	if($scope.sm_tech_chat)
    	{
	    	$scope.sm_tech_chat.scroll_bottom = $scope.sm_tech_chat.scroll_top = $scope.sm_tech_chat.isTextFocus = false;
    	}
		if($scope.mc_group_chat)
		{
			$scope.mc_group_chat.isTextFocus = false;
		}
		if($scope.admin_group_chat)
		{
			$scope.admin_group_chat.isTextFocus = false;
		}
    }
    
    $scope.setMandatoryFocus = function(chat)
    {
    	if ( chat)
    	{
    		if (chat.group_chat_log.length > $scope.directory_limit)
    		{
    			var i = 0;
	    		chat.group_chats = chat.group_chats.slice(-($scope.directory_limit));
	    		chat.group_chat_log = chat.group_chat_log.slice(-($scope.directory_limit));
	    		$log.debug(chat.group_chats);
/* 	    		chat.group_chats.length = 20; */
	    		chat.next_priority = chat.group_chats[chat.group_chats.length-1].priority + 1;
	    		chat.first_priority = chat.group_chats[0].priority;
	    		while (!chat.first_priority)
	    		{
		    		i++;
		    		chat.first_priority = chat.group_chats[i].priority;
	    		}
	    		
    		}
    		$scope.clearMandatoryList();
	    	$scope.mandatory_index = chat.session_key;
	    	$log.debug(chat.index_position);
	    	if ($scope.layout == 1)
	    	{
		    	$scope.directory_index = null;
		    	if ($scope.directory_chat)
		    	{
			    	$scope.directory_chat.isTextFocus = false;
			    	$scope.directory_chat.nudge = false;
		    	}
		    	UserService._user_settings_location.update({'last-active-chat': chat.session_key, 'last-mandatory-chat': chat.session_key}); 
	    	}
	    	else if ($scope.layout != 1)
	    	{
		    	UserService._user_settings_location.update({'last-mandatory-chat': chat.session_key});
	    	}
	    	$timeout(function()
	    	{
		    	chat.isTextFocus = true;
		    	chat.scroll_bottom = true;
				chat.unread = 0;
	    	}, 250)
	    	
    	}
    }
    $scope.tablist = ['blank', 'contacts', 'sm_group_chat', 'sm_tech_chat', 'mc_group_chat', 'directory_chat'];
    $scope.setNexTab = function()
    {
		var next_tmp = $scope.tmp + 1;
		if ($scope.activeChats.length > 0 && $scope.layout == 1)
		{
			if (next_tmp > 5)
			{
				next_tmp = 1;
			}
		}
		else
		{
			if (next_tmp > 4)
			{
				next_tmp = 1;
			}
		}
		$scope.updateTmp(next_tmp);
		$timeout(function(){
			if(next_tmp == 1)
			{
				$scope.setContactsFocus();
			}
			else if(next_tmp == 5)
			{
				$scope.setDirectoryChat($scope.stored_directory_index, true);
			}
			else
			{
				$scope.setMandatoryFocus($scope[$scope.tablist[next_tmp]]);
			}
		}, 250);
    }
    
    $scope.setContactsFocus = function()
    {
    	$scope.clearMandatoryList();
    	if ($scope.layout == 1)
    	{
	    	$scope.directory_index = null;
	    	if ($scope.directory_chat)
	    	{
		    	$scope.directory_chat.isTextFocus = false;
	    	}
	    	UserService._user_settings_location.update({'last-active-chat':'contacts'}); 
    	}
    	else if ($scope.layout == 3)
    	{
	    	UserService._user_settings_location.update({'last-mandatory-chat': 'contacts'});
    	}
    	$scope.updateTmp(0);
    	$timeout(function()
    	{
	    	$scope.directory_search.isFocusText = true;
			$scope.mandatory_index = 'contacts';
    	}, 250)
    	   
    }
    
    $scope.sendChatReceipt = function(chat)
    {
    	$log.debug(chat.isGroupChat);
    	if(angular.isUndefined(chat)){return false;}
    	var options = {
		    weekday: "long", year: "numeric", month: "short",
		    day: "numeric", hour: "2-digit", minute: "2-digit"
		};
    	var chat_record = {};
    	chat_record.participants = Array();
    	chat_record.messages = Array(); 
    	chat_record.timestamp =  new Date().toLocaleTimeString("en-us", options);
    	if (chat.isGroupChat)
    	{
    		if(chat.group_chats.length == 0){
	    		return false;
    		}
	    	chat_record.type ='Group Chat';
	    	angular.forEach(chat.participant_log, function(value, key){ // runs through the list of chat session to determine which chat session is tied to the value change
			this.push(value);
			}, chat_record.participants);
			angular.forEach(chat.group_chats, function(value, key){ // runs through the list of chat session to determine which chat session is tied to the value change
				this.push({author: value.authorName, avatar: value.avatar,  time: Math.ceil(value.time/1000), text: value.text, referenceName: value.referenceName || null, referenceText: value.referenceText || null});
			}, chat_record.messages);		    	
    	}
    	else
    	{
    		if(chat.chats.length == 0){
	    		return false;
    		}
	    	chat_record.type = "Personal";
	    	chat_record.participants.push(UserService._user_profile.name);
	    	chat_record.participants.push(chat.to_user_name);
	    	angular.forEach(chat.chats, function(value, key){ // runs through the list of chat session to determine which chat session is tied to the value change
				this.push({author: value.authorName, time: Math.ceil(value.time/1000), text: value.text, referenceName: value.referenceName || null, referenceText: value.referenceText || null});
			}, chat_record.messages);
    	}
    	ChatRecordService.async(chat_record);
    	var time = Firebase.ServerValue.TIMESTAMP;
		var chat_text = 'Chat Log sent to email.';
		if(chat.isGroupChat){
			chat.group_chats.push({author: ChatService._internal_reference, to: chat.session_key, text: chat_text, 'time': time, priority: 'internal', session_key: chat.session_key});
			chat.group_chat_log.push(ChatService._internal_reference);
		} else {
			chat.chats.push({author: ChatService._internal_reference, to: chat.session_key, text: chat_text, 'time': time, priority: 'internal', session_key: chat.session_key});
			chat.chat_log.push(ChatService._internal_reference);
		}
		
    	$scope.clear(chat);
    }
    
/*     $scope.user_group = [UserService.getUserField('user_id'), UserService.getUserField('pc'), UserService.getUserField('mc'), UserService.getUserField('admin')]; */


	$scope.toggleFilterMenu = function(){
		$scope.showFilterMenu = !$scope.showFilterMenu;
	}
	
	$scope.toggleOffline = function(){
		$scope.showFilterMenu = false;
		$scope.directory_show_online_only = !$scope.directory_show_online_only;
	}
	

    $scope.directory_show_online_only = true;
    $scope.directory_show_offline_only = false;
    $scope.directory_show_position_only = false;
    $scope.directory_show_team_only = false;
    
    $scope.showInGeneralDirectory = function(user) // this function will determine the client has filtered the user out of the general directory user list
    {
    	if ( angular.isDefined(UserService.user_group) && UserService.user_group.indexOf('user_'+ user.user_id) > -1)
	    {
/* 	    	console.log(user.name + 'is in user_group' + angular.toJson(UserService.user_group)); */
		    return false;
	    }
	    if ($scope.smod && $scope.tod)
	    {
	    	if(user.user_id == $scope.smod.user_id || user.user_id == $scope.tod.user_id)
	    	{
		    	return false;
	    	}
	    } 
	    if ($scope.directory_show_online_only)
	    {
		    if ( user.state == "Offline")
		    {
/* 		    	console.log(user.name + 'is not online'); */
			    return false;
		    }
	    }
	    if ($scope.directory_show_position_only) // filter by position
	    {
		    if (user.position != $scope.directory_show_position)
		    {
/* 		    	console.log(user.name + 'is not a' + $scope.directory_show_position_only); */
			    return false;
		    }
	    }
	    /*
if ($scope.directory_show_team_only)
	    {
		    if ( TeamService.user_team.indexOf(user.user_id) == -1)
		    {
		    	console.log(user.name + 'is not in ');
			    return false;
		    }
	    }
*/
	    return true;
    }
    
    $scope.selectDirectorySelection = function()
    {
/*     	console.log($scope.filtered_directory_array); */
	    if ( $scope.directory_search.text.length > 0 && angular.isDefined($scope.filtered_directory_array[0]))
	    {
/* 	    	console.log($scope.filtered_directory_array[0].name + " : " + $scope.users_list[0].name); */
		    $rootScope.$broadcast('requestChatSession', $scope.filtered_directory_array[0]);
		    $scope.directory_search.text = '';
	    }	      
    }    

	
		$scope.$watch('directory_search.text', function(newVal, oldVal) {
			$scope.filtered_directory_array = $filter('filter')($scope.users_list, newVal);
			$scope.filtered_directory_array = $filter('orderBy')($scope.filtered_directory_array, 'name');
	    });
	
	$scope.isCurrentDirectorySelection = function(user_id)
	{
		if ($scope.directory_search.text.length > 0 && angular.isDefined($scope.filtered_directory_array[0]) && $scope.filtered_directory_array[0].user_id == user_id )
		{
			return true;
		}
		return false;		
	}
	
	$scope.updateDirectoryChat = function(index)
	{
		UserService._user_settings_location.update({'last-active-chat': index});
	}
	
	$scope.setDirectoryChat = function(index, link)
	{

		if ( index == undefined || index == null || $scope.activeChats.length == 0)
		{
			$log.debug('error/no chats');
			$scope.safeApply(function()
			{
				$timeout(function(){
					document.getElementById($scope.mandatory_index + "_link").click();	
				})
			})
			 $log.debug('broken 1'); 
			return false;
		}
		$scope.stored_directory_index = $scope.directory_index = index;
		UserService._user_settings_location.update({'last-active-chat': index});
		if ($scope.directory_index == $scope.last_unread_index)
		{
			 $scope.last_unread_index = '';
		}
		if($scope.directory_chat)
		{
			$scope.directory_chat.unread = 0;
			$scope.isNewMessage = false;
			$scope.isTextFocus = false;
		}
		$timeout(function(){
			$scope.directory_chat = null;
		})
		$scope.safeApply(function(){
			$timeout(function()
			{
				$scope.directory_chat = $scope.activeChats[$scope.directory_index];											
			}, 250)	
			$timeout(function(){
				if ($scope.directory_chat) 
				{
					$scope.directory_chat.scroll_bottom = false;
					$scope.directory_chat.isTextFocus = true;
					$scope.directory_chat.unread = 0;
					$scope.directory_chat.isNewMessage = false;
					$scope.chat_module_lock = true;	
					$scope.directory_chat.scroll_bottom = true;	
					if ( $scope.layout == 1 && link)
					{
						document.getElementById('directory_chat_link').click();
					}																		
				}
			},300)			
		})		
		return false;
	}
	
	$scope.referenceDirectoryItem = function()
    {
    	if (angular.isUndefinedOrNull($scope.directory_index))
    	{
	    	$scope.directory_index = $scope.stored_directory_index;
	    	$scope.setDirectoryChat($scope.directory_index, false);
    	}    	
    	if ($scope.directory_index != null)
    	{		
			$timeout(function()
	    	{
		    	$scope.referenced_index = $scope.directory_index;
	    	})
	    	$timeout(function()
	    	{
		    	$scope.referenced_index = null;
	    	}) 
    	}
    }
    
    
    $scope.toggleNavMenu = function(){
	    $scope.showNavMenu = !$scope.showNavMenu;
    }

	$scope.getDirectoryChat = function(chat_name)
	{
		$log.debug('getDirectoryChat(' + chat_name + ')');
		var type = chat_name.split('_')[0];
		$log.debug('type: ' + type);
		var id = chat_name.split('_')[1];
		$log.debug('id: ' + id);
		$scope.showNavMenu = false;
		if ($scope.active_sessions[chat_name] == true)
		{
			$log.debug(chat_name + 'already exists');
			var i = $scope.activeChats.length;
			while(i--){
				if ($scope.activeChats[i].session_key == chat_name && $scope.isPageLoaded )
				{
					$scope.directory_index = i;
					$timeout(function(){
						$scope.setDirectoryChat($scope.directory_index, true);
					})					
					break;
				}
			}
			return;	
		}
		else
		{
			if ( type == 'mc')
			{
				ChatService.__pushChatSession(DirectoryChatService.__buildNewDirectoryChat($scope, (chat_name), UserService._users_profiles_obj['user_' + id].name + ' - MC Team Chat',  id, false, false, 3),false,$scope); //scope, chat_reference, chat_description, admin, watch_users
/*
				else if (UserService._user_profile.position == 33)
				{
					ChatService.__pushChatSession(DirectoryChatService.__buildNewDirectoryChat($scope, ('mc_' + UserService._user_profile.user_id + '_group_chat'), 'MC - Group Chat', UserService._user_profile.user_id, false, true, 3), false, $scope );	//chatSession, to_user,  scope				
				}
*/
			}
			else if (chat_name == 'admin_group_chat')
			{
				ChatService.__pushChatSession(DirectoryChatService.__buildNewDirectoryChat($scope, ('admin_group_chat'), 'Admin - Group Chat', UserService._user_profile.user_id, false, true, 3), false, $scope);
			}
			else
			{
				return false;
			}
			
			if ($scope.directory_index == $scope.last_unread_index)
			{
				 $scope.last_unread_index = '';
			}
			if ($scope.isPageComplete == true)
			{
				$timeout(function(){
					$scope.setDirectoryChat($scope.activeChats.length-1, true)
				}, 1000)			
			}
		}		
	}
	
	$scope.isScrollAtBottom = function(index)
	{
		if ($scope.isPageComplete == false)
		{
			return false;
		}
		var el = document.getElementById('message_display_' + index);
		if (el == null) {$log.debug('element was not found'); return false;}
		if ( angular.isDefined(el) && angular.isDefined(el.scrollTop))
		{
			if (el.scrollTop + el.clientHeight + 10 >= el.scrollHeight)
			{	
				return el;
			}
			else
			{
				return false;
			}	
		}
		return false;
		
	}
	
	$scope.alertNewChat = function(index, internal, message)
	{
		if ($scope.is_external_window.$value && $scope.isExternalInstance == false)
		{
			$log.debug('Blocked SOund');
			return false;
		}
/* 		console.log(index); */
		var el = $scope.isScrollAtBottom(index);
		if (internal)
		{ 
			if ($scope.activeChats[index] && $scope.activeChats[index].isopen == true || $scope.directory_chat && $scope.directory_chat.index_position == index)
			{
				if ((!ChatService._is_playing_sound) && angular.equals($scope.activeChats[index].isSound, true) )
				{
					ChatService._is_playing_sound = true;
					$timeout(function(){
						$scope.resetTyping($scope.activeChats[index]);
						NotificationService.__playSound(NotificationService._chat_close);	//  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
						ChatService._is_playing_sound = false;
					}, 50);								
				}
				
			}
			
		}
		else
		{
			if ((!ChatService._is_playing_sound) && angular.equals($scope.activeChats[index].isSound, true) )
			{
				ChatService._is_playing_sound = true;
				$timeout(function(){
				$scope.resetTyping($scope.activeChats[index]);
				NotificationService.__playSound(NotificationService._chat);	//  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
				ChatService._is_playing_sound = false;
				}, 50);								
			}
			if ($scope.external_monitor && $scope.isExternalWindow && message)
			{
				$scope.notifyUser(message, index, null);
				$scope.unread++;
				document.title = $scope.default_window_title + ' - ' + $scope.unread + ' New';
				
			}
			else if ( $scope.page_status == 'visible' && $scope.layout != 2 && $scope.isChatModuleOpen == false)
			{
				$scope.alertToOpen = true;
				$scope.unread++;
				if (message){
					$scope.notifyUser(message, index, null);
				}
				
			}
			else if ($scope.page_status == 'hidden')
			{
				if (message){
					$scope.notifyUser(message, index, null);
					$scope.unread++;
					document.title = $scope.default_window_title + ' - ' + $scope.unread + ' New';
				}
			}
			if ( $scope.layout != 2 && $scope.activeChats[index].isTextFocus == false)
			{
				$log.debug('notify 1');
				$scope.activeChats[index].unread  = $scope.activeChats[index].unread + 1;	// this condition will change the color of the chat header if the user has it closed.
				$scope.activeChats[index].isNewMessage = true;
				if ($scope.directory_index != index)
				{
/* 					console.log(' 1-A added to  priority queue') */
					if ( $scope.priority_queue.indexOf(index) == -1)
					{
						$scope.priority_queue.unshift(index);
					}
					$scope.last_unread_index = index;
				}	
	
			}
			else
			{
				if ( index > ($scope.max_count-1) || $scope.activeChats[index].isopen == false || $scope.activeChats[index].isopen == 'false' )
				{
/* 					console.log('notify 2');	 */
					$scope.activeChats[index].unread  = $scope.activeChats[index].unread + 1;	// this condition will change the color of the chat header if the user has it closed.
					$scope.activeChats[index].header_color = ChatService._closed_header_alert_color;
					$scope.activeChats[index].isNewMessage = true;
/* 					console.log(' 1-A added to  priority queue') */
					if ( $scope.priority_queue.indexOf(index) == -1)
					{
						$scope.priority_queue.unshift(index);
					}
					$scope.last_unread_index = index;
				}
				else if ( $scope.activeChats[index].isTextFocus == false)
				{
/* 					console.log('notify 3'); */
					$scope.activeChats[index].unread  = $scope.activeChats[index].unread + 1;
					$scope.activeChats[index].isNewMessage = true;
					$scope.activeChats[index].header_color = ChatService._open_header_alert_color;
/* 					console.log(' 1-A added to  priority queue') */
					if ( $scope.priority_queue.indexOf(index) == -1)
					{
						$scope.priority_queue.unshift(index);
					}
					$scope.last_unread_index = index;										
				}
				else 
				{
					$scope.activeChats[index].unread  = 0;
					$scope.activeChats[index].isNewMessage = false;
					$scope.activeChats[index].header_color = ChatService._header_color;				
				}
				
			}		
		}
		if (el)
		{
			$timeout(function(){
				el.scrollTop = el.scrollHeight;
			}, 500)	
		}					
	}
	
	$scope.getNotifyPermission = function(){
		Notification.requestPermission();
	}
	
	$scope.user_notifications = Array();
	
	$scope.notifyUser = function(message, index, heading) {
/* 		  console.log('notifying user'); */
		  var title;
		  if (heading) {
		  	  if (BrowserService.platform.browser == "Firefox")
		  	  {
			  	  title = message.authorName + '   ' + heading; 
		  	  }
		  	  else
		  	  {
			  	  title = heading + '\n' + message.authorName;
		  	  }
			  
		  }
		  else
		  {
			  title = message.authorName;
		  }
		  var notification = new Notification(title, {
		  	  tag: message.session_key,
		  	  icon: '/components/com_callcenter/images/avatars/' +UserService._users_profiles_obj['user_' + message.author].avatar + '-90.jpg',
			  body: message.text
			});
			if (typeof index === "number" && index > -1){
				notification.onclick = function(){
					if ($scope.page_status == 'visible')
					{
						self.focus();
						$scope.setDirectoryChat(index, true);
						$scope.updateTmp(5);
						if(!$scope.isChatModuleOpen)
						{
							$scope.openChatModule();
						}
					}
				}
			}
			else if (typeof index === "string")
			{
				notification.onclick = function(){
					if ($scope.page_status == 'visible')
					{
						self.focus();
						$scope.setMandatoryFocus($scope[index]); 
						$scope.updateTmp($scope.tablist.indexOf(index));
						if(!$scope.isChatModuleOpen)
						{
							$scope.openChatModule();
						}
					}
				}
			}
			$scope.user_notifications.push(notification);
		};
		
	$scope.sendNotification = function(title, tag,icon, body){
		var notification = new Notification(title, {
		  	  tag: tag,
		  	  icon: icon,
			  body: body
			});
	}

	$scope.$on('clear_notifications', function(event) 
	{
		angular.forEach($scope.user_notifications, function(value, key){ // runs through the list of chat session to determine which chat session is tied to the value change
			value.close();
		});
	});
	
	
	$scope.setReference = function(message, start)
	{
		if (parseInt(message.reference) >= parseInt(start))
		{
			message.isReference = true;
			if (message.referenceAuthor == UserService._user_profile.user_id)
			{
				message.isReferencedSelf = true
			}
			else
			{
				message.isReferencedSelf = false;
			}
		}
		else
		{
			message.isReference = false;
			message.isReferencedSelf = false;
		}
		return;
	}
	
/*
	$scope.resizeUp = function()
	{
		$scope.resize_up = true;
		$scope.resizeUpInterval = setInterval(function()
		{
			console.log('resizing up');
			if ( $scope.resize_up == true && $scope.vertical_adjust < 100) 
			{
				$scope.vertical_adjust = $scope.vertical_adjust + 4;
				
			}
			if ($scope.vertical_adjust >= 100)
			{
				$scope.resizeStop();
			}
			$scope.$apply();
		}, 100);
	}
	
	$scope.resizeDown = function()
	{
		$scope.resize_down = true;
		$scope.resizeDownInterval = setInterval(function()
		{
			$scope.safeApply(function(){
				console.log('resizing down');
				if ( $scope.resize_down == true && $scope.vertical_adjust > -100) 
				{
						$scope.vertical_adjust = $scope.vertical_adjust - 4;
				}
				if ($scope.vertical_adjust <= -100)
				{
					$scope.resizeStop();
				}				
			});
			
			
		}, 100);
	}
*/
	
	$scope.resizeStop = function()
	{
		$scope.safeApply(function(){
			clearInterval($scope.resizeUpInterval);
			clearInterval($scope.resizeDownInterval);
			$scope.resize_down = false;
			$scope.resize_up = false;
			$scope.$apply();			
		})
		
	}
	
	$scope.muteGlobalSound = function()
	{
		NotificationService.__mute();
	}
	
	$scope.allowGlobalSound = function()
	{
		NotificationService.__unmute();
	}

	$scope.openExternalWindow = function() {
			$scope.switchLayout(1);
			if(UserService._user_settings_location)
			{
				UserService._user_settings_location.update({'is-external-window':false});
			}
			$timeout(function(){				
				$scope.externalWindowObject = window.open(EXT_LINK,"PlusOnePortalChat","left=1600,resizable=false, scrollbars=no, status=no, location=no,top=0");
			    if ($scope.externalWindowObject)
			    {
			    	$scope.externalWindowObject.resizeTo(350,window.innerHeight+50);
			    	$timeout(function(){
				    	$scope.$evalAsync(function(){
				    		$scope.isChildWindow = true;
				    		$scope.isExternalWindow = true;
				    		$scope.externalWindowObject.focus();
				    		$scope.isPageLoaded = false;
				    		$scope.isExternalWindow = true;	
							$scope.mute();
				    		
				    		
		/* 					UtilityService.setFirebaseOffline(); */
							
							$scope.externalWindowlistener = $scope.$watch('externalWindowObject.closed',function(newValue){
							   if (newValue)
							   {
								   UserService._user_settings_location.update({'is-external-window': false})
								   localStorageService.remove('isExternalWindow');
								   $scope.isExternalWindow = false;	
							   }
							});
							$scope.externalWindowObject.addEventListener('DOMContentLoaded', resizeChild, true);
							
					    	function resizeChild(){
/* 					    		console.log('calling resize child'); */
								$timeout(function(){
									$scope.externalWindowObject.document.documentElement.style.overflow = 'hidden';  // firefox, chrome
									$scope.externalWindowObject.document.body.scroll = "no"; // ie only
									
									localStorageService.add('isExternalWindow', true);
								}, 2000)
							}
				    	})
				    }, 1000)
				}
				return false;
			}, 750);
	}
	
	$scope.toggleExternalWindow = function(){
		console.log('external focus');
		if ($scope.externalWindowObject)
		{
			$scope.externalWindowObject.focus();
		}
		else
		{
			$scope.mute();
			$scope.openExternalWindow();
			$timeout(function(){
				$scope.unmute();
			}, 4000)
		}
	}
	
	$scope.viewProfile = function(chat)
	{
		if(chat)
		{
			if (!chat.additional_profile)
			{
				$scope.getUserAdditionalProfile(chat);
				$timeout(function(){
					chat.showUserOptions = false;
					chat.showProfile = true;
				}, 1000)
			}
			else
			{
				chat.showUserOptions = false;
				chat.showProfile = true;
			}
		}
	}
	
	$scope.closeProfile = function(chat)
	{
		if(chat)
		{
			chat.showProfile = false;
/* 			chat.additional_profile = null; */
		}
	}
	
	
	$scope.getUserAdditionalProfile = function(chat)
	{
/* 		console.log('calling controller to get additonal profile'); */
		UserService.__getUserAdditionalProfile(chat.to_user_id, chat);
	}
}]).
controller('InviteController', ['$scope', '$log', 'UserService', 'UtilityService',  'filterFilter', 'ChatService', '$timeout', '$filter',  function($scope, $log, UserService, UtilityService, filterFilter, ChatService, $timeout, $filter) 
{
	$scope.selected = '';
	
	$scope.updateInviteCloseTimer = function(chat)
	{
		if (angular.isUndefined(chat) || chat == null)
		{
			return false;
		}
		if ( angular.isDefined(chat.close_invite) )
		{
			clearInterval(chat.close_invite)
		}
		chat.close_invite = setInterval(function()
		{
			chat.isInviteFocus = false;
			chat.isTextFocus = true;
			chat.invite = false;
			clearInterval(chat.close_invite);
		}, 15000);		
	}
	
	$scope.filteredArray = Array();
		
	$scope.addInvitee = function(chat)
	{
		var index = null;
		$log.debug('addInvitee: inviting '); 
		$log.debug($scope.invited_user);
		$log.debug('The filter array is ');
		$log.debug($scope.filteredArray);
		
		if ( angular.isDefined(chat.close_invite) )
		{
			clearInterval(chat.close_invite)
		}
			
		if ( $scope.filteredArray && chat.invitee_set == true )
		{
			$log.debug('inside first condition');
			chat.invitee_set = false;
			chat.invited = '';
			chat.user_log[$scope.invited_user.user_id] = {avatar: $scope.invited_user.avatar, name: $scope.invited_user.name, user_id: $scope.invited_user.user_id};
			UtilityService.removeByAttr(chat.invite_list, 'user_id', $scope.invited_user.user_id);
			if ( chat.isGroupChat == false )
			{
				var new_group_chat = ChatService.__convertToGroupChat(chat, false , $scope, false);
				$timeout(function()
				{
/* 					console.log(new_group_chat.user_details[$scope.invited_user.user_id]); */
					if ( new_group_chat == false )
					{
						$log.debug( 'Create group chat failed');
						var time = Firebase.ServerValue.TIMESTAMP;
						var chat_text = 'Group Chat failed.';
						chat.chats.push({author: ChatService._internal_reference, to: chat.session_key, text: chat_text, 'time': time, priority: 'internal', session_key: chat.session_key});
						chat.chat_log.push(ChatService._internal_reference);
						$scope.invited_user = undefined;
						chat.invite = false;
						return false;
					}
					else if ( new_group_chat.user_details[$scope.invited_user.user_id] == undefined )
					{
						$log.debug( 'Create group chat failed');
						var time = Firebase.ServerValue.TIMESTAMP;
						var chat_text = $scope.invited_user.name + ' is offline.';
						chat.chats.push({author: ChatService._internal_reference, to: chat.session_key, text: chat_text, 'time': time, priority: -1, session_key: chat.session_key});
						chat.chat_log.push(ChatService._internal_reference);
						$scope.invited_user = undefined;
						chat.invite = false;
						$log.debug(chat.chats);
						return false;						
					}
					else
					{
						chat.convert = true;
						chat.isGroupChat = true;
						$log.debug('group chat add was sucessful');	
					}					
					var chat_log = [];		
					//change the appearnace of this existing chatbox into a group chat box
					if (angular.isDefined(chat.index_position) && $scope.activeChats[chat.index_position].session_key == chat.session_key)
					{
						index = chat.index_position;
						$log.debug('alas we used the index position here');
					}
					else
					{
						angular.forEach($scope.activeChats, function(value, key){ // runs through the list of chat session to determine which chat session is tied to the value change
							this.push(value.session_key);
						}, chat_log);
						index = chat_log.indexOf(chat.session_key); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
					}
					if ( index > -1 )
					{
						$scope.activeChats[index] = new_group_chat;
						$scope.active_sessions['user_' + chat.to_user_id] == null;
						delete $scope.active_sessions['user_' + chat.to_user_id];
						$scope.active_sessions[new_group_chat.session_key] = true;
					}
					else
					{
						$log.debug('not found');
						$scope.activeChats.push(new_group_chat);
						$scope.active_sessions[new_group_chat.session_key] = true;
					}
					$timeout(function() // give the init user the ability to set the session up in the firebase before bringing in the othe ruser
					{
						if ( angular.isDefined(chat.to_user_last_chat))
						{
							ChatService.__updateToUserActiveSession(chat);
						}						
						angular.forEach(new_group_chat.user_details, function(val, key){ // runs through the list of chat session to determine which chat session is tied to the value change
							if ( angular.isDefined(key) && key !== null)
							{
								if ( angular.isDefined(new_group_chat.user_details[key]) && angular.isDefined(new_group_chat.user_details[key].session_location) )
								{
									new_group_chat.user_details[key].session_location.update({groupChat : new_group_chat.isGroupChat, name : new_group_chat.chat_description, session_key: new_group_chat.session_key, admin: new_group_chat.admin, time : new_group_chat.time });
								}
								else { $log.debug('Session location for ' + key + ' : ' + angular.toJson(val) + ' was not defined.');}								
							};						
						});					
						ChatService.__deactivate_session_from_user_location(chat, $scope, false, false); // function(chat, scope, removeScope, removeSession, removeLocation)
						/*
var time = Firebase.ServerValue.TIMESTAMP;
						var chat_text = $scope.invited_user.name  + ' has joined chat';
						new_group_chat.group_chats.push({author: ChatService._internal_reference, to: chat.session_key, text: chat_text, 'time': time, priority:-1, session_key: chat.session_key});
						new_group_chat.group_chat_log.push(ChatService._internal_reference);
*/
						$scope.invited_user = undefined;
						new_group_chat.close_invite = setInterval(function()
						{
							new_group_chat.isTextFocus = true;
							new_group_chat.invite = false;
							new_group_chat.invited = '';
							clearInterval(new_group_chat.close_invite);
						}, 15000);
					}, 1000);
					
				}, 1500)									
			}
			else
			{
				if ( angular.isDefined( chat.firebase_location ) )
				{
					$log.debug('inside 2nd conditon');
					$scope.invited_user.session_location = ChatService.__setSessionLocationforGroupInvitee(chat.session_key, $scope.invited_user.user_id);
					$scope.invited_user.profile_location = UserService.__setProfileOnlineLocationforUser($scope.invited_user.user_id);
					chat.user_details[$scope.invited_user.user_id] = $scope.invited_user;
					UtilityService.removeByAttr(chat.invite_list, 'user_id', $scope.invited_user.user_id);
					var id = $scope.invited_user.user_id;
					var info = {
						avatar : $scope.invited_user.avatar,
						name : $scope.invited_user.name,
						user_id : $scope.invited_user.user_id
					};
					chat.firebase_location.child('active-users').child(id).update(info);
					var d = new Date();
					var time = d.getTime();
					$scope.invited_user.session_location.update({groupChat : chat.isGroupChat, name : chat.chat_description, session_key: chat.session_key, admin: chat.admin, 'time' : time });
					var chat_text = info.name + ' has joined chat';
					chat.group_chats.push({author: ChatService._internal_reference, to: chat.session_key, text: chat_text, 'time': time, session_key: chat.session_key});
					chat.group_chat_log.push(ChatService._internal_reference);
					if ( chat.convert )
					{
					   chat.group_count++;
					}				   
					$scope.invited_user = undefined;
					chat.isEmpty == false;
					if ( angular.isDefined(chat.close_invite) )
					{
						clearInterval(chat.close_invite)
					}
					chat.close_invite = setInterval(function()
					{
						chat.isTextFocus = true;
						chat.invite = false;
						chat.invited ='';
						clearInterval(chat.close_invite);
					}, 15000);
				}
			}
												
		}		
		else if ( angular.isDefined($scope.filteredArray[0]) && chat.invited == $scope.filteredArray[0].name && angular.isObject($scope.invited_user) )
		{
			$log.debug('set condition was met');
			chat.invitee_set = true;
		}
	}
	
	 
	$scope.onItemSelected = function(chat) // this gets executed when an item is selected
	{ 
		$scope.invited_user = $scope.filteredArray[0];
		if ( angular.isDefined($scope.filteredArray[0]) && chat.invited == $scope.filteredArray[0].name && angular.isObject($scope.invited_user) )
		{
			chat.invitee_set = true;
		}
		else 
		{
			$log.debug("N0 Match: invitee_set is false. " + angular.toJson($scope.filteredArray[0]));
			chat.invitee_set = false;
		}
	};
	  
	$scope.selectActiveSelection = function(chat)
	{
		if (angular.isObject($scope.invited_user))
		{
			$log.debug('invitee is set: invite');
	 		$scope.addInvitee(chat);
		}
		else
		{
			$log.debug('selecting active selection from');
			$log.debug(chat.invite_list);
			$scope.filteredArray = $filter('filter')(chat.invite_list, {name: chat.invited});
			$log.debug($scope.filteredArray);
		 	if (angular.isDefined($scope.filteredArray) && angular.isDefined( $scope.filteredArray[0]) && angular.isDefined( $scope.filteredArray[0].name))
		 	{
		 		chat.invited = $scope.filteredArray[0].name;
		 		$scope.invited_user = $scope.filteredArray[0];
		 		if ($scope.layout != 2)
		 		{
			 		$scope.stored_directory_index = chat.index_position;
		 		}
		 		$scope.addInvitee(chat);				 	
		 	}
		 	else
		 	{
		 		$scope.filteredArray = Array();
			 	$scope.inviteListInstance(chat);
		 	}		 	 	
		}
	}
	
	$scope.inviteListInstance = function(chat)
	{
		if (angular.isUndefined(chat) || chat == null)
		{
			return false;
		}
		if ( angular.isDefined( $scope.listener) )
		{
			$scope.listener();
		}
		$scope.listener = $scope.$watch('activeChats[chat.index_position].invited',function(newValue){
		   $log.debug($scope.activeChats[chat.index_position].invited);
		   if (chat.invite_list)
		   {
			  $scope.filteredArray = $filter('filter')(chat.invite_list, {name: newValue})[0]; 
		   }
		   
		});	
	}
	
	$scope.safeApply = function(fn) 
	{
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') 
		{
			if(fn && (typeof(fn) === 'function')) 
			{
				fn();
			}
		} 
		else 
		{
			this.$apply(fn);
		}
	};
	
}]);

'use strict'; /* Services */
angular.module('chatModule.services', []).
service('BrowserService', ['$http', '$log', function($http, $log) //this service will enable you to determine the operating system and browser of the user;
{
	var BrowserService = {};
	(function (window) {
	    {
	        var unknown = '-';
	
	        // screen
	        var screenSize = '';
	        if (screen.width) {
	            var width = (screen.width) ? screen.width : '';
	            var height = (screen.height) ? screen.height : '';
	            screenSize += '' + width + " x " + height;
	        }
	
	        //browser
	        var nVer = navigator.appVersion;
	        var nAgt = navigator.userAgent;
	        var browser = navigator.appName;
	        var version = '' + parseFloat(navigator.appVersion);
	        var majorVersion = parseInt(navigator.appVersion, 10);
	        var nameOffset, verOffset, ix;
	
	        // Opera
	        if ((verOffset = nAgt.indexOf('Opera')) != -1) {
	            browser = 'Opera';
	            version = nAgt.substring(verOffset + 6);
	            if ((verOffset = nAgt.indexOf('Version')) != -1) {
	                version = nAgt.substring(verOffset + 8);
	            }
	        }
	        // MSIE
	        else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
	            browser = 'Microsoft Internet Explorer';
	            version = nAgt.substring(verOffset + 5);
	        }
	        // Chrome
	        else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
	            browser = 'Chrome';
	            version = nAgt.substring(verOffset + 7);
	        }
	        // Safari
	        else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
	            browser = 'Safari';
	            version = nAgt.substring(verOffset + 7);
	            if ((verOffset = nAgt.indexOf('Version')) != -1) {
	                version = nAgt.substring(verOffset + 8);
	            }
	        }
	        // Firefox
	        else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
	            browser = 'Firefox';
	            version = nAgt.substring(verOffset + 8);
	        }
	        // MSIE 11+
	        else if (nAgt.indexOf('Trident/') != -1) {
	            browser = 'Microsoft Internet Explorer';
	            version = nAgt.substring(nAgt.indexOf('rv:') + 3);
	        }
	        // Other browsers
	        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
	            browser = nAgt.substring(nameOffset, verOffset);
	            version = nAgt.substring(verOffset + 1);
	            if (browser.toLowerCase() == browser.toUpperCase()) {
	                browser = navigator.appName;
	            }
	        }
	        // trim the version string
	        if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
	        if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
	        if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);
	
	        majorVersion = parseInt('' + version, 10);
	        if (isNaN(majorVersion)) {
	            version = '' + parseFloat(navigator.appVersion);
	            majorVersion = parseInt(navigator.appVersion, 10);
	        }
	
	        // mobile version
	        var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);
	
	        // cookie
	        var cookieEnabled = (navigator.cookieEnabled) ? true : false;
	
	        if (typeof navigator.cookieEnabled == 'undefined' && !cookieEnabled) {
	            document.cookie = 'testcookie';
	            cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
	        }
	
	        // system
	        var os = unknown;
	        var clientStrings = [
	            {s:'Windows 3.11', r:/Win16/},
	            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
	            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
	            {s:'Windows 98', r:/(Windows 98|Win98)/},
	            {s:'Windows CE', r:/Windows CE/},
	            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
	            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
	            {s:'Windows Server 2003', r:/Windows NT 5.2/},
	            {s:'Windows Vista', r:/Windows NT 6.0/},
	            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
	            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
	            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
	            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
	            {s:'Windows ME', r:/Windows ME/},
	            {s:'Android', r:/Android/},
	            {s:'Open BSD', r:/OpenBSD/},
	            {s:'Sun OS', r:/SunOS/},
	            {s:'Linux', r:/(Linux|X11)/},
	            {s:'iOS', r:/(iPhone|iPad|iPod)/},
	            {s:'Mac OS X', r:/Mac OS X/},
	            {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
	            {s:'QNX', r:/QNX/},
	            {s:'UNIX', r:/UNIX/},
	            {s:'BeOS', r:/BeOS/},
	            {s:'OS/2', r:/OS\/2/},
	            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
	        ];
	        for (var id in clientStrings) {
	            var cs = clientStrings[id];
	            if (cs.r.test(nAgt)) {
	                os = cs.s;
	                break;
	            }
	        }
	
	        var osVersion = unknown;
	
	        if (/Windows/.test(os)) {
	            osVersion = /Windows (.*)/.exec(os)[1];
	            os = 'Windows';
	        }
	
	        switch (os) {
	            case 'Mac OS X':
	                osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
	                break;
	
	            case 'Android':
	                osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
	                break;
	
	            case 'iOS':
	                osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
	                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
	                break;
	        }
	        
	        // flash (you'll need to include swfobject)
	        /* script src="//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js" */
	        var flashVersion = 'no check';
	        if (typeof swfobject != 'undefined') {
	            var fv = swfobject.getFlashPlayerVersion();
	            if (fv.major > 0) {
	                flashVersion = fv.major + '.' + fv.minor + ' r' + fv.release;
	            }
	            else  {
	                flashVersion = unknown;
	            }
	        }
	    }
	
	     BrowserService.platform = {
	        screen: screenSize,
	        browser: browser,
	        browserVersion: version,
	        mobile: mobile,
	        os: os,
	        osVersion: osVersion,
	        cookies: cookieEnabled,
	        flashVersion: flashVersion
	    };
	}(this));
/* 	console.log(BrowserService); */
	return BrowserService;
}]).
service('NotificationService', function() {
	var NotificationService = {};
	NotificationService._volume_level = .05;
	NotificationService.isGlobalSound = false;
	
	NotificationService._nudge = new Howl({
		urls: ['/modules/mod_chat/app/sounds/nudge.mp3'],
		volume: .5
	});
	
	NotificationService.__defineSounds = function() {
		
		NotificationService._chat = new Howl({
			urls: ['/modules/mod_chat/app/sounds/chat.mp3'],
			volume: NotificationService._volume_level
		});
		NotificationService._bash_error = new Howl({
			urls: ['/modules/mod_chat/app/sounds/bash_error.mp3'],
			volume: NotificationService._volume_level
		});
		NotificationService._chat_convert = new Howl({
			urls: ['/modules/mod_chat/app/sounds/chat_convert.mp3'],
			volume: NotificationService._volume_level
		});
		NotificationService._new_chat = new Howl({
			urls: ['/modules/mod_chat/app/sounds/new_chat.mp3'],
			volume: NotificationService._volume_level
		});
		NotificationService._update_alert = new Howl({
			urls: ['/modules/mod_chat/app/sounds/update_alert.mp3'],
			volume: NotificationService._volume_level
		});
		NotificationService._money = new Howl({
			urls: ['/modules/mod_chat/app/sounds/money.mp3'],
			volume: NotificationService._volume_level
		});
		NotificationService._chat_close = new Howl({
			urls: ['/modules/mod_chat/app/sounds/chat_close.mp3'],
			volume: NotificationService._volume_level
		});
	}
	NotificationService.__playSound = function(sound) {
		if (NotificationService.isGlobalSound) {
			sound.play();
		}
	}
	
	NotificationService.__nudge = function(sound) {
		sound.play();
	}

	NotificationService.__mute = function() {
		NotificationService.isGlobalSound = false;
	}
	NotificationService.__unmute = function() {
		NotificationService.isGlobalSound = true;
	}
	NotificationService.__toggleGlobalSound = function() {
		NotificationService.isGlobalSound = !NotificationService.isGlobalSound;
	}
	NotificationService.__updateSoundLevel = function(level) {
		if (level > -1 && level <= 50) {
			NotificationService._volume_level = parseFloat(level / 100);
			NotificationService.__defineSounds();
		}
	}
	return NotificationService;
}).
service("UserService", ['$log', '$http', '$firebase', 'FBURL', 'EXT_LINK', "ENCRYPT_PASS", '$window', 'BrowserService', 'NotificationService', '$timeout', 'localStorageService', 
	function($log, $http, $firebase, FBURL, EXT_LINK, ENCRYPT_PASS, $window, BrowserService, NotificationService, $timeout, localStorageService) { /* 	Firebase.enableLogging(true); */
	var UserService = {};
	if (localStorageService.get('isExistingChat'))
	{
		$log.debug('need to Destroy Chat')
/*
		var current = window.open('','_self');
		
		$timeout(function(){
			current.close();
			self.close(); 
			window.close();
		}, 500)
*/
	}
	else
	{
		
		localStorageService.add('isExistingChat', (Math.random() + 1).toString(36).substring(7));
		UserService._current_session = localStorageService.get('isExistingChat');
		$log.debug('UserService._current_sesson set to ' + UserService._current_session );
		
	}
	
	
	UserService._force_online = false; // set true to force users online for chat when they log into the site
	UserService._block_refresh = false;
	UserService._chat_presence_default = "Online";
	UserService._users_reference = "Users" + '/';
	UserService._users_profile_reference = "Users-Profiles" + '/';
	UserService._users_additional_profile_reference = "Users-Profiles-Additional" + '/';
	UserService._users_settings_reference = "Users-Settings" + '/';
	UserService._users_online_reference = "Users-Online" + '/';
	UserService._online_reference = '/online/';
	UserService._user_stored_online = '';
	UserService._users_state_reference = "Users-States" + '/';
	UserService._state_reference = '/state/';
	UserService._user_stored_state = '';
	UserService._users_presence_reference = "Users-Presence" + '/';
	UserService._chat_presence_reference = 'chat-presence/';
	UserService._users_geolocation_reference = 'User-Locations/';
	UserService._user_init = false;
	UserService._page_loaded = false;
	UserService._smod = false;
	UserService._tod = false;
	
	
	UserService._stored_user_presence = UserService._chat_presence_default;
	
	UserService._public_settings_reference = 'Public-Settings' + '/';
	
	UserService.profile = function(scope) {
		if (this.set == null) {
			var url = "index.php?option=com_callcenter&controller=trainings&task=getUser&format=raw";
			$http({
				method: "POST",
				url: url,
				headers: {
					'Content-Type': 'application/json'
				}
			}).
			success(function(response) {
				if (response.result == true) {
					UserService.set = true;
					UserService.__storeUserProfile(scope,response);
					scope.user_id = response.user_id;
					scope.name = response.name;
					scope.role = response.role;
					scope.position = response.position;
					scope.avatar = response.avatar;
					scope.pc = response.supervisors.pc;
					UserService.encryption = response.encryption;
					UserService._public_settings_location = new Firebase(FBURL + UserService._public_settings_reference);
					UserService._users_geolocation_location = new Firebase(FBURL + UserService._users_reference + UserService._users_geolocation_reference);
					UserService._users_profiles_location = new Firebase(FBURL + UserService._users_reference + UserService._users_profile_reference);
					UserService._user_profile_location = new Firebase(FBURL + UserService._users_reference + UserService._users_profile_reference + response.user_id + '/');
					UserService._users_additional_profiles_location = new Firebase(FBURL + UserService._users_reference + UserService._users_additional_profile_reference);
					UserService._user_additional_profile_location = new Firebase(FBURL + UserService._users_reference + UserService._users_additional_profile_reference + response.user_id + '/');
					UserService._user_settings_location = new Firebase(FBURL + UserService._users_reference + UserService._users_settings_reference + response.user_id + '/');
					UserService._users_online_location = new Firebase(FBURL + UserService._users_reference + UserService._users_online_reference);
					UserService._user_online_location = new Firebase(FBURL + UserService._users_reference + UserService._users_online_reference + response.user_id + '/');
					
					UserService.__setChatPresenceConnection = function() {
						UserService._user_chat_presence = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference + response.user_id + '/chat-presence'));
					}
					
					UserService.__watchProfiles(scope);
					
					
					
					$timeout(function() {
						UserService._public_settings_location.child('require-refresh').on('value', function(snapshot) {
/* 							console.log('page refresh value has changed to ' + snapshot.val()); */
							var page_refresh  = snapshot.val();
							if (page_refresh && UserService._block_refresh == false)
							{
								window.location.reload(true); 
/* 								console.log('page-refresh: ' + page_refresh); */
								UserService._block_refresh = false;
							}
						})
						
						
						UserService._user_online_location.on('value', function(snapshot) {
							var online_value = snapshot.val()
							if (!online_value) {
								return false;
							}
							if (online_value.online == false && UserService._user_chat_presence.$value != 'Offline') {
/* 								console.log('hey, im still online, yo'); */
								UserService._user_online_location.update({
									'online': true
								});
							} else if (online_value.online == false && UserService._user_chat_presence.$value == 'Offline') {
								UserService._user_presence_location.update({
									'chat-presence': 'Offline'
								});
								UserService._user_stored_online = false;
							} else {
								UserService._user_stored_online = true;
							}
						})
						
						UserService._public_settings_location.child('smod').on('value', function(snapshot) {
							var smod  = snapshot.val();
							if (smod && smod.user)
							{
								UserService._smod = UserService._users_profiles_obj['user_' + smod.user];
								scope.$broadcast('smodChange');
							}
							else
							{
								UserService._smod = false;
								scope.$broadcast('smodChange');
							}
							
						})
						
						UserService._public_settings_location.child('tod').on('value', function(snapshot) {
/* 							console.log('page refresh value has changed to ' + snapshot.val()); */
							var tod  = snapshot.val();
							if (tod && tod.user)
							{
								UserService._tod = UserService._users_profiles_obj['user_' + tod.user];
								scope.$broadcast('todChange');
							}
							else
							{
								UserService._tod = false;
								scope.$broadcast('todChange');
							}
							
						})
					}, 5000)
						
						
					

					UserService._users_state_location = new Firebase(FBURL + UserService._users_reference + UserService._users_state_reference);
					UserService._user_state_location = new Firebase(FBURL + UserService._users_reference + UserService._users_state_reference + response.user_id + '/');
					$timeout(function(){
						UserService._user_state_location.child('state').on('value', function(snapshot)
						{
								var user_state = snapshot.val();
								if (user_state == 'Offline' && UserService._user_chat_presence &&  UserService._user_chat_presence.$value != 'Offline')
								{
/* 									console.log('hey, im still have  a state, yo'); */
									UserService._user_state_location.update({'state':UserService._user_stored_state});
								}
								else
								{
									UserService._user_stored_state = user_state;
								}
						})
					}, 5000)
					UserService._user_state_location.child('state').once('value', function(snapshot) {
						if (snapshot.val() == null) {
							UserService._user_state_location.update({
								'state': 'Idle'
							})
						};
					});
					UserService._users_presence_location = new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference);
					UserService._user_presence_location = new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference + response.user_id + '/');
					UserService._user_presence_location.child('chat-presence').once('value', function(snapshot) {
						if (snapshot.val() == null) {
							UserService._user_presence_location.update({
								'chat-presence': 'Online'
							});
							$timeout(function() {
								UserService.__setChatPresenceConnection();
							}, 750)
						} else {
							UserService._stored_user_presence = snapshot.val();
							UserService.__setChatPresenceConnection();
						}
					});
					
					
					UserService._user_presence_location.child('message').once('value', function(snapshot) {
						var message = snapshot.val();
						if (message) {
							UserService._user_profile.presence.message = message;
						}
					});
					
					UserService._user_presence_location.child('show-message').once('value', function(snapshot) {
						var bool = snapshot.val();
						if (angular.isDefined(bool)) {
							UserService._user_profile.presence.show_message = bool;
						}
					});
					
					UserService._user_presence_location.child('auto-post').once('value', function(snapshot) {
						var bool = snapshot.val();
						if (angular.isDefined(bool)) {
							UserService._user_profile.presence.auto_post = bool;
						}
					});
					
					
					UserService._user_presence_location.child('chat-presence').on('value', function(snapshot) {
						var presence = snapshot.val();
						if (presence == 'Offline' && UserService._stored_user_presence != 'Offline') {
/* 							console.log('Hey, I still have chat presence, you'); */
							UserService._user_presence_location.update({
								'chat-presence': UserService._stored_user_presence
							});
						} else if (presence == 'Offline' && UserService._stored_user_presence == 'Offline') {
							UserService._user_online_location.update({
								'online': false
							});
						} else {
							UserService._stored_user_presence = presence;
						}
					})
					
					
					if (response.supervisors.pc) {
						scope.pc.online = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_online_reference + response.supervisors.pc.user_id + UserService._online_reference));
						scope.pc.chat_presence = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._user_presence_reference + response.supervisors.pc.user_id  + '/' + UserService._chat_presence_reference));
						scope.pc.state = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_state_reference + response.supervisors.pc.user_id  + UserService._state_reference));
					}
					scope.mc = response.supervisors.mc;
					if (response.supervisors.mc ) {
						if (scope.mc.name.slice(0, 4) != 'Ramp') {
							scope.mc.online = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_online_reference + response.supervisors.mc.user_id + UserService._online_reference));
							scope.mc.chat_presence = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._user_presence_reference + response.supervisors.mc.user_id+ '/' + UserService._chat_presence_reference));
							scope.mc.state = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_state_reference + response.supervisors.mc.user_id + UserService._state_reference));
						}
					}
					scope.admin = response.supervisors.admin;
					if (response.supervisors.admin) {
						scope.admin.online = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_online_reference + response.supervisors.admin.user_id + UserService._online_reference));
						scope.admin.chat_presence = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._user_presence_reference + response.supervisors.admin.user_id  + '/' + UserService._chat_presence_reference));
						scope.admin.state = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_state_reference + response.supervisors.admin.user_id  + UserService._state_reference));
					}
					if (response.isSupervisor === true) {
						scope.isSupervisor = true;
						UserService.isSupervisor = true;
						scope.teamMargin = 35;
					} else {
						UserService.isSupervisor = false;
						scope.isSupervisor = false;
					}
					UserService._user_settings_location.child('layout').once('value', function(snapshot) {
						if (snapshot.val() === null) {
							scope.layout = 1;
						} else {
							scope.layout = snapshot.val();
						}
					});
					
					UserService._user_settings_location.child('font-size').once('value', function(snapshot) {
						var font = snapshot.val();
						if (font) {
							scope.font_size = font;
						} else {
							scope.font_size = 12;
						}
					});
					
					UserService._user_settings_location.child('vertical-adjust').once('value', function(snapshot) {
						if (snapshot.val() === null) {
							scope.vertical_adjust = 0;
						} else {
							scope.vertical_adjust = parseInt(snapshot.val());
						}
					});
					
					UserService._user_settings_location.child('vertical-adjust-2').once('value', function(snapshot) {
						if (snapshot.val() === null) {
							scope.vertical_adjust_2 = 0;
						} else {
							scope.vertical_adjust_2 = parseInt(snapshot.val());
						}
					});
					
					UserService._user_settings_location.child('width-adjust').once('value', function(snapshot) {
						if (snapshot.val() === null) {
							scope.width_adjust = 0;
						} else {
							scope.width_adjust = snapshot.val();
						}
					});
					
					UserService._user_settings_location.child('external-monitor').once('value', function(snapshot) {
						if (snapshot.val() === null) {
							scope.external_monitor = false;
						} else {
							scope.external_monitor = snapshot.val();
						}
					});
					UserService._user_settings_location.child('is-external-window').once('value', function(snapshot) {
						if (snapshot.val() === null) {
							UserService._user_settings_location.update({
								'is-external-window': false
							})
						}
					});
					
					$log.debug(String(window.location.href).split('?')[1] + '  : ' + String(EXT_LINK).split('?')[1]);
					if (String(window.location.href).split('?')[1] == String(EXT_LINK).split('?')[1]) {
						scope.isExternalWindow = true;
						UserService._user_settings_location.update({
							'is-external-window': true
						})
						scope.isExternalInstance = true;
					} else {
						scope.isExternalInstance = false;
					}
					UserService._user_settings_location.child('/external-window-activate/').once('value', function(snapshot) {
						if (snapshot.val() == null) {
							UserService._user_settings_location.update({
								'external-window-activate': false
							})
						}
					});
					UserService._user_settings_location.child('/sound-level/').once('value', function(snapshot) {
						if (snapshot.val() === null) {
							scope.sound_level = 2;
							UserService._user_settings_location.update({
								'sound-level': parseInt(scope.sound_level)
							});
						} else {
							scope.sound_level = snapshot.val();
						}
						if (scope.sound_level) {
							NotificationService.__updateSoundLevel(scope.sound_level);
						}
					}); /* 					scope.layout = $firebase(new Firebase(FBURL + UserService._users_reference  + response.user_id+ '/layout/')); */
					scope.is_external_window = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_settings_reference + response.user_id + '/is-external-window/'));
					$timeout(function() {
						scope.is_panel_open = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_settings_reference + response.user_id + '/module-open/'));
					}, 5000)
					scope.last_active_chat_index = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_settings_reference + response.user_id + '/last-active-chat/'));
					scope.last_mandatory_chat_index = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_settings_reference + response.user_id + '/last-mandatory-chat/')); /* 					scope.isChatModuleOpen = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_settings_reference  + response.user_id+ '/module-open/')); */
					/* 					scope.vertical_adjust = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_settings_reference + response.user_id+ '/vertical-adjust/')); */
					/* 					scope.width_adjust = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_settings_reference + response.user_id+ '/width-adjust/')); */
					/* 					UserService.user_profile_firesocket = $firebase(UserService._user_profile_location);  */
					UserService._user_profile_location.update(UserService._user_profile_firebase);
					UserService._user_additional_profile_location.update(UserService._user_profile_additonal);
					UserService._user_additional_profile_location.child('platform').update(BrowserService.platform);
					UserService._user_additional_profile_location.child('platform').update({'ip':UserService._user_profile.ip});
					
					
					UserService._user_additional_profile_location.child('checkOutTime').once('value', function(snapshot){
						var lastCheckOut = snapshot.val();
						if(lastCheckOut)
						{
							if (lastCheckOut + 100000 < new Date().getTime())
							{
								$log.debug((lastCheckOut + 100000) + ' > ' + new Date().getTime());
								UserService._user_additional_profile_location.update({'checkInTime':Firebase.ServerValue.TIMESTAMP});
							}
							else
							{
								$log.debug('last check out was too recent to update new check in time');
							}
						}
						else
						{
							UserService._user_additional_profile_location.update({'checkInTime':Firebase.ServerValue.TIMESTAMP});
						}
					})
					
					UserService._user_additional_profile_location.update({'checkInTime':Firebase.ServerValue.TIMESTAMP});
					UserService.system_user_connection = new Firebase(FBURL + ".info/connected");
					UserService.system_user_connection.on("value", function(snap) {
						if (snap.val()) {
							UserService.firebase_connection = true;
							scope.firebase_connection = true;
							$timeout(function() {
/* 								UserService._user_profile_location.update(UserService.User); */
								UserService._user_online_location.update({
									'online': true
								});
								UserService._user_state_location.update({
									'state': 'Idle'
								});
								// Remove ourselves when we disconnect.
/* 								UserService._user_profile_location.onDisconnect().update(UserService.User); */
								UserService._user_online_location.onDisconnect().update({
									'online': false
								});
								UserService._user_state_location.onDisconnect().update({
									'state': 'Offline'
								}); /* 							 clearInterval(set_presence); */
							}, 1000);
						} else {
							UserService.firebase_connection = false;
							scope.firebase_connection = false;
							UserService._user_online_location.onDisconnect().update({
								'online': false
							});
							UserService._user_state_location.onDisconnect().update({
								'state': 'Offline'
							});
						}
					});
					UserService._user_presence_location.child('chat-presence').once('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
					{
						var presence = snapshot.val(); // store decrypted snap shot object
						////////////////////////////////////////////////////////////
						$log.debug('Path: The User chat-presence was retrieved from the firebasae : ' + presence);
						////////////////////////////////////////////////////////////
						if (UserService._force_online) {
							scope.broadcastPresenceStatus(UserService._chat_presence_default);
						} else if (angular.isUndefined(presence) || presence == null || presence == '') {
							//////////////////////////////////////////////////////////// 
							$log.debug('User chat-presence: Undefined > Set to default');
							////////////////////////////////////////////////////////////
							// Training Sheet is created here				
							UserService._user_presence_location.update({
								'chat-presence': UserService._chat_presence_default
							});
							scope.broadcastPresenceStatus(UserService._chat_presence_default);
						} else // ChatService._snapshot in ChatService.chat_presence_states
						{
							UserService._user_presence_location.update({
								'chat-presence': presence
							});
							scope.broadcastPresenceStatus(presence);
						}
					});
					UserService._user_presence_location.child('chat-presence').on('value', function(snapshot) {
						if (!snapshot.val()) {
							return false;
						}
						scope.broadcastPresenceStatus(snapshot.val());
					})
					UserService._user_presence_location.child('chat-presence').on('value', function(snapshot) {
						if (!snapshot.val() || angular.isUndefined(UserService._user_chat_presence)) {
							return false;
						}
						if (UserService._user_chat_presence.$value != 'Offline') {
							scope.broadcastPresenceStatus(snapshot.val());
							UserService._user_online_location.update({
								'online': true
							});
							UserService._user_state_location.update({
								'state': 'Idle'
							});
						}
					})
					$timeout(function() {
						if (scope.isExternalInstance) {
							localStorageService.add('isExternalWindow', true);
							UserService._user_settings_location.onDisconnect().update({
								'is-external-window': false
							});
							UserService._user_settings_location.child('is-external-window').on('value', function(snapshot) {
								if (snapshot.val()) {} else {
/* 									console.log('service broadcasting close external window') */
									scope.$broadcast('closeExternalWindow');
								}
							});
							window.onbeforeunload = function() { /* 							  UserService._user_online_location.update({'online':true}); */
								localStorageService.remove('isExternalWindow');
								UserService._user_additional_profile_location.update({'checkOutTime':Firebase.ServerValue.TIMESTAMP});
							};
						} else {
							window.onbeforeunload = function() {
								if (UserService._current_session == localStorageService.get('isExistingChat'))
								{
									localStorageService.remove('isExistingChat');
								}
								UserService._user_additional_profile_location.update({'checkOutTime':Firebase.ServerValue.TIMESTAMP});
								scope.$broadcast('clear_notifications');
							}
						}
						
						UserService._user_settings_location.child('/external-window-activate/').on('value', function(snapshot) {
							if (snapshot.val()) {
								if (scope.isExternalWindow == true && scope.isExternalInstance == true) {
									$timeout(function() {
										self.focus();
									})
									scope.$broadcast('activateExternalWindow');
								}
							}
							$timeout(function() {
								UserService._user_settings_location.update({
									'external-window-activate': false
								});
							}, 3000)
						});
					}, 5000)
					$timeout(function(){
						UserService._user_init = true;
					},2000);
					
				}
			}).
			error(function(response) {
				scope.codeStatus = response || "Request failed";
			});
		}
	};
	UserService.__activateExternalWindow = function() {
		UserService._user_settings_location.update({
			'external-window-activate': true
		})
	}
	UserService.__storeChatPresence = function(presence) {
		if (presence) {
			UserService._stored_user_presence = presence;
		}
	}
	UserService.__storeUserOnline = function(online) {
		if (angular.isDefined(online)) {
			UserService._stored_online_presence = online;
		}
	}
	UserService.__requireRefresh = function() {
		if (UserService._user_profile.position == 34) {
			UserService._block_refresh = true;
			UserService._public_settings_location.update({'require-refresh':true});
			$timeout(function(){
				UserService._public_settings_location.update({'require-refresh':false})
			}, 250)
		}
		else
		{
			$log.debug('refresh blocked');
		}
	}
	UserService.__setChatPresenceforUser = function(user_key) {
		return $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference + user_key + '/' + UserService._chat_presence_reference + '/'));
	}
	UserService.__setProfileOnlineLocationforUser = function(user_key) {
		return $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_online_reference + user_key + '/' + UserService._online_reference));
	}
	
	UserService.__watchProfiles = function(scope) { /* 		UserService.__watchPresenceChanges(scope); */
		if (angular.isUndefined(UserService._users_profiles_location)) {
			$log.debug('UserService._users_profiles_location was undefined');
			return false
		}
		UserService._users_profiles_obj = {};
		UserService._online_users_list = {};
		UserService._offline_users_list = {};
		UserService._offline_queue = {};
		UserService._users_profiles_location.once('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			var user_profiles = snapshot.val();
			if (user_profiles) {
				angular.forEach(user_profiles, function(profile) {
					profile.name = profile.name;
					UserService._users_profiles_obj['user_' + profile.user_id] = profile;
					if (profile.alias)
					{
						UserService._users_profiles_obj['user_' + profile.user_id].name = profile.alias;
					}
					if (profile.avatar == false){
						UserService._users_profiles_obj['user_' + profile.user_id].avatar = 'no-photo';
					}
					$timeout(function() {
						UserService.__watchOnline(scope, profile.user_id);
						UserService.__watchState(scope, profile.user_id);
					})
				});
			}
			if (UserService._users_profiles_obj['user_' + UserService._user_profile.user_id].alias)
			{
				UserService._user_profile.name = UserService._users_profiles_obj['user_' + UserService._user_profile.user_id].alias;
			}
		});
		UserService._users_profiles_location.startAt().on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			var profile = snapshot.val();
			if (angular.isUndefined(profile.user_id) || profile.user_id == UserService._user_profile.user_id) {
				return false
			};
			UserService._users_profiles_obj['user_' + profile.user_id] = profile;
			if (profile.alias)
			{
				UserService._users_profiles_obj['user_' + profile.user_id].name = profile.alias;
			}
			$timeout(function() {
				UserService.__watchAvatar(scope, profile.user_id);
				UserService.__watchOnline(scope, profile.user_id);
				UserService.__watchState(scope, profile.user_id);
			})
		})
		UserService._users_profiles_location.on('child_removed', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			var profile = snapshot.val();
			scope.safeApply(function() {
				$timeout(function() {
					delete UserService._users_profiles_obj['user_' + profile.user_id];
					delete UserService._offline_users_list['user_' + profile.user_id];
					delete UserService._online_users_list['user_' + profile.user_id];
				});
			});
		});
		UserService.sortProfile = function(scope, profile, online) {
			if (angular.isUndefined(profile.user_id) || profile.user_id == UserService._user_profile.user_id) {
				return false
			};
			scope.safeApply(function() {
				if (online) {
					delete UserService._offline_users_list['user_' + profile.user_id];
					UserService._online_users_list['user_' + profile.user_id] = profile;
				} else {
					delete UserService._online_users_list['user_' + profile.user_id];
					UserService._offline_users_list['user_' + profile.user_id] = profile;
				}
			});
		}
/*
		UserService.updateUsersListValueChange = function(scope, profile) {
			if (profile == null || profile.state == null) {
				return false;
			}
			scope.safeApply(function() {
				if (profile.online && profile['chat-presence'] != 'Offline') {
					delete UserService._offline_users_list['user_' + profile.user_id];
					UserService._online_users_list['user_' + profile.user_id] = profile;
				} else {
					delete UserService._online_users_list['user_' + profile.user_id];
					UserService._offline_users_list['user_' + profile.user_id] = profile;
				}
			});
		}
*/
	}
	UserService.__watchOnline = function(scope, user) {
		if (angular.isUndefined(UserService._users_online_location)) {
			$log.debug('failure: UserService._users_online_location is undefined');
			return false
		}
		UserService._users_online_location.child(user).on('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			var user_id = 'user_' + snapshot.name();
			var online_status = snapshot.val();
			if (online_status && online_status.online) {
				UserService.__removeOfflineQueue(user_id); /* 				console.log(UserService._offline_queue); */
				UserService._online_users_list[user_id] = UserService._users_profiles_obj[user_id];
				delete UserService._offline_users_list[user_id] /* 				console.log(UserService._online_users_list); */
			} 
			else {
				
				if (UserService._page_loaded) {
/* 					console.log(user_id + ' has gone offline'); */
					UserService.__storeOfflineQueue(user_id);
/* 					console.log('added to offline queue' + UserService._offline_queue[user_id]); */
					$timeout(function() {
						if (UserService.__isOfflineQueued(user_id)) {
							$log.debug('remove check was ' + UserService.__isOfflineQueued(user_id));
							$log.debug('removing ' + user_id + 'from online list');
							delete UserService._offline_queue[user_id];
							delete UserService._online_users_list[user_id];
							UserService._offline_users_list[user_id] = UserService._users_profiles_obj[user_id];
						}
						else
						{
/* 							console.log(user_id + ' came back online'); */
						}
				}, 10000)
				} else {
					delete UserService._offline_queue[user_id];
					delete UserService._online_users_list[user_id];
					UserService._offline_users_list[user_id] = UserService._users_profiles_obj[user_id];
				}
			}
		});
	}
	
	UserService.__watchAvatar = function(scope, user) {
		if (angular.isUndefined(UserService._users_profiles_location)) {
			$log.debug('UserService._users_state_location is undefined');
			return false
		}
		UserService._users_profiles_location.child(user).on('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			var avatarObj = snapshot.val();
			if (avatarObj && avatarObj != 'false') {
				var user_id = 'user_' + snapshot.name();
				if (angular.isUndefined(UserService._users_profiles_obj[user_id])) {
					$log.debug('UserService._users_profiles_obj is undefined');
					return false
				}
				UserService._users_profiles_obj[user_id].avatar = avatarObj.avatar;
			}
		});
	}
	UserService.__watchState = function(scope, user) {
		if (angular.isUndefined(UserService._users_state_location)) {
			$log.debug('UserService._users_state_location is undefined');
			return false
		}
		UserService._users_state_location.child(user).on('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			var user_state = snapshot.val();
			if (user_state && user_state.state) {
				var user_id = 'user_' + snapshot.name();
				if (UserService._users_profiles_obj[user_id]) {
					scope.$evalAsync(function() {
						$log.debug(UserService._users_profiles_obj[user_id].name + ' is ' + user_state.state);
						UserService._users_profiles_obj[user_id].state = user_state.state;
					})
				}
			}
		});
	}
	UserService.__watchPresenceChanges = function(scope) {
		if (angular.isUndefined(UserService._users_presence_location)) {
			return false
		}
		UserService._users_presence_location.on('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			var data = snapshot.val();
			if (data) { /* 				console.log(data); */
			}
		});
	}
	UserService.__getUserArray = function(){
		UserService._user_array = Array();
		angular.forEach(UserService._users_profiles_obj, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
			this.push(value);
		}, UserService._user_array);
		return UserService._user_array;
	}
	
	UserService.__updateState = function(state) {
/* 		console.log('update state being called with ' + state); */
		if (angular.isDefined(UserService._user_profile_location)) {
			if (UserService._user_chat_presence && UserService._user_chat_presence.$value != 'Offline') { /* 				UserService.user_profile_location.update(UserService.User); */
				/* 				UserService.user_online_location.update({'online': true}); */
				UserService._user_state_location.update({
					'state': state
				});
			} else {
/* 				console.log('update state was denied'); */
			}
		}
	}
	UserService.__storeOfflineQueue = function(user_id) {
		UserService._offline_queue[user_id] = true;
	}
	UserService.__removeOfflineQueue = function(user_id) {
		UserService._offline_queue[user_id] = false;
		delete UserService._offline_queue[user_id];
	}
	UserService.__isOfflineQueued = function(user_id) {
		if (UserService._offline_queue[user_id]) {
			return true;
		}
		return false;
	}
	UserService.__storeUserProfile = function(scope, response) {
		if (this.set && response) {
			this._user_profile = {};
			this._user_profile.presence = {};
			this._user_profile_additonal = {};
			this._user_profile_firebase = {};
			
			this._user_profile.name = response.name || false;
			this._user_profile.user_id = response.user_id || false;
			this._user_profile.avatar = response.avatar || false;
			
			this._user_profile.presence.message = '';
			this._user_profile.presence.show_message = false;
			this._user_profile.presence.auto_post = false;
			
			this._user_profile.position = response.position || false;
/* 				this._user_profile.ip = sjcl.encrypt(ENCRYPT_PASS, response.ip) || false; */
			this._user_profile.ip = response.ip || false;
			
			if(response.role){
			this._user_profile_additonal.role = this._user_profile.role = response.role || false;
			}
			if (response.office == false)
			{
				UserService.__getCityState(response.ip, this._user_profile_additonal, 2);
			}
			else
			{
				UserService.__getCityState(response, this._user_profile_additonal, 3);
			}
			this._user_profile.email = response.email || false;
			this._user_profile.phone = response.phone || false;
			this._user_profile.pc = angular.copy(response.supervisors.pc) || false;
			this._user_profile.mc = angular.copy(response.supervisors.mc) || false;
			this._user_profile.admin = angular.copy(response.supervisors.admin) || false;

			this._user_profile_additonal.office = response.office;
			this._user_profile_additonal.phone = this._user_profile.phone;
			this._user_profile_additonal.email = this._user_profile.email;
			this._user_profile_additonal.pc = this._user_profile.pc;
			this._user_profile_additonal.mc = this._user_profile.mc;
			
			this._user_profile_firebase.user_id = this._user_profile.user_id;
			this._user_profile_firebase.avatar = this._user_profile.avatar;
			this._user_profile_firebase.name = this._user_profile.name;
			scope.user_profile = this._user_profile;
/* 			console.log(scope.user_profile); */
			
			
		}
	}
	UserService.detectLayout = function() { /* 		console.log('detecting layout'); */
		if ($window.innerHeight > 900) {
			return 3;
		} else if ($window.innerHeight > 700) {
			return 1;
		} else {
			return 2;
		}
	}
	UserService.getUserField = function(field) {
		return this[field];
	}
	UserService.removeByAttr = function(arr, attr, value) {
		if (angular.isDefined(arr)) {
			var i = arr.length;
			while (i--) {
				if (arr[i] && arr[i].hasOwnProperty(attr) && (arguments.length > 2 && arr[i][attr] === value)) {
					arr.splice(i, 1);
				}
			}
			return arr;
		}
	}
	
	
	UserService.__setGeolocation = function(user){
		if(navigator.geolocation)
		{
			navigator.geolocation.getCurrentPosition(updatePosition);
		}
		else
		{
			UserService._users_geolocation_location.child(user).update({lat:false, lng:false});
			$log.debug("Geolocation is not supported by this browser.");
		}

		function updatePosition(pos){
			UserService._users_geolocation_location.child(user).update({lat:pos.coords.latitude, lng:pos.coords.longitude});
		}
	}
	
/*
	UserService.__getGeolocation = function(user, store){
		if(navigator.geolocation)
		{
			UserService._users_geolocation_location.child(user).once('value', function(snapshot){
				var user_location = snapshot.val();
				if(user_location)
				{
					if (user_location.lat && user_location.lng)
					{
						store.lat = user_location.lat;
						store.lng = user_location.lng
						UserService.__getCityState(store)
					}
				}
				else
				{
					store.lat = false;
					store.lng = false;
				}
			});
		}
		else
		{
			store.to_user_lat = false;
			store.to_uset_lng = false;
			
		}
	}
*/

	UserService.__getCityState = function(ip, store, option)
	{
		if (option == 1){
			$http({
				method: 'GET',
				contentType: 'application/json',
		        dataType:'json',
		        cache: true,
				url: 'http://freegeoip.net/json/' + ip,
			}).
			success(function(response) {
/*
				delete location.lat
				delete location.lng;
*/
/* 				console.log(response.results[0]['address_components']); */
				store.lat = response.latitude;
				store.lng = response.longitude;
				store.city = response.city;
				store.state = response.region_code;
				if(store.city == 'Colorado City'){ 
					store.city = 'Hildale';
					store.state = 'Ut';
				}
				

			}).
			error(function(response) {
				var codeStatus = response || "Request failed";
			});
		}
		else if (option == 2){
			$http({
				method: 'GET',
				contentType: 'application/json',
		        dataType:'json',
		        cache: true,
				url: 'http://ipinfo.io/' + ip + '/json',
			}).
			success(function(response) {
/*
				delete location.lat
				delete location.lng;
*/
/* 				console.log(response.results[0]['address_components']); */
				
				store.lat = response.loc.split(',')[0];
				store.lng = response.loc.split(',')[1];
				store.city = response.city;
				store.state = response.region;
				if(store.city == 'Colorado City'){ 
					store.city = 'Hildale';
					store.state = 'Ut';
				}
				store.isp = response.org;
				

			}).
			error(function(response) {
				var codeStatus = response || "Request failed";
			});
		}
		else if ( option == 3)
		{
			store.lat = ip.location.lat;
			store.lng = ip.location.lng;
			store.city = ip.location.city;
			store.state = ip.location.region;
		}
		
	}
	
	UserService.__getUserAdditionalProfile = function(user, store_object) {
/* 		console.log('calling controller to get additonal profile'); */
		UserService._users_additional_profiles_location.child(user).once('value', function(snapshot){
			var additional_profile = snapshot.val();
			if(additional_profile && store_object){
				store_object.additional_profile = additional_profile;
/* 				console.log('The additonal profile that was fetched was V'); */
/* 				console.log(store_object.additional_profile); */
				if(additional_profile.platform && additional_profile.platform.ip && UserService._user_profile.position != 31 && UserService._user_profile.position != 32 && UserService._user_profile.position != 33){
/*
					$timeout(function(){
						additional_profile.platform.ip = sjcl.decrypt(ENCRYPT_PASS, additional_profile.platform.ip );
					})
*/
					store_object.additional_profile = additional_profile;
				} else {
					delete additional_profile.platform.id;
					store_object.additional_profile = additional_profile;
				}
/* 				UserService.__getGeolocation(user, store_object.additional_profile); */
			}
			
		})
	}
/*
	// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
    console.log('cors not supported');
  }
  return xhr;
}

// Helper method to parse the title tag from the response.
function getTitle(text) {
  return text.match('<title>(.*)?</title>')[1];
}

// Make the actual CORS request.
function makeCorsRequest(url) {
  // All HTML5 Rocks properties support CORS.

  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    console.log('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    var title = getTitle(text);
    console.log('Response from CORS request to ' + url + ': ' + title);
  };

  xhr.onerror = function() {
    console.log('Woops, there was an error making the request.');
  };

  xhr.send();
}

	function getJson(json){
	console.log(json); // alerts the ip address
	}
	makeCorsRequest('api.openweathermap.org/data/2.5/weather?q=London,uk?callback=getJson');
*/
	return UserService;
}]).
service('AudioService', ['$http', '$log','$sce',   function($http,$log,$sce) // the purpose of this service is retieve the audio file that is asscociated witht he record that is going to be reviewed in the training sheet
{
	var promise;
	var keyCheck;
	var AudioService = {
		audioHistory: [],
		async: function(scope, contactID) 
		{			
			keyCheck = 'audio' + contactID;
			if ( keyCheck  in AudioService.audioHistory)
			{
				$log.debug('Denied: Audio File already in history');
				scope.audio.url = AudioService.audioHistory['audio' + contactID];
				return false;
			}
			else if (!angular.isDefined(contactID))
			{
				$log.debug("Denied: Parameter is undefined");
				return false;
			}
			// $http returns a promise, which has a then function, which also returns a promise
			var url = "index.php?option=com_callcenter&controller=trainings&task=fetchAudioFile&format=raw&contactID=" + contactID;
			promise = $http.get(url).then(function (response) 
			{
				  // The then function here is an opportunity to modify the response
				  // The return value gets picked up by the then in the controller.
				 if ( response.data )
				 {
				 	 if ( response.data == 'false')
				 	 {
					 	 $log.debug('Failure');
					 	 return false;
				 	 }
				 	 scope.audio.url = $sce.trustAsResourceUrl(angular.fromJson(response.data));
/*
					 audioFiles.push( // add a service that will retrieve any audio files that are associated with this record
				        {
						    src: angular.fromJson(response.data),
						    cid: contactID,
						    type: 'audio/wav'
						});
*/
					AudioService.audioHistory['audio' + contactID] = $sce.trustAsResourceUrl(angular.fromJson(response.data));
					return true;					 
				 }
				 else
				 {
					 $log.debug("no Audio File");
				 }
			  });
			  
		},	  
		asyncMessage: function(scope, message, contactID) 
		{			
			$log.debug('AudioService.async()  contactID: ' + contactID);
			keyCheck = 'audio' + contactID;
			if ( keyCheck  in AudioService.audioHistory)
			{
				$log.debug('Denied: Audio File already in history');
				scope.$evalAsync(function(){
				message.audio = AudioService.audioHistory['audio' + contactID];
				return false;
				});
			}
			else if (!angular.isDefined(contactID))
			{
				$log.debug("Denied: Parameter is undefined");
				return false;
			}
			// $http returns a promise, which has a then function, which also returns a promise
			var url = "index.php?option=com_callcenter&controller=trainings&task=fetchAudioFile&format=raw&contactID=" + contactID;
			promise = $http.get(url).then(function (response) 
			{
				  // The then function here is an opportunity to modify the response
				  // The return value gets picked up by the then in the controller.
				 if ( response.data )
				 {
				 	 if ( response.data == 'false')
				 	 {
					 	 $log.debug('Failure');
					 	 return false;
				 	 }
				 	 scope.$evalAsync(function(){
					 	  message.audio = $sce.trustAsResourceUrl(angular.fromJson(response.data));
				 	 });
				 	
/*
					 audioFiles.push( // add a service that will retrieve any audio files that are associated with this record
				        {
						    src: angular.fromJson(response.data),
						    cid: contactID,
						    type: 'audio/wav'
						});
*/
					AudioService.audioHistory['audio' + contactID] = $sce.trustAsResourceUrl(angular.fromJson(response.data));
					return true;					 
				 }
				 else
				 {
					 $log.debug("no Audio File");
				 }
			  });

		// Return the promise to the controller
		return promise;
		}
	};
	return AudioService;
}]).
service('OnlineService', ['$log', '$firebase', 'FBURL', 'UserService', '$timeout', function($log, $firebase, FBURL, UserService, $timeout) {
	var OnlineService = {};
	OnlineService._isTimestamps = false;
	OnlineService._online_check_reference = "Online-Check-In" + "/";
	OnlineService._online_check_location = new Firebase(FBURL + UserService._users_reference + OnlineService._online_check_reference);
	OnlineService.__setOnlineTracking = function(scope) {
		OnlineService._user_online_check_location = new Firebase(FBURL + UserService._users_reference + OnlineService._online_check_reference + UserService._user_profile.user_id);
		OnlineService._user_online_check_location.onDisconnect().remove();
		OnlineService._presence = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference + UserService._user_profile.user_id + '/chat-presence'));
		$timeout(function() {
			if (UserService._user_chat_presence && UserService._user_chat_presence.$value != 'Offline') { /* 				console.log("presence: " + UserService._user_chat_presence.$value); */
				OnlineService._online_check_location.child(UserService._user_profile.user_id).set(Firebase.ServerValue.TIMESTAMP);
			}
			OnlineService._user_check_in = setInterval(function() {
				if (UserService._user_chat_presence && UserService._user_chat_presence.$value != 'Offline') { /* 				console.log("presence: " + UserService._user_chat_presence.$value); */
					OnlineService._online_check_location.child(UserService._user_profile.user_id).set(Firebase.ServerValue.TIMESTAMP);
				}
			}, 30000)
			OnlineService._user_online_check_location.on('value', function(snapshot) {
				if (!snapshot.val()) {
					$timeout(function() {
						if (UserService._user_chat_presence.$value != 'Offline') {
/* 							console.log('location was removed update if still online'); */
							$timeout(function() {
								OnlineService._online_check_location.child(UserService._user_profile.user_id).set(Firebase.ServerValue.TIMESTAMP);
							}, 1000);
						} else if (UserService._user_chat_presence.$value == 'Offline') {
							OnlineService._user_online_check_location.remove();
						}
					})
				}
			})
		}, 5000)
		OnlineService._online_update = $timeout(function() {
/* 			console.log('interval cycle'); */
			if (UserService._user_chat_presence && UserService._user_chat_presence.$value != 'Offline') {
/* 				console.log('calling updatetimestamp'); */
				OnlineService.__updateTimestamp(scope);
			}
		}, 5000);
	}
	OnlineService.__resetTimeout = function(interval) {
/* 		console.log('resetting $timeout ' + interval); */
		OnlineService._online_update = $timeout(function() {
/* 			console.log('interval cycle ' + interval); */
			if (UserService._user_chat_presence.$value != 'Offline') {
				OnlineService.__updateTimestamp();
			}
			$timeout.cancel(OnlineService._online_update);
		}, interval);
	}
	OnlineService.__updateTimestamp = function(scope) {
		if (UserService._user_chat_presence.$value != 'Offline') {
/* 			console.log("presence: " + UserService._user_chat_presence.$value); */
			if (UserService._user_profile.role == 'Administrator' || UserService._user_profile.role == 'Shift Manager')
			{
				OnlineService.__updateOnlineTimestamps(scope);
			}
			
		} else if (UserService._user_chat_presence.$value == 'Offline') {
			OnlineService._user_online_check_location.remove();
		}
	}
	OnlineService.__updateOnlineTimestamps = function(scope) { /* 		var self = UserService._user_profile.user_id; */
		/* 		OnlineService._online_check_location.update({self: Firebase.ServerValue.TIMESTAMP}); */
		/* 		OnlineService._online_check_location.child(UserService._user_profile.user_id).set(Firebase.ServerValue.TIMESTAMP); */
		OnlineService._online_check_location.once('value', function(snapshot) {
			$log.debug('getting user stamps');
			var user_timestamps = snapshot.val();
			var i = 1;
			var stamp_index = 1;
			angular.forEach(user_timestamps, function(value, user_key) {
				if (OnlineService._isTimestamps) {
					i++;
					if (user_key == UserService._user_profile.user_id) {
/* 						console.log('User stamp index set to ' + i + ' because ' + user_key + ' matches ' + UserService._user_profile.user_id); */
						stamp_index = i;
					}
/* 					console.log('i = ' +i); */
					if (UserService._users_profiles_obj['user_' + user_key] && value > UserService._users_profiles_obj['user_' + user_key].last_check_in) { /* 						console.log('We dont need to set ' + user_key + ' offline'); */
					} else {
/* 						console.log('We need to set ' + user_key + ' offline'); */
						UserService.__storeOfflineQueue('user_' + user_key);
						$timeout(function() {
							if (UserService.__isOfflineQueued('user_' + user_key)) {
								OnlineService._online_check_location.child(user_key).remove();
/* 								console.log('remove check was ' + UserService.__isOfflineQueued('user_' + user_key)); */
/* 								console.log('setting ' + user_key + ' to offline'); */
								delete UserService._offline_queue['user_' + user_key];
								UserService._users_online_location.child(user_key).update({
									'online': false
								});
							} else {
/* 								console.log(user_key + ' came back online'); */
							}
						}, 4000)
					}
				}
/* 				console.log('user_' + user_key); */
				if(UserService._users_profiles_obj['user_' + user_key])
				{
					UserService._users_profiles_obj['user_' + user_key].last_check_in = value;
				}
				
			});
/* 			console.log('stmap_index = ' + stamp_index); */
			OnlineService._isTimestamps = true;
			$timeout(function() {
				OnlineService.__resetTimeout(62000 * stamp_index);
			}, 6000) /* 			console.log(UserService._users_profiles_obj); */
		})
	}
	return OnlineService;
}]).
/*
service('TeamService', ['$http',  function($http) // the purpose of this service is to gather the entire tree hierarchy of a users supervisors and all supervivees under that user
{
	var promise;
	var team;
	var TeamService= {
		async: function(scope) 
		{
			// $http returns a promise, which has a then function, which also returns a promise
			var url = 'index.php?option=com_callcenter&controller=trainings&task=getTeam&format=raw';
			promise = $http.get(url).then(function (response) 
			{
				  // The then function here is an opportunity to modify the response
				  // The return value gets picked up by the then in the controller.
				  scope.team =  response.data;
				  TeamService.user_team = response.data;
			  });
			// Return the promise to the controller
			return promise;
		}
	};
	return TeamService;
}]).
*/
service('ChatService', ['$rootScope', '$window', '$log', 'UserService', 'UtilityService', '$firebase', 'FBURL', '$timeout', 'NotificationService', 'ENCRYPT_PASS', function($rootScope, $window, $log, UserService, UtilityService, $firebase, FBURL, $timeout, NotificationService, ENCRYPT_PASS) {
	var ChatService = {};
	ChatService._is_typing_presence = true; // this is used to turn chat typing presence on or off 
	/* 	ChatService._allow_chat_request = true; */
	ChatService._header_color = "#00335B"; // default color of the chat header
	ChatService._closed_header_alert_color = '#ce6000'; // alternate color of the chat header
	ChatService._open_header_alert_color = '#4787ED'; // header changes to this color when chatbox is closed an an message is received
	ChatService._self_reference = "Me"; // used to label messages that came from user/self
	ChatService._parent_category_reference = "Chat-System/Users" + '/'; // parent folder name variable
	ChatService._url_root = FBURL + ChatService._parent_category_reference; // combine with global url variable 
	ChatService._chat_presence_states = ['Online', 'Offline', 'Busy', 'Invisible']; // optional chat stattes
	ChatService._active_session_reference = "Active-Sessions" + '/'; // folder reference to look monitoring users active chats
	ChatService._is_typing_reference = 'is-typing';
	ChatService._chat_message_storage_reference = "Stored-Messages/Users" + '/'; // parent folder reference to store chat messages
	ChatService._users_profiles_reference = FBURL + UserService._users_profiles_reference; // root folder location to look up a user profile info
	ChatService._user_profiles_location = new Firebase(ChatService._users_profiles_reference); // fireRef fo user profiles	
	////////////////////////////////////////////////////////////
	//Session Method
	ChatService._parent_session_reference = 'Chats' + '/';
	ChatService._session_url_root = FBURL + ChatService._parent_session_reference;
	ChatService._group_parent_category_reference = "Chat-System/Group-Chats" + '/'; // parent folder name variable
	ChatService._group_active_users_reference = "active-users";
	ChatService._group_url_root = FBURL + ChatService._group_parent_category_reference; // combine with global url variable 
	ChatService._last_pushed_session = null; // variable used to prevent duplication
	ChatService._last_query_location = ''; // variable used to prevent duplication
	ChatService._group_active_session_reference = "Active-Sessions" + '/'; // folder reference 
	ChatService._group_message_location_reference = "user-messages" + '/'; // folder reference for chat messages during group chat sessions
	ChatService._group_active_session_location = new Firebase(ChatService._group_url_root + ChatService._group_active_session_reference);
	ChatService._message_load_size = 5; // sets the amount of messages the chat will initally load
	ChatService._message_fetch_size = 15; // sets the amount of messages that will fetch from history
	ChatService._storage_limit = false; // true/false deletes any messages in the firebase storage location if the amount exceeds the 
	ChatService._single_query_size = 500;
	ChatService._group_query_size = 5000;
/* 	ChatService._store_time = 172800000; // 48 hours how long to store  messages in each users query	 */
	ChatService._store_time = 1209600000; // 2 weeks how long to store  messages in each users query	
	ChatService._internal_reference = "internal_chat";
	ChatService._is_playing_sound = false;
	
	ChatService.__retrieveSessionKey = function(scope, chatSession, to_user) {
		if (scope.active_sessions['user_' + to_user.user_id] == true) {
			$log.debug('Failure : Session Key denied');
			return false;
		}
		var to_user_session_key;
		chatSession.to_user_session_location = new Firebase(ChatService._url_root + to_user.user_id + '/' + ChatService._active_session_reference + ChatService._sub_category_reference + 'session_key/');
		chatSession.to_user_session_location.on('value', function(snapshot) {
			if (angular.isDefined(snapshot.val())) {
				ChatService.updateSessionStatus(scope, snapshot, chatSession.to_user_session_location, chatSession.index_position, chatSession.isGroupChat);
			}
		});
		if (angular.isUndefined(to_user.session_key) || to_user.session_key === null) {
			chatSession.to_user_session_location.once('value', function(snapshot) {
				if (snapshot.val() === null) {
					var user_id = UserService._user_profile.user_id;
					var firekey = ChatService._group_active_session_location.push({
						admin: UserService._user_profile.user_id,
						topic: false
					});
					ChatService._new_session_key = firekey.name();
					scope.new_session_key = firekey.name();
				} else {
					scope.new_session_key = snapshot.val();
				}
			});
		} else {
			chatSession.session_key = to_user.session_key;
		}
	}
	ChatService.updateSessionStatus = function(scope, data, location, index_position, isGroupChat) // listen for a change to a existing chat session
	{
		var index = null;
		if (angular.isDefined(index_position) && angular.isDefined(scope.activeChats[index_position])) {
			if (isGroupChat) {
				if (scope.activeChats[index_position].session_key == location.parent().parent().parent().name()) {
					index = data.index_position;
				}
			} else {
				if (scope.activeChats[index_position].to_user_id == location.parent().parent().parent().name()) {
					index = data.index_position;
				}
			}
		}
		if (index == null) {
			var chat_log = [];
			angular.forEach(scope.activeChats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
				if (angular.isDefined(value.to_user_id)) {
					this.push(value.to_user_id);
				} else {
					this.push(value.session_key);
				}
			}, chat_log);
			var index = chat_log.indexOf(location.parent().parent().parent().name());
		}
		if (index > -1) {
			$log.debug('To user session key has changed to : ' + data.val());
			scope.activeChats[index].to_user_session = data.val();
		} else {
			$log.debug(location.parent().parent().parent().name() + ' was not in ' + angular.toJson(chat_log));
		}
	}
	ChatService.__retrieveUsersLocation = function(session_key) {
		return ChatService._new_session_location.child(ChatService._group_active_users_reference);
	}
	ChatService.__retrieveUsersFiresocket = function(session_key) {
		if (session_key == ChatService._new_session_key) {
			return $firebase(ChatService._new_session_user_location.child(ChatService._group_active_users_reference));
		}
	}
	ChatService.__returnChatPresenceStates = function() // this function provides the caller with the predefined states that are available
	{
		return this._chat_presence_states;
	}
	ChatService.__storeToUser = function(to_user) // this function is called whenever connections need to be created to a user
	{
		$log.debug('Storing To User:' + angular.toJson(to_user));
		ChatService._to_user = {};
		ChatService._to_user._user_id = to_user.user_id;
		ChatService._to_user._name = to_user.name;
		ChatService._to_user._avatar = to_user.avatar;
	}
	ChatService.__set_active_sessions_user_location = function(scope) // this function is an initial process that looks at any existing objects in the users active session folder location and will generate new chat sessions for each of them, then well go inactive.
	{
		ChatService._active_sessions_user_location = null;
		scope.active_sessions = Array();
		scope.activeChats = Array();
		ChatService._active_sessions_user_location = new Firebase(ChatService._url_root + ChatService._sub_category_reference + ChatService._active_session_reference);
		ChatService._active_sessions_user_location.on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			var data = snapshot.val();
			if (angular.isUndefined(snapshot)) {
				$log.debug('New chat session detected -> Undefined');
				return false;
			} else if (angular.isUndefined(data.user_id) && angular.isUndefined(data.session_key)) {
				$log.debug('Rejected: ' + angular.toJson(data));
				return false;
			} else if (scope.active_sessions['user_' + String(data.user_id)] == true || scope.active_sessions[String(data.session_key)] == true) {
				$log.debug('Chat Session has already been created');
				return false;
			} else {
				$log.debug('New chat session detected after sessions established -> create');
				if (data.directoryChat) {
					scope.getDirectoryChat(data.session_key)
				} else {
					ChatService.__requestChatSession(scope, data, false);
				}
			}
		});
	}
	ChatService.__requestChatSession = function(scope, to_user, isfocus) {
		$log.debug('Requesting chat session');
		if (!(UtilityService.firebase_connection)) {
			$log.debug('Request Denied: Firebase is Offline');
			return false;
		} else if (scope.requested_chat == to_user.user_id || scope.requested_chat == to_user.session_key) {
			$log.debug('This appears to be a duplicate rquest, return false'); /* 			console.log('requested: ' + scope.requested_chat + ' to_user.user_id: ' + to_user.user_id); */
			scope.requested_chat = false;
			return false;
		}
		if (angular.isDefined(to_user.groupChat) && to_user.groupChat == true && angular.isDefined(to_user.session_key)) {
			scope.requested_chat = to_user.session_key;
			if (scope.active_sessions[to_user.session_key] == true && angular.isDefined(scope.activeChats)) {
				$log.debug('Chat Session already exists in active_sessions');
				angular.forEach(scope.active_sessions, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
					this.push(value.key);
				}, chat_log);
				var index = chat_log.indexOf(to_user.session_key);
				if (scope.layout != 2) {
					scope.setDirectoryChat(index, true);
				} else {
					scope.activeChats[index].isopen = true;
					scope.activeChats[index].isTextFocus = true;
				}
				return false;
			} /* 			console.log('building as group chat'); */
			ChatService.__buildGroupChatSession(scope, to_user, to_user.isOpen || true, isfocus, 1); // function(scope, value, isopen, isfocus)
			return true;
		} else {
			scope.requested_chat = to_user.user_id
			if (angular.isUndefined(to_user) || to_user.user_id == UserService._user_profile.user_id) {
				$log.debug('Chat session denied - undefined/self');
				return false;
			} else if (angular.isDefined(to_user.user_id) && scope.active_sessions['user_' + to_user.user_id] == true) {
				$log.debug('This chat shows as registered');
				var chat_log = [];
				angular.forEach(scope.activeChats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
					if (angular.isDefined(value.to_user_id)) {
						this.push(value.to_user_id);
					} else {
						this.push(value.session_key);
					}
				}, chat_log);
				var index = chat_log.indexOf(to_user.user_id);
				if (angular.isDefined(scope.activeChats[index]) && scope.activeChats[index].to_user_id == to_user.user_id) {
					$log.debug('Chat is already in the list of active chats');
					$log.debug(angular.toJson(chat_log));
					if (scope.layout != 2) {
						scope.safeApply(function() {
							$timeout(function() {
								scope.setDirectoryChat(index, true);
							}, 50)
						})
					} else if (scope.layout == 2 && scope.activeChats[index].index_position >= scope.max_count) {
						scope.swapChatPositions(scope.activeChats[index].index_position, scope.max_count - 1)
						ChatService.__setLastPushed(scope.activeChats[scope.max_count - 1].to_user_id);
						scope.activeChats[scope.max_count - 1].isopen = true;
						scope.activeChats[scope.max_count - 1].isTextFocus = true;
					} else {
						scope.activeChats[index].isopen = true;
						scope.activeChats[index].isTextFocus = true;
						ChatService.__setLastPushed(scope.activeChats[index].to_user_id);
					}
					$timeout(function() {
						if (!(ChatService._is_playing_sound)) {
							NotificationService.__playSound(NotificationService._new_chat);
						}
					}, 250);
					return true;
				}
				return false;
			}
			$log.debug('all checks passed, build chat');
			ChatService.__buildChatSession(scope, to_user, to_user.isOpen, isfocus, 14); // (scope, to_user, isopen, isfocus) 
			return true;
		}
	};
	ChatService.__setDefaultSettings = function(chat) {
		chat.user_log = {}; //used to track users if this is a group chat
		chat.user_details = {};
		chat.participant_log = Array(); // this is used to include everyone that particpated in a chat receipt
		chat.is_typing_list = Array();
		chat.chats = Array(); // this is where each chat message will be stored
		chat.chat_log = Array();
		chat.group_chats = Array(); // this is where each chat message will be stored
		chat.group_chat_log = Array(); // this is used to store the user_id of each chat message, it gives the ability to determine the length of each chat, last active user, and is also used for conditional formating in the chat view ex. ['82, 63, 63, 63, 82, 82'];
		// topic values
		chat.isTopicFocus = false;
		chat.topic_description = '';
		chat.topic_height = 0;
		chat.isTopicTruncated = false;
		//tagging
		chat.tag_description = '';
		chat.tag = false;
		// on the bubble
		chat.isHeader = true;
		//scroll control
		chat.scroll_bottom = true;
		chat.scroll_top = false;
		//chat refernencing
		chat.reference = null;
		chat.referenceAuthor = null;
		chat.referenceName = null;
		chat.referenceText = null;
		//typing presence
		chat.isTypingPresence = ChatService._is_typing_presence; // this is used to turn chat typing presence on or off 
		chat.isTyping = false; // this is used to alert the other user is the user is currently typing 
		//adding another user
		chat.invite = false; // this is used to toggle ability to invite user into the chat
		chat.invited = ''; // this is used the track the name of the user that is to be invited into the group chat. .ie a string such as "Andy Cook";
		chat.invitee_set = false; // this flag is used to determine that the host user has selected  a name to invite into the chat and that name has been verified to exist within the invite_list
		//states
		chat.isNewMessage = false;
		chat.reload = false;
		chat.reloaded = false;
		// priority/indexing
		chat.first_priority = false;
		chat.next_priority = 1;
		chat.isMorePrev = true;
		//display flags
		chat.isTopSpacer = false;
		chat.isopen = true;
		chat.isSound = true;
		chat.isGroupChat = false;
		chat.showUserList = false;
		chat.showUserOptions = false;
		chat.emotions = false; // toggle flag tht determines if the emotion dox should be displayed to the user		
		// internal values
		chat.addVideo = false;
		chat.addImage = false;
		chat.addAudio = false;
		chat.nudge = false;
		chat.resize_adjustment = 0;
		chat.chat_text = null;
		chat.self_name = ChatService._self_reference; // variable for what the chat session should label messages that came from the user/self ex. "Me"
		chat.header_color = ChatService._header_color;
		chat.time_reference = new Date().getTime();
		chat.time_format = 'timeago';
		chat.convert = false;
		chat.unread = 0; // this tracks the count of the messages sent to the user while the chat box is closed	
		chat.group_count = 0;
		chat.user_avatar = UserService._user_profile.avatar;
		chat.user_id = UserService._user_profile.user_id;
		chat.header_color = ChatService._header_color; // default color to restore after a alert changes has happened
		chat.internal_reference = ChatService._internal_reference;
		chat.isTextFocus = false;
		chat.isTagFocus = false;
		chat.isTopicFocus = false;
		chat.isDirectoryChat = false;
		return;
	}
	ChatService.__buildChatSession = function(scope, to_user, isopen, isfocus, store_length) // this function builds out the details of an individual chat sesssion
	{
		if (angular.isUndefined(scope) || angular.isUndefined(to_user)) {
			///////////////////////////////////////////////////////////
			$log.debug('ChatService.__buildChatSession failed. Undefined scope/to_user');
			////////////////////////////////////////////////////////////
			return false;
		}
		var chatSession = {};
		ChatService.__setDefaultSettings(chatSession);
		ChatService.__retrieveSessionKey(scope, chatSession, to_user); // establish a unique session key for this chat
		if (angular.isDefined(to_user.time)) {
			$log.debug('Setting session time. ' + to_user.time);
			chatSession.time = to_user.time
		} else {
			var d = new Date();
			chatSession.time = d.getTime();
			$log.debug('Creating new time stamp:  ' + chatSession.time);
		}
		if (angular.isDefined(to_user.admin)) {
			$log.debug('Setting session admin. Should be an user_id ' + to_user.admin);
			chatSession.admin = to_user.admin
		} else {
			$log.debug('Setting session admin as self:  ' + UserService._user_profile.user_id);
			chatSession.admin = UserService._user_profile.user_id;
		}
		if (angular.isDefined(isopen)) // this flag controls whether the chatbox should be open when it is created. Useful to close page reloads chatSessions so the messages can gracefully load
		{
			chatSession.isopen = isopen;
		}
		if (angular.isDefined(to_user.resize_adjust)) // this flag loads any  previous resize adjustments
		{
			chatSession.resize_adjustment = to_user.resize_adjust;
		}
		if (angular.isDefined(to_user.name)) {
			chatSession.to_user_name = to_user.name; // used at the top of the chat box
			var name_split = to_user.name.match(/\S+/g); // splits the to_users first and last name
			chatSession.to_user_f_name = name_split[0]; // used to display only  the to_users first_name next to the chat message
		}
		if (angular.isDefined(isfocus)) {
			chatSession.isTextFocus = isfocus; // used at the top of the chat box
		} else {
			chatSession.isTextFocus = false
		}
		if (angular.isDefined(to_user['groupChat'])) {
			chatSession.isGroupChat = to_user['groupChat'];
		}
		if (angular.isDefined(to_user.isSound) && to_user.isSound != null) {
			chatSession.isSound = to_user.isSound;
		}
		if (angular.isDefined(to_user.tag)) {
			chatSession.tag = to_user.tag;
		}
		if (angular.isDefined(to_user.index_position)) {
			chatSession.index_position = to_user.index_position;
		}
		chatSession.active_session_location = ChatService.__setActiveSessionLocation(scope, to_user.user_id, false); // used to see if the chat is turned into a group chat by some adding someone	
		chatSession.topic_location = $firebase(chatSession.active_session_location.child('topic'));
		// define to user info and firebase  connections
		chatSession.user_log[to_user.user_id] = {
			avatar: to_user.avatar,
			name: to_user.name,
			user_id: to_user.user_id
		};
		chatSession.to_user_role = to_user.role;
		chatSession.to_user_id = to_user.user_id;
		chatSession.to_user_avatar = to_user.avatar;
		ChatService.__setToUserChatPresenceLocation(chatSession,to_user); // also sets the to_user info, so must be called firest // fetches the to_user chat state .. active, offline, busy, etc
/* 		chatSession.to_user_chat_presence = ChatService.__setToUserChatPresence(to_user); // also sets the to_user info, so must be called firest // fetches the to_user chat state .. active, offline, busy, etc */
		chatSession.to_user_message_location = ChatService.__returnToUserMessageLocation(); // firebase location of the to user, so we know where to write chat message for this chat session.
		chatSession.active_typing_to_user_location = ChatService.__set_active_typing_to_user_location(); // firebase folder that is written true whenever the user is typing
		chatSession.active_typing_to_user_location.update({
			'is-typing': false
		});
		chatSession.active_session_to_user_location = ChatService.__set_active_session_to_user_location(); // firebase folder that the service writes the to users info into , so the the to_user knows that there is a chat going on between them
		chatSession.to_user_online = UserService.__setProfileOnlineLocationforUser(to_user.user_id);
		// define user info and firebse connections
		chatSession.user_id = UserService._user_profile.user_id;
		chatSession.user_avatar = UserService._user_profile.avatar;
		chatSession.user_message_location = ChatService.__returnFromUserMessageLocation(scope); // firebase location of the from_user/self, so we know where to write chat message for this chat session.
		chatSession.user_online = UserService.__setProfileOnlineLocationforUser(UserService._user_profile.user_id);
		chatSession.user_chat_presence = UserService.__setChatPresenceforUser(UserService._user_profile.user_id);
		chatSession.active_typing_user_location = ChatService.__set_active_typing_user_location(scope); // this is a fireabse folder location where other users write true under their own uid to let the user know that they are typing
		chatSession.active_typing_user_location.update({
			'is-typing': false
		});
		chatSession.active_typing_user_location.onDisconnect().remove();
		chatSession.active_typing_user_socket = ChatService.__set_active_typing_user_socket(scope); // this is a fireabse folder location where other users write true under their own uid to let the user know that they are typing
		chatSession.user_log[UserService._user_profile.user_id] = {
			avatar: UserService._user_profile.avatar,
			name: UserService._user_profile.name,
			user_id: UserService._user_profile.user_id
		};
		$timeout(function() {
			if (angular.isUndefined(chatSession.session_key)) {
				chatSession.session_key = scope.new_session_key;
			}
			chatSession.messageListQuery = ChatService.__returnMessageListQuery(scope, chatSession.time, chatSession.user_message_location, ChatService._to_user._user_id, chatSession.isGroupChat, store_length); // this creates a query of the messages pointed at the from_user storage location , messages must be written in both the user and to_user chatbox pointer locations
			// set pointer to user-group, used to remove the session if no one is longer using it
			var session_root = ChatService._group_url_root + ChatService._group_active_session_reference + chatSession.session_key + '/';
			chatSession.firebase_location = new Firebase(session_root);
			if (chatSession.topic_location.$value == null) {
				chatSession.firebase_location.update({
					'topic': false
				});
			}
			chatSession.group_user_location = chatSession.firebase_location.child(ChatService._group_active_users_reference);
			$log.debug('session_key is : ' + chatSession.session_key);
			ChatService.__pushChatSession(chatSession, to_user, scope); // pushes the chat session into the scope of the view
			/* 			clearInterval(build_delay); */
		}, 500);
	}
	ChatService.__buildGroupChatSession = function(scope, value, isopen, isfocus, store_length) // this function builds out the details of an individual chat sesssion
	{
		$log.debug('building group chat');
		if (angular.isUndefined(scope) || angular.isUndefined(value.session_key) || angular.isUndefined(value.admin)) {
			///////////////////////////////////////////////////////////
			$log.debug('ChatService.__buildGroupChatSession failed. Undefined scope/session_key');
			////////////////////////////////////////////////////////////
			return false;
		}
		var groupChatSession = {};
		ChatService.__setDefaultSettings(groupChatSession);
		groupChatSession.session_key = value.session_key;
		groupChatSession.time = value.time;
		groupChatSession.isGroupChat = true;
		var session_root = ChatService._group_url_root + ChatService._group_active_session_reference + groupChatSession.session_key + '/';
		groupChatSession.firebase_location = new Firebase(session_root);
		groupChatSession.group_message_location = new Firebase(ChatService._group_url_root + ChatService._group_active_session_reference + groupChatSession.session_key + '/' + ChatService._group_message_location_reference);
		groupChatSession.messageListQuery = ChatService.__returnMessageListQuery(scope, groupChatSession.time, groupChatSession.group_message_location, groupChatSession.session_key, groupChatSession.isGroupChat, 1); // this creates a query of the messages pointed at the from_user storage location , messages must be written in both the user and to_user chatbox pointer locations
		groupChatSession.active_session_location = ChatService.__setActiveSessionLocation(null, groupChatSession.session_key, true);
		groupChatSession.group_active_typing_location = ChatService.__set_active_typing_group_location(scope, groupChatSession.session_key); //point to where the typing-presence values will be stored
		groupChatSession.topic_location = $firebase(groupChatSession.firebase_location.child('topic'));
		groupChatSession.group_user_location = groupChatSession.firebase_location.child(ChatService._group_active_users_reference);
		$log.debug(groupChatSession.group_user_location.toString());
		groupChatSession.user_details = {};
		groupChatSession.admin = value.admin;
		if (angular.isDefined(isopen)) {
			groupChatSession.isopen = isopen;
		} // this flag controls whether the chatbox should be open when it is created. Useful to close page reloads chatSessions so the messages can gracefully load
		//
		if (angular.isDefined(isfocus)) {
			groupChatSession.isTextFocus = isfocus;
		}
		if (angular.isDefined(value.isSound)) {
			groupChatSession.isSound = value.isSound;
		}
		if (angular.isDefined(value.tag)) {
			chatSession.tag = value.tag;
		}
		if (angular.isDefined(value.index_position)) {
			groupChatSession.index_position = value.index_position;
		}
		if (angular.isDefined(value.resize_adjust)) {
			groupChatSession.resize_adjustment = value.resize_adjust;
		}
		groupChatSession.group_user_location.on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{ // this event will detect when another user is added to a group chat, and each user that participating will update that person into their user_log 
			if (angular.isDefined(snapshot.val()) && snapshot.val() != null) {
				var data = snapshot.val();
				var val = data.user_id;
				$log.debug(val);
				if (angular.isDefined(groupChatSession.user_log)) {
					groupChatSession.user_log[val] = data;
					var user = {};
					user.user_id = val;
					user.name = data.name;
					user.avatar = data.avatar;
					user.profile_location = UserService.__setProfileOnlineLocationforUser(val);
					user.session_location = ChatService.__setSessionLocationforGroupInvitee(groupChatSession.session_key, val);
					groupChatSession.user_details[val] = user;
					groupChatSession.participant_log['user_' + user.user_id] = user.name;
					if (user.user_id != UserService._user_profile.user_id) {
						/*
var n = parseInt(Firebase.ServerValue.TIMESTAMP);
						var chat_text = user.name + ' was added to chat';
						groupChatSession.group_chats.push({
							author: ChatService._internal_reference,
							to: groupChatSession.session_key,
							text: chat_text,
							time: n,
							priority: -1,
							session_key: groupChatSession.session_key
						});
						groupChatSession.group_chat_log.push(ChatService._internal_reference);
						if (scope.isPageLoaded) {
							scope.alertNewChat(groupChatSession.index_position, true);
						}
*/
						UtilityService.removeByAttr(groupChatSession.invite_list, 'user_id', val);
					}
					if (user.user_id != UserService._user_profile.user_id) {
						groupChatSession.group_count = groupChatSession.group_count + 1;
					}
					$log.debug(groupChatSession.user_details);
				} else {
					$log.debug(val + 'groupChatSession.user_log was not defined');
				}
			} else {
				$log.debug('Child was undefined/null');
			}
		});
		groupChatSession.group_typing_location = new Firebase(groupChatSession.firebase_location + 'is-typing/');
		groupChatSession.group_typing_location.on('child_added', function(snapshot) {
			if (snapshot.name() == UserService._user_profile.user_id) {
				return;
			}
			scope.safeApply(function() {
				groupChatSession.is_typing_list.push(snapshot.val());
			})
		})
		groupChatSession.group_typing_location.on('child_removed', function(snapshot) { /* 			console.log(snapshot.val()); */
			/* 				delete newDirectoryChat.is_typing_list[snapshot.name()]; */
			groupChatSession.is_typing_list.splice(groupChatSession.is_typing_list.indexOf(snapshot.val(), 1));
		})
		groupChatSession.group_user_location.on('child_removed', function(childSnapshot) { // detects a ref_location.remove(JsonObjKey) made to the reference location
			var data = childSnapshot.val();
			var val = data.user_id;
			if (data.user_id == UserService._user_profile.user_id)
			{
				if (scope.last_deactivated_chat !=  groupChatSession.session_key)
				{
					scope.removeChatSession(groupChatSession);
				}
				return;
			}
			if (angular.isDefined(groupChatSession.user_details) && angular.isDefined(groupChatSession.user_details[val])) {
				if (angular.isDefined(groupChatSession.user_details[val].profile_location)) {
					groupChatSession.user_details[val].profile_location.$off();
				}
				if (angular.isDefined(groupChatSession.user_details[val].session_location)) {
					groupChatSession.user_details[val].session_location.off();
				}
				delete groupChatSession.user_details[val];
				delete groupChatSession.user_log[val];
				var n = Firebase.ServerValue.TIMESTAMP;
				var chat_text = data.name + ' has left';
				groupChatSession.group_chats.push({
					author: ChatService._internal_reference,
					to: groupChatSession.session_key,
					text: chat_text,
					time: n,
					priority: -1,
					session_key: groupChatSession.session_key
				});
				groupChatSession.group_chat_log.push(ChatService._internal_reference);
				if (scope.isPageLoaded) {
					scope.alertNewChat(groupChatSession.index_position, true, null);
				}
				if (data.user_id != UserService._user_profile.user_id) {
					groupChatSession.group_count--;
					if (groupChatSession.invite_list) {
						groupChatSession.invite_list.push({
							avatar: data.avatar,
							name: data.name,
							user_id: data.user_id
						});
					}
				}
			}
		});
		if (angular.isDefined(value.name)) {
			groupChatSession.chat_description = value.name;
		} else {
			groupChatSession.chat_description = 'Group -' + groupChatSession.user_details[value.admin].name;
		} // used at the top of the chat box	
		if (angular.isDefined(groupChatSession.session_key) && angular.isDefined(groupChatSession.user_log) && angular.isDefined(groupChatSession.user_details)) {
			$log.debug('Pushing chat session into scope');
			$timeout(function() {
				ChatService.__pushChatSession(groupChatSession, false, scope); // pushes the chat session into the scope of the view				
			}, 500) //timeout helps keep chats in right order on reload, group chats spawn much faster so they will always be at the 0 index otherwise
		} else {
			$log.debug('Complete Failure');
			return false;
		}
	}
	ChatService.__convertToGroupChat = function(chat, index, scope) {
		$log.debug('Begin converting chat to a group chat');
		if (angular.isUndefined(chat.session_key)) {
			////////////////////////////////////////////////////////////
			$log.debug('Failure: session_key not defined');
			////////////////////////////////////////////////////////////
			return false
		}
		if (angular.isUndefined(scope) || angular.isUndefined(chat)) {
			///////////////////////////////////////////////////////////
			$log.debug('ChatService.__convertToGroupChat, Undefined scope/chat');
			////////////////////////////////////////////////////////////
			return false;
		}
		var groupChatSession = {};
		ChatService.__setDefaultSettings(groupChatSession);
		if (angular.isDefined(chat.firebase_location)) {
			groupChatSession.firebase_location = chat.firebase_location;
		} else {
			var session_root = ChatService._group_url_root + ChatService._group_active_session_reference + chat.session_key + '/';
			groupChatSession.firebase_location = new Firebase(session_root);
		}
		groupChatSession.topic_location = $firebase(groupChatSession.firebase_location.child('topic'));
		groupChatSession.active_session_location = ChatService.__setActiveSessionLocation(null, groupChatSession.session_key, true);
		if (angular.isDefined(chat.group_user_location)) {
			groupChatSession.group_user_location = chat.group_user_location;
		} else {
			groupChatSession.group_user_location = groupChatSession.firebase_location.child(ChatService._group_active_users_reference);
		}
		groupChatSession.group_active_typing_location = ChatService.__set_active_typing_group_location(scope, chat.session_key); //point to where the typing-presence values will be stored
		groupChatSession.group_message_location = new Firebase(ChatService._group_url_root + ChatService._group_active_session_reference + chat.session_key + '/' + ChatService._group_message_location_reference); // point to where the chat message for this group converstion will be stored
		if (angular.isDefined(chat.time)) {
			groupChatSession.time = chat.time
		} else {
			var d = new Date();
			groupChatSession.time = d.getTime();
		}
		groupChatSession.messageListQuery = ChatService.__returnMessageListQuery(scope, chat.time, groupChatSession.group_message_location, chat.session_key, true, 1); // this creates a query of the messages pointed at the from_user storage location , messages must be written in both the user and to_user chatbox pointer locations
		if (angular.isDefined(chat.user_log)) {
			groupChatSession.user_log = chat.user_log;
		} else {
			groupChatSession.user_log = {};
		}
		if (angular.isDefined(chat.admin)) {
			groupChatSession.admin = chat.admin;
		} else {
			groupChatSession.admin = UserService._user_profile.user_id;
		}
		if (angular.isDefined(chat.adminName)) {
			groupChatSession.adminName = chat.adminName;
		} else {
			if (angular.isDefined(groupChatSession.user_log[groupChatSession.admin]) && angular.isDefined(groupChatSession.user_log[groupChatSession.admin].name)) {
				groupChatSession.adminName = groupChatSession.user_log[groupChatSession.admin].name
			} else {
				groupChatSession.adminName = UserService._user_profile.name
			}
		}
		if (angular.isDefined(chat.chat_description)) {
			groupChatSession.chat_description = chat.chat_description;
		} else {
			groupChatSession.chat_description = 'Group - ' + groupChatSession.adminName;
		}
		if (angular.isDefined(chat.user_details)) {
			groupChatSession.user_details = chat.user_details;
		} else {
			groupChatSession.user_details = {};
		}
		if (angular.isDefined(chat.isopen)) {
			groupChatSession.isopen = chat.isopen;
		} // this flag controls whether the chatbox should be open when it is created. Useful to close page reloads chatSessions so the messages can gracefully load
		if (angular.isDefined(chat.isFocus)) {
			groupChatSession.isTextFocus = chat.isTextFocus;
		}
		if (angular.isDefined(chat.session_key)) {
			groupChatSession.session_key = chat.session_key;
		}
		if (angular.isDefined(chat.emotions)) {
			groupChatSession.emotions = chat.emotions
		}
		if (angular.isDefined(chat.isSound)) {
			groupChatSession.isSound = chat.isSound
		}
		if (angular.isDefined(chat.invite)) {
			groupChatSession.invite = chat.invite;
		}
		if (angular.isDefined(chat.invite_list)) {
			groupChatSession.invite_list = chat.invite_list;
		}
		if (angular.isDefined(chat.chats)) {
			groupChatSession.chats = chat.chats;
		}
		if (angular.isDefined(chat.user_online)) {
			groupChatSession.user_online = chat.user_online;
		}
		if (angular.isDefined(chat.to_user_online)) {
			groupChatSession.to_user_online = chat.to_user_online;
		}
		if (angular.isDefined(chat.to_user_chat_presence)) {
			groupChatSession.to_user_chat_presence = chat.to_user_chat_presence;
		}
		if (angular.isDefined(chat.user_chat_presence)) {
			groupChatSession.user_chat_presence = chat.user_chat_presence;
		}
		if (angular.isDefined(chat.to_user_f_name)) {
			groupChatSession.to_user_f_name = chat.to_user_f_name;
		}
		if (angular.isDefined(chat.chat_log)) {
			groupChatSession.chat_log = chat.chat_log;
		}
		if (angular.isDefined(chat.group_chats)) {
			groupChatSession.group_chats = chat.group_chats;
		}
		if (angular.isDefined(chat.unread)) {
			groupChatSession.unread = chat.unread;
		} // this tracks the count of the messages sent to the user while the chat box is closed 
		if (angular.isDefined(chat.showUserOptions)) {
			groupChatSession.showUserOptions = chat.showUserOptions;
		}
		if (angular.isDefined(chat.index_position)) {
			groupChatSession.index_position = chat.index_position;
		} else {
			groupChatSession.index_position = null
		}
		if (angular.isDefined(chat.resize_adjustment)) {
			groupChatSession.resize_adjustment = chat.resize_adjustment;
		}
		// override  defaults
		groupChatSession.internal_reference = ChatService._internal_reference;
		groupChatSession.convert = true;
		groupChatSession.isGroupChat = true;
		groupChatSession.to_user_role = chat.to_user_role;
		groupChatSession.to_user_id = chat.session_key;
		groupChatSession.to_user_avatar = chat.to_user_avatar;
		groupChatSession.group_user_location.once('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			if (angular.isUndefined(snapshot)) {
				////////////////////////////////////////////////////////////
				$log.debug("Failure: Something went wrong.");
				////////////////////////////////////////////////////////////
			} else {
				if (angular.isDefined(snapshot.val()) && snapshot.val() !== null) {
					$log.debug('User list was setup in the firebase');
					var data = snapshot.val();
					$log.debug(data);
					angular.forEach(data, function(val, key) {
						groupChatSession.user_log[key] = val;
					});
					$log.debug(' groupChatSession.user_log was created to be : ' + angular.toJson(groupChatSession.user_log));
					angular.forEach(groupChatSession.user_log, function(val, key) { // runs through the list of chat session to determine which chat session is tied to the value change
						var user = {};
						user.user_id = key;
						user.name = val.name;
						user.avatar = val.avatar;
						user.profile_location = UserService.__setProfileOnlineLocationforUser(key);
						$timeout(function() {
							if (user.profile_location.$value == true) { /* 								console.log(User.name + 'was online. : ' + User.profile_location.$value); */
								user.session_location = ChatService.__setSessionLocationforGroupInvitee(chat.session_key, key);
								groupChatSession.user_details[key] = user;
								groupChatSession.participant_log['user_' + user.user_id] = user.name;
								groupChatSession.firebase_location.child('active-users').child(key).update(val);
							}
						}, 500)
					});
					groupChatSession.group_count = 2;
					$log.debug("groupChatSession.user_details was setup to be : " + groupChatSession.user_details);
				} else {
					$log.debug('UserLocation came back as undefined');
					if (angular.isDefined(groupChatSession.user_log)) {
						angular.forEach(groupChatSession.user_log, function(val, key) { // runs through the list of chat session to determine which chat session is tied to the value change
							groupChatSession.firebase_location.child('active-users').child(key).set(val);
							var user = {};
							user.user_id = key;
							user.name = val.name;
							user.avatar = val.avatar;
							user.profile_location = UserService.__setProfileOnlineLocationforUser(key);
							$timeout(function() {
								if (user.profile_location.$value == true) { /* 									console.log(user.name + 'was online. : ' + user.profile_location.$value); */
									user.session_location = ChatService.__setSessionLocationforGroupInvitee(chat.session_key, key);
									groupChatSession.user_details[key] = user;
									groupChatSession.participant_log['user_' + user.user_id] = user.name; /* 									groupChatSession.firebase_location.child('active-users').child(key).update(val); */
								} else { /* 									console.log(user.name + 'was offline. : ' + user.profile_location.$value); */
									val = null;
									return false;
								}
							}, 500);
						});
						groupChatSession.group_count = 2;
						$log.debug('GroupChat user_log and details are setup correctly ');
						$log.debug(groupChatSession.user_details);
					}
				}
			}
		});
		groupChatSession.group_user_location.on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
		{
			if (angular.isDefined(snapshot.val()) && snapshot.val() !== null) {
				var data = snapshot.val();
				var val = data.user_id;
				if (angular.isDefined(groupChatSession.user_log) && angular.isUndefined(groupChatSession.user_log[val])) {
					groupChatSession.user_log[val] = data;
					var user = {};
					user.user_id = val;
					user.name = data.name;
					user.avatar = data.avatar;
					user.profile_location = UserService.__setProfileOnlineLocationforUser(val);
					$timeout(function() {
						if (user.profile_location.$value) { /* 							console.log(user.name + 'was online. : ' + user.profile_location.$value); */
							user.session_location = ChatService.__setSessionLocationforGroupInvitee(groupChatSession.session_key, val);
							groupChatSession.user_details[val] = User;
							groupChatSession.participant_log['user_' + user.user_id] = user.name;
							UtilityService.removeByAttr(groupChatSession.invite_list, 'user_id', val); /* 					var d = new Date(); */
							var n = Firebase.ServerValue.TIMESTAMP;
							var chat_text = user.name + ' has joined chat';
							groupChatSession.group_chats.push({
								author: ChatService._internal_reference,
								to: groupChatSession.session_key,
								text: chat_text,
								time: n,
								priority: -1,
								session_key: groupChatSession.session_key
							});
							groupChatSession.group_chat_log.push(ChatService._internal_reference);
							if (user.user_id != UserService._user_profile.user_id) {
								groupChatSession.group_count++;
							}
						} else {
							var n = Firebase.ServerValue.TIMESTAMP;
							var chat_text = user.name + ' is not online';
							groupChatSession.group_chats.push({
								author: ChatService._internal_reference,
								to: groupChatSession.session_key,
								text: chat_text,
								time: n,
								priority: -1,
								session_key: groupChatSession.session_key
							});
							groupChatSession.group_chat_log.push(ChatService._internal_reference);
						}
					}, 750)
				} else {
					$log.debug(val + ' : User was already in list');
				}
			} else {
				$log.debug('Child was undefined/null');
			}
		});
		groupChatSession.group_user_location.on('child_removed', function(childSnapshot) { // detects a ref_location.remove(JsonObjKey) made to the reference location
			var data = childSnapshot.val();
			var val = data.user_id;
			if (angular.isDefined(groupChatSession.user_details) && angular.isDefined(groupChatSession.user_details[val])) {
				if (angular.isDefined(groupChatSession.user_details[val].profile_location)) {
					groupChatSession.user_details[val].profile_location.$off();
				}
				if (angular.isDefined(groupChatSession.user_details[val].session_location)) {
					groupChatSession.user_details[val].session_location.off();
				}
				delete groupChatSession.user_details[val];
				delete groupChatSession.user_log[val]; /* 				var d = new Date(); */
				var n = Firebase.ServerValue.TIMESTAMP;
				var chat_text = data.name + ' has left';
				groupChatSession.group_chats.push({
					author: ChatService._internal_reference,
					to: groupChatSession.session_key,
					text: chat_text,
					time: n,
					priority: -1,
					session_key: groupChatSession.session_key
				});
				groupChatSession.group_chat_log.push(ChatService._internal_reference);
				if (data.user_id != UserService._user_profile.user_id) {
					groupChatSession.group_count--;
					if (groupChatSession.invite_list) {
						groupChatSession.invite_list.push({
							avatar: data.avatar,
							name: data.name,
							user_id: data.user_id
						});
					}
				}
			}
		});
		if (angular.isDefined(groupChatSession.session_key) && angular.isDefined(groupChatSession.user_log) && angular.isDefined(groupChatSession.user_details)) {
			$log.debug(groupChatSession);
			ChatService._is_playing_sound = true;
			$timeout(function() {
				NotificationService.__playSound(NotificationService._chat_convert); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
				ChatService._is_playing_sound = false;
				groupChatSession.allowTopic = true;
			}, 200);
			return groupChatSession;
		} else {
			$log.debug('Complete Failure');
			return false;
		}
	}
	ChatService.__getLocationValue = function(location, scope) {
		if (angular.isUndefined(location)) {
			return false;
		}
		location.once('value', function(snapshot) {
			if (angular.isUndefined(snapshot)) {
				////////////////////////////////////////////////////////////
				$log.debug("Failure: Something went wrong.");
				////////////////////////////////////////////////////////////
			}
			scope.locationValue = snapshot.val();
		});
	}
	ChatService.__pushInternalMessage = function(display, msgText) {
		var element = document.createElement("div");
		element.appendChild(document.createTextNode(msgText));
		element.className = "cm-chat-internal-message text-muted";
		document.getElementById(display).appendChild(element);
	}
	ChatService.__setSessionLocationforGroupInvitee = function(session_key, invitee) {
		var invitee_session_root = ChatService._url_root + invitee + '/' + ChatService._active_session_reference + session_key + '/';
		return new Firebase(invitee_session_root);
	}
	ChatService.__setActiveSessionLocation = function(scope, to_user, isGroupChat) // this function will detect if this chatSession gets changed to a group chat and will call the necessary functions
	{
		var active_session_root = ChatService._url_root + ChatService._sub_category_reference + ChatService._active_session_reference + to_user + '/';
		var active_session_location = new Firebase(active_session_root);
		var index = null;
		if (isGroupChat === false) {
			active_session_location.on('value', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
			{
				if (snapshot.val() == null)
				{
					var removed_index = -1;
					angular.forEach(scope.activeChats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
						if (value.to_user_id == to_user) {
							removed_index = value.index_position;
						}
					});
					if (removed_index > -1)
					{
						var removed_key = scope.activeChats[removed_index].to_user_id || scope.activeChats[removed_index].session_key;
						if (scope.last_deactivated_chat !=  removed_key)
						{
							scope.removeChatSession(scope.activeChats[removed_index]);
						}
						
					}
				}
				if (angular.isUndefined(snapshot)) {
					////////////////////////////////////////////////////////////
					$log.debug("Failure: Something went wrong.");
					////////////////////////////////////////////////////////////
				} else {
					if (angular.isObject(snapshot.val())) {
						var data = angular.fromJson(snapshot.val());
						if (data.index_position > -1 && angular.isDefined(scope.activeChats[data.index_position])) {
							if (data.groupChat) {
								if (data.user_id == scope.activeChats[data.index_position].session_key) {
									index = data._index_position;
								}
							} else {
								if (data.user_id == scope.activeChats[data.index_position].to_user_id) {
									index = data._index_position;
								}
							}
						}
						if (index == null) {
							var chat_log = [];
							angular.forEach(scope.activeChats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
								if (angular.isDefined(value.to_user_id)) {
									this.push(value.to_user_id);
								} else {
									this.push(value.session_key);
								}
							}, chat_log);
							index = chat_log.indexOf(data.user_id); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
						}
						if (angular.isDefined(scope.activeChats[index])) {
							if (scope.activeChats[index].isGroupChat == false && data.groupChat == true) {
								var new_group_chat = ChatService.__convertToGroupChat(scope.activeChats[index], index, scope, false);
								if (new_group_chat == false) {
									$log.debug('Create new_group_chat failed')
									return false;
								} else {
									$log.debug('new_group_chat was created');
									$log.debug(new_group_chat);
									scope.activeChats[index].isGroupChat = data.groupChat;
								}
								//change the appearnace of this existing chatbox into a group chat box
								if (angular.isDefined(data.index_position > 1 && scope.activeChats[data.index_position]) && scope.activeChats[data.index_position].to_user_id == data.user_id) {
									index = data.index_position;
								} else { /* 									console.log(data.user_id + ' did not match ' + data.index_position); */
									var chat_log = [];
									angular.forEach(scope.activeChats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
										this.push(value.to_user_id);
									}, chat_log);
									index = chat_log.indexOf(data.user_id); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
								}
								if (index > -1) {
									var old_chat = scope.activeChats[index];
									scope.activeChats.splice(index, 1, new_group_chat);
									delete scope.active_sessions['user_' + data.user_id];
									scope.active_sessions[data.session_key] = true
								} else {
									scope.scope.activeChats.push(new_group_chat)
									scope.active_sessions[chat.session_key] = true;
								}
								$timeout(function() { /* 									ChatService.__update_to_user_active_session(chat); */
									ChatService.__deactivate_session_from_user_location(old_chat, scope, false, false);
								}, 500);
							}
							if (scope.activeChats[index].isMuted == false && data.isMuted == true) {
								scope.activeChats[index].isMuted == true;
							} else if (scope.activeChats[index].isMuted == true && data.isMuted == false) {
								scope.activeChats[index].isMuted == false;
							}
							
							if (scope.activeChats[index].nudge == false && data.nudge == true)
							{
								scope.activeChats[index].nudge = true;
								
								if (scope.layout != 2)
								{
									scope.openChatModule();
									scope.setDirectoryChat(index, true);
									/*
var n = Firebase.ServerValue.TIMESTAMP;
									var chat_text = scope.to_trusted('<i class="fa fa-bolt fa-2x chat-nudge-icon"></i> You were just nudged by ' + scope.activeChats[index].to_user_f_name + ' <i class="fa fa-bolt fa-2x chat-nudge-icon"></i>');
									scope.activeChats[index].chats.push({
										author: ChatService._internal_reference,
										to: scope.activeChats[index].session_key,
										text: chat_text,
										time: n,
										priority: -1,
										session_key: scope.activeChats[index].session_key
									});
*/
/* 									scope.activeChats[index].chat_log.push(ChatService._internal_reference); */
								}
								else
								{
									scope.moveChatToFirst(index);
									scope.activeChats[index].isopen = true;
								}
								$timeout(function(){
									NotificationService.__nudge(NotificationService._nudge);
								}, 1500);
								
								$timeout(function(){
									ChatService._active_sessions_user_location.child(scope.activeChats[index].to_user_id).update({nudge:false});
								},5000)
							}
						}
					}
					return true;
				}
			});
		}
		return active_session_location;
	}
	ChatService.__updateToUserActiveSession = function(chat) {
		chat.active_session_to_user_location.update({
			admin: chat.admin,
			avatar: chat.user_avatar,
			groupChat: chat.isGroupChat,
			name: UserService._user_profile.name,
			session_key: chat.session_key,
			nudge : chat.nudge,
/*
			tag: chat.tag,
			topic: chat.topic,
*/
			time: chat.time,
			user_id: UserService._user_profile.user_id
		});
	}
	
	ChatService.__nudgeUser = function(chat) {
		chat.active_session_to_user_location.update({ nudge : true});
		$timeout(function(){
			chat.active_session_to_user_location.update({ nudge : false});
		}, 5000);
	}
	ChatService.__setToUserChatPresenceLocation = function(chatSession,to_user) // The purpose of this function is to keep listening to the presence of the to_user after a page load, when another user  refreshes their page the firesoscket to their presence is destroyed and we need to recreate it.
	{
		ChatService.__storeToUser(to_user);
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A to_user_chat_presence_location firesocket is  being created");
		////////////////////////////////////////////////////////////
		chatSession.to_user_chat_presence = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference + ChatService._to_user._user_id + '/chat-presence/'));
		chatSession.to_user_chat_presence_message = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference + ChatService._to_user._user_id + '/message/'));
		chatSession.to_user_chat_presence_message_show = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference + ChatService._to_user._user_id + '/show-message/'));
		chatSession.to_user_chat_presence_message_post = $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference + ChatService._to_user._user_id + '/auto-post/'));
		return;
	}
	/*
ChatService.__setToUserChatPresence = function(to_user) // creates a pointer to the chat presence of the specific to_user, will let us know if the availability of the to_user changes
	{
		ChatService.__storeToUser(to_user);
		if (angular.isUndefined(ChatService._to_user._user_id)) {
			////////////////////////////////////////////////////////////
			$log.debug('Failure: to_user not defined: ' + ChatService._to_user.user_id);
			////////////////////////////////////////////////////////////
			return false;
		}
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A to_user_chat_presence_location firesocket is  being created");
		////////////////////////////////////////////////////////////
		return $firebase(new Firebase(FBURL + UserService._users_reference + UserService._users_presence_reference + ChatService._to_user._user_id + '/chat-presence/'));
	}
*/
	ChatService.__set_active_session_to_user_location = function() // The service needs know where to write the calling card info of the user when  they want to chat that person. Users will look at this location for themselves  and when an new calling card object is written here  it creates the chat session connections and opens a new chatbox in the view
	{
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A active_session_to_user_location firesocket is  being created");
		////////////////////////////////////////////////////////////
		return new Firebase(ChatService._url_root + ChatService._to_user._user_id + '/' + ChatService._active_session_reference + ChatService._sub_category_reference);
	}
	ChatService.__set_active_typing_to_user_location = function() //  The service will write true to this location whenever the user is typing. The to_user points to this location to know when the user is typing a message to them
	{
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A active_typing_to_user_location firesocket is  being created");
		////////////////////////////////////////////////////////////
		return new Firebase(ChatService._url_root + ChatService._to_user._user_id + '/' + 'Typing-Presence/' + ChatService._sub_category_reference);
	}
	ChatService.__set_active_typing_group_location = function(scope, session_key) //  The service will write true to this location whenever the user is typing. The to_user points to this location to know when the user is typing a message to them
	{
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A active_typing_group_location firesocket is  being created");
		////////////////////////////////////////////////////////////
		var active_typing_group_location = new Firebase(ChatService._group_url_root + ChatService._group_active_session_reference + session_key + '/' + ChatService._is_typing_reference + '/');
		active_typing_group_location.on('value', function(snapshot) {
			var log = [];
			angular.forEach(scope.activeChats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
				this.push(value.session_key);
			}, log);
			var index = log.indexOf(active_typing_group_location.parent().name()); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
			if (angular.isDefined(scope.activeChats[index])) {
				scope.activeChats[index].isTyping = snapshot.val();
			} else {
				$log.debug(index + ' could not get typing-presence updated');
			}
		});
		return active_typing_group_location; /* 		return $firebase(active_typing_to_user_location); */
	}
	ChatService.__set_active_typing_user_location = function(scope) // The user will point to this  folder location under a uid child for each chat session. The chat session will watch this location for whenever the to_user is typing a message
	{
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A active_typing_user_location firesocket is  being created");
		////////////////////////////////////////////////////////////
		return new Firebase(ChatService._url_root + ChatService._sub_category_reference + 'Typing-Presence/' + ChatService._to_user._user_id);
	}
	ChatService.__set_active_typing_user_socket = function(scope) // The user will point to this  folder location under a uid child for each chat session. The chat session will watch this location for whenever the to_user is typing a message
	{
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A active_typing_user_location firesocket is  being created");
		////////////////////////////////////////////////////////////
		return $firebase(new Firebase(ChatService._url_root + ChatService._sub_category_reference + 'Typing-Presence/' + ChatService._to_user._user_id + '/' + 'is-typing/'));
	}
	ChatService.__set_active_session_from_user_location = function() // this firebase folder the service will watch for an calling card objects, if someone is chatting the user they will have to write their info to this location to trigger the service to create a chatbox/session for that user in the view
	{
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A active_session_from_user_location firesocket is  being created");
		////////////////////////////////////////////////////////////
		return $firebase(new Firebase(ChatService._url_root + ChatService._sub_category_reference + ChatService._active_session_reference + ChatService._to_user._user_id + '/'));
	}
	ChatService.__deactivate_session_from_user_location = function(chat, scope, removeScope, removeLocation) // this funciton will remove the chatSession/connections and chat box in the view
	{
		//individula chat connections
		var delay = 0;
		$log.debug('deactivating session');
		$log.debug('removeScope: ' + removeScope);
		$log.debug('removeLocation: ' + removeLocation);
		if (angular.equals(ChatService._last_pushed_session, chat.session_key) || angular.equals(ChatService._last_pushed_session, chat.to_user_id)) {
			ChatService._last_pushed_session = null;
		}
		if (scope.layout != 2 && scope.activeChats.length == 1) {
			delay = 500;
			if (scope.layout == 3) {
				scope.switchLayout(1);
			}
			scope.safeApply(function() {
				$timeout(function() {
					document.getElementById(scope.mandatory_index + '_link').click();
				}, 250)
			})
		}
		$timeout(function() {
			if (angular.equals(ChatService._last_query_location, chat.session_key) || angular.equals(ChatService._last_query_location, chat.to_user_id)) {
				ChatService._last_query_location = '';
			}
			if (angular.equals(scope.requested_chat, chat.session_key) || angular.equals(scope.requested_chat, chat.to_user_id)) {
				scope.requested_chat = '';
			}
			if (angular.isDefined(chat.close_invite)) {
				clearInterval(chat.close_invite)
			};
			if (angular.isDefined(ChatService._active_sessions_user_location && angular.isDefined(chat.to_user_id))) {
				ChatService._active_sessions_user_location.child(chat.to_user_id || chat.session_key).remove()
			};
			if (angular.isDefined(chat.to_user_chat_presence)) {
				chat.to_user_chat_presence.$off();
			}
			if (angular.isDefined(chat.user_chat_presence)) {
				chat.user_chat_presence.$off();
			}
			if (angular.isDefined(chat.to_user_message_location)) {
				chat.to_user_message_location.off();
			}
			if (angular.isDefined(chat.user_message_location)) {
				chat.user_message_location.off();
			}
			if (angular.isDefined(chat.active_typing_to_user_location)) {
				chat.active_typing_to_user_location.update({'is-typing' : null});
				chat.active_typing_to_user_location.off();
			}
			if (angular.isDefined(chat.active_typing_user_location)) {
				chat.active_typing_user_location.update({'is-typing' : null});
				chat.active_typing_user_location.off();
			}
			if (angular.isDefined(chat.active_typing_user_socket)) {
				chat.active_typing_user_socket.$off();
				chat.active_typing_user_socket.$remove();
			}
			if (angular.isDefined(chat.to_user_session_location)) {
				chat.to_user_session_location.off();
			} /* 		if (angular.isDefined( chat.messageListQuery ) ) { chat.messageListQuery.off(); };		 */
			//group chats connections
			if (angular.isDefined(chat.group_message_location)) {
				chat.group_message_location.off();
			}
			if (angular.isDefined(chat.active_typing_group_location)) {
				chat.active_typing_group_location.off();
			}
			var remaining_users = null;
			if (removeLocation && angular.isDefined(chat.group_user_location)) {
				scope.wasDirectoryChat = chat.isDirectoryChat;
				chat.group_user_location.child(UserService._user_profile.user_id).remove();
				scope.closing_group_user_connection = chat.group_user_location;
				chat.group_user_location.off();
				scope.closing_firebase_location = chat.firebase_location;
				chat.firebase_location.off();
				chat.group_user_location.transaction(function(current_value) {
					return current_value;
				}, function(error, committed, snapshot) {
					scope.remaining_users = snapshot.val();
				});
				$timeout(function() {
					end_group_session(count, chat, scope);
				}, 500);
				var count = 0;
				var end_group_session = function() {
						if (angular.isDefined(scope.remaining_users) && angular.isDefined(scope.wasDirectoryChat)) {
							if (scope.remaining_users === null && scope.wasDirectoryChat == false) {
								if (angular.isDefined(scope.closing_firebase_location)) {
									scope.closing_group_user_connection.off();
									scope.closing_firebase_location.remove();
								} else {
									$log.debug('last user, but failed to remove session because chat was undefined');
								}
							} else {
								if (angular.isDefined(scope.closing_firebase_location)) {
									$log.debug('remaining users/directory chat,  turn off listner');
									scope.closing_firebase_location.off();
								} else {
									$log.debug('remaining users,  but failed because chat is not defined');
								}
							}
							delete scope.closing_group_user_connection
							delete scope.closing_firebase_location;
							scope.remaining_users = null;
							scope.wasDirectoryChat = null;
						}
					}
			};
			if (removeScope == true) {
				var index = null;
				var session_lookup;
				if (chat.isGroupChat === true) {
					index_lookup = chat.session_key;
					session_lookup = chat.session_key;
				} else {
					index_lookup = chat.to_user_id;
					session_lookup = 'user_' + chat.to_user_id;
				}
				if (angular.isDefined(chat.index_position)) {
					if (chat.isGroupChat == true) {
						if (scope.activeChats[chat.index_position] && scope.activeChats[chat.index_position].session_key == chat.session_key) {
							index = chat.index_position;
						} /* 						console.log('Used index_position'); */
					} else if (angular.isDefined(scope.activeChats[chat.index_position]) && scope.activeChats[chat.index_position].to_user_id == chat.to_user_id) {
						index = chat.index_position; /* 						console.log('Used index_position'); */
					}
				}
				if (index == null) // fall back for loop function
				{ /* 					console.log('Used fallback'); */
					var log = [];
					var index_lookup;
					angular.forEach(scope.activeChats, function(value, key) {
						if (angular.isDefined(value.to_user_id)) {
							this.push(value.to_user_id || value.session_key);
						}
					}, log);
					index = log.indexOf(index_lookup);
				}
				$log.debug('index: ' + index);
				if (index > -1) {
					scope.activeChats.splice(index, 1);
				}
				$log.debug('session_lookup: ' + session_lookup)
				scope.active_sessions[session_lookup] = false;
				delete scope.active_sessions[session_lookup];
				chat = null;
				if (!ChatService._is_playing_sound) {
					ChatService._is_playing_sound = true;
					NotificationService.__playSound(NotificationService._chat_close);
					$timeout(function(){
						ChatService._is_playing_sound = false;
					}, 1000);
				}
			} else {
				chat = null;
			}
			if (scope.activeChats.length - 1 >= scope.stored_directory_index) {
				scope.setDirectoryChat(scope.stored_directory_index, false);
			} else if (scope.activeChats.length > 0) {
				scope.setDirectoryChat(0, false);
			}
		}, delay)
		scope.last_deactivated_chat = '';
	}
	ChatService.__setUserChatPresence = function(chat_presence) // this function is used to set the chat_presence of a user to the firebase location, once it is chaged all user loking at it will know the the user chage in the users chat_presence
	{
		if (angular.isUndefined(chat_presence)) {
			////////////////////////////////////////////////////////////
			$log.debug('Failure: Arguments are undefined: chat_presence: ' + chat_presence + ' location: ' + ChatService._chat_presence_location);
			////////////////////////////////////////////////////////////
			return false;
		}
		UserService._user_presence_location.update({
			'chat-presence': chat_presence
		});
/*
if (chat_presence == "Offline")
		{
			UserService._user_online_location.update({'online':false});
		}
*/
	}
	ChatService.__returnToUserMessageLocation = function() {
		if (angular.isUndefined(ChatService._to_user._user_id)) {
			////////////////////////////////////////////////////////////
			$log.debug('Failure: to_user not defined: ' + ChatService._to_user._user_id);
			////////////////////////////////////////////////////////////
			return false;
		}
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A to_user_message_location firesocket is  being created");
		////////////////////////////////////////////////////////////
		/* 		var tuml_root = ChatService._url_root + ChatService._to_user._user_id  + '/' + ChatService._chat_message_storage_reference +  ChatService._sub_category_reference + ChatService.__getDateReference(); */
		var tuml_root = ChatService._url_root + ChatService._to_user._user_id + '/' + ChatService._chat_message_storage_reference + ChatService._sub_category_reference;
		var to_user_message_location = new Firebase(tuml_root);
		return to_user_message_location; /* 		return $firebase(to_user_message_location); */
	}
	ChatService.__returnMessageListQuery = function(scope, time, refLocation, to_address, isGroupChat, store_length) // this will query the message storage loction for the chat_session and create callbacks for when a child is added or removed, it can  also limit the amount of chat message that can be stored
	{
		$log.debug("WARNING: GERNERATING A MESSAGE QUERY FOR " + refLocation.name());
		if (angular.isUndefined(refLocation)) {
			////////////////////////////////////////////////////////////
			$log.debug('Failure: location error: ' + refLocation);
			////////////////////////////////////////////////////////////
			return false;
		}
		ChatService._last_query_location = refLocation.name();
		if (isGroupChat) {
			var query_limit_size = ChatService._group_query_size;
			var timestamp = time - (DirectoryChatService._store_time * store_length);;
		} else {
			var query_limit_size = ChatService._single_query_size;
			var timestamp = time - ChatService._store_time;
		}
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A messageListQuery connection is  being created");
		////////////////////////////////////////////////////////////
		refLocation.once('value', function(snapshot){
			var location_list = snapshot.val();
			if (location_list)
			{
				angular.forEach(location_list, function(value, key){
					if (value.time < timestamp) // delete message if it has exceeded its life span
					{
/* 							console.log('removed ' + value.text); */
						directory_chat.group_message_location.child(key).remove();
					}
			     });
			}
		});
		
		var messageListQuery = refLocation;
		messageListQuery = messageListQuery.endAt().limit(ChatService._message_load_size);
		messageListQuery.on('child_removed', function(snapshot) {
			var messageInfo = snapshot.val();
			if (ChatService._storage_limit) {
				$log.debug('Message ' + messageInfo.text + ' from user ' + messageInfo.user_id + ' should no longer be displayed. ' + angular.toJson(messageInfo));
				var firekey = snapshot.name();
				$log.debug(snapshot.val());
				refLocation.child(firekey).set(null);
			}
		});
		$timeout(function() {
			messageListQuery.endAt().limit(1).on('value', function(snapshot) {
				var index = null;
				var obj = snapshot.val();
				var log = [];
				angular.forEach(obj, function(value, key) { // only a single object so for loop isnt expensive
					this.push(key);
				}, log);
				if (obj == null || ChatService.last_chat_logged == log[0] || obj[log[0]] == null) {
					$log.debug('Value change is not needed');
					return false;
				}
				var data = obj[log[0]];
				if (data.text == null || data.author == UserService._user_profile.user_id) {
					$log.debug('This is what you just wrote,  return false');
					return false;
				}
				if (data.encryption) {
					data.session_key = sjcl.decrypt(ENCRYPT_PASS, data.session_key);
					data.text = sjcl.decrypt(data.session_key, data.text);
				}
				if (isGroupChat == false) {
					refLocation.parent().parent().parent().child('Active-Sessions').child(to_address).child('index_position').once('value', function(snapshot) {
						index = snapshot.val();
					})
				}
				if (index == null) {
					var active_chat_log = [];
					angular.forEach(scope.activeChats, function(value, key) {
						if (angular.isDefined(value.session_key)) {
							this.push(value.session_key);
						}
					}, active_chat_log);
					index = active_chat_log.indexOf(data.session_key);
				}
				if (index > -1) //check to see if  the user_id  of the other persons is still in the users active sessions
				{
					if (scope.activeChats[index] && scope.activeChats[index].isGroupChat == false) {
						var i = scope.activeChats[index].chats.length; //or 10
						while (i--) {
							if (scope.activeChats[index].chats[i].key == log[0]) {
								scope.safeApply(function() {
									scope.activeChats[index].chats[i].text = data.text;
								});
								break;
							}
						}
						return;
					} else if (scope.activeChats[index] && scope.activeChats[index].isGroupChat == true) {
						var i = scope.activeChats[index].group_chats.length; //or 10
						while (i--) {
							if (scope.activeChats[index].group_chats[i].key == log[0]) {
								scope.activeChats[index].group_chats[i].text = data.text;
								break;
							}
						}
						scope.$apply();
						return;
					}
				} else {
					$log.debug(data.session_key + ' was not in ' + angular.toJson(active_chat_log));
				}
			});
		}, 500);
		$timeout(function() {
			if (isGroupChat == false) {
				$timeout(function() {
					messageListQuery.on('child_added', function(snapshot) { // detects a ref_location.push(Json) made to the reference location
						if (snapshot.name() != ChatService.last_chat_logged) {
							var lookup;
							var index;
							var data = snapshot.val();
							if (data.author === UserService._user_profile.user_id) {
								lookup = data.to;
							} else {
								lookup = data.author;
							}
							refLocation.parent().parent().parent().child('Active-Sessions').child(lookup).child('index_position').once('value', function(snapshot) {
								var snap = snapshot.val();
								if (angular.isDefined(scope.activeChats[snap]) && scope.activeChats[snap].to_user_id == lookup) {
									index = snap;
								}
							})
							if (data.time < timestamp) // delete message if it has exceeded its life span
							{
								refLocation.child(snapshot.name()).remove();
								return false;
							}
							ChatService.last_chat_logged = data.key = snapshot.name();
							if (data.encryption) {
								data.session_key = sjcl.decrypt(ENCRYPT_PASS, data.session_key);
								data.text = sjcl.decrypt(data.session_key, data.text);
							}
							if (index == null) { /* 								console.log('used fallback'); */
								var active_chat_log = [];
								angular.forEach(scope.activeChats, function(value, key) {
									if (angular.isDefined(value.to_user_id)) {
										this.push(value.to_user_id);
									} else if (angular.isDefined(value.session_key)) {
										this.push(value.session_key);
									}
								}, active_chat_log);
								index = active_chat_log.indexOf(lookup); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
							}
							if (index > -1) //check to see if  the user_id  of the other persons is still in the users active sessions
							{
								if (angular.isDefined(scope.activeChats[index])) {
									if (scope.activeChats[index].first_priority === false) {
										scope.activeChats[index].first_priority = data.priority
									}
									if (data.priority > -1) {
										scope.activeChats[index].next_priority = data.priority + 1;
									} else {
										scope.activeChats[index].next_priority++;
									}
									scope.activeChats[index].chats.push(data);
									scope.activeChats[index].chat_log.push(data.author); // we are logging the chat, so we can do some conditional formatting and css based of the an log array;																		
								}
								if (((parseInt(data.time) + 5000) > scope.activeChats[index].time_reference) && data.author != UserService._user_profile.user_id) {
									scope.alertNewChat(index, false, data)
								}
								$timeout(function() {
									if (ChatService.last_chat_logged == data.key) {
										ChatService.last_chat_logged = '';
									}
								}, 50);
							} else { /* 								console.log(lookup + ' was not in ' + angular.toJson(active_chat_log)); */
								return false;
							}
						} else { /* 							console.log('Looks like this is a tremor request recieving an message'); */
							$log.debug('Looks like this is a tremor request recieving an message');
							return false;
						}
					});
					return messageListQuery;
				}, 1500);
			} else if (isGroupChat === true) {
				$timeout(function() {
					messageListQuery.on('child_added', function(snapshot) { // detects a ref_location.push(Json) made to the reference location				
						if (snapshot.name() != ChatService.last_chat_logged) {
							var index = null;
							var data = snapshot.val();
							data.key = ChatService.last_chat_logged = snapshot.name();
							if (data.encryption) {
								data.session_key = sjcl.decrypt(ENCRYPT_PASS, data.session_key);
								data.text = sjcl.decrypt(data.session_key, data.text);
							}
							refLocation.parent().parent().parent().parent().child('Users').child(UserService._user_profile.user_id).child('Active-Sessions').child(data.to).child('index_position').once('value', function(snapshot) {
								var snap = snapshot.val();
								if (scope.activeChats[snap] && scope.activeChats[snap].session_key == data.to) {
									index = snap; /* 									console.log('tada') */
								}
							})
							if (index == null) // use fallback for loop
							{
								var active_chat_log = [];
								angular.forEach(scope.activeChats, function(value, key) {
									if (angular.isDefined(value.to_user_id)) {
										this.push(value.to_user_id);
									} else if (angular.isDefined(value.session_key)) {
										this.push(value.session_key);
									}
								}, active_chat_log);
								index = active_chat_log.indexOf(data.to); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.	
							}
							if (index > -1) //check to see if  the user_id  of the other persons is still in the users active sessions
							{
								if (angular.isDefined(scope.activeChats[index])) {
									if (scope.activeChats[index].first_priority === false) {
										scope.activeChats[index].first_priority = data.priority
									}
									if (data.priority > -1) {
										scope.activeChats[index].next_priority = data.priority + 1;
									} else {
										scope.activeChats[index].next_priority++;
									}
									scope.activeChats[index].group_chat_log.push(data.author); // we are logging the chat, so we can do some conditional formatting and css based of the an log array;
									scope.activeChats[index].group_chats.push(data); /* 									console.log(data);	 */
								}
								if ((parseInt(data.time) + 5000) > scope.activeChats[index].time_reference && data.author != UserService._user_profile.user_id) {
									scope.alertNewChat(index, false, data);
								}
								$timeout(function() {
									if (ChatService.last_chat_logged == data.key) {
										ChatService.last_chat_logged = '';
									}
								}, 200);
							}
						} else { /* 							console.log('Looks like this is a tremor request'); */
							$log.debug('Looks like this is a tremor request');
							return false;
						}
					});
					return messageListQuery;
				}, 1500);
			} // end of else is group chat
		}, 500);
	};
	ChatService.__fetchMoreMessages = function(scope, index, location, endAt) {
		$log.debug('ChatService.__fetchMoreMessages');
		var chat = scope.activeChats[index];
		$log.debug(chat);
		scope.temp_chats = Array();
		
		var endAt = chat.first_priority - 1; 
		var startAt = endAt - ChatService._message_fetch_size;
		$log.debug('startAt: ' + startAt + ' endAt: ' + endAt);
		/* 		directory_chat.reload = true;	 */
		if (chat.isGroupChat) {
			var chats = chat.group_chats;
			var log = chat.group_chat_log
			var location = chat.group_message_location;
		} else {
			var chats = chat.chats;
			var log = chat.chat_log;
			var location = chat.user_message_location;
		}
		location.endAt(endAt).limit(ChatService._message_fetch_size).once('value', function(snapshot) {
			var prev = snapshot.val();
			if (prev) {
/* 			 	console.log('fetching'); */
				chat.reload = true;
				var prev_array = Array();
				for( var i in prev ) {
				    prev_array.push(prev[i]);
				}
				$log.debug(prev_array)
				var i = prev_array.length;
				while (i--) { 
/* 					console.log(prev_array[i]); */
/* 					console.log('seting priority as ' + parseInt(endAt - (prev_array.length - (i + 1) ))); */
/* 					prev_array[i].key = endAt - ((prev_array.length) - (i)); */
					scope.temp_chats.push(prev_array[i]);
				}
				$timeout(function() {
					angular.forEach(scope.temp_chats, function(value) { /* 							console.log(value); */
						log.unshift(value.author);
						chats.unshift(value);
						scope.getAuthorAvatar(chats[1], false);
						scope.getAuthorFirstName(chats[1]);
						scope.isMessageFromUser(chats[1]);
						scope.isAuthorSameAsLast(chats[1], chats[0].author);
						scope.isLastMessagePastMinute(chats[1], chats[0].time)
						scope.isMessagePastHour(chats[1], chat.time_reference);
					});
					scope.getAuthorAvatar(chats[0], false);
					scope.getAuthorFirstName(chats[0]);
					scope.isMessageFromUser(chats[0]);
					scope.isAuthorSameAsLast(chats[0], undefined);
					scope.isLastMessagePastMinute(chats[0], undefined)
					scope.isMessagePastHour(chats[0], chat.time_reference);
					chat.first_priority = chats[0].priority;
					if (chat.first_priority == 1) {
						chat.isMorePrev = false;
					}
					chat.reload = false;
				}, 900)
				$timeout(function() {
					chat.scroll_top = false;
					chat.scroll_bottom = false; /* 		    		console.log('done fetching'); */
					$("#" + 'message_display_' + chat.index_position).animate({
						scrollTop: 0
					}, 2000);
				}, 500)
			} else {
				chat.scroll_top = false;
				chat.scroll_bottom = false;
				chat.scroll_top = true;
				chat.isMorePrev = false;
				chat.reload = false;
				chat.first_priority = chats[0].priority; /* 				console.log('done fetching'); */
				return false
			}
		})
	
	}
	ChatService.__returnFromUserMessageLocation = function(scope) // defines the firebase folder location that the user will point their chatSession to 
	{
		if (angular.isUndefined(ChatService._to_user._user_id)) {
			////////////////////////////////////////////////////////////
			$log.debug('Failure: to_user not defined: ' + ChatService._to_user._user_id);
			////////////////////////////////////////////////////////////
			return false;
		} else if (angular.isDefined(scope._active_sessions) && scope._active_sessions.indexOf(ChatService._to_user._user_id) > -1) {
			$log.debug('Failure: to_user not defined: ' + ChatService._to_user._user_id);
			return false;
		} else {
			////////////////////////////////////////////////////////////
			$log.debug("Warning: A fromUserMessageLocation is  being created");
			////////////////////////////////////////////////////////////
			return new Firebase(ChatService._url_root + ChatService._sub_category_reference + ChatService._chat_message_storage_reference + ChatService._to_user._user_id + '/');
		}
	}
	ChatService.__establishUserChat = function(scope) //  Step 1 this function will initialize the ChatService variables and set the user chat presence.
	{
		$log.debug('calling ChatService.__establishUserChat');
		var check_for_user = setInterval(function() // delays fetch unitl user info is in place
		{
			$log.debug('Looking for chat user');
			if (angular.isDefined(UserService._user_profile.user_id)) {
				$log.debug('User was defined');
				clearInterval(check_for_user);
				scope.activeChats = Array();
				UserService.user_group = Array();
				UserService.user_group.push('user_' + UserService._user_profile.user_id);
				if (UserService.pc) {
					UserService.user_group.push('user_' + UserService.pc.user_id)
				};
				if (UserService._user_profile.mc) {
					UserService.user_group.push('user_' + UserService._user_profile.mc.user_id)
				};
				if (UserService._user_profile.admin && UserService._user_profile.role == 'Mentor Coach') {
					UserService.user_group.push('user_' + UserService._user_profile.admin.user_id)
				};
				
				
				ChatService._sub_category_reference = UserService._user_profile.user_id + '/'; // user_id of user
				ChatService.__set_active_sessions_user_location(scope); // looks at the active session folder of the user, and create chatSession for an calling card objects present
			}
		}, 250);
		$log.debug('Finished ChatService.__establishUserChat');
		return true;
	}
	ChatService.__pushChatSession = function(chatSession, to_user, scope) { // nameRef.child('first').set('Fred');
		if (angular.isUndefined(chatSession.session_key)) {
			chatSession = null;
			return false;
		}
		if (to_user === false) {
			if (chatSession.isGroupChat === true && scope.active_sessions[chatSession.session_key] != true && !(angular.equals(ChatService._last_pushed_session, chatSession.session_key))) {
				ChatService._last_pushed_session = chatSession.session_key;
				scope.active_sessions[chatSession.session_key] = true;
				var group_session_info = {
					directoryChat: chatSession.isDirectoryChat,
					groupChat: chatSession.isGroupChat,
					isOpen: to_user.isOpen || true,
					isSound: chatSession.isSound,
					'session_key': chatSession.session_key,
					name: chatSession.chat_description,
					admin: chatSession.admin,
					'time': chatSession.time
				};
				ChatService._active_sessions_user_location.child(chatSession.session_key).update(group_session_info);
				$timeout(function() {
					if (chatSession.isTextFocus && scope.activeChats.length >= scope.max_count) {
						scope.temp_chat = scope.activeChats[scope.max_count - 1];
						scope.activeChats[scope.max_count - 1] = chatSession;
						scope.active_sessions[scope.activeChats[scope.max_count - 1].session_key] = true;
						scope.activeChats.push(scope.temp_chat);
					} else {
						scope.activeChats.push(chatSession);
						scope.checkForTopic(chatSession);
						scope.active_sessions[scope.activeChats[scope.activeChats.length - 1].session_key] = true;
					}
					$timeout(function() {
						if (!(ChatService._is_playing_sound) && (chatSession.time + 5000) > new Date().getTime()) {
							if (scope.is_external_window.$value && scope.isExternalInstance == false) { /* 								console.log('Blocked SOund'); */
							} else {
								NotificationService.__playSound(NotificationService._new_chat);
							}
							$timeout(function() {
								ChatService._last_pushed_session = null;
								chatSession.loading = false;
							}, 500)
						}
						chatSession.allowTopic = true;
					}, 500)
				}, 1000)
			} else {
				$log.debug("Chat Session is already active / not group chat");
			}
			$timeout(function() {
				scope.resetTyping(chatSession);
				scope.checkForTopic(chatSession);
			}, 200)
		} else {
			if (scope.active_sessions['user_' + to_user.user_id] != true && !(angular.equals(to_user.user_id, ChatService._last_pushed_session))) {
				ChatService._last_pushed_session = to_user.user_id; /* 				console.log('last_pushed was set as ' + chatSession.to_user_id); */
				var to_user_info = {
					avatar: to_user.avatar,
					groupChat: chatSession.isGroupChat,
					'session_key': chatSession.session_key,
					isOpen: chatSession.isopen || true,
					isSound: chatSession.isSound || true,
					name: to_user.name,
					user_id: to_user.user_id,
					time: chatSession.time
				};
				ChatService._active_sessions_user_location.child(to_user.user_id).update(to_user_info);
				scope.active_sessions['user_' + to_user.user_id] = true;
				if (scope.layout == 2 && chatSession.isopen == false) {
					chatSession.isopen = true;
					$timeout(function() {
						chatSession.isopen = false;
						ChatService._active_sessions_user_location.child(to_user.user_id).update({
							isOpen: false
						});
					}, 500)
				}
				if (scope.layout != 2) {
					if (chatSession.isTextFocus) {
						scope.activeChats.unshift(chatSession); /* 						console.log('inital push'); */
						scope.safeApply(function() {
							$timeout(function() {
								scope.setDirectoryChat(0, true);
							}, 50)
						})
					} else {
						scope.activeChats.push(chatSession); /* 						document.getElementById('chat-module-queue-content').scrollTo(null,0); */
					}
				} else if (scope.layout == 2 && chatSession.isTextFocus && scope.activeChats.length >= scope.max_count) {
					scope.temp_chat = scope.activeChats[scope.max_count - 1];
					scope.activeChats[scope.max_count - 1] = chatSession;
					scope.activeChats.push(scope.temp_chat);
					scope.temp_chat = null;
				} else {
					scope.activeChats.push(chatSession);
				}
				scope.checkForTopic(chatSession);
				if (!(ChatService._is_playing_sound) && (chatSession.time_reference + 5000) > new Date().getTime()) {
					NotificationService.__playSound(NotificationService._new_chat);
				}
			} else { /* 				console.log( "Chat Session is already active" ); */
				$log.debug("Chat Session is already active");
			}
		}
	}
	ChatService.__setLastPushed = function(session) {
		ChatService._last_pushed_session = session;
		$timeout(function() {
			ChatService._last_pushed_session = null;
		}, 1000)
	}
	ChatService.__updateIsOpen = function(chat) {
		if (angular.isDefined(chat.to_user_id)) {
			ChatService._active_sessions_user_location.child(chat.to_user_id).update({
				isOpen: chat.isopen
			});
		} else {
			ChatService._active_sessions_user_location.child(chat.session_key).update({
				isOpen: chat.isopen
			});
		}
	}
	ChatService.__updateIsSound = function(session_id, bool) {
		ChatService._active_sessions_user_location.child(session_id).update({
			isSound: bool
		});
	}
	return ChatService;
}]).
service('DirectoryChatService', ['$log', '$timeout', 'ChatService', 'UserService', 'UtilityService', 'NotificationService', "FBURL", '$firebase', function($log, $timeout, ChatService, UserService, UtilityService, NotificationService, FBURL, $firebase) {
	var DirectoryChatService = {};
	DirectoryChatService._parent_category_reference = "Chat-System/Group-Chats" + '/'; // parent folder name variable
	DirectoryChatService._is_typing_reference = 'is-typing';
	DirectoryChatService._group_message_reference = "stored-messages" + '/'; // parent folder reference to store chat messages
	DirectoryChatService._group_active_users_reference = 'active-users/';
	DirectoryChatService._topic_reference = 'topic/';
	DirectoryChatService._store_time = 86400000; // 24 hours
	DirectoryChatService._message_load_size = 20;
	DirectoryChatService._message_fetch_size = 50;
	DirectoryChatService.__setDirectoryChatReference = function(chat_reference) {
		DirectoryChatService._directory_chat_reference = chat_reference + '/';
	}
	DirectoryChatService.__setUrlRootReference = function() {
		DirectoryChatService._url_root = FBURL + DirectoryChatService._parent_category_reference + DirectoryChatService._directory_chat_reference.split('_')[0] + '/' + DirectoryChatService._directory_chat_reference; // combine with global url variable 
	}
	DirectoryChatService.__setIsTypingLoction = function() {
		DirectoryChatService._is_typing_location = DirectoryChatService._url_root + ChatService._is_typing_reference;
	}
	DirectoryChatService.__setGroupActiveUsersLoction = function() {
		DirectoryChatService._group_user_location = DirectoryChatService._url_root + DirectoryChatService._active_users_reference;
	}
	DirectoryChatService.__buildNewDirectoryChat = function(scope, chat_reference, chat_description, admin, mandatory, watch_users, store_length) // this function builds out the details of an individual chat sesssion
	{
		var newDirectoryChat = {}; 
		DirectoryChatService._directory_chat_reference = '';
		DirectoryChatService._url_root = '';
		DirectoryChatService._is_typing_location = '';
		DirectoryChatService._group_user_location = '';
		ChatService.__setDefaultSettings(newDirectoryChat);
		DirectoryChatService.__setDirectoryChatReference(chat_reference);
		DirectoryChatService.__setUrlRootReference();
		DirectoryChatService.__setIsTypingLoction();
		DirectoryChatService.__setGroupActiveUsersLoction();
		newDirectoryChat.user_chat_presence = UserService.__setChatPresenceforUser(UserService._user_profile.user_id);
		newDirectoryChat.session_key = chat_reference;
		newDirectoryChat.isMandatory = mandatory;
		newDirectoryChat.monitor = false;
		newDirectoryChat.isGroupChat = true;
		newDirectoryChat.isDirectoryChat = true;
		newDirectoryChat.admin = admin;
		newDirectoryChat.time = 0;
		newDirectoryChat.firebase_location = new Firebase(DirectoryChatService._url_root);
		newDirectoryChat.group_message_location = new Firebase(DirectoryChatService._url_root + DirectoryChatService._group_message_reference);
		newDirectoryChat.topic_location = $firebase(new Firebase(DirectoryChatService._url_root + DirectoryChatService._topic_reference));
		newDirectoryChat.smod = "SM on Duty";
		newDirectoryChat.isSound = false;
		newDirectoryChat.isopen = true;
		newDirectoryChat.chat_description = chat_description // used at the top of the chat box	
		newDirectoryChat.messageListQuery = DirectoryChatService.__returnMessageListQuery(scope, newDirectoryChat, store_length);
		if (watch_users) {
			newDirectoryChat.group_user_location = new Firebase(DirectoryChatService._url_root + DirectoryChatService._group_active_users_reference);
			newDirectoryChat.group_user_location.child(UserService._user_profile.user_id).update({
				user_id: UserService._user_profile.user_id,
				name: UserService._user_profile.name,
				avatar: UserService._user_profile.avatar
			});
			newDirectoryChat.group_user_location.on('child_added', function(snapshot) // snapshot is an encrypted object from firebase, use snapshot.val() to get its value
			{ // this event will detect when another user is added to a group chat, and each user that participating will update that person into their user_log 
				if (angular.isDefined(snapshot.val()) && snapshot.val() !== null) {
					var data = snapshot.val();
					var val = data.user_id;
					if (angular.isDefined(newDirectoryChat.user_log)) {
						newDirectoryChat.user_log[val] = data;
						var User = {};
						User.user_id = val;
						User.name = data.name;
						User.avatar = data.avatar;
						User.profile_location = UserService.__setProfileOnlineLocationforUser(val);
						User.session_location = ChatService.__setSessionLocationforGroupInvitee(newDirectoryChat.session_key, val);
						newDirectoryChat.user_details[val] = User;
						newDirectoryChat.participant_log['user_' + User.user_id] = User.name;
/*
var d = new Date();
						var n = d.getTime();
						var chat_text = User.name + ' is in this group chat.';
						newDirectoryChat.group_chats.push({author: ChatService._internal_reference, to: newDirectoryChat.session_key, text: chat_text, time: n, priority:-1, session_key: newDirectoryChat.session_key});
						newDirectoryChat.group_chat_log.push(ChatService._internal_reference);
*/
						UtilityService.removeByAttr(newDirectoryChat.invite_list, 'user_id', val);
						if (User.user_id != UserService._user_profile.user_id) {
							newDirectoryChat.group_count++;
						}
						$log.debug(newDirectoryChat.user_details);
					} else {
						$log.debug(val + 'newDirectoryChat.user_log was not defined');
					}
				} else {
					$log.debug('Child was undefined/null');
				}
			});
			newDirectoryChat.group_user_location.on('child_removed', function(childSnapshot) { // detects a ref_location.remove(JsonObjKey) made to the reference location
				var data = childSnapshot.val();
				var val = data.user_id;
				if (angular.isDefined(newDirectoryChat.user_details) && angular.isDefined(newDirectoryChat.user_details[val])) {
					if (angular.isDefined(newDirectoryChat.user_details[val].profile_location)) {
						newDirectoryChat.user_details[val].profile_location.$off();
					}
					if (angular.isDefined(newDirectoryChat.user_details[val].session_location)) {
						newDirectoryChat.user_details[val].session_location.off();
					}
					delete newDirectoryChat.user_details[val];
					delete newDirectoryChat.user_log[val]; /* 					var d = new Date(); */
					var n = Firebase.ServerValue.TIMESTAMP;
					var chat_text = data.name + ' has left';
					newDirectoryChat.group_chats.push({
						author: ChatService._internal_reference,
						to: newDirectoryChat.session_key,
						text: chat_text,
						time: n,
						priority: -1,
						session_key: newDirectoryChat.session_key
					});
					newDirectoryChat.group_chat_log.push(ChatService._internal_reference);
					if (data.user_id != UserService._user_profile.user_id) {
						newDirectoryChat.group_count--;
						newDirectoryChat.invite_list.push({
							avatar: data.avatar,
							name: data.name,
							user_id: data.user_id
						});
					}
				}
			});
		}
		else{
			newDirectoryChat.user_log = UserService._users_profiles_obj;
		}
		
		newDirectoryChat.group_typing_location = new Firebase(DirectoryChatService._url_root + 'is-typing/');
		newDirectoryChat.group_typing_location.on('child_added', function(snapshot) {
			if (snapshot.name() == UserService._user_profile.user_id) {
				return;
			}
			scope.safeApply(function() {
				newDirectoryChat.is_typing_list.push(snapshot.val());
			})
		})
		newDirectoryChat.group_typing_location.on('child_removed', function(snapshot) {
			scope.safeApply(function() {
				newDirectoryChat.is_typing_list.splice(newDirectoryChat.is_typing_list.indexOf(snapshot.val(), 1));
			})
		})
		return newDirectoryChat;
	}
	DirectoryChatService.__returnMessageListQuery = function(scope, directory_chat, store_length) // this will query the message storage loction for the chat_session and create callbacks for when a child is added or removed, it can  also limit the amount of chat message that can be stored
	{
		$log.debug("WARNING: GERNERATING A MESSAGE QUERY FOR " + directory_chat.group_message_location.name());
		if (angular.isUndefined(directory_chat.group_message_location)) {
			////////////////////////////////////////////////////////////
			$log.debug('Failure: location error: ' + directory_chat.group_message_location);
			////////////////////////////////////////////////////////////
			return false;
		}
		
		if (UserService._user_profile.role == 'PlusOne Admin' || UserService._user_profile.user_id == 113)
		{
			directory_chat.group_message_location.once('value', function(snapshot){
				var location_list = snapshot.val();
				if (location_list)
				{
/* 					console.log(location_list); */
					angular.forEach(location_list, function(value, key){
						if (value.time < timestamp) // delete message if it has exceeded its life span
						{
/* 							console.log('removed ' + value.text); */
							directory_chat.group_message_location.child(key).remove();
						}
				     });
				}
			});
		}
		ChatService._last_query_location = directory_chat.group_message_location.name();
		////////////////////////////////////////////////////////////
		$log.debug("Warning: A messageListQuery connection is  being created");
		////////////////////////////////////////////////////////////
		var time = new Date().getTime();
		var timestamp = time - (DirectoryChatService._store_time * store_length);
		var messageListQuery = directory_chat.group_message_location.endAt().limit(DirectoryChatService._message_load_size);
		messageListQuery.on('child_removed', function(snapshot) {
			var data = snapshot.val();
			if (ChatService._storage_limit) {
				$log.debug('Message ' + messageInfo.text + ' from user ' + data.user_id + ' should no longer be displayed. ' + angular.toJson(data));
				var firekey = snapshot.name();
				$log.debug(data);
				directory_chat.group_message_location.child(firekey).set(null);
			}
		});
		$timeout(function() {
			messageListQuery.endAt().limit(1).on('value', function(snapshot) {
				var index = null;
				var obj = snapshot.val();
				var log = [];
				angular.forEach(obj, function(value, key) { // only a single object so for loop isnt expensive
					this.push(key);
				}, log);
				if (obj == null || ChatService.last_chat_logged == log[0] || obj[log[0]] == null) {
					$log.debug('Value change is not needed');
					return false;
				}
				var data = obj[log[0]];
				if (data.text == null || data.author == UserService._user_profile.user_id) {
					$log.debug('This is what you just wrote,  return false');
					return false;
				}
				if (data.encryption) {
					data.session_key = sjcl.decrypt(ENCRYPT_PASS, data.session_key);
					data.text = sjcl.decrypt(data.session_key, data.text);
				}
				var i = directory_chat.group_chats.length; //or 10
				while (i--) {
					if (directory_chat.group_chats[i].key == log[0]) {
						directory_chat.group_chats[i].text = data.text;
						scope.$apply();
						break;
					}
				}
				return;
			});
		}, 500);
		$timeout(function() {
			messageListQuery.on('child_added', function(snapshot) { // detects a ref_location.push(Json) made to the reference location			
				if (snapshot.name() != ChatService.last_chat_logged) {
					var data = snapshot.val();
					data.key = ChatService.last_chat_logged = snapshot.name(); /* 					console.log(data.time + ' < ' + timestamp); */
					/*
if (data.time < timestamp) // delete message if it has exceeded its life span
					{
						directory_chat.group_message_location.child(snapshot.name()).remove();
						return false;
					}
*/
					if (data.encryption) {
						data.session_key = sjcl.decrypt(ENCRYPT_PASS, data.session_key);
						data.text = sjcl.decrypt(data.session_key, data.text);
					}
					if (directory_chat.first_priority === false) {
						directory_chat.first_priority = data.priority;
					}
					if (data.priority > -1) {
						directory_chat.next_priority = data.priority + 1;
					} else {
						directory_chat.next_priority++;
					}
					var is_new_chat = ((parseInt(data.time) + 5000) > directory_chat.time_reference);
					var el = scope.isScrollAtBottom(directory_chat.index_position);
					directory_chat.group_chat_log.push(data.author); // we are logging the chat, so we can do some conditional formatting and css based of the an log array;
					directory_chat.group_chats.push(data);
					if (is_new_chat && data.author != UserService._user_profile.user_id) {
						if ( data.author != UserService._user_profile.user_id && directory_chat.monitor == true)
						{
							if (scope.external_monitor && directory_chat.monitor)
							{
								scope.notifyUser(data, directory_chat.index_position,  directory_chat.chat_description);
								scope.unread++;
								document.title = scope.default_window_title + ' - ' + scope.unread + ' New';
								
							}
							else if (scope.page_status == 'visible' && scope.layout != 2 && scope.isChatModuleOpen == false) {
								scope.alertToOpen = true;
								scope.unread++;
								scope.notifyUser(data, directory_chat.index_position, directory_chat.chat_description);
							}
							else if (scope.page_status == 'hidden')
							{
								scope.notifyUser(data, directory_chat.index_position, directory_chat.chat_description);
								scope.unread++;
								document.title = scope.default_window_title + ' - ' + scope.unread + ' New';
							}
						}
						if (!(ChatService._is_playing_sound) && angular.equals(directory_chat.isSound, true)) {
							ChatService._is_playing_sound = true;
							$timeout(function() {
								NotificationService.__playSound(NotificationService._chat); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
								ChatService._is_playing_sound = false;
							}, 500);
						}
						if (directory_chat.isTextFocus == false) {
							directory_chat.unread = directory_chat.unread + 1;
							directory_chat.isNewMessage = true;
							if (scope.priority_queue.indexOf(directory_chat.index_position) == -1) {
								scope.priority_queue.unshift(directory_chat.index_position);
							}
							scope.last_unread_index = directory_chat.index_position;
						}
						if (el) {
							scope.safeApply(function() {
								$timeout(function() {
									el.scrollTop = el.scrollHeight;
								})
							})
						}
						$timeout(function() {
							if (ChatService.last_chat_logged == data.key) {
								ChatService.last_chat_logged = '';
							}
						}, 500);
					}
					return;
				} else {
					$log.debug('Looks like this is a tremor request');
					return false;
				}
			});
		}, 1000);
		return messageListQuery;
	};
	DirectoryChatService.__fetchMoreMessages = function(scope, directory_chat) {
		$log.debug('DirectoryChatService.__fetchMoreMessages');
		$log.debug(directory_chat);
		scope.temp_chats = Array();
		var endAt = directory_chat.first_priority - 1; 
		var startAt = endAt - DirectoryChatService._message_fetch_size;
		$log.debug('startAt: ' + startAt + ' endAt: ' + endAt);
		/* 		directory_chat.reload = true;	 */
		if (directory_chat.isGroupChat) {
			var chats = directory_chat.group_chats;
			var log = directory_chat.group_chat_log
			var location = directory_chat.group_message_location;
		} else {
			var chats = directory_chat.chats;
			var log = directory_chat.chat_log;
			var location = directory_chat.user_message_location;
		}
		location.endAt(endAt).limit(DirectoryChatService._message_fetch_size).once('value', function(snapshot) {
			var prev = snapshot.val();
			if (prev) {
/* 			 	console.log('fetching'); */
				directory_chat.reload = true;
				var prev_array = Array();
				for( var i in prev ) {
				    prev_array.push(prev[i]);
				}
				$log.debug(prev_array)
				var i = prev_array.length;
				while (i--) { 
/* 					console.log(prev_array[i]); */
/* 					console.log('seting priority as ' + parseInt(endAt - (prev_array.length - (i + 1) ))); */
/* 					prev_array[i].key = endAt - ((prev_array.length) - (i)); */
					scope.temp_chats.push(prev_array[i]);
				}
				$timeout(function() {
					angular.forEach(scope.temp_chats, function(value) { /* 							console.log(value); */
						log.unshift(value.author);
						chats.unshift(value);
						scope.getAuthorAvatar(chats[1], false);
						scope.getAuthorFirstName(chats[1]);
						scope.isMessageFromUser(chats[1]);
						scope.isAuthorSameAsLast(chats[1], chats[0].author);
						scope.isLastMessagePastMinute(chats[1], chats[0].time)
						scope.isMessagePastHour(chats[1], directory_chat.time_reference);
					});
					scope.getAuthorAvatar(chats[0], false);
					scope.getAuthorFirstName(chats[0]);
					scope.isMessageFromUser(chats[0]);
					scope.isAuthorSameAsLast(chats[0], undefined);
					scope.isLastMessagePastMinute(chats[0], undefined)
					scope.isMessagePastHour(chats[0], directory_chat.time_reference);
					directory_chat.first_priority = chats[0].priority;
					if (directory_chat.first_priority == 1) {
						directory_chat.isMorePrev = false;
					}
				}, 900)
				$timeout(function() {
					directory_chat.scroll_top = false;
					directory_chat.scroll_bottom = false; /* 		    		console.log('done fetching'); */
					$("#" + 'message_display_' + directory_chat.index_position).animate({
						scrollTop: 0
					}, 2000);
				}, 500)
			} else {
				directory_chat.scroll_top = false;
				directory_chat.scroll_bottom = false;
				directory_chat.scroll_top = true;
				directory_chat.isMorePrev = false;
				directory_chat.reload = false;
				directory_chat.first_priority = chats[0].priority; /* 				console.log('done fetching'); */
				return false
			}
		});
	}
	return DirectoryChatService;
	
}]).
service('EmojiService', function() {
	var EmojiService = {};
	EmojiService.contents = [":bowtie:", ":smile:", ":laughing:", ":blush:", ":smiley:", ":relaxed:", ":smirk:", ":heart_eyes:", ":kissing_heart:", ":kissing_closed_eyes:", ":flushed:", ":relieved:", ":satisfied:", ":grin:", ":wink:", ":stuck_out_tongue_winking_eye:", ":stuck_out_tongue_closed_eyes:", ":grinning:", ":stuck_out_tongue:", ":sleeping:", ":worried:", ":frowning:", ":anguished:", ":open_mouth:", ":grimacing:", ":confused:", ":hushed:", ":expressionless:", ":unamused:", ":sweat_smile:", ":sweat:", ":disappointed_relieved:", ":weary:", ":pensive:", ":disappointed:", ":confounded:", ":fearful:", ":cold_sweat:", ":persevere:", ":cry:", ":sob:", ":joy:", ":astonished:", ":scream:", ":neckbeard:", ":tired_face:", ":angry:", ":rage:", ":triumph:", ":sleepy:", ":yum:", ":mask:", ":sunglasses:", ":dizzy_face:", ":imp:", ":smiling_imp:", ":neutral_face:", ":innocent:", ":yellow_heart:", ":blue_heart:", ":purple_heart:", ":heart:", ":green_heart:", ":broken_heart:", ":heartbeat:", ":heartpulse:", ":two_hearts:", ":revolving_hearts:", ":cupid:", ":sparkling_heart:", ":sparkles:", ":star:", ":star2:", ":dizzy:", ":boom:", ":anger:", ":exclamation:", ":question:", ":zzz:", ":dash:", ":sweat_drops:", ":notes:", ":musical_note:", ":fire:", ":thumbsup:", ":thumbsdown:", ":ok_hand:", ":punch:", ":fist:", ":v:", ":wave:", ":raised_hand:", ":point_up:", ":point_down:", ":point_left:", ":point_right:", ":raised_hands:", ":pray:", ":point_up_2:", ":clap:", ":muscle:", ":metal:", ":lips:", ":kiss:", ":droplet:", ":ear:", ":eyes:", ":nose:", ":tongue:", ":love_letter:", ":speech_balloon:", ":thought_balloon:", ":walking:", ":running:", ":dancer:", ":dancers:", ":ok_woman:", ":raising_hand:", ":nail_care:", ":smiley_cat:", ":heart_eyes_cat:", ":kissing_cat:", ":smirk_cat:", ":joy_cat:", ":pouting_cat:", ":see_no_evil:", ":hear_no_evil:", ":speak_no_evil:", ":skull:", ":feet:", ":sunny:", ":umbrella:", ":cloud:", ":snowflake:", ":snowman:", ":zap:", ":cyclone:", ":cat:", ":dog:", ":mouse:", ":hamster:", ":rabbit:", ":wolf:", ":frog:", ":tiger:", ":koala:", ":bear:", ":pig:", ":pig_nose:", ":cow:", ":boar:", ":monkey_face:", ":monkey:", ":horse:", ":elephant:", ":panda_face:", ":snake:", ":bird:", ":baby_chick:", ":hatched_chick:", ":hatching_chick:", ":chicken:", ":penguin:", ":turtle:", ":bug:", ":honeybee:", ":ant:", ":beetle:", ":snail:", ":octopus:", ":tropical_fish:", ":fish:", ":whale:", ":whale2:", ":bouquet:", ":cherry_blossom:", ":tulip:", ":four_leaf_clover:", ":rose:", ":sunflower:", ":hibiscus:", ":maple_leaf:", ":leaves:", ":fallen_leaf:", ":herb:", ":mushroom:", ":cactus:", ":palm_tree:", ":shell:", ":sun_with_face:", ":full_moon_with_face:", ":new_moon_with_face:", ":partly_sunny:", ":squirrel:", ":gift_heart:", ":mortar_board:", ":jack_o_lantern:", ":ghost:", ":santa:", ":christmas_tree:", ":gift:", ":bell:", ":balloon:", ":crystal_ball:", ":cd:", ":floppy_disk:", ":camera:", ":computer:", ":tv:", ":iphone:", ":phone:", ":hourglass_flowing_sand:", ":alarm_clock:", ":mag:", ":unlock:", ":lock:", ":key:", ":bulb:", ":calling:", ":toilet:", ":hammer:", ":moneybag:", ":dollar:", ":credit_card:", ":smoking:", ":chart_with_upwards_trend:", ":chart_with_downwards_trend:", ":newspaper:", ":football:", ":basketball:", ":soccer:", ":baseball:", ":tennis:", ":8ball:", ":bowling:", ":golf:", ":bicyclist:", ":horse_racing:", ":snowboarder:", ":swimmer:", ":surfer:", ":ski:", ":trophy:", ":game_die:", ":ribbon:", ":tophat:", ":crown:", ":coffee:", ":beer:", ":fork_and_knife:", ":pizza:", ":hamburger:", ":doughnut:", ":icecream:", ":ice_cream:", ":birthday:", ":slot_machine:", ":checkered_flag:", ":circus_tent:", ":performing_arts:", ":mens:", ":womens:", ":baby_symbol:", ":sos:"];
	return EmojiService;
}).
service('ChatRecordService', ['$http', '$log', function($http, $log) // the purpose of this service is retieve the audio file that is asscociated witht he record that is going to be reviewed in the training sheet
{
	var ChatRecordService = {
		async: function(chat_record) {
			$http({
				method: 'POST',
				url: 'index.php?option=com_callcenter&controller=trainings&task=recordChat&format=raw',
				data: {
					parameters: chat_record
				}
			})
		}
	}
	return ChatRecordService;
}]).
service('UtilityService', ['$rootScope', '$firebase', 'FBURL', '$http', '$window', '$timeout', 'UserService', 'NotificationService', function($rootScope, $firebase, FBURL, $http, $window, $timeout, UserService, NotificationService) {
	var UtilityService = {};
	UtilityService.firebase_connection = true;
	UtilityService._network = true;
	UtilityService._portal_online = true;
	UtilityService.isHostReachable = function(scope, host) {
		var imageAddr = host + new Date().getTime();
		var download = new Image();
		download.onload = function() {
			scope.isHost = true;
		}
		download.timeout = 2000;
		download.src = imageAddr;
	}
	UtilityService.removeByAttr = function(arr, attr, value) {
		if (angular.isDefined(arr)) {
			var i = arr.length;
			while (i--) {
				if (arr[i] && arr[i].hasOwnProperty(attr) && (arguments.length > 2 && arr[i][attr] === value)) {
					arr.splice(i, 1);
				}
			}
			return arr;
		}
	}
	UtilityService.getObjectLength = function(obj) {
		var result = 0;
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				// or Object.prototype.hasOwnProperty.call(obj, prop)
				result++;
			}
		}
		return result;
	}
	UtilityService.isObjectLengthAtLeast = function(obj, length) {
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
	}
	UtilityService.onComplete = function(error) {
		if (error) { /* 			console.log('Synchronization failed.'); */
			if (UtilityService.isHostReachable()) {
				$log.debug("Firebase is Down");
			} else {
				navigator.onLine = false;
			}
		}
	};
	UtilityService.setFirebaseOffline = function() {
		$log.debug('UtilityService.setFirebaseOffline');
		Firebase.goOffline();
	}
	UtilityService.setFirebaseOnline = function() {
		$log.debug('UtilityService.setFirebaseOnline');
		Firebase.goOnline();
	}
	UtilityService.__pingTest = function(scope, chat) {
		$log.debug('running ping test');
		scope.isPinging = true;
		var imageAddr = "/components/com_callcenter/views/training/ng/img/ping_test_5mb" + "?n=" + Math.random();
		var startTime, endTime;
		var downloadSize = 5245329;
		var download = new Image();
		download.onload = function() {
			endTime = (new Date()).getTime();
			showResults();
		}
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
			scope.ping = speedMbps;
			scope.isPinging = false;
			
			UtilityService.__sendResponseChat(scope, chat, "Connection Rating is: \n" + Math.ceil(speedMbps/10) + "/10 \n");
		}
	}
	UtilityService.safeApply = function(fn) //util function
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
	UtilityService.__observeOnlineChange = function(online) {
		if (angular.isDefined(UserService.user_profile_location) && online === true) {
			$timeout(function() {
				UserService.user_profile_location.update({
					'online': true,
					'state': 'Online'
				}); /* NotificationService.__playSound(NotificationService._update_alert); */
				UtilityService._browser_online = true;
			}, 1000);
		} else if (angular.isDefined(UserService.user_profile_location) && online === false) {
			UserService.user_profile_location.update({
				'Online': false,
				'state': 'Offline'
			});
			UtilityService._browser_online = false;
		}
	}
	UtilityService.__observeNetworkChange = function(online) {
		if (angular.isDefined(UserService.user_profile_location) && online === true) {
			$timeout(function() {
				UserService.firebase_connection = online;
				UserService.user_profile_location.update({
					'online': online,
					'state': 'Idle'
				});
				NotificationService.__playSound(NotificationService._money);
				UtilityService._network = true;
			}, 1000);
		} else if (angular.isDefined(UserService.user_profile_location) && online === false) { /* 			UtilityService.firebase_connection = online; */
			UserService.user_profile_location.update({
				'Online': false,
				'state': 'Offline'
			});
			NotificationService.__playSound(NotificationService._bash_error);
			UtilityService._network = false;
		}
	}
	UtilityService.__observePortalChange = function(online) {
		if (angular.isDefined(UserService.user_profile_location) && online === true) {
			UtilityService._portal_online = true;
		} else if (angular.isDefined(UserService.user_profile_location) && online === false) {
			UtilityService._portal_online = false;
		}
	}
	
	
	UtilityService.__getGeolocation = function(scope, chat){
		if(navigator.geolocation)
		{
			navigator.geolocation.getCurrentPosition(showPosition);
		}
		else
		{
			UtilityService.__sendResponseChat(scope, chat, "Geolocation is not supported by this browser.");
			$log.debug("Geolocation is not supported by this browser.");
		}

		function showPosition(pos){
			UtilityService.__sendResponseChat(scope, chat, "Latitude: "+pos.coords.latitude+"\nLongitude: "+pos.coords.longitude);
		}
	}
	UtilityService.__sendResponseChat = function(scope, chat, response)
	{
		var check_for_text = setInterval(function(){
			if (chat.chat_text == null || chat.chat_text == '')
			{
				clearInterval(check_for_text);
				chat.chat_text = response;
				scope.addChatMessage(chat);
			}
		}, 1000)
	}
	return UtilityService;
}]).service('popupService', function(someOtherDataService) {
	var popupWindow = window.open('/modules/mod_chat/mod_chat.php'); /*   popupWindow.mySharedData = someOtherDataService.importantData; */
});

'use strict'; /* Factories */
angular.module('chatModule.factories', []).factory('types', function() {
	return {
		MOUSE: {
			name: 'MOUSE',
			events: 'click mousedown mouseup mousemove'
		},
		KEYBOARD: {
			name: 'KEYBOARD',
			events: 'keypress keydown keyup'
		},
		TOUCH: {
			name: 'TOUCH',
			events: 'touchstart touchmove touchend touchenter touchleave touchcancel'
		},
		getAllTypeNames: function() {
			return ['MOUSE', 'KEYBOARD', 'TOUCH'];
		},
		get: function(type) {
			type = type.toUpperCase();
			if (this[type]) {
				return this[type];
			}
			throw new Error("Unknown type for monitoring presence: " + type);
		}
	};
}).factory('$presence', ['$timeout', '$q', 'orderByFilter', 'types', function($timeout, $q, orderByFilter, types) {
	var entryState = {},
		states, initialStateId = 0,
		currentStateId, timer, callbacksStateLeave = {},
		callbacksStateEnter = {},
		callbacksStateChange = [];

	function init(statesInput) {
		function objectify() {
			angular.forEach(statesInput, function(state, key) {
				if (!angular.isObject(state)) {
					statesInput[key] = state = {
						enter: state
					};
				}
				state.name = key;
				state.enter = state.enter || 0;
			});
			return statesInput;
		}

		function sortStates() {
			var statesArray = [];
			angular.forEach(statesInput, function(state) {
				statesArray.push(state);
			});
			return orderByFilter(statesArray, "enter");
		}

		function extendStates() {
			angular.forEach(states, function(state, id) {
				state.id = id;
				state.onEnter = function(fn) {
					onStateEnter(id, fn);
				};
				state.onLeave = function(fn) {
					onStateLeave(id, fn);
				};
			});
		}

		function extendStatesInput() {
			statesInput.onChange = function(fn) {
				onStateChange(fn);
			};
			statesInput.getCurrent = function() {
				return getCurrentState();
			};
		}

		function initInternalStructures() {
			angular.forEach(states, function(state, id) {
				function setEntryState(type) {
					if (state.accept.toUpperCase().indexOf(type) === -1) {
						entryState[type] = id + 1;
					}
				}
				if (state.initial === true) {
					initialStateId = id;
				}
				if (state.accept) {
					angular.forEach(types.getAllTypeNames(), setEntryState);
				}
			});
		}
		statesInput = objectify();
		states = sortStates();
		extendStates();
		extendStatesInput();
		initInternalStructures();
		changeState(initialStateId);
		return statesInput;
	}

	function changeState(newStateId) {
		var oldStateId = currentStateId;
		if (states[oldStateId]) {
			states[oldStateId].leftOn = new Date();
			states[oldStateId].active = false;
		}
		states[newStateId].active = true;
		states[newStateId].enteredOn = new Date();
		states[newStateId].enteredFrom = states[oldStateId] ? states[oldStateId].name : undefined;
		currentStateId = newStateId;
		$timeout(function() {
			notify(callbacksStateLeave[oldStateId]);
			notify(callbacksStateEnter[newStateId]);
			notify(callbacksStateChange);
		});
		restartTimer();
	}

	function changeStateToNext() {
		changeState(currentStateId + 1);
	}

	function notify(callbacks) {
		if (callbacks) {
			for (var i = 0; i < callbacks.length; i++) {
				callbacks[i](states[currentStateId]);
			}
		}
	}

	function restartTimer() {
		var nextState = currentStateId + 1;
		if (states[nextState]) {
			$timeout.cancel(timer);
			timer = $timeout(changeStateToNext, states[nextState].enter - states[currentStateId].enter);
		}
	}

	function registerAction(type) {
		if (!states) {
			return;
		}
		var targetStateId = entryState[type] || 0;
		if (targetStateId < currentStateId) {
			changeState(targetStateId);
		} else if (targetStateId === currentStateId) {
			restartTimer();
		}
	}

	function onStateChange(fn) {
		callbacksStateChange.push(fn);
	}

	function onStateEnter(state, fn) {
		(callbacksStateEnter[state] || (callbacksStateEnter[state] = [])).push(fn);
	}

	function onStateLeave(state, fn) {
		(callbacksStateLeave[state] || (callbacksStateLeave[state] = [])).push(fn);
	}

	function getCurrentState() {
		return states[currentStateId];
	}
	return {
		init: init,
		registerAction: registerAction
	};
}]).factory('states',['$presence', function($presence) {
	var states = {
		TYPING: {
			accept: "KEYBOARD MOUSE TOUCH",
			text: "Idle"
		},
		IDLE: {
			enter: 60000,
			initial: true,
			text: "Idle",
		},
		SHORTAWAY: {
			enter: 300000,
			text: "Inactive"
		},
		LONGAWAY: {
			enter: 600000,
			text: "Away"
		}
	}
	return $presence.init(states);
}]).factory('utils', function() {
	return {
		compareStr: function(stra, strb) {
			stra = ("" + stra).toLowerCase();
			strb = ("" + strb).toLowerCase();
			return stra.indexOf(strb) !== -1;
		}
	};
});

'use strict';

/* Filters */

angular.module('chatModule.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }])
  .filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
}).
filter('split', function() {
    return function(input, splitChar, splitIndex) {
        // do some bounds checking here to ensure it has that index
        return input.split(splitChar)[splitIndex];
    }
})
.filter("timeago", function () {
    //time: the time
    //local: compared to what time? default: now
    //raw: wheter you want in a format of "5 minutes ago", or "5 minutes"
    return function (time, local, raw) {
        if (!time) return "never";
 
        if (!local) {
            (local = Date.now())
        }
 
        if (angular.isDate(time)) {
            time = time.getTime();
        } else if (typeof time === "string") {
            time = new Date(time).getTime();
        }
 
        if (angular.isDate(local)) {
            local = local.getTime();
        }else if (typeof local === "string") {
            local = new Date(local).getTime();
        }
 
        if (typeof time !== 'number' || typeof local !== 'number') {
            return;
        }
 
        var
            offset = Math.abs((local - time) / 1000),
            span = [],
            MINUTE = 60,
            HOUR = 3600,
            DAY = 86400,
            WEEK = 604800,
            MONTH = 2629744,
            YEAR = 31556926,
            DECADE = 315569260;
 
        if (offset <= MINUTE)              span = [ '', raw ? 'now' : 'just now' ];
        else if (offset < (MINUTE * 60))   span = [ Math.round(Math.abs(offset / MINUTE)), 'min ago' ];
        else if (offset < (HOUR * 24))     span = [ Math.round(Math.abs(offset / HOUR)), 'hr ago' ];
        else if (offset < (DAY * 7))       span = [ Math.round(Math.abs(offset / DAY)), 'day ago' ];
        else if (offset < (WEEK * 52))     span = [ Math.round(Math.abs(offset / WEEK)), 'week ago' ];
        else if (offset < (YEAR * 10))     span = [ Math.round(Math.abs(offset / YEAR)), 'year ago' ];
        else if (offset < (DECADE * 100))  span = [ Math.round(Math.abs(offset / DECADE)), 'decade ago' ];
        else                               span = [ '', 'a long time' ];
 
/*         span[1] += (span[0] === 0 || span[0] > 1) ? 's' : ''; */
        span = span.join(' ');
 
        if (raw === true) {
            return span;
        }
        return (time <= local) ? span: 'in ' + span;
    }
}).
filter('UserFilter',['utils',function(utils){
    return function(input, query){
      if(!query) return input;
      var result = {};
      angular.forEach(input, function(userData, user){
        if(utils.compareStr(user, query) ||
           utils.compareStr(userData.name, query))
          result[user] = userData;          
      });
      return result;
    }; 
}]).
filter('objectByKeyValFilter', function () {
    return function (input, filterKey, filterVal) {
    var filteredInput ={};
     angular.forEach(input, function(value, key){
       if(value[filterKey] && value[filterKey] !== filterVal){
          filteredInput[key]= value;
        }
     });
         return filteredInput;
}}).
filter('array', function() {
  return function(items) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
   return filtered;
  };
}).
filter('unsafe', ['$sce', function ($sce) {
    return function (val) {
        return $sce.trustAsHtml(val);
    };
}]);

/* Start angularLocalStorage */

var angularLocalStorage = angular.module('LocalStorageModule', []);

// You should set a prefix to avoid overwriting any local storage variables from the rest of your app
// e.g. angularLocalStorage.constant('prefix', 'youAppName');
angularLocalStorage.constant('prefix', 'chatModule');
// Cookie options (usually in case of fallback)
// expiry = Number of days before cookies expire // 0 = Does not expire
// path = The web path the cookie represents
angularLocalStorage.constant('cookie', { expiry:30, path: '/'});
angularLocalStorage.constant('notify', { setItem: true, removeItem: true} );

angularLocalStorage.service('localStorageService', [
  '$rootScope',
  'prefix',
  'cookie',
  'notify',
  function($rootScope, prefix, cookie, notify) {

  // If there is a prefix set in the config lets use that with an appended period for readability
  //var prefix = angularLocalStorage.constant;
  if (prefix.substr(-1)!=='.') {
    prefix = !!prefix ? prefix + '.' : '';
  }

  // Checks the browser to see if local storage is supported
  var browserSupportsLocalStorage = function () {
    try {
        return ('localStorage' in window && window['localStorage'] !== null);
    } catch (e) {
        $rootScope.$broadcast('LocalStorageModule.notification.error',e.message);
        return false;
    }
  };

  // Directly adds a value to local storage
  // If local storage is not available in the browser use cookies
  // Example use: localStorageService.add('library','angular');
  var addToLocalStorage = function (key, value) {

    // If this browser does not support local storage use cookies
    if (!browserSupportsLocalStorage()) {
      $rootScope.$broadcast('LocalStorageModule.notification.warning','LOCAL_STORAGE_NOT_SUPPORTED');
      if (notify.setItem) {
        $rootScope.$broadcast('LocalStorageModule.notification.setitem', {key: key, newvalue: value, storageType: 'cookie'});
      }
      return addToCookies(key, value);
    }

    // 0 and "" is allowed as a value but let's limit other falsey values like "undefined"
    if (!value && value!==0 && value!=="") return false;

    try {
      localStorage.setItem(prefix+key, value);
      if (notify.setItem) {
        $rootScope.$broadcast('LocalStorageModule.notification.setitem', {key: key, newvalue: value, storageType: 'localStorage'});
      }
    } catch (e) {
      $rootScope.$broadcast('LocalStorageModule.notification.error',e.message);
      return addToCookies(key, value);
    }
    return true;
  };

  // Directly get a value from local storage
  // Example use: localStorageService.get('library'); // returns 'angular'
  var getFromLocalStorage = function (key) {
    if (!browserSupportsLocalStorage()) {
      $rootScope.$broadcast('LocalStorageModule.notification.warning','LOCAL_STORAGE_NOT_SUPPORTED');
      return getFromCookies(key);
    }

    var item = localStorage.getItem(prefix+key);
    if (!item) return null;
    return item;
  };

  // Remove an item from local storage
  // Example use: localStorageService.remove('library'); // removes the key/value pair of library='angular'
  var removeFromLocalStorage = function (key) {
    if (!browserSupportsLocalStorage()) {
      $rootScope.$broadcast('LocalStorageModule.notification.warning','LOCAL_STORAGE_NOT_SUPPORTED');
       if (notify.removeItem) {
        $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {key: key, storageType: 'cookie'});
      }
      return removeFromCookies(key);
    }

    try {
      localStorage.removeItem(prefix+key);
      if (notify.removeItem) {
        $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {key: key, storageType: 'localStorage'});
      }
    } catch (e) {
      $rootScope.$broadcast('LocalStorageModule.notification.error',e.message);
      return removeFromCookies(key);
    }
    return true;
  };

  // Remove all data for this app from local storage
  // Example use: localStorageService.clearAll();
  // Should be used mostly for development purposes
  var clearAllFromLocalStorage = function () {

    if (!browserSupportsLocalStorage()) {
      $rootScope.$broadcast('LocalStorageModule.notification.warning','LOCAL_STORAGE_NOT_SUPPORTED');
      return clearAllFromCookies();
    }

    var prefixLength = prefix.length;

    for (var key in localStorage) {
      // Only remove items that are for this app
      if (key.substr(0,prefixLength) === prefix) {
        try {
          removeFromLocalStorage(key.substr(prefixLength));
        } catch (e) {
          $rootScope.$broadcast('LocalStorageModule.notification.error',e.message);
          return clearAllFromCookies();
        }
      }
    }
    return true;
  };

  // Checks the browser to see if cookies are supported
  var browserSupportsCookies = function() {
    try {
      return navigator.cookieEnabled ||
        ("cookie" in document && (document.cookie.length > 0 ||
        (document.cookie = "test").indexOf.call(document.cookie, "test") > -1));
    } catch (e) {
      $rootScope.$broadcast('LocalStorageModule.notification.error',e.message);
      return false;
    }
  };

  // Directly adds a value to cookies
  // Typically used as a fallback is local storage is not available in the browser
  // Example use: localStorageService.cookie.add('library','angular');
  var addToCookies = function (key, value) {

    if (typeof value == "undefined") return false;

    if (!browserSupportsCookies()) {
      $rootScope.$broadcast('LocalStorageModule.notification.error','COOKIES_NOT_SUPPORTED');
      return false;
    }

    try {
      var expiry = '', expiryDate = new Date();
      if (value === null) {
        cookie.expiry = -1;
        value = '';
      }
      if (cookie.expiry !== 0) {
        expiryDate.setTime(expiryDate.getTime() + (cookie.expiry*24*60*60*1000));
        expiry = ", expires="+expiryDate.toGMTString();
      }
      if (!!key) {
        document.cookie = prefix + key + "=" + encodeURIComponent(value) + expiry + ", path="+cookie.path;
      }
    } catch (e) {
      $rootScope.$broadcast('LocalStorageModule.notification.error',e.message);
      return false;
    }
    return true;
  };

  // Directly get a value from a cookie
  // Example use: localStorageService.cookie.get('library'); // returns 'angular'
  var getFromCookies = function (key) {
    if (!browserSupportsCookies()) {
      $rootScope.$broadcast('LocalStorageModule.notification.error','COOKIES_NOT_SUPPORTED');
      return false;
    }

    var cookies = document.cookie.split(',');
    for(var i=0;i < cookies.length;i++) {
      var thisCookie = cookies[i];
      while (thisCookie.charAt(0)==' ') {
        thisCookie = thisCookie.substring(1,thisCookie.length);
      }
      if (thisCookie.indexOf(prefix+key+'=') === 0) {
        return decodeURIComponent(thisCookie.substring(prefix.length+key.length+1,thisCookie.length));
      }
    }
    return null;
  };

  var removeFromCookies = function (key) {
    addToCookies(key,null);
  };

  var clearAllFromCookies = function () {
    var thisCookie = null, thisKey = null;
    var prefixLength = prefix.length;
    var cookies = document.cookie.split(';');
    for(var i=0;i < cookies.length;i++) {
      thisCookie = cookies[i];
      while (thisCookie.charAt(0)==' ') {
        thisCookie = thisCookie.substring(1,thisCookie.length);
      }
      key = thisCookie.substring(prefixLength,thisCookie.indexOf('='));
      removeFromCookies(key);
    }
  };

  // JSON stringify functions based on http://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON
  var stringifyJson = function (vContent, isJSON) {
    // If this is only a string and not a string in a recursive run of an object then let's return the string unadulterated
    if (typeof vContent === "string" && vContent.charAt(0) !== "{" && !isJSON) {
      return vContent;
    }
    if (vContent instanceof Object) {
      var sOutput = "";
      if (vContent.constructor === Array) {
        for (var nId = 0; nId < vContent.length; sOutput += this.stringifyJson(vContent[nId], true) + ",", nId++);
        return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
      }
      if (vContent.toString !== Object.prototype.toString) { return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\""; }
      for (var sProp in vContent) { sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringifyJson(vContent[sProp], true) + ","; }
      return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
    }
    return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
  };

  var parseJson = function (sJSON) {
    if (sJSON.charAt(0)!=='{') {
      return sJSON;
    }
    return eval("(" + sJSON + ")");
  };

  return {
    isSupported: browserSupportsLocalStorage,
    add: addToLocalStorage,
    get: getFromLocalStorage,
    remove: removeFromLocalStorage,
    clearAll: clearAllFromLocalStorage,
    stringifyJson: stringifyJson,
    parseJson: parseJson,
    cookie: {
      add: addToCookies,
      get: getFromCookies,
      remove: removeFromCookies,
      clearAll: clearAllFromCookies
    }
  };

}]);

'use strict';

/* Directives */


angular.module('chatModule.directives', []).
directive('avatar', function() {
	return {
		restrict: "E",
		template: '<img class="media-object thumbnail" ng-src="/components/com_callcenter/images/avatars/{{avatar}}-90.jpg">'
	};
}).
directive('chatModule', function() {
  return {
    restrict: 'EA',
    replace:true,
   templateUrl: '/modules/mod_chat/app/partials/chat/chat_module.html',
    link: function(scope, elm, attrs) {
    }
  };
}).
directive('chatModuleExternal', function() {
  return {
    restrict: 'EA',
    replace:true,
   templateUrl: '/modules/mod_chat/app/partials/chat/chat_module_external.html',
    link: function(scope, elm, attrs) {
    }
  };
}).
directive('chat', function() {
  return {
    restrict: 'EA',
    replace:true,
   templateUrl: '/modules/mod_chat/app/partials/chat/chat.html',
    link: function(scope, elm, attrs) {
    }
  };
}).
directive('chatbox', function() {
	return {
		scope:true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/chatbox.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('groupChat', function() {
	return {
		scope:true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/group.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('techChat', function() {
	return {
		scope:true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/tech_chat.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('mcChat', function() {
	return {
		scope:true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/mc_chat.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('adminChat', function() {
	return {
		scope:true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/admin_chat.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('directoryChat', function() {
	return {
		scope:true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/directory_chat.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('contacts', function() {
	return {
		scope:true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/contacts.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('chatModuleNavPanel', function() {
	return {
		scope:true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/nav_panel.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('cmDirectoryTrackerPanel', function() {
	return {
		scope:true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/chat_tracker.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('cmAudio', function() {
	return {
		scope: true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/html5/audio.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('cmVideo', function() {
	return {
		scope: true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/html5/video.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('cmImage', function() {
	return {
		scope: true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/html5/image.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('cmAudioRecord', function() {
	return {
		scope: true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/html5/audio_record.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('cmYoutube', function($sce) {
  return {
    restrict: 'EA',
    scope: { code:'=' },
    replace: true,
    template: '<div style="height:200px; width:98%; margin-left:1%; margin-bottom:5px;"><iframe style="overflow:hidden;height:100%;width:100%" width="100%" height="100%" src="{{url}}" frameborder="0" allowfullscreen></iframe></div>',
    link: function (scope) {
        scope.$watch('code', function (newVal) {
           if (newVal) {
               scope.url = $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + newVal + '?rel=0&autoplay=0&loop=0&wmode=opaque&modestbranding=1&width=200&height=200"');
           }
        });
    }
  };
}).
directive('cmProfile', function() {
	return {
		scope: true,
		restrict: 'EA',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/user_profile.html',
		link: function(scope, elm, attrs) {
		}
	};
}).
directive('cmUserProfile',['UserService', function(UserService) {
	return {
		scope: {
			name:'=',
			avatar:'=',
			online:'=',
			user_presence: '=',
			user_presence_message: '=',
			user_presence_mesage_show: '=',
			data: '=',
			user: '=',
			access: '=',
			gpk: '='
		},
		restrict: 'E',
		replace:true,
		templateUrl: '/modules/mod_chat/app/partials/chat/profile_tracker.html',
		link: function(scope, elm, attrs) {
			scope.inAdminGroup = function()
			{
				if(UserService._user_profile && UserService._user_profile.position)
				{	
					if ('3424258'.indexOf(UserService._user_profile.position) != -1){
					return true;
					}
				}
				return false;
			}
		}
	};
}]).
directive('ngEnterPress', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnterPress);
                });

                event.preventDefault();
            }
        });
    };
}).
directive('ngTabPress', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 9){
                scope.$apply(function (){
                    scope.$eval(attrs.ngTabPress);
                });

                event.preventDefault();
            }
        });
    };
}).
directive('bindHtmlUnsafe', function( $compile ) {
    return function( $scope, $element, $attrs ) {

        var compile = function( newHTML ) { // Create re-useable compile function
            newHTML = $compile(newHTML)($scope); // Compile html
            $element.html('').append(newHTML); // Clear and append it
        };

        var htmlName = $attrs.bindHtmlUnsafe; // Get the name of the variable 
                                              // Where the HTML is stored

        $scope.$watch(htmlName, function( newHTML ) { // Watch for changes to 
                                                      // the HTML
            if(!newHTML) return;
            compile(newHTML);   // Compile it
        });

    };
}).
directive('focusMe', function($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    link: function(scope, elem, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function(value) {
        if(value === true) { 
          $timeout(function() 
          {
          	if ( angular.isDefined(elem[0].value) )
          	{      
				var elemLen = elem[0].value.length;
				if (elem[0].selectionStart || elem[0].selectionStart == '0') 
				{
					// Firefox/Chrome
					elem[0].selectionStart = elemLen;
					elem[0].selectionEnd = elemLen;
					elem[0].focus();
				}
				else
				{
					elem[0].focus();
				}
	        }
			
          });
        }
      });
      // to address @blesh's comment, set attribute value to 'false'
      // on blur event:
      elem.bind('blur', function() {
		 if (model && model.assign)
		 {
			 scope.$apply(model.assign(scope, false));
		 }
         
      });
    }
  };
}).
directive('ngKeydown', function() {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
             // this next line will convert the string
             // function name into an actual function
             var functionToCall = scope.$eval(attrs.ngKeydown);
        }
    };
}).
directive('typeaheadUsers', function($timeout) {
  return {
    restrict: 'AEC',
    scope: {
      items: '=',
      prompt: '@',
      title: '@',
      subtitle: '@',
      avatar: '@',
      model: '=',
      onSelect: '&'
    },
    link: function(scope, elem, attrs) {
	  scope.handleSelection = function(selectedItem) {
	    scope.model = selectedItem;
	    scope.current = 0;
	    scope.selected = true;
	    $timeout(function() {
	      scope.onSelect();
	    }, 200);
	  };
	  scope.current = 0;
	  scope.selected = true; // hides the list initially
	  scope.isCurrent = function(index) {
	    return scope.current == index;
	  };
	  scope.setCurrent = function(index) {
	    scope.current = index;
	  };
	},
    templateUrl: '/modules/mod_chat/app/partials/chat/typeahead.html'
  };
}).
directive('chatBarResize', function($window) {
    return function($scope) {
      $scope.initializeWindowSize = function() {
      	
        $scope.windowHeight = $window.innerHeight;
        $scope.windowWidth  = $window.innerWidth;
        if($scope.isExternalWindow)
        {

	        $scope.chat_panel_width = $window.innerWidth;
        }
        $scope.max_count =  Math.floor(( ($scope.windowWidth - $scope.chat_queue_width - $scope.chat_panel_width ) / $scope.chat_width));
        if ($scope.max_count < 0 )
        {
	        $scope.max_count = 0;
        }
        
        
		$scope.setLayout();
      };
      angular.element($window).bind("resize", function() {
        $scope.initializeWindowSize();
        $scope.$apply();
      });
      $scope.initializeWindowSize();
    }
  }).
directive('scrollToBottom', function($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    link: function(scope, elem, attrs) {
      var model = $parse(attrs.scrollToBottom);
      scope.$watch(model, function(value) {
        if(value === true) { 
          $timeout(function() 
          {
			  elem[0].scrollTop = elem[0].scrollHeight;
			
          });
        }
      });
    }
  };
}).
directive('scrollToTop', function($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    link: function(scope, elem, attrs) {
      var model = $parse(attrs.scrollToTop);
      scope.$watch(model, function(value) {
        if(value === true) { 
          $timeout(function() 
          {
			  elem[0].scrollTop = 0;
          });
        }
      });
    }
  };
}).
directive('stickToBottom', function($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    priority: 1,
    require: ['?ngModel'],
    restrict: 'A',
    link: function(scope, $el, attrs, ctrls) {
		var model = $parse(attrs.stickToBottom);
		var el = $el[0];
		function fakeNgModel(initValue){
        	return {
	            $setViewValue: function(value){
	                this.$viewValue = value;
	            },
	            $viewValue: initValue
	        };
	    }

        function scrollToBottom(){
            el.scrollTop = el.scrollHeight;
        }

        function shouldActivateAutoScroll(){
            // + 1 catches off by one errors in chrome
            return el.scrollTop + el.clientHeight + 1 >= el.scrollHeight;
        }
      scope.$watch(model, function(value) {
        var ngModel = ctrls[0] || fakeNgModel(true);
        if(value === true) { 

			scope.$watch(function(){
			    if(ngModel.$viewValue){
			        scrollToBottom();
			    }
			});
			
			$el.bind('scroll', function(){
			    scope.$apply(ngModel.$setViewValue.bind(ngModel, shouldActivateAutoScroll()));
			});
        }
      });
    }
  };
}).
directive('scrollIf',['$timeout', '$window', '$compile',  function ($timeout, $window, $compile) {
	return {
		scope:true,
		link: function(scope, element, attrs) {
			scope.$watch(attrs.scrollIf, function(value) {
			if (value) 
			{
				// Scroll to ad.
				var message_display = document.getElementById(scope.referenced_display);
				var message_display_height = message_display.clientHeight;
				var total_height = message_display.scrollHeight
				var pos = parseInt(current_position + 50);
				document.getElementById(scope.referenced_display).scrollTop = pos;
			}
			});
			$timeout(function()
			{
				element.addClass('animated bounce');
			});
			$timeout(function()
			{
				element.removeClass('animated bounce');
			});
		}
		
	}
}]).
directive('scrollOnClick', function($timeout, $parse) {
  return {
  	scope: true,
    //scope: true,   // optionally create a child scope
    link: function(scope, elem, attrs) {
      var model = $parse(attrs.scrollOnClick);
      scope.$watch(model, function(value) {
        if(value === true) 
        { 
			$timeout(function()
			{
					var message_display = document.getElementById(scope.referenced_display);
					var message_display_current = message_display.scrollTop;
					var message_display_height = message_display.clientHeight;
/* 					console.log(scope.referenced_message_id); */
					var message_elem = document.getElementById(scope.referenced_message_id);
					var elem_height = message_elem.parentNode.parentNode.clientHeight;
					var display_offset = (message_display_height / 3) - elem_height;
					var visibile = message_elem.parentNode.parentNode.offsetTop - ((elem_height/2)+15);

					$("#" + scope.referenced_display).animate({scrollTop: visibile}, 500);
					$timeout(function()
					{
						message_elem.addClass('text-danger chat-reference-animation');
					}, 1000);
					$timeout(function()
					{
						message_elem.removeClass('text-danger chat-reference-animation');
/* 						$("#" + scope.referenced_display).animate({scrollTop: message_display_current}, "slow"); */
					}, 4000);
			});
        }
      });
    }
  };
}).
directive('directoryItemScroll', function($timeout, $parse) {
  return {
  	scope: true,
    //scope: true,   // optionally create a child scope
    link: function(scope, elem, attrs) {
      var model = $parse(attrs.directoryItemScroll);
      scope.$watch(model, function(value) {
        if(value === true) 
        { 
        	scope.safeApply(function(){
				$timeout(function()
				{
					document.getElementById('cm-directory-tracker-content').addClass('cm-no-scroll');
					$('#cm-directory-tracker-content').animate({scrollTop: elem[0].offsetTop - 100});					
	/* 				document.getElementById('chat-module-tracker-content').scrollTop = elem[0].offsetTop - 115;		 */
	
					document.getElementById('cm-directory-tracker-content').removeClass('cm-no-scroll');
				});
			})
        }
      });
    }
  };
}).
directive('presence', function($presence, types) {
    function getTypeNames(param) {
      if (!param) {
        return types.getAllTypeNames();
      } else {
        return param.split(' ');
      }
    }

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        angular.forEach(getTypeNames(attrs.presence), function(typeName) {
          var type = types.get(typeName);
          element.on(type.events, function() {
            $presence.registerAction(type.name);
          });
        });
      }
    };
  });
}
