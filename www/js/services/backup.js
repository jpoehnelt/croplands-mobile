angular.module('croplandsApp.services')
    .factory('Backup', ['$cordovaFile', '$cordovaDevice', 'Log', 'DB_CONFIG', '$timeout', 'Location', '$filter','$q', function ($cordovaFile, $cordovaDevice, Log, DB_CONFIG, $timeout, Location, $filter, $q) {

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

        function backupLog() {
            var log = {
                messages: Log.messages()
            };

            return save('GlobalCroplandsAppLog.json', JSON.stringify(log), true)

        }


        function backupData() {
            var deferred = $q.defer(),
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

                    var temp = _.pick(location, columnsToSaveFromLocation);
                    temp = _.merge(temp, _.pick(location.records[0], columnsToSaveFromRecord));

                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [location.lng, location.lat]
                        },
                        properties: temp
                    }
                });


                var json = save('locations.json', geojson, true);
                var kml = save('locations.kml', tokml(geojson), true);

                $q.all([json, kml]).then(function (result) {
                    deferred.resolve(result);
                }, function (e) {
                    deferred.reject(e);
                });


            }, function (error) {
                Log.error(error);
            });

            return deferred.promise;

        }

        function listFiles() {
            var files = [],
                deferred = $q.defer();

            try {
                $cordovaFile.checkDir(directory, backupFolder).then(function (dirEntry) {
                    var dirReader = dirEntry.createReader();

                    Log.info('[Backup] Reading files in ' + dirEntry.fullPath);

                    var readEntries = function () {
                        dirReader.readEntries( function (results) {
                            if(results.length) {
                                files = files.concat(results);
                                readEntries();
                            } else {
                                deferred.resolve(files);
                            }
                        }, function (error) {
                            deferred.reject(e);
                        });
                    };

                    // start recursive reading here, warning slow for deep structures
                    readEntries();

                }, function (e) {
                    deferred.reject(e);
                });
            } catch (e) {
                deferred.reject(e);
            }
            return deferred.promise;
        }

        return {
            backupDB: backupDB,
            backupData: backupData,
            backupLog: backupLog,
            listFiles: listFiles
        };
    }]);