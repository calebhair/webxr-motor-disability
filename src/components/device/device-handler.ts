import AFRAME from 'aframe';

const THREE = AFRAME.THREE;

const DEFAULT_POSITION = new THREE.Vector3(0, 1.5, -0.5);

AFRAME.registerSystem('device-handler', {
    init() {
        document.addEventListener('enterVR', (deviceData) => {
            const { deviceParentEl } = this.createPhoneEntity(deviceData);
            this.el.sceneEl.appendChild(deviceParentEl);
        });
    },
    
    createPhoneEntity(deviceData) {
        const device = document.createElement('a-entity');
        device.id = 'browser-device';
        device.object3D.position.copy(DEFAULT_POSITION);
        
        const touchscreenEl = document.createElement('a-entity');
        touchscreenEl.id = 'screen';
        touchscreenEl.setAttribute('screen', deviceData);
        touchscreenEl.setAttribute('touchable-plane', '');
        device.appendChild(touchscreenEl);
        
        return { deviceParentEl: device };
    },
});
