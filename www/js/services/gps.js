angular.module('croplandsApp.services')
    .factory('GPS', ['$cordovaGeolocation', '$rootScope','Log','$timeout', function ($cordovaGeolocation, $rootScope, Log, $timeout) {
        var geoWatch, // global for turning watch on/off
            positions = [], // array of positions
            watchOptions = {
                frequency: 800, // how often to retrieve a position if possible
                timeout: 10000, // when to throw an exception
                enableHighAccuracy: true // use gps for higher resolution and when no network location is available
            }, currentAccuracy = -1, currentAccuracyExpiration;

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
                        currentAccuracy = position.coords.accuracy;
                        if (currentAccuracyExpiration) {
                            $timeout.cancel(currentAccuracyExpiration);
                        }

                        currentAccuracyExpiration = $timeout(function () {
                            currentAccuracy = -1;
                        }, 10000)
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

        /**
         * Check if  there is a gps fix and return accuracy. No fix is -1
         */
        function getFix() {
            return currentAccuracy;
        }

        // Interface
        return {
            isOn: isOn,
            turnOn: turnOn,
            turnOff: turnOff,
            clearPositions: clearPositions,
            getPositions: getPositions,
            getFix: getFix
        }
    }
    ]);