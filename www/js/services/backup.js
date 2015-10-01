angular.module('croplandsApp.services')
    .factory('Backup', ['$cordovaFile', '$cordovaDevice', 'Log', 'DB_CONFIG', '$timeout', 'Location', '$filter', function ($cordovaFile, $cordovaDevice, Log, DB_CONFIG, $timeout, Location, $filter) {

        var platform = $cordovaDevice.getPlatform(),
            backupFolder = 'GlobalCroplands',
            directory;

        if (platform === 'Android') {
            directory = cordova.file.externalRootDirectory;
        } else if (platform === 'iOS') {
            directory = cordova.file.syncedDataDirectory;
        } else {
            Log.error('[File] Unknown directory.');
        }

        function buildFolders() {
            return $cordovaFile.createDir(directory, 'GlobalCroplands', false);
        }

        function join(paths) {
            paths = _.map(paths, function (path) {
                if (path[path.length - 1] === '/') {
                    path = path.slice(0, path.length - 1);
                }
                return path;
            });
            var path = paths.join([separator = '/']);

            if (path[0] === '/') {
                path = path.slice(1, path.length);
            }
            return path;
        }

        function save(filename, data, replace) {
            var file = join([backupFolder, filename]);
            console.log(file);
            return buildFolders().then(function () {
                return $cordovaFile.createFile(directory, file, true).then(function () {
                    Log.info('[Backup] Creating: ' + filename);
                    return $cordovaFile.writeFile(directory, file, data, replace);
                }, function () {
                    Log.info('[Backup] File Already Exists: ' + filename);
                    return $cordovaFile.writeFile(directory, file, data, replace);
                });
            }, function () {
                return $cordovaFile.createFile(directory, file, true).then(function () {
                    Log.info('[Backup] Creating: ' + filename);
                    return $cordovaFile.writeFile(directory, file, data, replace);
                }, function () {
                    Log.info('[Backup] File Already Exists: ' + filename);
                    return $cordovaFile.writeFile(directory, file, data, replace);
                });
            });
        }

        function removeDb() {
            return $cordovaFile.removeFile(directory, join([backupFolder, 'database', DB_CONFIG.name + '.sqlite']));
        }

        function copyDB() {
            return $cordovaFile.copyFile(cordova.file.applicationStorageDirectory, join(['databases', DB_CONFIG.name]),
                directory, join([backupFolder, DB_CONFIG.name + '.sqlite']));
        }

        function backupDB() {
            return buildFolders().then(removeDb).then(function (success) {
                return copyDB();
            }, function (error) {
                return copyDB();
            });
        }

        buildFolders().then(function (success) {
//           console.log(success);
        }, function (error) {
//           console.log(error);
        });

        function createLogFile() {
            var log = {
                messages: Log.messages()
            };

            save('croplands.log', JSON.stringify(log), true).then(function (success) {
                console.log(success);
            }, function (error) {
                console.log(error);
            });

        }

        function getLogFile() {
            return $cordovaFile.checkFile(directory, join([backupFolder, 'croplands.log']));
        }

        function backupToShapefile() {
            var shp,
                geojson = {
                    type: 'FeatureCollection',
                    features: [
                    ]
                };
            Location.getAll().then(function (locations) {
                var columnsToSaveFromLocation = ['bearing', 'country', 'date_created', 'distance', 'lat', 'lon', 'original_lat', 'original_lon', 'source', 'synced', 'id'];
                var columnsToSaveFromRecord = ['crop_primary', 'crop_secondary', 'intensity', 'water', 'land_use_type'];

                geojson.features = _.map(locations, function (location) {
                    location = _.merge(location, JSON.parse(location.json));


                    var record = _.mapKeys(_.pick(location.records[0], columnsToSaveFromRecord), function (value, key) {
                        var field = key;

                        if (key === 'crop_primary' || key === 'crop_secondary' || key === 'crop_tertiary') {
                            field = 'crop'
                        } else if (key === 'land_use_type') {
                            field = 'landUseType';
                        } else {
                            field = key;
                        }


                        return key + $filter('mappings')(value, field);

                    });

                    console.log(record);

                    var temp = _.pick(location, columnsToSaveFromLocation);
                    temp = _.merge(temp, _.pick(location.records[0], columnsToSaveFromRecord));

                    console.log(temp);

                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [location.lng, location.lat]
                        },
                        properties: temp
                    }
                });


                save('locations.json', geojson, true).then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

                save('locations.kml', tokml(geojson), true).then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            }, function (error) {
                Log.error(error);
            });

        }

        $timeout(function () {
            backupToShapefile();
            createLogFile();
        }, 2000);

        return {
            save: save,
            backupDB: backupDB,
            getLogFile: getLogFile
        };
    }]);