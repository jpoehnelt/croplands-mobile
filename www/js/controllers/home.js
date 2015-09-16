angular.module('croplandsApp.controllers')
    .controller('HomeCtrl', ['$scope', '$state', 'Location', '$http', 'Log', function ($scope, $state, Location, $http, Log) {

        $scope.messages = Log.messages();

        $scope.canSync = Location.canSync;
        $scope.sync = function () {
            Location.sync().then(function () {
                Log.info("Sync complete");
            });
        };

        var help_viewed = window.localStorage.getItem('help_viewed');
        if (help_viewed !== true) {
            $state.go('app.help');
        }
    }]);