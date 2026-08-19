import { createServer } from 'node:https';
import * as fs from 'node:fs';
import { Server, Socket } from 'socket.io';

import StreamedBrowser from './streamed-browser.ts';
import {CERT_PATH, CLIENT_HOST, CUSTOM_EVENTS, KEY_PATH} from '../../constants.ts';

export function setupSocketStreamedBrowser() {
    // Create HTTPS server to allow immersive VR/AR
    const server = createServer({
        cert: fs.readFileSync(CERT_PATH),
        key: fs.readFileSync(KEY_PATH),
    });

    // Restrict CORS to client host, otherwise any website loaded can control browsers
    const io = new Server(server, {
        cors: { origin: CLIENT_HOST },
    });

    io.on('connection', async (socket: Socket) => {
        console.log('Connected', socket.id);

        // Use socket ID as room, otherwise will stream data to all connections;
        // this way, each separate connection streams its browser to only that connection.
        socket.join(socket.id);

        socket.on('disconnect', async () => {
            console.log(`Disconnected ${socket.id}`);
            await socket.data.streamedBrowser?.stopStream();
        });
        
        await setupBrowserForSocket(socket, (data) => {
            const buf = Buffer.from(data, 'base64');
            io.to(socket.id).volatile.emit('frame', buf);
        });
    });

    return { server, io };
}

async function setupBrowserForSocket(socket: Socket, onBrowserFrame: Function) {
    const sb = socket.data.streamedBrowser = new StreamedBrowser(onBrowserFrame);
    socket.on(CUSTOM_EVENTS.BROWSER_CLICK, async eventData => {
        await sb.click(eventData);
    });
    socket.on(CUSTOM_EVENTS.BROWSER_DISPATCH_TOUCH_EVENT, async eventData => {
        await sb.dispatchTouchEvent(eventData);
    });
    socket.on(CUSTOM_EVENTS.BROWSER_FORWARD, async () => {
        await sb.pageForward();
    });
    socket.on(CUSTOM_EVENTS.BROWSER_BACK, async () => {
        await sb.pageBack();
    });

    console.log(socket.handshake.query)
    await sb.streamUrl(socket.handshake.query);
}