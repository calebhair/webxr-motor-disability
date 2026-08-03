import {io} from "socket.io-client";

document.addEventListener('DOMContentLoaded', () => {
    const browserParams = {
        targetUrl: 'https://testpages.eviltester.com/pages/forms/special-formats/',
        width: "500",
        height: "500",
        isMobile: "true",
    };
    
    const socket = io("https://143.117.93.180:3000", { query: new URLSearchParams(browserParams).toString() });
    const canvas = <HTMLCanvasElement> document.getElementById('canvas');
    canvas.width = parseInt(browserParams.width);
    canvas.height = parseInt(browserParams.height);
    const ctx = canvas.getContext('2d');
    
    canvas.addEventListener('click', (event) => {
        socket.emit('click', { x: canvas.offsetLeft + event.x, 
                                    y: canvas.offsetTop + event.y,});
    });

    document.querySelector('#phone').addEventListener('touchstart', (event) => {
        const { x, y } = event.detail.texturePos;
        socket.emit('click', { x: x * canvas.width, y: y * canvas.height });
    });

    socket.on('frame', (data) => {
        const blob = new Blob([data], { type: 'image/jpeg' });
        createImageBitmap(blob).then((bitmap) => {
            ctx.drawImage(bitmap, 0, 0);
        });
    });
});
