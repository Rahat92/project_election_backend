const jwt = require("jsonwebtoken");
const catchAsyncError = require("../utils/catchAsyncError");
const pool = require("../utils/dbConnection");
const { promisify } = require('util')
const tokenProducer = (id) => {
  return jwt.sign({ id }, process.env.SECRET_KEY || 'amarsonarbangla', {
    expiresIn: process.env.EXPIRE_TOKEN || '10d',
  });
};

const resAndSendToken = async (user, req, res, statusCode) => {
  let clientIp = req.ip;
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.replace('::ffff:', '');
  }
  const token = tokenProducer(user.id_user_key);
  await pool.request().query(`update T_USER set tx_ip = '${clientIp}' where id_user_key = ${user.id_user_key}`)
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  res.cookie("token", token, cookieOptions);
  if (process.env.NODE_ENV === "PRODUCTION") cookieOptions.secure = true;
  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // return next(
      //   new AppError(`You are not allowed to perform this action`, 400)
      // );
      return res.status(401).json({
        status: "fail",
        message: "You are not allowed to perform this action",
      });
    }
    next();
  };
};

exports.login = catchAsyncError(async (req, res, next) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({
      status: "Fail",
      message: "Email or password is missing",
    });
  }
  console.log(name)
  const user = (await pool.request().input('tx_action_name', 'USER_LOGIN').input('tx_name', name).execute('SEL_user')).recordset[0];
  console.log(55, user)
  if (!user || user.tx_password !== password) {
    return res.status(404).json({
      status: 'Fail',
      message: 'Invalid User Or Password.'
    })
  }
  resAndSendToken(user, req, res, 200);
});

exports.protected = catchAsyncError(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } 
  if (!token) {
    return res.status(401).json({
      status: 'Fail',
      message: 'You are not logged in, please log in to get access.'
    })
  }
  const decoded = await promisify(jwt.verify)(token, 'amarsonarbangla')
  const currentUser = await (await pool.request().query(`select * from T_USER WHERE id_user_key = ${decoded.id}`)).recordset[0]
  if (!currentUser) {
    return res.status(404).json({
      status: 'Fail',
      message: 'The user belonging to this token does no longer exist.'
    })
  }
  
  let clientIp = req.ip;
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.replace('::ffff:', '');
  }
  if(currentUser.tx_ip!==clientIp){
    return res.status(400).json({
      status:'Fail',
      message: 'You can only log in from one computer'
    })
  }
  req.user = currentUser
  next()
})

