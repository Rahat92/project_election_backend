const express = require('express');
const { generateCounterReport } = require('../controller/reportController');
const { protected } = require('../controller/authController');
const router = express.Router();


router  
    .route('/')
    .get(protected, generateCounterReport)

const reportRouter = router;
module.exports = reportRouter;