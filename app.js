import createError from 'http-errors';
import express from'express';
import path from'path';
import cookieParser from'cookie-parser';
import logger from'morgan';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import mongoose from 'mongoose';

const url = 'mongodb://localhost:27017/conFusion'
const connect = mongoose.connect(url);

connect.then(db=>{
  console.log('connected to database successfully');
},(err)=>{
  console.log(err);
});

const app = express();
import dishRouter from './routes/dishRouter.js';
import promoRouter from './routes/promoRouter.js';
import leaderRouter from './routes/leaderRouter.js';

// view engine setup

import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//Authentication
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    const err = new Error('You are not authorized');
    res.setHeader('WWW-Authenticate', 'Basic');
    err.status = 401;
    next(err);
    return;
  }
  const authData = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const userName = authData[0];
  const password = authData[1];

  if(userName === 'admin' && password === 'password'){
    next(); //autherized and go to next api calls
  }
  else{
    const err = new Error('Please provide valid user credentials');
    res.setHeader('WWW-Authenticate', 'Basic');
    err.status = 401;
    next(err);
    return;
  }
}
app.use(authenticate);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/dishes',dishRouter);
app.use('/promotions',promoRouter);
app.use('/leaders',leaderRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
