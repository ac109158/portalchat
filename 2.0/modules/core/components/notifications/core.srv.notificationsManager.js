angular.module('portalchat.core').service('NotificationManager',['$timeout', 'CoreConfig', function($timeout, CoreConfig) {
    var that = this;
    this.state = {};
    this.state.is_playing_sound = false;
    this.setting = {};
    this.setting.volume_level = 0.05;
    this.setting.is_global_sound = CoreConfig.inital.is_global_sound;
    this.sound = {};

    this.sound.nudge = new Howl({
        urls: ['./assets/sounds/nudge.mp3'],
        volume: 0.5
    });

    this.load = function(){
        that.defineSounds();
    };

    this.defineSounds = function() {
        that.sound.chat = new Howl({
            urls: ['./assets/sounds/chat.mp3'],
            volume: that.setting.volume_level
        });
        that.sound.bash_error = new Howl({
            urls: ['./assets/sounds/bash_error.mp3'],
            volume: that.setting.volume_level
        });
        that.sound.chat_convert = new Howl({
            urls: ['./assets/sounds/chat_convert.mp3'],
            volume: that.setting.volume_level
        });
        that.sound.new_chat = new Howl({
            urls: ['./assets/sounds/new_chat.mp3'],
            volume: that.setting.volume_level
        });
        that.sound.update_alert = new Howl({
            urls: ['./assets/sounds/update_alert.mp3'],
            volume: that.setting.volume_level
        });
        that.sound.money = new Howl({
            urls: ['./assets/sounds/money.mp3'],
            volume: that.setting.volume_level
        });
        that.sound.close = new Howl({
            urls: ['./assets/sounds/chat_close.mp3'],
            volume: that.setting.volume_level
        });
    };

    this.playSound = function(name) {
        console.log(that.setting.is_global_sound, ':',!that.state.is_playing_sound, ':',that.sound[name]);
        if (that.setting.is_global_sound && !that.state.is_playing_sound && that.sound[name]) {

            that.state.is_playing_sound = true;
            that.sound[name].play();
            $timeout(function(){
                that.state.is_playing_sound = false;
            },500);
        }
    };

    this.nudge = function(sound) {
        that.sound.nudge.play();
    };

    this.mute = function(duration) {
        if(duration){
            that.setting.is_global_sound = false;
            $timeout(function(){
                that.setting.is_global_sound = true;
            }, duration);
        } else{
            that.setting.is_global_sound = false;
        }

    };
    this.unmute = function() {
        that.setting.is_global_sound = true;
    };
    this.toggleGlobalSound = function() {
        that.setting.is_global_sound = !that.setting.is_global_sound;
    };
    this.updateSoundLevel = function(level) {
        if (parseInt(level) > -1 && parseInt(level) <= 50) {
            that.setting.volume_level = parseFloat(level / 100);
            that.defineSounds();
        }
    };

    return this;
}]);
