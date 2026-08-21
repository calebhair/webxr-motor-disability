import {userConfig} from '../webxr-motor-disability-config.ts';

export const SBS_PORT = 3000;
export const SBS_HOST = `https://${userConfig.HOST_IP}:${SBS_PORT}`;

export const CLIENT_PORT = 5173;
export const CLIENT_HOST = `https://${userConfig.HOST_IP}:${CLIENT_PORT}`;

export const CERT_PATH = userConfig.CERT_PATH;
export const KEY_PATH = userConfig.KEY_PATH;

export const USE_DIRECTX = userConfig.USE_DIRECTX;

export const CUSTOM_EVENTS = Object.freeze({
    CONFIGURE_TREMOR: 'configureTremor',
    
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