angular.module('croplandsApp.controllers')
    .controller("RegisterController", ['User', 'countries', '$scope', '$state', 'Log', function (User, countries, $scope, $state, Log) {
        var obvious = ['crops', 'cropland', 'rice', 'usgs', 'nasa', 'corn', 'wheat', 'landsat', 'modis', 'africa', 'un', 'fao', 'remote', 'sensing', 'farm', 'field'];

        if (User.isLoggedIn()) {
            $state.go('app.home');
        }

        angular.extend($scope, {
            countries: countries,
            success: null,
            message: null
        });

        function setMessage(message, success) {
            $scope.success = success;
            $scope.message = message;
        }

        $scope.$watch('password', checkPasswords);
        $scope.$watch('passwordConfirm', checkPasswords);


        function checkPasswords() {
            if (window.zxcvbn === undefined) {
                Log.debug('[RegisterController] zxcvbn undefined.');
                $scope.entropy = 0;
                return;
            }

            if ($scope.password && $scope.password.length >= 8) {
                $scope.entropy = zxcvbn($scope.password, obvious).entropy;
                $scope.passwordIsValid = $scope.entropy > 15;
                $scope.passwordsMatch = $scope.password === $scope.passwordConfirm;
                Log.debug('[RegisterController] Password entropy: ' + $scope.entropy);

                if (!$scope.passwordIsValid) {
                    $scope.passwordMessage = 'Password is too simple.';
                } else if (!$scope.passwordsMatch) {
                    $scope.passwordMessage = 'Passwords do not match.';
                } else {
                    $scope.registration.password = $scope.password;
                    $scope.passwordMessage = '';
                }
            }
            else {
                $scope.entropy = 0;
                $scope.passwordMessage = '';
            }

            if ($scope.passwordMessage.length) {
                Log.debug('[RegisterController] ' + $scope.passwordMessage);
            }

        }

        // Get List of Countries
        $scope.countries = countries;

        $scope.register = function () {
            $scope.busy = true;
            User.register($scope.registration)
                .then(function (response) {
                    $scope.busy = false;
                    setMessage(response.description, true);
                    $scope.successs = true;
                    $state.go('app.home');
                }, function (response) {
                    if (response) {
                        setMessage(response.description, false);
                    }
                    else {
                        setMessage('Something went wrong', false);
                    }
                    $scope.busy = false;
                });
        };

    }]);