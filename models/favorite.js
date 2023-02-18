import mongoose, { mongo } from "mongoose";
import Dishes from "./dishes.js";
const Schema = mongoose.Schema;

const FavoriteDishes = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    dishes: [
        {
            type: Schema.Types.ObjectId,
            ref:'Dish'
        }
    ]    
});

const Favorites = mongoose.model('Favorite',FavoriteDishes);
export default Favorites;
