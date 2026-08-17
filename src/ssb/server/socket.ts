import { createServer } from 'node:https';
import * as fs from 'node:fs';
import { Server, Socket } from 'socket.io';

import StreamedBrowser from './streamed-browser.ts';

export function setupSocketStreamedBrowser() {
    // Create HTTPS server to allow immersive VR/AR
    const server = createServer({
        cert: fs.readFileSync('./localhost+1.pem'),
        key: fs.readFileSync('./localhost+1-key.pem'),
    });

    const io = new Server(server, {
        cors: { origin: '*' }, // Allow cross-origin, as arbitrary IP addresses on the LAN may connect to this
    });
    io.on('connection', onSocketConnect);

    async function onSocketConnect(socket: Socket) {
        console.log('Connected', socket.id);
        socket.join(socket.id);
        socket.on('disconnect', async () => {
            console.log(`Disconnected ${socket.id}`);
            await socket.data.streamedBrowser.stopStream();
        });
        
        await setupBrowserForSocket(socket, (data, sessionId) => {
            const buf = Buffer.from(data, 'base64');
            // Use socket ID as room, otherwise will stream data to all connections;
            // this way, each separate connection streams its browser to only that connection.
            io.to(socket.id).volatile.emit('frame', buf);
        });
    }

    return { server, io };
}

async function setupBrowserForSocket(socket: Socket, onBrowserFrame: Function) {
    const sb = socket.data.streamedBrowser = new StreamedBrowser(onBrowserFrame);
    socket.on('click', async eventData => {
        await sb.click(eventData);
    });
    socket.on('dispatchTouchEvent', async eventData => {
        await sb.dispatchTouchEvent(eventData);
    });
    socket.on('streamed-browser-forward', async () => {
        await sb.pageForward();
    });
    socket.on('streamed-browser-back', async () => {
        await sb.pageBack();
    });

    await sb.streamUrl(socket.handshake.query);
}