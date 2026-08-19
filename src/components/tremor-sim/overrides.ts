import AFRAME from 'aframe';
import {Tremor} from './tremor.ts';
import {CUSTOM_EVENTS} from '../../constants.ts';


// In order to override the hand rendering, override parts of the the hand tracking component directly
const handControlsPrototype = AFRAME.components['hand-tracking-controls'].Component.prototype;

// Init override
const handControlsInit = handControlsPrototype.init;

handControlsPrototype.init = function(){
    handControlsInit.call(this);

    this.tremor = new Tremor(this.jointPoses);
    this.tremorEnabled = false;
    
    document.addEventListener(CUSTOM_EVENTS.CONFIGURE_TREMOR, (event: CustomEvent) => {
        const { tremorEnabled, tremorAmplitudeDegrees, tremorFrequency } = event.detail;

        if (tremorEnabled !== undefined) 
            this.tremorEnabled = !!tremorEnabled;
        if (tremorAmplitudeDegrees !== undefined)
            this.tremor.tremorAmplitudeDegrees = tremorAmplitudeDegrees;
        if (tremorFrequency !== undefined)
            this.tremor.tremorFrequency = tremorFrequency;
    });
};


// Tick override
const handControlsTick = handControlsPrototype.tick;

handControlsPrototype.tick = function(time, timeDelta) {
    handControlsTick.call(this, time, timeDelta);

    // Tremor tick
    if (!this.hasPoses) return;
    if (this.tremorEnabled) {
        this.tremor.applyTremor(time);
        // Re-update
        this.updateHandModel();
        this.detectGesture();
        this.updateWristObject();
    }
};
