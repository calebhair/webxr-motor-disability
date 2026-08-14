import AFRAME from 'aframe';
import { Container, reversePainterSortStable } from '@pmndrs/uikit';
import {rootPanel, btn} from './helpers.ts';

AFRAME.registerComponent('calibration-ui', {
    calibrating: true,

    init: function () {
        const calibrateGripEl = document.querySelector('[calibrate-grip]');
        if (!calibrateGripEl) throw new Error('calibrate-grip is missing');
        this.calibrateGrip = calibrateGripEl.components['calibrate-grip'];

        // Automatically handles layers of UI
        this.el.sceneEl.renderer.setTransparentSort(reversePainterSortStable);

        const { root, panel } = rootPanel(this.el);
        this.root = root;
        this.panel = panel;

        const topRow = new Container({ flexDirection: 'row', alignItems: 'flex-start' });
        this.panel.add(topRow);
        const bottomRow = new Container({ flexDirection: 'row' });
        this.panel.add(bottomRow);

        const topLeftBtn = btn('Top left', topRow, (event) => {
            this.calibrateGrip.startRecording('topLeft', event.pointerState.hand);
        });
        const topRightBtn = btn('Top right', topRow, (event) => {
            this.calibrateGrip.startRecording('topRight', event.pointerState.hand);
        });
        const bottomLeftBtn = btn('Bottom left', bottomRow, (event) => {
            this.calibrateGrip.startRecording('bottomLeft', event.pointerState.hand);
        });

        btn('Cancel', panel, (event) => {
            console.warn('Cancel pressed');
        }, {variant: 'tertiary'});
    },

    tick: function (time, timeDelta) {
        if (!this.calibrating) return;

        this.root.update(timeDelta);
        // this.el.object3D.position.set();
    },
});
