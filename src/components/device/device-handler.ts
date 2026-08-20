import AFRAME from 'aframe';
import {ELEMENT_IDS} from '../../constants.ts';

const THREE = AFRAME.THREE;

const DEFAULT_POSITION = new THREE.Vector3(0, 1.5, -0.5);

AFRAME.registerSystem('device-handler', {
    init() {
        const { sceneEl } = this.el;

        let deviceParentEl;
        sceneEl.addEventListener('enter-vr', () => {
            const formObject = this.getConfigFormContents();

            deviceParentEl = this.createPhoneEntity(formObject);
            this.el.sceneEl.appendChild(deviceParentEl);
        });

        sceneEl.addEventListener('exit-vr', () => {
            this.deletePhoneEntity(deviceParentEl);
        });
    },

    /**
     * Retrieves the contents of the config form as an object.
     */
    getConfigFormContents() {
        const form: HTMLFormElement = document.querySelector('#config-form');
        const formData = new FormData(form);
        const formObject = {};
        formData.forEach((value, key) => formObject[key] = value);

        // Post process
        if (formObject.useSearch) {
            formObject.targetUrl = `https://www.google.com/search?q=${formObject.targetUrl}`;
        }

        return formObject;
    },
    
    createPhoneEntity(deviceData) {
        const deviceParentEl = document.createElement('a-entity');
        deviceParentEl.id = ELEMENT_IDS.BROWSER_DEVICE;
        deviceParentEl.object3D.position.copy(DEFAULT_POSITION);
        deviceParentEl.setAttribute('grabbable', '');
        
        const touchscreenEl = document.createElement('a-entity');
        touchscreenEl.id = ELEMENT_IDS.SCREEN;
        touchscreenEl.setAttribute('screen', deviceData);
        touchscreenEl.setAttribute('touchable-plane', '');
        deviceParentEl.appendChild(touchscreenEl);
        
        return deviceParentEl;
    },
    
    deletePhoneEntity(parentElement: HTMLElement) {
        parentElement.parentNode.removeChild(parentElement);
    },
});
