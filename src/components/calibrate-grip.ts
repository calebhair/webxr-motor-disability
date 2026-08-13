import AFRAME from 'aframe';
import * as THREE from 'three';

// const THREE = AFRAME.THREE;
const MAX_READINGS = 20;
const READING_DELAY_MS = 80;
const MAX_ACCEPTABLE_RANGE = 0.008;
const UNSTABLE_COLOR = new THREE.Color(0xff0000);
const STABLE_COLOR = new THREE.Color(0x00ffff);
const axes = ['x', 'y', 'z'];

function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

function createMarker(position: THREE.Vector3, color: string) {
    const newMarker = document.createElement('a-icosahedron');
    newMarker.setAttribute('color', color);
    newMarker.setAttribute('radius', '0.01');
    newMarker.setAttribute('position', position);
    return newMarker;
}

class GripPoint {
    private handRelativePositions: Map<string, THREE.Vector3>;
    private visualise: boolean = true;
    private visualisationMarker: HTMLElement;
    private readonly lastAveragePoint: THREE.Vector3;
    private readonly jointWorldPosition: THREE.Vector3;
    private readonly jointWorldQuaternion: THREE.Quaternion;
    private readonly bonePositionCache: THREE.Vector3;

    constructor() {
        this.handRelativePositions = new Map();
        this.lastAveragePoint = new THREE.Vector3();
        this.bonePositionCache = new THREE.Vector3();
        this.jointWorldPosition = new THREE.Vector3();
        this.jointWorldQuaternion = new THREE.Quaternion();
    }
    
    getLastAveragePoint(): THREE.Vector3 {
        return this.lastAveragePoint;
    }
    
    addRelativePosition(relativePosition: THREE.Vector3, jointName: string): void {
        this.handRelativePositions.set(jointName, relativePosition);
    }

    getAveragePointInWorld(handTrackingComponent: AFRAME.Component) {
        const worldPositionSum = this.lastAveragePoint.set(0, 0, 0);
        this.handRelativePositions.forEach((localOffset, jointName) => {
            const bone = handTrackingComponent.bones.find(bone => bone.name === jointName);
            bone.getWorldPosition(this.jointWorldPosition);
            bone.getWorldQuaternion(this.jointWorldQuaternion);

            // Re-rotate the stored local offset by the joint's CURRENT orientation
            this.bonePositionCache
                .copy(localOffset)
                .applyQuaternion(this.jointWorldQuaternion)
                .add(this.jointWorldPosition);

            worldPositionSum.add(this.bonePositionCache);
        });
        worldPositionSum.divideScalar(this.handRelativePositions.size);
    }
    
    updateVisualisation(markerParent: HTMLElement): void {
        const { lastAveragePoint } = this;
        if (!this.visualisationMarker) {
            this.visualisationMarker = createMarker(lastAveragePoint, '#00ff00');
            markerParent.appendChild(this.visualisationMarker);
        }
        
        if (!this.visualise) {
            this.visualisationMarker.setAttribute('visible', 'false');
            return;
        }

        this.visualisationMarker.object3D.position.copy(this.lastAveragePoint);
    }
    
    deleteVisualisation(): void {
        this.visualisationMarker?.parentNode.removeChild(this.visualisationMarker);
    }
}


