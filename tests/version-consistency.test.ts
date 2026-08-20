import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Version Consistency Validation', () => {
  it('keeps version in package.json and release-please in sync', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'),
    );
    const version = pkg.version;

    expect(version).toMatch(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/);

    const relManifestPath = path.resolve(__dirname, '../.release-please-manifest.json');
    if (fs.existsSync(relManifestPath)) {
      const relManifest = JSON.parse(fs.readFileSync(relManifestPath, 'utf8'));
      expect(relManifest['.']).toBe(version);
    }
  });
});
