import AFRAME from 'aframe';
import {Container, Text} from '@pmndrs/uikit';
import {makeRootPanel, horizonThemes, makeCheckbox, makeSlider, defaultContainerConfig, round} from './helpers.ts';
import {CUSTOM_EVENTS} from '../../constants.ts';

AFRAME.registerComponent('tremor-ui', {
    init() {
        const { root, panel } = makeRootPanel(this.el);
        this.root = root;
        this.panel = panel;

        this.setupUI(this.panel);
    },

    setupUI(parent) {
        const container = new Container(defaultContainerConfig);
        parent.add(container);

        const header = new Text({ text: 'Tremor', fontSize: 7, color: horizonThemes.primary });
        container.add(header);

        function setTremorSetting(setting: string, value) {
            const detail = {[setting]: value};
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.CONFIGURE_TREMOR, { detail }));
        }

        makeCheckbox('Enabled', container,
            (checked) => setTremorSetting('tremorEnabled', checked));

        makeSlider('Amplitude', container,
            (value) => setTremorSetting('tremorAmplitudeDegrees', value),
            {
                min: 0, max: 10, defaultValue: 0,
                valueFormat: (value) => `${round(value, 1).toFixed(1)}°`,
            },
        );

        makeSlider('Frequency', container,
            (value) => setTremorSetting('tremorFrequency', value),
            {
                min: 0, max: 15, defaultValue: 0,
                valueFormat: (value) => `${round(value, 0)}Hz`,
            },
        );
    },
    
    tick(time, timeDelta) {
        this.root.update(timeDelta);
    },
});
