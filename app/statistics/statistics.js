'use strict';

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

function* enumerate(iterable) {
    let i = 0;

    for (const x of iterable) {
        yield [i, x];
        i++;
    }
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    if (parseInt(color.slice(0,2), 16) + parseInt(color.slice(2, 4), 16) + parseInt(color.slice(4,6), 16) > 510){
        return getRandomColor();
    }
    return '#' + color;
}

function initFinal(counter, rounds){
    var final = [];            //On crée l'objet qui contiendra toutes les données
    for (let team of Object.entries(counter)) {     //puis pour chaque équipe qui a été détectée grâce à la 1ere requête
        var teamf = [];    //On enregistre un tableau pour contenir les évolutions de score de l'équipe au corus de la saison
        for (var round=0; round<=rounds; round++) {
            teamf.push({'round': round, 'goalsfor': 0, 'goalsagainst': 0, 'goalsdiff': 0});
        }
        final.push({'team':teamf, 'id': team[0]});
    }
    return(final);
}


angular.module('myApp.statistics', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/statistics', {
            templateUrl: 'statistics/statistics.html',
            controller: 'StatisticsCtrl'
        });
    }])

    .controller('StatisticsCtrl', function($scope, $timeout, $http) {
        $scope.show = -1;
        $http.get('https://www.thesportsdb.com/api/v1/json/1/eventspastleague.php?id=4430').then(
            function successCallback(response){         //première requete qui récupère les 15 derniers matchs pour en extraire les identifiants d'équipes
                $scope.lastRound = response.data.events[0].intRound; //et récupérer le nombre de rounds déjà joués
                $scope.counter = {};
                for (let match of response.data.events) {
                    $scope.counter[match.idHomeTeam] = {'played':0};
                    $scope.counter[match.idAwayTeam] = {'played':0};
                }
                $scope.final = initFinal($scope.counter, $scope.lastRound);
                for (var j=1; j <= $scope.lastRound; j++) { //puis on récupère les données des matchs pour chaque round
                    $http.get('https://www.thesportsdb.com/api/v1/json/1/eventsround.php?id=4430&r='+j+'&s=2020-2021').then(
                        function successCallback(response) { //puis on va pour chaque match du round compter les points
                            for (var match of response.data.events) {
                                for (let [i,team] of enumerate($scope.final)) { //on itère sur nos équipes pour trouver les 2 concernées
                                    if (!match.intHomeScore) {break;}
                                    if (team.id === match.idHomeTeam) {
                                        $scope.final[i].team[$scope.counter[team.id].played+1].goalsfor = parseInt(match.intHomeScore) + $scope.final[i].team[$scope.counter[team.id].played].goalsfor;
                                        $scope.final[i].team[$scope.counter[team.id].played+1].goalsagainst = parseInt(match.intAwayScore) + $scope.final[i].team[$scope.counter[team.id].played].goalsagainst;
                                        $scope.final[i].team[$scope.counter[team.id].played+1].goalsdiff += parseInt(match.intHomeScore) - parseInt(match.intAwayScore) + $scope.final[i].team[$scope.counter[team.id].played].goalsdiff;
                                        $scope.counter[team.id].played += 1;
                                    }
                                    if (team.id === match.idAwayTeam) {
                                        $scope.final[i].team[$scope.counter[team.id].played+1].goalsfor = parseInt(match.intAwayScore) + $scope.final[i].team[$scope.counter[team.id].played].goalsfor;
                                        $scope.final[i].team[$scope.counter[team.id].played+1].goalsagainst = parseInt(match.intHomeScore) + $scope.final[i].team[$scope.counter[team.id].played].goalsagainst;
                                        $scope.final[i].team[$scope.counter[team.id].played+1].goalsdiff += parseInt(match.intAwayScore) - parseInt(match.intHomeScore) + $scope.final[i].team[$scope.counter[team.id].played].goalsdiff;
                                        $scope.counter[team.id].played += 1;
                                    }
                                }
                            }
                        },
                        function errorCallback(response) {
                            console.log('error getting data : ' + response);
                        }
                    );
                }
                var diffData = {};
                var forData = {};
                var againstData = {};
                var labels = [];
                for (var i=0; i<=$scope.lastRound; i++) {
                    labels.push('Round '+i);
                }
                diffData.labels = labels;
                forData.labels = labels;
                againstData.labels = labels;
                diffData.datasets=[];
                forData.datasets=[];
                againstData.datasets=[];
                for (let team of $scope.final) {
                    let diffDataset = {};
                    let forDataset = {};
                    let againstDataset = {};
                    $http.get('https://thesportsdb.com/api/v1/json/1/lookupteam.php?id='+team.id).then(
                        function successCallback(response) {
                            var club = response.data.teams[0];
                            $scope.color = getRandomColor();
                            diffDataset.label = club.strTeam;
                            diffDataset.data = [];
                            diffDataset.tension = 0.2;
                            diffDataset.cubicInterpolationMode = 'default';
                            diffDataset.borderColor = $scope.color;
                            diffDataset.backgroundColor = 'rgba(255,255,255,0)';
                            diffDataset.borderWidth = 1;
                            forDataset.label = club.strTeam;
                            forDataset.data = [];
                            forDataset.tension = 0.2;
                            forDataset.cubicInterpolationMode = 'default';
                            forDataset.borderColor = $scope.color;
                            forDataset.backgroundColor = 'rgba(255,255,255,0)';
                            forDataset.borderWidth = 1;
                            againstDataset.label = club.strTeam;
                            againstDataset.data = [];
                            againstDataset.tension = 0.2;
                            againstDataset.cubicInterpolationMode = 'default';
                            againstDataset.borderColor = $scope.color;
                            againstDataset.backgroundColor = 'rgba(255,255,255,0)';
                            againstDataset.borderWidth = 1;
                            for (var i=0; i<=$scope.counter[team.id].played; i++) {
                                let round = team.team[i];
                                diffDataset.data.push(round.goalsdiff);
                                forDataset.data.push(round.goalsfor);
                                againstDataset.data.push(round.goalsagainst);
                            }
                        },
                        function errorCallback(response) {
                            console.log('error getting data : ' + response);
                        }
                    );
                    diffData.datasets.push(diffDataset);
                    forData.datasets.push(forDataset);
                    againstData.datasets.push(againstDataset);
                }
                var options = {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                };
                var diffChartCtx = $('#diffChart');
                var forChartCtx = $('#forChart');
                var againstChartCtx = $('#againstChart');
                let diffChart = new Chart(diffChartCtx, {
                    type: 'line',
                    data: diffData,
                    options: {
                        responsive: false,
                        maintainAspectRatio: false,
                        title: {
                            text: 'Evolution over the time of each team\'s \rpoint difference between scored and taken',
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
                let forChart = new Chart(forChartCtx, {
                    type: 'line',
                    data: forData,
                    options: {
                        responsive: false,
                        maintainAspectRatio: false,
                        title: {
                            text: 'Evolution over the time of each team\'s point scored',
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
                let againstChart = new Chart(againstChartCtx, {
                    type: 'line',
                    data: againstData,
                    options: {
                        responsive: false,
                        //maintainAspectRatio: false,
                        title: {
                            text: 'Evolution over the time of each team\'s points taken',
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
                $timeout(function(){
                    console.log('dla merde');
                    $scope.show = 0;
                    diffChart.update({
                        duration: 800,
                        easing: 'easeOutBounce'
                    });
                    forChart.update({
                        duration: 800,
                        easing: 'easeOutBounce'
                    });
                    againstChart.update({
                        duration: 800,
                        easing: 'easeOutBounce'
                    });
                }, 10000);
            },
            function errorCallback(response){
                console.log('error getting data : ' + response);
            }
        );
        $scope.turn = function(index) {
            $scope.show = ($scope.show+index).mod(3);
        };
    });