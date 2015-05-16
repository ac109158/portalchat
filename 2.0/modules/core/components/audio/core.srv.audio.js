angular.module('portalchat.core').
service('AudioService', ['$rootScope', '$http', '$log', '$sce', 'ChatStorage', function($rootScope, $http, $log, $sce, ChatStorage) {
    var that = this;

    this.audio = {};

    this.audio.files = {};

    this.fetchAudioFile = function(type, session_key, contactID) {
        if (ChatStorage[type] && ChatStorage[type].chat.list[session_key] && contactID) {
            if (that.audio.files[contactID]) {
                $log.debug('Denied: Audio File already in history');
                ChatStorage[type].chat.list[session_key].audio.url = that.audio.files[contactID];
                return;
            }
            var url = "index.php?option=com_callcenter&controller=trainings&task=fetchAudioFile&format=raw&contactID=" + contactID;
            promise = $http.get(url).then(function(response) {
                if (response.data) {
                    if (response.data == 'false') {
                        $log.debug('Failure');
                        return false;
                    }
                    ChatStorage[type].chat.list[session_key].audio.url = $sce.trustAsResourceUrl(angular.fromJson(response.data));
                    that.audio.files[contactID] = $sce.trustAsResourceUrl(angular.fromJson(response.data));
                    return true;
                } else {
                    $log.debug("no Audio File");
                }
            });
        }
    };


    this.asyncMessage = function(message, contactID) {
        $log.debug('AudioService.asyncMessage()  contactID: ' + contactID);
        if (angular.isObject(message) && contactID) {
            if (that.audio.files[contactID]) {
                $log.debug('Audio File already in history');
                $rootScope.$evalAsync(function() {
                    message.audio = that.audio.files[contactID];
                });
                return;
            }
            var url = "index.php?option=com_callcenter&controller=trainings&task=fetchAudioFile&format=raw&contactID=" + contactID;
            var promise = $http.get(url).then(function(response) {
                if (response.data) {
                    if (response.data == 'false') {
                        $log.debug('Failure');
                        return false;
                    }
                    $rootScope.$evalAsync(function() {
                        message.audio = $sce.trustAsResourceUrl(angular.fromJson(response.data));
                    });
                    that.audio.files[contactID] = $sce.trustAsResourceUrl(angular.fromJson(response.data));
                    return true;
                } else {
                    $log.debug("no Audio File");
                }
            });
            return promise;
        } else if (!angular.isDefined(contactID)) {
            $log.debug("Denied: Parameter is undefined");
            return false;
        }
    };
    return this;
}]);
