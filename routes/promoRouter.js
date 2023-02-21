import express from "express";
import bodyParser from "body-parser";
import Promotions from "../models/promotions.js";
import * as authenticate from '../authenticate.js';
import * as cors from './cors.js';

const promoRouter = express.Router();
promoRouter.use(bodyParser.json());

promoRouter.route('/')
.options(cors.corsWithOptions, (req, res)=>{
    res.sendStatus = 200;
})
.get(cors.openCors, (req, res, next)=>{
    Promotions.find(req.query)
    .then(promos => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(promos);
    })
    .catch(error => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    Promotions.create(req.body)
    .then(promo => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(promo);
    })
    .catch(error=>next(error));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /Promotions');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    Promotions.deleteMany({})
    .then(resp=>{
        res.statusCode =200;
        res.setHeader('Content-Type','application/json');
        res.json(resp);
    })
    .catch(error=>next(error));
});
// REST call with specific promo
promoRouter.route('/:promoId')
.options(cors.corsWithOptions, (req, res)=>{
    res.statusCode = 200;
})
.get(cors.openCors, (req, res, next)=>{
    Promotions.findById(req.params.promoId)
    .then(promo=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(promo);
    })
    .catch(error=>next(error));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /Promotions/' + req.params.promoId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    Promotions.findByIdAndUpdate(req.params.promoId,{$set: req.body},{new: true})
    .then(promo=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(promo);
    })
    .catch(error=>next(error));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Promotions.findByIdAndRemove(req.params.promoId)
    .then(resp=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcation/json');
        res.json(resp);
    })
    .catch(error=>next(error));
});

export default promoRouter;
