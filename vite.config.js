import fs from "node:fs";

export default {
    server: {
        https: {
            cert: fs.readFileSync('./localhost+1.pem'),
            key: fs.readFileSync('./localhost+1-key.pem'),
        }
    },
    resolve: {
        dedupe: ['three']
    },
}