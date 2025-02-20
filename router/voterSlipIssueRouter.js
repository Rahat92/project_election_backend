const express = require('express');
const { setIssueTrue } = require('../controller/getAlreadyIssuedMemberController');
const {protected} = require('../controller/authController')
const router = express.Router();

router  
    .route('/:memberId')
    .post(protected, setIssueTrue)

const voterSlipIssueRouter = router;
module.exports = voterSlipIssueRouter;