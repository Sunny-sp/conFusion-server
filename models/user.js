import mongoose from "mongoose";
import passportLocalMongoose from 'passport-local-mongoose';
const Schema =  mongoose.Schema;

const usersSchema = new Schema({
    admin:{
        type: Boolean,
        default:false
    }
});

usersSchema.plugin(passportLocalMongoose);
const User = mongoose.model('user',usersSchema);

export default User;
