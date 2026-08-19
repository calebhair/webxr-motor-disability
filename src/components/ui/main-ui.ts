import AFRAME from 'aframe';
import {Container, type InProperties, reversePainterSortStable, Text} from '@pmndrs/uikit';
import {makeRootPanel, makeBtn, horizonThemes, makeCheckbox, makeSlider} from './helpers.ts';

const defaultContainerConfig: InProperties = {
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: 70,
    marginBottom: 5,
};

function round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

AFRAME.registerComponent('main-ui', {
    init() {
        const calibrationUI = document.querySelector('[calibration-ui]');
        if (!calibrationUI) throw new Error('calibration-ui is missing');
        this.calibrationUI = calibrationUI.components['calibration-ui'];

        // Automatically handles layers of UI
        this.el.sceneEl.renderer.setTransparentSort(reversePainterSortStable);

        const { root, panel } = makeRootPanel(this.el);
        this.root = root;
        this.panel = panel;

        this.setupCalibrationSection(this.panel);
        this.setupTremor(this.panel);
        this.setupBrowserSection(this.panel);
    },
    
    setupCalibrationSection(parent) {
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
            this.calibrationUI.startCalibratingForHand('leftHand');
        });
        makeBtn('Right hand', calibrationButtonContainer, () => {
            this.calibrationUI.startCalibratingForHand('rightHand');
        });
        makeBtn('Reset', calibrationContainer, () => {
            this.calibrationUI.resetCalibration();
        }, {variant: 'negative', alignSelf: 'center'});
    },

    setupTremor(parent) {
        const container = new Container(defaultContainerConfig);
        parent.add(container);

        const header = new Text({ text: 'Tremor', fontSize: 7, color: horizonThemes.primary });
        container.add(header);
        
        makeCheckbox('Enable', container, AFRAME.log);
        makeSlider('Amplitude', container, AFRAME.log, {
            min: 0, max: 5, defaultValue: 0, valueFormat: (value) => `${round(value, 1).toFixed(1)}°`,
        });
    },
    
    setupBrowserSection(parent) {
        const container = new Container(defaultContainerConfig);
        parent.add(container);

        const header = new Text({ text: 'Browser', fontSize: 7, color: horizonThemes.primary });
        container.add(header);

        const buttonContainer = new Container({
            flexDirection: 'row',
            alignSelf: 'center',
            paddingTop: 2,
        });
        container.add(buttonContainer);

        const navStyle = { fontSize: 10, flexDirection: 'row', padding: 5 };
        makeBtn('<', buttonContainer, () => {
            document.dispatchEvent(new Event('streamed-browser-back'));
        }, navStyle);
        makeBtn('>', buttonContainer, () => {
            document.dispatchEvent(new Event('streamed-browser-forward'));
        }, navStyle);
    },
    
    tick(time, timeDelta) {
        this.root.update(timeDelta);
    },
});
