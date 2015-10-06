angular.module('croplandsApp.services')
    .factory('GPS', ['$cordovaGeolocation', '$rootScope','Log','$timeout', function ($cordovaGeolocation, $rootScope, Log, $timeout) {
        var geoWatch, // global for turning watch on/off
            positions = [], // array of positions
            watchOptions = {
                timeout: 10000, // when to throw an exception
                enableHighAccuracy: true // use gps for higher resolution and when no network location is available
            }, currentAccuracy = -1,
            currentAccuracyExpiration, // timeout
            MAX_POSITIONS_LENGTH = 150,  // max positions to store
            POSITION_FREQUENCY = 2000, // frequency for collecting positions, milliseconds
            CURRENT_ACCURACY_TIMEOUT = 10000; // number of milliseconds that fix is good for

        function rotatePositionsArray() {
            positions = positions.slice(positions.length - MAX_POSITIONS_LENGTH, positions.length);
            Log.debug('[GPS] Slicing positions array to length: ' + positions.length.toString());
        }

        /**
         * Creates a watch on geoLocation after close any open watches first.
         */
        function turnOn() {
            turnOff();
            geoWatch = $cordovaGeolocation.watchPosition(watchOptions);
            Log.debug('[GPS] Watch started.');
            geoWatch.then(
                null,
                function (err) {
                    Log.error(err);
                },
                _.throttle(function (position) {
                    if(position && position.coords) {
                        Log.debug('[GPS] Received Position: ' + position.coords.latitude.toString() + ", " + position.coords.longitude.toString() + ", Accuracy: " + Math.round(position.coords.accuracy));
                        $rootScope.$broadcast('GPS.on', position);
                        positions.push(position);
                        
                        currentAccuracy = position.coords.accuracy;
                        
                        // limit the current fix accuracy for CURRENT_ACCURACY_TIMEOUT milliseconds
                        if (currentAccuracyExpiration) {
                            $timeout.cancel(currentAccuracyExpiration);
                        }
                        currentAccuracyExpiration = $timeout(function () {
                            currentAccuracy = -1;
                        }, CURRENT_ACCURACY_TIMEOUT);
                        
                        // rotate the array as necessary
//                        Log.debug('[GPS] Positions Length: ' + positions.length.toString());
                        if (positions.length > MAX_POSITIONS_LENGTH * 2) {
                            rotatePositionsArray();
                        }
                    }
                }, POSITION_FREQUENCY)
            );
        }

        /**
         * Clears the watch on the geoLocation.
         */
        function turnOff() {
            if (isOn()) {
                $rootScope.$broadcast('GPS.off');
                geoWatch.clearWatch();
                Log.debug('[GPS] Watch cleared.');

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