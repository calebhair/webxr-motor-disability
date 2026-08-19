import AFRAME from 'aframe';
import {CUSTOM_EVENTS} from '../constants.ts';

async function enterXR(mode: 'ar' | 'vr') {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    const xrFunction = `enter${mode.toUpperCase()}`;

    if (scene.hasLoaded) scene[xrFunction]();
    else scene.addEventListener('loaded', scene[xrFunction]);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#enter-vr-btn').addEventListener('click', () => enterXR('vr'));
});

AFRAME.registerSystem('xr-entry', {
    init() {
        const { sceneEl } = this.el;

        sceneEl.addEventListener('enter-vr', () => {
            const formObject = this.getConfigFormContents();
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.XR_ENTERED, { detail: formObject}));
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

        return formObject;
    },
});
