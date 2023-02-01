import bodyParser from "body-parser";
import express from "express";
import session from "express-session";
import User from "../models/user.js";
const userRouter = express.Router();
userRouter.use(bodyParser.json());

/* GET users listing. */
// userRouter.get('/', (req, res, next) => {
//   res.send('respond with a resource');
// });

userRouter.post('/signup',(req, res, next)=>{
  User.findOne({username:req.body.username})
  .then(user=>{
    if(user !== null){
      const err = new Error('The user '+ req.body.username+' alredy exists!')
      err.status = 403;
      next(err);
    }
    else{
      return User.create({
        username: req.body.username,
        password: req.body.password
      });
    }
  })
  .then(user=>{
    res.statusCode =200;
    res.setHeader('Content-Type','application/json');
    res.json({status:'Registration Successful!', user: user});
  })
  .catch(err=>next(err));
});

userRouter.post('/login', (req, res, next)=>{
  if(!req.session.user){
    const authHeader = req.headers.authorization;
    if(!authHeader){
      const err = new Error('you are not authorized please provide user credentials!');
      res.setHeader('WWW-Authenticate','Basic');
      err.status = 401;
      return next(err);
    }
    const auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const username = auth[0];
    const password = auth[1];
    User.findOne({username: username})
    .then(user=>{
      if(user === null){
        const err = new Error('User '+username+' does not exist!');
        err.status = 401;
        next(err);
      }
      else if(user.password !== password){
        const err = new Error('Your password is incorrect!');
        err.status = 401;
        next(err);
      }
      else{
        req.session.user = 'authenticated';
        res.statusCode = 200;
        res.setHeader('Content-Type','text/pain');
        res.end('Welcome '+ username+'!');
      }
    })
    .catch(err=>next(err));
  }
  else{
    res.statusCode = 200;
    res.setHeader('Content-Type','text/pain');
    res.end('You are already logged-In!');
  }
});

userRouter.get('/logout',(req, res, next)=>{
  if(req.session.user){
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
