angular.module('croplandsApp.directives', []);
angular.module('croplandsApp.services', ['ionic', 'ngCordova']);
angular.module('croplandsApp.controllers', ['ionic', 'ngCordova', 'croplandsApp.services', 'croplands.mappings']);

angular.module('croplandsApp', ['ionic', 'croplandsApp.controllers', 'croplandsApp.services', 'leaflet-directive'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })
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
            .state('app.map', {
                url: "/map",
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: "templates/map.html",
                        controller: 'MapCtrl'
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
            .state('app.photos', {
                url: "/photos",
                views: {
                    'menuContent': {
                        templateUrl: "templates/photos.html",
                        controller: 'PhotosCtrl'
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
    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {

                //Change this to false to return accessory bar
                window.cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusBar required
                window.StatusBar.styleDefault();
            }
        });

    })
    .run(['$ionicPlatform', 'GPS', 'Log', 'Compass', 'Settings','Backup', function ($ionicPlatform, GPS, Log, Compass, Settings, Backup) {

        GPS.turnOn();
        Compass.turnOn();

        $ionicPlatform.on("resume", function (event) {
            Log.debug('[App] resume');
            GPS.turnOn();
            Compass.turnOn();
        });

        $ionicPlatform.on("pause", function (event) {
            Log.debug('[App] pause');
            if (!Settings.get('BACKGROUND_GPS')) {
                GPS.turnOff();
            }
            if (!Settings.get('BACKGROUND_COMPASS')) {
                Compass.turnOff();
            }

            Backup.backupDB().then(function (success) {
                Log.info('[App] Database backed up: ' + success.fullPath);
            }, function (error) {
                Log.error('[App] Database could not be backed up successfully.');
            });


        });
    }]);