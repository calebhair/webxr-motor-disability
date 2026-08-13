import AFRAME from 'aframe';
import {Tremor} from './tremor.ts';


// Hand controls override
const handControlsPrototype = AFRAME.components['hand-tracking-controls'].Component.prototype;

const handControlsInit = handControlsPrototype.init;
handControlsPrototype.init = function(){
    handControlsInit.call(this);
    this.tremor = new Tremor(this.jointPoses);
};

const handControlsTick = handControlsPrototype.tick;
handControlsPrototype.tick = function(time, timeDelta) {
    handControlsTick.call(this, time, timeDelta);
    if (!this.hasPoses) return;

    // Tremor tick
    // this.tremor.applyTremor(time);
    this.updateHandModel();
    this.detectGesture();
    this.updateWristObject();
};
