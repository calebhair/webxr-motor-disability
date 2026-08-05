const THREE = AFRAME.THREE;

const handControlsPrototype = AFRAME.components['hand-tracking-controls'].Component.prototype;

const superInit = handControlsPrototype.init
handControlsPrototype.init = function(){
    superInit.call(this);
    
    // Cache matrices to avoid reallocating each frame
    this._jointPose = new THREE.Matrix4();
    this._changeMatrix = new THREE.Matrix4();
    
    // For rotation
    this._wristMatrix = new THREE.Matrix4();
    this._wristPos = new THREE.Vector3();
    this._relative = new THREE.Vector3();
}

// Duplicate of original implementation, with applyTremor inserted (yikes)
handControlsPrototype.tick = function() {
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
        this.applyTremor();

        this.updateHandModel();
        this.detectGesture();
        this.updateWristObject();
    }
};

const WRIST_INDEX = 0;
const degreeInRad = Math.PI / 180;
handControlsPrototype.applyTremor = function() {
    // this.translateHand(0.1, 0, 0);
    // this.rotateBone(7, 90 * degreeInRad, 0, 0)
    this.rotateHand(45 * degreeInRad, 45 * degreeInRad, 45 * degreeInRad);
};

handControlsPrototype.applyMatrix = function(boneIndex) {
    this._jointPose.fromArray(this.jointPoses, boneIndex * 16);
    this._jointPose.multiply(this._changeMatrix); // POST-multiply
    this._jointPose.toArray(this.jointPoses, boneIndex * 16);
};

handControlsPrototype.rotateBone = function(boneIndex, x, y, z) {
    this._changeMatrix.makeRotationFromEuler(new THREE.Euler(x, y, z));
    this.applyMatrix(boneIndex);
};

handControlsPrototype.translateHand = function(x, y, z){ // TODO test because removed identity
    this._changeMatrix.makeTranslation(x, y, z);
    for (let boneIndex = 0; boneIndex < 25; boneIndex++) {
        this.applyMatrix(boneIndex);
    }
}

handControlsPrototype.rotateHand = function (x, y, z) {
    // Represent rotation as matrix to be applied later
    const rotation = this._changeMatrix.makeRotationFromEuler(new THREE.Euler(x, y, z));

    // Get position of wrist, to rotate everything around it
    const wristMatrix = this._wristMatrix.fromArray(this.jointPoses, WRIST_INDEX * 16);
    const wristPos = this._wristPos.setFromMatrixPosition(wristMatrix);

    for (let jointIndex = 0; jointIndex < 25; jointIndex++) {
        this.loadJointMatrix(jointIndex)

        // Find this joint's position relative to the wrist
        this._relative.setFromMatrixPosition(this._jointPose).sub(wristPos);
        // Rotate relative position around the pivot
        this._relative.applyMatrix4(rotation);
        // Rotate joint's orientation - this is different from the previous line, which was rotating the joint's POSITION
        this._jointPose.premultiply(rotation);
        // Move the relative position back to world position
        this._jointPose.setPosition(wristPos.x + this._relative.x, wristPos.y + this._relative.y, wristPos.z + this._relative.z);

        this._jointPose.toArray(this.jointPoses, jointIndex * 16);
        this.setJointMatrix(jointIndex)
    }
};

handControlsPrototype.loadJointMatrix = function (jointIndex) {
    this._jointPose.fromArray(this.jointPoses, jointIndex * 16);
}

handControlsPrototype.setJointMatrix = function (jointIndex) {
    this._jointPose.toArray(this.jointPoses, jointIndex * 16);
}