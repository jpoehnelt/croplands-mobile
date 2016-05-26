angular.module('croplandsApp.directives', []);
angular.module('croplandsApp.services', ['ionic', 'ngCordova']);
angular.module('croplandsApp.controllers', ['ionic', 'ngCordova', 'croplandsApp.services', 'croplands.mappings']);

angular.module('croplandsApp', ['ionic', 'croplandsApp.controllers', 'croplandsApp.services'])
    .constant('DB_CONFIG', {
        name: 'DB',
        tables: [
            {
                name: 'location',
                columns: [
                    {name: 'id', type: 'integer primary key'},
                    {name: 'json', type: 'text'},
                    {name: 'lat', type: 'float'},
                    {name: 'lng', type: 'float'},
                    {name: 'synced', type: 'integer default 0'},
                    {name: 'sync_attempts', type: 'integer default 0'}
                ]
            },
            {
                name: 'photo',
                columns: [
                    {name: 'id', type: 'integer primary key'},
                    {name: 'location_id', type: 'integer'},
                    {name: 'filename', type: 'text'},
                    {name: 'json', type: 'text'},
                    {name: 'lat', type: 'float'},
                    {name: 'lng', type: 'float'},
                    {name: 'heading', type: 'float'},
                    {name: 'synced', type: 'integer default 0'},
                    {name: 'sync_attempts', type: 'integer default 0'},
                    {name: 'FOREIGN KEY(location_id) REFERENCES location(id)', type: ''}

                ]
            }
        ]})
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider

            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl'
            })
            .state('app.home', {
                url: "/home",
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: "templates/home.html",
                        controller: 'HomeCtrl'
                    }
                }
            })
            .state('app.collect', {
                url: "/collect",
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: "templates/collect.html",
                        controller: 'CollectCtrl'
                    }
                }
            })
            .state('app.help', {
                url: "/help",
                views: {
                    'menuContent': {
                        templateUrl: "templates/help.html",
                        controller: 'HelpCtrl'
                    }
                }
            })
            .state('app.settings', {
                url: "/settings",
                views: {
                    'menuContent': {
                        templateUrl: "templates/settings.html",
                        controller: 'SettingsCtrl'
                    }
                }
            })
            .state('app.login', {
                url: "/login", views: {
                    'menuContent': {
                        templateUrl: 'templates/account/login.html',
                        controller: 'LoginController'
                    }
                }
            })
            .state('app.register', {
                url: "/register", views: {
                    'menuContent': {
                        templateUrl: 'templates/account/register.html',
                        controller: 'RegisterController' }
                }
            })
            .state('app.forgot', {
                url: "/forgot", views: {
                    'menuContent': {
                        templateUrl: 'templates/account/forgot.html',
                        controller: 'ForgotController'
                    }
                }
            });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/home');
    })
    .run(function (DB) {
        DB.init()
    })
    .run(['$ionicPlatform', 'GPS', 'Log', 'Compass', 'Settings','Backup','$timeout', function ($ionicPlatform, GPS, Log, Compass, Settings, Backup, $timeout) {
        var deviceWatchDelay = 4, compassTimeout, gpsTimeout;

        function cancelTimeouts() {
            Log.debug('[App] Canceling timeouts.');
            if (gpsTimeout) {
                $timeout.cancel(gpsTimeout);
            }
            if (compassTimeout) {
                $timeout.cancel(compassTimeout);
            }
        }

        function activateSensors() {
            cancelTimeouts();

            gpsTimeout = $timeout(function () {
                try{
                    GPS.turnOn();
                    Log.info('[App] Activating GPS.');
                } catch (e) {
                    Log.error(e);
                }
            }, deviceWatchDelay);

            compassTimeout = $timeout(function () {
                try{
                    Compass.turnOn();
                    Log.info('[App] Activating Compass.');
                } catch (e) {
                    Log.error(e);
                }
            }, deviceWatchDelay);
        }

        function deactivateSensors() {
            Log.debug('[App] Deactivate Sensors.');

            cancelTimeouts();


            /// currently do nothing because background gps not allowed by plugin
            if (!Settings.get('BACKGROUND_GPS')) {
                Log.debug('[App] No Background GPS.');
                GPS.turnOff();
            }
            else {
                gpsTimeout = $timeout(function () {
                    try{
                        GPS.turnOff();
                        Log.info('[App] Idling GPS due to inactivity.');
                    } catch (e) {
                        Log.error(e);
                    }
                }, 1000 * 60 * 10); // 3 minutes
            }

            if (!Settings.get('BACKGROUND_COMPASS')) {
                Log.debug('[App] No Background Compass.');
                Compass.turnOff();
            }
            else {
                compassTimeout = $timeout(function () {
                    try{
                        Compass.turnOff();
                        Log.info('[App] Idling Compass due to inactivity.');
                    } catch (e) {
                        Log.error(e);
                    }
                }, 1000 * 60); // 1 minute
            }
        }

        function backup() {
            Backup.backupDB().then(function (success) {
                Log.info('[Backup] Database backed up: ' + success.fullPath);
            }, function (error) {
                Log.error('[Backup] Database could not be backed up successfully.');
            });

            Backup.backupData();
        }

        $ionicPlatform.on("resume", function (event) {
            Log.debug('[App] resume');
            activateSensors();
        });

        $ionicPlatform.on("pause", function (event) {
            Log.debug('[App] pause');
            deactivateSensors();
            backup();
        });

        activateSensors();

    }])
    .factory('$exceptionHandler', ['Log', function (Log) {


        return function (exception, cause) {
            Log.exception(exception);
        };
    }])
    .run([function () {
//        var push = PushNotification.init({ "android": {"senderID": "349842456478", "icon": "notif", "iconColor": "#0e8800", "forceShow": true}} );
//
//        push.on('registration', function(data) {
//            window.localStorage.setItem('notificationRegistrationId', data.registrationId);
//        });
//
//        push.on('notification', function(data) {
//            console.log(data);
//        });
//
//        push.on('error', function(e) {
//            console.log(data);
//        });
    }]);