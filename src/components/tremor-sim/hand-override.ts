import {Tremor} from "./tremor.ts";

const THREE = AFRAME.THREE;
const handControlsPrototype = AFRAME.components['hand-tracking-controls'].Component.prototype;

const superInit = handControlsPrototype.init
handControlsPrototype.init = function(){
    superInit.call(this);
    this.tremor = new Tremor(this.jointPoses)
}

const superTick = handControlsPrototype.tick
handControlsPrototype.tick = function(time, timeDelta) {
    superTick.call(this, time, timeDelta);
    if (!this.hasPoses) return;

    // Tremor tick
    this.tremor.applyTremor(time);
    this.updateHandModel();
    this.detectGesture();
    this.updateWristObject();
}
