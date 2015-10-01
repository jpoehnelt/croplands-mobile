angular.module('croplandsApp.controllers')
    .controller('HomeCtrl', ['$scope', '$state', 'Location', '$cordovaNetwork', 'Log','$cordovaSocialSharing','Backup', function ($scope, $state, Location, $cordovaNetwork, Log, $cordovaSocialSharing, Backup) {
        angular.extend($scope, {
            messages: Log.messages(),
            countOfLocations: Location.getCountOfLocations,
            countOfLocationsToSync: Location.getCountOfLocationsToSync,
            records: [],
            landCover: {},
            cropTypes: {},
            waterSources: {},
            showCropTypes: true
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

        $scope.sendLogs = function () {
            Backup.getLogFile().then(function (result) {

                $cordovaSocialSharing
                    .share('Log for Global Croplands App', '', result.nativeURL) // Share via native share sheet
                    .then(function(result) {
                        console.log()
                    }, function(err) {
                        // An error occured. Show a message to the user
                    });
            }, function (error) {
                Log.error(error);
            });

        };

        var help_viewed = window.localStorage.getItem('help_viewed');
        Log.debug('[HomeCtrl] Help viewed is: ' + help_viewed);

        if (!help_viewed) {
            $state.go('app.help');
        }

        // init
        getAllLocations();

    }]);