import {io} from "socket.io-client";

document.addEventListener('DOMContentLoaded', () => {
    const socket = io("https://143.117.93.180:3000");
    const canvas = <HTMLCanvasElement> document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    socket.on('frame', (data) => {
        const blob = new Blob([data], { type: 'image/jpeg' });
        createImageBitmap(blob).then((bitmap) => {
            ctx.drawImage(bitmap, 0, 0);
        });
    })
})