AFRAME.registerComponent('calibrate-grip', {
    gripPoints: {},
    
    resetReadings: function() {
        this.readings?.forEach((reading: HTMLElement) => {
            this.el.removeChild(reading);
        });

        this.readings = [];
        this.mostRecentIndex = -1;
        this.readingAverage = new THREE.Vector3();
        this.readingRange = Infinity;
        this.currentlyRecording = false;
        this.currentPointName = null;
        this.nextReadingTime = 0;
    },
    
    play: function () {
        if (this.initialised) return;
        this.initialised = true;
        this.resetReadings();
        
        this.leftHandTracking = document.querySelector('#leftHand[hand-tracking-controls]').components['hand-tracking-controls'];
        this.rightHandTracking = document.querySelector('#rightHand[hand-tracking-controls]').components['hand-tracking-controls'];
        this.calibratingHandTrackingComp = null;
        this.grippingHandTrackingComp = null;
        
        this.browserDeviceObject3D = document.querySelector('#browser-device').object3D;
        const sceneEl = document.querySelector('a-scene');
        this.camera = sceneEl.camera;

        // Cached instances
        this.newPosition = new THREE.Vector3();
    },

    tick: function (time) {
        for (const pointName in this.gripPoints) {
            const gripPoint: GripPoint = this.gripPoints[pointName];
            gripPoint.getAveragePointInWorld(this.grippingHandTrackingComp);
            gripPoint.updateVisualisation(this.el);
            this._placePhoneIfSufficientPoints();
        }
        
        if (!this.currentlyRecording) return;
        if (time > this.nextReadingTime) {
            this._recordReading();
            this.nextReadingTime = time + READING_DELAY_MS;
        }

        // If sufficient readings and range is close enough
        if (this.readings.length >= MAX_READINGS && this.readingRange < MAX_ACCEPTABLE_RANGE) {
            this._finalizePoint();
            this.stopRecording();
        }
    },
    
    startRecording(pointName: string, calibratingHandId: 'leftHand' | 'rightHand') {
        this.currentlyRecording = true;
        this.currentPointName = pointName;
        if (calibratingHandId === 'leftHand') {
            this.calibratingHandTrackingComp = this.leftHandTracking;
            this.grippingHandTrackingComp = this.rightHandTracking;
        }
        else if (calibratingHandId === 'rightHand') {
            this.calibratingHandTrackingComp = this.rightHandTracking;
            this.grippingHandTrackingComp = this.leftHandTracking;
        }
        else throw new Error(`Invalid hand ID: ${calibratingHandId}`);
    },
    
    stopRecording() {
        this.currentlyRecording = false;
        this.resetReadings();
    },
    
    _finalizePoint() {
        this.gripPoints[this.currentPointName]?.deleteVisualisation();

        const gripPoint = new GripPoint();
        const worldPos = this.readingAverage.clone();
        for (const jointName of ['thumb-metacarpal', 'index-finger-tip']) {
            gripPoint.addRelativePosition(this._getRelativePositionToJoint(worldPos, jointName), jointName);
        }
        this.gripPoints[this.currentPointName] = gripPoint;
    },
    
    _getRelativePositionToJoint(worldPosition: THREE.Vector3, jointName: string): THREE.Vector3 {
        const joint = this.grippingHandTrackingComp.bones.find(bone => bone.name === jointName);

        const jointWorldPosition = new THREE.Vector3();
        const jointWorldQuaternion = new THREE.Quaternion();
        joint.getWorldPosition(jointWorldPosition);
        joint.getWorldQuaternion(jointWorldQuaternion);

        const worldOffset = worldPosition.clone().sub(jointWorldPosition);

        // Un-rotate into the joint's local frame — this is what makes it rotation-stable
        return worldOffset.applyQuaternion(jointWorldQuaternion.invert());

    },
    
    _recordReading: function () {
        const { newPosition } = this;
        const fingertip = this.calibratingHandTrackingComp.bones.find(bone => bone.name === 'index-finger-tip');
        newPosition.copy(fingertip.position);

        if (this.readings.length >= MAX_READINGS) {
            const lastUpdatedIndex = mod(this.mostRecentIndex + 1, MAX_READINGS);
            const lastUpdatedElement = this.readings[lastUpdatedIndex];
            lastUpdatedElement.object3D.position.set(newPosition.x, newPosition.y, newPosition.z);
            this.mostRecentIndex = lastUpdatedIndex;

            // Update color depending on distance from average
            const distance = this._calculateAverageReading().distanceTo(lastUpdatedElement.object3D.position);
            const color = this._getDistanceAsColor(distance);
            lastUpdatedElement.setAttribute('color', `#${color.getHexString()}`);

            // Other updates
            this._calculateReadingsRange();
            return;
        }
        
        const newMarker = createMarker(newPosition, '#ff0000');
        this.readings.push(newMarker);
        this.mostRecentIndex++;
        this.el.appendChild(newMarker);
    },
    
    _getDistanceAsColor(distance: number) {
        const alpha = Math.min(distance / MAX_ACCEPTABLE_RANGE, 1);
        return new THREE.Color().lerpColors(STABLE_COLOR, UNSTABLE_COLOR, alpha);
    },

    _calculateReadingsRange() {
        const lowerVector = new THREE.Vector3(Infinity, Infinity, Infinity);
        const upperVector = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        this.readings.forEach((reading: HTMLElement) => {
            const position = reading.getAttribute('position');
            for (const axis of axes) {
                if (position[axis] > upperVector[axis]) upperVector[axis] = position[axis];
                if (position[axis] < lowerVector[axis]) lowerVector[axis] = position[axis];
            }
        });

        this.readingRange = lowerVector.distanceTo(upperVector);
        return this.readingRange;
    },

    _calculateAverageReading() {
        const { readingAverage, readings } = this;
        if (readings.length === 0) return readingAverage;
        
        readingAverage.set(0, 0, 0);
        readings.forEach((reading: HTMLElement) => {
            readingAverage.add(reading.getAttribute('position'));
        });
        return readingAverage.divideScalar(readings.length);
    },

    _placePhoneIfSufficientPoints() {
        const gripPointsCount = Object.keys(this.gripPoints).length;
        if (gripPointsCount < 3) return;

        const bottomLeft = this.gripPoints.bottomLeft.getLastAveragePoint();
        const topRight = this.gripPoints.topRight.getLastAveragePoint();
        const topLeft = this.gripPoints.topLeft.getLastAveragePoint();

        // Real, measured edges — these rotate exactly with the hand, no assumptions
        const up = topLeft.clone().sub(bottomLeft).normalize();
        const right = topRight.clone().sub(topLeft).normalize();

        let normal = new THREE.Vector3().crossVectors(right, up).normalize();

        // Re-orthogonalize 'up' in case the three points aren't a perfect right angle
        // (finger placement won't be pixel-perfect)
        const correctedUp = new THREE.Vector3().crossVectors(normal, right).normalize();

        // Resolve normal direction using viewer
        const center = bottomLeft.clone().add(topRight).multiplyScalar(0.5);
        if (this.camera) {
            const towardViewer = this.camera.position.clone().sub(center);
            if (normal.dot(towardViewer) < 0) {
                normal.negate();
                right.negate(); // keep the basis right-handed and consistent when flipping
            }
        }

        // Build the orientation directly from measured axes — no lookAt, no roll ambiguity
        const basis = new THREE.Matrix4().makeBasis(right, correctedUp, normal);
        this.browserDeviceObject3D.quaternion.setFromRotationMatrix(basis);
        this.browserDeviceObject3D.position.copy(center);
    },
});
