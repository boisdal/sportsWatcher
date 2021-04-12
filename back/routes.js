const router = require('express').Router();
const requestHandler = require('./request-handler');

router.get('/leagues', requestHandler.getLeagues);

router.get('/data', requestHandler.getData);

router.get('/data/:league_id', requestHandler.getDataLeague);

router.get('/key', requestHandler.getKey);

module.exports = router;