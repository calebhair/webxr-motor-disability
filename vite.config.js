import fs from 'node:fs';
import {CERT_PATH, CLIENT_PORT, KEY_PATH} from './src/constants.ts';

export default {
    server: {
        https: {
            cert: fs.readFileSync(CERT_PATH),
            key: fs.readFileSync(KEY_PATH),
        },
        port: CLIENT_PORT,
    },
    resolve: {
        dedupe: ['three'],
    },
};