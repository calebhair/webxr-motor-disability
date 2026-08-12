import {io, type Socket} from 'socket.io-client';

export function setupSocket(params, canvas: HTMLCanvasElement) {
    const browserParams = {
        targetUrl: params.targetUrl,
        width: params.canvasResolution.width,
        height: params.canvasResolution.height,
        isMobile: params.isMobile,
        browserScale: 1 / params.canvasScale,
    };
    const socket = io(params.streamedBrowserServerUrl, { query: new URLSearchParams(browserParams).toString() });

    const ctx = canvas.getContext('2d');

    canvas.addEventListener('click', (event) => {
        socket.emit('click', { x: canvas.offsetLeft + event.x,
            y: canvas.offsetTop + event.y});
    });

    setupTouchHandlers(socket, canvas, browserParams.browserScale);

    // Draw frames from simulated browser
    socket.on('frame', (data) => {
        const blob = new Blob([data], { type: 'image/jpeg' });
        createImageBitmap(blob).then((bitmap) => {
            ctx.drawImage(bitmap, 0, 0);
        });
    });

    return { socket, canvas };
}

function setupTouchHandlers(socket: Socket, canvas : HTMLCanvasElement, scale: number) {
    const ctx = canvas.getContext('2d');
    const screenElement = document.querySelector('#screen');
    
    function handleTouchEvent(event) {
        const { x, y } = event.detail.texturePos;
        const canvasX = x * canvas.width * scale;
        const canvasY = y * canvas.height * scale;
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
