angular.module('croplandsApp.controllers')
    .controller('HomeCtrl', ['$scope', '$state', 'Location', '$cordovaNetwork', 'Log','$cordovaSocialSharing','Backup','$interval', '$q', function ($scope, $state, Location, $cordovaNetwork, Log, $cordovaSocialSharing, Backup, $interval, $q) {
        angular.extend($scope, {
            messages: Log.messages(),
            countOfLocations: Location.getCountOfLocations,
            countOfLocationsToSync: Location.getCountOfLocationsToSync,
            records: [],
            landCover: {},
            cropTypes: {},
            waterSources: {}
        });

        function getAllLocations() {
            Log.debug('[HomeController] Getting all records.');
            Location.getAllRecords().then(function (locations) {
                $scope.locations = locations;
                countClasses();
            });
        }

        function countClasses() {
            $scope.landUseTypes = {};
            $scope.cropTypes = {};
            $scope.waterSources = {};

            _.each($scope.locations, function (location) {

                if (!$scope.landUseTypes[location.records[0].land_use_type]) {
                    $scope.landUseTypes[location.records[0].land_use_type] = 1;
                } else {
                    $scope.landUseTypes[location.records[0].land_use_type]++;
                }
                
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
        }

        $scope.$watch(function () {
            return Location.getCountOfLocations();
        }, getAllLocations);


        /// Application Files ///
        $scope.share = function(fileEntry) {
            $cordovaSocialSharing
                .share(fileEntry.name, null, fileEntry.nativeURL)
                .then(function(result) {
                    Log.info('[HomeCtrl] Shared ' + fileEntry.name);
                }, function(error) {
                    Log.error(error);
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

        getFileList();
        $interval(getFileList, 1000*60);

        ///  End Application Files ///

        var help_viewed = window.localStorage.getItem('help_viewed');
        Log.debug('[HomeCtrl] Help viewed is: ' + help_viewed);

        if (!help_viewed) {
            $state.go('app.help');
        }

        // init
        getAllLocations();
    }]);