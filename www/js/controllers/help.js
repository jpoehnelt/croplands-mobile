angular.module('croplandsApp.controllers')
    .controller('HelpCtrl', ['$scope', '$stateParams', 'Location', '$http', 'Log', function ($scope, $stateParams, Location, $http, Log) {
        window.localStorage.setItem('help_viewed', true);
    }]);