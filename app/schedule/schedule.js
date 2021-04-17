'use strict';

Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};

function* enumerate(iterable) {
    let i = 0;

    for (const x of iterable) {
        yield [i, x];
        i++;
    }
}


angular.module('myApp.schedule', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/schedule', {
            templateUrl: 'schedule/schedule.html',
            controller: 'ScheduleCtrl'
        });
    }])

    .controller('ScheduleCtrl', function ($scope, mainService, $http) {
        function loadPage($scope, $http) {
            $scope.titleShow = 1;
            $scope.mshow = -1;
            $scope.col = -1;
            $http.get(`https://www.thesportsdb.com/api/v1/json/${mainService.getKey()}/lookuptable.php?l=${$scope.league.id}&s=2020-2021`).then(
                function successCallback(response) {
                    $scope.ranking = response.data.table;
                },
                function errorCallback(response) {
                    console.log('error making HTTP request : ', response);
                }
            );
            $scope.upcoming15 = []; //To be deleted quickly
            $http.get(`https://www.thesportsdb.com/api/v1/json/${mainService.getKey()}/eventsnextleague.php?id=${$scope.league.id}`).then(
                function successCallback(response) {
                    $scope.response = response;
                    $scope.upcoming15 = response.data.events;
                    for (let match of $scope.upcoming15) {
                        $http.get(`https://sports.bwadaal.fr/api/clubs/${match.idHomeTeam}`).then(
                            function successCallBack(response) {
                                $scope.response = response;
                                match.homeTeam = response.data.data;
                                match.homeTeam.ranking = $scope.findRank($scope.ranking, match.idHomeTeam);
                                match.homeTeam.score = $scope.findScore($scope.ranking, match.idHomeTeam);
                            },
                            function errorCallBack(response) {
                                console.log('unable to perform request for club infos : ', response);
                            });
                        $http.get(`https://sports.bwadaal.fr/api/clubs/${match.idAwayTeam}`).then(
                            function successCallBack(response) {
                                $scope.response = response;
                                match.awayTeam = response.data.data;
                                match.awayTeam.ranking = $scope.findRank($scope.ranking, match.idAwayTeam);
                                match.awayTeam.score = $scope.findScore($scope.ranking, match.idAwayTeam);
                            },
                            function errorCallBack(response) {
                                console.log('unable to perform request for club infos : ', response);
                            });
                    }
                },
                function errorCallback(response) {
                    console.log('unable to perform get request : ', response);
                }
            );
            $http.get(`https://www.thesportsdb.com/api/v1/json/${mainService.getKey()}/eventspastleague.php?id=${$scope.league.id}`).then(
                function successCallback(response) {
                    $scope.response = response;
                    $scope.last15 = response.data.events;
                    for (let match of $scope.last15) {
                        $http.get(`https://sports.bwadaal.fr/api/clubs/${match.idHomeTeam}`).then(
                            function successCallBack(response) {
                                $scope.response = response;
                                match.homeTeam = response.data.data;
                                match.homeTeam.ranking = $scope.findRank($scope.ranking, match.idHomeTeam);
                                match.homeTeam.score = $scope.findScore($scope.ranking, match.idHomeTeam);
                            },
                            function errorCallBack(response) {
                                console.log('unable to perform request for club infos : ', response);
                            });
                        $http.get(`https://sports.bwadaal.fr/api/clubs/${match.idAwayTeam}`).then(
                            function successCallBack(response) {
                                $scope.response = response;
                                match.awayTeam = response.data.data;
                                match.awayTeam.ranking = $scope.findRank($scope.ranking, match.idAwayTeam);
                                match.awayTeam.score = $scope.findScore($scope.ranking, match.idAwayTeam);
                            },
                            function errorCallBack(response) {
                                console.log('unable to perform request for club infos : ', response);
                            });
                    }
                },
                function errorCallback(response) {
                    console.log('unable to perform get request : ', response);
                }
            );
            $scope.cat = function (index) {
                $scope.show = index;
            };
            $scope.catMobile = function (index, column) {
                if ($scope.mshow !== index || $scope.col !== column) {
                    $scope.mshow = index;
                    $scope.col = column;
                } else {
                    $scope.mshow = -1;
                    $scope.col = -1;
                }
            }
            $scope.hide = function () {
                $scope.show = -1;
            };
            $scope.turn = function (index) {
                $scope.titleShow = ($scope.titleShow + index).mod(2);
            };
            $scope.findRank = function (ranking, id) {
                for (let [i, o] of enumerate(ranking)) {
                    if (o.teamid === id) {
                        return (i + 1);
                    }
                }
            };
            $scope.findScore = function (ranking, id) {
                for (let o of ranking) {
                    if (o.teamid === id) {
                        return (o.total);
                    }
                }
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
            loadPage($scope, $http);
        })
    });

