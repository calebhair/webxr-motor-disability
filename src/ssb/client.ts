import {io, type Socket} from "socket.io-client";

export function setupSocket(params) {
    const browserParams = {
        targetUrl: params.targetUrl,
        width: params.canvasResolution.width,
        height: params.canvasResolution.height,
        isMobile: params.isMobile
    }
    const socket = io(params.streamedBrowserServerUrl, { query: new URLSearchParams(browserParams).toString() });

    const canvas = <HTMLCanvasElement> document.getElementById('streamed-browser-canvas');
    canvas.style.width = params.canvasSize.width;
    canvas.style.height = params.canvasSize.height;
    canvas.width = parseInt(params.canvasResolution.width);
    canvas.height = parseInt(params.canvasResolution.height);
    const ctx = canvas.getContext('2d');
    ctx.scale(params.canvasScale, params.canvasScale);

    canvas.addEventListener('click', (event) => {
        socket.emit('click', { x: canvas.offsetLeft + event.x,
            y: canvas.offsetTop + event.y,});
    });

    setupTouchHandlers(socket, canvas);

    // Draw frames from simulated browser
    socket.on('frame', (data) => {
        const blob = new Blob([data], { type: 'image/jpeg' });
        createImageBitmap(blob).then((bitmap) => {
            ctx.drawImage(bitmap, 0, 0);
        });
    });

    return { socket, canvas };
}

function setupTouchHandlers(socket: Socket, canvas : HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    const screenElement = document.querySelector('#screen');
    
    function handleTouchEvent(event) {
        const { x, y } = event.detail.texturePos;
        const canvasX = x * canvas.width;
        const canvasY = y * canvas.height;
        const touchPoints = [{ x: canvasX, y: canvasY, id: 0 }];
        socket.emit('dispatchTouchEvent', { eventType: event.type, touchPoints });
        return touchPoints;
    }

    screenElement.addEventListener('touchStart', (event) => {
        const touchPoints = handleTouchEvent(event);
        for (const touchPoint of touchPoints) {
            drawCircle(ctx, touchPoint.x, touchPoint.y, 'red');
        }
    });
    screenElement.addEventListener('touchMove', (event) => {
        const touchPoints = handleTouchEvent(event);
        for (const touchPoint of touchPoints) {
            drawCircle(ctx, touchPoint.x, touchPoint.y, 'yellow');
        }
    });
    screenElement.addEventListener('touchEnd', (event) => {
        socket.emit('dispatchTouchEvent', { eventType: event.type, touchPoints: [] });
    });
}

// For visualising touches
function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, fillStyle) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = fillStyle;
    ctx.fill();
}
