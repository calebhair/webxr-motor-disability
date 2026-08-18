import AFRAME from 'aframe';
import {setupSocket} from '../../sbs/client.ts';
import {ELEMENT_IDS, SBS_HOST} from '../../constants.ts';

const THREE = AFRAME.THREE;

const mm = (millimetres: number) => millimetres / 1000;

AFRAME.registerComponent('screen', {
    schema: {
        streamedBrowserServerUrl: {type: 'string', default: SBS_HOST},
        targetUrl: {type: 'string', default: 'https://testpages.eviltester.com/pages/forms/text-inputs/'},

        canvasResolutionX: {type: 'number', default: 430},
        canvasResolutionY: {type: 'number', default: 932},

        canvasWidth: {type: 'string', default: '100vmax'},
        canvasHeight: {type: 'string', default: '100vmax'},

        physicalWidth: {type: 'number', default: mm(77.6)},
        physicalHeight: {type: 'number', default: mm(160.7)},
        physicalDepth: {type: 'number', default: mm(10)},

        canvasScale: {type: 'number', default: 1}, // Inversely proportional to the resolution at the same scale, e.g., making this 2 will reduce the pixels but retain the same size.
        isMobile: {type: 'boolean', default: true},
    },
    
    init() {
        console.log('Creating screen');
        const { data } = this;
        
        const canvas = this.canvas = document.createElement('canvas');
        canvas.id = ELEMENT_IDS.STREAMED_BROWSER_CANVAS;
        document.body.appendChild(canvas);

        // Configure canvas
        canvas.style.width = data.canvasWidth;
        canvas.style.height = data.canvasHeight;
        canvas.width = parseInt(data.canvasResolutionX);
        canvas.height = parseInt(data.canvasResolutionY);
        const ctx = canvas.getContext('2d');
        ctx.scale(data.canvasScale, data.canvasScale);

        const browserParams = {
            targetUrl: data.targetUrl,
            width: data.canvasResolutionX,
            height: data.canvasResolutionY,
            isMobile: data.isMobile,
            browserScale: 1 / data.canvasScale,
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
