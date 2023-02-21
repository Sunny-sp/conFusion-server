import mongoose from "mongoose";
import { loadType} from 'mongoose-currency'

const Currency = loadType(mongoose);
const Schema = mongoose.Schema;

const dishSchema = new Schema({
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
        type: Currency,
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
export default Dishes;
