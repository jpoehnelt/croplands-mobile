describe('Collect Controller', function () {

    beforeEach(module('croplandsApp'));
    beforeEach(module('croplandsApp.services'));
    beforeEach(module('croplandsApp.controllers'));
    beforeEach(module('templates'));

    var ctrl,
        scope, CompassMock, rootScope;

    beforeEach(function () {
        var heading = {
            trueHeading: 0,
            magneticHeading: 10
        };

        CompassMock = {
            getHeading: function () {
                return heading;
            },
            setHeading: function (n) {
                heading = n;
            }
        }
    });

    beforeEach(inject(function ($rootScope, $controller) {
        scope = $rootScope.$new();
        rootScope = $rootScope;
        ctrl = $controller('CollectCtrl', {
            $scope: scope,
            Compass: CompassMock
        });
    }));

    describe('user has accurate todo list', function () {

        it('todo list should not be complete at start', function () {
            expect(scope.isValid()).toBe(false);
            console.log('todo list should not be complete at start');
        });

        it('should not need to collect more gps positions if 10', function () {
            for (var i = 0; i < 10; i++) {
                scope.gps.locations.push({lat: 0, lon: 0, accuracy: 10});
            }
            scope.todo();
            expect(scope.todoList.gps.complete).toBe(true);
            console.log('should not need to collect more gps positions if 10');
        });

        it('should not need bearing if distance to center is "0" ', function () {
            scope.location.distance = "0";
            scope.todo();
            expect(scope.todoList.bearing.complete).toBe(true);
            console.log('should not need bearing if distance to center is "0" ');
        });

        it('should not need bearing if distance to center is 0 ', function () {
            scope.location.distance = 0;
            scope.todo();
            expect(scope.todoList.bearing.complete).toBe(true);
            console.log('should not need bearing if distance to center is 0 ');
        });

        it('should need bearing if distance to center is not 0 ', function () {
            scope.location.distance = 10;
            scope.todo();
            expect(scope.todoList.bearing.complete).toBe(false);
            console.log('should need bearing if distance to center is not 0 ')
        });

        it('should not need to do anything else', function () {
            for (var i = 0; i < 10; i++) {
                scope.gps.locations.push({lat: 0, lon: 0, accuracy: 10});
            }
            scope.record.land_use_type = 1;
            scope.photos.push({});
            scope.location.distance = 100;
            scope.location.bearing = 90;

            scope.todo();
            _.each(scope.todoList, function (task) {
                expect(task.complete).toBe(true);
            });

            expect(scope.isValid()).toBe(true);
            console.log('should not need to do anything else');
        });

    });

    describe('$scope.$watch record.land_use_type', function () {
        it('should not have cropland attributes if not crop land use', function () {
            scope.record.land_use_type = 0; // anything but 1
            scope.$digest();
            expect(scope.record.water).toBe(undefined);
            expect(scope.record.intensity).toBe(undefined);
            expect(scope.record.crop_primary).toBe(undefined);
            expect(scope.record.crop_secondary).toBe(undefined);
        });
        it('should have cropland attributes if cropland', function () {
            scope.record.land_use_type = 1;
            scope.$digest();
            expect(scope.record.water).toBe(0);
            expect(scope.record.intensity).toBe(0);
            expect(scope.record.crop_primary).toBe(0);
            expect(scope.record.crop_secondary).toBe(0);
        });
    });

    describe('capture heading', function () {
        it('should set bearing if heading returned', function () {
            scope.captureHeading();
            expect(scope.location.bearing).toBe(CompassMock.getHeading().trueHeading)
        });

        it('should set bearing to magneticHeading if trueHeading returned', function () {
            CompassMock.setHeading({magneticHeading: 10});
            scope.captureHeading();
            expect(scope.location.bearing).toBe(CompassMock.getHeading().magneticHeading)
        });
    });

    describe('gps positions', function () {
        var position = {
            coords: {
                accuracy: 1,
                lat: 0,
                lon: 10
            },
            timestamp: Date.now()
        };

        it('should be caught from the event', function () {
            scope.gps.on = true;
            rootScope.$broadcast('GPS.on', position);
            console.log(scope.gps.locations);
            expect(scope.gps.locations.length).toBe(1);
        });

        it('should not be logged if scope.gps.on is false', function () {
            scope.gps.on = false;
            rootScope.$broadcast('GPS.on', position);
            expect(scope.gps.locations.length).toBe(0);
        });
    });


});