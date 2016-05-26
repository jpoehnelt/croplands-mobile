angular.module('croplandsApp.controllers')
    .controller('AppCtrl', function ($scope, $interval, $state, $cordovaDevice, $cordovaNetwork, GPS, $ionicViewSwitcher, User, Log, Location, Settings) {

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
//            Log.debug('[GPS] Accuracy: ' + val + ' Fix: ' + $scope.gpsFix);
        });

        $scope.isLoggedIn = User.isLoggedIn;
        $scope.logout = User.logout;

        $scope.$on('Compass.heading', function (e, result) {
            $scope.heading = result.trueHeading || result.magneticHeading;
            $scope.ionNavigationIconRotate = 360 - $scope.heading - 45;
        });

        function getNetwork() {
            var network;
            try {
                network = $cordovaNetwork.getNetwork();
            } catch (e) {
                network = 'unknown';
            }
            return network;
        }

        function getOnlineStatus() {
            try {
                return $cordovaNetwork.isOnline();
            } catch (e) {
                Log.debug('[AppController] Could not check online status.');
                return false;
            }
        }

        $scope.$watch(function () {
            return [$state.current.name, User.isLoggedIn(), getNetwork(), getOnlineStatus()];
        }, watch, true);

        $interval(function () {
            Log.debug('[AppController] Interval Check.');
            watch([$state.current.name, User.isLoggedIn(), getNetwork(), getOnlineStatus()]);
        }, 1000*300, 0);

        function watch(args) {
            var page = args[0],
                userLoggedIn = args[1],
                networkState = args[2],
                isOnline = args[3],
                isWifi = networkState === 'wifi',
                connected = false,
                cannotRedirect = ['app.help', 'app.collect', 'app.login', 'app.forgot', 'app.register'];

            if (!Settings.get('NETWORK_DATA')) {
                connected = isWifi;
            } else {
                connected = isOnline;
            }

            Log.debug('[AppController] page: ' + page + ' userLoggedIn: ' + userLoggedIn + ' wifi: ' + isWifi + ' online: ' + isOnline + ' connected: ' + connected);

            if (connected && userLoggedIn) {
                Log.debug('[AppController] Attempting to sync.');
                Location.sync();
            }

            if (connected && !userLoggedIn) {
                // if current page not in the list of pages the user can visit without login, redirect to login
                if(!_.includes(cannotRedirect, page)) {
                    Log.debug('[AppController] Redirecting to login page.');
                    $scope.go('app.login');
                }
            }

            if (!connected) {
                Log.debug('[AppController] Waiting for connection.');
            }

        }

    });