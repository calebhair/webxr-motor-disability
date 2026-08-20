import AFRAME from 'aframe';
import {Container, Text} from '@pmndrs/uikit';
import {makeRootPanel, makeBtn, horizonThemes, defaultContainerConfig} from './helpers.ts';

AFRAME.registerComponent('calibration-ui', {
    init() {
        const calibrationHandUIElement = document.querySelector('[calibration-hand-ui]');
        if (!calibrationHandUIElement) throw new Error('calibration-hand-ui is missing');
        this.calibrationHandUI = calibrationHandUIElement.components['calibration-hand-ui'];

        const { root, panel } = makeRootPanel(this.el, {}, { display: 'none' });
        this.root = root;
        this.panel = panel;

        this.setupUI(this.panel);
    },
    
    setupUI(parent) {
        const calibrationContainer = new Container(defaultContainerConfig);
        parent.add(calibrationContainer);

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
        makeBtn('Left hand', calibrationButtonContainer, () => {
            this.calibrationHandUI.startCalibratingForHand('leftHand');
        });
        makeBtn('Right hand', calibrationButtonContainer, () => {
            this.calibrationHandUI.startCalibratingForHand('rightHand');
        });
        makeBtn('Reset', calibrationContainer, () => {
            this.calibrationHandUI.resetCalibration();
        }, {variant: 'negative', alignSelf: 'center'});
    },

    tick(time, timeDelta) {
        this.root.update(timeDelta);
    },
});
