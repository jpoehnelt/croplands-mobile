describe('App Controller', function () {

    beforeEach(module('croplandsApp'));
    beforeEach(module('croplandsApp.services'));
    beforeEach(module('croplandsApp.controllers'));
    beforeEach(module('templates'));

    var ctrl,
        scope, state, GPSMock, rootScope;

    beforeEach(function () {
        var fix;
        GPSMock = {
            getFix: function () {
                return fix;
            },
            setFix: function (n) {
                fix = n;
            }
        }
    });

    beforeEach(inject(function ($rootScope, $controller, $state) {
        rootScope = $rootScope;
        scope = $rootScope.$new();
        state = $state;

        ctrl = $controller('AppCtrl', {
            $scope: scope,
            GPS: GPSMock,
            $state: state
        });
    }));

    describe('test GPS fix', function () {

        it('gps fix should handle different values', function () {
            expect(scope.gpsFix).toBe(undefined);
            scope.$digest();
            expect(scope.gpsFix).toBe('no fix');
            GPSMock.setFix('10');
            scope.$digest();
            expect(scope.gpsFix).toBe('10 m');

        });


    });

    describe('state', function () {
        it('state.go should change state', function () {
            scope.go('app.home');
            scope.$digest();
            expect(state.$current.name).toBe('app.home');
            scope.go('app.login');
            scope.$digest();
            expect(state.$current.name).toBe('app.login');
        });

    });

    describe('compass should update', function () {
        it('$scope.$on should have triggered compass update with trueHeading', function () {
            var heading = 100;
            rootScope.$broadcast('Compass.heading', {trueHeading: heading});
            expect(scope.heading).toBe(heading);
        });

        it('$scope.$on should have triggered compass update with magneticHeading', function () {
            var heading = 100;
            rootScope.$broadcast('Compass.heading', {magneticHeading: heading});
            expect(scope.heading).toBe(heading);
        });

        it('$scope.$on should have triggered compass update with trueHeading getting priority', function () {
            var heading = 100;
            rootScope.$broadcast('Compass.heading', {trueHeading: heading, magneticHeading: heading + 1});
            expect(scope.heading).toBe(heading);
        });

    });
});