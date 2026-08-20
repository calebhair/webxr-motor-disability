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
