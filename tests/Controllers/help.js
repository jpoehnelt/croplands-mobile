describe('Help Controller', function () {

    beforeEach(module('croplandsApp'));
    beforeEach(module('croplandsApp.services'));
    beforeEach(module('croplandsApp.controllers'));
    beforeEach(module('templates'));

    var ctrl,
        scope, rootScope;

    beforeEach(inject(function ($rootScope, $controller) {
        rootScope = $rootScope;
        scope = $rootScope.$new();

        ctrl = $controller('HelpCtrl', {
            $scope: scope
        });
    }));


    it('help should be marked as viewed', function () {
        expect(window.localStorage.getItem('help_viewed')).toBe('true');
    });

});