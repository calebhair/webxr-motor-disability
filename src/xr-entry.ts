function enterVR () {
    // TODO use different event; can enter via address button too
    document.dispatchEvent(new CustomEvent('enterVR'));
    
    const scene = document.querySelector('a-scene');
    if (scene) {
        if (scene.hasLoaded) {
            scene.enterVR();
        } else {
            scene.addEventListener('loaded', scene.enterVR);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#enter-vr-btn')
        .addEventListener('click', enterVR);
});
