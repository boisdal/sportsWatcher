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
            $http.get(`https://sports.bwadaal.fr/api/data/${$scope.league.id}`).then(
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
                    let chart = new Chart(chartCtx, {
                        type: 'line',
                        data: graph.data,
                        options: {
                            responsive: false,
                            maintainAspectRatio: false,
                            title: {
                                text: graph.title,
                                display: false
                            },
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true
                                    }
                                }]
                            },
                            legend: {
                                onClick: function(e, legendItem) {
                                    var index = legendItem.datasetIndex;
                                    var ci = this.chart;
                                    var alreadyHidden = (ci.getDatasetMeta(index).hidden === null) ? false : ci.getDatasetMeta(index).hidden;
                                    var anyOthersAlreadyHidden = false;
                                    var allOthersHidden = true;

                                    // figure out the current state of the labels
                                    ci.data.datasets.forEach(function(e, i) {
                                        var meta = ci.getDatasetMeta(i);

                                        if (i !== index) {
                                            if (meta.hidden) {
                                                anyOthersAlreadyHidden = true;
                                            } else {
                                                allOthersHidden = false;
                                            }
                                        }
                                    });

                                    // if the label we clicked is already hidden
                                    // then we now want to unhide (with any others already unhidden)
                                    if (alreadyHidden) {
                                        ci.getDatasetMeta(index).hidden = null;
                                    } else {
                                        // otherwise, lets figure out how to toggle visibility based upon the current state
                                        ci.data.datasets.forEach(function(e, i) {
                                            var meta = ci.getDatasetMeta(i);

                                            if (allOthersHidden) {
                                                meta.hidden = null;
                                            } else {
                                                if (anyOthersAlreadyHidden) {
                                                    if (i === index) {
                                                        meta.hidden = true;
                                                    }
                                                } else {
                                                    if (i !== index) {
                                                        meta.hidden = true;
                                                    }
                                                }
                                            }
                                        });
                                    }

                                    ci.update();
                                }
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