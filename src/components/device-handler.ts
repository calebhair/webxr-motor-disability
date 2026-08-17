import AFRAME from 'aframe';

const THREE = AFRAME.THREE;

const DEFAULT_POSITION = new THREE.Vector3(0, 1.5, -0.5);

AFRAME.registerSystem('device-handler', {
    init() {
        document.addEventListener('enterVR', (deviceData) => {
            const entity = this.createEntity();
            this.el.sceneEl.appendChild(entity);
        });
    },
    
    createEntity() {
        const device = document.createElement('a-entity');
        device.id = 'browser-device';
        device.object3D.position.copy(DEFAULT_POSITION);
        
        const touchscreen = document.createElement('a-entity');
        touchscreen.id = 'screen';
        touchscreen.setAttribute('screen', '');
        touchscreen.setAttribute('touchable-plane', '');
        device.appendChild(touchscreen);
        
        return device;
    },

    remove() {
        
    },
});
