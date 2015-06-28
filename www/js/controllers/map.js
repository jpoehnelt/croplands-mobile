angular.module('croplandsApp.controllers')
    .controller('MapCtrl', function ($scope, Location, Log) {
        $scope.map = {
            defaults: {
                tileLayer: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                maxZoom: 18,
                zoomControlPosition: 'topright',
                path: {
                    weight: 10,
                    color: '#800000',
                    opacity: 1
                }
            },
            markers: {},
            center: {
                lat: 0,
                lng: 0,
                zoom: 2
            }
        };

        $scope.$watch(function() {
            return Location.getCountOfLocations();
        }, function () {
            Location.getAll().then(function (data) {
                Log.debug(data);
                for (var i = 0; i < data.length; i++) {
                    Log.debug(data[i]);
                    $scope.map.markers[data[i].id] = {lat: data[i].lat, lng: data[i].lng};
                }
                Log.debug($scope.map.markers);
            });
        });

    });