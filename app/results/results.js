'use strict';


function* enumerate(iterable) {
    let i = 0;

    for (const x of iterable) {
        yield [i, x];
        i++;
    }
}


angular.module('myApp.results', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/results', {
            templateUrl: 'results/results.html',
            controller: 'ResultsCtrl'
        });
    }])

    .controller('ResultsCtrl', function ($scope, mainService, $http) {
        function loadPage($scope, $http) {
            $http.get(`https://www.thesportsdb.com/api/v1/json/${mainService.getKey()}/lookuptable.php?l=${mainService.getLeague().id}&s=2020-2021`).then(
                function successCallback(response) {
                    $scope.response = response;
                    $scope.ranking = response.data.table;
                    for (let [i, o] of enumerate($scope.ranking)) {
                        $http.get(`https://thesportsdb.com/api/v1/json/${mainService.getKey()}/lookupteam.php?id=${o.teamid}`).then(
                            function successCallback(response) {
                                o.club = response.data.teams[0];
                                o.club.ranking = i + 1;
                                o.club.score = o.total;
                            },
                            function errorCallback(response) {
                                console.log('error trying to get data : ' + response);
                            }
                        );
                    }
                    $(document).ready(function () {
                        var table = $('#rankingTable');
                        if (table)
                            table.destroy();
                        table.DataTable({
                            dom: 'Bt',
                            buttons: [
                                'pdf'
                            ],
                            columnDefs: [
                                {orderable: false, targets: 0}
                            ],
                            'sortable': true,
                            'paging': false,
                            'order': [8, 'desc'],
                            searching: false,
                            info: false,
                            scrollX: false
                        });
                        $('div.toggle-vis').on('click', function (e) {
                            e.preventDefault();
                            for (var i = 1; i < 8; i++) {
                                var column = table.column(i);
                                column.visible(!column.visible());
                            }
                        });
                    });
                },
                function errorCallback(response) {
                    console.log('Error trying to get data : ' + response);
                }
            );
            $scope.cat = function (index, column) {
                $scope.show = index;
                $scope.column = column;
            };
            $scope.hide = function () {
                $scope.show = -1;
            };
        }
        $scope.league = mainService.getLeague();
        if ($scope.league) {
            loadPage($scope, $http);
        } else {
            $scope.$on('leaguesLoaded', () => {
                $scope.league = mainService.getLeague();
                loadPage($scope, $http);
            });
        }
        $scope.$on('leagueUpdated', () => {
            $scope.league = mainService.getLeague();
            loadPage($scope, $http)
        })
    });

