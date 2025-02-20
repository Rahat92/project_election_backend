const express = require('express');
const { login } = require('../controller/authController');
const router = express.Router();


router  
    .route('/login')
    .post(login)

const authRouter = router;
module.exports = authRouter;