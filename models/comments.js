import mongoose from "mongoose";
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

export default Comments;
