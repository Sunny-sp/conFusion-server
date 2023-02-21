import bodyParser from "body-parser";
import express from "express";
import passport from "passport";
import User from "../models/user.js";
import * as authenticate from '../authenticate.js';
import * as cors from './cors.js';

const userRouter = express.Router();
userRouter.use(bodyParser.json());

/* GET users listing. */
userRouter.route('*', cors.corsWithOptions, authenticate.verifyUser, (req, res)=>{ res.sendStatus(200)});
userRouter.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.find({})
  .then(users=>{
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.json(users);
  })
  .catch(err=>next(err));
});

userRouter.post('/signup', cors.corsWithOptions, (req, res, next) => {
  User.register(new User({username: req.body.username}), req.body.password, (err, user) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({
        err: err
      });
    } else {
      if (req.body.firstname) {
        user.firstname = req.body.firstname;
      }
      if (req.body.lastname) {
        user.lastname = req.body.lastname;
      }
      user.save((err, user) => {
        passport.authenticate('local')(req, res, () => {
          if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({
              err: err
            });
            return;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({
            success: true,
            status: 'Registration Successful!'
          });
        });
      });
    }
  });
});

userRouter.post('/login', cors.corsWithOptions, (req, res, next)=>{
  passport.authenticate('local', (err, user, info)=>{
    if(err){
      return next(err);
    }
    if(!user){
      res.statusCode = 401;
      res.setHeader('Content-Type','application/json');
      res.json({success:false, status:'Login Unsuccessful!', err: info});
    }

    req.logIn(user, err=>{
      if(err){
       res.statusCode = 401;
       res.setHeader('Content-Type','application/json');
       res.json({success:false, status:'Login Unsuccessful!', err: err});
      }
      else{
        const token = authenticate.getToken({_id:req.user._id});
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json({success:true, token:token, status:'You are logged-in successfully!'});
      }
    }) (req, res, next);
  });
});

userRouter.get('/logout', cors.corsWithOptions, (req, res, next)=>{
  if(req.user){
    req.session.destroy();
    res.clearCookie('session-Id');
    res.redirect('/');
  }
  else{
    const err = new Error('You are not logged-In!');
    err.status = 401;
    next(err);
  }
});
export default userRouter;
// fixes: 1) export NODE_TLS_REJECT_UNAUTHORIZED=0 set this environment variable to by-pass ssl cert
// 2) add few facebook accounts for testing in tester option on facebook/developer site
// 3) Go live on facebook/developer site
userRouter.get('/facebook/token', cors.corsWithOptions, passport.authenticate('facebook-token'), (req, res, next)=>{
  if(req.user){
    const token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.json({success:true, token:token, status:'You are logged-in successfully!'});
  }
});

userRouter.get('/checkJWTToken', cors.corsWithOptions, (req, res, next)=>{
  passport.use('jwt', (err, user, info)=>{
    if(err){
      return next(err);
    }
    if(!user){
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json')
      res.json({success: false, status: 'JWT Invalid!', err: info})
    }
    else{
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json')
      res.json({success: true, status: 'JWT Valid!', user: user})
    }
  }) (req, res);
});
