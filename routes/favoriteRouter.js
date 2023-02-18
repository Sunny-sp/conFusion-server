import bodyParser from 'body-parser';
import express from 'express';
import * as authenticate from '../authenticate.js';
import Dishes from '../models/dishes.js';
import Favorites from '../models/favorite.js';
import * as cors from './cors.js';

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
    .populate('dishes')
    .populate('user')
    .then(favorite =>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
    .populate('dishes')
    .populate('user')
    .then(favorite => {
        if(favorite !== null){
            let isNewDish = true;
            let ifPushed = false;
            for(let id of req.body){
                for(let dishId of favorite.dishes){
                    if(dishId.equals(id._id)) {
                        isNewDish = false;
                        break;
                    }
                }
                if(isNewDish){
                    favorite.dishes.push(id._id);
                    favorite.save();
                    ifPushed = true;
                }
                isNewDish = true;
            }
            if(ifPushed){
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }
            else{
                res.statusCode = 403;
                res.json({err:'Please select new dishes to add into favorite dish list!'})
            }
        }
        else{
            Favorites.create({})
            .then(favorite => {
                for(const id of req.body ){
                    favorite.dishes.push(id);
                }
                favorite.user = req.user._id;
                favorite.save();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorite');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    Favorites.remove({})
    .populate('dishes')
    .populate('user')
    .then(resp =>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    })
    .catch(err => next(err));
});

favoriteRouter.route('/:dishId')
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
    .populate('dishes')
    .populate('user')
    .then(favorite => {
        if(favorite !== null){
            let isNewDish = true;
            for(let dishId of favorite.dishes){
                if(dishId.equals(req.params.dishId)) {
                    isNewDish = false;
                    break;
                }
            }
            if(isNewDish){
                favorite.dishes.push(req.params.dishId);
                favorite.save();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }
            else{
                res.statusCode = 403;
                res.json({err:'Please select new dishes to add into favorite dish list!'})
            }
        }
        else{
            Favorites.create({})
            .then(favorite => {
                favorite.dishes.push(req.params.dishId);
                favorite.user = req.user._id;
                favorite.save();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
        }
    })
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
    .populate('dishes')
    .populate('user')
    .then(favorite => {
        favorite.dishes.pop(req.params.dishId);
        favorite.save();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    })
});

export default favoriteRouter;
