import AFRAME from 'aframe';
import {Container, InProperties, reversePainterSortStable, Text} from '@pmndrs/uikit';
import {makeRootPanel, makeBtn, horizonThemes, defaultContainerConfig} from './helpers.ts';
import {Button} from '@pmndrs/uikit-horizon';
import {CUSTOM_EVENTS, ELEMENT_IDS} from '../../constants.ts';

const rowContainerConfig: InProperties = {
    flexDirection: 'row',
    alignSelf: 'center',
    paddingTop: 2,
};

AFRAME.registerComponent('main-ui', {
    init() {
        // Automatically handles layers of UI
        this.el.sceneEl.renderer.setTransparentSort(reversePainterSortStable);
        
        this.tremorUI = document.querySelector('[tremor-ui]').components['tremor-ui'];
        this.calibrationUI = document.querySelector('[calibration-ui]').components['calibration-ui'];
        this.environmentEl = document.getElementById(ELEMENT_IDS.ENVIRONMENT);
        this.hands = Array.from(document.querySelectorAll('[hand-tracking-controls]'));
        if (!this.tremorUI) throw new Error('Tremor UI not found.');
        if (!this.calibrationUI) throw new Error('Calibration UI not found.');
        if (!this.environmentEl) throw new Error('Environment element not found.');
        if (this.hands.length !== 2) throw new Error('Two hand-tracking-controls elements not found.');

        const { root, panel } = makeRootPanel(this.el);
        this.root = root;
        this.panel = panel;

        this.setupUI(this.panel);
    },

    setupUI(parent) {
        const container = new Container(defaultContainerConfig);
        parent.add(container);

        const firstRow = new Container(rowContainerConfig);
        container.add(firstRow);
        makeBtn('Exit', firstRow, () => {
            this.el.sceneEl.exitVR();
        }, {variant: 'negative', fontSize: 6});
        makeBtn('Passthrough', firstRow, () => this.togglePassthrough(), {fontSize: 6});

        const secondRow = new Container(rowContainerConfig);
        container.add(secondRow);
        this.tremorBtn = makeBtn('Tremor', secondRow,
            () => this.toggleUI(this.tremorUI.root, this.tremorBtn),
            {fontSize: 6},
        );
        this.calibrationBtn = makeBtn('Calibration', secondRow,
            () => this.toggleUI(this.calibrationUI.root, this.calibrationBtn),
            {fontSize: 6},
        );

        this.setupBrowserSection(container);
    },
    
    toggleUI(uiRoot: Container, toggleElement: Button) {
        const isVisible = uiRoot.properties.peek().display !== 'none';
        if (isVisible) {
            uiRoot.setProperties({ display: 'none' });
            toggleElement.setProperties({ variant: 'primary' });
        }
        else {
            uiRoot.setProperties({ display: 'flex' });
            toggleElement.setProperties({ variant: 'negative' });
        }
    },
    
    passthroughEnabled: false,
    togglePassthrough() {
        this.passthroughEnabled = !this.passthroughEnabled;
        const modelOpacity = this.passthroughEnabled ? 0.2 : 1;

        // Toggle environment for hiding hands, for more immersive tremor
        this.environmentEl.setAttribute('environment', { active: !this.passthroughEnabled });

        // Reduce hand opacity in passthrough
        this.hands.forEach((handEl: HTMLElement) => {
            handEl.setAttribute('hand-tracking-controls', { modelOpacity });
        });
    },
    
    setupBrowserSection(parent) {
        const header = new Text({ text: 'Browser', fontSize: 7, color: horizonThemes.primary });
        parent.add(header);

        const buttonContainer = new Container(rowContainerConfig);
        parent.add(buttonContainer);

        const navStyle = { fontSize: 10, flexDirection: 'row', padding: 5 };
        makeBtn('<', buttonContainer, () => {
            document.dispatchEvent(new Event(CUSTOM_EVENTS.BROWSER_BACK));
        }, navStyle);
        makeBtn('>', buttonContainer, () => {
            document.dispatchEvent(new Event(CUSTOM_EVENTS.BROWSER_FORWARD));
        }, navStyle);
    },
    
    tick(time, timeDelta) {
        this.root.update(timeDelta);
    },
});
