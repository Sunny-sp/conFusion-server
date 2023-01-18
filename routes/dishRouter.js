import express from "express";
import bodyParser from "body-parser";
import Dishes from "../models/dishes.js";
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
.post((req, res, next)=>{
    Dishes.create(req.body)
    .then(dish => {
        console.log('created dish',dish);
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err)});
})
.put((req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /dishes');
})
.delete((req, res, next)=>{
    Dishes.deleteMany({})
    .then(resp => {
        res.statusCode = 200;
        res.setHeader('Content-type', 'application/json');
        res.json(resp);
    })
    .catch(err =>{next(err)});
});

// REST call with specific dish
dishRouter.route('/:dishId')
.get((req, res, next)=>{
    Dishes.findById(req.params.dishId)
    .then(dishes=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dishes);
    })
    .catch(err =>{next(err)});
})
.post((req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /dishes/' + req.params.dishId);
})
.put((req, res, next)=>{
    Dishes.findByIdAndUpdate(req.params.dishId,{$set : req.body},{ new: true})
    .then(dish=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(dish);
    })
    .catch(err =>{next(err)});

})
.delete((req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
    .then( resp => {
        res.statusCode = 200;
        res.setHeader('Content-type', 'application/json');
        res.json(resp);
    })
    .catch(err =>{next(err)});
});

export default dishRouter;
