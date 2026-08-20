import AFRAME from 'aframe';
import {setupSocket} from '../../sbs/client.ts';
import {ELEMENT_IDS, SBS_HOST} from '../../constants.ts';
import * as devices from '../../sbs/playwright-devices.json';
import * as deviceSizes from '../../sbs/device-sizes.json';

const THREE = AFRAME.THREE;

const mm = (millimetres: number) => millimetres / 1000; // Returns metres
const inch = (inches: number) => inches / 39.37; // Return metres

AFRAME.registerComponent('screen', {
    schema: {
        targetUrl: {type: 'string'},
        deviceName: {type: 'string'},
        streamedBrowserServerUrl: {type: 'string', default: SBS_HOST},
        
        physicalWidth: {type: 'number'},
        physicalHeight: {type: 'number'},
        physicalDepth: {type: 'number', default: mm(10)},
    },
    
    init() {
        console.log('Creating screen');
        const { data } = this;
        
        const canvas = this.canvas = document.createElement('canvas');
        canvas.id = ELEMENT_IDS.STREAMED_BROWSER_CANVAS;
        document.body.appendChild(canvas);

        const device = devices.default[data.deviceName];
        if (!device) throw new Error(`Unknown device: ${data.deviceName}`);
        console.log('Found device ↓');
        console.log(device);
        const devicePPI = deviceSizes.default[data.deviceName]?.ppi;
        if (!devicePPI) throw new Error(`Undefined PPI for: ${data.deviceName}`);
        console.log(`Found device PPI: ${devicePPI}`);
        
        const { viewport, deviceScaleFactor } = device;
        data.physicalWidth = inch(viewport.width * deviceScaleFactor / devicePPI);
        data.physicalHeight = inch(viewport.height * deviceScaleFactor / devicePPI);

        canvas.width = parseInt(viewport.width);
        canvas.height = parseInt(viewport.height);

        const browserParams = {
            targetUrl: data.targetUrl,
            deviceName: data.deviceName,
        };
        this.socket = setupSocket(data.streamedBrowserServerUrl, browserParams, canvas);

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
        this.canvas?.parentNode.removeChild(this.canvas);
        this.socket?.close();
    },
});
