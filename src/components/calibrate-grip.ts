import AFRAME from 'aframe';
import * as THREE from 'three';

// const THREE = AFRAME.THREE;
const MAX_READINGS = 10;
const READING_DELAY_MS = 100;
const MINIMUM_STABLE_DISTANCE = 0.01; // How far two points can be from each other to be considered stable
const LENIENCE = 1; // If the average distance from previous point is less than MINIMUM_STABLE_DISTANCE * LENIENCE, point is accepted
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
    private readonly lastComputedAveragePoint: THREE.Vector3;
    private readonly bonePositionCache: THREE.Vector3;

    constructor() {
        this.handRelativePositions = new Map();
        this.lastComputedAveragePoint = new THREE.Vector3();
        this.bonePositionCache = new THREE.Vector3();
    }
    
    addRelativePosition(relativePosition: THREE.Vector3, jointName: string): void {
        this.handRelativePositions.set(jointName, relativePosition);
    }
    
    getAveragePointInWorld(handTrackingComponent: AFRAME.Component) {
        const worldPositionSum = this.lastComputedAveragePoint.set(0, 0, 0);
        this.handRelativePositions.forEach((relativePosition, jointName) => {
            this.bonePositionCache.copy(handTrackingComponent.bones.find(bone => bone.name === jointName).position)
                .sub(relativePosition);
            worldPositionSum.add(this.bonePositionCache);
        });
        worldPositionSum.divideScalar(this.handRelativePositions.size);
    }
    
    updateVisualisation(markerParent: HTMLElement): void {
        const { lastComputedAveragePoint } = this;
        if (!this.visualisationMarker) {
            this.visualisationMarker = createMarker(lastComputedAveragePoint, '#00ff00');
            markerParent.appendChild(this.visualisationMarker);
        }
        
        if (!this.visualise) {
            this.visualisationMarker.setAttribute('visible', 'false');
            return;
        }

        this.visualisationMarker.object3D.position.copy(this.lastComputedAveragePoint);
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
        
        // Cached instances
        this.newPosition = new THREE.Vector3();
    },

    tick: function (time) {
        for (const pointName in this.gripPoints) {
            const gripPoint: GripPoint = this.gripPoints[pointName];
            gripPoint.getAveragePointInWorld(this.grippingHandTrackingComp);
            gripPoint.updateVisualisation(this.el);
        }
        
        if (!this.currentlyRecording) return;
        if (time > this.nextReadingTime) {
            this._recordReading();
            this.nextReadingTime = time + READING_DELAY_MS;
        }

        // If sufficient readings and range is close enough
        if (this.readings.length >= MINIMUM_STABLE_DISTANCE && this.readingRange < MINIMUM_STABLE_DISTANCE * LENIENCE) {
            this.finalizePoint();
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
    
    finalizePoint() {
        const gripPoint = new GripPoint();
        const worldPos = this.readingAverage.clone();
        for (const jointName of ['thumb-metacarpal', 'index-finger-phalanx-proximal', 
            'middle-finger-phalanx-proximal', 'ring-finger-phalanx-proximal', 'pinky-finger-phalanx-proximal']) {
            gripPoint.addRelativePosition(this.getRelativePositionToJoint(worldPos, jointName), jointName);
        }
        this.gripPoints[this.currentPointName] = gripPoint;
    },
    
    getRelativePositionToJoint(worldPosition: THREE.Vector3, jointName: string): THREE.Vector3 {
        const joint = this.grippingHandTrackingComp.bones.find(bone => bone.name === jointName);
        return worldPosition.clone().sub(joint.position);
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
        const alpha = Math.min(distance / MINIMUM_STABLE_DISTANCE, 1);
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
});
