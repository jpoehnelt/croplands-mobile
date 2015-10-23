describe("Midway: Testing Modules", function() {
    describe("App Module:", function() {

        var module;
        beforeEach(function() {
            module = angular.module("croplandsApp");
        });

        it("should be registered", function() {
            expect(module).not.toBe(null);
        });

        describe("Dependencies:", function() {

            var deps;
            var hasModule = function(m) {
                return deps.indexOf(m) >= 0;
            };

            beforeEach(function() {
                deps = module.value('croplandsApp').requires;
                console.log(deps);
            });

            //you can also test the module's dependencies
            it("should have App.Controllers as a dependency", function() {
                expect(hasModule('croplandsApp.controllers')).toBe(true);
            });

            it("should have App.Services as a dependency", function() {
                expect(hasModule('croplandsApp.services')).toBe(true);
            });
        });
    });
});