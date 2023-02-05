import express from "express";
import bodyParser from "body-parser";
import Dishes from "../models/dishes.js";
import * as authenticate from '../authenticate.js';

const dishRouter = express.Router();
dishRouter.use(bodyParser.json());

dishRouter.route('/')
.get((req, res, next)=>{
    Dishes.find({})
    .then(dishes=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dishes);
    })
    .catch(err =>{next(err)});
})
.post(authenticate.verifyUser, (req, res, next)=>{
    Dishes.create(req.body)
    .then(dish => {
        console.log('created dish',dish);
        res.statusCode =200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err)});
})
.put(authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /dishes');
})
.delete(authenticate.verifyUser, (req, res, next)=>{
    Dishes.deleteMany({})
    .then(resp => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    })
    .catch(err =>{next(err)});
});

// REST call with specific dish
dishRouter.route('/:dishId')
.get((req, res, next)=>{
    Dishes.findById(req.params.dishId)
    .then(dish=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err)});
})
.post(authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /dishes/' + req.params.dishId);
})
.put(authenticate.verifyUser, (req, res, next)=>{
    Dishes.findByIdAndUpdate(req.params.dishId,{$set : req.body},{ new: true})
    .then(dish=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err)});

})
.delete(authenticate.verifyUser, (req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
    .then( resp => {
        res.statusCode = 200;
        res.setHeader('Content-type', 'application/json');
        res.json(resp);
    })
    .catch(err =>{next(err)});
});

// REST API call for specific dishId to get comments

dishRouter.route('/:dishId/comments')
.get((req, res, next)=>{
    Dishes.findById(req.params.dishId)
    .then(dish=>{
        if(dish !== null){
            res.statusCode = 200;
            res.setHeader('Content-Type','application/json');
            res.json(dish.comments);
        }
        else{
            err = new Error('Dish' + req.params.dishId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
    })
    .catch(err =>{next(err)});
})
.post(authenticate.verifyUser, (req, res, next)=>{
    Dishes.findById(req.params.dishId)
    .then(dish =>{
        if(dish !== null){
            dish.comments.push(req.body);
            dish.save();
            res.statusCode =200;
            res.setHeader('Content-Type','application/json');
            res.json(dish.comments);
        }
        else{
            err = new Error('Dish' + req.params.dishId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
    })
})
.put(authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /dishes/' + req.params.dishId + '/comments');
})
.delete((req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then( dish => {
        if(dish !== null){
            for(let comment of dish.comments){
                dish.comments.id(comment._id).remove();
            }
            dish.save();
            res.statusCode = 200;
            res.setHeader('Content-type', 'application/json');
            res.json(dish);
        }
        else{
            err = new Error('Dish' + req.params.dishId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }

    })
    .catch(err =>{next(err)});
});


// REST API call for specific dishId to get specific comments from comments

dishRouter.route('/:dishId/comments/:commentsId')
.get((req, res, next)=>{
    Dishes.findById(req.params.dishId)
    .then(dish=>{
        if(dish !== null && dish.comments.id(req.params.commentsId) !== null){
            res.statusCode = 200;
            res.setHeader('Content-Type','application/json');
            res.json(dish.comments.id(req.params.commentsId));
        }
        else if(dish == null){
            err = new Error('Dish' + req.params.dishId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
        else{
            err = new Error('Comment' + req.params.commentsId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
    })
    .catch(err =>{next(err)});
})
.post(authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /dishes/' + req.params.dishId + '/comments'+req.params.commentsId);
})
.put(authenticate.verifyUser, (req, res, next)=>{
    Dishes.findById(req.params.dishId)
    .then(dish =>{
        if(dish !== null && dish.comments.id(req.params.commentsId) !== null){
            if(req.body.rating){
                dish.comments.id(req.params.commentsId).rating = req.body.rating
            }
            if(req.body.comment){
                dish.comments.id(req.params.commentsId).comment = req.body.comment
            }
            dish.save();
            res.statusCode =200;
            res.setHeader('Content-Type','application/json');
            res.json(dish.comments.id(req.params.commentsId));
        }
        else if(dish == null){
            err = new Error('Dish' + req.params.dishId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
        else{
            err = new Error('Comment' + req.params.commentsId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
    })
    .catch(err =>{next(err)});
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then( dish => {
        if(dish !== null && dish.comments.id(req.params.commentsId) !== null){
            dish.comments.id(req.params.commentsId).remove();
            dish.save();
            res.statusCode = 200;
            res.setHeader('Content-type', 'application/json');
            res.json(dish);
        }
        else if(dish == null){
            err = new Error('Dish' + req.params.dishId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
        else{
            err = new Error('Comment' + req.params.commentsId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
    })
    .catch(err =>{next(err)});
});

export default dishRouter;
