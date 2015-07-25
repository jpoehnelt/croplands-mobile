angular.module('croplandsApp')
    .directive('rotate', function () {
        return {
            link: function (scope, element, attrs) {
                // watch the degrees attribute, and update the UI when it changes
                scope.$watch(attrs.degrees, function (degree) {
                    //transform the css to rotate based on the new degree
                    element.css({
                        '-moz-transform': 'rotate(' + degree + 'deg)',
                        '-webkit-transform': 'rotate(' + degree + 'deg)',
                        '-o-transform': 'rotate(' + degree + 'deg)',
                        '-ms-transform': 'rotate(' + degree + 'deg)',
                        'display': 'block'
                    });
                });
            }
        }
    });
