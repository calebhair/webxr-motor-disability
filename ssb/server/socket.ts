import { createServer } from 'node:https';
import * as fs from "node:fs";
import { Server, Socket } from 'socket.io';

import StreamedBrowser from "./streamed-browser.ts";

export function setupSocketStreamedBrowser() {
    const server = createServer({
        cert: fs.readFileSync('./localhost+1.pem'),
        key: fs.readFileSync('./localhost+1-key.pem'),
    });

    const io = new Server(server, {
        cors: { origin: '*', },
    });
    io.on('connection', onSocketConnect);

    async function onSocketConnect(socket: Socket) {
        console.log('Connected');
        socket.on('disconnect', async () => {
            console.log('Disconnected');
            await socket.data.streamedBrowser.stopStream();
        });

        const sb = socket.data.streamedBrowser = new StreamedBrowser(onBrowserFrame);
        socket.on('click', (eventData) => {
            sb.click(eventData);
        })
        socket.on('dispatchTouchEvent', (eventData) => {
            sb.dispatchTouchEvent(eventData);
        })

        await sb.streamUrl(socket.handshake.query);
    }

    function onBrowserFrame(data, sessionId) {
        const buf = Buffer.from(data, 'base64');
        // socket.send(buffer, { binary: true });
        io.volatile.emit('frame', buf);
    }
    
    return { server, io }
}