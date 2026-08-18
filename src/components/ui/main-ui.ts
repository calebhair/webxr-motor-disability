import AFRAME from 'aframe';
import {type BaseOutProperties, Container, type InProperties, reversePainterSortStable, Text} from '@pmndrs/uikit';
import {theme} from '@pmndrs/uikit-horizon';
import {rootPanel, btn} from './helpers.ts';


const horizonThemes = {
    primary: theme.component.button.primary.background.fill.default.value,
    subtext: theme.component.button.primary.background.fill.hovered.value,
};

const defaultContainerConfig: InProperties<BaseOutProperties> = {
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: 70,
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

        this.setupCalibrationSection(this.panel);
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
        btn('Left hand', calibrationButtonContainer, () => {
            this.calibrationUI.startCalibratingForHand('leftHand');
        });
        btn('Right hand', calibrationButtonContainer, () => {
            this.calibrationUI.startCalibratingForHand('rightHand');
        });
        btn('Reset', calibrationContainer, () => {
            this.calibrationUI.resetCalibration();
        }, {variant: 'negative', alignSelf: 'center'});
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
        btn('<', buttonContainer, () => {
            document.dispatchEvent(new Event('streamed-browser-back'));
        }, navStyle);
        btn('>', buttonContainer, () => {
            document.dispatchEvent(new Event('streamed-browser-forward'));
        }, navStyle);
    },
    
    tick(time, timeDelta) {
        this.root.update(timeDelta);
    },
});
