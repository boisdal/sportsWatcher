const mongoose = require('mongoose');

const dataSchema = mongoose.Schema({
    league_id: Number,
    title: String,
    data: Object
});

const Data = mongoose.model('datas', dataSchema);

module.exports = Data

module.exports.get = function (filter, callback, limit) {
    Data.find(filter, callback).limit(limit);
}