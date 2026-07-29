import { createServer } from 'node:https';
import { Server, Socket } from 'socket.io';
import { StreamedBrowser } from "./playwright.ts";
import * as fs from "node:fs";

function makeServer() {
    const server = createServer({
        cert: fs.readFileSync('./localhost+1.pem'),
        key: fs.readFileSync('./localhost+1-key.pem'),
    });


    const io = new Server(server, {
        cors: {
            origin: '*',
        },
    });
    io.on('connection', onSocketConnect);
    
    const sb = new StreamedBrowser(onBrowserFrame);
    return { server, io, sb }
}
const { server, io, sb } = makeServer();

async function onSocketConnect(socket: Socket) {
    console.log('Connected');
    socket.on('disconnect', onSocketDisconnect);
    await sb.streamUrl('https://calebhair.github.io', 'Pixel 5')
}

async function onSocketDisconnect() {
    console.log('Disconnected');
    await sb.stopStream();
}

function onBrowserFrame(data, sessionId) {
    const buf = Buffer.from(data, 'base64');
    // socket.send(buffer, { binary: true });
    io.emit('frame', buf);
}


server.listen(3000, () => {
    console.log('server running');
});