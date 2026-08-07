import {Tremor} from "./tremor.ts";
import {PalmGrabFunctions} from "./palm-grab.ts";


// Hand controls override
const handControlsPrototype = AFRAME.components['hand-tracking-controls'].Component.prototype;

const handControlsInit = handControlsPrototype.init
handControlsPrototype.init = function(){
    handControlsInit.call(this);
    this.tremor = new Tremor(this.jointPoses)
}

const handControlsTick = handControlsPrototype.tick
handControlsPrototype.tick = function(time, timeDelta) {
    handControlsTick.call(this, time, timeDelta);
    if (!this.hasPoses) return;

    // Tremor tick
    this.tremor.applyTremor(time);
    this.updateHandModel();
    this.detectGesture();
    this.updateWristObject();
}

// Grab controls override
const grabControlsPrototype = AFRAME.components['hand-tracking-grab-controls'].Component.prototype;

const grabControlsInit = grabControlsPrototype.init
grabControlsPrototype.init = function(){
    grabControlsInit.call(this);

    this.detectPalmGrab = PalmGrabFunctions.detectPalmGrab.bind(this)
    this._getTipDistanceFromMetacarpal = PalmGrabFunctions._getTipDistanceFromMetacarpal.bind(this)
    this.onPalmGrabStarted = PalmGrabFunctions.onPalmGrabStarted.bind(this)
    this.onPalmGrabEnded = PalmGrabFunctions.onPalmGrabEnded.bind(this)
    PalmGrabFunctions.init.call(this);
}

grabControlsPrototype.tick = function(time, timeDelta) {
    PalmGrabFunctions.tick.call(this);
}

const superOnPinchStarted = grabControlsPrototype.onPinchStarted;
grabControlsPrototype.onPinchStarted = function(evt) {
    if (!this.grabControls.grabbedEl) return;
    // superOnPinchStarted.call(this, evt);
}