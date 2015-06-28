angular.module('screenOrientation', [])
    .factory('screenOrientationService', ['$log', function ($log) {
        var self = this,
            orientations = {
                "portrait-primary": 0,
                "portrait-secondary": 180,
                "landscape-primary": 90,
                "landscape-secondary": 270
            };

        if (!screen) {
            $log.warn('screenOrientationService requires: https://github.com/yoik/cordova-yoik-screenorientation');
        }

        self.getOrientation = function () {
            var orientation = screen.orientation;

            if (orientation.type) {
                return orientation.type;
            }
            return screen.orientation;
        };

        self.getDegrees = function () {
            var orientation = screen.orientation;

            if (orientation.angle) {
                return orientation.angle;
            }
            return orientations[self.getOrientation()]
        };

        return self;
    }]);
