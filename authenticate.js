/**
 * passport authentication configuration file
 */
import jwt from "jsonwebtoken";
import { Strategy as JwtStrategy } from 'passport-jwt';
import { ExtractJwt } from "passport-jwt";
import passport from "passport";
import User from "./models/user.js";
import { Strategy as LocalStrategy } from 'passport-local';
import config from "./config.js";
import PassportFacebookToken from "@lmaj/passport-facebook-token";
// passport authentication configuration
// make sure you import in app.js file before using passport.authenticate() function (import './authenticate)
// serialize and deserialize will use salt and mix it with username or password and make a hash data
// check in database

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

export const getToken = (user_id) => {
    return jwt.sign(user_id, config.secretKey, { expiresIn: '1h' });
}
// options object
const opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

export const jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
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

export const facebookPassport = passport.use(new PassportFacebookToken(
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

export const verifyUser = passport.authenticate('jwt', { session: false });
// here after verifyUser middleware called it returns (req, res, next) so further middlewares (ex verifyAdmin) should
// have  (req, res, next) parameters to run properly
export const verifyAdmin = (req, res, next) => {
    if (req.user.admin === true) {
        next();
    }
    else {
        const err = new Error('You are not authorized to perform this operation!');
        err.status = 403;
        next(err);
    }
}
