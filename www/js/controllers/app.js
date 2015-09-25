angular.module('croplandsApp.controllers')
    .controller('AppCtrl', function ($scope, $timeout, $state, $cordovaDevice, $cordovaGeolocation, $cordovaNetwork, GPS, $ionicViewSwitcher, User, Log, Location) {

        $scope.go = function (state) {
            if (state === 'app.home') {
                $ionicViewSwitcher.nextDirection('back'); // 'forward', 'back', etc.
            } else {
                $ionicViewSwitcher.nextDirection('forward'); // 'forward', 'back', etc.
            }

            $state.go(state);
        };

        try {
            $scope.platform = $cordovaDevice.getPlatform();
        }
        catch (e) {
            $scope.platform = 'unknown';
        }

        $scope.$watch(function () {
            return GPS.getFix();
        }, function (val) {
            if (val > 0) {
                $scope.gpsFix = Math.round(val) + ' m';
            } else {
                $scope.gpsFix = 'no fix';
            }
        });

        $scope.isLoggedIn = User.isLoggedIn;
        $scope.logout = User.logout;

        $scope.$on('Compass.heading', function (e, result) {
            $scope.heading = result.trueHeading || result.magneticHeading;
            $scope.ionNavigationIconRotate = 360 - $scope.heading - 45;
        });

        $scope.$watch($cordovaNetwork.getNetwork, networkWatch);
        $scope.$watch(function () {
            return $state.current.name;
        }, networkWatch);

        function networkWatch() {
            var networkState = $cordovaNetwork.getNetwork();

            if (networkState === 'wifi' || networkState === 'ethernet') {
                Log.debug('[AppController] Device has network connection.');
                if (User.isLoggedIn()) {
                    Log.debug('[AppController] User is logged in.');
                    Location.sync();
                } else {
                    var cannotRedirect = ['app.help', 'app.collect', 'app.login', 'app.forgot', 'app.register'];
                    Log.debug('[AppController] Current State Name: ' + $state.current.name);
                    if(!_.contains(cannotRedirect, $state.current.name)) {
                        Log.debug('[AppController] Redirecting to login page.');
                        $scope.go('app.login');
                    }
                }
            }
        }

    });