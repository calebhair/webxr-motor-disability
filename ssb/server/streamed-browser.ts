import { type Browser, type CDPSession, type Page,
  chromium, devices } from 'playwright';

const STOP_RETRY_TIMEOUT = 1000;

const BrowserStates = Object.freeze({
  UNSTARTED: Symbol("unstarted"),
  STARTING:  Symbol("starting"),
  STARTED:   Symbol("started"),
  STOPPED:   Symbol("stopped"),
});
type BrowserStates = typeof BrowserStates[keyof typeof BrowserStates]

let count = 0;

export class StreamedBrowser {
  private browser: Browser;
  private page: Page;
  private cdpSession: CDPSession;
  private onScreencastFrame: Function
  private state: BrowserStates = BrowserStates.UNSTARTED;
  private abortController: AbortController;

  constructor(onScreencastFrame: Function) {
    this.onScreencastFrame = onScreencastFrame;
    this.abortController = new AbortController();
  }
  
  async streamUrl(url: string, device: string) {
    if (this.state !== BrowserStates.UNSTARTED) {
      console.warn(`Streamed browser requested to start when state is ${String(this.state)}`);
    }
    this.state = BrowserStates.STARTING;

    if (!this.browser) {
      this.browser = await chromium.launch({headless: false});
    }

    const page = this.page = await this.browser.newPage({...devices[device]});
    
    // Setup CDP session for streaming frames
    const cdpSession = this.cdpSession = await page.context().newCDPSession(page);
    try {
      await page.goto(url, { signal: this.abortController.signal });
    } catch (e) {
      if (e.name !== 'AbortError') throw e; // Ignore AbortError
    }
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

    this.state = BrowserStates.STARTED;
  }
  
  async stopStream() {
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
    await this.page.mouse.click(x, y);
  }
}