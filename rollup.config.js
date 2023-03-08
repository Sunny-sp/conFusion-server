import path from "path";
import {fileURLToPath} from 'url';
import image from '@rollup/plugin-image';
import copy from 'rollup-plugin-copy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    input: "./bin/www.js",
    output: {
        file: `${path.join(__dirname, 'build')}/index.js`,
        format: "module"
    },
    plugins:[
        image(),
        copy(
            {
                targets: [
                    { src: 'public', dest: 'build' },
                    { src: 'bin/certificate.pem', dest: 'build' },
                    { src: 'bin/private.key', dest: 'build' }
                ]
            }
        )
    ],
}
