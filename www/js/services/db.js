angular.module('croplandsApp.services')
    .factory('DB', ['$q', 'DB_CONFIG', 'Log', function ($q, DB_CONFIG, Log) {
        var self = this;
        self.db = null;

        self.init = function () {
            // Use self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name}); in production
            if (window.sqlitePlugin) {
                self.db = window.sqlitePlugin.openDatabase(DB_CONFIG.name, '1.0', 'database2');
            }
            else {
                self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database2', 102400 * 1024);
            }
            // for opening a background db:

            angular.forEach(DB_CONFIG.tables, function (table) {
                var columns = [];
//                Log.info(table);
                angular.forEach(table.columns, function (column) {
                    columns.push(column.name + ' ' + column.type);
                });
                var drop = 'DROP TABLE ' + table.name;
//                self.query(drop);
                var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
                self.query(query).then(function (result) {
                    Log.debug("[DB] " + JSON.stringify(result));
                    return [];
                }, function (err) {
                    Log.error(err);
                    return [];
                });
                Log.debug('Table ' + table.name + ' initialized');
            });
        };

        self.query = function (query, bindings) {
            bindings = typeof bindings !== 'undefined' ? bindings : [];
            var deferred = $q.defer();

            self.db.transaction(function (transaction) {
                transaction.executeSql(query, bindings, function (transaction, result) {
                    deferred.resolve(result);
                }, function (transaction, error) {
                    deferred.reject(error);
                });
            });

            return deferred.promise;
        };

        self.fetchAll = function (result) {
            var output = [];

            for (var i = 0; i < result.rows.length; i++) {
                output.push(result.rows.item(i));
            }

            return output;
        };

        self.fetch = function (result) {
            return result.rows.item(0);
        };

        return self;
    }])
    .factory('Location', ['$rootScope', 'DB', 'Log', '$q', '$timeout', '$http', '$cordovaNetwork', 'Photos','User', function ($rootScope, DB, Log, $q, $timeout, $http, $cordovaNetwork, Photos,User) {
        var self = this,
            url = 'https://api.croplands.org/api/locations',
            countOfLocations,
            countOfLocationsToSync = 0,
            busy = false;

        function markSynced(id, data) {
            var deferred = $q.defer(),
                sql = "UPDATE location SET synced = 1, json = '" + JSON.stringify(data) + "' WHERE id = " + id;
            DB.query(sql)
                .then(function (result) {
                    Log.debug(result);
                    deferred.resolve(result);
                }, function (err) {
                    deferred.reject(err);
                    Log.error(sql);
                });
            return deferred.promise;
        }

        function addSyncAttempt(id) {
            DB.query('UPDATE location SET sync_attempts = sync_attempts + 1 WHERE id = ' + id)
                .then(function (result) {
                    Log.debug(result);
                }, function (err) {
                    Log.error(err);
                });

        }

        function markError(id) {
            DB.query('UPDATE location SET synced = -1 WHERE id = ' + id).then(function (result) {
                Log.debug(result);
            }, function (err) {
                Log.error(err);
            });
        }

        function upload(location) {
            var deferred = $q.defer();
            Log.info("Uploading Location");
            addSyncAttempt(location.id);
            $http({method: 'POST', url: url, data: location.json}).then(function (response, status) {
                Log.info("Location Uploaded");
                Log.debug(response.data);
                markSynced(location.id, response.data).then(function () {
                    deferred.resolve();
                });
            }, function (response) {
                Log.info("Location Upload Failed");
                Log.error(JSON.stringify(response));

                try {
                    if (response && response.status === 400) {
                        addSyncAttempt(location.id);
                    }
                } catch (e) {
                    Log.error(e);
                }

                deferred.resolve();
            });

            return deferred.promise;
        }

        function throttle_uploads(locations) {

            var promises = [],
                i = 0;

            Log.info(String(locations.length) + " Locations to Sync");

            // iterate through each location that needs to be synced
            _.each(locations, function (location) {
                var deferred = $q.defer();
                $timeout(function () {
                        upload(location).then(function () {
                            deferred.resolve();
                        });
                    },
                    200
                );
                promises.push(deferred.promise);
            });

            return $q.all(promises);

        }

        self.getAll = function () {
            return DB.query('SELECT * FROM location')
                .then(function (result) {
                    var locations = DB.fetchAll(result);
                    countOfLocations = locations.length;
                    return locations;
                });
        };

        self.getAllUnsynced = function () {
            return DB.query('SELECT * FROM location WHERE synced = 0 AND sync_attempts < 10')
                .then(function (result) {
                    var locations = DB.fetchAll(result);
                    countOfLocationsToSync = locations.length;
                    return locations;
                }, function (err) {
                    Log.error('error in query');
                });
        };

        self.getAllRecords = function () {
            var deferred = $q.defer();
            self.getAll().then(function (locations) {
                deferred.resolve(_.map(locations, function (location) {
                    location = JSON.parse(location.json);
                    return location;
                }));
            });

            return deferred.promise;
        };

        self.getById = function (id) {
            return DB.query('SELECT * FROM location WHERE id = ?', [id])
                .then(function (result) {
                    return DB.fetch(result);
                });
        };

        self.sync = function () {
            var deferred = $q.defer();

            if (self.canSync()) {
                busy = true;
                Log.info('Attempting to Sync');

                self.getAllUnsynced().then(function (locations) {
                    throttle_uploads(locations).then(function () {
                        self.getAllUnsynced().then(function (locations) {
                            countOfLocationsToSync = locations.length;
                            busy = false;
                            deferred.resolve();
                            Photos.sync();
                        });

                    });
                });
            } else {
                Log.debug('[Location] Cannot sync right now.');
                deferred.reject('Already syncing.');
            }

            return deferred.promise;
        };

        self.save = function (location) {
            var deferred = $q.defer();
            var query = "INSERT INTO location (lat, lng, json) VALUES (" + location.lat + ", " + location.lon + ",'" + JSON.stringify(location) + "')";
            countOfLocations++;
            countOfLocationsToSync++;

            DB.query(query).then(function (result) {
                Log.info("Location saved.");
                var networkState = $cordovaNetwork.getNetwork();
                if (networkState === 'wifi' || networkState === 'ethernet') {
                    self.sync();
                }
                deferred.resolve(result);
            }, function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        };

        self.getCountOfLocations = function () {
            return countOfLocations;
        };

        self.getCountOfLocationsToSync = function () {
            return countOfLocationsToSync;
        };

        self.getCountOfLocationsSynced = function () {
            return countOfLocations - countOfLocationsToSync;
        };

        self.isBusy = function () {
            return busy;
        };

        self.canSync = function () {
            if( self.isBusy()) {
                Log.debug('[Location] Busy Syncing.');
                return false;
            }

            // Check for locations to sync
            if (self.getCountOfLocationsToSync() === 0) {
                return false;
            } else {
                Log.debug('[Location] Locations need to be synced.');
            }
            return true;
        };

        // init
        self.getAll();
        self.getAllUnsynced();

        return self;
    }])
    .factory('Photos', ['$rootScope', 'DB', 'Log', '$q', '$timeout', '$http', '$cordovaNetwork', '$cordovaFileTransfer', function ($rootScope, DB, Log, $q, $timeout, $http, $cordovaNetwork, $cordovaFileTransfer) {
        var self = this,
            url = 'https://api.croplands.org/upload/image',
            busy = false;

        function markSynced(id) {
            DB.query('UPDATE photo SET synced = 1 WHERE id = ' + id)
                .then(function (result) {
                    Log.debug(result);
                }, function (err) {
                    Log.error(err);
                });

        }

        function addSyncAttempt(id) {
            DB.query('UPDATE photo SET sync_attempts = sync_attempts + 1 WHERE id = ' + id)
                .then(function (result) {
                    Log.debug(result);
                }, function (err) {
                    Log.error(err);
                });


        }

        function markError(id) {
            DB.query('UPDATE photo SET synced = -1 WHERE id = ' + id)
                .then(function (result) {
                    Log.debug(result);
                }, function (err) {
                    Log.error(err);
                });

        }

        function upload(photo) {
            var deferred = $q.defer(), location = JSON.parse(photo.location_json), options = {}, params = {};
            Log.info("Uploading Photo");
            addSyncAttempt(photo.id);

            options.chunkedMode = false;

            // Get values for photo
            params.location_id = location.id;
            params.date_acquired = location.date_created;
            params.lat = (typeof photo.lat === 'undefined') ? location.lat : photo.lat;
            params.lon = (typeof photo.lng === 'undefined') ? location.lng : photo.lng;
            params.heading = (typeof photo.heading === 'undefined') ? location.heading : photo.heading;

            // TODO Separate these values from that of the location since they may not be consistent.

            options.params = params;

            options.headers = [{'Authorization': 'bearer ' + $http.defaults.headers.post.authorization}];

            $cordovaFileTransfer.upload(url, photo.filename, options)
                .then(function (result) {
                    Log.debug(result);
                    markSynced(photo.id);
                    deferred.resolve(result);
                }, function (err) {
                    Log.error(err);
                    deferred.reject(err);
                }, function (progress) {
                    Log.info(String(Math.round(progress.loaded / progress.total * 100)) + "%");
                });

            return deferred.promise;
        }

        function throttle_uploads(photos) {

            var promises = [],
                i = 0;

            if (photos.length === 0) {
                return $q.all();

            }
            Log.info(String(photos.length) + " Photos to Upload");

            // iterate through each location that needs to be synced
            _.each(photos, function (photo) {
                var deferred = $q.defer();
                $timeout(function () {
                        upload(photo).then(function () {
                            deferred.resolve();
                        });
                    },
                    1000
                );
                promises.push(deferred.promise);
            });

            return $q.all(promises);
        }

        self.getAll = function () {
            return DB.query('SELECT photo.*, location.json as location_json FROM photo LEFT JOIN location ON photo.location_id = location.id ORDER BY id DESC')
                .then(function (result) {
                    return DB.fetchAll(result);
                }, function (err) {
                    Log.error(err);
                    return [];
                });
        };

        self.getAllUnsynced = function () {
            return DB.query('SELECT photo.*, location.json as location_json FROM photo LEFT JOIN location ON photo.location_id = location.id WHERE location.synced = 1 AND photo.synced = 0 AND photo.sync_attempts < 10')
                .then(function (result) {
                    return DB.fetchAll(result);
                }, function (err) {
                    Log.error(err);
                    return [];
                });
        };

        self.getById = function (id) {
            return DB.query('SELECT photo.*, location.json as location_json FROM photo LEFT JOIN location ON photo.location_id = location.id WHERE id = ?', [id])
                .then(function (result) {
                    return DB.fetch(result);
                }, function (err) {
                    Log.error(err);
                    return [];
                });
        };

        self.sync = function () {
            var deferred = $q.defer();

            if (self.canSync()) {
                busy = true;

                self.getAllUnsynced().then(function (photos) {
                    Log.debug(photos);
                    throttle_uploads(photos).then(function () {
                        self.getAllUnsynced().then(function (photos) {
                            busy = false;
                            deferred.resolve();
                        });

                    });
                });
            } else {
                deferred.reject('Already uploading.');
            }

            return deferred.promise;
        };

        self.save = function (fn, location_id, lat, lon, heading, json) {
            var deferred = $q.defer();
            var query = "INSERT INTO photo (location_id, lat, lng, json, filename, heading) VALUES (" + location_id + "," + lat + ", " + lon + ",'" + JSON.stringify(json) + "', '" + fn + "'," + heading + ")";
            Log.debug(query);

            DB.query(query).then(function (result) {
                Log.debug("Photo saved." + result.insertId);
                deferred.resolve(result);
            }, function (err) {
                Log.error(err);
                deferred.reject(err);
            });

            return deferred.promise;
        };

        self.getCountOfPhotos = function () {
            return self.getAll();
        };

        self.getCountOfPhotosToSync = function () {
            return self.getAllUnsynced();
        };

        self.isBusy = function () {
            return busy;
        };

        self.canSync = function () {
            return true;
//            return !self.isBusy() && self.getCountOfPhotosToSync();
        };

        return self;
    }]);