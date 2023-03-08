import createError from 'http-errors';
import express from 'express';
import path from 'path';
import logger from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import passport from 'passport';
import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import jwt from 'jsonwebtoken';
import { ExtractJwt, Strategy as Strategy$1 } from 'passport-jwt';
import { Strategy } from 'passport-local';
import PassportFacebookToken from '@lmaj/passport-facebook-token';
import crypto from 'crypto';
import { loadType } from 'mongoose-currency';
import { fileURLToPath } from 'url';
import multer from 'multer';
import debug from 'debug';
import http from 'http';
import https from 'https';
import fs from 'fs';

const whiteList = ['http://localhost:3000','http://localhost:3001', 'https://localhost:3443', 'http://192.168.1.6:3001', 'https://sunny-sp.github.io'];

const corsOptionsDelegate = {
    origin: function (origin, callback) {
        if (whiteList.indexOf(origin) !== -1 && origin) {
        callback(null, true);
        } else {
        callback(new Error('Not allowed by CORS'));
        }
    }
};

const openCors = cors();
const corsWithOptions = cors(corsOptionsDelegate);

const router = express.Router();
/* GET home page. */
router.get('/', openCors, (req, res, next)=>{
  res.render('index', { title: 'Express' });
});

const Schema$5 =  mongoose.Schema;

const usersSchema = new Schema$5({
    firstname:{
        type: String,
        default:''
    },
    lastname:{
        type: String,
        default:''
    },
    facebookId:{
        type: String
    },
    admin:{
        type: Boolean,
        default:false
    }
});

usersSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User',usersSchema);

const config = {
    secretKey:'1234-5678-9012-7654-ertgdf-fyjfgndfghd-rthdftgdf',
    mongoUrl:'mongodb://localhost:27017/conFusion',
    facebook:{
        clientId: '594746652088835',
        clientSecret: '8b0476d70f696ceceb3da958fd3eb7d8',
        callbackURL: 'https://localhost:3443/facebook/token/'
    }
};

/**
 * passport authentication configuration file
 */

// passport authentication configuration
// make sure you import in app.js file before using passport.authenticate() function (import './authenticate)
// serialize and deserialize will use salt and mix it with username or password and make a hash data
// check in database

// short way of local authentication using passport-local-mongoose
// passport.use(new LocalStrategy(User.authenticate()));

/**
 * making "hashSaltField": true in User.FindByUsername();
 */
passport.use(new Strategy(
    function(username, password, done) {
      User.findByUsername(username, true, async function (err, user) {
        if (err) { 
            return done(err);
        }
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
      });
    }
));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const getToken = (user_id) => {
    return jwt.sign(user_id, config.secretKey, { expiresIn: '1h' });
};
// options object
const opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

passport.use(new Strategy$1(opts, (jwt_payload, done) => {
    console.log('JWT Payload' + JSON.stringify(jwt_payload, null, 2));
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
        if (err) {
            return done(err, false);
        }
        else if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    });
}));

passport.use(new PassportFacebookToken(
    {
        clientID: config.facebook.clientId, clientSecret: config.facebook.clientSecret,
        callbackURL: 'https://localhost:3443/users/facebook/token'
    },
    (accessToken, refreshToken, profile, done) => {
        // console.log('profile accessed: '+ JSON.stringify(profile));
        User.findOne({ facebookId: profile.id }, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user !== null) {
                return done(null, user);
            }
            else {
                const user = new User({ username: profile.displayName });
                user.facebookId = profile.id;
                user.firstname = profile.name.givenName;
                user.lastname = profile.name.familyName;
                user.save((err, user) => {
                    if (err) {
                        return done(err, false);
                    }
                    else {
                        return done(null, user);
                    }
                });
            }
        });
    }
));

const verifyUser = passport.authenticate('jwt', { session: false });
// here after verifyUser middleware called it returns (req, res, next) so further middlewares (ex verifyAdmin) should
// have  (req, res, next) parameters to run properly
const verifyAdmin = (req, res, next) => {
    if (req.user.admin === true) {
        next();
    }
    else {
        const err = new Error('You are not authorized to perform this operation!');
        err.status = 403;
        next(err);
    }
};

const userRouter = express.Router();
userRouter.use(bodyParser.json());

/* GET users listing. */
userRouter.route('*', corsWithOptions, verifyUser, (req, res)=>{ res.sendStatus(200);});
userRouter.get('/', corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
  User.find({})
  .then(users=>{
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.json(users);
  })
  .catch(err=>next(err));
});

