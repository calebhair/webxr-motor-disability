import AFRAME from 'aframe';
import {setupSocket} from '../../sbs/client.ts';
import {ELEMENT_IDS, SBS_HOST} from '../../constants.ts';
import * as devices from '../../sbs/playwright-devices.json';

const THREE = AFRAME.THREE;

const mm = (millimetres: number) => millimetres / 1000;

AFRAME.registerComponent('screen', {
    schema: {
        targetUrl: {type: 'string'},
        deviceName: {type: 'string'},
        streamedBrowserServerUrl: {type: 'string', default: SBS_HOST},
        
        physicalWidth: {type: 'number', default: mm(77.6)},
        physicalHeight: {type: 'number', default: mm(160.7)},
        physicalDepth: {type: 'number', default: mm(10)},
    },
    
    init() {
        console.log('Creating screen');
        const { data } = this;
        
        const canvas = this.canvas = document.createElement('canvas');
        canvas.id = ELEMENT_IDS.STREAMED_BROWSER_CANVAS;
        document.body.appendChild(canvas);

        // Configure canvas
        const device = devices.default[data.deviceName];
        if (!device) throw new Error(`Unknown device: ${data.deviceName}`);

        canvas.width = parseInt(device.viewport.width);
        canvas.height = parseInt(device.viewport.height);
        const ctx = canvas.getContext('2d');
        ctx.scale(data.canvasScale, data.canvasScale);

        const browserParams = {
            targetUrl: data.targetUrl,
            deviceName: data.deviceName,
        };
        setupSocket(data.streamedBrowserServerUrl, browserParams, canvas);

        // Configure geometry
        this.geometry = new THREE.PlaneGeometry(data.physicalWidth, data.physicalHeight);
        this.texture = new THREE.CanvasTexture(canvas);
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.material = new THREE.MeshBasicMaterial({ map: this.texture });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.el.setObject3D('mesh', this.mesh);
        this.el.object3D.position.set(0, 0, data.physicalDepth/2 + 0.001); // Slight offset for z-fighting

        // Configure touchable area
        this.el.setAttribute('touchable-plane', { width: data.physicalWidth, height: data.physicalHeight });

        // Configure parent geometry TODO move responsibility
        this.parentGeometry = new THREE.BoxGeometry(data.physicalWidth, data.physicalHeight, data.physicalDepth);
        this.parentMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        this.parentMesh = new THREE.Mesh(this.parentGeometry, this.parentMaterial);
        document.getElementById(ELEMENT_IDS.BROWSER_DEVICE).setObject3D('mesh', this.parentMesh);
    },

    tick() {
        this.texture.needsUpdate = true;
    },

    remove() {
        this.el.removeObject3D('mesh');
        document.removeChild(this.canvas);
    },
});
