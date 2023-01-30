import mongoose, { mongo } from "mongoose";
import { loadType } from "mongoose-currency";

const Currency = loadType(mongoose);
const Schema = mongoose.Schema;

const promotionsSchema = new Schema({
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

export default Promotions;
