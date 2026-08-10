import {HandJointIDs} from "./tremor-sim/hand-helpers.ts";

const THREE = AFRAME.THREE;
const MAX_READINGS = 10;
const READING_DELAY_MS = 100;
const MINIMUM_STABLE_DISTANCE = 0.01; // How far two points can be from each other to be considered stable
const LENIENCE = 1; // If the average distance from previous point is less than MINIMUM_STABLE_DISTANCE * LENIENCE, point is accepted
const UNSTABLE_COLOR = new THREE.Color(0xff0000);
const STABLE_COLOR = new THREE.Color(0x00ffff);

function mod(n, m) {
    return ((n % m) + m) % m;
}

const axes = ['x', 'y', 'z'];

AFRAME.registerComponent('calibrate-grip', {
    readings: [],
    mostRecentIndex: -1,
    readingAverage: new THREE.Vector3(),
    readingRange: Infinity,
    stablePoints: [],
    
    play: function () {
        if (this.initialised) return;
        this.initialised = true;
        
        this.hands = Array.from(document.querySelectorAll('[hand-tracking-controls]'));
        this.handTrackingComponents = []
        for (const hand of this.hands) {
            this.handTrackingComponents.push({
                hand,
                handTrackingControls: hand.components['hand-tracking-controls'],
                grabControls: hand.components['hand-tracking-grab-controls'],
            });
        }

        this.jointPoses = this.handTrackingComponents[0].handTrackingControls.jointPoses;
        
        this.nextReadingTime = 0;
        
        // Cached instances
        this.indexTipPose = new THREE.Matrix4()
        this.newPosition = new THREE.Vector3()
    },

    tick: function (time, timeDelta) {
        if (time > this.nextReadingTime) {
            this.recordReading();
            this.nextReadingTime = time + READING_DELAY_MS;
        }

        // If sufficient readings and range is close enough
        if (this.readings.length >= MINIMUM_STABLE_DISTANCE && this.readingRange < MINIMUM_STABLE_DISTANCE * LENIENCE) {
            this.stablePoints.push(this.readingAverage.clone());
            const stablePointMarker = this.createMarker(this.readingAverage, '#00ff00')
            this.el.appendChild(stablePointMarker);
        }
    },
    
    recordReading: function () {
        const { newPosition } = this;
        newPosition.setFromMatrixPosition(this.indexTipPose.fromArray(this.jointPoses, HandJointIDs.INDEX_TIP * 16));

        if (this.readings.length >= MAX_READINGS) {
            const lastUpdatedIndex = mod(this.mostRecentIndex + 1, MAX_READINGS);
            const lastUpdatedElement = this.readings[lastUpdatedIndex];
            lastUpdatedElement.object3D.position.set(newPosition.x, newPosition.y, newPosition.z);
            this.mostRecentIndex = lastUpdatedIndex;

            // Update color depending on distance from average
            const distance = this.calculateAverageReading().distanceTo(lastUpdatedElement.object3D.position);
            const color = this.getDistanceAsColor(distance);
            lastUpdatedElement.setAttribute('color', `#${color.getHexString()}`);

            // Other updates
            this.calculateReadingsRange();
            return;
        }
        
        const newMarker = this.createMarker(newPosition, '#ff0000');
        this.readings.push(newMarker);
        this.mostRecentIndex++;
        this.el.appendChild(newMarker);
    },
    
    createMarker(position, color: string) {
        const newMarker = document.createElement("a-icosahedron");
        newMarker.setAttribute('color', color);
        newMarker.setAttribute('radius', '0.01');
        newMarker.setAttribute('position', position);
        return newMarker;
    },
    
    getDistanceAsColor(distance) {
        const alpha = Math.min(distance / MINIMUM_STABLE_DISTANCE, 1);
        return new THREE.Color().lerpColors(STABLE_COLOR, UNSTABLE_COLOR, alpha)
    },

    calculateReadingsRange() {
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

    calculateAverageReading() {
        const { readingAverage, readings } = this;
        if (readings.length === 0) return readingAverage;
        
        readingAverage.set(0, 0, 0);
        readings.forEach(reading => {
            readingAverage.add(reading.getAttribute('position'));
        });
        return readingAverage.divideScalar(readings.length);
    },
});
