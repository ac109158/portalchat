angular.module('portalchat.core').service('NotificationManager',
function() {
    var that = this;
    this.setting = {};
    this.state = {};
    this.state.is_playing_sound = false;
    this.volume_level = 0.05;
    this.isGlobalSound = false;
    this.sound = {};

    this.sound.nudge = new Howl({
        urls: ['./assets/sounds/nudge.mp3'],
        volume: 0.5
    });

    this.defineSounds = function() {
        that.sound.chat = new Howl({
            urls: ['./assets/sounds/chat.mp3'],
            volume: that.volume_level
        });
        that.sound.bash_error = new Howl({
            urls: ['./assets/sounds/bash_error.mp3'],
            volume: that.volume_level
        });
        that.sound.chat_convert = new Howl({
            urls: ['./assets/sounds/chat_convert.mp3'],
            volume: that.volume_level
        });
        that.sound.new_chat = new Howl({
            urls: ['./assets/sounds/new_chat.mp3'],
            volume: that.volume_level
        });
        that.sound.update_alert = new Howl({
            urls: ['./assets/sounds/update_alert.mp3'],
            volume: that.volume_level
        });
        that.sound.money = new Howl({
            urls: ['./assets/sounds/money.mp3'],
            volume: that.volume_level
        });
        that.sound.close = new Howl({
            urls: ['./assets/sounds/chat_close.mp3'],
            volume: that.volume_level
        });
    };

    this.playSound = function(name) {
        if (that.isGlobalSound && !that.state.is_playing_sound && that.sound[name]) {
            that.state.is_playing_sound = true;
            that.sound[name].play();
            $timneout(function(){
                that.state.is_playing_sound = false;
            },1000);
        }
    };

    this.nudge = function(sound) {
        that.sound.nudge.play();
    };

    this.mute = function(duration) {
        if(duration){
            that.isGlobalSound = false;
            $timeout(function(){
                that.isGlobalSound = true;
            }, duration);
        } else{
            that.isGlobalSound = false;
        }

    };
    this.unmute = function() {
        that.isGlobalSound = true;
    };
    this.toggleGlobalSound = function() {
        that.isGlobalSound = !that.isGlobalSound;
    };
    this.updateSoundLevel = function(level) {
        if (parseInt(level) > -1 && parseInt(level) <= 50) {
            that.volume_level = parseFloat(level / 100);
            that.defineSounds();
        }
    };

    return this;
});
