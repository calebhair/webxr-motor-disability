import {getChildrenIDsRecursively, HandJointIDs} from "./hand-helpers.ts";

const THREE = AFRAME.THREE;
const { MathUtils } = THREE;
const handControlsPrototype = AFRAME.components['hand-tracking-controls'].Component.prototype;
const degreeInRad = Math.PI / 180;

const amplitudeDegrees = 1;
const tremorHz = 10

const superInit = handControlsPrototype.init
handControlsPrototype.init = function(){
    superInit.call(this);
    
    // Cache matrices to avoid reallocating each frame
    this._jointPose = new THREE.Matrix4();
    this._changeMatrix = new THREE.Matrix4();
    
    // For rotation
    this._pivotMatrix = new THREE.Matrix4();
    this._pivotPos = new THREE.Vector3();
    this._relativePosition = new THREE.Vector3();

    // For converting local-space rotation into world-space
    this._pivotQuat = new THREE.Quaternion();
    this._localQuat = new THREE.Quaternion();
    this._worldQuat = new THREE.Quaternion();
}

// Duplicate of original implementation, with applyTremor inserted (yikes) TODO improve
handControlsPrototype.tick = function(time, timeDelta) {
    var sceneEl = this.el.sceneEl;
    var controller = this.el.components['tracked-controls'] && this.el.components['tracked-controls'].controller;
    var frame = sceneEl.frame;
    var trackedControlsWebXR = this.el.components['tracked-controls'];
    var referenceSpace = this.referenceSpace;
    if (!controller || !frame || !referenceSpace || !trackedControlsWebXR) { return; }
    this.hasPoses = false;
    if (controller.hand) {
        this.el.object3D.position.set(0, 0, 0);
        this.el.object3D.rotation.set(0, 0, 0);

        this.hasPoses = frame.fillPoses(controller.hand.values(), referenceSpace, this.jointPoses) &&
            frame.fillJointRadii(controller.hand.values(), this.jointRadii);
        this.applyTremor(time);

        this.updateHandModel();
        this.detectGesture();
        this.updateWristObject();
    }
};

handControlsPrototype.applyTremor = function(time) {
    const changeVec = Array.from({ length: 3 }, () => {
        // time is in ms, divide by 1000 to get seconds, multiply by 2PI to get a full cycle per second.
        const rhythm = Math.sin(time / 500 * Math.PI * tremorHz);
        return rhythm * amplitudeDegrees * degreeInRad * MathUtils.randFloat(0.8, 1.1);
    })
    this.rotateJoint(HandJointIDs.WRIST, ...changeVec);
};

handControlsPrototype.translateHand = function(x, y, z){
    this._changeMatrix.makeTranslation(x, y, z);
    for (let jointIndex = 0; jointIndex < 25; jointIndex++) {
        this._loadJointMatrix(jointIndex)
        this._jointPose.premultiply(this._changeMatrix);
        this._setJointMatrix(jointIndex)
    }
}

handControlsPrototype.rotateJoint = function (targetJointID: HandJointIDs, x, y, z) {
    const pivotMatrix = this._pivotMatrix.fromArray(this.jointPoses, targetJointID * 16);
    const pivotPos = this._pivotPos.setFromMatrixPosition(pivotMatrix);

    // Rotation expressed in the pivot's own local frame
    this._pivotQuat.setFromRotationMatrix(pivotMatrix);
    this._localQuat.setFromEuler(new THREE.Euler(x, y, z));

    // Convert to world-space rotation: rotate into pivot space, apply the local rotation, rotate back out
    this._worldQuat.copy(this._pivotQuat)
        .multiply(this._localQuat)
        .multiply(this._pivotQuat.clone().invert());
    const rotation = this._changeMatrix.makeRotationFromQuaternion(this._worldQuat);

    const children = getChildrenIDsRecursively(targetJointID);
    for (const jointID of children.concat(targetJointID)) {
        this._loadJointMatrix(jointID)

        // Find this joint's position relative to the pivot
        this._relativePosition.setFromMatrixPosition(this._jointPose).sub(pivotPos);
        // Rotate relative position around the pivot
        this._relativePosition.applyMatrix4(rotation);
        // Rotate joint's orientation - this is different from the previous line, which was rotating the joint's POSITION
        this._jointPose.premultiply(rotation);
        // Move the relative position back to world position
        this._jointPose.setPosition(pivotPos.x + this._relativePosition.x, pivotPos.y + this._relativePosition.y, pivotPos.z + this._relativePosition.z);
        
        this._setJointMatrix(jointID)
    }
};

// Reads the pose of the joint at the given index to the matrix _jointPose
handControlsPrototype._loadJointMatrix = function (jointIndex) {
    this._jointPose.fromArray(this.jointPoses, jointIndex * 16);
}

// Writes the pose of the matrix _jointPose to the joint at the given index
handControlsPrototype._setJointMatrix = function (jointIndex) {
    this._jointPose.toArray(this.jointPoses, jointIndex * 16);
}
