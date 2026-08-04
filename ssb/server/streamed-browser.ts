import {
  type Browser, type Page, type CDPSession,
  chromium
} from 'playwright';
import { onPageLoad } from "./preload.ts";
import {readFileSync} from "node:fs";

// Load air datepicker manually, due to restrictions on addInitScript
const airDatepickerBundle = readFileSync('./node_modules/air-datepicker/air-datepicker.js', 'utf-8');
const airDatepickerCSS = readFileSync('./node_modules/air-datepicker/air-datepicker.css', 'utf-8');

const BrowserStates = Object.freeze({
  UNSTARTED: Symbol("unstarted"),
  STARTING:  Symbol("starting"),
  STARTED:   Symbol("started"),
  STOPPED:   Symbol("stopped"),
});
type BrowserStates = typeof BrowserStates[keyof typeof BrowserStates]

const noop = () => {};
const STOP_RETRY_TIMEOUT = 1000;

class StreamedBrowser {
  private browser: Browser;
  private page: Page;
  private onScreencastFrame: Function
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
   * @param targetUrl the URL to load
   * @param width the browser width in pixels, as a string or number
   * @param height the browser height in pixels
   * @param isMobile 'Whether the meta viewport tag is taken into account and touch events are enabled' - https://playwright.dev/docs/emulation#ismobile
   */
  async streamUrl({ targetUrl, width, height, isMobile}) {
    if (this.state !== BrowserStates.UNSTARTED) {
      console.warn(`Streamed browser requested to start when state is ${String(this.state)}`);
    }
    this.state = BrowserStates.STARTING;

    width = parseInt(width);
    height = parseInt(height);
    isMobile = isMobile === 'true';

    if (!this.browser) {
      this.browser = await chromium.launch({headless: false});
    }

    await this.setupPage(targetUrl, width, height, isMobile);
    await this.setupCDP();

    this.state = BrowserStates.STARTED;
    this.onBrowserStarted(this.browser);
  }

  private async setupPage(targetUrl: string, width: number, height: number, isMobile: boolean) {
    const page = this.page = await this.browser.newPage({
      viewport: { width, height },
      isMobile,
      hasTouch: true,
    });
  
    // If a page is opened in a new tab, go to it
    page.on('popup', async popup => {
      await popup.waitForLoadState('domcontentloaded');
      await page.goto(popup.url(), { signal: this.abortController.signal });
      await popup.close();
    });
  
    // Preload air datepicker via 
    await page.addInitScript({
      content: `
        ${airDatepickerBundle}
        document.addEventListener("DOMContentLoaded", () => {        
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(airDatepickerCSS)};
          document.head.appendChild(style);
        });
      `
    });
    await page.addInitScript(onPageLoad);
    
    try {
      await page.goto(targetUrl, { signal: this.abortController.signal });
    } catch (e) {
      if (e.name !== 'AbortError') throw e; // Ignore AbortError
    }
    
    return page;
  }

  /**
   * Chrome DevTools Protocol (CDP) is used for screensharing and more.
   */
  private async setupCDP() {
    const { page } = this;
    const cdpSession = this.cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send('Page.startScreencast', { format: 'jpeg', quality: 80 });

    cdpSession.on('Page.screencastFrame', async ({ data, sessionId }) => {
      this.onScreencastFrame(data, sessionId);
      try {
        await cdpSession.send('Page.screencastFrameAck', { sessionId });
      } catch (e) {
        // During frequent reloads, the browser context can be closed during frame event. Ignore this, throw otherwise.
        if (e.message !== 'cdpSession.send: Target page, context or browser has been closed') throw e
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
    if (!this.page.isClosed()) await this.page?.close()
    if (this.browser.isConnected()) await this.browser.close()
  }
  
  async click({ x, y }) {
    await this.page?.mouse.click(x, y);
  }

  /**
   * Dispatches an arbitrary touch event with arbitrary points via CDP.
   * @param eventType the touch event (e.g., touchStart, touchMove, touchEnd)
   * @param touchPoints the touch points to pass, in the form of a list: [ {x, y, id}, {...} ]
   */
  async dispatchTouchEvent({ eventType, touchPoints }) {
    await this.cdpSession?.send('Input.dispatchTouchEvent', {
      type: eventType,
      touchPoints,
    });
  }
}

export default StreamedBrowser