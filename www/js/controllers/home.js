angular.module('croplandsApp.controllers')
    .controller('HomeCtrl', ['$scope', '$state', 'Location', 'Log', '$cordovaSocialSharing', 'Backup', '$interval', '$q', function ($scope, $state, Location, Log, $cordovaSocialSharing, Backup, $interval, $q) {
        angular.extend($scope, {
            landUseTypes: {},
            cropTypes: {},
            waterSources: {}
        });


        $scope.$watch(function () {
            return [Location.getCountOfLocations(), Location.getCountOfLocationsToSync()];
        }, computeStats, true);

        function computeStats() {
            // reset stats
            $scope.landUseTypes = {};
            $scope.cropTypes = {};
            $scope.waterSources = {};
            $scope.countSynced = 0;
            $scope.countNotSynced = 0;

            Location.getAll().then(function (entries) {
                _.each(entries, function (entry) {
                    console.log("entry: " + JSON.stringify(entry));
                    // stats for sync status
                    if (entry.synced) {
                        $scope.countSynced++;
                    } else {
                        $scope.countNotSynced++;
                    }

                    var location = JSON.parse(entry.json);

                    // Land Cover Stats
                    if (!$scope.landUseTypes[location.records[0].land_use_type]) {
                        $scope.landUseTypes[location.records[0].land_use_type] = 1;
                    } else {
                        $scope.landUseTypes[location.records[0].land_use_type]++;
                    }

                    // Crop Specific Stats
                    if (location.records[0].land_use_type === 1) {
                        if (!$scope.cropTypes[location.records[0].crop_primary]) {
                            $scope.cropTypes[location.records[0].crop_primary] = 1;
                        } else {
                            $scope.cropTypes[location.records[0].crop_primary]++;
                        }

                        if (!$scope.waterSources[location.records[0].water]) {
                            $scope.waterSources[location.records[0].water] = 1;
                        } else {
                            $scope.waterSources[location.records[0].water]++;
                        }
                    }
                });
            });


        }

        /// Application Files ///
        $scope.share = function (fileEntry) {
            updateFiles().then(function (success) {
                $cordovaSocialSharing
                    .share(fileEntry.name, null, fileEntry.nativeURL)
                    .then(function (result) {
                        Log.info('[HomeCtrl] Shared ' + fileEntry.name);
                    }, function (error) {
                        Log.error(error);
                    });
            });
        };

        function updateFiles() {
            var logs = Backup.backupLog(),
                data = Backup.backupData(),
                db = Backup.backupDB();

            return $q.all([logs, data, db]);
        }

        function getFileList() {
            updateFiles().then(function (success) {
                Backup.listFiles().then(function (files) {
                    $scope.files = files;
                }, function (e) {
                    Log.error(e);
                });
            }, function (e) {
                Log.error(e);
            });
        }

        ///  End Application Files ///

        $scope.help_viewed = window.localStorage.getItem('help_viewed');

        if ($scope.help_viewed !== null) {
            $state.go('app.help');
        } else {
            Log.debug('[HomeCtrl] Help viewed is: ' + $scope.help_viewed);
        }

        // init
        getFileList();
        $interval(getFileList, 1000 * 60 * 60);

    }]);