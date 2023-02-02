/**
 * passport authentication configuration file
 */
import passport from "passport";
import User from "./models/user.js";
import LocalStrategy from 'passport-local';
// passport authentication configuration
// make sure you import in app.js file before using passport.authenticate() function (import './authenticate)
// serialize and deserialize will use salt and mix it with username or password and make a hash data
// check in database

//there is not export from this file since it is a config file just import it before using.
//It will automatically take care of things
passport.use(passport.initialize());
passport.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
