angular.module('croplandsApp.services')
    .factory('Log', [function () {
        var self = this, SIZE = 10;

        var _queue = [];

        function shift() {
            while (_queue.length > SIZE) {
                _queue.shift();
            }
        }

        self.info = function (message) {
            console.log(message);
            _queue.push({
                message: message,
                type: 'info',
                date: Date.now()
            });
            shift();
        };

        self.debug = function (message) {
            console.log(message);
//            _queue.push({
//                message: message,
//                type: 'debug',
//                date: Date.now()
//            });
//            shift();
        };

        self.warning = function (message) {
            console.log(message);

//            _queue.push({
//                message: message,
//                type: 'warning',
//                date: Date.now()
//            });
//            shift();
        };

        self.error = function (message) {
            console.log(message);
//            _queue.push({
//                message: message,
//                type: 'error',
//                date: Date.now()
//            });
//            shift();
        };
        
        self.messages = function () {
            return _queue;
        };

        return self;
    }]);