angular.module('croplandsApp.controllers')
    .controller("LoginController", ['$scope', 'Log', 'User', '$state', function ($scope, Log, User, $state) {

    function setMessage(message, success) {
        $scope.success = success;
        $scope.message = message;
    }

    $scope.login = function (valid) {
        $scope.message = null;

        $scope.busy = true;
        if (!valid) {
            setMessage('Invalid Data', false);
            $scope.busy = false;
            return;
        }
        User.login($scope.email, $scope.password).then(function () {
            setMessage('You have successfully Logged in.', true);
            $scope.busy = false;
            $scope.email = '';
            $scope.password = '';

            $state.go('app.home');
            
        }, function (response) {
            if (response && response.description) {
                setMessage(response.description, false);
            }
            else {
                setMessage('Something went wrong', false);
            }
            $scope.busy = false;
        });
    };

}]);