userRouter.post('/signup', corsWithOptions, (req, res, next) => {
  User.register(new User({username: req.body.username}), req.body.password, (err, user) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
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
            res.json({success: false, err: err});
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({
            success: true,
            status: 'SignUp Successful!'
          });
        });
      });
    }
  });
});
userRouter.post('/login', corsWithOptions, (req, res, next)=>{
    passport.authenticate('local', (err, user, info)=>{
    if(err){
      return next(err);
    }
    if(!user){
      res.statusCode = 401;
      res.setHeader('Content-Type','application/json');
      res.json({success:false, status:'Login Unsuccessful!', err: 'No user found!'});
    }
    else if(user){
      let isPasswordSame = false;
      // default 'hashOptions' values used by passport-local-mongoose module
      // using the same values below to generate the same hash value and validate the password
      const hashOptions={
        iterations: 25000,
        keylen: 512,
        digest: 'sha256',
      };
      const newhash = crypto.pbkdf2Sync(req.body.password, user.salt, hashOptions.iterations,
        hashOptions.keylen, hashOptions.digest, (err, derivedKey)=>{
          if(err){
              throw err;
          }
          else {
              return derivedKey;
          }
      });
      isPasswordSame = user.hash === newhash.toString('hex');
      if(!isPasswordSame){
        res.statusCode = 401;
        res.setHeader('Content-Type','application/json');
        res.json({success:false, status:'Login Unsuccessful!', err: 'Please provide valid password!'});
      }
      else {
        req.logIn(user, err=>{
          if(err){
            console.log('middleware logIn: ');
            res.statusCode = 401;
            res.setHeader('Content-Type','application/json');
            res.json({success:false, status:'Login Unsuccessful!', err: err});
            return next(err);
          }
          else {
            console.log('middleware logIn: ');
            const token = getToken({_id:req.user._id});
            res.statusCode = 200;
            res.setHeader('Content-Type','application/json');
            res.json({success:true, token:token, status:'You are logged-in successfully!'});
          }
        });
      }
    }
  })(req, res, next);
});

userRouter.get('/logout', corsWithOptions, (req, res, next)=>{
  if(req.user){
    req.session.destroy();
    res.clearCookie('session-Id');
    res.redirect('/');
  }
  else {
    const err = new Error('You are not logged-In!');
    err.status = 401;
    next(err);
  }
});
// fixes: 1) export NODE_TLS_REJECT_UNAUTHORIZED=0 set this environment variable to by-pass ssl cert
// 2) add few facebook accounts for testing in tester option on facebook/developer site
// 3) Go live on facebook/developer site
userRouter.get('/facebook/token', corsWithOptions, passport.authenticate('facebook-token'), (req, res, next)=>{
  if(req.user){
    const token = getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.json({success:true, token:token, status:'You are logged-in successfully!'});
  }
});

userRouter.get('/checkJWTToken', corsWithOptions, (req, res, next)=>{
  passport.use('jwt', (err, user, info)=>{
    if(err){
      return next(err);
    }
    if(!user){
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'JWT Invalid!', err: info});
    }
    else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, status: 'JWT Valid!', user: user});
    }
  }) (req, res);
});

const Currency$1 = loadType(mongoose);
const Schema$4 = mongoose.Schema;

const dishSchema = new Schema$4({
    name:{
        type: String,
        required: true,
        unique: true
    },
    image:{
        type: String,
        required: true
    },
    category:{
        type: String,
        required: true
    },
    label:{
        type: String,
        default: ''
    },
    price:{
        type: Currency$1,
        required: true,
        min: 0
    },
    featured:{
        type: Boolean,
        default: false
    },
    description:{
        type: String,
        required: true
    }
},
{
    timestamps:true
});
const Dishes = mongoose.model('Dish', dishSchema);

const dishRouter = express.Router();
dishRouter.use(bodyParser.json());

dishRouter.route('/')
.options(corsWithOptions, (req, res)=>{
    res.sendStatus = 200;
})
.get(openCors, (req, res, next)=>{
    Dishes.find(req.query)
    .then(dishes=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dishes);
    })
    .catch(err =>{next(err);});
})
.post(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    Dishes.create(req.body)
    .then(dish => {
        console.log('created dish',dish);
        res.statusCode =200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err);});
})
.put(corsWithOptions, verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /dishes');
})
.delete(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    Dishes.deleteMany({})
    .then(resp => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    })
    .catch(err =>{next(err);});
});

