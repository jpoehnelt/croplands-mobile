angular.module('croplandsApp.services')
    .factory('Log', ['$log', function ($log) {
        var self = this, SIZE = 10000;

        var logHistory = [];

        function rotateLog() {
            if (logHistory.length > (SIZE * 2)) {
                logHistory = logHistory.slice(logHistory.length - SIZE, logHistory.length);
                self.debug('[Log] Slicing array to length: ' + logHistory.length.toString());
            }
        }

        function log(message, type) {
            message = '[' + _.capitalize(type) + ']' + message;

            logHistory.push({
                message: message,
                type: type,
                date: Date.now()
            });

            console.log(message);

            rotateLog();
        }

        self.info = function (message) {
            log(message, 'info');
        };

        self.debug = function (message) {
            log(message, 'debug');
        };

        self.warning = function (message) {
            log(message, 'warning');

        };

        self.error = function (message) {
            log(message, 'error');

        };

        self.exception = function (exception) {
            var format = function (stackframes) {
                var message = stackframes.map(function (sf) {
                    return sf.toString();
                }).join('\n');

                log(message, 'exception');
            };

            var error = function (err) {
                log(err.message, 'exception');
            };

            StackTrace.fromError(exception).then(format).catch(error);
        };

        self.messages = function () {
            return logHistory;
        };

        return self;
    }]);