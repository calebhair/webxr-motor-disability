const THREE = AFRAME.THREE;

AFRAME.registerComponent('screen', {
    init: function () {
        console.log('Adding screen');
        const { data, el } = this;
        
        // TODO dynamic dimensions
        const width = 0.1;
        const height = 0.1;
        const deviceDepth = 0.01;

        const canvas = document.getElementById("canvas")
        el.object3D.position.set(0, 0, deviceDepth/2 + 0.001) // For z-fighting
        this.geometry = new THREE.PlaneGeometry(width, height);
        this.texture = new THREE.CanvasTexture(canvas);
        this.material = new THREE.MeshBasicMaterial({ map: this.texture });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        el.setObject3D('mesh', this.mesh);

        const geometry = new THREE.BoxGeometry(width, height, deviceDepth);
        const material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        const deviceMesh = new THREE.Mesh(geometry, material);
        document.getElementById('browser-device').setObject3D('mesh', deviceMesh);
    },

    tick: function (time, timeDelta) {
        this.texture.needsUpdate = true;
    },

    remove: function () {
        this.el.removeObject3D('mesh');
    }
});

AFRAME.registerComponent('touchable-plane', {
    schema: {
        threshold: { type: 'number', default: 0.005 }, // how close counts as "touching" (meters)
    },

    init: function () {
        this.isTouching = false;
        this.fingerWorldPos = new THREE.Vector3();
        this.localPos = new THREE.Vector3();
        this.planeMatrixInverse = new THREE.Matrix4();

        // TODO update based on geometry
        this.width = 0.1;
        this.height = 0.1;
        this.hands = Array.from(document.querySelectorAll('[hand-tracking-controls]'));
    },

    tick: function () {
        this.handleTouch();
    },
    
    handleTouch: function () {
        let touchedThisFrame = false;
        let touchData = null;

        for (const hand of this.hands) {
            const trackedControls = hand.components['hand-tracking-controls'];
            if (!trackedControls || !trackedControls.bones) continue;

            // Get index fingertip bone (varies slightly by A-Frame version)
            const tipBone = trackedControls.indexTipBone || hand.object3D.getObjectByName('index-finger-tip');
            if (!tipBone) continue;

            tipBone.getWorldPosition(this.fingerWorldPos);
            this.planeMatrixInverse.copy(this.el.object3D.matrixWorld).invert();
            this.localPos.copy(this.fingerWorldPos).applyMatrix4(this.planeMatrixInverse);

            const withinX = Math.abs(this.localPos.x) <= this.width / 2;
            const withinY = Math.abs(this.localPos.y) <= this.height / 2;
            const withinZ = Math.abs(this.localPos.z) <= this.data.threshold;

            if (withinX && withinY && withinZ) {
                touchedThisFrame = true;
                touchData = {
                    point: this.localPos.clone(),
                    texturePos: {
                        x: (this.localPos.x + this.width / 2) / this.width,
                        y: 1 - (this.localPos.y + this.height / 2) / this.height
                    },
                    hand,
                };
                break;
            }
        }

        if (touchedThisFrame && !this.isTouching) {
            this.isTouching = true;
            this.el.emit('touchStart', touchData);
        } else if (touchedThisFrame && this.isTouching) {
            this.el.emit('touchMove', touchData);
        } else if (!touchedThisFrame && this.isTouching) {
            this.isTouching = false;
            this.el.emit('touchEnd');
        }
    }
});
