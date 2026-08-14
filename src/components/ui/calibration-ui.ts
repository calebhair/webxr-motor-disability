import AFRAME from 'aframe';
import { Container, reversePainterSortStable } from '@pmndrs/uikit';
import {rootPanel, btn} from './helpers.ts';

const THREE = AFRAME.THREE;

const LEFT_HAND_ID = 'leftHand';
const RIGHT_HAND_ID = 'rightHand';

const HAND_OFFSET = new THREE.Vector3(0, -0.15, 0);

AFRAME.registerComponent('calibration-ui', {
    calibrating: false,
    _vec3Cache: new THREE.Vector3(),

    init: function () {
        const calibrateGripEl = document.querySelector('[calibrate-grip]');
        if (!calibrateGripEl) throw new Error('calibrate-grip is missing');
        this.calibrateGrip = calibrateGripEl.components['calibrate-grip'];

        this.cameraObject3D = this.el.sceneEl.camera;
        console.warn(this.cameraObject3D);
        
        this.handTracking = {
            [LEFT_HAND_ID]: document.getElementById(LEFT_HAND_ID).components['hand-tracking-controls'],
            [RIGHT_HAND_ID]: document.getElementById(RIGHT_HAND_ID).components['hand-tracking-controls'],
        };

        this.setupUI();
    },
    
    setupUI() {
        this.el.sceneEl.renderer.setTransparentSort(reversePainterSortStable);

        const { root, panel } = rootPanel(this.el, {}, { pixelSize: 0.002 });
        this.root = root;
        this.panel = panel;

        const topRow = new Container({ flexDirection: 'row', alignItems: 'flex-start' });
        this.panel.add(topRow);
        const bottomRow = new Container({ flexDirection: 'row' });
        this.panel.add(bottomRow);

        btn('Top left', topRow, () => {
            this.calibrateGrip.startRecording('topLeft', this.calibratingHandID);
        });
        btn('Top right', topRow, () => {
            this.calibrateGrip.startRecording('topRight', this.calibratingHandID);
        });
        btn('Bottom left', bottomRow, () => {
            this.calibrateGrip.startRecording('bottomLeft', this.calibratingHandID);
        });
        btn('Hide', panel, () => {
            this.cancelCalibration();
        }, {variant: 'tertiary'});
    },

    startCalibratingForHand(grabbingHandID: typeof LEFT_HAND_ID | typeof RIGHT_HAND_ID) {
        this.grabbingHandID = grabbingHandID;

        if (grabbingHandID === LEFT_HAND_ID) this.calibratingHandID = RIGHT_HAND_ID;
        else if (grabbingHandID === RIGHT_HAND_ID) this.calibratingHandID = LEFT_HAND_ID;
        else throw new Error('Unknown grabbing hand ID');

        this.calibrating = true;
        this.root.visible = true;
    },
    
    cancelCalibration() {
        this.calibrateGrip.stopRecording();
        this.calibrating = false;
        this.root.visible = false;
    },

    resetCalibration() {
        this.cancelCalibration();
        this.calibrateGrip.resetReadings();
        this.calibrateGrip.resetGripPoints();
    },

    tick: function (time, timeDelta) {
        if (!this.calibrating) return;
        this.root.update(timeDelta);

        const uiObject3D: AFRAME.THREE.Object3D = this.el.object3D;
        // Move UI under the grabbing hand
        uiObject3D.position.copy(this.getHandCentrePos())
            .add(HAND_OFFSET);
        // Point towards camera
        uiObject3D.lookAt(this.el.sceneEl.camera.getWorldPosition(this._vec3Cache));
    },

    getHandCentrePos() {
        const centrePos = this.handTracking[this.grabbingHandID].bones.find(bone => bone.name === 'middle-finger-metacarpal').position;
        return this._vec3Cache.copy(centrePos);
    },
});
