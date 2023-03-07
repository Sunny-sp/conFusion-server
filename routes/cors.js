import cors from 'cors';

const whiteList = ['http://localhost:3000','http://localhost:3001', 'https://localhost:3443', 'http://192.168.1.6:3001', 'https://sunny-sp.github.io'];

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
