document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket('wss://143.117.93.180:8080');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    ws.onmessage = (event) => {
        const blob = new Blob([event.data], { type: 'image/jpeg' });
        createImageBitmap(blob).then((bitmap) => {
            // draw bitmap onto a canvas, then mark your THREE.CanvasTexture.needsUpdate = true
            ctx.drawImage(bitmap, 0, 0);
        });
    };
})
