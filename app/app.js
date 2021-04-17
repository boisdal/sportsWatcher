'use strict';

// Declare app level module which depends on views, and core components
angular.module('myApp', [
  'ngRoute',
  'myApp.schedule',
  'myApp.results',
  'club',
  'myApp.statistics',
  'myApp.version'
])
    .service('mainService', function ($http, $rootScope) {

        var key;
        var league;
        var leagues;

        $http.get('https://sports.bwadaal.fr/api/key').then(
            function successCallback(response) {
                key = response.data.data;
            },
            function errorCallback(response) {
                console.error(response);
            }
        );
        $http.get('https://sports.bwadaal.fr/api/leagues').then(
            function successCallback(response) {
                leagues = response.data.data;
                league = leagues[0];
                $rootScope.$broadcast('leaguesLoaded');
            },
            function errorCallback(response) {
                console.error(response);
            }
        );

        return {
            getKey: getKey,
            getLeague: getLeague,
            setLeague: setLeague,
            getLeagues: getLeagues
        };

        function getKey() {return key;}

        function getLeague() {return league;}

        function setLeague(value) {
            league = value;
        }

        function getLeagues() {return leagues;}
}).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix('!');

    $routeProvider.when('/#!/schedule', {
        template: '<schedule></schedule>'
    }).
    otherwise({redirectTo: '/schedule'});

}])
    .controller('MainCtrl', function($http, mainService, $rootScope) {
        function loadPage($http, mainService, $rootScope) {
            $rootScope.leagues = mainService.getLeagues();
            $rootScope.league = mainService.getLeague();
            $rootScope.$on('leagueUpdated', () => {
                $rootScope.league = mainService.getLeague();
            })
            $rootScope.setLeague = function(index) {
                console.log(`switching to`, $rootScope.leagues[index])
                mainService.setLeague($rootScope.leagues[index]);
                $rootScope.$broadcast('leagueUpdated');
            }
        }
        $rootScope.leagues = mainService.getLeagues()
        if (!$rootScope.leagues) {
            $rootScope.$on('leaguesLoaded', () => {
                loadPage($http, mainService, $rootScope);
            })
        } else {
            loadPage($http, mainService, $rootScope);
        }
    });
