import { devices } from 'playwright';
import fs from 'fs';

fs.writeFileSync(
    './playwright-devices.json',
    JSON.stringify(devices, null, 2),
);