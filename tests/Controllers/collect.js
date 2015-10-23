describe('Collect Controller', function () {

    beforeEach(module('croplandsApp'));
    beforeEach(module('croplandsApp.services'));
    beforeEach(module('croplandsApp.controllers'));

    var ctrl,
        scope;

    beforeEach(inject(function ($rootScope, $controller) {
        scope = $rootScope.$new();
        ctrl = $controller('CollectCtrl', {
            $scope: scope
        });
    }));

    describe('user has accurate todo list', function () {
        it('todo list should not be complete at start', function () {
            _.each(scope.todoList, function (task) {
                expect(task.complete).toBe(false);
            });
        });

        it('shold not need to collect more gps positions if 10', function () {
            for (var i = 0; i < 10; i++) {
                scope.gps.locations.push({lat: 0, lon: 0, accuracy: 10});
            }
            scope.todo();
            expect(scope.todoList.gps.complete).toBe(true);
        });

        it('should not need bearing if distance to center is "0" ', function () {
            scope.location.distance = "0";
            scope.todo();
            expect(scope.todoList.bearing.complete).toBe(true);
        });

        it('should not need bearing if distance to center is 0 ', function () {
            scope.location.distance = 0;
            scope.todo();
            expect(scope.todoList.bearing.complete).toBe(true);
        });

        it('should need bearing if distance to center is not 0 ', function () {
            scope.location.distance = 10;
            scope.todo();
            expect(scope.todoList.bearing.complete).toBe(false);
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
        });

    });

});