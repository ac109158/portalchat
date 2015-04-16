'use strict'; /* Factories */
angular.module('portalchat.core').
service('UiManager', ['$rootScope', '$firebase', '$log', '$http', '$window', '$timeout', 'CoreConfig', function($rootScope, $firebase, $log, $http, $window, $timeout, CoreConfig) {
    var that = this;
    this.ui = {};

    this.ui.module = {};
    this.ui.module.setting = {};
    this.ui.module.setting.alert_to_open = false;

    this.ui.module.marker = {};
    this.ui.module.marker.is_locked = true;
    this.ui.module.marker.is_child_window = false;
    this.ui.module.marker.is_setting_layout = true;

    this.ui.queue = {};
    this.ui.queue.setting = {};
    this.ui.queue.setting.width = 110;

    this.ui.panel = {};
    this.ui.panel.setting = {};
    this.ui.panel.setting.panel_width = 250;
    this.ui.panel.setting.panel_height  = parseInt($window.height, 10) || 0;
    this.ui.panel.setting.tracker_panel_size = 115;
    this.ui.panel.setting.resize_vertical = true;
    this.ui.panel.setting.resize_adjustment_3 = 0;
    this.ui.panel.marker = {};
    this.ui.panel.marker.show_nav_menu = false;
    this.ui.panel.marker.show_filter_menu = false;

    this.ui.chat = {};
    this.ui.chat.contact = {};
    this.ui.chat.contact = {};
    this.ui.chat.contact.setting = {};
    this.ui.chat.contact.setting.panel_width = 250;
    this.ui.chat.contact.setting.textarea_height = 35;
    this.ui.chat.contact.setting.label_height = 25;
    this.ui.chat.contact.setting.margin = 2;

    this.ui.chat.directory = {};
    this.ui.chat.directory.setting = {};
    this.ui.chat.directory.setting.panel_width = $window.innerWidth;
    this.ui.chat.directory.setting.textarea_height = 35;
    this.ui.chat.directory.setting.label_height = 25;


    return this.ui;
}]);
