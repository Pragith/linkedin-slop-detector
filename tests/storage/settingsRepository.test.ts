import { describe, it, expect, beforeEach } from 'vitest';
import { browser } from 'wxt/browser';
import { SettingsRepository } from '../../src/storage/settingsRepository';
import { DEFAULT_SETTINGS } from '../../src/storage/defaultSettings';
import { SlopRule } from '../../src/core/types';

describe('SettingsRepository & Storage Persistence', () => {
  let repo: SettingsRepository;

  beforeEach(async () => {
    repo = new SettingsRepository();
    await browser.storage.local.clear();
  });

  it('loads default initial state on fresh install', async () => {
    const state = await repo.loadState();
    expect(state.schemaVersion).toBe(1);
    expect(state.settings.enabled).toBe(true);
    expect(state.settings.scoreThreshold).toBe(DEFAULT_SETTINGS.scoreThreshold);
    expect(state.customRules).toEqual([]);
    expect(state.ruleOverrides).toEqual({});
  });

  it('updates partial settings and preserves other options', async () => {
    await repo.updateSettings({ scoreThreshold: 8, enabled: false });
    const state = await repo.getState();

    expect(state.settings.scoreThreshold).toBe(8);
    expect(state.settings.enabled).toBe(false);
    expect(state.settings.minMatches).toBe(DEFAULT_SETTINGS.minMatches);
  });

  it('saves and deletes custom rules', async () => {
    const customRule: SlopRule = {
      id: 'custom-1',
      name: 'Custom Rule 1',
      description: 'A custom test rule',
      category: 'contrast',
      pattern: '\\bfoo\\s+bar\\b',
      flags: 'i',
      examples: ['foo bar'],
      severity: 3,
      weight: 3,
      enabledByDefault: true,
      source: 'custom',
    };

    await repo.saveCustomRule(customRule);
    let state = await repo.getState();
    expect(state.customRules.length).toBe(1);
    expect(state.customRules[0]?.id).toBe('custom-1');

    await repo.deleteCustomRule('custom-1');
    state = await repo.getState();
    expect(state.customRules.length).toBe(0);
  });

  it('exports and imports configuration safely', async () => {
    await repo.updateSettings({ scoreThreshold: 7 });
    await repo.saveRuleOverride({ id: 'contrast-not-just', weight: 8 });

    const jsonStr = await repo.exportData();
    expect(jsonStr).toContain('"scoreThreshold": 7');
    expect(jsonStr).toContain('"contrast-not-just"');

    // Reset all
    await repo.resetAll();
    let state = await repo.getState();
    expect(state.settings.scoreThreshold).toBe(DEFAULT_SETTINGS.scoreThreshold);

    // Import exported JSON
    const res = await repo.importData(jsonStr);
    expect(res.success).toBe(true);

    state = await repo.getState();
    expect(state.settings.scoreThreshold).toBe(7);
    expect(state.ruleOverrides['contrast-not-just']?.weight).toBe(8);
  });

  it('rejects invalid JSON during import', async () => {
    const res = await repo.importData('invalid-json-string');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Import failed');
  });

  it('repairs corrupt persisted settings instead of trusting their runtime types', async () => {
    await browser.storage.local.set({
      linkedin_slop_detector_state: {
        schemaVersion: 1,
        settings: {
          enabled: 'yes',
          scoreThreshold: Number.POSITIVE_INFINITY,
          highlightColor: 'javascript:alert(1)',
          postActions: { hide: 'true' },
        },
        customRules: 'not-an-array',
        ruleOverrides: { __proto__: { weight: 99 } },
      },
    });

    const state = await repo.loadState();
    expect(state.settings.enabled).toBe(DEFAULT_SETTINGS.enabled);
    expect(state.settings.scoreThreshold).toBe(DEFAULT_SETTINGS.scoreThreshold);
    expect(state.settings.highlightColor).toBe(DEFAULT_SETTINGS.highlightColor);
    expect(state.settings.postActions.hide).toBe(DEFAULT_SETTINGS.postActions.hide);
    expect(state.customRules).toEqual([]);
    expect(state.ruleOverrides).toEqual({});
  });

  it('rejects future schemas and custom rules that reuse built-in IDs', async () => {
    const future = await repo.importData(
      JSON.stringify({ schemaVersion: 99, customRules: [], settings: {} }),
    );
    expect(future.success).toBe(false);
    expect(future.message).toContain('Unsupported schema version');

    const reservedRule: SlopRule = {
      id: 'contrast-not-just',
      name: 'Collision',
      description: 'Attempts to replace a built-in.',
      category: 'contrast',
      pattern: '\\bcollision\\b',
      flags: 'i',
      examples: ['collision'],
      severity: 3,
      weight: 3,
      enabledByDefault: true,
      source: 'custom',
    };
    const collision = await repo.importData(
      JSON.stringify({
        schemaVersion: 1,
        settings: DEFAULT_SETTINGS,
        ruleOverrides: {},
        customRules: [reservedRule],
      }),
    );
    expect(collision.success).toBe(false);
    expect(collision.message).toContain('Duplicate or reserved rule ID');
  });
});
