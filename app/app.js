'use strict';

// Declare app level module which depends on views, and core components
angular.module('myApp', [
  'ngRoute',
  'myApp.schedule',
  'myApp.results',
  'club',
  'myApp.statistics',
  'myApp.version'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.when('/#!/schedule', {
    template: '<schedule></schedule>'
  }).
  otherwise({redirectTo: '/schedule'});

}]);
