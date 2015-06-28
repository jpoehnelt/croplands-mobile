angular.module('croplandsApp.controllers')
    .controller('CollectCtrl', ['$scope', '$stateParams', '$timeout', 'mappings', 'Location', '$cordovaCamera', '$cordovaGeolocation', '$cordovaDeviceOrientation', '$cordovaDevice', '$window', 'Log', 'screenOrientationService', '$state', '$cordovaNetwork', '$cordovaFile', 'Photos', function ($scope, $stateParams, $timeout, mappings, Location, $cordovaCamera, $cordovaGeolocation, $cordovaDeviceOrientation, $cordovaDevice, $window, Log, screenOrientationService, $state, $cordovaNetwork, $cordovaFile, Photos) {

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

        function redirectHome() {
            $scope.gps.on = false;
            $scope.gpsClear();
            $state.go('app.home');
        }


        try {
            $scope.location.source = _.values($cordovaDevice.getDevice()).join(separator = ',')
        }
        catch (e) {
            Log.warning('Could not get device id.')
        }

        // Watch for changes to land use, if not cropland, remove fields specific to cropland, else set to uknown;
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


        // Android Nexus 7 wasn't returning a value on first attempt of compass use...
        try {
            $cordovaDeviceOrientation.getCurrentHeading();
        }
        catch (e) {
            // nothing
        }


        $scope.captureHeading = function () {
            Log.debug("Attempting to Capture Heading");
            try {
                Log.debug('Orientation' + screen.orientation);
                $cordovaDeviceOrientation.getCurrentHeading().then(function (result) {
                    // Level of accuracy not important but take more accurate reading if it is there
                    var heading = (Math.round(result.trueHeading | result.magneticHeading));

                    // nexus 7 tablet does not adjust for orientation
                    // TODO More testing

                    Log.debug(result);
                    Log.debug(screenOrientationService.getDegrees());
                    if ($scope.platform === 'Android') {
                        Log.debug("Adjusting for orientation");
                        heading = (heading + screenOrientationService.getDegrees()) % 360;
                    }

                    // Save to scope
                    $scope.location.bearing = heading;

                    // Tell the user the heading
                    Log.debug("Heading: " + String($scope.location.bearing));
                });
            }
            catch (err) {
                Log.error('Device orientation not allowed.');
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

        function LogLocation() {
            if ($scope.gps.on == true) {
                $cordovaGeolocation.getCurrentPosition().then(function (position) {
                    if (position.coords.accuracy < 150) {
                        Log.info('Captured Position - Accuracy: ' + String(Math.round(position.coords.accuracy)) + ' meters');
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
                    } else {
                        Log.error('Captured Position - Accuracy: ' + String(position.coords.accuracy) + ' meters');
                    }
                }, function (err) {
                    Log.error(err);
                });
                $timeout(function () {
                    LogLocation();
                }, 5000)
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
        };

        $scope.gpsToggle = function () {
            // try to start gps
            LogLocation()
        };

        $scope.isValid = function () {
            // has the user entered the minimum required information
            return $scope.gps.locations.length && $scope.record.land_use_type;
        };

        $scope.save = function () {
            var today = new Date();

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
                    while ($scope.photos.length) {
                        var photo = $scope.photos.pop();
                        Photos.save(photo, result.insertId, 0, 0, 0, {}).then(function (result) {
                            Log.debug(result);
                        }, function (err) {
                            Log.error(err);
                        });
                    }
                    Log.debg(result.insertId);
                    redirectHome();
                },
                function (error) {
                    Log.error(error);
                }
            );
        };

        $scope.cancel = redirectHome;

    }]);