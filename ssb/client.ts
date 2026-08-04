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

    
    // Touch handling
    function handleTouchEvent(event) {
        const { x, y } = event.detail.texturePos;
        const canvasX = x * canvas.width;
        const canvasY = y * canvas.height;
        const touchPoints = [{ x: canvasX, y: canvasY, id: 0 }];
        socket.emit('dispatchTouchEvent', { eventType: event.type, touchPoints });
        return touchPoints;
    }
    
    document.querySelector('#phone').addEventListener('touchStart', (event) => {
        const touchPoints = handleTouchEvent(event);
        for (const touchPoint of touchPoints) {
            drawCircle(ctx, touchPoint.x, touchPoint.y, 'red');
        }
    });
    document.querySelector('#phone').addEventListener('touchMove', (event) => {
        const touchPoints = handleTouchEvent(event);
        for (const touchPoint of touchPoints) {
            drawCircle(ctx, touchPoint.x, touchPoint.y, 'yellow');
        }
    });
    document.querySelector('#phone').addEventListener('touchEnd', (event) => {
        socket.emit('dispatchTouchEvent', { eventType: event.type, touchPoints: [] });

    });

    socket.on('frame', (data) => {
        const blob = new Blob([data], { type: 'image/jpeg' });
        createImageBitmap(blob).then((bitmap) => {
            ctx.drawImage(bitmap, 0, 0);
        });
    });
});

// For visualising touches
function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, fillStyle) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = fillStyle;
    ctx.fill();
}
