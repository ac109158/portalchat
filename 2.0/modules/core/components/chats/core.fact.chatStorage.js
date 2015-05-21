angular.module('portalchat.core').
service('ChatStorage', ['$log', '$timeout','CoreConfig',function($log, $timeout, CoreConfig) {
    var that = this;

    this.directory = {};

    this.directory.session = {};
    this.directory.session.list = {};
    this.directory.session.map = {};

    this.directory.chat = {};
    this.directory.chat.list = {};
    this.directory.chat.count = 0
    this.directory.chat.order_map = {};



    this.contact = {};
    this.contact.session = {};
    this.contact.session.map = {};

    this.contact.chat = {};
    this.contact.chat.list = {};
    this.contact.chat.count = 0;
    this.contact.chat.map = {};

    return this;
}]);

