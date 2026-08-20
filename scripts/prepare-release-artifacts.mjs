import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const outputDirectory = path.join(rootDirectory, 'build');
const releaseDirectory = path.join(outputDirectory, 'release');
const packageJson = JSON.parse(
  await fs.readFile(path.join(rootDirectory, 'package.json'), 'utf8'),
);
const packageName = packageJson.name;
const version = packageJson.version;

const sourceArchives = {
  chrome: `${packageName}-${version}-chrome.zip`,
  edge: `${packageName}-${version}-edge.zip`,
  firefox: `${packageName}-${version}-firefox.zip`,
};

await fs.rm(releaseDirectory, { recursive: true, force: true });
await fs.mkdir(releaseDirectory, { recursive: true });

const releaseArchives = [
  ['chrome', sourceArchives.chrome],
  ['brave', sourceArchives.chrome],
  ['edge', sourceArchives.edge],
  ['firefox', sourceArchives.firefox],
];

for (const [browserName, sourceName] of releaseArchives) {
  const sourcePath = path.join(outputDirectory, sourceName);
  const releaseName = `${packageName}-${browserName}-v${version}.zip`;
  await fs.copyFile(sourcePath, path.join(releaseDirectory, releaseName));
}

const archiveNames = (await fs.readdir(releaseDirectory))
  .filter((name) => name.endsWith('.zip'))
  .sort();
const checksumLines = [];
for (const archiveName of archiveNames) {
  const contents = await fs.readFile(path.join(releaseDirectory, archiveName));
  const checksum = crypto.createHash('sha256').update(contents).digest('hex');
  checksumLines.push(`${checksum}  ${archiveName}`);
}

await fs.writeFile(
  path.join(releaseDirectory, 'SHA256SUMS.txt'),
  `${checksumLines.join('\n')}\n`,
  'utf8',
);
console.log(`Prepared ${archiveNames.length} release archives in build/release.`);
