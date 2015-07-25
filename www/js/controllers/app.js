angular.module('croplandsApp.controllers')
    .controller('AppCtrl', function ($scope, $ionicModal, $timeout, $state, $cordovaDevice, $cordovaGeolocation, $rootScope, GPS) {
        // Form data for the login modal
        $scope.loginData = {};

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/login.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal = modal;
        });

        // Triggered in the login modal to close it
        $scope.closeLogin = function () {
            $scope.modal.hide();
        };

        // Open the login modal
        $scope.login = function () {
            $scope.modal.show();
        };

        // Perform the login action when the user submits the login form
        $scope.doLogin = function () {
            console.log('Doing login', $scope.loginData);

            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system
            $timeout(function () {
                $scope.closeLogin();
            }, 1000);
        };

        $scope.go = function (state) {
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

        $scope.$on('Compass.heading', function (e, result) {
            $scope.heading = result.trueHeading || result.magneticHeading;
            $scope.ionNavigationIconRotate = 360 - $scope.heading - 45;
        });


    });