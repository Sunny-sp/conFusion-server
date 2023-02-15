import express from "express";
const router = express.Router();
import * as cors from './cors.js';
/* GET home page. */
router.get('/', cors.openCors, (req, res, next)=>{
  res.render('index', { title: 'Express' });
});

export default router;
