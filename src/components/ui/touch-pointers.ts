// For interacting with uikit interfaces via hands
import AFRAME from 'aframe';
import {CombinedPointer, createTouchPointer} from '@pmndrs/pointer-events';

const options = { hoverRadius: 0.05, downRadius: 0.01 };

AFRAME.registerSystem('touch-pointers', {
    init: function () {
        const { sceneEl } = this.el;
        const getCamera = () => sceneEl.camera;

        // space refs — createTouchPointer reads .current's world transform every move() call,
        // so once we assign the fingertip bone Object3D here, position tracking is automatic
        this.leftSpace = { current: null };
        this.rightSpace = { current: null };
        this.leftPointer = createTouchPointer(getCamera, this.leftSpace, { hand: 'leftHand' }, options, 'touch');
        this.rightPointer = createTouchPointer(getCamera, this.rightSpace, { hand: 'rightHand' }, options, 'touch');

        // Use combined pointer for performance
        this.combined = new CombinedPointer(true); // true = allow both hands active simultaneously
        this.combined.register(this.leftPointer);
        this.combined.register(this.rightPointer);

        this.leftHandEl = document.querySelector('#leftHand');
        this.rightHandEl = document.querySelector('#rightHand');
        if (!this.leftHandEl || !this.rightHandEl) throw 'Could not find hands.';
        console.log('Touch pointers setup');
    },

    tick: function () {
        if (!this.leftHandTracking || !this.rightHandTracking) {
            this.leftHandTracking = this.leftHandEl.components['hand-tracking-controls'];
            this.rightHandTracking = this.rightHandEl.components['hand-tracking-controls'];
            return;
        }

        // resolve fingertip bones lazily, once hand-tracking-controls has loaded them
        if (!this.leftSpace.current) this.leftSpace.current = this._getFingertip(this.leftHandTracking);
        if (!this.rightSpace.current) this.rightSpace.current = this._getFingertip(this.rightHandTracking);

        this.combined.move(this.el.sceneEl.object3D, { timeStamp: performance.now() });
    },

    _getFingertip: function (handTrackingControls) {
        const bones = handTrackingControls?.bones;
        if (!bones) return null;
        return bones.find(bone => bone.name === 'index-finger-tip') ?? null;
    },
});