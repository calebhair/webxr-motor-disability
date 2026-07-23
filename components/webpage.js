// import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';


AFRAME.registerComponent('webpage', {
    schema: {
        url: {type: 'string'},
        position: {type: 'string'},
    },

    init: function () {
        console.log('Adding webpage');
        const { data } = this;
        const { element } = data;

        // this.cssRenderer = new CSS3DRenderer()

    }
});
