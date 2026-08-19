import {Button, ButtonLabel, Checkbox, Panel, Slider, SliderOutProperties, theme} from '@pmndrs/uikit-horizon';
import {Container, InProperties, Text} from '@pmndrs/uikit';

export const horizonThemes = {
    primary: theme.component.button.primary.background.fill.default.value,
    subtext: theme.component.button.primary.background.fill.hovered.value,
};

export const PIXEL_SIZE = 0.005;

/**
 * Disables a uikit component for a small amount of time, to prevent accidental double clicks.
 * @param component the component to temporarily disable.
 */
function timeoutComponent(component) {
    component.setProperties({ disabled: true });
    setTimeout(() => component.setProperties({ disabled: false }), 500);
}

export function makeBtn(text, parentContainer: Container, cb: Function = undefined, btnOverrides: object = {}) {
    const btn = new Button({
        minHeight: 0, minWidth: 0, height: 20,
        margin: 2, padding: 4,
        ...btnOverrides,
    });
    parentContainer.add(btn);

    const btnLabel = new ButtonLabel({ margin: 0, padding: 0, minWidth: 0, minHeight: 0 });
    btn.add(btnLabel);
    const btnText = new Text({ text, fontSize: 4, ...btnOverrides });
    btnLabel.add(btnText);

    if (cb) btn.addEventListener('pointerup', event => {
        cb(event);
        timeoutComponent(btn);
    });

    return btn;
}

export function makeRootPanel(parentElement: HTMLElement, panelOverrides: object = {}, rootOverrides: object = {}) {
    const root = new Container({
        pixelSize: PIXEL_SIZE,
        ...rootOverrides,
    });
    parentElement.setObject3D('mesh', root);

    const panel = new Panel({
        padding: 4,
        color: 'black',
        flexDirection: 'column',
        borderRadius: 10,
        ...panelOverrides,
    });
    root.add(panel);
    
    return { root, panel };
}

export function makeCheckbox(labelText: string, parentContainer: Container, cb: (checked: boolean) => void) {
    const container = new Container({ flexDirection: 'row' });
    parentContainer.add(container);

    const label = new Text({ text: labelText, fontSize: 5, color: horizonThemes.primary, marginRight: 2 });
    container.add(label);
    
    const checkbox = new Checkbox({
        pixelSize: PIXEL_SIZE * 0.6,
        onCheckedChange: (checked: boolean) => {
            cb(checked);
            timeoutComponent(checkbox);
        },
    });
    container.add(checkbox);
}

export function makeSlider(labelText: string, parentContainer: Container, cb: (value: number) => void, sliderOverrides?: InProperties<SliderOutProperties>) {
    const container = new Container({ flexDirection: 'column' });
    parentContainer.add(container);

    const label = new Text({ text: labelText, fontSize: 5, color: horizonThemes.primary });
    container.add(label);

    const slider = new Slider({
        size: 'sm',
        marginTop: 5,
        ...sliderOverrides,
        onValueChange: cb,
    });
    slider.labels.children.forEach((label) => {
        label.setProperties({ fontSize: 4 });
    });
    slider.touchTarget.setProperties({ height: 2 }); // Prevents massive vertical margin
    slider.track.setProperties({ height: 7 }); // Slider height
    slider.progress.setProperties({ minWidth: 1 }); // Allow slider to reach far left

    // Enable value to show on thumb (the part you touch)
    slider.thumbText.setProperties({ display: 'flex', fontSize: 4,
        backgroundColor: horizonThemes.primary, padding: 2, minWidth: 11, height: 10, borderRadius: 10 });
    slider.thumb.setProperties({ transformTranslateX: '25%' });

    container.add(slider);
}
