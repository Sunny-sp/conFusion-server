/**
 * passport authentication configuration file
 */
import jwt  from "jsonwebtoken";
import {Strategy as JwtStrategy} from 'passport-jwt';
import { ExtractJwt } from "passport-jwt";
import passport from "passport";
import User from "./models/user.js";
import {Strategy as LocalStrategy} from 'passport-local';
import config from "./config.js";
import app from "./app.js";
// passport authentication configuration
// make sure you import in app.js file before using passport.authenticate() function (import './authenticate)
// serialize and deserialize will use salt and mix it with username or password and make a hash data
// check in database

//there is not export from this file since it is a config file just import it before using.
//It will automatically take care of things

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

export const getToken = (user_id)=>{
    return jwt.sign(user_id, config.secretKey,{expiresIn: '5h' });
}
// options object
const opts ={};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

export const jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done)=>{
    console.log('JWT Payload'+JSON.stringify(jwt_payload, null, 2));
    User.findOne({_id:jwt_payload._id},(err, user)=>{
        if(err){
            return done(err, false);
        }
        else if(user){
            return done(null, user);
        }
        else{
            return done(null,false);
        }
    });
}));

export const verifyUser = passport.authenticate('jwt',{session:false});
