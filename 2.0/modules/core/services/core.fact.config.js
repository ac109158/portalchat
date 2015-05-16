'use strict';
angular.module('portalchat.core').factory('CoreConfig', ['$rootScope', '$log', function($rootScope, $log) {
    var that = this;

    //Global Settings
    // this is used to turn chat typing presence on or off
    this.monitorContactsBehavior = true; // Set true to monitor each contact's online, presence, and state..
    this.force_online = false; // set true to force users online for chat when they log into the site
    this.encrypt_pass = 'Anything but plain text';
    this.fb_url = 'https://portalchattest.firebaseio.com/';
    this.ext_link = 'index.php?option=com_content&view=article&id=100&Itemid=1111';

    this.admin_level = 'PlusOne Admin';

    //Defaults

    this.user = {};

    this.default = {};
    this.default.font_size = 12;
    this.default.layout = 1;
    this.default.sound_level = 2;
    this.default.presence = "Online";
    this.default.user_tag = "'user_";


    this.online_reference = '/online/';
    this.chat_presence_reference = 'chat-presence/';

    this.state_reference = '/state/';
    this.public_settings_reference = 'Public-Settings' + '/';

    this.users = {};

    this.users.reference = "Users" + '/';
    this.users.state_reference = "Users-States" + '/';
    this.users.online_reference = "Users-Online" + '/';
    this.users.profile_reference = "Users-Profiles" + '/';
    this.users.presence_reference = "Users-Presence" + '/';
    this.users.geolocation_reference = 'User-Locations/';
    this.users.additional_profile_reference = "Users-Profiles-Additional" + '/';
    this.users.settings_reference = "Users-Settings" + '/';

    //chat system references

    this.module = {};

    this.module.presence = {};
    this.module.presence.states = ['Online', 'Offline', 'Busy', 'Invisible'];

    this.module.tab = {};
    this.module.tab.current = '';
    this.module.tab.list = [
        {
            title:'Contacts',
            index_position: 0,
            type: 'misc',
            session_key : 'contacts',
        },
        {
            title:'Group Chat',
            index_position: 1,
            type: 'directory',
            session_key : 'sm_group_chat'
        },
        {
            title:'Tech Chat',
            index_position: 2,
            type: 'directory',
            session_key : 'sm_tech_chat'
        },
        {
            title:' MC Group Chat',
            index_position: 3,
            type: 'directory',
            session_key : 'mc_group_chat'
        },
        {
            title:'Chat',
            index_position: 4,
            type: 'contact',
            session_key : ''
        }
    ];
    this.module.tab.map = {
        'contacts' : 0,
        'sm_group_chat': 1,
        'sm_tech_chat': 2,
        'mc_group_chat': 3,
        'contact': 4
    };
    this.module.setting = {};
    this.module.setting.header_color = "#00335B"; // default color of the chat header
    this.module.setting.closed_header_alert_color = '#ce6000'; // alternate color of the chat header
    this.module.setting.open_header_alert_color = '#4787ED'; // header changes to this color when chatbox is closed an an message is received
    this.module.setting.alert_color = '#4787ED'; // header changes to this color when chatbox is closed an an message is received
    this.module.setting.self_reference = "Me"; // used to label messages that came from user/self

    this.module.setting.message_load_size = 5; // sets the amount of messages the chat will initally load
    this.module.setting.message_fetch_size = 15; // sets the amount of messages that will fetch from history
    this.module.setting.storage_limit = false; // true/false deletes any messages in the firebase storage location if the amount exceeds the
    this.module.setting.single_query_size = 500;
    this.module.setting.group_query_size = 5000;
    this.module.setting.max_message_count = 50;
    // this.module.setting.store_time = 172800000; // 48 hours how long to store  messages in each users query
    this.module.setting.store_time = 1209600000; // 2 weeks how long to store  messages in each users query
    this.module.setting.command_key = ';';


    //chat Method
    this.chat = {};
    this.chat.internal_reference = "internal_chat";
    this.chat.root_reference = "Chat-System/Users" + '/';
    this.chat.url_root = that.fb_url + this.chat.root_reference;

    this.chat.presence_states = ['Online', 'Offline', 'Busy', 'Invisible']; // optional chat stattes
    this.chat.active_session_reference = "Active-Sessions" + '/'; // folder reference to look monitoring users active chats
    this.chat.is_typing_reference = 'is-typing';
    this.chat.message_storage_reference = "Stored-Messages/Users" + '/'; // parent folder reference to store chat messages


    ////////////////////////////////////////////////////////////
    //Session Method


    this.session = {};
    this.session.parent_session_reference = 'Chats' + '/';
    this.session.url_root = that.fb_url + that.session.parent_session_reference;
    this.session.root_reference = "Active-Sessions" + '/'; // folder reference

    //online
    this.online_check_reference = "Online-Check-In" + "/";






    this.group_chat = {};
    this.group_chat.parent_category_reference = "Chat-System/Group-Chats" + '/'; // parent folder name variable
    this.group_chat.url_root = that.fb_url + that.group_chat.parent_category_reference; // combine with global url variable
    this.group_chat.active_session_reference = "Active-Sessions" + '/'; // folder reference
    this.group_chat.message_location_reference = "user-messages" + '/'; // folder reference for chat messages during group chat sessions

    this.group_chat.active_users_reference = "active-users";


    return this;
}]);
