import {
  ExtensionSettings,
  PostActionSettings,
  RuleOverride,
  SlopRule,
  StoredStateV1,
} from '../core/types';
import { DEFAULT_RULES } from '../rules/defaultRules';
import {
  MAX_CUSTOM_RULES,
  sanitizeRegexFlags,
  validateRule,
} from '../rules/ruleValidation';
import { DEFAULT_SETTINGS } from './defaultSettings';

export const CURRENT_SCHEMA_VERSION = 1;

const builtinRulesById = new Map(DEFAULT_RULES.map((rule) => [rule.id, rule]));
const forbiddenObjectKeys = new Set(['__proto__', 'constructor', 'prototype']);

export function migrateState(rawState: unknown): StoredStateV1 {
  const candidate = isRecord(rawState) ? rawState : {};
  const version = finiteInteger(candidate['schemaVersion'], 0);

  if (version > CURRENT_SCHEMA_VERSION) {
    return createInitialState();
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: sanitizeSettings(candidate['settings']),
    ruleOverrides: sanitizeRuleOverrides(candidate['ruleOverrides']),
    customRules: sanitizeCustomRules(candidate['customRules']),
    lastUpdated:
      typeof candidate['lastUpdated'] === 'string'
        ? candidate['lastUpdated']
        : new Date().toISOString(),
  };
}

export function sanitizeSettings(value: unknown): ExtensionSettings {
  const input = isRecord(value) ? value : {};
  const actionsInput = isRecord(input['postActions']) ? input['postActions'] : {};

  const postActions: PostActionSettings = {
    outline: booleanValue(actionsInput['outline'], DEFAULT_SETTINGS.postActions.outline),
    highlight: booleanValue(
      actionsInput['highlight'],
      DEFAULT_SETTINGS.postActions.highlight,
    ),
    showBadge: booleanValue(
      actionsInput['showBadge'],
      DEFAULT_SETTINGS.postActions.showBadge,
    ),
    showScore: booleanValue(
      actionsInput['showScore'],
      DEFAULT_SETTINGS.postActions.showScore,
    ),
    showMatchCount: booleanValue(
      actionsInput['showMatchCount'],
      DEFAULT_SETTINGS.postActions.showMatchCount,
    ),
    dim: booleanValue(actionsInput['dim'], DEFAULT_SETTINGS.postActions.dim),
    collapse: booleanValue(
      actionsInput['collapse'],
      DEFAULT_SETTINGS.postActions.collapse,
    ),
    hide: booleanValue(actionsInput['hide'], DEFAULT_SETTINGS.postActions.hide),
  };

  const badgePosition = input['badgePosition'];

  return {
    enabled: booleanValue(input['enabled'], DEFAULT_SETTINGS.enabled),
    enableOnHomeFeed: booleanValue(
      input['enableOnHomeFeed'],
      DEFAULT_SETTINGS.enableOnHomeFeed,
    ),
    enableOnPostPages: booleanValue(
      input['enableOnPostPages'],
      DEFAULT_SETTINGS.enableOnPostPages,
    ),
    scoreThreshold: boundedNumber(
      input['scoreThreshold'],
      DEFAULT_SETTINGS.scoreThreshold,
      0,
      100,
    ),
    minMatches: boundedInteger(input['minMatches'], DEFAULT_SETTINGS.minMatches, 1, 100),
    minDistinctFamilies: boundedInteger(
      input['minDistinctFamilies'],
      DEFAULT_SETTINGS.minDistinctFamilies,
      1,
      18,
    ),
    categoryDiversityBonusThreshold: boundedInteger(
      input['categoryDiversityBonusThreshold'],
      DEFAULT_SETTINGS.categoryDiversityBonusThreshold,
      2,
      18,
    ),
    categoryDiversityBonusPoints: boundedNumber(
      input['categoryDiversityBonusPoints'],
      DEFAULT_SETTINGS.categoryDiversityBonusPoints,
      0,
      100,
    ),
    densityScoringEnabled: booleanValue(
      input['densityScoringEnabled'],
      DEFAULT_SETTINGS.densityScoringEnabled,
    ),
    defaultCaseSensitive: booleanValue(
      input['defaultCaseSensitive'],
      DEFAULT_SETTINGS.defaultCaseSensitive,
    ),
    postActions,
    badgePosition:
      badgePosition === 'top-left' ||
      badgePosition === 'top-right' ||
      badgePosition === 'header'
        ? badgePosition
        : DEFAULT_SETTINGS.badgePosition,
    highlightColor: colorValue(input['highlightColor'], DEFAULT_SETTINGS.highlightColor),
    outlineColor: colorValue(input['outlineColor'], DEFAULT_SETTINGS.outlineColor),
  };
}

