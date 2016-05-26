angular.module('croplandsApp.services')
    .factory('Settings', [ function () {
        var DEFAULTS = {
            BACKGROUND_GPS: false, // no impact - not allowed with plugin
            BACKGROUND_COMPASS: false, // no impact - not allowed with plugin
            NETWORK_DATA: true
        };

        function get(setting) {
            if (window.localStorage.getItem(setting) !== null) {
                return window.localStorage.getItem(setting);
            }

            if (DEFAULTS[setting] !== undefined) {
                return DEFAULTS[setting];
            }
        }

        function getAll() {
            var results = {};

            _.each(DEFAULTS, function (value, key) {
                results[key] = get(key);
            });
            return results;
        }

        function set(setting, value) {
            window.localStorage.setItem(setting, value);
        }

        function setAll(settings){
            _.each(settings, function (value, key) {
                set(key, value);
            });

            return getAll();
        }

        return {
            get: get,
            set: set,
            getAll: getAll,
            setAll: setAll
        }

    }]);