import { type Browser, type CDPSession, type Page,
  chromium, devices } from 'playwright';

export class StreamedBrowser {
  private browser: Browser;
  private page: Page;
  private cdpSession: CDPSession;
  private onScreencastFrame: Function

  constructor(onScreencastFrame: Function) {
    this.onScreencastFrame = onScreencastFrame;
  }
  
  async streamUrl(url: string, device: string) {
    if (!this.browser) {
      this.browser = await chromium.launch({headless: false});
    }
    await this.page?.close();

    const page = this.page = await this.browser.newPage({...devices[device]});
    await this.page.goto(url);
    const cdpSession = this.cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send('Page.startScreencast', { format: 'jpeg', quality: 80 });
    cdpSession.on('Page.screencastFrame', async ({ data, sessionId }) => {
      this.onScreencastFrame(data, sessionId);
      await this.cdpSession.send('Page.screencastFrameAck', { sessionId });
    });
  }
  
  async stopStream() {
    if (!this.browser) return;
    await this.cdpSession.detach()
    await this.page.close()
  }

  async stop() {
    await this.browser.close();
  }
}