import AFRAME from 'aframe';
import {CUSTOM_EVENTS, ELEMENT_IDS} from '../../constants.ts';

const THREE = AFRAME.THREE;

const DEFAULT_POSITION = new THREE.Vector3(0, 1.5, -0.5);

AFRAME.registerSystem('device-handler', {
    init() {
        document.addEventListener(CUSTOM_EVENTS.XR_ENTERED, (deviceData) => {
            const { deviceParentEl } = this.createPhoneEntity(deviceData);
            this.el.sceneEl.appendChild(deviceParentEl);
        });
    },
    
    createPhoneEntity(deviceData) {
        const device = document.createElement('a-entity');
        device.id = ELEMENT_IDS.BROWSER_DEVICE;
        device.object3D.position.copy(DEFAULT_POSITION);
        
        const touchscreenEl = document.createElement('a-entity');
        touchscreenEl.id = ELEMENT_IDS.SCREEN;
        touchscreenEl.setAttribute('screen', deviceData);
        touchscreenEl.setAttribute('touchable-plane', '');
        device.appendChild(touchscreenEl);
        
        return { deviceParentEl: device };
    },
});
