angular.module('croplandsApp.controllers')
    .controller('MapCtrl', function ($scope, Location, Log, $cordovaGeolocation, GPS) {
        $scope.map = {
            defaults: {
                tileLayer: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                maxZoom: 25,
                zoomControlPosition: 'topright'
            },
            paths: {
            },
            markers: {},
            center: {
                lat: 0,
                lng: 0,
                zoom: 2
            }
        };

        $scope.$watch(function () {
            return GPS.getPositions().length;
        }, function () {
            var path = {
                color: '#00FFFF',
                latlngs: [],
                opacity: 0.4,
                width: 1
            };

            var positions = GPS.getPositions();

            positions = _.slice(positions, Math.max(positions.length - 1000, 0));
            _.each(positions, function (position) {
                var hash = position.timestamp,
                    latlng = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                path.latlngs.push(latlng);
            });
            $scope.map.paths.path = path
        });

        $scope.$watch(function () {
            return Location.getCountOfLocations();
        }, function () {
            Location.getAll().then(function (data) {
                for (var i = 0; i < data.length; i++) {
                    $scope.map.markers[data[i].id] = {lat: data[i].lat, lng: data[i].lng};
                }
            });
        });

    });