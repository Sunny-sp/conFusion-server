import express from "express";
import bodyParser from "body-parser";
import Leaders from '../models/leaders.js';
const leaderRouter = express.Router();
leaderRouter.use(bodyParser.json());

leaderRouter.route('/')
.get((req, res, next)=>{
    Leaders.find({})
    .then(leaders => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(leaders);
    })
    .catch(error => next(error));
})
.post((req, res, next)=>{
    Leaders.create(req.body)
    .then(leader => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(leader);
    })
    .catch(error=>next(error));
})
.put((req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /leaders');
})
.delete((req, res, next)=>{
    Leaders.deleteMany({})
    .then(resp=>{
        res.statusCode =200;
        res.setHeader('Content-Type','application/json');
        res.json(resp);
    })
    .catch(error=>next(error));
});

// REST call with specific leader
leaderRouter.route('/:leaderId')
.get((req, res, next)=>{
    Leaders.findById(req.params.leaderId)
    .then(leader=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(leader);
    })
    .catch(error=>next(error));
})
.post((req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /leaders/' + req.params.leaderId);
})
.put((req, res, next)=>{
    Leaders.findByIdAndUpdate(req.params.leaderId,{$set: req.body},{new: true})
    .then(leader=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcaition/json');
        res.json(leader);
    })
    .catch(error=>next(error));
})
.delete((req, res, next) => {
    Leaders.findByIdAndRemove(req.params.leaderId)
    .then(resp=>{
        res.statusCode = 200;
        res.setHeader('Content-type','applcation/json');
        res.json(resp);
    })
    .catch(error=>next(error));
});

export default leaderRouter;
