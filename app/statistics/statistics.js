'use strict';

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};


angular.module('myApp.statistics', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/statistics', {
            templateUrl: 'statistics/statistics.html',
            controller: 'StatisticsCtrl'
        });
    }])

    .controller('StatisticsCtrl', function($scope, mainService, $timeout, $http) {
        function loadPage($scope, $timeout, $http) {

            $scope.show = 0;
            $http.get(`http://sports.bwadaal.fr/api/data/${$scope.league.id}`).then(
                function successCallback(response) {
                    $scope.graphs = response.data.data;
                    $scope.graphsNb = $scope.graphs.length;
                    $timeout($scope.loadGraphs, 100);
                },
                function errorCallback(response) {
                    console.log('error getting data : ' + response);
                }
            );
            $scope.turn = function (index) {
                $scope.show = ($scope.show + index).mod($scope.graphsNb);
            };
            $scope.loadGraphs = function () {
                for (let [i, graph] of $scope.graphs.entries()) {
                    let chartCtx = document.getElementById(`chart-${i}`);
                    console.log(chartCtx);
                    let chart = new Chart(chartCtx, {
                        type: 'line',
                        data: graph.data,
                        options: {
                            responsive: false,
                            maintainAspectRatio: false,
                            title: {
                                text: graph.title,
                                display: true
                            },
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true
                                    }
                                }]
                            }
                        }
                    });
                }
            }
        }
        $scope.league = mainService.getLeague();
        if ($scope.league) {
            loadPage($scope, $timeout, $http);
        } else {
            $scope.$on('leaguesLoaded', () => {
                $scope.league = mainService.getLeague();
                loadPage($scope, $timeout, $http);
            });
        }
        $scope.$on('leagueUpdated', () => {
            $scope.league = mainService.getLeague();
            loadPage($scope, $timeout, $http);
        });
    });