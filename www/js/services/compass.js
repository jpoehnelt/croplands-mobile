angular.module('croplandsApp.services')
    .factory('Compass', ['$cordovaDeviceOrientation', '$rootScope', 'Log', function ($cordovaDeviceOrientation, $rootScope, Log) {
        var compassWatch, // global for turning watch on/off
            headings = [], // array of positions
            watchOptions = {
                frequency: 50
            };

        /**
         * Creates a watch on device orientation after close any open watches first.
         */
        function turnOn() {
            turnOff();
            try {
                compassWatch = $cordovaDeviceOrientation.watchHeading(watchOptions);
                compassWatch.then(
                    null,
                    function (err) {
                        Log.error(err);
                    }, function (result) {
                        $rootScope.$broadcast('Compass.heading', result);
                    }
                );
            } catch(err) {
                Log.error(err);
            }
        }

        function rotate() {
            if (headings.length > 100) {
                headings = headings.slice(10);
            }
        }

        /**
         * Clears the watch on the geoLocation.
         */
        function turnOff() {
            if (isOn()) {
                $rootScope.$broadcast('Compass.off');
                compassWatch.clearWatch();
            }
        }

        /**
         * Checks if the watch exists.
         * @returns {boolean}
         */
        function isOn() {
            return compassWatch !== undefined;
        }

        /**
         * Clears array of capture positions from this session. These are not persisted nor uploaded.
         */
        function clearHeadings() {
            headings = [];
        }

        /**
         * Returns the positions to the app for mapping purposes.
         * @returns {Array}
         */
        function getHeadings() {
            return headings;
        }

        /**
         * Check if there is a gps fix and return accuracy. No fix is -1
         */
        function getHeading() {
            return $cordovaDeviceOrientation.getCurrentHeading();
        }

        // Interface
        return {
            isOn: isOn,
            turnOn: turnOn,
            turnOff: turnOff,
            clearHeadings: clearHeadings,
            getHeadings: getHeadings,
            getHeading: getHeading
        }
    }
    ]);