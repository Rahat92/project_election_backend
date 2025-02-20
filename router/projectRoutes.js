const express = require('express');
const { getProjectInfo } = require('../controller/getAlreadyIssuedMemberController');
const router = express.Router();


router  
    .route('/')
    .get(getProjectInfo)
const projectRouter = router;
module.exports = projectRouter;