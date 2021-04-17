const mongoose = require('mongoose');

const clubSchema = mongoose.Schema({
    club_id: Number,
    league_id: Number,
    name: String,
    badge: String,
    last: [{name: String, badge: String, won: String}],
    next: [{name: String, badge: String}]
});

const Club = mongoose.model('clubs', clubSchema);

module.exports = Club

module.exports.get = function (filter, callback, limit) {
    Club.find(filter, callback).limit(limit);
}