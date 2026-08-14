import {Button, ButtonLabel, Panel} from '@pmndrs/uikit-horizon';
import {Container, Text} from '@pmndrs/uikit';

export function btn(text, container: Container, cb: Function = undefined, btnOverrides: object = {}) {
    const btn = new Button({
        minHeight: 0, minWidth: 0, height: 20,
        margin: 2, padding: 4,
        ...btnOverrides,
    });
    container.add(btn);

    const btnLabel = new ButtonLabel({ margin: 0, padding: 0, minWidth: 0, minHeight: 0 });
    btn.add(btnLabel);
    const btnText = new Text({ text, fontSize: 4 });
    btnLabel.add(btnText);

    if (cb) btn.addEventListener('pointerdown', cb);

    return btn;
}

export function rootPanel(element: HTMLElement, panelOverrides: object = {}) {
    const root = new Container({
        pixelSize: 0.005,
    });
    element.setObject3D('mesh', root);

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
