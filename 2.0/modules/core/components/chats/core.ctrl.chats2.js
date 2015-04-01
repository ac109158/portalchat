angular.module('portalchat.core').
controller('ChatController', ['$rootScope', '$scope', '$window', '$log', 'CoreConfig', 'ChatManager', 'DirectoryChatManager', 'UserManager', 'OnlineService', 'UtilityManager', 'BrowserService', 'ChatRecordService', 'AudioService', '$timeout', 'EmojiService', 'states', 'NotificationService', '$sce', '$filter', 'localStorageService', function($rootScope, $scope, $window, $log, CoreConfig, ChatManager, DirectoryChatManager, UserManager, OnlineService, UtilityManager, BrowserService, ChatRecordService, AudioService, $timeout, EmojiService, states, NotificationService, $sce, $filter, localStorageService) {
    angular.isUndefinedOrNull = function(val) {
        return angular.isUndefined(val) || val === null;
    };
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
    $scope.isChildWindow = false;
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
    $scope.presence_states = ChatManager.__returnChatPresenceStates();

    $scope.reference = undefined;
    $scope.referenced_message = null;
    $scope.referenced_index = undefined;
    $scope.referenceName = '';
    $scope.updated_text = '';
    $scope.requested_chat = '';
    $scope.temp_chat = null; // temp storage used in switching chats
    $scope.chat_module_directory_height = parseInt($scope.windowHeight, 10) || 0;
    $scope.unactive_chat_count = 0;
    $scope.chat_width = 237;
    if (!$scope.isExternalWindow) {
        $scope.chat_panel_width = 250;
    }
    $scope.chat_queue_width = 110;
    $scope.chat_margin = 2;
    $scope.max_count = Math.floor((($window.innerWidth - $scope.chat_queue_width - $scope.chat_panel_width) / $scope.chat_width));
    $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();

    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
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
        window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onchange;

    function onchange(evt) {
        var v = 'visible',
            h = 'hidden',
            evtMap = {
                focus: v,
                focusin: v,
                pageshow: v,
                blur: h,
                focusout: h,
                pagehide: h
            };

        evt = evt || window.event;
        if (evt.type in evtMap) {
            $scope.page_status = evtMap[evt.type];
        } else {
            $scope.page_status = this[$scope.hidden] ? "hidden" : "visible";
        }
        if ($scope.page_status === 'visible') {
            $scope.unread = 0;
            document.title = $scope.default_window_title;
        }
    }

    jQuery(document).ready(function() {
        var check_for_user = setInterval(function() // delays fetch unitl user info is in place
            {
                if (UserManager._user_profile.role === 'PlusOne Admin') {
                    var sessions_root = new Firebase(ChatManager._group_url_root + ChatManager._group_active_session_reference);
                    sessions_root.once('value', function(snapshot) {
                        var active_sessions = snapshot.val();
                        if (active_sessions) {
                            angular.forEach(active_sessions, function(val, key) {
                                if (!val.admin) {
                                    $log.debug('removed active session' + key);
                                    sessions_root.child(key).remove();
                                }
                            });
                        }
                    });
                }
                if (UserManager._user_profile.role === 'PlusOne Admin' || UserManager._user_profile.role === 'Administrator' || UserManager._user_profile.role === 'Shift Manager') {
                    var mc_root = new Firebase(ChatManager._group_url_root + 'mc');
                    mc_root.once('value', function(snapshot) {
                        var mc_chats = snapshot.val();
                        if (mc_chats) {
                            $scope.mc_array = Array();
                            angular.forEach(mc_chats, function(val, key) {
                                $scope.mc_array.push(UserManager._users_profiles_obj['user_' + key.split('_')[1]]);
                            });
                        }
                    });
                }
                $scope.online_users_list = UserManager._online_users_list;
                $scope.offline_users_list = UserManager._offline_users_list;
                $log.debug('Looking for chat user');
                if (UserManager._user_profile && UserManager._user_profile.user_id && angular.isDefined(UserManager._user_profile_location) && UserManager._user_init) {
                    $scope.user_online = UserManager.__setProfileOnlineLocationforUser(UserManager._user_profile.user_id);

                    $scope.user_chat_presence = UserManager.__setChatPresenceforUser(UserManager._user_profile.user_id);

                    $timeout(function() {
                        $scope.users_list = UserManager.__getUserArray();
                        UserManager._page_loaded = true;
                    }, 5000);

                    /*              UserManager.__setGeolocation(UserManager._user_profile.user_id); */
                    $scope.location = {};
                    /*              UserManager.__getGeolocation(UserManager._user_profile.user_id, $scope.location) */


                    clearInterval(check_for_user);
                    $log.debug('User was defined');
                    $log.debug(String(window.location.href).split('?')[1]);
                    if (String(window.location.href).split('?')[1] === String(CoreConfig.ext_link).split('?')[1]) {
                        $scope.isExternalWindow = true;
                        UserManager._user_settings_location.update({
                            'is-external-window': true
                        });
                        $scope.isExternalInstance = true;
                    } else {
                        $scope.isExternalInstance = false;

                    }
                    /*

                                    if ( String(window.location.href).split('?')[1] === 'option=com_content&view=category&layout=blog&id=8&Itemid=102')
                                    {
                                        $scope.isExternalInstance = false;
                                    }
                    */

                    $timeout(function() {
                        OnlineService.__setOnlineTracking($scope);
                        $scope.$on('LocalStorageModule.notification.setItem', function(event, parameters) {
                            $log.debug('local storage: ' + parameters.key + ' ; ' + parameters.newvalue);
                            // parameters.key;  // contains the key that changed
                            // parameters.newvalue;  // contains the new value
                        });
                    }, 5000);
                    $log.debug($scope.is_external_window.$value);
                    $scope.$watch('is_external_window.$value', function(newStatus) {
                        if (newStatus === false && $scope.isExternalInstance === false) {
                            /*                         UtilityManager.setFirebaseOnline(); */
                            if ($scope.externalWindowObject) {
                                $scope.externalWindowlistener = null;
                                $scope.externalWindowObject = null;
                            }
                            $scope.isExternalWindow = false;
                            $scope.isChildWindow = false;
                            ChatManager.__set_active_sessions_user_location($scope);
                            $timeout(function() {
                                $scope.establishLayout();
                            }, 1000);

                        } else if (newStatus === true && $scope.isExternalInstance === false) {
                            $timeout(function() {
                                $scope.isExternalWindow = true;
                                $scope.isPageLoaded = false;
                                $scope.mute();

                            }, 750);

                        } else if (!localStorageService.get('isExternalWindow')) {
                            /*
                       ChatManager.__set_active_sessions_user_location($scope);
                       $timeout(function(){
                           $scope.establishLayout();
                       }, 1000)
*/

                        }
                        if (newStatus && $scope.isExternalInstance) {
                            $scope.chat_panel_width = window.innerWidth;
                        } else {
                            $scope.chat_panel_width = 250;
                        }

                    });
                    ChatManager.__establishUserChat($scope);
                    $scope.sm_group_chat = DirectoryChatManager.__buildNewDirectoryChat($scope, 'sm_group_chat', 'PlusOne - Group Chat', 'smod', true, false, 1);
                    $scope.sm_group_chat.index_position = 'sm_group_chat';
                    $scope.checkForTopic($scope.sm_group_chat);
                    $scope.sm_tech_chat = DirectoryChatManager.__buildNewDirectoryChat($scope, 'sm_tech_chat', 'Tech Support - Group Chat', 'tod', true, false, 2);

                    $scope.sm_tech_chat.index_position = 'sm_tech_chat';
                    $scope.checkForTopic($scope.sm_tech_chat);

                    if (UserManager._user_profile.mc) {
                        $scope.mc_group_chat = DirectoryChatManager.__buildNewDirectoryChat($scope, ('mc_' + UserManager._user_profile.mc.user_id + '_group_chat'), UserManager._user_profile.mc.name + ' - MC Team Chat', UserManager._user_profile.mc.user_id, false, false, 3); //scope, chat_reference, chat_description, admin, watch_users
                        $scope.mc_group_chat.index_position = 'mc_group_chat';
                    }
                    /*
else if (UserManager._user_profile.position === 33)
                {
                    $scope.mc_group_chat = DirectoryChatManager.__buildNewDirectoryChat($scope, ('mc_' + UserManager._user_profile.user_id + '_group_chat'), UserManager._user_profile.name + ' - MC Team Chat', UserManager._user_profile.user_id, false, false);  //chatSession, to_user,  scope
                    $scope.mc_group_chat.index_position = 'mc_group_chat';
                }
*/
                    if ($scope.mc_group_chat) {
                        $scope.checkForTopic($scope.mc_group_chat);
                    }

                    if (true) {
                        $timeout(function() {
                            $scope.$evalAsync(function() {
                                if ($scope.layout === null) {
                                    UserManager._user_settings_location.update({
                                        'layout': 1
                                    });
                                }
                                if ($scope.isChatModuleOpen === null) {
                                    UserManager._user_settings_location.update({
                                        'module-open': true
                                    });
                                }
                            });
                            if ($scope.isExternalWindow === true && $scope.isExternalInstance === false) {
                                return;
                            }
                            if ($scope.isExternalWindow === false || $scope.isExternalWindow === true && $scope.isExternalInstance) {
                                $scope.establishLayout();
                            }
                        }, 100);
                    }
                }
            }, 1000);



        $scope.$watch('online', function(newStatus) {
            UtilityManager.__observeOnlineChange(newStatus);
        });

        $scope.$watch('network', function(newStatus) {
            UtilityManager.__observeNetworkChange(newStatus);
        });

        $scope.$watch('portal_online', function(newStatus) {
            UtilityManager.__observeNetworkChange(newStatus);
        });

        $scope.$on('requestChatSession', function(event, to_user) {
            ChatManager.__requestChatSession($scope, to_user, true);
        });

        $scope.$on('todChange', function(event, to_user) {
            $scope.$evalAsync(function() {
                $scope.tod = UserManager._tod;
            });

        });

        $scope.$on('smodChange', function(event, to_user) {
            $scope.$evalAsync(function() {
                $scope.smod = UserManager._smod;
            });
        });

        $scope.$on('activateExternalWindow', function(event) {
            if ($scope.externalWindowObject) {
                $scope.externalWindowObject.focus();
            } else {
                $scope.openExternalWindow();
            }
        });

    });

    $scope.fontUp = function() {
        if ($scope.font_size < 16) {
            $scope.font_size++;
            UserManager._user_settings_location.update({
                'font-size': $scope.font_size
            });
        }
        $scope.$evalAsync(function() {
            $scope.initializeWindowSize();
        });
    };

    $scope.fontDown = function() {
        if ($scope.font_size > 12) {
            $scope.font_size--;
            UserManager._user_settings_location.update({
                'font-size': $scope.font_size
            });
        }
        $scope.$evalAsync(function() {
            $scope.initializeWindowSize();
        });
    };

    $scope.updateTmp = function(tmp) {
        if (tmp != $scope.tmp) {
            if (tmp) {
                $scope.tmp = tmp;
            }
        }
    };

    $scope.establishLayout = function() {
        $log.debug('calling $scope.establishLayout()');
        $scope.isChatModuleOpen = true;
        if ($scope.isExternalInstance) {
            document.documentElement.style.overflow = 'hidden'; // firefox, chrome
            document.body.scroll = "no"; // ie only
            $timeout(function() {
                document.documentElement.style.overflow = 'hidden'; // firefox, chrome
                document.body.scroll = "no"; // ie only
            }, 4000);
        }
        /*                  $timeout(function(){ */
        var check_for_layout = setInterval(function() // delays fetch unitl user info is in place
            {
                if (angular.isDefined($scope.isChatModuleOpen) && angular.isDefined($scope.layout)) {
                    clearInterval(check_for_layout);
                    var init_tab = 'contacts';

                    if ($scope.layout === 1 && angular.isDefined($scope.last_active_chat_index)) {
                        if (typeof $scope.last_active_chat_index.$value === 'string') {
                            if ($scope.activeChats.length > 0) {
                                $scope.directory_chat = $scope.activeChats[0];
                                $scope.directory_index = 0;
                                $scope.stored_directory_index = 0;
                            }
                            init_tab = $scope.last_active_chat_index.$value + '_link';

                        } else {
                            init_tab = 'contacts_link';
                        }

                        $timeout(function() {
                            $scope.isPageLoaded = true;
                            $scope.setLayout();
                        }, 50);





                        $timeout(function() {

                            $scope.setLayout();
                            $scope.isSettingLayout = false;
                            $scope.isPageComplete = true;

                            if ($scope.isChatModuleOpen) {
                                $timeout(function() {
                                    if (angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_mandatory_chat_index.$value === 'string') {
                                        $scope.setMandatoryFocus($scope[$scope.last_mandatory_chat_index.$value]);
                                    } else if (angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_active_chat_index.$value === 'number') {
                                        $scope.setDirectoryChat($scope.last_active_chat_index.$value, true);
                                    } else {
                                        if (init_tab) {
                                            if (document.getElementById(init_tab)) {
                                                document.getElementById(init_tab).click();
                                            }

                                        }

                                        $scope.clearMandatoryList();
                                    }

                                });
                            }
                        }, 100);

                        $timeout(function() {
                            UserManager._user_settings_location.child('/module-open/').once('value', function(snapshot) {
                                if (snapshot.val() === null) {
                                    $scope.isChatModuleOpen = true;
                                } else {
                                    $scope.isChatModuleOpen = snapshot.val();
                                }
                            });
                        }, 90);
                        /*
                                            $timeout(function(){
                                                UserManager._user_profiles_location.child(UserManager._user_profile.user_id + '/module-open/').on('value', function(snapshot)
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


                    } else if ($scope.layout === 3) {
                        if (angular.isUndefinedOrNull($scope.last_active_chat_index) || angular.isDefined($scope.active_chat_index) && typeof $scope.active_chat_index.$value === 'string') {
                            if ($scope.activeChats.length > 0) {
                                $scope.directory_chat = $scope.activeChats[0];
                                $scope.stored_directory_index = $scope.directory_index = 0;
                            }

                        }

                        if (angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_mandatory_chat_index.$value === 'string') {
                            init_tab = $scope.last_mandatory_chat_index.$value + '_link';
                        } else {
                            init_tab = 'contacts_link';
                        }

                        $timeout(function() {
                            $scope.isPageLoaded = true;
                        }, 50);


                        $timeout(function() {
                            $scope.setLayout();
                        }, 100);

                        $timeout(function() {
                            if ($scope.activeChats.length > 0) {
                                if (angular.isDefined($scope.last_active_chat_index) && typeof $scope.last_active_chat_index.$value === 'number') {
                                    $scope.setDirectoryChat($scope.last_active_chat_index.$value, $scope.isChatModuleOpen);
                                } else {
                                    $scope.setDirectoryChat(0, $scope.isChatModuleOpen);
                                }
                            }

                        }, 150);

                        $timeout(function() {
                            $scope.setLayout();
                            $scope.isPageComplete = true;
                            $scope.isSettingLayout = false;

                        }, 200);

                        $timeout(function() {

                            UserManager._user_settings_location.child('/module-open/').once('value', function(snapshot) {
                                if (snapshot.val() === null) {
                                    $scope.isChatModuleOpen = true;
                                } else {
                                    $scope.isChatModuleOpen = snapshot.val();
                                }
                            });
                        }, 250);
                    } else {
                        if (angular.isDefined($scope.last_mandatory_chat_index) && typeof $scope.last_mandatory_chat_index.$value === 'string') {
                            init_tab = $scope.last_mandatory_chat_index.$value + '_link';
                        } else {
                            init_tab = 'contacts_link';
                        }
                        $timeout(function() {
                            $scope.isPageLoaded = true;
                        }, 50);

                        $timeout(function() {
                            $scope.setLayout();
                            $scope.isPageComplete = true;
                            $scope.isSettingLayout = false;
                            if (init_tab && $scope.isChatModuleOpen) {
                                $timeout(function() {
                                    if (document.getElementById(init_tab)) {
                                        document.getElementById(init_tab).click();
                                    }
                                    $scope.clearMandatoryList();
                                });
                            }

                        }, 100);
                    }

                    $timeout(function() {
                        ChatManager.__setLastPushed('empty');
                        angular.forEach($scope.activeChats, function(val, key) {
                            val.isTextFocus = false;
                            $scope.resetTyping(val);

                        });



                        $scope.$watch('layout', function(newStatus) {
                            $scope.safeApply(function() {
                                $timeout(function() {
                                    $scope.setLayout();
                                }, 500);
                            });
                        });

                        $scope.$watch('windowHeight', function(newStatus) {
                            $scope.safeApply(function() {
                                $scope.setLayout();
                            });
                        });
                        $timeout(function() {
                            $scope.$watch('is_panel_open.$value', function(newStatus) {
                                if (newStatus === true) {
                                    $scope.openChatModule();
                                } else {
                                    if ($scope.isExternalInstance) {
                                        return false;
                                    }
                                    $scope.closeChatModule();
                                }
                            });

                        }, 5000);


                        $scope.$watch('vertical_adjust', function(newStatus) {
                            $scope.vertical_adjust = parseInt(newStatus);
                            $scope.setLayout();
                        });

                        $scope.$watch('width_adjust', function(newStatus) {
                            /*
if (parseInt(newStatus + 250) < 300)
                        {
                            $scope.font_size = 12;
                            UserManager._user_settings_location.update({'font-size': $scope.font_size});
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
                            if (newValue) {
                                $scope.video.code = '';
                                $timeout(function() {
                                    $scope.video.code = $scope.video.url.split('v=')[1];
                                    $scope.video.code = $scope.video.code.split('&')[0];
                                }, 250);

                            }
                        });

                        $scope.$watch('audio.cid', function(newValue) {
                            if (newValue && newValue.length > 0) {
                                $scope.audio.url = null;
                                $timeout(function() {
                                    AudioService.async($scope, newValue);
                                }, 250);

                            }
                        });

                        $scope.$watch('audio.url', function(newValue) {
                            if (newValue && newValue.length > 0) {
                                $scope.audio.url = null;
                                $scope.audio.url = $sce.trustAsResourceUrl(newValue);

                            }
                        });

                        $scope.$watch('activeChats.length', function(newStatus) {
                            if (newStatus > $scope.max_count) {
                                $scope.unactive_chat_count = newStatus - $scope.max_count;
                            } else {
                                $scope.unactive_chat_count = 0;
                            }
                            $scope.unactiveChats = null;
                            $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
                            $scope.setActiveChatsPriority();
                            /*          $scope.resetChatUnread(); */
                            if ($scope.layout != 2) {
                                $scope.$evalAsync(function() {
                                    $scope.setLayout();
                                });
                            }
                        });

                        $scope.$watch('max_count', function(newStatus) {
                            $scope.max_count = newStatus;
                            if ($scope.activeChats.length > $scope.max_count) {
                                $scope.unactive_chat_count = $scope.activeChats.length - $scope.max_count;
                            } else {
                                $scope.unactive_chat_count = 0;
                            }
                            $scope.unactiveChats = null;
                            $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
                            $scope.resetChatUnread();
                        });

                        $timeout(function() {
                            NotificationService.isGlobalSound = true;
                        }, 3000);
                    }, 1500);
                }
            }, 100);
        $log.debug('finished $scope.establishLayout()');
    };
    $scope.toggleUnactive = function() {
        $scope.showUnactive = !$scope.showUnactive;
    };

    $scope.openUnactiveChat = function(chat, index, max_count_index) {
        $scope.temp_chat = chat;
        $scope.unactiveChats[index] = $scope.activeChats[max_count_index + ($scope.activeChats.length - (max_count_index + 1) - index)] = $scope.activeChats[max_count_index];
        $scope.activeChats[max_count_index] = $scope.temp_chat;
        $scope.activeChats[max_count_index].isopen = true;
        $scope.activeChats[max_count_index].isTextFocus = true;
        $scope.activeChats[max_count_index].unread = 0;
        $scope.activeChats[max_count_index].header_color = ChatManager._header_color;
        ChatManager.__setLastPushed($scope.activeChats[max_count_index].to_user_id || $scope.activeChats[max_count_index].session_key);
        $scope.temp_chat = null;
        $scope.setActiveChatsPriority();
    };


    $scope.toggleModuleLock = function() {
        $scope.chat_module_lock = !$scope.chat_module_lock;
    };

    $scope.setModuleLock = function() {
        $scope.chat_module_lock = true;
    };

    $scope.unSetModuleLock = function() {
        $scope.chat_module_lock = false;
    };

    $scope.getDirectoryMainPanelHeight = function(chat) {
        var size;
        if (angular.isUndefinedOrNull(chat)) {
            return false;
        }
        if ($scope.layout === 1) {
            if (chat.topic_location.$value !== false) {

                return $scope.cm_directory_chat_height - 20;
            }
            return $scope.cm_directory_chat_height;

        }
        if ($scope.layout === 3) {
            if (chat.isMandatory) {
                if (angular.isDefined(chat) && chat !== null && chat.topic_location.$value !== false) {
                    size = ($scope.cm_directory_chat_height + $scope.vertical_adjust);
                    return size;
                }
                size = (parseInt($scope.cm_directory_chat_height) + parseInt($scope.vertical_adjust));
                return size;
            } else {
                if (angular.isDefined(chat) && chat !== null && chat.topic_location.$value !== false) {
                    size = ($scope.cm_directory_chat_height - $scope.vertical_adjust);
                    return size;
                }
                size = ($scope.cm_directory_chat_height - $scope.vertical_adjust);
                return size;
            }
        }
    };


    $scope.setLayout = function() {

        $scope.windowHeight = $window.innerHeight;

        if ($scope.isChatModuleOpen && $scope.isPageLoaded) {
            if ($scope.layout === 1 || $scope.layout === null) {
                $scope.chat_module_directory_height = parseInt($scope.windowHeight, 10) || 0;

                $scope.chat_module_header_height = parseInt(document.getElementById("cm-directory-header").clientHeight, 10) || 0;

                $scope.cm_directory_chat_height = $scope.chat_module_directory_height - $scope.chat_module_header_height;
                /*                  console.log($scope.cm_directory_chat_height); */

                $scope.cm_directory_upper_panel = parseInt(document.getElementById("cm-directory-upper-panel").clientHeight, 10) || 0;

                $scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.cm_directory_upper_panel;
                /*                  console.log($scope.cm_directory_chat_height); */

                $scope.chat_module_nav_height = parseInt(document.getElementById("cm-directory-nav").clientHeight, 10) || 0;

                /*                  $scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.chat_module_nav_height;
                /*                  console.log($scope.cm_directory_chat_height); */


                /*                  $scope.cm_directory_chat_height = Math.floor($scope.cm_directory_chat_height /2); */
                /*                  console.log($scope.cm_directory_chat_height); */

                /*                  $scope.cm_directory_chat_height = $scope.cm_directory_chat_height - 10; */
                /*                  console.log($scope.cm_directory_chat_height); */

                $scope.cm_directory_chat_message_display_height = $scope.cm_directory_chat_height - 92;
                /*                  console.log($scope.cm_directory_chat_message_display_height); */

            } else if ($scope.layout === 2) {
                $scope.chat_module_directory_height = parseInt($scope.windowHeight / 2, 10) || 0;

                $scope.chat_module_header_height = parseInt(document.getElementById("cm-directory-header").clientHeight, 10) || 0;
                /*              console.log($scope.chat_module_header_height); */
                $scope.chat_module_upper_panel_height = parseInt(document.getElementById("cm-directory-upper-panel").clientHeight, 10) || 0;

                $scope.chat_module_resize_slider_height_2 = parseInt(document.getElementById("cm-directory-resize-slider-2").clientHeight, 10) || 0;

                $scope.chat_module_main_panel_height = $scope.chat_module_directory_height - $scope.chat_module_header_height - $scope.chat_module_upper_panel_height - $scope.chat_module_resize_slider_height_2;
                /*              console.log('main panel: '  + $scope.chat_module_main_panel_height); */
                $scope.cm_chat_message_display_height = $scope.chat_module_main_panel_height - 80;
                /*              console.log($scope.cm_chat_message_display_height); */
                $scope.chat_module_directory_height = $scope.chat_module_directory_height + parseInt($scope.vertical_adjust_2);
                /*              console.log($scope.chat_module_directory_height );   */
                $scope.chat_module_main_panel_height = $scope.chat_module_main_panel_height + parseInt($scope.vertical_adjust_2);
                /*              console.log($scope.chat_module_main_panel_height); */
                $scope.cm_directory_chat_message_display_height = $scope.cm_chat_message_display_height + parseInt($scope.vertical_adjust_2);
                if (!$scope.isPageComplete) {
                    $scope.cm_directory_chat_message_display_height = $scope.cm_directory_chat_message_display_height - 5;
                }
                /*              console.log($scope.cm_directory_chat_message_display_height);                */
            } else if ($scope.layout === 3 && $scope.isPageLoaded) {
                /*              console.log('setting layout 3'); */
                if ($scope.activeChats.length > 0) {
                    $scope.chat_module_directory_height = parseInt($scope.windowHeight, 10) || 0;

                    $scope.chat_module_header_height = parseInt(document.getElementById("cm-directory-header").clientHeight, 10) || 0;

                    $scope.cm_directory_chat_height = $scope.chat_module_directory_height - $scope.chat_module_header_height;
                    /*                  console.log($scope.cm_directory_chat_height); */

                    $scope.cm_directory_upper_panel = parseInt(document.getElementById("cm-directory-upper-panel").clientHeight, 10) || 0;

                    $scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.cm_directory_upper_panel;
                    /*                  console.log($scope.cm_directory_chat_height); */

                    $scope.cm_directory_tracker_height = parseInt(document.getElementById("cm-directory-tracker-3").clientHeight, 10) || 0;

                    $scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.cm_directory_tracker_height;
                    /*                  console.log($scope.cm_directory_chat_height); */

                    $scope.chat_module_nav_height = parseInt(document.getElementById("cm-directory-nav").clientHeight, 10) || 0;

                    $scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.chat_module_nav_height;
                    /*                  console.log($scope.cm_directory_chat_height); */

                    $scope.chat_module_resize_slider_height = parseInt(document.getElementById("cm-directory-resize-slider").clientHeight, 0) || 0;

                    $scope.cm_directory_chat_height = $scope.cm_directory_chat_height - $scope.chat_module_resize_slider_height;
                    /*                  console.log($scope.cm_directory_chat_height); */

                    $scope.chat_module_resize_slider_height_width = parseInt(document.getElementById("cm-directory-resize-slider-width").clientHeight, 0) || 0;

                    $scope.cm_directory_chat_height = Math.floor($scope.cm_directory_chat_height / 2);
                    /*                  console.log($scope.cm_directory_chat_height); */

                    /*                  $scope.cm_directory_chat_height = $scope.cm_directory_chat_height - 10; */
                    /*                  console.log($scope.cm_directory_chat_height); */

                    $scope.cm_directory_chat_message_display_height = $scope.cm_directory_chat_height - 90;
                    /*                  console.log($scope.cm_directory_chat_message_display_height); */
                }
            }
        }
    };

    $scope.getChatBoxHeight = function(vertical_adjust) {
        return $scope.cm_chat_message_display_height + parseInt(vertical_adjust) - 75;
    };

    $scope.toggleLayout = function() {
        if ($scope.layout === 1) {
            $scope.switchLayout(2);
        } else {
            $scope.switchLayout(1);
        }
    };

    $scope.switchLayout = function(layout) {
        if (layout === 3 && $scope.activeChats.length === 0 || layout === $scope.layout) {
            return false;
        }
        $scope.safeApply(function() {
            $scope.isSettingLayout = true;
            $scope.layout = layout;
            if (UserManager._user_settings_location) {
                UserManager._user_settings_location.update({
                    'layout': layout
                });
            }
            if (layout === 2) {
                $timeout(function() {
                    if ($scope.mandatory_index != "contacts") {
                        document.getElementById($scope.mandatory_index + '_link').click();
                    }
                    $scope.setLayout();
                    $scope.isSettingLayout = false;
                }, 500);
            } else if (layout === 3) {
                $timeout(function() {
                    if (!$scope.directory_chat) {
                        $scope.setDirectoryChat($scope.stored_directory_index || 0, true);
                    }
                    document.getElementById($scope.mandatory_index + '_link').click();
                    $scope.isSettingLayout = false;
                }, 250);
            } else if (layout === 1) {
                $timeout(function() {

                    if ($scope.mandatory_index === 'contacts') {
                        $scope.setContactsFocus();
                    } else {
                        $scope.setMandatoryFocus($scope[$scope.mandatory_index]);
                    }
                    $scope.isSettingLayout = false;
                }, 250);
            }
        });
    };

    $scope.updateVerticalSize = function() {
        UserManager._user_settings_location.update({
            'vertical-adjust': parseInt($scope.vertical_adjust)
        });
    };

    $scope.updateVerticalSize2 = function() {
        UserManager._user_settings_location.update({
            'vertical-adjust-2': parseInt($scope.vertical_adjust_2)
        });
    };

    $scope.updateWidthSize = function() {
        UserManager._user_settings_location.update({
            'width-adjust': parseInt($scope.width_adjust)
        });
    };

    $scope.isGroupAvailable = function(group) {
        if (group === 'mc') {
            if (UserManager._user_profile.mc || UserManager._user_profile_role === 'Mentor Coach') {
                return true;
            }
        } else if (group === 'admin') {
            if (UserManager._user_profile.role === 'Administrator' || UserManager._user_profile.role === 'Shift Manager') {
                return true;
            }
        }
        return false;
    };

    $scope.toggleChatModule = function(value) {
        if ($scope.layout === 2) {
            $scope.isChatModuleOpen = value;
            UserManager._user_settings_location.update({
                'module-open': value
            });
        }
        if (value) {
            $timeout(function() {
                $scope.setLayout();
            }, 250);
        }
    };

    $scope.closeChatModule = function() {
        /*      console.log('closing'); */
        if ($scope.layout != 2) {
            if (true) {
                $scope.$evalAsync(function() {
                    $scope.isChatModuleClosing = true;
                });
                $timeout(function() {
                    $scope.isChatModuleOpen = false;
                    $scope.isChatModuleClosing = false;
                }, 1000);
                $scope.clearMandatoryList();
                if ($scope.directory_chat) {
                    $scope.directory_chat.isTextFocus = false;
                }
                UserManager._user_settings_location.update({
                    'module-open': false
                });

            }
        } else {
            UserManager._user_settings_location.update({
                'module-open': false
            });
        }
    };

    $scope.openChatModule = function() {
        $scope.isChatModuleClosing = false;
        $scope.chat_module_lock = true;
        $scope.$broadcast('clear_notifications');
        if (UserManager._user_settings_location) {
            UserManager._user_settings_location.update({
                'module-open': true
            });

        }
        $scope.$evalAsync(function() {
            $scope.isChatModuleOpening = true;
            $scope.isChatModuleOpen = true;
        });

        $timeout(function() {
            $scope.$evalAsync(function() {
                /*              $scope.detectLayout(); */
                $scope.alertToOpen = false;
                $scope.isChatModuleOpening = false;
                $scope.setLayout();
            });
        }, 1000);
    };

    $scope.resetChatUnread = function() {
        var i = $scope.activeChats.length;
        while (i--) {
            if ($scope.activeChats[i].isopen && i < $scope.max_count) {
                $scope.activeChats[i].header_color = ChatManager._header_color;
                $scope.activeChats[i].unread = 0;
            }
        }
    };

    $scope.checkForTopic = function(chat) {
        if (angular.isUndefinedOrNull(chat) || angular.isUndefinedOrNull(chat.index_position)) {
            return;
        }

        UserManager._user_settings_location.child(chat.index_position).once('value', function(snapshot) {
            var chat_settings = snapshot.val();
            if (chat_settings) {
                chat.isSound = chat_settings.isSound;
                chat.monitor = chat_settings.monitor;
            }
        });

        $timeout(function() {
            if (chat.topic_location.$value === null || chat.topic_location.$value === undefined) {
                $scope.safeApply(function() {
                    $timeout(function() {
                        chat.firebase_location.child('topic').set(false);
                    });
                });
            } else {
                if (document.getElementById('topic_' + chat.session_key + '_wrapper')) {
                    chat.topic_height = document.getElementById('topic_' + chat.session_key + '_wrapper').clientHeight;
                }
            }
        }, 2000);
    };

    $scope.updateExternalMonitor = function() {
        $scope.external_monitor = !$scope.external_monitor;
        UserManager._user_settings_location.update({
            'external-monitor': $scope.external_monitor
        });
    };

    $scope.updateChatSettings = function(chat) {
        UserManager._user_settings_location.child(chat.index_position).update({
            isSound: chat.isSound,
            monitor: chat.monitor
        });
    };

    $scope.setActiveChatsPriority = function() {
        $scope.active_chats_index = -1;
        angular.forEach($scope.activeChats, function(val, key) {
            ++$scope.active_chats_index;
            if (val.isGroupChat) {
                ChatManager._active_sessions_user_location.child(val.session_key).setPriority($scope.active_chats_index);
                /*              console.log( val.session_key + ' was set with the priority ' + $scope.active_chats_index); */
            } else {
                ChatManager._active_sessions_user_location.child(val.to_user_id).setPriority($scope.active_chats_index);
                /*              console.log( val.to_user_name + ' was set with the priority ' + $scope.active_chats_index); */
            }
            val.index_position = $scope.active_chats_index;
            ChatManager._active_sessions_user_location.child(val.to_user_id || val.session_key).update({
                'index_position': $scope.active_chats_index
            });

        });
    };

    $scope.updateChatResize = function(chat) {
        ChatManager._active_sessions_user_location.child(chat.to_user_id || chat.session_key).update({
            'resize_adjust': chat.resize_adjustment
        });
    };

    $scope.toggleUserList = function(chat) {
        chat.showUserList = !chat.showUserList;
    };

    $scope.removeActiveUser = function(chat, user) {
        chat.group_user_location.child(user).set(null);
    };


    $scope.toggleUserOptions = function(chat) {
        if (chat.isopen === false) {
            chat.isopen = true;
        }
        chat.showUserOptions = !chat.showUserOptions;
    };

    $scope.tagChatOn = function(chat) {
        $scope.clear(chat);
        chat.showTagOption = true;
        chat.isTagFocus = true;
        chat.isTopSpacer = true;
    };

    $scope.removeTag = function(chat) {
        ChatManager._active_sessions_user_location.child(chat.to_user_id || chat.session_key).update({
            tag: null
        });
        chat.tag = null;
    };

    $scope.tagChatOff = function(chat) {
        chat.showTagOption = false;
    };

    $scope.clear = function(chat) {
        if (angular.isDefined(chat.close_invite)) {
            clearInterval(chat.close_invite);
        }
        chat.showUserOptions = false;
        chat.nudge = false;
        chat.showUserList = false;
        chat.showTagOption = false;
        chat.showProfile = false;
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
        chat.header_color = ChatManager._header_color;
        chat.isNewMessage = false;
        if (chat.topic_location) {
            if (!chat.topic_location.$value) {
                chat.topic_height = 0;
            } else {
                chat.topic_height = document.getElementById('topic_' + chat.session_key + '_wrapper').clientHeight || 0;
            }
        }
    };

    $scope.clearDirectory = function(chat) {
        if (angular.isUndefinedOrNull(chat)) {
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
        if (chat.topic_location) {
            if (!chat.topic_location.$value) {
                chat.topic_height = 0;
            } else {
                chat.topic_height = document.getElementById('topic_' + chat.session_key + '_wrapper').clientHeight || 0;
            }
        }

    };

    $scope.updateTag = function(chat) {
        if (angular.isDefined(chat.tag_description) && chat.tag_description.length > 2 && chat.tag_description.length <= 20) {
            ChatManager._active_sessions_user_location.child(chat.to_user_id || chat.session_key).update({
                tag: chat.tag_description
            });
            $scope.clear(chat);
            chat.tag_description = String(chat.tag_description).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
            if (chat.isgroupChat) {
                chat.tag_description = 'Group - #' + chat.tag_description;
            } else {
                chat.tag_description = '#' + chat.tag_description;
            }
            chat.tag = chat.tag_description;
            chat.tag_description = '';
            chat.isTextFocus = true;

        }
        return false;
    };

    $scope.addTopicOn = function(chat) {
        $scope.clear(chat);
        chat.addTopicOn = true;
        chat.isTopicFocus = true;
        chat.isTopSpacer = true;
    };

    $scope.toggleTopic = function(chat) {
        if (chat.topic_location.$value.length > 30) {
            chat.isTopicTruncated = !chat.isTopicTruncated;
        }
        $scope.safeApply(function() {
            $timeout(function() {
                $scope.getTopicHeight(chat);
            });
        });
    };

    $scope.getTopicHeight = function(chat) {
        if (chat.topic_location.$value !== false && chat.topic_location.$value !== null) {
            chat.topic_height = document.getElementById('topic_' + chat.session_key + '_wrapper').clientHeight;
        } else {
            chat.topic_height = 0;
        }
    };

    $scope.removeTopic = function(chat) {
        if (angular.isDefined(chat.firebase_location)) {
            chat.firebase_location.update({
                topic: false
            });
            chat.topic_description = '';
            chat.topic_height = 0;
            chat.addTopicOn = false;
        }
    };

    $scope.addTopic = function(chat) {
        /*      console.log('adding topic'); */
        if (angular.isDefined(chat.topic_description) && chat.topic_description.length > 5 && chat.topic_description.length <= 36) {

            if (angular.isDefined(chat.firebase_location)) {
                chat.firebase_location.update({
                    topic: chat.topic_description
                });
            } else if (angular.isDefined(chat.active_session_location)) {
                chat.active_session_location.update({
                    topic: chat.topic_description
                });
            }
            $scope.clear(chat);
            chat.isTextFocus = true;
        }
        return false;
    };

    $scope.addDirectoryTopic = function(chat) {
        if (angular.isDefined(chat.topic_description) && chat.topic_description.length > 5 && chat.topic_description.length <= 36) {
            chat.topic_description = String(chat.topic_description).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string
            chat.isTextFocus = true;
            if (angular.isDefined(chat.firebase_location)) {
                chat.firebase_location.update({
                    topic: chat.topic_description
                });
            }
            $scope.clearDirectory(chat);
        }
        return false;

    };

    $scope.updateTopic = function(chat) {
        var new_topic = String($('#topic_' + chat.session_key).text()).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string
        if (new_topic === 'null' || new_topic === '' || new_topic.length < 5) {
            return false;
        }
        if (angular.isDefined(chat.firebase_location)) {
            chat.firebase_location.update({
                topic: new_topic
            });
        } else if (angular.isDefined(chat.active_session_location)) {
            chat.active_session_location.update({
                topic: chat.new_topic
            });
        }
        $scope.getTopicHeight(chat);
        $scope.clear(chat);
        chat.isTextFocus = true;
        return false;
    };

    $scope.updateDirectoryTopic = function(chat) {
        var new_topic = String($('#topic_' + chat.session_key).text()); // sanitze the string
        if (new_topic === 'null' || new_topic === '' || new_topic.length < 5) {
            return false;
        }
        if (angular.isDefined(chat.firebase_location)) {
            chat.firebase_location.update({
                topic: new_topic
            });
        }
        $scope.clearDirectory(chat);
        chat.isTextFocus = true;
        return false;
    };

    $scope.inviteToggle = function(chat) {
        $scope.clear(chat);
        chat.invite = !chat.invite;
        if (angular.isUndefined(chat.invite_list)) {
            chat.invite_list = Array();
        }
        if (angular.isDefined(chat.close_invite)) {
            clearInterval(chat.close_invite);
        }
        if (chat.invite === true) {
            chat.showUserOptions = false;
            chat.invite_list = Array();
            angular.forEach($scope.online_users_list, function(val, key) {
                if ($scope.isGroupChatEligibile(chat, val)) {
                    chat.invite_list.push({
                        avatar: val.avatar,
                        name: val.name,
                        user_id: val.user_id
                    });
                }
            });
            $scope.watch_text = chat.chat_text;
            $scope.last_invite_text = chat.chat_text;
            chat.close_invite = setInterval(function() {
                $scope.clear(chat);
                chat.isTextFocus = true;
                clearInterval(chat.close_invite);
            }, 15000);
        }
    };


    $scope.isGroupChatEligibile = function(chat, user) {
        if (user.user_id === UserManager._user_profile.user_id) {
            return false;
        }
        if (user.user_id in chat.user_log) {
            return false;
        }
        return true;
    };

    $scope.closeInvite = function(chat) {
        $scope.clear(chat);
        chat.isTextFocus = true;
        chat.invited = '';
    };

    $scope.resetTyping = function(chat) {
        if (angular.isUndefined(chat) || chat === null) {
            return false;
        }
        if (angular.isDefined(chat.typing_presence_timeout)) {
            clearInterval(chat.typing_presence_timeout);
        }
        if (angular.isDefined(chat.active_typing_to_user_location)) {
            chat.active_typing_to_user_location.update({
                'is-typing': false
            });
        }
    };


    $scope.showAsTyping = function(chat) {
        if (angular.isUndefined(chat.chat_text) || chat.chat_text === null) {
            /*          console.log('returning false'); */
            return false;
        }
        if (angular.isDefined(chat.typing_presence_timeout)) {
            $timeout.cancel(chat.typing_presence_timeout);
        }
        chat.active_typing_to_user_location.update({
            'is-typing': true
        });
        chat.typing_presence_timeout = $timeout(function() {
            chat.active_typing_to_user_location.update({
                'is-typing': false
            });
            $timeout.cancel(chat.typing_presence_timeout);
            chat.typing_presence_timeout = null;
        }, 2000);
    };

    $scope.isGroupTyping = function(chat) {
        if (!chat || chat.chat_text === null || UtilityManager.firebase_connection === false) {
            return false;
        }
        /*
if ( angular.isUndefined(chat) || angular.isDefined(chat.group_chats) && chat.group_chats.length < 1 || chat.chat_text === null  )
        {
            return false;
        }
        var user_id = UserManager._user_profile.user_id;
        var avatar = UserManager._user_profile.avatar;
*/
        if (chat.typing_presence_timeout) {
            $timeout.cancel(chat.typing_presence_timeout);
        }
        /*      chat.firebase_location.child('is-typing').update({ UserManager._user_profile.user_id : avatar});     */
        chat.firebase_location.child('is-typing/' + UserManager._user_profile.user_id).set(UserManager._user_profile.avatar);
        chat.typing_presence_timeout = $timeout(function() {
            /*          chat.firebase_location.child('is-typing').update({ UserManager._user_profile.user_id : null}); */
            chat.firebase_location.child('is-typing/' + UserManager._user_profile.user_id).set(null);
            $timeout.cancel(chat.typing_presence_timeout);
        }, 750);
    };


    $scope.toggleChatBox = function(chat) {
        chat.isopen = !chat.isopen;
        if (chat.isopen === true) {
            chat.header_color = ChatManager._header_color;
            chat.unread = 0;
            chat.isTextFocus = true;
            $scope.getTimeReference(chat);
        } else {

            $scope.clear(chat);
        }
        $scope.getTopicHeight(chat);
        ChatManager.__updateIsOpen(chat);
    };

    $scope.pingHost = function() {
        if (!$scope.chat_ping) {
            return false;
        }
        $scope.isHost = false;
        clearInterval($scope.network_failure);
        clearInterval($scope.monitor_pop);
        clearInterval($scope.pop_request);
        clearInterval($scope.google_failure);
        clearInterval($scope.monitor_google);
        UtilityManager.isHostReachable($scope, "/components/com_callcenter/views/training/ng/img//script-badge.png?rand=");
        $scope.network_failure = setInterval(function() {
            if ($scope.isHost) {
                clearInterval($scope.network_failure);
                if (UtilityManager._network === false) {
                    $rootScope.$broadcast('network_online');
                }
                if (UtilityManager._portal_online === false) {
                    $rootScope.$broadcast('portal_online');
                }
                /*              console.log('ping was successful'); */

            } else {
                $rootScope.$broadcast('portal_offline');
                /*          console.log('2. POP was ' + $scope.isHost);      */
                $scope.monitor_pop = setInterval(function() {
                    $scope.isHost = false;
                    UtilityManager.isHostReachable($scope, "/components/com_callcenter/views/training/ng/img//script-badge.png?rand=");
                    $scope.pop_request = setInterval(function() {
                        if ($scope.isHost) {
                            /*                      console.log('1. Pop was ' + $scope.isHost); */
                            clearInterval($scope.monitor_pop);
                            $rootScope.$broadcast('portal_online');
                        }
                        clearInterval($scope.pop_request);
                    }, 1000);
                }, 4000);
                $scope.isHost = false;
                UtilityManager.isHostReachable($scope, "//www.google.com/favicon.ico?rand=");
                $scope.google_failure = setInterval(function() {
                    if ($scope.isHost) {
                        $rootScope.$broadcast('network_online');
                        /*                  console.log('1. Google was ' + $scope.isHost); */
                        clearInterval($scope.network_failure);
                    } else {
                        /*                  console.log('2. Google was ' + $scope.isHost); */
                        $rootScope.$broadcast('network_offline');
                        if (BrowserService.browser === "FireFox") {
                            $rootScope.$broadcast('browser_offline');
                        }
                        $scope.monitor_google = setInterval(function() {
                            $scope.isHost = false;
                            if (Offline) {
                                Offline.interceptRequests = false;
                            }
                            UtilityManager.isHostReachable($scope, "//www.google.com/favicon.ico?rand=");
                            $scope.google_request = setInterval(function() {
                                if ($scope.isHost) {
                                    if (Offline) {
                                        Offline.interceptRequests = true;
                                    }

                                    /*                              console.log('1. Google was ' + $scope.isHost); */
                                    clearInterval($scope.monitor_google);
                                    $rootScope.$broadcast('network_online');
                                    if (BrowserService.browser === "FireFox") {
                                        $rootScope.$broadcast('browser_online');
                                    }
                                }
                                /*                          console.log('google_request'); */
                                clearInterval($scope.google_request);
                            }, 1000);
                            /*                  console.log('google_monitor'); */
                        }, 4000);
                    }
                    clearInterval($scope.google_failure);
                }, 5000);
                clearInterval($scope.network_failure);
            }
        }, 4000);
    };

    $scope.setNextChatFocus = function(index) {
        if ($scope.activeChats.length === 1) {
            $log.debug('returning false');
            return false;
        }
        var next;
        $scope.activeChats[index].unread = 0;
        $scope.activeChats[index].isTextFocus = false;
        $scope.activeChats[index].isNewMessage = false;
        if ($scope.layout != 2) {
            $log.debug('setting next');
            if ($scope.priority_queue.length > 0) {
                next = $scope.priority_queue.pop();
                $log.debug('next from priority is ' + next);
            } else {
                next = index + 1;
            }
            if (next > $scope.activeChats.length - 1) {
                next = 0;
            }
            $log.debug('next is ' + next);
            $timeout(function() {
                $scope.directory_index = next;
                $scope.setDirectoryChat(next, true);
                $scope.referenceDirectoryItem();
            }, 250);
            return;
        } else if ($scope.layout === 2) {
            next = index - 1;
            $scope.activeChats[index].isTextFocus = false;
            if (next < 0) {
                next = $scope.activeChats.length - 1;
            }
            if (next >= $scope.max_count) {
                next = $scope.max_count - 1;
            }
            $scope.activeChats[next].isopen = true;
            $scope.activeChats[next].isTextFocus = true;
            return;
        }
    };


    $scope.clearHistory = function(chat) {
        chat.chats = Array();
        chat.group_chats = Array();
        chat.chat_log = Array();
        /*      chat.isMorePrev = false; */
        if (chat.isDirectoryChat) {
            $scope.clearDirectory(chat);
        } else {
            $scope.clear(chat);
        }

    };

    $scope.checkForCommand = function(chat) {
        if (chat.chat_text === $scope.command_key + 'c') {
            $scope.toggleChatBox(chat);
        } else if (chat.chat_text === $scope.command_key + 'q') {
            $scope.removeChatSession(chat);
        } else if (chat.chat_text === $scope.command_key + 'clear' || chat.chat_text === $scope.command_key + 'clr') {
            chat.chats = Array();
            chat.chat_log = Array();
            chat.isMorePrev = false;

        } else if (chat.chat_text === $scope.command_key + 's') {
            $scope.toggleChatSound(chat);
        } else if (chat.chat_text === $scope.command_key + 'at') {
            $scope.tagChatOn(chat);
        } else if (chat.chat_text === $scope.command_key + 'rt') {
            $scope.removeTag(chat);
        } else if (chat.chat_text === $scope.command_key + 'last') {
            $scope.moveChatToLast(chat.index_position);
            if ($scope.layout != 2) {
                $scope.setDirectoryChat($scope.activeChats.length - 1, true);
            }
        } else if (chat.chat_text === $scope.command_key + 'first') {
            $scope.moveChatToFirst(chat.index_position);
            if ($scope.layout != 2) {
                $scope.setDirectoryChat(0, true);
            }
        } else if (chat.chat_text === $scope.command_key + 'chat') {
            console.log(chat);
        } else if (chat.chat_text === $scope.command_key + 'chats') {
            console.log(chat.chats);
            console.log(chat.group_chats);
        } else if (chat.chat_text === $scope.command_key + 'self') {
            console.log(chat);
        } else if (chat.chat_text === $scope.command_key + 'user') {
            console.log(UserManager._user_profile);
        } else if (chat.chat_text === $scope.command_key + 'scope') {
            console.log($scope);
        } else if (chat.chat_text === $scope.command_key + 'browser') {
            chat.chat_text = BrowserService.platform.browser + " | " + BrowserService.platform.browserVersion + " | " + BrowserService.platform.os + ' - ' + BrowserService.platform.osVersion + ' |';
            $scope.addChatMessage(chat);
        } else if (chat.chat_text === $scope.command_key + 'os') {
            chat.chat_text = BrowserService.platform.os + ' | ' + BrowserService.platform.osVersion;
            $scope.addChatMessage(chat);
        } else if (chat.chat_text === $scope.command_key + 'platform') {
            console.log(BrowserService.platform);
        } else if (chat.chat_text === $scope.command_key + 'online') {
            console.log(UserManager._online_users_list);
        } else if (chat.chat_text === $scope.command_key + 'offline') {
            console.log(UserManager._offline_users_list);
        } else if (chat.chat_text === $scope.command_key + 'profiles') {
            console.log(UserManager._users_profiles_obj);
        } else if (chat.chat_text === $scope.command_key + 'ping') {
            $scope.runPingTest(chat);
        } else if (chat.chat_text === $scope.command_key + 'require-refresh') {
            console.log('require-refresh requested');
            if ($scope.admin_group.indexOf(UserManager._user_profile.position) != -1) {
                console.log('request allowed');
                UserManager.__requireRefresh();
            } else {
                console.log('refresh denied');
                console.log(UserManager._user_profile.position + ' not in admin');
            }
        }
        chat.chat_text = null;
        return;
    };
    $scope.inAdminGroup = function() {
        $log.debug(UserManager._user_profile.position);
        if ($scope.admin_group.indexOf(UserManager._user_profile.position) != -1) {
            return true;
        }
        return false;
    };


    $scope.addChatMessage = function(chat) {
        var chat_delay;
        /*      console.log(chat.chat_text); */
        if (angular.isUndefined(chat.chat_text) || chat.chat_text === null) {
            $scope.setNextChatFocus(chat.index_position);
        } else if (chat.chat_text.substring(0, 1) === $scope.command_key) {
            $scope.checkForCommand(chat);
            return;
        } else if (angular.isDefined(chat.chat_text) && chat.chat_text !== '' && chat.chat_text.length < 1000) {
            if (angular.isUndefined(chat.to_user_session) || chat.to_user_session === null) {
                chat_delay = 500;
                $scope.locationValue = '';
                ChatManager.__getLocationValue(chat.to_user_session_location, $scope);
                chat.to_user_session = $scope.locationValue;
            } else {
                chat_delay = 0;
            }

            /*          var chat_text = String(chat.chat_text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string */
            chat.scroll_bottom = false;
            var chat_text = chat.chat_text;
            chat.chat_text = null;
            chat.unread = 0;
            /*          var d = new Date(); */
            var n = Firebase.ServerValue.TIMESTAMP;
            clearInterval(chat.typing_presence_timeout);
            if (UserManager.encryption === true) {
                var session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
                chat_text = sjcl.encrypt(chat.session_key, chat_text);
            }
            if (chat.reference) {
                /*              console.log(chat.reference); */
            }
            $timeout(function() {
                var toFirekey = chat.to_user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: chat_text,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    reference: chat.reference,
                    referenceAuthor: chat.referenceAuthor,
                    referenceName: chat.referenceName,
                    referenceText: chat.referenceText,
                    time: n,
                    priority: chat.next_priority,
                    'session_key': session_key || chat.session_key
                }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                chat.to_user_last_chat = toFirekey.name();
                chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
                var selfFireKey = chat.user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: chat_text,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    reference: chat.reference,
                    referenceAuthor: chat.referenceAuthor,
                    referenceName: chat.referenceName,
                    referenceText: chat.referenceText,
                    time: n,
                    priority: chat.next_priority,
                    'session_key': session_key || chat.session_key
                }); // assign this task after sending to the to_user location !important
                chat.user_last_chat = selfFireKey.name();
                chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            }, chat_delay);
            chat.active_typing_to_user_location.update({
                'is-typing': false
            });
            ChatManager.__updateToUserActiveSession(chat);
            $scope.pingHost();
            $timeout(function() {
                chat.reference = null;
                chat.referenceAuthor = null;
                chat.referenceName = null;
                chat.referenceText = null;
                if (chat.scroll_top === true) {
                    chat.scroll_top = false;
                }
                chat.scroll_bottom = true;
            }, (chat_delay + 250));
            $scope.directory_index = chat.index_position;

        }
    };

    $scope.getPrivateKey = function(key) {
        $log.debug('getting private key');
        if (UserManager._user_profile.role === 'PlusOne Admin' && $scope.isPageComplete) {
            $log.debug('ALLOWED private key');
            return key;
            /*          return sjcl.decrypt(CoreConfig.encrypt_pass,key) */
        }
        $log.debug('DENIED private key');
        return null;
    };

    $scope.addGroupChatMessage = function(chat) {
        var session_key;
        if (angular.isUndefined(chat.chat_text) || chat.chat_text === null) {
            $scope.setNextChatFocus(chat.index_position);
            return;
        } else if (chat.chat_text.substring(0, 1) === $scope.command_key) {
            $scope.checkForCommand(chat);
        } else if (chat.chat_text !== '') {
            chat.scroll_bottom = false;
            /*          var chat_text = String(chat.chat_text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // sanitze the string */
            var chat_text = chat.chat_text;
            if (UserManager.encryption === true) {
                session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
                chat_text = sjcl.encrypt(chat.session_key, chat_text);
            }
            /*          var d = new Date(); */
            var n = Firebase.ServerValue.TIMESTAMP;
            var firekey = chat.group_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                avatarId: UserManager._user_profile.avatar,
                encryption: UserManager.encryption,
                reference: chat.reference,
                referenceAuthor: chat.referenceAuthor,
                referenceName: chat.referenceName,
                referenceText: chat.referenceText,
                to: chat.session_key,
                text: chat_text,
                time: n,
                priority: chat.next_priority,
                'session_key': session_key || chat.session_key
            });
            chat.user_last_chat = firekey.name();
            chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            chat.chat_text = null;
            chat.unread = 0;

            $timeout(function() {
                chat.reference = null;
                chat.referenceAuthor = null;
                chat.referenceName = null;
                chat.referenceText = null;
                if (chat.scroll_top === true) {
                    chat.scroll_top = false;
                }
                chat.scroll_bottom = true;
            }, 250);
            $timeout(function() {
                chat.scroll_bottom = false;
            }, 500);


            $scope.pingHost();
        }
    };

    $scope.to_trusted = function(html_code) {
        return $sce.trustAsHtml(html_code);
    };

    $scope.logValue = function(value) {
        $log.debug(value);
    };

    //ng-init="isMessagePastHour(message, directory_chat.time_reference); isLastMessagePastMinute(message, directory_chat.chats[$index-1].time); isAuthorSameAsLast(message, directory_chat.chat_log[$index-1]); isMessageFromUser(message);


    $scope.setChatMessage = function(message, chat, index) {
        if (chat.isGroupChat === false) {
            if (index - 1 > -1) {
                $scope.checkTimeLapse(message, chat.chats[index - 1].time, chat.chats, index - 1);
                $scope.isMessagePastHour(message, chat.time_reference);
                $scope.isLastMessagePastMinute(message, chat.chats[index - 1].time);
                $scope.isAuthorSameAsLast(message, chat.chat_log[index - 1]);
                $scope.isMessageFromUser(message);
            } else {
                $scope.isMessagePastHour(message, chat.time_reference);
                $scope.isLastMessagePastMinute(message, chat.time_reference);
                $scope.isAuthorSameAsLast(message, 0);
                $scope.isMessageFromUser(message);
            }
        } else {
            if (index - 1 > -1 && chat.group_chats[index - 1].time) {
                $scope.getAuthorFirstName(message);
                $scope.checkTimeLapse(message, chat.group_chats[index - 1].time, chat.group_chats, index - 1);
                $scope.getAuthorAvatar(message, chat.user_details);
                $scope.isMessagePastHour(message, chat.time_reference);
                $scope.isLastMessagePastMinute(message, chat.group_chats[index - 1].time);
                $scope.isAuthorSameAsLast(message, chat.group_chat_log[index - 1]);
                $scope.isMessageFromUser(message);
            } else {
                $scope.getAuthorFirstName(message);
                $scope.getAuthorAvatar(message, chat.user_details);
                $scope.isMessagePastHour(message, chat.time_reference);
                $scope.isLastMessagePastMinute(message, 0);
                $scope.isAuthorSameAsLast(message, 0);
                $scope.isMessageFromUser(message);
            }
        }
    };

    $scope.getAuthorAvatar = function(message, user_details) {
        if (message.author === ChatManager._internal_reference) {
            message.avatar = false;
            return;
        } else if (angular.isDefined(UserManager._users_profiles_obj['user_' + message.author])) {
            message.avatar = '/components/com_callcenter/images/avatars/' + UserManager._users_profiles_obj['user_' + message.author].avatar + '-90.jpg';
            return;
        } else if (angular.isDefined(user_details[message.author])) {
            message.avatar = '/components/com_callcenter/images/avatars/' + user_details[message.author].avatar + '-90.jpg';
            return;
        }
        if (angular.isDefined(message.avatarId)) {
            message.avatar = '/components/com_callcenter/images/avatars/' + message.avatarId + '-90.jpg';
            return;
        }
        /*      console.log(message); */

    };


    $scope.getAuthorFirstName = function(message) {
        if (message.authorName) {
            var name_split = message.authorName.match(/\S+/g); // splits the to_users first and last name
            message.author_f_name = name_split[0];
        }

    };

    $scope.isMessagePastHour = function(message, time_reference) {
        if (((3600000 + message.time) - time_reference) <= 0) {
            message.past_hour = true;
        } else {
            message.past_hour = false;
        }
    };

    $scope.checkTimeLapse = function(message, prev_chat_time, chats, prev_index) {
        if (prev_index > -1) {
            if (((120000 + prev_chat_time) - message.time) <= 0) {
                message.time_lapse = true;
                chats[prev_index].was_time_lapse = true;
            } else {
                message.time_lapse = false;
                chats[prev_index].was_time_lapse = false;
            }
        }
    };

    $scope.isLastMessagePastMinute = function(message, prev_chat_time) {
        if (((60000 + prev_chat_time) - message.time) <= 0) {
            message.minute_from_last = true;
        } else {
            message.minute_from_last = false;
        }
    };

    $scope.isAuthorSameAsLast = function(message, prev_author) {
        if (prev_author === message.author) {
            message.from_prev_author = true;
        } else {
            message.from_prev_author = false;
        }
    };

    $scope.isMessageFromUser = function(message) {
        if (message.author === UserManager._user_profile.user_id) {
            message.author_is_self = true;
        } else {
            message.author_is_self = false;
        }
    };

    $scope.getTimeReference = function(chat) {
        chat.time_reference = new Date().getTime();
    };

    $scope.removeChatSession = function(chat) {
        $scope.last_deactivated_chat = chat.to_user_id || chat.session_key;
        $timeout(function() {
            ChatManager.__deactivate_session_from_user_location(chat, $scope, true, true);
        }, 250);

    };

    $scope.nudgeUser = function(chat) {
        ChatManager.__updateToUserActiveSession(chat);
        $timeout(function() {
            ChatManager.__nudgeUser(chat);
            var n = Firebase.ServerValue.TIMESTAMP;
            var chat_text = $scope.to_trusted('<i class="fa fa-bolt"></i> ' + chat.to_user_f_name + ' has been nudged. <i class="fa fa-bolt"></i>');
            chat.chats.push({
                author: ChatManager._internal_reference,
                to: chat.to_user_id,
                text: chat_text,
                time: n,
                priority: -1,
                session_key: chat.session_key
            });
            chat.chat_log.push(ChatManager._internal_reference);
            if (chat.isDirectoryChat) {
                $scope.clearDirectory(chat);
            } else {
                $scope.clear(chat);
            }
        }, 1000);
    };

    $scope.addEmoji = function(emoji, chat) {
        chat.emotions = false;
        if (angular.isUndefinedOrNull(chat.chat_text)) {
            chat.chat_text = '';
        }
        chat.chat_text = chat.chat_text + emoji + ' ';
        chat.isTextFocus = true;
    };

    $scope.toggleEmoji = function(chat) {
        chat.emotions = !chat.emotions;
    };

    $scope.chat_sound = new Howl({
        urls: ['/components/com_callcenter/views/training/ng/js/chat.mp3'],
        volume: 0.05
    });


    $scope.mute = function() {
        NotificationService.__mute();

    };

    $scope.unmute = function() {
        NotificationService.__unmute();
    };

    $scope.toggleChatSound = function(chat) {
        chat.isSound = !chat.isSound;
        ChatManager.__updateIsSound(chat.to_user_id || chat.session_key, chat.isSound);
        $scope.clear(chat);
    };

    $scope.toggleVideo = function(chat) {
        $scope.video.heading = '';
        $scope.video.url = '';
        $scope.video.code = '';
        $scope.video.message = '';
        chat.addVideo = !chat.addVideo;
        $scope.clear(chat);

    };

    $scope.toggleAudio = function(chat) {
        $scope.audio.heading = '';
        $scope.audio.heading = '';
        $scope.audio.url = '';
        $scope.audio.cid = '';
        chat.addAudio = !chat.addAudio;

        $scope.clear(chat);
    };

    $scope.initAudio = function(message) {
        if (message.showAudio) {
            message.showAudio = !message.showAudio;
            return false;
        }
        if (message.cid) {
            AudioService.asyncMessage($scope, message, message.cid);
        } else if (message.audio && angular.isUndefined(message.init_audio)) {
            message.audio = $sce.trustAsResourceUrl(message.audio);
        }
        if (angular.isUndefined(message.init_audio)) {
            $timeout(function() {
                message.init_audio = true;
                message.showAudio = !message.showAudio;
            }, 1000);
        } else {
            message.showAudio = !message.showAudio;
        }
    };

    $scope.toggleImage = function(chat) {
        chat.addImage = !chat.addImage;
        if (!chat.addImage) {
            $scope.image.url = '';
            $scope.image.heading = '';
            $scope.image.message = '';
        }
        $scope.clear(chat);
    };

    $scope.getTrustedUrl = function(message) {
        if (message && message.audio) {
            message.audio = $sce.trustAsResourceUrl(message.audio);
        }
    };

    $scope.addVideoMessage = function(chat) {
        chat.scroll_bottom = false;
        var n = Firebase.ServerValue.TIMESTAMP;
        if (chat.isGroupChat) {
            var firekey = chat.group_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                avatarId: UserManager._user_profile.avatar,
                encryption: UserManager.encryption,
                to: chat.session_key,
                text: $scope.video.message,
                code: $scope.video.code,
                heading: $scope.video.heading,
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            });
            chat.user_last_chat = firekey.name();
            chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
        } else {
            var toFirekey = chat.to_user_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                to: chat.to_user_id,
                text: $scope.video.message,
                code: $scope.video.code,
                heading: $scope.video.heading,
                encryption: UserManager.encryption,
                offline: !(chat.to_user_online.$value),
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
            chat.to_user_last_chat = toFirekey.name();
            chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
            var selfFireKey = chat.user_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                to: chat.to_user_id,
                text: $scope.video.message,
                code: $scope.video.code,
                heading: $scope.video.heading,
                encryption: UserManager.encryption,
                offline: !(chat.to_user_online.$value),
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            }); // assign this task after sending to the to_user location !important
            chat.user_last_chat = selfFireKey.name();
            chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            ChatManager.__updateToUserActiveSession(chat);

        }
        $scope.video.heading = '';
        $scope.video.url = '';
        $scope.video.code = '';
        $scope.video.message = '';
        chat.unread = 0;

        $timeout(function() {
            if (chat.scroll_top === true) {
                chat.scroll_top = false;
            }
            chat.scroll_bottom = true;
        }, 250);
        $timeout(function() {
            chat.scroll_bottom = false;
        }, 500);
        chat.addVideo = false;
    };

    $scope.addAudioMessage = function(chat) {
        chat.scroll_bottom = false;
        var firekey, toFirekey, selfFireKey;
        var n = Firebase.ServerValue.TIMESTAMP;
        $log.debug($scope.audio.cid);
        $log.debug($scope.audio.url);
        if ($scope.audio.cid.length === 10) {
            if (chat.isGroupChat) {
                firekey = chat.group_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    avatarId: UserManager._user_profile.avatar,
                    encryption: UserManager.encryption,
                    to: chat.session_key,
                    text: $scope.audio.message,
                    cid: $scope.audio.cid,
                    heading: $scope.audio.heading,
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                });
                chat.user_last_chat = firekey.name();
                chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            } else {
                toFirekey = chat.to_user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: $scope.audio.message,
                    cid: $scope.audio.cid,
                    heading: $scope.audio.heading,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                chat.to_user_last_chat = toFirekey.name();
                chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
                selfFireKey = chat.user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: $scope.audio.message,
                    cid: $scope.audio.cid,
                    heading: $scope.audio.heading,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                }); // assign this task after sending to the to_user location !important
                chat.user_last_chat = selfFireKey.name();
                chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
                ChatManager.__updateToUserActiveSession(chat);

            }
        } else {
            if (chat.isGroupChat) {
                firekey = chat.group_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    avatarId: UserManager._user_profile.avatar,
                    encryption: UserManager.encryption,
                    to: chat.session_key,
                    text: $scope.audio.message,
                    audio: $scope.audio.url.toString(),
                    heading: $scope.audio.heading,
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                });
                chat.user_last_chat = firekey.name();
                chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            } else {
                toFirekey = chat.to_user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: $scope.audio.message,
                    audio: $scope.audio.url.toString(),
                    heading: $scope.audio.heading,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
                chat.to_user_last_chat = toFirekey.name();
                chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
                selfFireKey = chat.user_message_location.push({
                    author: UserManager._user_profile.user_id,
                    authorName: UserManager._user_profile.name,
                    to: chat.to_user_id,
                    text: $scope.audio.message,
                    audio: $scope.audio.url.toString(),
                    heading: $scope.audio.heading,
                    encryption: UserManager.encryption,
                    offline: !(chat.to_user_online.$value),
                    time: n,
                    priority: chat.next_priority,
                    'session_key': chat.session_key
                }); // assign this task after sending to the to_user location !important
                chat.user_last_chat = selfFireKey.name();
                chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
                ChatManager.__updateToUserActiveSession(chat);
            }
        }

        $scope.audio.cid = '';
        $scope.audio.url = '';
        $scope.audio.heading = '';
        $scope.audio.message = '';
        chat.unread = 0;

        $timeout(function() {
            if (chat.scroll_top === true) {
                chat.scroll_top = false;
            }
            chat.scroll_bottom = true;
        }, 250);
        $timeout(function() {
            chat.scroll_bottom = false;
        }, 500);
        chat.addAudio = false;
    };


    $scope.addImageMessage = function(chat) {
        chat.scroll_bottom = false;
        var n = Firebase.ServerValue.TIMESTAMP;
        if (chat.isGroupChat) {
            var firekey = chat.group_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                avatarId: UserManager._user_profile.avatar,
                encryption: UserManager.encryption,
                to: chat.session_key,
                text: $scope.image.message,
                image: $scope.image.url,
                heading: $scope.image.heading,
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            });
            chat.user_last_chat = firekey.name();
            chat.group_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);

        } else {
            var toFirekey = chat.to_user_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                to: chat.to_user_id,
                text: $scope.image.message,
                image: $scope.image.url,
                heading: $scope.image.heading,
                encryption: UserManager.encryption,
                offline: !(chat.to_user_online.$value),
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            }); // messages have to be written in both spots with an individual chat, storage is the reason for doing this
            chat.to_user_last_chat = toFirekey.name();
            chat.to_user_message_location.child(chat.to_user_last_chat).setPriority(chat.next_priority);
            var selfFireKey = chat.user_message_location.push({
                author: UserManager._user_profile.user_id,
                authorName: UserManager._user_profile.name,
                to: chat.to_user_id,
                text: $scope.image.message,
                image: $scope.image.url,
                heading: $scope.image.heading,
                encryption: UserManager.encryption,
                offline: !(chat.to_user_online.$value),
                time: n,
                priority: chat.next_priority,
                'session_key': chat.session_key
            }); // assign this task after sending to the to_user location !important
            chat.user_last_chat = selfFireKey.name();
            chat.user_message_location.child(chat.user_last_chat).setPriority(chat.next_priority);
            ChatManager.__updateToUserActiveSession(chat);
        }
        $scope.image.heading = '';
        $scope.image.url = '';
        $scope.image.message = '';
        chat.unread = 0;

        $timeout(function() {
            if (chat.scroll_top === true) {
                chat.scroll_top = false;
            }
            chat.scroll_bottom = true;
        }, 250);
        $timeout(function() {
            chat.scroll_bottom = false;
        }, 500);
        chat.addImage = false;
    };

    $scope.updateMessage = function(chat, priority, index) {
        var encrypted_text;
        if (angular.isUndefined(chat.to_user_last_chat) || angular.isUndefined(chat.user_last_chat)) return false;
        var updated_text = $('#ID_' + chat.to_user_id + '_' + priority).text();
        if (updated_text === 'null' || updated_text === '') return false;
        /*      updated_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string */
        chat.chats[index].text = updated_text;
        if (UserManager.encryption === true) {
            var session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
            encrypted_text = sjcl.encrypt(chat.session_key, updated_text);
            if (encrypted_text === 'null' || new_text === '') return false;
        }
        chat.user_message_location.child(chat.user_last_chat).update({
            text: encrypted_text || updated_text
        });
        chat.to_user_message_location.child(chat.to_user_last_chat).update({
            text: encrypted_text || updated_text
        });
        chat.isTextFocus = true;
        $timeout(function() {
            $scope.resetTyping(chat);
        }, 500);
        return false;
    };

    $scope.updateGroupMessage = function(chat, priority, index) {
        /*      console.log('start'); */
        var encrypted_text;
        if (angular.isUndefined(chat.user_last_chat)) return false;
        var updated_text = $('#ID_' + chat.session_key + '_' + priority + '_group').text();
        /*      console.log('updated_text: ' + updated_text); */
        if (updated_text === 'null' || updated_text === '') return false;
        /*      updated_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string */
        chat.group_chats[index].text = updated_text;
        if (UserManager.encryption === true) {
            var session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
            encrypted_text = sjcl.encrypt(chat.session_key, updated_text);
            if (encrypted_text === 'null' || new_text === '') return false;
        }
        chat.group_message_location.child(chat.user_last_chat).update({
            text: encrypted_text || updated_text
        });
        chat.isTextFocus = true;
        return false;
    };

    /*
        $scope.updateGroupMessage = function(chat, index)
        {
            chat.isTextFocus = true;
            var updated_text =  $( '#ID' + chat.session_key + '_' + index ).text();
            if (updated_text === 'null' || updated_text === '') return false;
            var new_text  = String(updated_text).replace(/&/g, '').replace(/</g, '').replace(/>/g, '').replace(/"/g, ''); // sanitze the string
            if ( UserManager.encryption === true)
            {
                var session_key = sjcl.encrypt(CoreConfig.encrypt_pass, chat.session_key);
                new_text = sjcl.encrypt(chat.session_key, new_text);
            }
            if (new_text === 'null' || new_text === '') return false;
            chat.group_message_location.child(chat.group_chats[index].key).update({text: new_text});
            chat.isTextFocus = true;
            return false;
        }
    */



    $scope.last_pushed = function(session) {
        /*      console.log(session + ' : ' + ChatManager._last_pushed_session); */
        /*      console.log(session === ChatManager._last_pushed_session) */
        return session === ChatManager._last_pushed_session;
    };

    $scope.last_deactivated = function(session) {
        /*      console.log(session + ' : ' + $scope.last_deactivated_chat); */
        /*      console.log(session === $scope.last_deactivated_chat); */
        return session === $scope.last_deactivated_chat;
    };

    $scope.isTrue = function(bool) {
        if (bool) {
            $log.debug('it was true');

            return true;

        }
        return false;
    };

    $scope.isReloading = function(chat) {
        if (chat === null) {
            return false;
        }
        if (angular.isDefined(chat) && chat.reload === true) {
            $timeout(function() {
                chat.reload = false;
            }, 1000);

            return true;

        }
        return false;
    };

    $scope.swapChatPositions = function(index_a, index_b) {
        if (index_b >= $scope.activeChats.length) {
            index_b = $scope.activeChats.length - 1;
        } else if (index_b < 0) {
            index_b = 0;
        }
        if (index_a === index_b) return false;
        $scope.temp_chat = $scope.activeChats[index_a];
        $scope.activeChats[index_a] = $scope.activeChats[index_b];
        $scope.activeChats[index_b] = $scope.temp_chat;
        $scope.temp_chat = null;
        $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
        $scope.resetChatUnread();
        $scope.setActiveChatsPriority();
        /*      ChatManager.__setLastPushed($scope.activeChats[index_b].to_user_id || $scope.activeChats[index_b].session_key); */

    };

    $scope.reloadChat = function(index) {
        $scope.temp_chat = $scope.activeChats[index];
        $scope.activeChats[index] = null;
        $scope.activeChats[index] = $scope.temp_chat;
        $scope.temp_chat = null;
    };

    $scope.moveChatToLast = function(index) {
        $scope.temp_chat = $scope.activeChats[index];
        $scope.activeChats.splice(index, 1);
        $scope.activeChats.push($scope.temp_chat);
        $scope.temp_chat = null;
        $scope.unactiveChats = $scope.activeChats.slice($scope.max_count).reverse();
        $scope.resetChatUnread();
        $scope.setActiveChatsPriority();
    };

    $scope.moveChatToFirst = function(index) {
        $scope.temp_chat = $scope.activeChats[index];
        $scope.activeChats.splice(index, 1);
        $scope.activeChats.unshift($scope.temp_chat);
        $scope.temp_chat = null;
        $scope.setActiveChatsPriority();
        /*      ChatManager.__setLastPushed($scope.activeChats[0].to_user_id || $scope.activeChats[0].session_key); */
    };

    $scope.loadMore = function(chat) {
        if (angular.isUndefined(chat.first_priority) || chat.first_priority === 0 || !(chat.isMorePrev)) {
            chat.isMorePrev = false;
            /*          console.log('there is no more'); */
            return false;
        }
        if (!(chat.reload) && chat.isMorePrev === true) {
            /*          console.log('is more'); */
            var previous = chat.next_priority;
            if (chat.isGroupChat) {
                ChatManager.__fetchMoreMessages($scope, chat.index_position, chat.group_message_location, chat.first_priority - 1);
            } else {
                ChatManager.__fetchMoreMessages($scope, chat.index_position, chat.user_message_location, chat.first_priority - 1);
            }
            $timeout(function() {
                chat.scroll_bottom = false;
                chat.scroll_top = true;
            });
        }
    };

    $scope.loadMoreGroupChat = function(chat) {
        if (chat.reload) {
            console.log("returning false");
            return false;
        }
        if (angular.isUndefined(chat.first_priority) || chat.first_priority === 0 || !(chat.isMorePrev)) {
            chat.isMorePrev = false;
            $log.debug('there is no more');
            return false;
        }
        DirectoryChatManager.__fetchMoreMessages($scope, chat);

    };

    $scope.addReferenceMessage = function(chat, message) {
        if (message.author === UserManager._user_profile.user_id) {
            chat.referenceName = chat.self_name;
        } else if (!chat.isGroupChat) {
            chat.referenceName = chat.to_user_f_name;
        } else {
            var name_split = message.authorName.match(/\S+/g); // splits the to_users first and last name
            chat.referenceName = name_split[0];
        }
        chat.reference = message.priority;
        chat.referenceText = message.text;
        chat.referenceAuthor = message.author;
        chat.isTextFocus = true;
    };

    $scope.referenceMessage = function(reference, reference_id, display_id) {
        /*      console.log('referencing ' + reference); */
        $scope.referenced_message = null;
        $scope.referenced_display = null;
        $scope.referenced_message_id = null;
        /*      console.log(reference ); */
        if (reference !== null) {
            /*          console.log('referencing message:' + reference); */
            $scope.referenced_message = reference;
            $scope.referenced_message_id = reference_id;
            /*          console.log($scope.referenced_message_id);           */
            $scope.referenced_display = display_id;
        } else {
            $log.debug('Reference was null');
        }

    };

    $scope.isReferencedMessage = function(message) {

        if ($scope.referenced_message !== null && $scope.referenced_message === message.priority && !$scope.referencing) {
            $scope.referencing = true;
            /*          console.log($scope.referenced_message + ' : ' + message.priority); */
            /*          console.log('Reference was true'); */
            $timeout(function() {
                $scope.referenced_message = null;
                $scope.referenced_message_id = null;
                $scope.referenced_display = null;
                $scope.referencing = false;
            }, 3000);
            return true;
        }
        return false;
    };


    $scope.isDirectoryItem = function(index) {
        if (index === null || index === undefined) {
            return false;
        }
        if (angular.isDefined($scope.referenced_index) && $scope.referenced_index === index) {
            /*          console.log('Reference was true'); */
            $scope.referenced_index = null;
            return true;
        }
        return false;
    };

    $scope.isLastUnread = function(index) {
        if (angular.isDefined($scope.last_unread_index) && $scope.last_unread_index === index) {
            /*          console.log('Reference was true' + $scope.last_unread_index + ' : ' + index ); */
            $scope.last_unread_index = null;
            return true;
        }
        return false;
    };

    $scope.setTextFocus = function(chat) {
        /*      chat.isTextFocus = true; */
        $scope.$evalAsync(function() {
            chat.unread = 0;
            chat.isNewMessage = false;
            chat.showProfile = false;
            chat.nudge = false;
            if (chat.header_color != ChatManager._header_color) {
                chat.header_color = ChatManager._header_color;
            }
            chat.isTextFocus = true;
        });
    };

    $scope.setDirectoryFocus = function(chat) {
        /*      chat.isTextFocus = true; */
        if (chat === null) {
            return false;
        }
        chat.unread = 0;
        chat.isNewMessage = false;
        chat.showProfile = false;
        chat.isTextFocus = true;
        chat.nudge = false;
    };

    $scope.clearMandatoryList = function() {
        $scope.showNavMenu = false;
        if ($scope.sm_group_chat) {
            $scope.sm_group_chat.scroll_bottom = $scope.sm_group_chat.scroll_top = $scope.sm_group_chat.isTextFocus = false;
        }
        if ($scope.sm_tech_chat) {
            $scope.sm_tech_chat.scroll_bottom = $scope.sm_tech_chat.scroll_top = $scope.sm_tech_chat.isTextFocus = false;
        }
        if ($scope.mc_group_chat) {
            $scope.mc_group_chat.isTextFocus = false;
        }
        if ($scope.admin_group_chat) {
            $scope.admin_group_chat.isTextFocus = false;
        }
    };

    $scope.setMandatoryFocus = function(chat) {
        if (chat) {
            if (chat.group_chat_log.length > $scope.directory_limit) {
                var i = 0;
                chat.group_chats = chat.group_chats.slice(-($scope.directory_limit));
                chat.group_chat_log = chat.group_chat_log.slice(-($scope.directory_limit));
                $log.debug(chat.group_chats);
                /*              chat.group_chats.length = 20; */
                chat.next_priority = chat.group_chats[chat.group_chats.length - 1].priority + 1;
                chat.first_priority = chat.group_chats[0].priority;
                while (!chat.first_priority) {
                    i++;
                    chat.first_priority = chat.group_chats[i].priority;
                }

            }
            $scope.clearMandatoryList();
            $scope.mandatory_index = chat.session_key;
            $log.debug(chat.index_position);
            if ($scope.layout === 1) {
                $scope.directory_index = null;
                if ($scope.directory_chat) {
                    $scope.directory_chat.isTextFocus = false;
                    $scope.directory_chat.nudge = false;
                }
                UserManager._user_settings_location.update({
                    'last-active-chat': chat.session_key,
                    'last-mandatory-chat': chat.session_key
                });
            } else if ($scope.layout != 1) {
                UserManager._user_settings_location.update({
                    'last-mandatory-chat': chat.session_key
                });
            }
            $timeout(function() {
                chat.isTextFocus = true;
                chat.scroll_bottom = true;
                chat.unread = 0;
            }, 250);

        }
    };
    $scope.tablist = ['blank', 'contacts', 'sm_group_chat', 'sm_tech_chat', 'mc_group_chat', 'directory_chat'];
    $scope.setNexTab = function() {
        var next_tmp = $scope.tmp + 1;
        if ($scope.activeChats.length > 0 && $scope.layout === 1) {
            if (next_tmp > 5) {
                next_tmp = 1;
            }
        } else {
            if (next_tmp > 4) {
                next_tmp = 1;
            }
        }
        $scope.updateTmp(next_tmp);
        $timeout(function() {
            if (next_tmp === 1) {
                $scope.setContactsFocus();
            } else if (next_tmp === 5) {
                $scope.setDirectoryChat($scope.stored_directory_index, true);
            } else {
                $scope.setMandatoryFocus($scope[$scope.tablist[next_tmp]]);
            }
        }, 250);
    };

    $scope.setContactsFocus = function() {
        $scope.clearMandatoryList();
        if ($scope.layout === 1) {
            $scope.directory_index = null;
            if ($scope.directory_chat) {
                $scope.directory_chat.isTextFocus = false;
            }
            UserManager._user_settings_location.update({
                'last-active-chat': 'contacts'
            });
        } else if ($scope.layout === 3) {
            UserManager._user_settings_location.update({
                'last-mandatory-chat': 'contacts'
            });
        }
        $scope.updateTmp(0);
        $timeout(function() {
            $scope.directory_search.isFocusText = true;
            $scope.mandatory_index = 'contacts';
        }, 250);

    };

    $scope.sendChatReceipt = function(chat) {
        $log.debug(chat.isGroupChat);
        if (angular.isUndefined(chat)) {
            return false;
        }
        var options = {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        };
        var chat_record = {};
        chat_record.participants = Array();
        chat_record.messages = Array();
        chat_record.timestamp = new Date().toLocaleTimeString("en-us", options);
        if (chat.isGroupChat) {
            if (chat.group_chats.length === 0) {
                return false;
            }
            chat_record.type = 'Group Chat';
            angular.forEach(chat.participant_log, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push(value);
            }, chat_record.participants);
            angular.forEach(chat.group_chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push({
                    author: value.authorName,
                    avatar: value.avatar,
                    time: Math.ceil(value.time / 1000),
                    text: value.text,
                    referenceName: value.referenceName || null,
                    referenceText: value.referenceText || null
                });
            }, chat_record.messages);
        } else {
            if (chat.chats.length === 0) {
                return false;
            }
            chat_record.type = "Personal";
            chat_record.participants.push(UserManager._user_profile.name);
            chat_record.participants.push(chat.to_user_name);
            angular.forEach(chat.chats, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
                this.push({
                    author: value.authorName,
                    time: Math.ceil(value.time / 1000),
                    text: value.text,
                    referenceName: value.referenceName || null,
                    referenceText: value.referenceText || null
                });
            }, chat_record.messages);
        }
        ChatRecordService.async(chat_record);
        var time = Firebase.ServerValue.TIMESTAMP;
        var chat_text = 'Chat Log sent to email.';
        if (chat.isGroupChat) {
            chat.group_chats.push({
                author: ChatManager._internal_reference,
                to: chat.session_key,
                text: chat_text,
                'time': time,
                priority: 'internal',
                session_key: chat.session_key
            });
            chat.group_chat_log.push(ChatManager._internal_reference);
        } else {
            chat.chats.push({
                author: ChatManager._internal_reference,
                to: chat.session_key,
                text: chat_text,
                'time': time,
                priority: 'internal',
                session_key: chat.session_key
            });
            chat.chat_log.push(ChatManager._internal_reference);
        }

        $scope.clear(chat);
    };

    /*     $scope.user_group = [UserManager.getUserField('user_id'), UserManager.getUserField('pc'), UserManager.getUserField('mc'), UserManager.getUserField('admin')]; */


    $scope.toggleFilterMenu = function() {
        $scope.showFilterMenu = !$scope.showFilterMenu;
    };

    $scope.toggleOffline = function() {
        $scope.showFilterMenu = false;
        $scope.directory_show_online_only = !$scope.directory_show_online_only;
    };


    $scope.directory_show_online_only = true;
    $scope.directory_show_offline_only = false;
    $scope.directory_show_position_only = false;
    $scope.directory_show_team_only = false;

    $scope.showInGeneralDirectory = function(user) // this function will determine the client has filtered the user out of the general directory user list
        {
            if (angular.isDefined(UserManager.user_group) && UserManager.user_group.indexOf('user_' + user.user_id) > -1) {
                /*          console.log(user.name + 'is in user_group' + angular.toJson(UserManager.user_group)); */
                return false;
            }
            if ($scope.smod && $scope.tod) {
                if (user.user_id === $scope.smod.user_id || user.user_id === $scope.tod.user_id) {
                    return false;
                }
            }
            if ($scope.directory_show_online_only) {
                if (user.state === "Offline") {
                    /*              console.log(user.name + 'is not online'); */
                    return false;
                }
            }
            if ($scope.directory_show_position_only) // filter by position
            {
                if (user.position != $scope.directory_show_position) {
                    /*              console.log(user.name + 'is not a' + $scope.directory_show_position_only); */
                    return false;
                }
            }
            /*
if ($scope.directory_show_team_only)
        {
            if ( TeamService.user_team.indexOf(user.user_id) === -1)
            {
                console.log(user.name + 'is not in ');
                return false;
            }
        }
*/
            return true;
        };

    $scope.selectDirectorySelection = function() {
        /*      console.log($scope.filtered_directory_array); */
        if ($scope.directory_search.text.length > 0 && angular.isDefined($scope.filtered_directory_array[0])) {
            /*          console.log($scope.filtered_directory_array[0].name + " : " + $scope.users_list[0].name); */
            $rootScope.$broadcast('requestChatSession', $scope.filtered_directory_array[0]);
            $scope.directory_search.text = '';
        }
    };


    $scope.$watch('directory_search.text', function(newVal, oldVal) {
        $scope.filtered_directory_array = $filter('filter')($scope.users_list, newVal);
        $scope.filtered_directory_array = $filter('orderBy')($scope.filtered_directory_array, 'name');
    });

    $scope.isCurrentDirectorySelection = function(user_id) {
        if ($scope.directory_search.text.length > 0 && angular.isDefined($scope.filtered_directory_array[0]) && $scope.filtered_directory_array[0].user_id === user_id) {
            return true;
        }
        return false;
    };

    $scope.updateDirectoryChat = function(index) {
        UserManager._user_settings_location.update({
            'last-active-chat': index
        });
    };

    $scope.setDirectoryChat = function(index, link) {

        if (index === undefined || index === null || $scope.activeChats.length === 0) {
            $log.debug('error/no chats');
            $scope.safeApply(function() {
                $timeout(function() {
                    document.getElementById($scope.mandatory_index + "_link").click();
                });
            });
            $log.debug('broken 1');
            return false;
        }
        $scope.stored_directory_index = $scope.directory_index = index;
        UserManager._user_settings_location.update({
            'last-active-chat': index
        });
        if ($scope.directory_index === $scope.last_unread_index) {
            $scope.last_unread_index = '';
        }
        if ($scope.directory_chat) {
            $scope.directory_chat.unread = 0;
            $scope.isNewMessage = false;
            $scope.isTextFocus = false;
        }
        $timeout(function() {
            $scope.directory_chat = null;
        });
        $scope.safeApply(function() {
            $timeout(function() {
                $scope.directory_chat = $scope.activeChats[$scope.directory_index];
            }, 250);
            $timeout(function() {
                if ($scope.directory_chat) {
                    $scope.directory_chat.scroll_bottom = false;
                    $scope.directory_chat.isTextFocus = true;
                    $scope.directory_chat.unread = 0;
                    $scope.directory_chat.isNewMessage = false;
                    $scope.chat_module_lock = true;
                    $scope.directory_chat.scroll_bottom = true;
                    if ($scope.layout === 1 && link) {
                        document.getElementById('directory_chat_link').click();
                    }
                }
            }, 300);
        });
        return false;
    };

    $scope.referenceDirectoryItem = function() {
        if (angular.isUndefinedOrNull($scope.directory_index)) {
            $scope.directory_index = $scope.stored_directory_index;
            $scope.setDirectoryChat($scope.directory_index, false);
        }
        if ($scope.directory_index !== null) {
            $timeout(function() {
                $scope.referenced_index = $scope.directory_index;
            });
            $timeout(function() {
                $scope.referenced_index = null;
            });
        }
    };


    $scope.toggleNavMenu = function() {
        $scope.showNavMenu = !$scope.showNavMenu;
    };

    $scope.getDirectoryChat = function(chat_name) {
        $log.debug('getDirectoryChat(' + chat_name + ')');
        var type = chat_name.split('_')[0];
        $log.debug('type: ' + type);
        var id = chat_name.split('_')[1];
        $log.debug('id: ' + id);
        $scope.showNavMenu = false;
        if ($scope.active_sessions[chat_name] === true) {
            $log.debug(chat_name + 'already exists');
            var i = $scope.activeChats.length;
            while (i--) {
                if ($scope.activeChats[i].session_key === chat_name && $scope.isPageLoaded) {
                    $scope.directory_index = i;
                    $scope.setDirectoryChat($scope.directory_index, true);
                    break;
                }
            }
            return;
        } else {
            if (type === 'mc') {
                ChatManager.__pushChatSession(DirectoryChatManager.__buildNewDirectoryChat($scope, (chat_name), UserManager._users_profiles_obj['user_' + id].name + ' - MC Team Chat', id, false, false, 3), false, $scope); //scope, chat_reference, chat_description, admin, watch_users
                /*
                                else if (UserManager._user_profile.position === 33)
                                {
                                    ChatManager.__pushChatSession(DirectoryChatManager.__buildNewDirectoryChat($scope, ('mc_' + UserManager._user_profile.user_id + '_group_chat'), 'MC - Group Chat', UserManager._user_profile.user_id, false, true, 3), false, $scope ); //chatSession, to_user,  scope
                                }
                */
            } else if (chat_name === 'admin_group_chat') {
                ChatManager.__pushChatSession(DirectoryChatManager.__buildNewDirectoryChat($scope, ('admin_group_chat'), 'Admin - Group Chat', UserManager._user_profile.user_id, false, true, 3), false, $scope);
            } else {
                return false;
            }

            if ($scope.directory_index === $scope.last_unread_index) {
                $scope.last_unread_index = '';
            }
            if ($scope.isPageComplete === true) {
                $timeout(function() {
                    $scope.setDirectoryChat($scope.activeChats.length - 1, true);
                }, 1000);
            }
        }
    };

    $scope.isScrollAtBottom = function(index) {
        if ($scope.isPageComplete === false) {
            return false;
        }
        var el = document.getElementById('message_display_' + index);
        if (el === null) {
            $log.debug('element was not found');
            return false;
        }
        if (angular.isDefined(el) && angular.isDefined(el.scrollTop)) {
            if (el.scrollTop + el.clientHeight + 10 >= el.scrollHeight) {
                return el;
            } else {
                return false;
            }
        }
        return false;

    };

    $scope.alertNewChat = function(index, internal, message) {
        if ($scope.is_external_window.$value && $scope.isExternalInstance === false) {
            $log.debug('Blocked SOund');
            return false;
        }
        /*      console.log(index); */
        var el = $scope.isScrollAtBottom(index);
        if (internal) {
            if ($scope.activeChats[index] && $scope.activeChats[index].isopen === true || $scope.directory_chat && $scope.directory_chat.index_position === index) {
                if ((!ChatManager._is_playing_sound) && angular.equals($scope.activeChats[index].isSound, true)) {
                    ChatManager._is_playing_sound = true;
                    $timeout(function() {
                        $scope.resetTyping($scope.activeChats[index]);
                        NotificationService.__playSound(NotificationService._chat_close); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                        ChatManager._is_playing_sound = false;
                    }, 50);
                }

            }

        } else {
            if ((!ChatManager._is_playing_sound) && angular.equals($scope.activeChats[index].isSound, true)) {
                ChatManager._is_playing_sound = true;
                $timeout(function() {
                    $scope.resetTyping($scope.activeChats[index]);
                    NotificationService.__playSound(NotificationService._chat); //  this condition should only sound when we are engaged in a chat , and prevents sounds on page reloads
                    ChatManager._is_playing_sound = false;
                }, 50);
            }
            if ($scope.external_monitor && $scope.isExternalWindow && message) {
                $scope.notifyUser(message, index, null);
                $scope.unread++;
                document.title = $scope.default_window_title + ' - ' + $scope.unread + ' New';

            } else if ($scope.page_status === 'visible' && $scope.layout != 2 && $scope.isChatModuleOpen === false) {
                $scope.alertToOpen = true;
                $scope.unread++;
                if (message) {
                    $scope.notifyUser(message, index, null);
                }

            } else if ($scope.page_status === 'hidden') {
                if (message) {
                    $scope.notifyUser(message, index, null);
                    $scope.unread++;
                    document.title = $scope.default_window_title + ' - ' + $scope.unread + ' New';
                }
            }
            if ($scope.layout != 2 && $scope.activeChats[index].isTextFocus === false) {
                $log.debug('notify 1');
                $scope.activeChats[index].unread = $scope.activeChats[index].unread + 1; // this condition will change the color of the chat header if the user has it closed.
                $scope.activeChats[index].isNewMessage = true;
                if ($scope.directory_index != index) {
                    /*                  console.log(' 1-A added to  priority queue') */
                    if ($scope.priority_queue.indexOf(index) === -1) {
                        $scope.priority_queue.unshift(index);
                    }
                    $scope.last_unread_index = index;
                }

            } else {
                if (index > ($scope.max_count - 1) || $scope.activeChats[index].isopen === false || $scope.activeChats[index].isopen === 'false') {
                    /*                  console.log('notify 2');     */
                    $scope.activeChats[index].unread = $scope.activeChats[index].unread + 1; // this condition will change the color of the chat header if the user has it closed.
                    $scope.activeChats[index].header_color = ChatManager._closed_header_alert_color;
                    $scope.activeChats[index].isNewMessage = true;
                    /*                  console.log(' 1-A added to  priority queue') */
                    if ($scope.priority_queue.indexOf(index) === -1) {
                        $scope.priority_queue.unshift(index);
                    }
                    $scope.last_unread_index = index;
                } else if ($scope.activeChats[index].isTextFocus === false) {
                    /*                  console.log('notify 3'); */
                    $scope.activeChats[index].unread = $scope.activeChats[index].unread + 1;
                    $scope.activeChats[index].isNewMessage = true;
                    $scope.activeChats[index].header_color = ChatManager._open_header_alert_color;
                    /*                  console.log(' 1-A added to  priority queue') */
                    if ($scope.priority_queue.indexOf(index) === -1) {
                        $scope.priority_queue.unshift(index);
                    }
                    $scope.last_unread_index = index;
                } else {
                    $scope.activeChats[index].unread = 0;
                    $scope.activeChats[index].isNewMessage = false;
                    $scope.activeChats[index].header_color = ChatManager._header_color;
                }

            }
        }
        if (el) {
            $timeout(function() {
                el.scrollTop = el.scrollHeight;
            }, 500);
        }
    };

    $scope.getNotifyPermission = function() {
        Notification.requestPermission();
    };

    $scope.user_notifications = Array();

    $scope.notifyUser = function(message, index, heading) {
        /*        console.log('notifying user'); */
        var title;
        if (heading) {
            if (BrowserService.platform.browser === "Firefox") {
                title = message.authorName + '   ' + heading;
            } else {
                title = heading + '\n' + message.authorName;
            }

        } else {
            title = message.authorName;
        }
        var notification = new Notification(title, {
            tag: message.session_key,
            icon: '/components/com_callcenter/images/avatars/' + UserManager._users_profiles_obj['user_' + message.author].avatar + '-90.jpg',
            body: message.text
        });
        if (typeof index === "number" && index > -1) {
            notification.onclick = function() {
                if ($scope.page_status === 'visible') {
                    self.focus();
                    $scope.setDirectoryChat(index, true);
                    $scope.updateTmp(5);
                    if (!$scope.isChatModuleOpen) {
                        $scope.openChatModule();
                    }
                }
            };
        } else if (typeof index === "string") {
            notification.onclick = function() {
                if ($scope.page_status === 'visible') {
                    self.focus();
                    $scope.setMandatoryFocus($scope[index]);
                    $scope.updateTmp($scope.tablist.indexOf(index));
                    if (!$scope.isChatModuleOpen) {
                        $scope.openChatModule();
                    }
                }
            };
        }
        $scope.user_notifications.push(notification);
    };

    $scope.sendNotification = function(title, tag, icon, body) {
        var notification = new Notification(title, {
            tag: tag,
            icon: icon,
            body: body
        });
    };

    $scope.$on('clear_notifications', function(event) {
        angular.forEach($scope.user_notifications, function(value, key) { // runs through the list of chat session to determine which chat session is tied to the value change
            value.close();
        });
    });


    $scope.setReference = function(message, start) {
        if (parseInt(message.reference) >= parseInt(start)) {
            message.isReference = true;
            if (message.referenceAuthor === UserManager._user_profile.user_id) {
                message.isReferencedSelf = true;
            } else {
                message.isReferencedSelf = false;
            }
        } else {
            message.isReference = false;
            message.isReferencedSelf = false;
        }
        return;
    };

    /*
        $scope.resizeUp = function()
        {
            $scope.resize_up = true;
            $scope.resizeUpInterval = setInterval(function()
            {
                console.log('resizing up');
                if ( $scope.resize_up === true && $scope.vertical_adjust < 100)
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
                    if ( $scope.resize_down === true && $scope.vertical_adjust > -100)
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

    $scope.resizeStop = function() {
        $scope.safeApply(function() {
            clearInterval($scope.resizeUpInterval);
            clearInterval($scope.resizeDownInterval);
            $scope.resize_down = false;
            $scope.resize_up = false;
            $scope.$apply();
        });

    };

    $scope.muteGlobalSound = function() {
        NotificationService.__mute();
    };

    $scope.allowGlobalSound = function() {
        NotificationService.__unmute();
    };

    $scope.openExternalWindow = function() {
        $scope.switchLayout(1);
        if (UserManager._user_settings_location) {
            UserManager._user_settings_location.update({
                'is-external-window': false
            });
        }
        $timeout(function() {
            $scope.externalWindowObject = window.open(CoreConfig.ext_link, "PlusOnePortalChat", "left=1600,resizable=false, scrollbars=no, status=no, location=no,top=0");
            if ($scope.externalWindowObject) {
                $scope.externalWindowObject.resizeTo(350, window.innerHeight + 50);
                $timeout(function() {
                    $scope.$evalAsync(function() {
                        $scope.isChildWindow = true;
                        $scope.isExternalWindow = true;
                        $scope.externalWindowObject.focus();
                        $scope.isPageLoaded = false;
                        $scope.isExternalWindow = true;
                        $scope.mute();


                        /*                  UtilityManager.setFirebaseOffline(); */

                        $scope.externalWindowlistener = $scope.$watch('externalWindowObject.closed', function(newValue) {
                            if (newValue) {
                                UserManager._user_settings_location.update({
                                    'is-external-window': false
                                });
                                localStorageService.remove('isExternalWindow');
                                $scope.isExternalWindow = false;
                            }
                        });
                        $scope.externalWindowObject.addEventListener('DOMContentLoaded', resizeChild, true);

                        function resizeChild() {
                            /*                              console.log('calling resize child'); */
                            $timeout(function() {
                                $scope.externalWindowObject.document.documentElement.style.overflow = 'hidden'; // firefox, chrome
                                $scope.externalWindowObject.document.body.scroll = "no"; // ie only

                                localStorageService.add('isExternalWindow', true);
                            }, 2000);
                        }
                    });
                }, 1000);
            }
            return false;
        }, 750);
    };

    $scope.toggleExternalWindow = function() {
        console.log('external focus');
        if ($scope.externalWindowObject) {
            $scope.externalWindowObject.focus();
        } else {
            $scope.mute();
            $scope.openExternalWindow();
            $timeout(function() {
                $scope.unmute();
            }, 4000);
        }
    };

    $scope.viewProfile = function(chat) {
        if (chat) {
            if (!chat.additional_profile) {
                $scope.getUserAdditionalProfile(chat);
                $timeout(function() {
                    chat.showUserOptions = false;
                    chat.showProfile = true;
                }, 1000);
            } else {
                chat.showUserOptions = false;
                chat.showProfile = true;
            }
        }
    };

    $scope.closeProfile = function(chat) {
        if (chat) {
            chat.showProfile = false;
            /*          chat.additional_profile = null; */
        }
    };


    $scope.getUserAdditionalProfile = function(chat) {
        /*      console.log('calling controller to get additonal profile'); */
        UserManager.__getUserAdditionalProfile(chat.to_user_id, chat);
    };
}]);
