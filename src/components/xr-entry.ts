import AFRAME from 'aframe';
import {CUSTOM_EVENTS} from '../constants.ts';

AFRAME.registerSystem('xr-entry', {
    init() {
        const { sceneEl } = this.el;
        sceneEl.addEventListener('enter-vr', () => {
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.VR_ENTERED));
        }, { once: true });
    },
});

function enterVR () {
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    if (scene.hasLoaded) scene.enterVR();
    else scene.addEventListener('loaded', scene.enterVR);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#enter-vr-btn')
        .addEventListener('click', enterVR);
});
