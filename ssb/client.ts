import {io} from "socket.io-client";

document.addEventListener('DOMContentLoaded', () => {
    const targetUrl = 'https://testpages.eviltester.com/pages/forms/special-formats/';
    const device = 'Pixel 5';
    
    const socket = io("https://143.117.93.180:3000", { query: `targetUrl=${targetUrl}&device=${device}` });
    const canvas = <HTMLCanvasElement> document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.addEventListener('click', (event) => {
        socket.emit('click', { x: canvas.offsetLeft + event.x, 
                                    y: canvas.offsetTop + event.y,});
    });

    socket.on('frame', (data) => {
        const blob = new Blob([data], { type: 'image/jpeg' });
        createImageBitmap(blob).then((bitmap) => {
            ctx.drawImage(bitmap, 0, 0);
        });
    });
});
