import cors from 'cors';

const whiteList = ['http://localhost:3000', 'https://localhost:3443', 'https://computer:3001'];

export const corsOptionsDelegate = {
    origin: function (origin, callback) {
        if (whiteList.indexOf(origin) !== -1 && origin) {
        callback(null, true)
        } else {
        callback(new Error('Not allowed by CORS'))
        }
    }
}

export const openCors = cors();
export const corsWithOptions = cors(corsOptionsDelegate);
