const League = require('./schemas/Leagues.schema');
const Data = require('./schemas/Datas.schema');
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

exports.getKey = (req, res) => {
    res.json({
        status: 'success',
        message: 'Data retrieved successfully',
        data: process.env.API_KEY
    })
}