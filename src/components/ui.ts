import AFRAME from 'aframe';
import { Container, reversePainterSortStable, Text } from '@pmndrs/uikit';
import { Panel } from '@pmndrs/uikit-horizon';
import { Button, ButtonLabel } from '@pmndrs/uikit-horizon';

AFRAME.registerComponent('ui-root', {

    init: function () {
        const calibrateGripEl = document.querySelector('[calibrate-grip]');
        if (!calibrateGripEl) throw new Error('calibrate-grip is missing');
        this.calibrateGrip = calibrateGripEl.components['calibrate-grip'];

        // Automatically handles layers of UI
        this.el.sceneEl.renderer.setTransparentSort(reversePainterSortStable);

        const root = this.root = new Container({
            pixelSize: 0.005,
        });
        this.el.setObject3D('mesh', root);

        const optionsPanel = new Panel({
            padding: 4,
            color: 'black',
            flexDirection: 'column', alignItems: 'center',
        });
        root.add(optionsPanel);

        const calibrationContainer = new Container({
            flexDirection: 'row',
        });
        optionsPanel.add(calibrationContainer);

        const bottomLeftBtn = btn('Bottom left', calibrationContainer, (event) => {
            this.calibrateGrip.startRecording('bottomLeft', event.pointerState.hand);
        });
        const topRightBtn = btn('Top right', calibrationContainer, (event) => {
            this.calibrateGrip.startRecording('topRight', event.pointerState.hand);
        });
        const topLeftBtn = btn('Top left', calibrationContainer, (event) => {
            this.calibrateGrip.startRecording('topLeft', event.pointerState.hand);
        });
    },

    tick: function (time, timeDelta) {
        this.root.update(timeDelta);
    },
});

function btn(text, container, cb: Function = undefined) {
    const btn = new Button({
        minHeight: 0, minWidth: 0, height: 20,
        margin: 2, padding: 4,
    });
    container.add(btn);

    const btnLabel = new ButtonLabel({ margin: 0, padding: 0, minWidth: 0, minHeight: 0 });
    btn.add(btnLabel);
    const btnText = new Text({ text, fontSize: 4 });
    btnLabel.add(btnText);
    
    if (cb) btn.addEventListener('pointerdown', cb);
    
    return btn;
}
