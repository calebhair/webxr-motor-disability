import {Fingers, HandJointIDs} from "./hand-helpers.ts";

const THREE = AFRAME.THREE;

const PALM_GRAB_START_DISTANCE = 0.10;
const PALM_GRAB_END_DISTANCE = 0.12;

export const PalmGrabFunctions = {
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
        this._detectPalmGrab();
    },

    _detectPalmGrab : function () {
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
        if (!grabControls.collidedEl && !grabControls.grabbedEl) { return; }
        this._alignCollidedElWithHand();
        grabControls.grabbedEl = grabControls.collidedEl;
        grabControls.transferEntityOwnership();
        grabControls.grab();
    },

    _alignCollidedElWithHand() {
        // todo cache instances
        const jointPose = new THREE.Matrix4();
        const wristWorldPos = new THREE.Vector3();
        const wristWorldRot = new THREE.Quaternion();
        const offsetPos = new THREE.Vector3(0, 0, -0.05);
        const offsetRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 0), Math.PI/2);

        jointPose.fromArray(this.jointPoses, HandJointIDs.WRIST * 16)
        wristWorldPos.setFromMatrixPosition(jointPose);
        wristWorldRot.setFromRotationMatrix(jointPose);
        
        const worldPos = wristWorldPos.clone().add(
            offsetPos.clone().applyQuaternion(wristWorldRot)
        );

        const worldRot = wristWorldRot.clone().multiply(offsetRot);

        const { collidedEl } = this.grabControls;
        collidedEl.setAttribute('position', {
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z
        });
        collidedEl.object3D.quaternion.copy(worldRot);
    },

    onPalmGrabEnded : function () {
        AFRAME.log(`palmgrabended`)
        this.grabControls.releaseGrabbedEntity();
    },

}
