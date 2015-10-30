describe('Home Controller', function () {

    beforeEach(module('croplandsApp'));
    beforeEach(module('croplandsApp.services'));
    beforeEach(module('croplandsApp.controllers'));
    beforeEach(module('templates'));

    var ctrl,
        scope, state, rootScope, $q, Location;


    beforeEach(inject(function ($rootScope, $controller, $state, _$q_, _Location_) {
        rootScope = $rootScope;
        scope = $rootScope.$new();
        state = $state;
        $q = _$q_;
        Location = _Location_;

        ctrl = $controller('HomeCtrl', {
            $scope: scope,
            $state: state
        });
    }));

    describe('test dashboard stats', function () {

        it('stats should be empty initially', function () {
            expect(Object.keys(scope.landUseTypes).length).toBe(0);
            expect(Object.keys(scope.cropTypes).length).toBe(0);
            expect(Object.keys(scope.waterSources).length).toBe(0);
        });

        it('stats should update properly', function () {

            var locations = [
                {
                    synced: 0,
                    json: JSON.stringify({
                        records: [
                            {
                                land_use_type: 1,
                                water: 2,
                                crop_primary: 3
                            }
                        ]
                    })
                }
            ];

            spyOn(Location, "getCountOfLocations").and.callFake(function () {
                return locations.length;
            });

            spyOn(Location, "getCountOfLocationsToSync").and.callFake(
                function () {
                    var count = 0;
                    _.each(locations, function (location) {
                        if (!location.synced) {
                            count++;
                        }
                    });
                    return count;
                }
            );

            spyOn(Location, "getAll").and.returnValue($q.when(locations));

            scope.$digest();
            expect(Object.keys(scope.landUseTypes).length).toBe(1);
            expect(scope.landUseTypes[1]).toBe(1);
            expect(Object.keys(scope.cropTypes).length).toBe(1);
            expect(scope.cropTypes[3]).toBe(1);
            expect(Object.keys(scope.waterSources).length).toBe(1);
            expect(scope.waterSources[2]).toBe(1);
            expect(scope.countSynced).toBe(0);
            expect(scope.countNotSynced).toBe(1);

            locations.push({
                synced: 1,
                json: JSON.stringify({
                    records: [
                        {
                            land_use_type: 1,
                            water: 2,
                            crop_primary: 3
                        }
                    ]
                })
            });

            console.log(Location.getCountOfLocations());
            scope.$digest();
            expect(Object.keys(scope.landUseTypes).length).toBe(1);
            expect(scope.landUseTypes[1]).toBe(2);
            expect(Object.keys(scope.cropTypes).length).toBe(1);
            expect(scope.cropTypes[3]).toBe(2);
            expect(Object.keys(scope.waterSources).length).toBe(1);
            expect(scope.waterSources[2]).toBe(2);
            expect(scope.countSynced).toBe(1);
            expect(scope.countNotSynced).toBe(1);

        });


    });

    describe('help page', function () {
        it('should be displayed if help not previously viewed', function () {
            scope.$digest();
            expect(state.$current.name).toBe('app.help');
        });
    });

});