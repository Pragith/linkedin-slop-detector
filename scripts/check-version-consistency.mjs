import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, '..');
const packageJson = readJson(path.join(rootDirectory, 'package.json'));
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`package.json contains an invalid SemVer version: ${String(version)}`);
}

const packageLock = readJson(path.join(rootDirectory, 'package-lock.json'));
checkEqual('package-lock.json root version', packageLock.version, version);
checkEqual(
  'package-lock.json package version',
  packageLock.packages?.['']?.version,
  version,
);

const releaseManifestPath = path.join(rootDirectory, '.release-please-manifest.json');
if (fs.existsSync(releaseManifestPath)) {
  const releaseManifest = readJson(releaseManifestPath);
  checkEqual('release-please manifest version', releaseManifest['.'], version);
}

const releaseTag = process.env.RELEASE_TAG;
if (releaseTag) checkEqual('release tag', releaseTag.replace(/^v/, ''), version);

for (const browserName of ['chrome', 'brave', 'edge', 'firefox']) {
  const manifestPath = path.join(
    rootDirectory,
    'build',
    `${browserName}-mv3`,
    'manifest.json',
  );
  if (!fs.existsSync(manifestPath)) continue;
  checkEqual(`${browserName} manifest version`, readJson(manifestPath).version, version);
}

console.log(`Version consistency check passed: v${version}`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function checkEqual(label, actual, expected) {
  if (actual !== expected) fail(`${label} is ${String(actual)}; expected ${expected}.`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
