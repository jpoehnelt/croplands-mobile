angular.module('croplandsApp.controllers')
    .controller('HomeCtrl', ['$scope', '$stateParams', 'Location', '$http','Log','$q', 'Photos', function ($scope, $stateParams, Location, $http, Log, $q, Photos) {

        $scope.messages = Log.messages();

        $scope.canSync = Location.canSync;
        $scope.sync = function () {
            Location.sync().then(function(){
                Log.info("Sync complete");
            });

        };
    }]);