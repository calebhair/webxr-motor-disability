import {Fingers} from "./hand-helpers.ts";

const THREE = AFRAME.THREE;

const PALM_GRAB_START_DISTANCE = 0.10;
const PALM_GRAB_END_DISTANCE = 0.12;

AFRAME.registerComponent('palm-grab', {
    init: function () {
        this.handTrackingControls = this.el.components['hand-tracking-controls'];
        this.jointPoses = this.handTrackingControls.jointPoses;
        this.grabControls = this.el.components['hand-tracking-grab-controls'];

        this.onPalmGrabStarted = this.onPalmGrabStarted.bind(this);
        this.el.addEventListener('palmgrabstarted', this.onPalmGrabStarted);
        this.onPalmGrabEnded = this.onPalmGrabEnded.bind(this);
        this.el.addEventListener('palmgrabended', this.onPalmGrabEnded);
    },
    after: ['hand-tracking-grab-controls'],

    tick: function () {
        this.detectPalmGrab();
    },

    detectPalmGrab : function () {
        if (!this.handTrackingControls.hasPoses) return;

        const fingertips = [Fingers.INDEX, Fingers.MIDDLE, Fingers.RING];
        let sum = 0
        for (const fingertip of fingertips) {
            sum += this._getTipDistanceFromMetacarpal(fingertip);
        }
        const averageDistanceOfMiddleFingers = sum / fingertips.length;

        if (averageDistanceOfMiddleFingers < PALM_GRAB_START_DISTANCE && !this.isPalmGrabbed) {
            this.isPalmGrabbed = true;
            this.el.emit('palmgrabstarted');
        }

        if (averageDistanceOfMiddleFingers > PALM_GRAB_END_DISTANCE && this.isPalmGrabbed) {
            this.isPalmGrabbed = false;
            this.el.emit('palmgrabended');
        }
    },

    _getTipDistanceFromMetacarpal : function (finger: Fingers) {
        // todo cache instances
        const jointPose = new THREE.Matrix4();
        const fingertipPosition = new THREE.Vector3();
        const metacarpalPosition = new THREE.Vector3();

        fingertipPosition.setFromMatrixPosition(jointPose.fromArray(this.jointPoses, finger.at(-1) * 16));
        metacarpalPosition.setFromMatrixPosition(jointPose.fromArray(this.jointPoses, finger.at(0) * 16));

        return fingertipPosition.distanceTo(metacarpalPosition);
    },

    onPalmGrabStarted : function () {
        AFRAME.log('palmgrabstarted')
        const { grabControls } = this;
        if (!grabControls.collidedEl) { return; }
        grabControls.grabbedEl = grabControls.collidedEl;
        grabControls.transferEntityOwnership();
        grabControls.grab();
    },

    onPalmGrabEnded : function () {
        AFRAME.log(`palmgrabended`)
        this.grabControls.releaseGrabbedEntity();
    },

});
