const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
    id: Number,
    name: String,
    icon: String
});

const League = module.exports = new mongoose.model('leagues', leagueSchema);

module.exports.get = function (callback, limit) {
    League.find(callback).limit(limit);
}