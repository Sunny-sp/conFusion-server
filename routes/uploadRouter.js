import express from "express";
import * as authenticate from '../authenticate.js';
import bodyParser from "body-parser";
import multer from "multer";

const uploadRouter = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'public/images');
    },
    filename: (req, file, cb)=>{
        cb(null, file.originalname);
    }
});
const imageFileFilter = (req, file, cb)=>{
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)){
        cb(new Error('You can upload only image files!'), null);
    }
    else{
        cb(null, true);
    }
}

const upload = multer({storage:storage, fileFilter: imageFileFilter });

uploadRouter.route('/')
.get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    res.statusCode = 403;
    res.end('GET call is not supported on /imageUpload');
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res, next)=>{
    if(!req.file){
        res.statusCode = 403;
        res.end('please attach an image file!');
    }
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.json(req.file);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    res.statusCode = 403;
    res.end('PUT call is not supported on /imageUpload');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    res.statusCode = 403;
    res.end('GET call is not supported on /imageUpload');
});

export default uploadRouter;
