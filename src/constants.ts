export const SBS_PORT = 3000;
export const SBS_HOST = `https://143.117.93.180:${SBS_PORT}`;

export const CLIENT_PORT = 5173;
export const CLIENT_HOST = `https://143.117.93.180:${CLIENT_PORT}`;

export const CERT_PATH = './localhost+1.pem';
export const KEY_PATH = './localhost+1-key.pem';

export const CUSTOM_EVENTS = Object.freeze({
    CONFIGURE_TREMOR: 'configureTremor',
    XR_ENTERED: 'xrEntered',
    
    BROWSER_CLICK: 'browserClick',
    BROWSER_DISPATCH_TOUCH_EVENT: 'browserDispatchTouchEvent',
    BROWSER_FORWARD: 'browserForward',
    BROWSER_BACK: 'browserBack',
});

export const ELEMENT_IDS = Object.freeze({
    BROWSER_DEVICE: 'browser-device',
    SCREEN: 'screen',
    STREAMED_BROWSER_CANVAS: 'streamed-browser-canvas',
    ENVIRONMENT: 'environment',
});