import {io, type Socket} from 'socket.io-client';
import {CUSTOM_EVENTS} from '../constants.ts';

export function setupSocket(url: string, browserParams, canvas: HTMLCanvasElement): Socket {
    const socket = io(url, { query: browserParams });

    const ctx = canvas.getContext('2d');

    canvas.addEventListener('click', (event) => {
        socket.emit(CUSTOM_EVENTS.BROWSER_CLICK, { x: canvas.offsetLeft + event.x,
            y: canvas.offsetTop + event.y});
    });

    setupTouchHandlers(socket, canvas, browserParams.browserScale);
    setupBrowserControls(socket);

    // Draw frames from simulated browser
    socket.on('frame', (data) => {
        const blob = new Blob([data], { type: 'image/jpeg' });
        createImageBitmap(blob).then((bitmap) => {
            ctx.drawImage(bitmap, 0, 0);
        });
    });

    return socket;
}

function setupTouchHandlers(socket: Socket, canvas : HTMLCanvasElement, scale: number) {
    const ctx = canvas.getContext('2d');
    const screenElement = document.querySelector('#screen');
    
    function handleTouchEvent(event) {
        const { x, y } = event.detail.texturePos;
        const canvasX = x * canvas.width * scale;
        const canvasY = y * canvas.height * scale;
        const touchPoints = [{ x: canvasX, y: canvasY, id: 0 }];
        socket.emit(CUSTOM_EVENTS.BROWSER_DISPATCH_TOUCH_EVENT, { eventType: event.type, touchPoints });
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
        socket.emit(CUSTOM_EVENTS.BROWSER_DISPATCH_TOUCH_EVENT, { eventType: event.type, touchPoints: [] });
    });
}

function setupBrowserControls(socket: Socket) {
    document.addEventListener(CUSTOM_EVENTS.BROWSER_FORWARD, () => {
        socket.emit(CUSTOM_EVENTS.BROWSER_FORWARD);
    });
    document.addEventListener(CUSTOM_EVENTS.BROWSER_BACK, () => {
        socket.emit(CUSTOM_EVENTS.BROWSER_BACK);
    });
}

// For visualizing touches
function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, fillStyle) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = fillStyle;
    ctx.fill();
}
