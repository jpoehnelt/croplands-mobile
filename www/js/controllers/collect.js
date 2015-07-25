angular.module('croplandsApp.controllers')
    .controller('CollectCtrl', ['$scope', '$stateParams', '$timeout', 'mappings', 'Location', '$cordovaCamera', '$cordovaGeolocation', 'Compass', '$cordovaDevice', '$window', 'Log', '$state', '$cordovaNetwork', '$cordovaFile', 'Photos', '$q', 'GPS', function ($scope, $stateParams, $timeout, mappings, Location, $cordovaCamera, $cordovaGeolocation, Compass, $cordovaDevice, $window, Log, $state, $cordovaNetwork, $cordovaFile, Photos, $q, GPS) {

        if (!GPS.isOn()) {
            GPS.turnOn();
        }

        $scope.$on('GPS.on', function (event, position) {
            logPosition(position);
        });

        angular.extend($scope, {
            gps: {
                on: false,
                locations: []
            },
            location: {
                lat: null,
                lon: null,
                bearing: null,
                distance: null,
                source: null,
                records: [],
                photos: []
            },
            record: {
                land_use_type: 0
            },
            choices: {
                landUse: mappings.landUseType.choices,
                crop: mappings.crop.choices,
                intensity: mappings.intensity.choices,
                water: mappings.water.choices
            },
            messages: Log.messages(),
            photosEnabled: true,
            photos: []
        });

        try {
            $scope.platform = $cordovaDevice.getPlatform();
        }
        catch (e) {
            $scope.platform = 'unknown';
        }


        /**
         * Function redirects back to the dashboard after cleaning up.
         * Turns gps off and clears locations that were saved.
         */
        function redirectHome() {
            cleanUp();
            $state.go('app.home');
        }

        function cleanUp() {
            $scope.gps.on = false;
            $scope.gpsClear();
            Log.debug('[CollectCtr] Cleanup complete')
        }


        try {
            $scope.location.source = _.values($cordovaDevice.getDevice()).join(separator = ',')
        }
        catch (e) {
            Log.warning('Could not get device id.')
        }

        /**
         * Watch for changes to land use, if not cropland,
         * remove fields specific to cropland, else set to unknown;
         */
        $scope.$watch('record.land_use_type', function (val) {
            if (val !== 1) {
                delete $scope.record.water;
                delete $scope.record.intensity;
                delete $scope.record.crop_primary;
            }
            else {
                $scope.record.water = $scope.record.water || 0;
                $scope.record.intensity = $scope.record.intensity || 0;
                $scope.record.crop_primary = $scope.record.crop_primary || 0;
            }
        });

        $scope.$watch('gps.locations', function (locations) {
            $scope.location.lat = mean(locations, 'lat');
            $scope.location.lon = mean(locations, 'lon');
        }, true);


        $scope.captureHeading = function () {
            // Save to scope
            Compass.getHeading().then(function (result) {
                $scope.location.bearing = result.trueHeading || result.magneticHeading;
                // Tell the user the heading
                Log.debug("Heading: " + String($scope.location.bearing));
            });
        };

        $scope.takePhoto = function () {
            $cordovaCamera.getPicture({ quality: 75,
                destinationType: Camera.DestinationType.NATIVE_URI,
                sourceType: Camera.PictureSourceType.CAMERA,
                saveToPhotoAlbum: true,
                correctOrientation: true,
                targetWidth: 1000,
                targetHeight: 1000
            }).then(function (imageURI) {
                Log.debug('[CollectCtrl] Photo taken');
                Log.debug(imageURI);
                $scope.photos.push(imageURI);
            }, function (err) {
                Log.info(err);
            });

        };

        $scope.removePhoto = function (index) {
            delete $scope.photos[index];
            _.remove($scope.photos, function (p) {
                return p === undefined;
            });
        };

        /**
         * Stores position in array if it meets the minimum accuracy specified.
         * @param position integer
         */
        function logPosition(position) {
            if (position.coords.accuracy < 150 && $scope.gps.on) {
                Log.info('Captured Position, Accuracy: ' + String(Math.round(position.coords.accuracy)) + ' meters');
                Log.debug('[CollectCtrl] Captured Position, Accuracy: ' + String(Math.round(position.coords.accuracy)) + ' meters');
                $scope.gps.locations.push({
                    'date_taken': new Date(position.timestamp).toISOString(),
                    'speed': position.coords.speed,
                    'altitude': position.coords.altitude,
                    'altitude_accuracy': position.coords.altitudeAccuracy,
                    'lat': position.coords.latitude,
                    'lon': position.coords.longitude,
                    'accuracy': position.coords.accuracy,
                    'heading': position.coords.heading
                });
            }
            else {
                Log.info('Ignored Position, Accuracy: ' + String(position.coords.accuracy) + ' meters');
            }
        }

        function mean(objs, key) {
            var total = 0;

            if (objs.length === 0) {
                return undefined;
            }

            for (var i = 0; i < objs.length; i++) {
                total = total + objs[i][key];
            }

            return total / objs.length;
        }

        $scope.gpsClear = function () {
            $scope.gps.locations = [];
            Log.debug('[CollectCtrl] Locations Cleared: ' + $scope.gps.locations.length + ' remaining');
        };

        $scope.isValid = function () {
            // has the user entered the minimum required information
            return $scope.gps.locations.length && $scope.record.land_use_type;
        };

        $scope.save = function () {
            var today = new Date();

            Log.debug('[CollectCtrl] Save Action Beginning');

            // Check that data is valid
            if (!$scope.isValid()) {
                return;
            }

            // Store month and year as separate fields
            $scope.record.month = today.getMonth() + 1; // api uses 1 based index
            $scope.record.year = today.getFullYear();

            // store points
            $scope.location.points = $scope.gps.locations;

            // Append record to location.records array
            // Could allow for multiple records with different dates to be added eventually
            $scope.location.records.push($scope.record);
            $scope.gps.on = false;

            Location.save($scope.location).then(
                function (result) {
                    var photoPromises = [];
                    Log.debug('[CollectCtrl] Location Saved');

                    while ($scope.photos.length) {
                        var photo = $scope.photos.pop();
                        photoPromises.push(Photos.save(photo, result.insertId, 0, 0, 0, {}));
                    }

                    // after all photos have been saved...
                    $q.all(photoPromises).then(function (data) {
                        Log.debug('[CollectCtrl] ' + data.length + ' Photos Saved');
                        Log.info(data.length + ' Photos Saved');
                        redirectHome();
                    }, function (err) {
                        Log.error(err);
                        redirectHome();
                    });

                },
                function (error) {
                    Log.error(error);
                }
            );
        };

        $scope.cancel = redirectHome;

    }]);