// REST call with specific dish
dishRouter.route('/:dishId')
.options(corsWithOptions, (req, res)=>{
    res.statusCode = 200;
})
.get(openCors, (req, res, next)=>{
    Dishes.findById(req.params.dishId)
    .then(dish=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err);});
})
.post(corsWithOptions, verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /dishes/' + req.params.dishId);
})
.put(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    Dishes.findByIdAndUpdate(req.params.dishId,{$set : req.body},{ new: true})
    .then(dish=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err);});

})
.delete(corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
    .then( resp => {
        res.statusCode = 200;
        res.setHeader('Content-type', 'application/json');
        res.json(resp);
    })
    .catch(err =>{next(err);});
});

const Currency = loadType(mongoose);
const Schema$3 = mongoose.Schema;

const promotionsSchema = new Schema$3({
    name:{
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    label: {
        type: String,
        default: ''
    },
    price: {
        type: Currency,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    featured: {
        type: Boolean,
        default: false
    }
});

const Promotions = mongoose.model('Promotion', promotionsSchema);

const promoRouter = express.Router();
promoRouter.use(bodyParser.json());

promoRouter.route('/')
.options(corsWithOptions, (req, res)=>{
    res.sendStatus = 200;
})
.get(openCors, (req, res, next)=>{
    Promotions.find(req.query)
    .then(promos => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(promos);
    })
    .catch(error => next(error));
})
.post(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    Promotions.create(req.body)
    .then(promo => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(promo);
    })
    .catch(error=>next(error));
})
.put(corsWithOptions, verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /Promotions');
})
.delete(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    Promotions.deleteMany({})
    .then(resp=>{
        res.statusCode =200;
        res.setHeader('Content-Type','application/json');
        res.json(resp);
    })
    .catch(error=>next(error));
});
// REST call with specific promo
promoRouter.route('/:promoId')
.options(corsWithOptions, (req, res)=>{
    res.statusCode = 200;
})
.get(openCors, (req, res, next)=>{
    Promotions.findById(req.params.promoId)
    .then(promo=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(promo);
    })
    .catch(error=>next(error));
})
.post(corsWithOptions, verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /Promotions/' + req.params.promoId);
})
.put(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    Promotions.findByIdAndUpdate(req.params.promoId,{$set: req.body},{new: true})
    .then(promo=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(promo);
    })
    .catch(error=>next(error));
})
.delete(corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
    Promotions.findByIdAndRemove(req.params.promoId)
    .then(resp=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcation/json');
        res.json(resp);
    })
    .catch(error=>next(error));
});

const Schema$2 = mongoose.Schema;

const leaderSchema = new Schema$2({
    name:{
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    abbr: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    featured: {
        type: Boolean,
        default: false
    }
});

const Leaders = mongoose.model('Leader',leaderSchema);

const leaderRouter = express.Router();
leaderRouter.use(bodyParser.json());

leaderRouter.route('/')
.options(corsWithOptions, (req, res)=>{
    res.sendStatus = 200;
})
.get(openCors, (req, res, next)=>{
    Leaders.find(req.query)
    .then(leaders => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(leaders);
    })
    .catch(error => next(error));
})
.post(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    Leaders.create(req.body)
    .then(leader => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(leader);
    })
    .catch(error=>next(error));
})
.put(corsWithOptions, verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /leaders');
})
.delete(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    Leaders.deleteMany({})
    .then(resp=>{
        res.statusCode =200;
        res.setHeader('Content-Type','application/json');
        res.json(resp);
    })
    .catch(error=>next(error));
});

// REST call with specific leader
leaderRouter.route('/:leaderId')
.options(corsWithOptions, (req, res)=>{
    res.statusCode = 200;
})
.get(openCors, (req, res, next)=>{
    Leaders.findById(req.params.leaderId)
    .then(leader=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(leader);
    })
    .catch(error=>next(error));
})
.post(corsWithOptions, verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /leaders/' + req.params.leaderId);
})
.put(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    Leaders.findByIdAndUpdate(req.params.leaderId,{$set: req.body},{new: true})
    .then(leader=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(leader);
    })
    .catch(error=>next(error));
})
.delete(corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
    Leaders.findByIdAndRemove(req.params.leaderId)
    .then(resp=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcation/json');
        res.json(resp);
    })
    .catch(error=>next(error));
});

const Schema$1 = mongoose.Schema;

const FavoriteDishes = new Schema$1({
    user: {
        type: Schema$1.Types.ObjectId,
        ref: 'User'
    },
    dishes: [
        {
            type: Schema$1.Types.ObjectId,
            ref:'Dish'
        }
    ]    
});

