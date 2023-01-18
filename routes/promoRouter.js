import express from "express";
import bodyParser from "body-parser";

const promoRouter = express.Router();
promoRouter.use(bodyParser.json());

promoRouter.route('/')
.all((req, res, next)=>{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    next();
})
.get((req, res, next)=>{
    res.end('Will send all the promos to you!');
})
.post((req, res, next)=>{
    res.end('Will add the promo:' + req.body.name + ' with details: ' + req.body.description);
})
.put((req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /promos');
})
.delete((req, res, next)=>{
    res.end('deleting all the promos!');
});

// REST call with specific promo
promoRouter.route('/:promoId')
.all((req, res, next)=>{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    next();
})
.get((req, res, next)=>{
    res.end('Will send details of the promo ' + req.params.promoId + ' to you!');
})
.post((req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /promos/' + req.params.promoId);
})
.put((req, res, next)=>{
    res.write('upadating the promo: ' + req.params.promoId + '\n')
    res.end('Will update the promo: '+ req.body.name + ' with details: ' + req.body.description);
})
.delete((req, res, next) => {
    res.end('Deleting promo: ' + req.params.promoId);
});

export default promoRouter;
