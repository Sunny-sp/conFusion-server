import mongoose from "mongoose";
import passportLocalMongoose from 'passport-local-mongoose';
const Schema =  mongoose.Schema;

const usersSchema = new Schema({
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

export default User;
