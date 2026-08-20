import AFRAME from 'aframe';
import {Container, reversePainterSortStable, Text} from '@pmndrs/uikit';
import {makeRootPanel, makeBtn, horizonThemes, defaultContainerConfig} from './helpers.ts';

AFRAME.registerComponent('main-ui', {
    init() {
        // Automatically handles layers of UI
        this.el.sceneEl.renderer.setTransparentSort(reversePainterSortStable);

        const { root, panel } = makeRootPanel(this.el);
        this.root = root;
        this.panel = panel;

        this.setupBrowserSection(this.panel);
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
