const express = require('express');
const path = require('path');
const routes = require('./routes')
const app = express();
const port = 3141;
const https = require('https');
const router = express.Router();
const bodyParser = require('body-parser')
const cors = require('cors');
const cron = require('node-cron');
const mongoose = require('mongoose');
const Data = require('./schemas/Datas.schema');
const League = require('./schemas/Leagues.schema');
const request = require("request");
require('dotenv').config();

app.set('view engine', 'html');

app.use(cors());
app.use([bodyParser.json(), bodyParser.urlencoded({extended: true})]);
app.use(express.static(path.join(__dirname, '../app')));
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send('Server Error');
});
app.use('/api', routes);

mongoose.connect('mongodb://localhost/sports', { useNewUrlParser: true });
if (!mongoose.connection)
    console.log('Error connecting db');
else
    console.log('Db connected successfully');

app.listen(port, (err) => {
    err
        ? console.log('Cannot connect ... ', err)
        : console.log(`Connected ! Server is on port ${port}`);
});

cron.schedule('*/15 * * * *', () => {
    console.log('Updating the database !!');
    League.get(function (err, leagues) {
        if (err)
            console.log(err)
        for (let lea of leagues) {
            fetchGraphData(lea)
        }
    });
}, { scheduled: true, timezone: 'Etc/UTC' });

function fetchGraphData(lea) {
    request(`https://www.thesportsdb.com/api/v1/json/${process.env.API_KEY}/eventspastleague.php?id=${lea.id}`, {json: true}, (err, res, body) => {
        if (err) {
            return console.log(err)
        }
        let lastRound = body.events[0].intRound; //et récupérer le nombre de rounds déjà joués
        let counter = {};
        for (let match of body.events) {
            counter[match.idHomeTeam] = {'played': 0};
            counter[match.idAwayTeam] = {'played': 0};
        }
        let final = initFinal(counter, lastRound);
        let roundsFetched = 0;
        for (let j = 1; j <= lastRound; j++) { //puis on récupère les données des matchs pour chaque round
            request(`https://www.thesportsdb.com/api/v1/json/${process.env.API_KEY}/eventsround.php?id=${lea.id}&r=${j}&s=2020-2021`, {json: true}, (err, res, body) => {
                if (err) {
                    return console.log(err)
                }
                if (body?.events) {
                    for (let match of body.events) {
                        for (let [i, team] of final.entries()) { //on itère sur nos équipes pour trouver les 2 concernées
                            if (!match.intHomeScore || !match.intAwayScore) {
                                break;
                            }
                            if (team.id === match.idHomeTeam) {
                                final[i].team[counter[team.id].played + 1].sumFor = parseInt(match.intHomeScore) + final[i].team[counter[team.id].played].sumFor;
                                final[i].team[counter[team.id].played + 1].sumAgainst = parseInt(match.intAwayScore) + final[i].team[counter[team.id].played].sumAgainst;
                                final[i].team[counter[team.id].played + 1].sumDiff += parseInt(match.intHomeScore) - parseInt(match.intAwayScore) + final[i].team[counter[team.id].played].sumDiff;
                                final[i].team[counter[team.id].played + 1].for = parseInt(match.intHomeScore);
                                final[i].team[counter[team.id].played + 1].against = parseInt(match.intAwayScore);
                                final[i].team[counter[team.id].played + 1].diff += parseInt(match.intHomeScore) - parseInt(match.intAwayScore)
                                counter[team.id].played += 1;
                            }
                            if (team.id === match.idAwayTeam) {
                                final[i].team[counter[team.id].played + 1].sumFor = parseInt(match.intAwayScore) + final[i].team[counter[team.id].played].sumFor;
                                final[i].team[counter[team.id].played + 1].sumAgainst = parseInt(match.intHomeScore) + final[i].team[counter[team.id].played].sumAgainst;
                                final[i].team[counter[team.id].played + 1].sumDiff += parseInt(match.intAwayScore) - parseInt(match.intHomeScore) + final[i].team[counter[team.id].played].sumDiff;
                                final[i].team[counter[team.id].played + 1].for = parseInt(match.intAwayScore);
                                final[i].team[counter[team.id].played + 1].against = parseInt(match.intHomeScore);
                                final[i].team[counter[team.id].played + 1].diff += parseInt(match.intAwayScore) - parseInt(match.intHomeScore);
                                counter[team.id].played += 1;
                            }
                        }
                    }
                }
                roundsFetched ++;
                if (roundsFetched === parseInt(lastRound))
                    createGraphData(lea, final, lastRound, counter)
            });
        }
    });
}

