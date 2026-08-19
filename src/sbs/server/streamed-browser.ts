import {
    type Browser, type Page, type CDPSession,
    chromium, devices,
} from 'playwright';
import {onPageLoad} from './preload.ts';
import {readFileSync} from 'node:fs';

// Load air datepicker manually, due to restrictions on addInitScript
const airDatepickerBundle = readFileSync('./node_modules/air-datepicker/air-datepicker.js', 'utf-8');
const airDatepickerCSS = readFileSync('./node_modules/air-datepicker/air-datepicker.css', 'utf-8');
const simpleKeyboardBundle = readFileSync('./node_modules/simple-keyboard/build/index.js', 'utf-8');
const simpleKeyboardCSS = readFileSync('./node_modules/simple-keyboard/build/css/index.css', 'utf-8');
const pickrBundle = readFileSync('./node_modules/@simonwep/pickr/dist/pickr.min.js', 'utf-8');
const pickrCSS = readFileSync('./node_modules/@simonwep/pickr/dist/themes/nano.min.css', 'utf-8');

const BrowserStates = Object.freeze({
    UNSTARTED: Symbol('unstarted'),
    STARTING: Symbol('starting'),
    STARTED: Symbol('started'),
    STOPPED: Symbol('stopped'),
    FAILED: Symbol('failed'),
});
type BrowserStates = typeof BrowserStates[keyof typeof BrowserStates]

const noop = () => {};
const STOP_RETRY_TIMEOUT = 1000;

class StreamedBrowser {
    private browser: Browser;
    private page: Page;
    private onScreencastFrame: Function;
    private onBrowserStarted: Function;
    private state: BrowserStates = BrowserStates.UNSTARTED;
    private abortController: AbortController;
    private cdpSession: CDPSession;

    /**
     * @param onScreencastFrame function called on each screencast frame; passes Base64-encoded
     * string of compressed frame image, and sessionId.
     * @param onBrowserStarted optional, called once the browser has started, passes browser instance.
     */
    constructor(onScreencastFrame: Function, onBrowserStarted: Function = noop) {
        this.onScreencastFrame = onScreencastFrame;
        this.onBrowserStarted = onBrowserStarted;
        this.abortController = new AbortController();
    }

    /**
     * Starts the browser (if not started, opens the URL, and starts streaming via Chrome CDP.
     */
    async streamUrl({targetUrl, deviceName}) {
        if (this.state !== BrowserStates.UNSTARTED) {
            console.warn(`Streamed browser requested to start when state is ${String(this.state)}`);
        }
        this.state = BrowserStates.STARTING;
        
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: true, // Must be headless for auto-scaling
                args: [
                    '--high-dpi-support=1',
                    '--use-gl=angle',
                    '--use-angle=gl', // or 'd3d11' on Windows for native D3D backend TODO
                    '--enable-gpu-rasterization',
                    '--ignore-gpu-blocklist',
                ],
            });
        }

        await this.setupPage(targetUrl, deviceName);
        if (!this.page) {
            console.error('Page setup failed.');
            this.state = BrowserStates.FAILED;
            this.stopStream();
            return;
        }
        await this.setupCDP();

        this.state = BrowserStates.STARTED;
        this.onBrowserStarted(this.browser);
    }

    private async setupPage(targetUrl: string, deviceName: string) {
        const device = devices[deviceName];
        if (!device) {
            console.error(`Invalid device name: ${deviceName}`);
            return;
        }

        const page = this.page = await this.browser.newPage({...device});

        page.on('console', (msg) => {
            console.log(`Browser console (${msg.type()}): ${msg.text()}`);
        });
        page.on('pageerror', (err) => {
            console.log(`Browser error: ${err}`);
        });

        // Preload air datepicker via
        await this.loadLibraryAsInitScript(airDatepickerBundle, airDatepickerCSS);
        await this.loadLibraryAsInitScript(simpleKeyboardBundle, simpleKeyboardCSS);
        await this.loadLibraryAsInitScript(pickrBundle, pickrCSS);
        await page.addInitScript(onPageLoad);

        try {
            await page.goto(targetUrl, {signal: this.abortController.signal});
        } catch (e) {
            if (e.name !== 'AbortError') console.error(e); // Ignore AbortError, as it's a feature to allow quickly shutting down the browser
        }
    }

    /**
     * Chrome DevTools Protocol (CDP) is used for screensharing and more.
     */
    private async setupCDP() {
        const {page} = this;
        const cdpSession = this.cdpSession = await page.context().newCDPSession(page);
        await cdpSession.send('Page.startScreencast', {format: 'jpeg', quality: 80});

        cdpSession.on('Page.screencastFrame', async ({data, sessionId}) => {
            this.onScreencastFrame(data, sessionId);
            try {
                await cdpSession.send('Page.screencastFrameAck', {sessionId});
            } catch (e) {
                // During frequent reloads, the browser context can be closed during frame event. Ignore this, throw otherwise.
                if (e.message !== 'cdpSession.send: Target page, context or browser has been closed') throw e;
            }
        });
    }

    async stopStream() {
        // If not running, nothing to stop
        if (this.state === BrowserStates.UNSTARTED || this.state === BrowserStates.STOPPED) {
            console.warn(`Browser stream ${String(this.state)}`);
            return;
        }

        // If the browser hasn't been started, wait until it starts before closing it
        if (this.state === BrowserStates.STARTING) {
            console.warn('Browser stream starting after requested stop; aborting.');
            this.abortController.abort('Stopping');
            setTimeout(() => this.stopStream(), STOP_RETRY_TIMEOUT);
            return;
        }

        console.log('Closing stream...');
        if (this.page && !this.page.isClosed()) await this.page?.close();
        if (this.browser.isConnected()) await this.browser.close();
    }

    async click({x, y}) {
        await this.page?.mouse.click(x, y);
    }

    /**
     * Dispatches an arbitrary touch event with arbitrary points via CDP.
     * @param eventType the touch event (e.g., touchStart, touchMove, touchEnd)
     * @param touchPoints the touch points to pass, in the form of a list: [ {x, y, id}, {...} ]
     */
    async dispatchTouchEvent({eventType, touchPoints}) {
        try {
            await this.cdpSession?.send('Input.dispatchTouchEvent', {
                type: eventType,
                touchPoints,
            });
        } catch (e) {
            console.warn(e);
        }
    }

    async loadLibraryAsInitScript(jsBundle: string, css: string) {
        await this.page.addInitScript({
            content: `
        document.addEventListener("DOMContentLoaded", () => {        
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(css)};
          document.head.appendChild(style);
        });
        ${jsBundle}
      `,
        });
    }

    async pageForward() {
        const {signal} = this.abortController;
        const {page} = this;
        if (!page || page.isClosed()) return;
        await page.goForward({signal});
    }

    async pageBack() {
        const {signal} = this.abortController;
        const {page} = this;
        if (!page || page.isClosed()) return;
        await page.goBack({signal});
    }
}

export default StreamedBrowser;