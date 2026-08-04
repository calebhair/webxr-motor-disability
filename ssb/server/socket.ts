import { createServer } from 'node:https';
import * as fs from "node:fs";
import { Server, Socket } from 'socket.io';

import StreamedBrowser from "./streamed-browser.ts";

export function setupSocketStreamedBrowser() {
    // Create HTTPS server to allow immersive VR/AR
    const server = createServer({
        cert: fs.readFileSync('./localhost+1.pem'),
        key: fs.readFileSync('./localhost+1-key.pem'),
    });

    const io = new Server(server, {
        cors: { origin: '*', }, // Allow cross-origin, as arbitrary IP addresses on the LAN may connect to this
    });
    io.on('connection', onSocketConnect);

    async function onSocketConnect(socket: Socket) {
        console.log('Connected', socket.id);
        socket.on('disconnect', async () => {
            console.log(`Disconnected ${socket.id}`);
            await socket.data.streamedBrowser.stopStream();
        });
        
        await setupBrowserForSocket(socket, onBrowserFrame)
    }

    function onBrowserFrame(data, sessionId) {
        const buf = Buffer.from(data, 'base64');
        io.volatile.emit('frame', buf);
    }
    
    return { server, io }
}

async function setupBrowserForSocket(socket: Socket, onBrowserFrame: Function) {
    const sb = socket.data.streamedBrowser = new StreamedBrowser(onBrowserFrame);
    socket.on('click', async eventData => {
        await sb.click(eventData);
    })
    socket.on('dispatchTouchEvent', async eventData => {
        await sb.dispatchTouchEvent(eventData);
    })

    await sb.streamUrl(socket.handshake.query);
}