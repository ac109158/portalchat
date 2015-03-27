'use strict';

/* Filters */

angular.module('portalchat.core').
filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
}).
filter('split', function() {
    return function(input, splitChar, splitIndex) {
        // do some bounds checking here to ensure it has that index
        return input.split(splitChar)[splitIndex];
    };
}).
filter("timeago", function() {
    //time: the time
    //local: compared to what time? default: now
    //raw: wheter you want in a format of "5 minutes ago", or "5 minutes"
    return function(time, local, raw) {
        if (!time) return "never";

        if (!local) {
            (local = Date.now());
        }

        if (angular.isDate(time)) {
            time = time.getTime();
        } else if (typeof time === "string") {
            time = new Date(time).getTime();
        }

        if (angular.isDate(local)) {
            local = local.getTime();
        } else if (typeof local === "string") {
            local = new Date(local).getTime();
        }

        if (typeof time !== 'number' || typeof local !== 'number') {
            return;
        }

        var
            offset = Math.abs((local - time) / 1000),
            span = [],
            MINUTE = 60,
            HOUR = 3600,
            DAY = 86400,
            WEEK = 604800,
            MONTH = 2629744,
            YEAR = 31556926,
            DECADE = 315569260;

        if (offset <= MINUTE) span = ['', raw ? 'now' : 'just now'];
        else if (offset < (MINUTE * 60)) span = [Math.round(Math.abs(offset / MINUTE)), 'min ago'];
        else if (offset < (HOUR * 24)) span = [Math.round(Math.abs(offset / HOUR)), 'hr ago'];
        else if (offset < (DAY * 7)) span = [Math.round(Math.abs(offset / DAY)), 'day ago'];
        else if (offset < (WEEK * 52)) span = [Math.round(Math.abs(offset / WEEK)), 'week ago'];
        else if (offset < (YEAR * 10)) span = [Math.round(Math.abs(offset / YEAR)), 'year ago'];
        else if (offset < (DECADE * 100)) span = [Math.round(Math.abs(offset / DECADE)), 'decade ago'];
        else span = ['', 'a long time'];

        /*         span[1] += (span[0] === 0 || span[0] > 1) ? 's' : ''; */
        span = span.join(' ');

        if (raw === true) {
            return span;
        }
        return (time <= local) ? span : 'in ' + span;
    };
}).
filter('UserFilter', ['utils', function(utils) {
    return function(input, query) {
        if (!query) return input;
        var result = {};
        angular.forEach(input, function(userData, user) {
            if (utils.compareStr(user, query) ||
                utils.compareStr(userData.name, query))
                result[user] = userData;
        });
        return result;
    };
}]).
filter('objectByKeyValFilter', function() {
    return function(input, filterKey, filterVal) {
        var filteredInput = {};
        angular.forEach(input, function(value, key) {
            if (value[filterKey] && value[filterKey] !== filterVal) {
                filteredInput[key] = value;
            }
        });
        return filteredInput;
    };
}).
filter('array', function() {
    return function(items) {
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        return filtered;
    };
}).
filter('unsafe', ['$sce', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
}]);
