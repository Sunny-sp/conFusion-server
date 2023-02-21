import express from "express";
import bodyParser from "body-parser";
import Dishes from "../models/dishes.js";
import * as authenticate from '../authenticate.js';
import * as cors from './cors.js';
import Comments from "../models/comments.js";
const commentRouter = express.Router();
commentRouter.use(bodyParser.json());

// REST API call for comments

commentRouter.route('/')
.options(cors.corsWithOptions, (req, res)=>{
    res.statusCode = 200;
})
.get(cors.openCors, (req, res, next)=>{
    Comments.find(req.query)
    .populate('author')
    .then(comments=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(comments);
    })
    .catch(err =>{next(err)});
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    if(req.body  !== null){
        req.body.author = req.user._id;
        Comments.create(req.body)
        .then(comment =>{
            Comments.findById(comment._id)
            .populate('author')
            .then(comment =>{
                res.statusCode =200;
                res.setHeader('Content-Type','application/json');
                res.json(comment);
            })
        })
    }
    else{
        const err = new Error('Comment not found in the request body!');
        err.statusCode = 404;
        return next(err);
    }
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT operation is not supported on /comments');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Comments.remove({})
    .then(comments => {
        res.statusCode = 200;
        res.setHeader('Content-type', 'application/json');
        res.json(comments);
    })
    .catch(err =>{next(err)});
});

// REST API call for specific comment from comments

commentRouter.route('/:commentId')
.options(cors.corsWithOptions, (req, res)=>{
    res.statusCode = 200;
})
.get(cors.openCors, (req, res, next)=>{
    Comments.findById(req.params.commentId)
    .populate('author')
    .then(comment=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(comment);
    })
    .catch(err =>{next(err)});
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.end('POST operation is not supported on /comments/' + req.params.commentId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    Comments.findById(req.params.commentId)
    .then(comment =>{
        if(comment!== null){
            if(comment.author.equals(req.user._id)){
                Comments.findByIdAndUpdate(req.params.commentId, {$set : req.body}, {new: true})
                .then(comment =>{
                    Comments.findById(comment._id)
                    .populate('author')
                    .then(comment => {
                        res.statusCode =200;
                        res.setHeader('Content-Type','application/json');
                        res.json(comment);
                    });
                })
            }
            else{
                const err = new Error('You are not allowed to edit this comment!');
                err.statusCode = 403;
                return next(err);
            }
        }
        else{
            const err = new Error('Comment' + req.params.commentId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
    })
    .catch(err =>{next(err)});
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Comments.findById(req.params.commentId)
    .then(comment => {
        if(comment !== null){
            if(comment.author.equals(req.user._id)){
                Comments.findByIdAndRemove(req.params._id)
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(comment);
            }
            else{
                const err = new Error('You are not allowed to delete this comment!');
                err.statusCode = 403;
                return next(err);
            }
        }
        else{
            const err = new Error('Comment with commentId: ' + req.params.commentId+ 'not found!');
            err.statusCode = 404;
            return next(err);
        }
    })
    .catch(err =>{next(err)});
});

export default commentRouter;