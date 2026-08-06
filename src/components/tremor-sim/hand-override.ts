import {Tremor} from "./tremor.ts";

const THREE = AFRAME.THREE;
const handControlsPrototype = AFRAME.components['hand-tracking-controls'].Component.prototype;

const superInit = handControlsPrototype.init
const superTick = handControlsPrototype.tick
handControlsPrototype.init = function(){
    superInit.call(this);
    this.tremor = new Tremor(this.jointPoses)
}

// Duplicate of original implementation, with applyTremor inserted (yikes) TODO improve
handControlsPrototype.tick = function(time, timeDelta) {
    superTick.call(this, time, timeDelta);
    
    // Tremor tick
    if (this.hasPoses) {
        this.tremor.applyTremor(time);
        this.updateHandModel();
        this.detectGesture();
        this.updateWristObject();
    }
}
