import AFRAME from 'aframe';
import { Container, reversePainterSortStable, Text } from '@pmndrs/uikit';
import { theme } from '@pmndrs/uikit-horizon';
import {rootPanel, btn} from './helpers.ts';


const horizonThemes = {
    primary: theme.component.button.primary.background.fill.default.value,
    subtext: theme.component.button.primary.background.fill.hovered.value,
};

AFRAME.registerComponent('main-ui', {
    init: function () {
        const calibrationUI = document.querySelector('[calibration-ui]');
        if (!calibrationUI) throw new Error('calibration-ui is missing');
        this.calibrationUI = calibrationUI.components['calibration-ui'];

        // Automatically handles layers of UI
        this.el.sceneEl.renderer.setTransparentSort(reversePainterSortStable);

        const { root, panel } = rootPanel(this.el);
        this.root = root;
        this.panel = panel;
        
        this.setupCalibrationSection();
    },
    
    setupCalibrationSection() {
        const calibrationContainer = new Container({
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: 70,
        });
        this.panel.add(calibrationContainer);

        const calibrationHeading = new Text({ text: 'Calibration', fontSize: 7, color: horizonThemes.primary });
        calibrationContainer.add(calibrationHeading);

        const calibrationSubheading = new Text({ text: 'Calibration should be performed while the tremor is disabled.',
            fontSize: 3, color: horizonThemes.subtext });
        calibrationContainer.add(calibrationSubheading);

        const calibrationInstruction = new Text({ text: 'Select which hand should hold the device.',
            fontSize: 3, color: horizonThemes.subtext, paddingTop: 2 });
        calibrationContainer.add(calibrationInstruction);

        const calibrationButtonContainer = new Container({ flexDirection: 'row', alignSelf: 'center', paddingTop: 2 });
        calibrationContainer.add(calibrationButtonContainer);
        btn('Left hand', calibrationButtonContainer, () => {
            this.calibrationUI.startCalibratingForHand('leftHand');
        });
        btn('Right hand', calibrationButtonContainer, () => {
            this.calibrationUI.startCalibratingForHand('rightHand');
        });
    },

    tick: function (time, timeDelta) {
        this.root.update(timeDelta);
    },
});
