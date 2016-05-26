angular.module('croplandsApp.controllers')
    .controller('CollectCtrl', ['$scope', '$stateParams', '$timeout', 'mappings', 'Location', '$cordovaCamera', '$cordovaGeolocation', 'Compass', '$cordovaDevice', '$window', 'Log', '$state', '$cordovaNetwork', '$cordovaFile', 'Photos', '$q', 'GPS', function ($scope, $stateParams, $timeout, mappings, Location, $cordovaCamera, $cordovaGeolocation, Compass, $cordovaDevice, $window, Log, $state, $cordovaNetwork, $cordovaFile, Photos, $q, GPS) {
        var MINIMUM_POINTS = 5;

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
                land_use_type: 0,
                source_type: 'ground'
            },
            choices: {
                landUse: mappings.landUseType.choices,
                crop: mappings.crop.choices,
                crop2: [{'id': null, 'label': 'None'}].concat(mappings.crop.choices),
                intensity: mappings.intensity.choices,
                water: mappings.water.choices
            },
            photosEnabled: true,
            photos: [],
            todoList: {
                photos: {message: 'Capture a photo of the area.', complete: false},
                gps: {message: 'Collect sufficient GPS points.', complete: false},
                bearing: {message: 'Capture bearing to center of area.', complete: false},
                distance: {message: 'Set distance to center of the area.', complete: false},
                landCover: {message: 'Select land cover class.', complete: false}
            }
        });

        if (!GPS.isOn()) {
            GPS.turnOn();
        }

        $scope.$on('GPS.on', function (event, position) {
            logPosition(position);
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
            $scope.location.source = _.values($cordovaDevice.getDevice()).join(separator = ',');
            $scope.record.source_type = "ground";
            $scope.record.source_description = "mobile_application";
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
                delete $scope.record.crop_secondary;
            }
            else {
                $scope.record.water = $scope.record.water || 0;
                $scope.record.intensity = $scope.record.intensity || 0;
                $scope.record.crop_primary = $scope.record.crop_primary || 0;
                $scope.record.crop_primary_coverage = $scope.record.crop_primary_coverage || 100;
                $scope.record.crop_secondary = $scope.record.crop_secondary || null;
                $scope.record.crop_tertiary = $scope.record.crop_tertiary || null;
            }
        });

        $scope.$watch('gps.locations', function (locations) {
            $scope.location.lat = mean(locations, 'lat');
            $scope.location.lon = mean(locations, 'lon');
        }, true);


        $scope.spaceForSecondary = function () {
            return parseInt($scope.record.crop_primary_coverage) < 100;
        };

        $scope.spaceForTertiary = function () {
            return $scope.record.crop_secondary !== null && ($scope.record.crop_primary_coverage) + parseInt($scope.record.crop_secondary_coverage) < 100;
        };

        $scope.$watch('record.crop_secondary', function(current, previous) {
           if (current === $scope.record.crop_primary) {
               $scope.record.crop_secondary = null;
               $scope.record.crop_secondary_coverage = null;
           } else if (previous === null && current >=0) {
               $scope.record.crop_secondary_coverage = 100 - parseInt($scope.record.crop_primary_coverage);
           }
        });

        $scope.$watch('record.crop_tertiary', function(current, previous) {
            if (current === $scope.record.crop_primary || current === $scope.record.crop_secondary) {
                $scope.record.crop_tertiary = null;
                $scope.record.crop_tertiary_coverage = null;
            } else if (previous === null && current >=0) {
                $scope.record.crop_tertiary_coverage = 100 - parseInt($scope.record.crop_primary_coverage) - parseInt($scope.record.crop_secondary_coverage);
            }
        });

        $scope.$watch(function () {
            return [$scope.record.crop_primary_coverage, $scope.record.crop_secondary_coverage, $scope.record.crop_tertiary_coverage];
        }, function (val) {
            var p = parseInt(val[0]) || 0, // primary
                s = parseInt(val[1]) || 0, // secondary
                t = parseInt(val[2]) || 0; // tertiary

            // Secondary and Tertiary must have smaller values
            s = Math.min(p, s);
            t = Math.min(s, t);

            // Fix the math if higher level changes
            while (p + s + t > 100) {
                var over = p + s + t - 100;
                if (t > 0) {
                    t = Math.max(0, t - over);
                } else if (s > 0) {
                    s = Math.max(0, s - over);
                }
            }

            // Update the model
            $scope.record.crop_primary_coverage = p;
            $scope.record.crop_secondary_coverage = s;
            $scope.record.crop_tertiary_coverage = t;

            if (s === 0) {
                $scope.record.crop_secondary = null;
            }
            if (t === 0) {
                $scope.record.crop_tertiary = null;
            }
        },true);

        $scope.captureHeading = function () {
            var result = Compass.getHeading();

            if (result) {
                Log.debug(JSON.stringify(result));
                $scope.location.bearing = result.trueHeading === undefined ? result.magneticHeading : result.trueHeading;
                Log.debug("[CollectCtrl] Heading: " + String($scope.location.bearing));
            } else {
                Log.error('[CollectCtrl] No compass reading available.');
            }

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
                Log.error(err);
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
            if (position.coords.accuracy < 30 && $scope.gps.on) {
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
            $scope.todo();
            return _.every($scope.todoList, 'complete', true);
        };

        $scope.todo = function () {
            $scope.todoList.gps.complete = $scope.gps.locations.length >= MINIMUM_POINTS;
            $scope.todoList.landCover.complete = $scope.record.land_use_type !== 0;
            $scope.todoList.photos.complete = $scope.photos.length > 0;
            $scope.todoList.distance.complete = $scope.location.distance !== null;

            // if distance to center is zero, bearing doesn't matter
            if (parseInt($scope.location.distance, 10) === 0) {
                $scope.todoList.bearing.complete = true;
            } else {
                $scope.todoList.bearing.complete = $scope.location.bearing !== null;
            }
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
            $scope.location.records[0] = $scope.record;
            $scope.gps.on = false;

            // cast distance to int
            $scope.location.distance = parseInt($scope.location.distance, 10);
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