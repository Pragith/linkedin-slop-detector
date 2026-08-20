import {
  StoredStateV1,
  ExtensionSettings,
  RuleOverride,
  SlopRule,
  StorageExportData,
} from '../core/types';
import { browser } from 'wxt/browser';
import { INITIAL_STORED_STATE, DEFAULT_SETTINGS } from './defaultSettings';
import { migrateState, CURRENT_SCHEMA_VERSION, sanitizeSettings } from './migrations';
import { MAX_CUSTOM_RULES, validateRule } from '../rules/ruleValidation';
import { DEFAULT_RULES } from '../rules/defaultRules';

const STORAGE_KEY = 'linkedin_slop_detector_state';
export const MAX_IMPORT_BYTES = 1_000_000;
const builtinRulesById = new Map(DEFAULT_RULES.map((rule) => [rule.id, rule]));

export class SettingsRepository {
  private static instance: SettingsRepository | null = null;
  private cachedState: StoredStateV1 | null = null;

  static getInstance(): SettingsRepository {
    if (!SettingsRepository.instance) {
      SettingsRepository.instance = new SettingsRepository();
    }
    return SettingsRepository.instance;
  }

  /**
   * Loads persisted state, running migrations if necessary.
   */
  async loadState(): Promise<StoredStateV1> {
    try {
      const data = await browser.storage.local.get(STORAGE_KEY);
      const raw = data[STORAGE_KEY];
      const migrated = migrateState(raw);
      this.cachedState = structuredClone(migrated);
      if (raw === undefined || JSON.stringify(raw) !== JSON.stringify(migrated)) {
        await browser.storage.local.set({ [STORAGE_KEY]: migrated });
      }
      return structuredClone(migrated);
    } catch (err) {
      console.error('[SlopDetector] Failed to load storage state:', err);
      const fallback = { ...INITIAL_STORED_STATE, lastUpdated: new Date().toISOString() };
      this.cachedState = structuredClone(fallback);
      return structuredClone(fallback);
    }
  }

  /**
   * Returns cached state if available, or loads from disk.
   */
  async getState(): Promise<StoredStateV1> {
    if (this.cachedState) {
      return structuredClone(this.cachedState);
    }
    return this.loadState();
  }

  /**
   * Persists entire state to chrome.storage.local.
   */
  async saveState(state: StoredStateV1): Promise<void> {
    const validated = migrateState(state);
    validated.lastUpdated = new Date().toISOString();
    this.cachedState = structuredClone(validated);
    await browser.storage.local.set({ [STORAGE_KEY]: validated });
  }

  /**
   * Updates partial settings.
   */
  async updateSettings(partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const state = await this.getState();
    const updatedSettings = sanitizeSettings({
      ...state.settings,
      ...partial,
      postActions: {
        ...state.settings.postActions,
        ...(partial.postActions || {}),
      },
    });

    state.settings = updatedSettings;
    await this.saveState(state);
    return updatedSettings;
  }

  /**
   * Saves a rule override (built-in rule customisation or tombstone).
   */
  async saveRuleOverride(override: RuleOverride): Promise<void> {
    const builtin = builtinRulesById.get(override.id);
    if (!builtin) {
      throw new Error(`Cannot override unknown built-in rule: ${override.id}`);
    }

    const state = await this.getState();
    const candidate: RuleOverride = {
      ...state.ruleOverrides[override.id],
      ...override,
      updatedAt: new Date().toISOString(),
    };
    const effective = {
      ...builtin,
      ...(candidate.name !== undefined ? { name: candidate.name } : {}),
      ...(candidate.description !== undefined
        ? { description: candidate.description }
        : {}),
      ...(candidate.category !== undefined ? { category: candidate.category } : {}),
      ...(candidate.pattern !== undefined ? { pattern: candidate.pattern } : {}),
      ...(candidate.flags !== undefined ? { flags: candidate.flags } : {}),
      ...(candidate.severity !== undefined ? { severity: candidate.severity } : {}),
      ...(candidate.weight !== undefined ? { weight: candidate.weight } : {}),
      ...(candidate.isDensityRule !== undefined
        ? { isDensityRule: candidate.isDensityRule }
        : {}),
      ...(candidate.densityThreshold !== undefined
        ? { densityThreshold: candidate.densityThreshold }
        : {}),
    };
    const validation = validateRule(effective);
    if (!validation.valid) {
      throw new Error(`Rule override validation failed: ${validation.errors.join(', ')}`);
    }

    state.ruleOverrides[override.id] = candidate;
    await this.saveState(state);
  }

  /**
   * Removes an override for a built-in rule, restoring its original shipped default.
   */
  async restoreBuiltinRule(ruleId: string): Promise<void> {
    const state = await this.getState();
    delete state.ruleOverrides[ruleId];
    await this.saveState(state);
  }

