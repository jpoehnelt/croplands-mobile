angular.module('croplandsApp.services')
    .factory('GPS', ['$cordovaGeolocation', '$rootScope','Log', function ($cordovaGeolocation, $rootScope, Log) {
        var geoWatch, // global for turning watch on/off
            positions = [], // array of positions
            watchOptions = {
                frequency: 200, // how often to retrieve a position if possible
                timeout: 10000, // when to throw an exception
                enableHighAccuracy: true // use gps for higher resolution and when no network location is available
            };

        /**
         * Creates a watch on geoLocation after close any open watches first.
         */
        function turnOn() {
            turnOff();
            geoWatch = $cordovaGeolocation.watchPosition(watchOptions);

            geoWatch.then(
                null,
                function (err) {
                    Log.error(err);
                }, function (position) {
                    if(position && position.coords) {
                        positions.push(position);
                        $rootScope.$broadcast('GPS.on', position);
                    }
                }
            );
        }

        /**
         * Clears the watch on the geoLocation.
         */
        function turnOff() {
            if (isOn()) {
                $rootScope.$broadcast('GPS.off');
                geoWatch.clearWatch();
            }
        }

        /**
         * Checks if the watch exists.
         * @returns {boolean}
         */
        function isOn() {
            return geoWatch !== undefined;
        }

        /**
         * Clears array of capture positions from this session. These are not persisted nor uploaded.
         */
        function clearPositions() {
            positions = [];
        }

        /**
         * Returns the positions to the app for mapping purposes.
         * @returns {Array}
         */
        function getPositions() {
            return positions;
        }

        // Interface
        return {
            isOn: isOn,
            turnOn: turnOn,
            turnOff: turnOff,
            clearPositions: clearPositions,
            getPositions: getPositions
        }
    }
    ]);