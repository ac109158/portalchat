'use strict';
angular.module('portalchat.core').factory('CoreConfig', ['$rootScope', '$log',
    function($rootScope, $log) {
        var that = this;
        this.force_online = false; // set true to force users online for chat when they log into the site
        this.encrypt_pass = 'Anything but plain text';
        this.fb_url = 'https://portalchattest.firebaseio.com/';
        this.ext_link = 'index.php?option=com_content&view=article&id=100&Itemid=1111';

        this.user = {};

        this.default = {};
        this.default.font_size = 12;
        this.default.layout = 1;
        this.default.sound_level = 2;
        this.default.presence = "Online";


        this.online_reference = '/online/';
        this.chat_presence_reference = 'chat-presence/';

        this.state_reference = '/state/';
        this.public_settings_reference = 'Public-Settings' + '/';

        this.users_reference = "Users" + '/';
        this.users_state_reference = "Users-States" + '/';
        this.users_online_reference = "Users-Online" + '/';
        this.users_profile_reference = "Users-Profiles" + '/';
        this.users_presence_reference = "Users-Presence" + '/';
        this.users_geolocation_reference = 'User-Locations/';
        this.users_additional_profile_reference = "Users-Profiles-Additional" + '/';
        this.users_settings_reference = "Users-Settings" + '/';

        return this;
    }
]);
