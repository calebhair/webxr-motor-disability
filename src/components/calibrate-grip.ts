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

AFRAME.registerComponent('calibrate-grip', {
    readings: [],
    mostRecentIndex: -1,
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
        
        this.nextReadingTime = 0;
    },

    tick: function (time, timeDelta) {
        if (time > this.nextReadingTime) {
            this.recordReading();
            this.nextReadingTime = time + READING_DELAY_MS;
        }

        if (this.canMarkStablePoint()) {
            const avgPos = this.getAveragePosition()
            this.stablePoints.push(avgPos);
            const stablePointMarker = this.createMarker(avgPos, '#00ff00')
            this.el.appendChild(stablePointMarker);
        }
    },
    
    recordReading: function () {
        const jointPoses = this.handTrackingComponents[0].handTrackingControls.jointPoses;
        const jointPose = new THREE.Matrix4()
        const newPosition = new THREE.Vector3()

        newPosition.setFromMatrixPosition(jointPose.fromArray(jointPoses, HandJointIDs.INDEX_TIP * 16));

        if (this.readings.length >= MAX_READINGS) {
            const prevIndex = this.mostRecentIndex;
            this.mostRecentIndex = mod(this.mostRecentIndex + 1, MAX_READINGS);
            const prevObject3D = this.readings[prevIndex].element.object3D
            const mostRecentElement = this.readings[this.mostRecentIndex].element

            const distance = prevObject3D.position.distanceTo(mostRecentElement.object3D.position);
            const color = this.getDistanceAsColor(distance);

            this.readings[this.mostRecentIndex].distanceFromLastPoint = distance;
            this.readings[this.mostRecentIndex].position = newPosition;
            mostRecentElement.setAttribute('color', `#${color.getHexString()}`);
            mostRecentElement.object3D.position.set(newPosition.x, newPosition.y, newPosition.z);
            return;
        }
        
        const newMarker = this.createMarker(newPosition, '#ff0000');
        this.readings.push({ element: newMarker, position: newPosition, distanceFromLastPoint: Infinity });
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
    
    canMarkStablePoint() {
        let totalDistance = 0;
        this.readings.forEach(reading => totalDistance += reading.distanceFromLastPoint);
        const averageDistance = totalDistance / this.readings.length;
        return this.readings.length >= MAX_READINGS && averageDistance < MINIMUM_STABLE_DISTANCE * LENIENCE;
    },

    getAveragePosition() {
        if (this.readings.length === 0) return new THREE.Vector3(0, 0, 0);
        const avgPosition = new THREE.Vector3();
        this.readings.forEach(reading => {
            avgPosition.add(reading.position)
        });
        return avgPosition.divideScalar(this.readings.length);
    },
});
