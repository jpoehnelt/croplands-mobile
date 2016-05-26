angular.module('croplandsApp.controllers')
    .controller('SettingsCtrl', ['$scope', '$stateParams', 'Location', 'Settings', 'Log', function ($scope, $stateParams, Location, Settings, Log) {

        $scope.settings = Settings.getAll();

        $scope.$watch('settings', function (settings) {
            console.log(Settings.setAll(settings));
        }, true);

    }]);