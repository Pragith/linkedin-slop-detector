import fs from 'node:fs';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const targets = ['chrome', 'brave', 'edge', 'firefox'];

for (const target of targets) {
  const buildDirectory = path.join(rootDirectory, 'build', `${target}-mv3`);
  const manifestPath = path.join(buildDirectory, 'manifest.json');
  if (!fs.existsSync(manifestPath)) fail(`${target}: manifest.json is missing.`);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const referencedPaths = new Set([
    ...Object.values(manifest.icons || {}),
    manifest.action?.default_popup,
    manifest.options_ui?.page,
    manifest.background?.service_worker,
    ...(manifest.background?.scripts || []),
    ...(manifest.content_scripts || []).flatMap((entry) => [
      ...(entry.js || []),
      ...(entry.css || []),
    ]),
  ]);

  for (const relativePath of referencedPaths) {
    if (typeof relativePath !== 'string') continue;
    if (!fs.existsSync(path.join(buildDirectory, relativePath))) {
      fail(`${target}: manifest references missing file ${relativePath}.`);
    }
  }

  const permissions = [...(manifest.permissions || [])].sort();
  const hosts = [...(manifest.host_permissions || [])].sort();
  if (JSON.stringify(permissions) !== JSON.stringify(['storage'])) {
    fail(`${target}: unexpected permissions ${JSON.stringify(permissions)}.`);
  }
  if (JSON.stringify(hosts) !== JSON.stringify(['*://*.linkedin.com/*'])) {
    fail(`${target}: unexpected host permissions ${JSON.stringify(hosts)}.`);
  }
}

console.log('Build artifact validation passed for Chrome, Brave, Edge, and Firefox.');

function fail(message) {
  console.error(message);
  process.exit(1);
}
