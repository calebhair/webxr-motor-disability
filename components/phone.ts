const THREE = AFRAME.THREE;

AFRAME.registerComponent('phone', {
    init: function () {
        console.log('Adding phone');
        const { data, el } = this;

        const canvas = document.getElementById("canvas")
        console.warn(canvas)
        this.geometry = new THREE.PlaneGeometry(0.1, 0.1);
        this.texture = new THREE.CanvasTexture(canvas);
        this.material = new THREE.MeshBasicMaterial({ map: this.texture });
        // this.material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        el.setObject3D('mesh', this.mesh);
    },

    tick: function (time, timeDelta) {
        this.texture.needsUpdate = true;
        
    },

    remove: function () {
        this.el.removeObject3D('mesh');
    }
});
