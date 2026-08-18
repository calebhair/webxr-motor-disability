import AFRAME from 'aframe';
import {CUSTOM_EVENTS} from '../constants.ts';

AFRAME.registerSystem('xr-entry', {
    init() {
        const { sceneEl } = this.el;

        sceneEl.addEventListener('enter-vr', () => {
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.XR_ENTERED));
        });
    },
});

async function enterXR(mode: 'ar' | 'vr') {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    const xrFunction = `enter${mode.toUpperCase()}`;

    if (scene.hasLoaded) scene[xrFunction]();
    else scene.addEventListener('loaded', scene[xrFunction]);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#enter-vr-btn')
        .addEventListener('click', () => enterXR('vr'));
});
