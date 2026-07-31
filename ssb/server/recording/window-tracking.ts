import {windowManager} from "node-window-manager";
import type {Browser} from "playwright";

export function onBrowserStarted(browser: Browser) {
    browser.contexts()[0].pages()[0].title()
        .then(findWindow)
        .catch(console.error)
        .then(console.log);
}

function findWindow(title: string) {
    console.log(title)
    return windowManager.getWindows().find(window => window.getTitle() === title);
}

console.log(windowManager.getWindows().forEach(win => win.getTitle()))