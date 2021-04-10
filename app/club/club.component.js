'use strict';

angular.
    module('club')
    .component('club', {
        bindings: {
            inData: '<',
        },
        templateUrl: 'club/club.template.html',
        controller: ['$http',   '$routeParams',
        function ClubController() {
        }]
});