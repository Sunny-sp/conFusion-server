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
                    ifPushed = true;
                }
                isNewDish = true;
            }
            if(ifPushed){
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate('dishes')
                    .populate('user')
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                })
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
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate('dishes')
                    .populate('user')
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                })
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
    .then(resp =>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    })
    .catch(err => next(err));
});

favoriteRouter.route('/:dishId')
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._Id })
    .then(favorite =>{
        if(favorite === null){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({'exists': false, 'favorite': favorite });
        }
        else
        if(favorite.dishes.indexOf(req.params.dishId)){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({'exists': false, 'favorite': favorite });
        }
        else{
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({'exists': true, 'favorite': favorite });
        }
    })
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
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
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate('dishes')
                    .populate('user')
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                });
            }
            else{
                res.statusCode = 403;
                res.json({err:'This dish already exist in your favorite list!'});
            }
        }
        else{
            Favorites.create({})
            .then(favorite => {
                favorite.dishes.push(req.params.dishId);
                favorite.user = req.user._id;
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate('dishes')
                    .populate('user')
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                })
                .catch(err => next(err));
            })
        }
    })
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    Favorites.findOne({user: req.user._id})
    .then(favorite => {
        const filteredList = favorite.dishes.filter(dishId => dishId.equals(req.params.dishId));
        if(filteredList.length>0){
            favorite.dishes.remove(req.params.dishId);
            favorite.save()
            .then(favorite => {
                Favorites.findById(favorite._id)
                .populate('dishes')
                .populate('user')
                .then(favorite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            })
            .catch(err=> next(err));
        }
        else{
            res.statusCode = 403;
            res.json({err: 'This dish does not exit in your favorite list!'})
        }
    })
});

export default favoriteRouter;