  /**
   * Creates or updates a custom rule.
   */
  async saveCustomRule(rule: SlopRule): Promise<void> {
    const validation = validateRule(rule);
    if (!validation.valid) {
      throw new Error(`Rule validation failed: ${validation.errors.join(', ')}`);
    }

    const state = await this.getState();
    const now = new Date().toISOString();
    const existingIndex = state.customRules.findIndex((r) => r.id === rule.id);

    if (builtinRulesById.has(rule.id)) {
      throw new Error('Custom rule IDs must not duplicate built-in rule IDs.');
    }
    if (existingIndex < 0 && state.customRules.length >= MAX_CUSTOM_RULES) {
      throw new Error(`Custom rule limit reached (${MAX_CUSTOM_RULES}).`);
    }

    const fullRule: SlopRule = {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      pattern: rule.pattern,
      flags: rule.flags,
      examples: [...rule.examples],
      ...(rule.counterExamples ? { counterExamples: [...rule.counterExamples] } : {}),
      severity: rule.severity,
      weight: rule.weight,
      enabledByDefault: rule.enabledByDefault,
      source: 'custom',
      ...(rule.isDensityRule ? { isDensityRule: true } : {}),
      ...(rule.isDensityRule && rule.densityThreshold !== undefined
        ? { densityThreshold: rule.densityThreshold }
        : {}),
      createdAt: existingIndex >= 0 ? state.customRules[existingIndex]?.createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      state.customRules[existingIndex] = fullRule;
    } else {
      state.customRules.push(fullRule);
    }

    await this.saveState(state);
  }

  /**
   * Deletes a custom rule permanently.
   */
  async deleteCustomRule(ruleId: string): Promise<void> {
    const state = await this.getState();
    state.customRules = state.customRules.filter((r) => r.id !== ruleId);
    delete state.ruleOverrides[ruleId];
    await this.saveState(state);
  }

  /**
   * Resets all settings to default, preserving custom rules & overrides.
   */
  async resetSettings(): Promise<void> {
    const state = await this.getState();
    state.settings = structuredClone(DEFAULT_SETTINGS);
    await this.saveState(state);
  }

  /**
   * Resets all rules (clears overrides and custom rules).
   */
  async resetRules(): Promise<void> {
    const state = await this.getState();
    state.ruleOverrides = {};
    state.customRules = [];
    await this.saveState(state);
  }

  /** Restores built-in defaults without deleting custom rules. */
  async resetBuiltinRules(): Promise<void> {
    const state = await this.getState();
    state.ruleOverrides = {};
    await this.saveState(state);
  }

  /** Enables or disables every effective rule in one atomic storage write. */
  async setAllRulesEnabled(enabled: boolean): Promise<void> {
    const state = await this.getState();
    const updatedAt = new Date().toISOString();

    for (const builtin of DEFAULT_RULES) {
      state.ruleOverrides[builtin.id] = {
        ...state.ruleOverrides[builtin.id],
        id: builtin.id,
        enabled,
        deletedTombstone: false,
        updatedAt,
      };
    }
    state.customRules = state.customRules.map((rule) => ({
      ...rule,
      enabledByDefault: enabled,
      updatedAt,
    }));
    await this.saveState(state);
  }

  /**
   * Resets everything back to factory initial state.
   */
  async resetAll(): Promise<void> {
    await this.saveState({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: structuredClone(DEFAULT_SETTINGS),
      ruleOverrides: {},
      customRules: [],
      lastUpdated: new Date().toISOString(),
    });
  }

  /**
   * Exports full state as a JSON string with metadata.
   */
  async exportData(): Promise<string> {
    const state = await this.getState();
    const exportPayload: StorageExportData = {
      schemaVersion: 1,
      settings: state.settings,
      ruleOverrides: state.ruleOverrides,
      customRules: state.customRules,
      lastUpdated: new Date().toISOString(),
    };
    return JSON.stringify(exportPayload, null, 2);
  }

  /**
   * Imports settings and rules from JSON, validating contents.
   */
  async importData(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      if (new TextEncoder().encode(jsonString).byteLength > MAX_IMPORT_BYTES) {
        return {
          success: false,
          message: 'Import is too large. Maximum size is 1 MB.',
        };
      }
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return {
          success: false,
          message: 'Invalid JSON format: root must be an object.',
        };
      }

      // Check schema version
      if (typeof parsed.schemaVersion !== 'number') {
        return { success: false, message: 'Invalid format: missing schemaVersion.' };
      }
      if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
        return {
          success: false,
          message: `Unsupported schema version ${parsed.schemaVersion}. This extension supports version ${CURRENT_SCHEMA_VERSION}.`,
        };
      }

      if (!Array.isArray(parsed.customRules)) {
        return {
          success: false,
          message: 'Invalid format: customRules must be an array.',
        };
      }
      if (parsed.customRules.length > MAX_CUSTOM_RULES) {
        return {
          success: false,
          message: `Import contains more than ${MAX_CUSTOM_RULES} custom rules.`,
        };
      }

      // Validate custom rules if present
      if (Array.isArray(parsed.customRules)) {
        const ids = new Set(DEFAULT_RULES.map((rule) => rule.id));
        for (const rule of parsed.customRules) {
          const res = validateRule(rule);
          if (!res.valid) {
            return {
              success: false,
              message: `Invalid custom rule "${rule.name || rule.id}": ${res.errors.join('; ')}`,
            };
          }
          if (ids.has(rule.id)) {
            return {
              success: false,
              message: `Duplicate or reserved rule ID: ${String(rule.id)}`,
            };
          }
          ids.add(rule.id);
        }
      }

      const migrated = migrateState(parsed);
      await this.saveState(migrated);
      return { success: true, message: 'Settings and rules successfully imported.' };
    } catch (err) {
      return {
        success: false,
        message: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Subscribes to storage changes across all tabs.
   */
  onChanged(callback: (newState: StoredStateV1) => void): () => void {
    const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
      changes,
      area,
    ) => {
      if (area === 'local' && changes[STORAGE_KEY]?.newValue) {
        const newState = migrateState(changes[STORAGE_KEY].newValue);
        this.cachedState = structuredClone(newState);
        callback(structuredClone(newState));
      }
    };

    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }
}