const Favorites = mongoose.model('Favorite',FavoriteDishes);

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.get(corsWithOptions, verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
    .populate('dishes')
    .populate('user')
    .then(favorite =>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    })
    .catch(err => next(err));
})
.post(corsWithOptions, verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
    .then(favorite => {
        if(favorite !== null){
            let isNewDish = true;
            let ifPushed = false;
            for(let id of req.body){
                for(let dishId of favorite.dishes){
                    if(dishId.equals(id._id)) {
                        isNewDish = false;
                        break;
                    }
                }
                if(isNewDish){
                    favorite.dishes.push(id._id);
                    ifPushed = true;
                }
                isNewDish = true;
            }
            if(ifPushed){
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate('dishes')
                    .populate('user')
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    });
                });
            }
            else {
                res.statusCode = 403;
                res.json({err:'Please select new dishes to add into favorite dish list!'});
            }
        }
        else {
            Favorites.create({})
            .then(favorite => {
                for(const id of req.body ){
                    favorite.dishes.push(id);
                }
                favorite.user = req.user._id;
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate('dishes')
                    .populate('user')
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    });
                });
            });
        }
    })
    .catch(err => next(err));
})
.put(corsWithOptions, verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorite');
})
.delete(corsWithOptions, verifyUser, (req, res, next)=>{
    Favorites.remove({})
    .then(resp =>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    })
    .catch(err => next(err));
});

favoriteRouter.route('/:dishId')
.get(corsWithOptions, verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._Id })
    .then(favorite =>{
        if(favorite === null){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({'exists': false, 'favorite': favorite });
        }
        else
        if(favorite.dishes.indexOf(req.params.dishId)){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({'exists': false, 'favorite': favorite });
        }
        else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({'exists': true, 'favorite': favorite });
        }
    });
})
.post(corsWithOptions, verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
    .then(favorite => {
        if(favorite !== null){
            let isNewDish = true;
            for(let dishId of favorite.dishes){
                if(dishId.equals(req.params.dishId)) {
                    isNewDish = false;
                    break;
                }
            }
            if(isNewDish){
                favorite.dishes.push(req.params.dishId);
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate('dishes')
                    .populate('user')
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    });
                });
            }
            else {
                res.statusCode = 403;
                res.json({err:'This dish already exist in your favorite list!'});
            }
        }
        else {
            Favorites.create({})
            .then(favorite => {
                favorite.dishes.push(req.params.dishId);
                favorite.user = req.user._id;
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate('dishes')
                    .populate('user')
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    });
                })
                .catch(err => next(err));
            });
        }
    })
    .catch(err => next(err));
})
.delete(corsWithOptions, verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
    .then(favorite => {
        const filteredList = favorite.dishes.filter(dishId => dishId.equals(req.params.dishId));
        if(filteredList.length>0){
            favorite.dishes.remove(req.params.dishId);
            favorite.save()
            .then(favorite => {
                Favorites.findById(favorite._id)
                .populate('dishes')
                .populate('user')
                .then(favorite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                });
            })
            .catch(err=> next(err));
        }
        else {
            res.statusCode = 403;
            res.json({err: 'This dish does not exit in your favorite list!'});
        }
    });
});

const Schema = mongoose.Schema;

const commentSchema = new Schema({
    rating:{
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment:{
        type: String,
        required: true
    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dishId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dish'
    }
},
{
    timestamps: true
});

const Comments = mongoose.model('Comment', commentSchema);

const commentRouter = express.Router();
commentRouter.use(bodyParser.json());

// REST API call for comments

commentRouter.route('/')
.options(corsWithOptions, (req, res)=>{
    res.statusCode = 200;
})
.get(openCors, (req, res, next)=>{
    Comments.find(req.query)
    .populate('author')
    .then(comments=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(comments);
    })
    .catch(err =>{next(err);});
})
.post(corsWithOptions, verifyUser, (req, res, next)=>{
    if(req.body  !== null){
        req.body.author = req.user._id;
        Comments.create(req.body)
        .then(comment =>{
            Comments.findById(comment._id)
            .populate('author')
            .then(comment =>{
                res.statusCode =200;
                res.setHeader('Content-Type','application/json');
                res.json(comment);
            });
        });
    }
    else {
        const err = new Error('Comment not found in the request body!');
        err.statusCode = 404;
        return next(err);
    }
})
.put(corsWithOptions, verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /comments');
})
.delete(corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
    Comments.remove({})
    .then(comments => {
        res.statusCode = 200;
        res.setHeader('Content-type', 'application/json');
        res.json(comments);
    })
    .catch(err =>{next(err);});
});

// REST API call for specific comment from comments

