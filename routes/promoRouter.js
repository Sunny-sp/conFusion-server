import express from "express";
import bodyParser from "body-parser";
import Promotions from "../models/promotions.js";

const promoRouter = express.Router();
promoRouter.use(bodyParser.json());

promoRouter.route('/')
.get((req, res, next)=>{
    Promotions.find({})
    .then(promos => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(promos);
    })
    .catch(error => next(error));
})
.post((req, res, next)=>{
    Promotions.create(req.body)
    .then(promo => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(promo);
    })
    .catch(error=>next(error));
})
.put((req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /Promotions');
})
.delete((req, res, next)=>{
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
.get((req, res, next)=>{
    Promotions.findById(req.params.promoId)
    .then(promo=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(promo);
    })
    .catch(error=>next(error));
})
.post((req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /Promotions/' + req.params.promoId);
})
.put((req, res, next)=>{
    Promotions.findByIdAndUpdate(req.params.promoId,{$set: req.body},{new: true})
    .then(promo=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(promo);
    })
    .catch(error=>next(error));
})
.delete((req, res, next) => {
    Promotions.findByIdAndRemove(req.params.promoId)
    .then(resp=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcation/json');
        res.json(resp);
    })
    .catch(error=>next(error));
});

export default promoRouter;
