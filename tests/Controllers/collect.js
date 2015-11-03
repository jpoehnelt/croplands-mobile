describe('Collect Controller', function () {

    beforeEach(module('croplandsApp'));
    beforeEach(module('croplandsApp.services'));
    beforeEach(module('croplandsApp.controllers'));
    beforeEach(module('templates'));

    var ctrl,
        scope, CompassMock, rootScope, cordovaCamera, $q, state;

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

    beforeEach(inject(function ($rootScope, $controller, $cordovaCamera, _$q_, $state) {
        scope = $rootScope.$new();
        rootScope = $rootScope;
        cordovaCamera = $cordovaCamera;
        state = $state;
        $q = _$q_;
        ctrl = $controller('CollectCtrl', {
            $scope: scope,
            Compass: CompassMock,
            $cordovaCamera: cordovaCamera,
            $state: state
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

        it('should not set if no result', function () {
            CompassMock.setHeading(undefined);
            scope.captureHeading();
            expect(scope.location.bearing).toBe(null);
        });
    });

    describe('gps positions', function () {
        var position = {
            coords: {
                accuracy: 1,
                latitude: 0,
                longitude: 10
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

        it('should be cleared with $scope.gpsClear', function () {
            scope.gps.on = true;
            rootScope.$broadcast('GPS.on', position);
            expect(scope.gps.locations.length).toBe(1);
            scope.gpsClear();
            expect(scope.gps.locations.length).toBe(0);
        });

        it('should have the correct mean', function () {
            expect(scope.location.lat).toBe(null);
            expect(scope.location.lon).toBe(null);
            scope.gps.on = true;
            rootScope.$broadcast('GPS.on', position);
            scope.$digest();
            expect(scope.location.lat).toBe(position.coords.latitude);
            expect(scope.location.lon).toBe(position.coords.longitude);

            var position2 = {
                coords: {
                    accuracy: 1,
                    latitude: 10,
                    longitude: 0
                },
                timestamp: Date.now()
            };
            rootScope.$broadcast('GPS.on', position2);
            scope.$digest();
            expect(scope.gps.locations.length).toBe(2);
            expect(scope.location.lat).toBe((position.coords.latitude + position2.coords.latitude) / 2);
            expect(scope.location.lon).toBe((position.coords.longitude + position2.coords.longitude) / 2);

        })
    });

    describe('photos', function () {
        var uri = 'asdfkadsfjka.jpg';

        beforeEach(function () {
            spyOn(cordovaCamera, "getPicture").and.returnValue($q.when(uri));
            window.Camera = {
                DestinationType: {
                    NATIVE_URI: 'asdf'
                },
                PictureSourceType: {
                    CAMERA: 'asdf'
                }
            }
        });

        it('should be capture with $scope.takePhoto', function () {
            scope.takePhoto();
            scope.$digest();
            expect(scope.photos.length).toBe(1);
            expect(scope.photos[0]).toBe(uri);
        });

        it('should be able to remove photo', function () {
            scope.takePhoto();
            scope.$digest();
            scope.removePhoto(0);
            scope.$digest();
            expect(scope.photos.length).toBe(0);
        });

    });

    describe('saving', function () {

        beforeEach(function () {
            spyOn(state, "go").and.returnValue();

            for (var i = 0; i < 10; i++) {
                scope.gps.locations.push({lat: 0, lon: 0, accuracy: 10});
            }
            scope.record.land_use_type = 1;
            scope.record.crop_primary = 1;
            scope.photos.push('asdfasdf.jpg');
            scope.location.distance = 100;
            scope.location.bearing = 90;

            scope.gps.on = true;
        });

        it('should set to not capture gps points', function () {
            scope.save();
            expect(scope.gps.on).toBe(false);
        });

        // TODO More Tests
    });


});