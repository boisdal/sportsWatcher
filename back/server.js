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
                if (body.events) {
                    for (let match of body.events) {
                        for (let [i, team] of final.entries()) { //on itère sur nos équipes pour trouver les 2 concernées
                            if (!match.intHomeScore) {
                                break;
                            }
                            if (team.id === match.idHomeTeam) {
                                final[i].team[counter[team.id].played + 1].goalsfor = parseInt(match.intHomeScore) + final[i].team[counter[team.id].played].goalsfor;
                                final[i].team[counter[team.id].played + 1].goalsagainst = parseInt(match.intAwayScore) + final[i].team[counter[team.id].played].goalsagainst;
                                final[i].team[counter[team.id].played + 1].goalsdiff += parseInt(match.intHomeScore) - parseInt(match.intAwayScore) + final[i].team[counter[team.id].played].goalsdiff;
                                counter[team.id].played += 1;
                            }
                            if (team.id === match.idAwayTeam) {
                                final[i].team[counter[team.id].played + 1].goalsfor = parseInt(match.intAwayScore) + final[i].team[counter[team.id].played].goalsfor;
                                final[i].team[counter[team.id].played + 1].goalsagainst = parseInt(match.intHomeScore) + final[i].team[counter[team.id].played].goalsagainst;
                                final[i].team[counter[team.id].played + 1].goalsdiff += parseInt(match.intAwayScore) - parseInt(match.intHomeScore) + final[i].team[counter[team.id].played].goalsdiff;
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
    var diffData = {};
    var forData = {};
    var againstData = {};
    var labels = [];
    for (var i=0; i<=lastRound; i++) {
        labels.push('Round '+i);
    }
    diffData.labels = labels;
    forData.labels = labels;
    againstData.labels = labels;
    diffData.datasets=[];
    forData.datasets=[];
    againstData.datasets=[];
    let teamsFetched = 0;
    for (let team of final) {
        let diffDataset = {};
        let forDataset = {};
        let againstDataset = {};
        request(`https://thesportsdb.com/api/v1/json/${process.env.API_KEY}/lookupteam.php?id=${team.id}`, {json: true}, (err, res, body) => {
            if (err) {return console.log(err)}
            var club = body.teams[0];
            let color = getRandomColor();
            diffDataset.label = club.strTeam;
            diffDataset.data = [];
            diffDataset.tension = 0.2;
            diffDataset.cubicInterpolationMode = 'default';
            diffDataset.borderColor = color;
            diffDataset.backgroundColor = 'rgba(255,255,255,0)';
            diffDataset.borderWidth = 1;
            forDataset.label = club.strTeam;
            forDataset.data = [];
            forDataset.tension = 0.2;
            forDataset.cubicInterpolationMode = 'default';
            forDataset.borderColor = color;
            forDataset.backgroundColor = 'rgba(255,255,255,0)';
            forDataset.borderWidth = 1;
            againstDataset.label = club.strTeam;
            againstDataset.data = [];
            againstDataset.tension = 0.2;
            againstDataset.cubicInterpolationMode = 'default';
            againstDataset.borderColor = color;
            againstDataset.backgroundColor = 'rgba(255,255,255,0)';
            againstDataset.borderWidth = 1;
            for (let i=0; i<=counter[team.id].played; i++) {
                let round = team.team[i];
                diffDataset.data.push(round.goalsdiff);
                forDataset.data.push(round.goalsfor);
                againstDataset.data.push(round.goalsagainst);
            }
            diffData.datasets.push(diffDataset);
            forData.datasets.push(forDataset);
            againstData.datasets.push(againstDataset);
            teamsFetched ++;
            if (teamsFetched === final.length)
                saveGraphData(lea, diffData, forData, againstData);
        });
    }
}

async function saveGraphData(lea, diffData, forData, againstData) {
    await Data.deleteOne({title: `Cumulative point difference ${lea.name}`});
    let diff = new Data({title: `Cumulative point difference ${lea.name}`, data: diffData, league_id: lea.id});
    diff.save().then(() => {});

    await Data.deleteOne({title: `Cumulative points scored ${lea.name}`});
    let fors = new Data({title: `Cumulative points scored ${lea.name}`, data: forData, league_id: lea.id});
    fors.save().then(() => {});

    await Data.deleteOne({title: `Cumulative points taken ${lea.name}`});
    let against = new Data({title: `Cumulative points taken ${lea.name}`, data: againstData, league_id: lea.id});
    against.save().then(() => {});
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