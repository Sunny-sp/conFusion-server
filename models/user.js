import mongoose from "mongoose";

const Schema =  mongoose.Schema;

const usersSchema = new Schema({
    username:{
        type:String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    admin:{
        type: Boolean,
        default:false
    }
});

const User = mongoose.model('user',usersSchema);

export default User;
