import AFRAME from 'aframe';
import {getChildrenIDsRecursively, HandJointIDs} from './hand-helpers.ts';

const THREE = AFRAME.THREE;
const { MathUtils } = THREE;

/**
 * Encapsulates behavior and state necessary to modify the hand tracking position.
 * Main function is applyTremor.
 */
export class Tremor {
    private _tremorAmplitudeDegrees: number = 0;
    private _tremorFrequency: number = 0;
    
    // Cache matrices to avoid reallocating each frame
    private _jointPose = new THREE.Matrix4();
    private _changeMatrix = new THREE.Matrix4();
    // For rotation
    private _pivotMatrix = new THREE.Matrix4();
    private _pivotPos = new THREE.Vector3();
    private _relativePosition = new THREE.Vector3();
    // For converting local-space rotation into world-space
    private _pivotQuat = new THREE.Quaternion();
    private _localQuat = new THREE.Quaternion();
    private _worldQuat = new THREE.Quaternion();
    private jointPoses: Float32Array;

    /**
     * @param jointPoses the jointPoses attribute from the hand tracking component that it will override
     */
    constructor(jointPoses: Float32Array) {
        this.jointPoses = jointPoses;
    }
    
    get tremorFrequency() {
        return this._tremorFrequency;
    }
    
    set tremorFrequency(value: number) {
        this._tremorFrequency = value;
    }
    
    get tremorAmplitudeDegrees() {
        return this._tremorAmplitudeDegrees;
    }
    
    set tremorAmplitudeDegrees(value: number) {
        this._tremorAmplitudeDegrees = value;
    }

    /**
     * Applies the tremor to the tracked hand.
     * @param time global uptime of the scene in milliseconds
     */
    applyTremor(time: number) {
        // time is in ms, divide by 1000 to get seconds, multiply by 2PI to get a full cycle per second.
        const rhythm = Math.sin(time / 500 * Math.PI * this._tremorFrequency);
        const baseRotation = MathUtils.degToRad(rhythm * this._tremorAmplitudeDegrees);
        const randJitter = () => baseRotation * MathUtils.randFloat(0.8, 1.1);

        // Apply base rotation to all axis, randomized
        this.rotateJoint(HandJointIDs.WRIST, randJitter(), randJitter(), randJitter());
    }

    /**
     * Rotates a specific joint, including its children
     * TODO use getBone instead of manipulating matrices directly
     */
    rotateJoint(targetJointID: HandJointIDs, x: number, y: number, z: number) {
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
            this._loadJointMatrix(jointID);

            // Find this joint's position relative to the pivot
            this._relativePosition.setFromMatrixPosition(this._jointPose).sub(pivotPos);
            // Rotate relative position around the pivot
            this._relativePosition.applyMatrix4(rotation);
            // Rotate joint's orientation - this is different from the previous line, which was rotating the joint's POSITION
            this._jointPose.premultiply(rotation);
            // Move the relative position back to world position
            this._jointPose.setPosition(pivotPos.x + this._relativePosition.x, pivotPos.y + this._relativePosition.y, pivotPos.z + this._relativePosition.z);

            this._setJointMatrix(jointID);
        }
    }

    // Reads the pose of the joint at the given index to the matrix _jointPose
    _loadJointMatrix(jointIndex: number) {
        this._jointPose.fromArray(this.jointPoses, jointIndex * 16);
    }

    // Writes the pose of the matrix _jointPose to the joint at the given index
    _setJointMatrix(jointIndex: number) {
        this._jointPose.toArray(this.jointPoses, jointIndex * 16);
    }

}

