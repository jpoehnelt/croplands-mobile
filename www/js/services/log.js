angular.module('croplandsApp.services')
    .factory('Log', ['$log', function ($log) {
        var self = this, SIZE = 10000;

        var log_array = [];
        
        function rotateLog() {
            if (log_array.length > (SIZE * 2)) {
                log_array = log_array.slice(log_array.length - SIZE, log_array.length);
                self.debug('[Log] Slicing array to length: ' + log_array.length.toString());
            }
        }

        self.info = function (message) {
            console.log(message);
            log_array.push({
                message: message,
                type: 'info',
                date: Date.now()
            });

            rotateLog();
        };

        self.debug = function (message) {
            console.log(message);
            log_array.push({
                message: message,
                type: 'debug',
                date: Date.now()
            });
            rotateLog();
        };

        self.warning = function (message) {
            console.log(message);
            log_array.push({
                message: message,
                type: 'warning',
                date: Date.now()
            });
            rotateLog();
        };

        self.error = function (message) {
            console.log(message);
            log_array.push({
                message: message,
                type: 'error',
                date: Date.now()
            });
            rotateLog();
        };

        self.exception = function (message, url, line, lineNumber, column, error) {

            message = 'Error: ' + message + ' Script: ' + url + ' Line: ' + lineNumber
                + ' Column: ' + column + ' StackTrace: ' + error;

            $log.error(message);
            log_array.push({
                message: message,
                type: 'exception',
                date: Date.now()
            });
            rotateLog();
        };

        window.onerror = function (message, url, line, lineNumber, column, error) {
//            self.exception(message, url, line, lineNumber, column, error);
            console.log('[Log] Exception: window.onerror');
            return true;
        };

        console.log(window.onerror);

        self.messages = function () {
            return log_array;
        };


        return self;
    }]);