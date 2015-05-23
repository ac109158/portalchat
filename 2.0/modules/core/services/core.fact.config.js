'use strict';
angular.module('portalchat.core').factory('CoreConfig', ['$rootScope', '$log', '$window', function($rootScope, $log, $window) {
    var that = this;

    //Global Settings
    this.is_typing_presence = true;// this is used to turn chat typing presence on or off
    this.monitorContactsBehavior = true; // Set true to monitor each contact's online, presence, and state..
    this.force_online = false; // set true to force users online for chat when they log into the site
    this.encrypt_pass = 'Anything but plain text';
    this.fb_url = 'https://portalchattest.firebaseio.com/';
    this.ext_link = 'index.php?option=com_content&view=article&id=100&Itemid=1111';

    this.admin_level = 'PlusOne Admin';

    this.url = {};
    this.url.firebase_database = 'https://portalchattest.firebaseio.com/';
    this.url.external = 'index.php?option=com_content&view=article&id=100&Itemid=1111';
    this.url.default_avatar = '/2.0/assets/img/icon-user-default.png';
    this.url.avatar_path = '/components/com_callcenter/images/avatars/';

    //Defaults

    this.user = {};

    this.common = {};
    this.common.reference = {};
    this.common.reference.user_prefix = "user_";

    this.inital = {};
    this.inital.font_size = 12;
    this.inital.layout = 1;
    this.inital.sound_level = 2;
    this.inital.is_global_sound = true;
    this.inital.presence = "Online";

    this.min = {};
    this.min.font_size = 12;

    this.max = {};
    this.max.font_size = 16;
    this.max.sound_level = 50;
    this.max.panel_vertical_adjust = 100;

    this.online_reference = '/online/';
    this.chat_presence_reference = 'chat-presence/';

    this.state_reference = '/state/';
    this.public_settings_reference = 'Public-Settings' + '/';

    this.contacts = {};

    this.contacts.reference = "Users" + '/';
    this.contacts.state_reference = "Users-States" + '/';
    this.contacts.online_reference = "Users-Online" + '/';
    this.contacts.profile_reference = "Users-Profiles" + '/';
    this.contacts.presence_reference = "Users-Presence" + '/';
    this.contacts.geolocation_reference = 'User-Locations/';
    this.contacts.additional_profile_reference = "Users-Profiles-Additional" + '/';
    this.contacts.settings_reference = "Users-Settings" + '/';

    //chat
    this.chat = {};
    this.chat.internal_reference = "internal_chat";
    this.chat.root_reference = "Chat-System/";
    this.chat.url_root = that.url.firebase_database + this.chat.root_reference;

    this.chat.active_session_reference = "Sessions" + '/'; // folder reference to look monitoring users active chats
    this.chat.is_typing_reference = 'is-typing';
    this.chat.message_storage_reference = "Stored-Messages/"; // parent folder reference to store chat messages


    ////////////////////////////////////////////////////////////
    //Session


    this.session = {};
    this.session.parent_session_reference = 'Sessions' + '/';
    this.session.url_root = that.chat.url_root + that.session.parent_session_reference;
    this.session.signals_root = that.session.url_root + 'Chat-Signals' + '/';
    this.session.storage_root = that.session.url_root + 'Storage' + '/';
    this.session.root_reference = "Sessions" + '/'; // folder reference

    //online
    this.online_check_reference = "Online-Check-In" + "/";

    this.group_chat = {};
    this.group_chat.parent_category_reference = "Chat-System/Group-Chats" + '/'; // parent folder name variable
    this.group_chat.url_root = that.fb_url + that.group_chat.parent_category_reference; // combine with global url variable
    this.group_chat.active_session_reference = "Sessions" + '/'; // folder reference
    this.group_chat.message_location_reference = "user-messages" + '/'; // folder reference for chat messages during group chat sessions

    this.group_chat.active_users_reference = "active-users";

    //chat system references

    this.module = {};

    this.module.tab = {};
    this.module.tab.current = '';
    this.module.tab.list = [{
        title: 'Contacts',
        index_position: 0,
        type: 'misc',
        session_key: 'contacts',
        icon_class: 'fa fa-book fa-2x'
    }, {
        title: 'Group Chat',
        index_position: 1,
        type: 'directory',
        session_key: 'sm_group_chat',
        icon_class: 'fa fa-users fa-2x'
    }, {
        title: 'Tech Chat',
        index_position: 2,
        type: 'directory',
        session_key: 'sm_tech_chat',
        icon_class: 'fa fa-wrench fa-2x'
    },
    {
        title: 'Chat',
        index_position: 3,
        type: 'contact',
        session_key: '',
        icon_class: 'fa fa-comments fa-2x'
    }];
    this.module.tab.map = {
        'contacts': 0,
        'sm_group_chat': 1,
        'sm_tech_chat': 2,
        'contact': 3
    };
    this.module.setting = {};
    this.module.setting.presence_states = [{value:'Online', title:'Available'}, {value:'Away', title:'Away'}, {value:'Busy', title:'Busy'},{value:'At Lunch', title:'At Lunch'},{value:'On Break', title:'On Break'},{value:'Training', title:'Training'}]; // optional chat stattes
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

    this.module.setting.dom_window = {};
    this.module.setting.dom_window.hidden = "hidden";
    this.module.setting.dom_window.status = 'visible';
    this.module.setting.dom_window.default_window_title = angular.copy(window.title);
    this.module.setting.dom_window.innerHeight = angular.copy($window.innerHeight);
    this.module.setting.dom_window.unread = 0;
    if (String($window.location.href).split('?')[1] == that.url.external) {
        this.module.setting.dom_window.show_backdrop = true;
        this.module.setting.is_external_window_instance = true;
    } else {
        this.module.setting.dom_window.show_backdrop = false;
        this.module.setting.is_external_window_instance = false;
    }

    this.module.setting.queue = {};
    this.module.setting.queue.width = 110;

    this.module.setting.main_panel = {};
    this.module.setting.main_panel.default_width = 300;
    this.module.setting.main_panel.width = 300;
    this.module.setting.main_panel.height = parseInt($window.innerHeight, 10) || 0;

    this.module.setting.tracker = {};
    this.module.setting.tracker.height = 115;

    this.module.setting.contact_chat = {};
    this.module.setting.contact_chat.width = 237;
    this.module.setting.contact_chat.textarea_height = 35;
    this.module.setting.contact_chat.label_height = 25;
    this.module.setting.contact_chat.margin = 2;

    this.module.setting.directory_chat = {};
    this.module.setting.directory_chat.width = 237;
    this.module.setting.directory_chat.textarea_height = 35;
    this.module.setting.directory_chat.label_height = 25;





    return this;
}]);
