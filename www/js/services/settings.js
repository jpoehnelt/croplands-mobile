angular.module('croplandsApp.services')
    .factory('Settings', [ function () {
        var DEFAULTS = {
            BACKGROUND_GPS: true,
            BACKGROUND_COMPASS: false
        };

        function get(setting) {
            if (window.localStorage.getItem(setting) !== null) {
                return window.localStorage.getItem(setting);
            }

            if (DEFAULTS[setting] !== undefined) {
                return DEFAULTS[setting];
            }
        }

        function set(setting, value) {
            window.localStorage.setItem(setting, value);
        }

        return {
            get: get,
            set: set
        }

    }]);