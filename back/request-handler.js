const League = require('./schemas/Leagues.schema');
const Data = require('./schemas/Datas.schema');
const Club = require("./schemas/Clubs.schema");
require('dotenv').config();

exports.getLeagues = (req, res) => {
    League.get(function (err, leagueArray) {
        if (err) {
            res.json({
                status: 'error',
                message: err
            });
        }
        res.json({
            status: 'success',
            message:'Leagues retrieved successfully',
            data: leagueArray
        });
    });
};

exports.getData = (req, res) => {
    Data.get({}, function (err, dataArray) {
        if (err) {
            res.json({
                status: 'error',
                message: err
            });
        }
        res.json({
            status: 'success',
            message:'Data retrieved successfully',
            data: dataArray
        });
    });
};

exports.getDataLeague = (req, res) => {
    Data.get({league_id : req.params.league_id}, function (err, dataArray) {
        if (err) {
            res.json({
                status: 'error',
                message: err
            });
        }
        res.json({
            status: 'success',
            message:'Data retrieved successfully',
            data: dataArray
        });
    });
};

exports.getClub = (req, res) => {
    Club.get({club_id : req.params.club_id}, function (err, clubArray) {
        if (err) {
            res.json({
                status: 'error',
                message: err
            });
        }
        res.json({
            status: 'success',
            message:'Club retrieved successfully',
            data: clubArray[0]
        });
    });
};

exports.getKey = (req, res) => {
    res.json({
        status: 'success',
        message: 'Data retrieved successfully',
        data: process.env.API_KEY
    })
}