commentRouter.route('/:commentId')
.options(corsWithOptions, (req, res)=>{
    res.statusCode = 200;
})
.get(openCors, (req, res, next)=>{
    Comments.findById(req.params.commentId)
    .populate('author')
    .then(comment=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(comment);
    })
    .catch(err =>{next(err);});
})
.post(corsWithOptions, verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /comments/' + req.params.commentId);
})
.put(corsWithOptions, verifyUser, (req, res, next)=>{
    Comments.findById(req.params.commentId)
    .then(comment =>{
        if(comment!== null){
            if(comment.author.equals(req.user._id)){
                Comments.findByIdAndUpdate(req.params.commentId, {$set : req.body}, {new: true})
                .then(comment =>{
                    Comments.findById(comment._id)
                    .populate('author')
                    .then(comment => {
                        res.statusCode =200;
                        res.setHeader('Content-Type','application/json');
                        res.json(comment);
                    });
                });
            }
            else {
                const err = new Error('You are not allowed to edit this comment!');
                err.statusCode = 403;
                res.json({err: err});
                return next(err);
            }
        }
        else {
            const err = new Error('Comment' + req.params.commentId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
    })
    .catch(err =>{next(err);});
})
.delete(corsWithOptions, verifyUser, (req, res, next) => {
    Comments.findById(req.params.commentId)
    .then(comment => {
        if(comment !== null){
            if(comment.author.equals(req.user._id)){
                Comments.findByIdAndRemove(comment._id)
                    .then(comment => {
                        res.statusCode = 200;
                        res.setHeader('Content-type', 'application/json');
                        res.json(comment);
                    })
                    .catch( err => res.json({error: err}));
            }
            else {
                const err = new Error('You are not allowed to delete this comment!');
                err.statusCode = 403;
                res.json({err: err});
                return next(err);
            }
        }
        else {
            const err = new Error('Comment with commentId: ' + req.params.commentId+ 'not found!');
            err.statusCode = 404;
            res.json({err: err});
            return next(err);
        }
    })
    .catch(err =>{next(err);});
});

const uploadRouter = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'public/images');
    },
    filename: (req, file, cb)=>{
        cb(null, file.originalname);
    }
});
const imageFileFilter = (req, file, cb)=>{
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)){
        cb(new Error('You can upload only image files!'), null);
    }
    else {
        cb(null, true);
    }
};

const upload = multer({storage:storage, fileFilter: imageFileFilter });

uploadRouter.route('/')
.options(corsWithOptions, (req, res)=>{
    res.sendStatus = 200;
})
.get(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    res.statusCode = 403;
    res.end('GET call is not supported on /imageUpload');
})
.post(corsWithOptions, verifyUser, verifyAdmin, upload.single('imageFile'), (req, res, next)=>{
    if(!req.file){
        res.statusCode = 403;
        res.end('please attach an image file!');
    }
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.json(req.file);
})
.put(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT call is not supported on /imageUpload');
})
.delete(corsWithOptions, verifyUser, verifyAdmin, (req, res, next)=>{
    res.statusCode = 403;
    res.end('GET call is not supported on /imageUpload');
});

const url = config.mongoUrl;
const connect = mongoose.connect(url);

connect.then(db=>{
  console.log('connected to database successfully');
},(err)=>{
  console.log(err);
});

const app = express();

app.use('*',(req, res, next)=>{
  if(req.secure){
    return next();
  }
  else {
    // with status=307 we are redirecting the get, post, put, delete calls from http to https
    // without 307 it will do only Get calls after redirecting to https
    // for all (Get, Post, Put, Delete) calls
    res.redirect(307, 'https://'+req.hostname+':'+ app.get('secPort') + req.originalUrl);
  }
});
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);

app.set('views', path.join(__dirname$1, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser('1234-453-356-456-456454'));

app.use(passport.initialize());
app.use(cors());
app.use('/', router);
// authentications

app.use('/users', userRouter);
app.use(express.static(path.join(__dirname$1, 'public')));
// after authentication now can access other end-points
app.use('/dishes',dishRouter);
app.use('/comments', commentRouter);
app.use('/promotions',promoRouter);
app.use('/leaders',leaderRouter);
app.use('/imageUpload',uploadRouter);
app.use('/favorites', favoriteRouter);
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
app.set('secPort', port + 443);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Create HTTPS server.
 */
const options = {
  key: fs.readFileSync(path.join(__dirname, 'private.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certificate.pem'))
};
const secureServer = https.createServer(options, app);
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
/**
 * Listen on provided  secure port, on all network interfaces.
 */
secureServer.listen(app.get('secPort'), ()=>{
  console.log('Server listening on port'+ app.get('secPort'));
});

secureServer.on('error', onError);
secureServer.on('listening',onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
