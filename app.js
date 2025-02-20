const express = require('express');
const cors = require('cors')
const pool = require('./utils/dbConnection');
const path = require('path')
const globalErrorController = require('./controller/globalErrorController');
// const AppError = require('./utils/AppError');
const issuedMemberRouter = require('./router/issuedMemberRoutes');
const memberRouter = require('./router/memberRoutes');
const authRouter = require('./router/authRoutes');
const voterSlipIssueRouter = require('./router/voterSlipIssueRouter');
const projectRouter = require('./router/projectRoutes');
const reportRouter = require('./router/reportRoutes');
const resultRouter = require('./router/resultRoutes');
const fileUploadRouter = require('./router/fileUploadRoutes');
const app = express();


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors())
app.get('/favicon.ico', (req, res) => res.status(204));

app.get('/', (req,res) => {
    res.status(200).json({
        status: 'Success',
        message: 'Surver is up and running'
    })
})

app.use('/api/v1/all-issued-member',issuedMemberRouter);
app.use('/api/v1/project',projectRouter);
app.use('/api/v1/voter-slip',voterSlipIssueRouter);
app.use('/api/v1/all-members',memberRouter);
app.use('/api/v1/report',reportRouter);
app.use('/api/v1/auth',authRouter);
app.use('/api/v1/result', resultRouter)
app.use('/api/v1/upload_candidate_files', fileUploadRouter)

app.all('*', (req,res, next) => {
    // return next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
    res.status(404).json({
        status:'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    })
})


app.use(globalErrorController)

module.exports = app;