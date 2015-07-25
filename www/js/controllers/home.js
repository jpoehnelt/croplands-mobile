angular.module('croplandsApp.controllers')
    .controller('HomeCtrl', ['$scope', '$stateParams', 'Location', '$http', 'Log', function ($scope, $stateParams, Location, $http, Log) {

        $scope.messages = Log.messages();

        $scope.canSync = Location.canSync;
        $scope.sync = function () {
            Location.sync().then(function () {
                Log.info("Sync complete");
            });
        };
    }]);