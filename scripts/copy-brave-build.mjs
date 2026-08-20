import fs from 'node:fs/promises';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const chromeDirectory = path.join(rootDirectory, 'build', 'chrome-mv3');
const braveDirectory = path.join(rootDirectory, 'build', 'brave-mv3');

try {
  await fs.access(path.join(chromeDirectory, 'manifest.json'));
} catch {
  throw new Error('Chrome build is missing. Run npm run build before build:brave.');
}

await fs.rm(braveDirectory, { recursive: true, force: true });
await fs.cp(chromeDirectory, braveDirectory, { recursive: true });
console.log('Copied the Chromium MV3 build to build/brave-mv3.');
