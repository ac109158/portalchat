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
}])








