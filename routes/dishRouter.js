import express from "express";
import bodyParser from "body-parser";
import Dishes from "../models/dishes.js";
import * as authenticate from '../authenticate.js';
import * as cors from './cors.js';

const dishRouter = express.Router();
dishRouter.use(bodyParser.json());

dishRouter.route('/')
.options(cors.corsWithOptions, (req, res)=>{
    res.sendStatus = 200;
})
.get(cors.openCors, (req, res, next)=>{
    Dishes.find(req.query)
    .populate('comments.author')
    .then(dishes=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dishes);
    })
    .catch(err =>{next(err)});
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    Dishes.create(req.body)
    .then(dish => {
        console.log('created dish',dish);
        res.statusCode =200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err)});
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /dishes');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
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
.options(cors.corsWithOptions, (req, res)=>{
    res.statusCode = 200;
})
.get(cors.openCors, (req, res, next)=>{
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then(dish=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err)});
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /dishes/' + req.params.dishId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    Dishes.findByIdAndUpdate(req.params.dishId,{$set : req.body},{ new: true})
    .then(dish=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err)});

})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
    .then( resp => {
        res.statusCode = 200;
        res.setHeader('Content-type', 'application/json');
        res.json(resp);
    })
    .catch(err =>{next(err)});
});

export default dishRouter;
