angular.module('portalchat.core').
service('ChatManager2', ['$rootScope', '$timeout','$window', '$log', '$firebaseObject', 'CoreConfig', 'UserManager', 'NotificationService', function($rootScope, $timeout, $window, $log, $firebaseObject, CoreConfig, UserManager, NotificationService) {
    var that = this;
    this.is_typing_presence = CoreConfig.is_typing_presence;
    this.is_playing_sound = false;

    this.active_chats = [];

    this.active_sessions = [];

    this.new_session_key = undefined;

    this.fb = {};
    this.fb.chat = {};
    this.fb.chat.locations = {};
    this.fb.chat.locations.session = {};

    this.fb.group_chat = {};
    this.fb.group_chat.locations = {};
    this.fb.group_chat.locations.session = {};



    this.returnChatPresenceStates = function() // this function provides the caller with the predefined states that are available
    {
        return this._chat_presence_states;
    };
    this.storeContactUser = function(contact) // this function is called whenever connections need to be created to a user
    {
        $log.debug('Storing To User:' + angular.toJson(contact));
        that._contact = {};
        that._contact._user_id = contact.user_id;
        that._contact._name = contact.name;
        that._contact._avatar = contact.avatar;
    };


    this.getLocationValue = function(location, scope) {
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
    };
    this.pushInternalMessage = function(display, msgText) {
        var element = document.createElement("div");
        element.appendChild(document.createTextNode(msgText));
        element.className = "cm-chat-internal-message text-muted";
        document.getElementById(display).appendChild(element);
    };




    this.setContactUserChatPresenceLocation = function(chatSession,contact) // The purpose of this function is to keep listening to the presence of the contact after a page load, when another user  refreshes their page the firesoscket to their presence is destroyed and we need to recreate it.
    {
        that.__storeContactUser(contact);
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A contact_chat_presence_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        chatSession.contact_chat_presence = $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/chat-presence/'));
        chatSession.contact_chat_presence_message = $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/message/'));
        chatSession.contact_chat_presence_message_show = $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/show-message/'));
        chatSession.contact_chat_presence_message_post = $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/auto-post/'));
        return;
    };
    /*
that.__setContactUserChatPresence = function(contact) // creates a pointer to the chat presence of the specific contact, will let us know if the availability of the contact changes
    {
        that.__storeContactUser(contact);
        if (angular.isUndefined(that._contact._user_id)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: contact not defined: ' + that._contact.user_id);
            ////////////////////////////////////////////////////////////
            return false;
        }
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A contact_chat_presence_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return $firebase(new Firebase(CoreConfig.fb_url + UserManager._users_reference + UserManager._users_presence_reference + that._contact._user_id + '/chat-presence/'));
    }
*/

    this.set_active_typing_contact_location = function() //  The service will write true to this location whenever the user is typing. The contact points to this location to know when the user is typing a message to them
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_typing_contact_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return new Firebase(that._url_root + that._contact._user_id + '/' + 'Typing-Presence/' + that._sub_category_reference);
    };
    this.set_active_typing_group_location = function(scope, session_key) //  The service will write true to this location whenever the user is typing. The contact points to this location to know when the user is typing a message to them
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_typing_group_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        var active_typing_group_location = new Firebase(that._group_url_root + that._group_active_session_reference + session_key + '/' + that._is_typing_reference + '/');
        active_typing_group_location.on('value', function(snapshot) {
            var log = [];
            angular.forEach(that.active_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push(value.session_key);
            }, log);
            var index = log.indexOf(active_typing_group_location.parent().name()); // reference to check inside of users active sessions. Intended to represent if a message came form someone else.
            if (angular.isDefined(that.active_chats[index])) {
                that.active_chats[index].isTyping = snapshot.val();
            } else {
                $log.debug(index + ' could not get typing-presence updated');
            }
        });
        return active_typing_group_location; /*         return $firebase(active_typing_contact_location); */
    };
    this.set_active_typing_user_location = function(scope) // The user will point to this  folder location under a uid child for each chat session. The chat session will watch this location for whenever the contact is typing a message
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_typing_user_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return new Firebase(that._url_root + UserManager.user.profile.id + '/' + 'Typing-Presence/' + that._contact._user_id);
    };
    this.set_active_typing_user_socket = function(scope) // The user will point to this  folder location under a uid child for each chat session. The chat session will watch this location for whenever the contact is typing a message
    {
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A active_typing_user_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        return $firebase(new Firebase(that._url_root + UserManager.user.profile.id + '/' + 'Typing-Presence/' + that._contact._user_id + '/' + 'is-typing/'));
    };

    this.setUserChatPresence = function(chat_presence) // this function is used to set the chat_presence of a user to the firebase location, once it is chaged all user loking at it will know the the user chage in the users chat_presence
    {
        if (angular.isUndefined(chat_presence)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: Arguments are undefined: chat_presence: ' + chat_presence + ' location: ' + that._chat_presence_location);
            ////////////////////////////////////////////////////////////
            return false;
        }
        UserManager._user_presence_location.update({
            'chat-presence': chat_presence
        });
/*
if (chat_presence === "Offline")
        {
            UserManager._user_online_location.update({'online':false});
        }
*/
    };
    this.returnContactUserMessageLocation = function() {
        if (angular.isUndefined(that._contact._user_id)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: contact not defined: ' + that._contact._user_id);
            ////////////////////////////////////////////////////////////
            return false;
        }
        ////////////////////////////////////////////////////////////
        $log.debug("Warning: A contact_message_location firesocket is  being created");
        ////////////////////////////////////////////////////////////
        /*      var tuml_root = that._url_root + that._contact._user_id  + '/' + that._chat_message_storage_reference +  UserManager.user.profile.id + '/' + that.__getDateReference(); */
        var tuml_root = that._url_root + that._contact._user_id + '/' + that._chat_message_storage_reference + that._sub_category_reference;
        var contact_message_location = new Firebase(tuml_root);
        return contact_message_location; /*         return $firebase(contact_message_location); */
    };

    this.returnFromUserMessageLocation = function(scope) // defines the firebase folder location that the user will point their chatSession to
    {
        if (angular.isUndefined(that._contact._user_id)) {
            ////////////////////////////////////////////////////////////
            $log.debug('Failure: contact not defined: ' + that._contact._user_id);
            ////////////////////////////////////////////////////////////
            return false;
        } else if (angular.isDefined(scope._active_sessions) && scope._active_sessions.indexOf(that._contact._user_id) > -1) {
            $log.debug('Failure: contact not defined: ' + that._contact._user_id);
            return false;
        } else {
            ////////////////////////////////////////////////////////////
            $log.debug("Warning: A fromUserMessageLocation is  being created");
            ////////////////////////////////////////////////////////////
            return new Firebase(that._url_root + UserManager.user.profile.id + '/' + that._chat_message_storage_reference + that._contact._user_id + '/');
        }
    };
    this.establishUserChat = function(scope) //  Step 1 this function will initialize the that variables and set the user chat presence.
    {
        $log.debug('calling that.__establishUserChat');
        var check_for_user = setInterval(function() // delays fetch unitl user info is in place
        {
            $log.debug('Looking for chat user');
            if (angular.isDefined(UserManager._user_profile.user_id)) {
                $log.debug('User was defined');
                clearInterval(check_for_user);
                that.active_chats = Array();
                UserManager.user_group = Array();
                UserManager.user_group.push(CoreConfig.common.reference.user_prefix + UserManager._user_profile.user_id);
                if (UserManager.pc) {
                    UserManager.user_group.push(CoreConfig.common.reference.user_prefix + UserManager.pc.user_id);
                }
                if (UserManager._user_profile.mc) {
                    UserManager.user_group.push(CoreConfig.common.reference.user_prefix + UserManager._user_profile.mc.user_id);
                }
                if (UserManager._user_profile.admin && UserManager._user_profile.role === 'Mentor Coach') {
                    UserManager.user_group.push(CoreConfig.common.reference.user_prefix + UserManager._user_profile.admin.user_id);
                }

                UserManager.user.profile.id + '/' = UserManager._user_profile.user_id + '/'; // user_id of user
                that.__set_active_sessions_user_location(scope); // looks at the active session folder of the user, and create chatSession for an calling card objects present
            }
        }, 250);
        $log.debug('Finished that.__establishUserChat');
        return true;
    };

    this.setLastPushed = function(session) {
        that._last_pushed_session = session;
        $timeout(function() {
            that._last_pushed_session = null;
        }, 1000);
    };
    this.updateIsOpen = function(chat) {
        if (angular.isDefined(chat.contact_id)) {
            that._active_sessions_user_location.child(chat.contact_id).update({
                isOpen: chat.isopen
            });
        } else {
            that._active_sessions_user_location.child(chat.session_key).update({
                isOpen: chat.isopen
            });
        }
    };
    this.updateIsSound = function(session_id, bool) {
        that._active_sessions_user_location.child(session_id).update({
            isSound: bool
        });
    };
    return this;
}]);
