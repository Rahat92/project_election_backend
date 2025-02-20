const express = require('express');
const { getResult, getTotalBallotNo } = require('../controller/resultController');
const router = express.Router();


router  
    .route('/')
    .get( getResult)

router  
    .route('/total-ballot')
    .get(getTotalBallotNo)

const reportRouter = router;
module.exports = reportRouter;