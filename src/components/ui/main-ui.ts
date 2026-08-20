import AFRAME from 'aframe';
import {Container, InProperties, reversePainterSortStable, Text} from '@pmndrs/uikit';
import {makeRootPanel, makeBtn, horizonThemes, defaultContainerConfig} from './helpers.ts';

const rowContainerConfig: InProperties = {
    flexDirection: 'row',
    alignSelf: 'center',
    paddingTop: 2,
};

AFRAME.registerComponent('main-ui', {
    init() {
        // Automatically handles layers of UI
        this.el.sceneEl.renderer.setTransparentSort(reversePainterSortStable);

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
        }, {variant: 'negative', alignSelf: 'center', fontSize: 6, paddingX: 5 });

        const secondRow = new Container(rowContainerConfig);
        container.add(secondRow);
        makeBtn('Tremor', secondRow, () => {
            
        }, {fontSize: 6});
        makeBtn('Calibrate', secondRow, () => {

        }, {fontSize: 6});
        
        this.setupBrowserSection(container);
    },
    
    setupBrowserSection(parent) {
        const header = new Text({ text: 'Browser', fontSize: 7, color: horizonThemes.primary });
        parent.add(header);

        const buttonContainer = new Container(rowContainerConfig);
        parent.add(buttonContainer);

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
