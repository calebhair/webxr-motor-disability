import {chromium, devices} from 'playwright';
import { WebSocketServer } from 'ws';
import * as fs from "node:fs";
import * as https from "node:https";


const server = https.createServer({
  cert: fs.readFileSync('./localhost+1.pem'),
  key: fs.readFileSync('./localhost+1-key.pem'),
}, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8080);
const wss = new WebSocketServer({ server });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ ...devices['Pixel 5'] });
  await page.goto('https://calebhair.github.io');

  console.log(`WebSocket server is running on ${wss.address()}`);
  wss.on('connection', async (ws) => {
    console.log('New client connected');

    const client = await page.context().newCDPSession(page);
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 80 });
    client.on('Page.screencastFrame', async ({ data, sessionId }) => {
      const buf = Buffer.from(data, 'base64');
      ws.send(buf, { binary: true });
      await client.send('Page.screencastFrameAck', { sessionId });
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  await page.waitForTimeout(600000);

  await page.screencast.stop();
  await browser.close();
})();