function sanitizeRuleOverrides(value: unknown): Record<string, RuleOverride> {
  if (!isRecord(value)) return {};

  const result: Record<string, RuleOverride> = {};
  for (const [id, rawOverride] of Object.entries(value)) {
    if (forbiddenObjectKeys.has(id) || !isRecord(rawOverride)) continue;
    const builtin = builtinRulesById.get(id);
    if (!builtin) continue;

    const override = sanitizeRuleOverride(id, rawOverride);
    const effectiveRule: SlopRule = {
      ...builtin,
      ...(override.name !== undefined ? { name: override.name } : {}),
      ...(override.description !== undefined
        ? { description: override.description }
        : {}),
      ...(override.category !== undefined ? { category: override.category } : {}),
      ...(override.pattern !== undefined ? { pattern: override.pattern } : {}),
      ...(override.flags !== undefined ? { flags: override.flags } : {}),
      ...(override.severity !== undefined ? { severity: override.severity } : {}),
      ...(override.weight !== undefined ? { weight: override.weight } : {}),
      ...(override.isDensityRule !== undefined
        ? { isDensityRule: override.isDensityRule }
        : {}),
      ...(override.densityThreshold !== undefined
        ? { densityThreshold: override.densityThreshold }
        : {}),
    };

    if (validateRule(effectiveRule).valid) result[id] = override;
  }
  return result;
}

function sanitizeRuleOverride(id: string, value: Record<string, unknown>): RuleOverride {
  const result: RuleOverride = { id };
  if (typeof value['enabled'] === 'boolean') result.enabled = value['enabled'];
  if (typeof value['name'] === 'string') result.name = value['name'].slice(0, 100);
  if (typeof value['description'] === 'string') {
    result.description = value['description'].slice(0, 2_000);
  }
  if (typeof value['category'] === 'string') {
    result.category = value['category'] as RuleOverride['category'];
  }
  if (typeof value['pattern'] === 'string') result.pattern = value['pattern'];
  if (typeof value['flags'] === 'string') {
    result.flags = sanitizeRegexFlags(value['flags']);
  }
  if (isSeverity(value['severity'])) result.severity = value['severity'];
  if (typeof value['weight'] === 'number') result.weight = value['weight'];
  if (typeof value['isDensityRule'] === 'boolean') {
    result.isDensityRule = value['isDensityRule'];
  }
  if (typeof value['densityThreshold'] === 'number') {
    result.densityThreshold = value['densityThreshold'];
  }
  if (typeof value['deletedTombstone'] === 'boolean') {
    result.deletedTombstone = value['deletedTombstone'];
  }
  if (typeof value['updatedAt'] === 'string') result.updatedAt = value['updatedAt'];
  return result;
}

function sanitizeCustomRules(value: unknown): SlopRule[] {
  if (!Array.isArray(value)) return [];

  const result: SlopRule[] = [];
  const ids = new Set(builtinRulesById.keys());
  for (const candidate of value.slice(0, MAX_CUSTOM_RULES)) {
    if (!isRecord(candidate) || typeof candidate['id'] !== 'string') continue;
    if (forbiddenObjectKeys.has(candidate['id']) || ids.has(candidate['id'])) continue;

    const rule = { ...candidate, source: 'custom' } as unknown as SlopRule;
    if (!validateRule(rule).valid) continue;

    ids.add(rule.id);
    result.push({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      pattern: rule.pattern,
      flags: sanitizeRegexFlags(rule.flags),
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
      ...(typeof rule.createdAt === 'string' ? { createdAt: rule.createdAt } : {}),
      ...(typeof rule.updatedAt === 'string' ? { updatedAt: rule.updatedAt } : {}),
    });
  }
  return result;
}

function createInitialState(): StoredStateV1 {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: sanitizeSettings(DEFAULT_SETTINGS),
    ruleOverrides: {},
    customRules: [],
    lastUpdated: new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function finiteInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : fallback;
}

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const integer = finiteInteger(value, fallback);
  return Math.min(maximum, Math.max(minimum, integer));
}

function boundedNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(maximum, Math.max(minimum, number));
}

function colorValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function isSeverity(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}
