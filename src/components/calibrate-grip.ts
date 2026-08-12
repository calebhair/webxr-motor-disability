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

function mod(n, m) {
    return ((n % m) + m) % m;
}

class GripSnapshot {
    public worldPos: THREE.Vector3;
    public handRelativePositions: Map<string, THREE.Vector3>;

    constructor() {
        this.worldPos = new THREE.Vector3();
        this.handRelativePositions = new Map();
    }
    
    addRelativePosition(relativePosition: THREE.Vector3, jointName: string): void {
        this.handRelativePositions.set(jointName, relativePosition);
    }
}


AFRAME.registerComponent('calibrate-grip', {
    gripSnapshots: {},
    
    resetReadings: function() {
        this.readings?.forEach((r) => {
            this.el.removeChild(r);
        })

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
        
        this.leftHandTracking = document.querySelector('#leftHand[hand-tracking-controls]');
        this.rightHandTracking = document.querySelector('#rightHand[hand-tracking-controls]');
        this.currentHandTracking = null;
        
        // Cached instances
        this.indexTipPose = new THREE.Matrix4()
        this.newPosition = new THREE.Vector3()
    },

    tick: function (time, timeDelta) {
        if (!this.currentlyRecording) return;
        if (time > this.nextReadingTime) {
            this._recordReading();
            this.nextReadingTime = time + READING_DELAY_MS;
        }

        // If sufficient readings and range is close enough
        if (this.readings.length >= MINIMUM_STABLE_DISTANCE && this.readingRange < MINIMUM_STABLE_DISTANCE * LENIENCE) {
            const stablePointMarker = this._createMarker(this.readingAverage, '#00ff00')
            this.el.appendChild(stablePointMarker);

            this.finalizePoint();
            this.stopRecording();
        }
    },
    
    startRecording(pointName: string, handId: "leftHand" | "rightHand") {
        this.currentlyRecording = true;
        this.currentPointName = pointName;
        if (handId === "leftHand") this.currentHandTracking = this.leftHandTracking;
        else if (handId === "rightHand") this.currentHandTracking = this.rightHandTracking;
        else throw new Error(`Invalid hand ID: ${handId}`);
    },
    
    stopRecording() {
        this.currentlyRecording = false;
        this.resetReadings();
    },
    
    finalizePoint() {
        const gripSnapshot = new GripSnapshot();
        gripSnapshot.worldPos = this.readingAverage.clone();
        for (const jointName of ['thumb-metacarpal', 'index-finger-phalanx-proximal', 
            'middle-finger-phalanx-proximal', 'ring-finger-phalanx-proximal', 'pinky-finger-phalanx-proximal']) {
            gripSnapshot.addRelativePosition(this.getRelativePositionOfJoint(jointName), jointName);
        }
        this.gripSnapshots[this.currentPointName] = gripSnapshot;
    },
    
    getRelativePositionOfJoint(jointName: string, worldPosition: THREE.Vector3): THREE.Vector3 {
        const joint = this.currentHandTracking.bones.find(b => b.name === jointName);
        return worldPosition.clone().sub(joint.position);
    },
    
    _recordReading: function () {
        const { newPosition } = this;
        const fingertip = this.currentHandTracking.bones.find(b => b.name === 'index-finger-tip')
        newPosition.copy(fingertip.position)

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
        
        const newMarker = this._createMarker(newPosition, '#ff0000');
        this.readings.push(newMarker);
        this.mostRecentIndex++;
        this.el.appendChild(newMarker);
    },
    
    _createMarker(position, color: string) {
        const newMarker = document.createElement("a-icosahedron");
        newMarker.setAttribute('color', color);
        newMarker.setAttribute('radius', '0.01');
        newMarker.setAttribute('position', position);
        return newMarker;
    },
    
    _getDistanceAsColor(distance) {
        const alpha = Math.min(distance / MINIMUM_STABLE_DISTANCE, 1);
        return new THREE.Color().lerpColors(STABLE_COLOR, UNSTABLE_COLOR, alpha)
    },

    _calculateReadingsRange() {
        const lowerVector = new THREE.Vector3(Infinity, Infinity, Infinity);
        const upperVector = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        this.readings.forEach(reading => {
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
        readings.forEach(reading => {
            readingAverage.add(reading.getAttribute('position'));
        });
        return readingAverage.divideScalar(readings.length);
    },
});
