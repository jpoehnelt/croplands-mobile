// Karma configuration
// Generated on Sat Sep 26 2015 11:37:21 GMT-0700 (MST)

module.exports = function (config) {
    config.set({

        browserNoActivityTimeout: 100000,
        browserDisconnectTimeout: 100000,
        captureTimeout: 100000,

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
            'www/lib/angular.js',
            'www/lib/angular-animate.js',
            'www/lib/angular-mocks.js',
            'www/lib/angular-resource.js',
            'www/lib/angular-sanitize.js',
            'www/lib/angular-ui-router.js',
            'www/lib/ionic.js',
            'www/lib/ionic-angular.js',
            'www/lib/croplands-mappings.js',
            'www/lib/ng-cordova.min.js',
            'www/lib/lodash.js',
            'www/lib/tokml.js',
            'www/lib/zxcvbn.js',
            'www/js/*.js',
            'www/js/**/*.js',
            'tests/**/*.js',
            'www/**/*.html'

        ],

        // list of files to exclude
        exclude: [
        ],

        // coverage reporter generates the coverage
        reporters: ['coverage'],

        preprocessors: {
            // source files, that you wanna generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            'www/js/**/*.js': ['coverage'],
            '**/*.html': ['ng-html2js']
        },

        ngHtml2JsPreprocessor: {
            stripPrefix: 'www/',
            moduleName: 'templates'
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_DEBUG,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],

        customLaunchers: {
            "SL_Android_5.0": {
                base: "SauceLabs",
                browserName: "Android",
                platform: "Linux",
                version: "5.0"
            },
            sl_chrome: {
                base: 'SauceLabs',
                browserName: 'chrome',
                platform: "Linux"
            }
        },

        sauceLabs: {
            testName: 'Mobile App Unit Tests'
        },
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });

    if (process.env.TRAVIS) {
        config.browsers = Object.keys(config.customLaunchers);
        config.reporters.push('coveralls');
        config.coverageReporter = {
            type: 'lcov',
            dir: 'coverage/'
        }
    } else {
        config.reporters.push('progress');
    }
};
