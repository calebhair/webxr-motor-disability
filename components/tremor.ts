const THREE = AFRAME.THREE;

const handControlsPrototype = AFRAME.components['hand-tracking-controls'].Component.prototype;

const superInit = handControlsPrototype.init
handControlsPrototype.init = function(){
    superInit.call(this);
    this._jointPose = new THREE.Matrix4();
    this._changeMatrix = new THREE.Matrix4();
}

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
    this.translateHand(0.1, 0, 0);
};

handControlsPrototype.applyMatrix = function(boneIndex) {
    this._jointPose.fromArray(this.jointPoses, boneIndex * 16);
    this._jointPose.multiply(this._changeMatrix);
    this._jointPose.toArray(this.jointPoses, boneIndex * 16);
};

handControlsPrototype.translateHand = function(x, y, z){
    this._changeMatrix.identity().makeTranslation(x, y, z);
    for (let boneIndex = 0; boneIndex < 25; boneIndex++) {
        this.applyMatrix(boneIndex);
    }
}