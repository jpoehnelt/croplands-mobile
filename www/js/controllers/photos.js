angular.module('croplandsApp.controllers')
    .controller('PhotosCtrl', ['$scope', '$stateParams', 'Location', '$http', 'Log', '$q', 'Photos', function ($scope, $stateParams, Location, $http, Log, $q, Photos) {
        $scope.$watch(function () {
            Photos.getAll().then(function (result) {
                return result;
            });
        }, function (photos, old) {
            Photos.getAllUnsynced().then(function (result) {
                $scope.photos = [];
                for (var i = 0; i < result.length; i++) {
                    var photo = result[i];
                    photo.location_json = JSON.parse(photo.location_json);
                    $scope.photos.push(photo);
                }
                Log.debug($scope.photos);
            });
        }, true);
    }]);