function createGraphData(lea, final, lastRound, counter) {
    let diffData = {};
    let forData = {};
    let againstData = {};
    let sumDiffData = {};
    let sumForData = {};
    let sumAgainstData = {};
    let labels = [];
    for (var i=0; i<=lastRound; i++) {
        labels.push('Round '+i);
    }
    for (let data of [diffData, forData, againstData, sumDiffData, sumForData, sumAgainstData]) {
        data.labels = labels;
        data.datasets = [];
    }
    let teamsFetched = 0;
    for (let team of final) {
        let diffDataset = {};
        let forDataset = {};
        let againstDataset = {};
        let sumDiffDataset = {};
        let sumForDataset = {};
        let sumAgainstDataset = {};
        request(`https://thesportsdb.com/api/v1/json/${process.env.API_KEY}/lookupteam.php?id=${team.id}`, {json: true}, (err, res, body) => {
            if (err) {return console.log(err)}
            var club = body.teams[0];
            let color = getRandomColor();
            for (let dataset of [diffDataset, forDataset, againstDataset, sumDiffDataset, sumForDataset, sumAgainstDataset]) {
                dataset.label = club.strTeam;
                dataset.data = [];
                dataset.tension = 0.2;
                dataset.cubicInterpolationMode = 'default';
                dataset.borderColor = color;
                dataset.backgroundColor = 'rgba(255,255,255,0)';
                dataset.borderWidth = 1;
            }
            for (let i=0; i<=counter[team.id].played; i++) {
                let round = team.team[i];
                sumDiffDataset.data.push(round.sumDiff);
                sumForDataset.data.push(round.sumFor);
                sumAgainstDataset.data.push(round.sumAgainst);
                diffDataset.data.push(round.diff);
                forDataset.data.push(round.for);
                againstDataset.data.push(round.against);
            }
            diffData.datasets.push(diffDataset);
            forData.datasets.push(forDataset);
            againstData.datasets.push(againstDataset);
            sumDiffData.datasets.push(sumDiffDataset);
            sumForData.datasets.push(sumForDataset);
            sumAgainstData.datasets.push(sumAgainstDataset);
            teamsFetched ++;
            if (teamsFetched === final.length)
                saveGraphData(lea, diffData, forData, againstData, sumDiffData, sumForData, sumAgainstData);
        });
    }
}

async function saveGraphData(lea, diffData, forData, againstData, sumDiffData, sumForData, sumAgainstData) {
    await Data.deleteOne({title: `Score gap for each match`, league_id: lea.id});
    let diff = new Data({title: `Score gap for each match`, data: diffData, league_id: lea.id});
    diff.save().then(() => {});

    await Data.deleteOne({title: `Points scored for each match`, league_id: lea.id});
    let fors = new Data({title: `Points scored for each match`, data: forData, league_id: lea.id});
    fors.save().then(() => {});

    await Data.deleteOne({title: `Points taken for each match`, league_id: lea.id});
    let against = new Data({title: `Points taken for each match`, data: againstData, league_id: lea.id});
    against.save().then(() => {});

    await Data.deleteOne({title: `Sum of the score gaps`, league_id: lea.id});
    let sumDiff = new Data({title: `Sum of the score gaps`, data: sumDiffData, league_id: lea.id});
    sumDiff.save().then(() => {});

    await Data.deleteOne({title: `Total points scored`, league_id: lea.id});
    let sumFors = new Data({title: `Total points scored`, data: sumForData, league_id: lea.id});
    sumFors.save().then(() => {});

    await Data.deleteOne({title: `Total points taken`, league_id: lea.id});
    let sumAgainst = new Data({title: `Total points taken`, data: sumAgainstData, league_id: lea.id});
    sumAgainst.save().then(() => {});
}

function initFinal(counter, rounds){
    var final = [];            //On crée l'objet qui contiendra toutes les données
    for (let team of Object.entries(counter)) {     //puis pour chaque équipe qui a été détectée grâce à la 1ere requête
        var teamf = [];    //On enregistre un tableau pour contenir les évolutions de score de l'équipe au corus de la saison
        for (var round=0; round<=rounds; round++) {
            teamf.push({'round': round, 'sumFor': 0, 'sumAgainst': 0, 'sumDiff': 0, 'for': 0, 'against': 0, 'diff': 0});
        }
        final.push({'team':teamf, 'id': team[0]});
    }
    return(final);
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