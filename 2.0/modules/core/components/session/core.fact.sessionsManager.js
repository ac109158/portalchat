angular.module('portalchat.core').
service('SessionsManager', ['$rootScope', '$window', '$log', 'CoreConfig', '$firebaseObject', '$firebaseArray', 'ChatStorage', 'UserManager', 'PermissionsManager', function($rootScope, $window, $log, CoreConfig, $firebaseObject, $firebaseArray, ChatStorage, UserManager, PermissionsManager) {
    var that = this;

    this.session = {};
    this.session.id = undefined;

    this.update = {};

    this.fb = {}; // firebase domain
    this.fb.group = {}; // firebase domain
    this.fb.location = {};


    this.load = function() {
        that.setFirebaseLocations();
        that.setFirebaseTargets();
        if (UserManager.user.isAdmin) {
            // that.validateGroupChatSessions();
        }
    };
    this.unload = function() {
        angular.forEach(Object.keys(ChatStorage.contact.chat.list), function(session_key) {
            that.setUserChatSessionStorage('contact', session_key);
        });
    };


    this.mapObjectWithKey = function(object, object_key_field) {
        var map = {};
        var index = 0;
        angular.forEach(object, function(value, key) {
            this[value[object_key_field].toString()] = index;
            index++;
        }, map);
        return map;
    };

    this.setFirebaseLocations = function() {
        if (UserManager.user.profile.id) {
            that.fb.location.signals = new Firebase(CoreConfig.signals.url_root);
            that.fb.location.sessions = new Firebase(CoreConfig.sessions.url_root);
            if (PermissionsManager.hasAdminRights()) {
                // that.fb.group.location.sessions = new Firebase(CoreConfig.group_chat.url_root + CoreConfig.group_chat.active_session_reference);
            }
        }
    };

    this.setFirebaseTargets = function() {
        if (UserManager.user.profile.id) {
            // that.fb.target.is_external_window = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.users_reference + CoreConfig.users_settings_reference + UserManager.user.profile.id + '/is_external_window/'));
            // that.fb.target.is_panel_open = $firebaseObject(new Firebase(CoreConfig.url.firebase_database + CoreConfig.users_reference + CoreConfig.users_settings_reference + UserManager.user.profile.id + '/is_open/'));
            return true;
        }
        return false;
    };

    this.validateGroupChatSessions = function() {
        // clear all unused group active sessions
        if (UserManager.user.isAdmin && that.fb.group.location.sessions) {
            that.fb.group.location.sessions.once('value', function(snapshot) {
                var group_chat_sessions = snapshot.val();
                if (group_chat_sessions) {
                    angular.forEach(group_chat_sessions, function(group_chat_session, key) {
                        if (!group_chat_session.admin) {
                            $log.debug('removed active session' + key);
                            that.fb.group_chat.location.sessions.child(key).remove();
                        }
                    });
                }
            });
        }
    };

    this.sendChatInviteSignal = function(contact_id, signal) {
        if (signal && signal.type && signal.session_key) {
            that.fb.location.signals.child('contact').child(contact_id).child(signal.session_key).update(signal);
        }
    };

    this.sendChatExitSignal = function(type, session_key, contact_id) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && ChatStorage[type].chat.list[session_key].contacts && ChatStorage[type].chat.list[session_key].contacts.active && angular.isDefined(ChatStorage[type].chat.list[session_key].contacts.active[contact_id])) {
            ChatStorage[type].session.list[session_key].fb.group.location.contacts.child(contact_id).remove();
            that.fb.location.signals.child('contact').child(contact_id).child(session_key).update({type: 'group', session_key: session_key, exit: true});
        }
    };


    this.setUserChatSessionStorage = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].session.list[session_key]) {
            if (session_key.split(':')[1]) {
                that.fb.location.sessions.child(session_key.split(':')[0]).child(session_key.split(':')[1]).setWithPriority(ChatStorage[type].chat.list[session_key].session, ChatStorage[type].chat.list[session_key].session.order);
            } else {
                that.fb.location.sessions.child(UserManager.user.profile.id).child(session_key).setWithPriority(ChatStorage[type].chat.list[session_key].session, ChatStorage[type].chat.list[session_key].session.order);
            }

            return true;
        }
        return false;
    };

    this.updateChatSignals = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].session.list[session_key]) {
            if (session_key.split(':')[1]) {
                that.fb.location.signals.child(type).child(session_key.split(':')[1]).child(session_key.split(':')[0]).update(ChatStorage[type].chat.list[session_key].signals.user);
            } else {
                if (type === 'contact' && ChatStorage[type] && ChatStorage[type].session.list[session_key].session.is_group_chat) {
                    that.fb.location.signals.child('group').child(session_key).update(ChatStorage[type].chat.list[session_key].signals.user);
                } else {
                    that.fb.location.signals.child(type).child(session_key).update(ChatStorage[type].chat.list[session_key].signals.user);
                }
            }
            return true;
        }
        return false;
    };

    this.updateChatIsTypingSignal = function(type, session_key, value) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (session_key.split(':')[1]) {
                that.fb.location.signals.child(type).child(session_key.split(':')[1]).child(session_key.split(':')[0]).child('is_typing').child(UserManager.user.profile.id).set({
                    id: value
                });
            } else {
                if (type === 'contact' && ChatStorage[type] && ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                    that.fb.location.signals.child('group').child(session_key).child('is_typing').child(UserManager.user.profile.id).set({
                        id: value
                    });
                } else {
                    that.fb.location.signals.child(type).child(session_key).child('is_typing').child(UserManager.user.profile.id).set({
                        id: value
                    });
                }
            }
        }

    };
    this.updateChatSignalPriority = function(type, session_key, priority) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (session_key.split(':')[1]) {
                that.fb.location.signals.child(type).child(session_key.split(':')[1]).child(session_key.split(':')[0]).update({
                    priority: priority
                });
            } else {
                if (type === 'contact' && ChatStorage[type] && ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                    that.fb.location.signals.child('group').child(session_key).update({
                        priority: priority
                    });
                } else {
                    that.fb.location.signals.child(type).child(session_key).update({
                        priority: priority
                    });
                }
            }
        }

    };
    this.updateChatSignalTopic = function(type, session_key, topic) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (session_key.split(':')[1]) {
                that.fb.location.signals.child(type).child(session_key.split(':')[1]).child(session_key.split(':')[0]).update({
                    topic: topic || ''
                });
            } else {
                if (type === 'contact' && ChatStorage[type] && ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                    that.fb.location.signals.child('group').child(session_key).update({
                        topic: topic || ''
                    });
                } else {
                    that.fb.location.signals.child(type).child(session_key).update({
                        topic: topic || ''
                    });
                }
            }
        }
    };

    this.updateContactChatSession = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].session.list[session_key]) {
            that.fb.location.sessions.child(session_key.split(':')[1] + ':' + session_key.split(':')[0]).update(ChatStorage[type].session.list[session_key].session);
            return true;
        }
        return false;
    };

    this.setContactChatOrderMap = function() {
        ChatStorage.contact.chat.count = 0;
        ChatStorage.contact.chat.order_map = {};
        angular.forEach(ChatStorage.contact.chat.list, function(chat, key) {
            if (chat.session.active) {
                ChatStorage.contact.chat.order_map[chat.session.order] = key;
                ChatStorage.contact.chat.count++;
            }
            that.setUserChatSessionStorage('contact', key);
        });
    };

    this.getNewGroupChatSessionKey = function(invite) {
        if (invite && invite.contact_list) {
            invite.contact_list.unshift(UserManager.user.profile.id);
            var session = {};
            session.is_typing = '';
            session.type = "group",
                session.priority = 0;
            session.contacts = {};
            session.timestamp = new Date().getTime();
            session.topic = angular.copy(invite.copy) || '';
            angular.forEach(invite.contact_list, function(contact_id) {
                session.contacts[contact_id] = 0;
            });
            if (angular.copy(invite.admin)) {
                session.admin = UserManager.user.profile.id;
            } else {
                session.admin = false;
            }
            return that.fb.location.signals.child('group').push(session).key();
        }
        return undefined;
    };

    this.getGroupChatContacts = function(session) {
        return that.fb.location.signals.child('group').child(session.session_key).child('contacts');
    }

    this.closeChatSession = function(type, session_key) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key]) {
            if (ChatStorage[type].chat.list[session_key].session.is_group_chat) {
                ChatStorage[type].session.list[session_key].fb.group.location.contacts.child(UserManager.user.profile.id).remove();
                angular.forEach(ChatStorage.contact.session.list[session_key].fb.group.location, function(fb_location) {
                    fb_location.off('value');
                    fb_location.off('child_added');
                    fb_location.off('child_removed');
                    fb_location.off('child_changed');
                    fb_location = null;
                });
                ChatStorage[type].chat.list[session_key].session.end_at_priority = ChatStorage[type].chat.list[session_key].priority.next;
                ChatStorage[type].chat.list[session_key].session.topic = '';
                ChatStorage[type].chat.list[session_key].contacts.active = {};
                ChatStorage[type].chat.list[session_key].contacts.count = 0;
                that.setUserChatSessionStorage(type, session_key);

            }
        }
    };

    this.closeFireBaseConnections = function(type, session_key){
        angular.forEach(ChatStorage[type].session.list[session_key].fb, function(location_type) {
            angular.forEach(location_type.location, function(fb_location) {
                fb_location.off('value');
                fb_location.off('child_added');
                fb_location.off('child_removed');
                fb_location.off('child_changed');
                fb_location = null;
            });
        });
    }

    this.removeContactChatSession = function(session) {
        if(session && session.session_key && session.session_key.split(':')[1]){
            that.fb.location.sessions.child(UserManager.user.profile.id).child(session.session_key.split(':')[1]).remove();
        }
    }

    //*************************************************************************//

    this.nudgeUser = function(chat) {
        chat.active_session_contact_location.update({
            nudge: true
        });
        $timeout(function() {
            chat.active_session_contact_location.update({
                nudge: false
            });
        }, 5000);
    };




    return this;
}]);
