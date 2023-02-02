import bodyParser from "body-parser";
import express from "express";
import passport from "passport";
import User from "../models/user.js";
const userRouter = express.Router();
userRouter.use(bodyParser.json());

/* GET users listing. */
userRouter.get('/', (req, res, next) => {
  res.send('respond with a resource');
});

userRouter.post('/signup',(req, res, next)=>{
  User.register(new User({username: req.body.username}), req.body.password,
    (err, user)=>{
      if(err){
        res.statusCode = 500;
        res.setHeader('Content-type','application/json');
        res.json({err: err});
      }
      else{
        passport.authenticate('local', (req, res)=>{
          res.statusCode =200;
          res.setHeader('Content-Type','application/json');
          res.json({success:true, status:'Registration Successful!', user: user});
        });
      }
    });
});

userRouter.post('/login', passport.authenticate('local'), (req, res)=>{
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.json({success:true, status:'You are logged-in successfully!'});
});

userRouter.get('/logout',(req, res, next)=>{
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
})
export default userRouter;
