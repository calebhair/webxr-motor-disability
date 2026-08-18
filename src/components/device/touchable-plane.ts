import AFRAME from 'aframe';
const THREE = AFRAME.THREE;

AFRAME.registerComponent('touchable-plane', {
    schema: {
        width: { type: 'number' },
        height: { type: 'number' },
        threshold: { type: 'number', default: 0.005 }, // how close counts as "touching" (meters)
    },

    init: function () {
        this.isTouching = false;
        this.fingerWorldPos = new THREE.Vector3();
        this.localPos = new THREE.Vector3();
        this.planeMatrixInverse = new THREE.Matrix4();

        this.hands = Array.from(document.querySelectorAll('[hand-tracking-controls]'));
        this.handTrackingComponents = [];
        for (const hand of this.hands) {
            this.handTrackingComponents.push({
                hand,
                handTrackingControls: hand.components['hand-tracking-controls'],
                grabControls: hand.components['hand-tracking-grab-controls'],
            });
        }
    },

    tick: function () {
        this.handleTouch();
    },

    handleTouch: function () {
        const { width, height, threshold } = this.data;
        if (!width || !height) return;
        let touchedThisFrame = false;
        let touchData = null;

        for (const { hand, handTrackingControls, grabControls } of this.handTrackingComponents) {
            if (!handTrackingControls || !handTrackingControls.bones || grabControls.grabbedEl) continue;

            // Get index fingertip bone (varies slightly by A-Frame version)
            const tipBone = handTrackingControls.indexTipBone || hand.object3D.getObjectByName('index-finger-tip');
            if (!tipBone) continue;

            tipBone.getWorldPosition(this.fingerWorldPos);
            this.planeMatrixInverse.copy(this.el.object3D.matrixWorld).invert();
            this.localPos.copy(this.fingerWorldPos).applyMatrix4(this.planeMatrixInverse);

            const withinX = Math.abs(this.localPos.x) <= width / 2;
            const withinY = Math.abs(this.localPos.y) <= height / 2;
            const withinZ = Math.abs(this.localPos.z) <= threshold;

            if (withinX && withinY && withinZ) {
                touchedThisFrame = true;
                touchData = {
                    point: this.localPos.clone(),
                    texturePos: {
                        // Normalise to be from top left
                        x: (this.localPos.x + width / 2) / width,
                        y: 1 - (this.localPos.y + height / 2) / height,
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
    },
});
