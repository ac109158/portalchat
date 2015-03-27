angular.module('portalchat.core').
service('NotificationService', function() {
    var that = this;
    this._volume_level = 0.05;
    this.isGlobalSound = false;

    this._nudge = new Howl({
        urls: ['/modules/mod_chat/app/sounds/nudge.mp3'],
        volume: 0.5
    });

    this.__defineSounds = function() {

        that._chat = new Howl({
            urls: ['/modules/mod_chat/app/sounds/chat.mp3'],
            volume: that._volume_level
        });
        that._bash_error = new Howl({
            urls: ['/modules/mod_chat/app/sounds/bash_error.mp3'],
            volume: that._volume_level
        });
        that._chat_convert = new Howl({
            urls: ['/modules/mod_chat/app/sounds/chat_convert.mp3'],
            volume: that._volume_level
        });
        that._new_chat = new Howl({
            urls: ['/modules/mod_chat/app/sounds/new_chat.mp3'],
            volume: that._volume_level
        });
        that._update_alert = new Howl({
            urls: ['/modules/mod_chat/app/sounds/update_alert.mp3'],
            volume: that._volume_level
        });
        that._money = new Howl({
            urls: ['/modules/mod_chat/app/sounds/money.mp3'],
            volume: that._volume_level
        });
        that._chat_close = new Howl({
            urls: ['/modules/mod_chat/app/sounds/chat_close.mp3'],
            volume: that._volume_level
        });
    };
    this.__playSound = function(sound) {
        if (this.isGlobalSound) {
            sound.play();
        }
    };

    this.__nudge = function(sound) {
        sound.play();
    };

    this.__mute = function() {
        that.isGlobalSound = false;
    };
    this.__unmute = function() {
        that.isGlobalSound = true;
    };
    this.__toggleGlobalSound = function() {
        that.isGlobalSound = !this.isGlobalSound;
    };
    this.__updateSoundLevel = function(level) {
        if (level > -1 && level <= 50) {
            that._volume_level = parseFloat(level / 100);
            that.__defineSounds();
        }
    };
    return this;
});
