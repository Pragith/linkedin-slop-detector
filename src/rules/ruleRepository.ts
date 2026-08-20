import { SlopRule, RuleOverride, EffectiveRule } from '../core/types';
import { DEFAULT_RULES } from './defaultRules';

export class RuleRepository {
  private builtinRules: readonly SlopRule[];

  constructor(builtinRules: readonly SlopRule[] = DEFAULT_RULES) {
    this.builtinRules = builtinRules;
  }

  getBuiltinRules(): readonly SlopRule[] {
    return this.builtinRules;
  }

  getBuiltinRule(id: string): SlopRule | undefined {
    return this.builtinRules.find((r) => r.id === id);
  }

  /**
   * Resolves the list of all effective rules by combining built-ins, overrides, and custom rules.
   * Includes tombstoned/deleted rules marked with `isDeleted: true` for the UI.
   */
  getAllEffectiveRules(
    overrides: Record<string, RuleOverride>,
    customRules: SlopRule[],
  ): EffectiveRule[] {
    const rules: EffectiveRule[] = [];

    // Process built-ins
    for (const builtin of this.builtinRules) {
      const override = overrides[builtin.id];

      if (override?.deletedTombstone) {
        rules.push({
          ...builtin,
          enabledByDefault: false,
          isOverridden: true,
          isDeleted: true,
        });
        continue;
      }

      if (override) {
        rules.push({
          ...builtin,
          name: override.name ?? builtin.name,
          description: override.description ?? builtin.description,
          category: override.category ?? builtin.category,
          pattern: override.pattern ?? builtin.pattern,
          flags: override.flags ?? builtin.flags,
          severity: override.severity ?? builtin.severity,
          weight: override.weight ?? builtin.weight,
          enabledByDefault:
            override.enabled !== undefined ? override.enabled : builtin.enabledByDefault,
          isDensityRule: override.isDensityRule ?? builtin.isDensityRule,
          densityThreshold: override.densityThreshold ?? builtin.densityThreshold,
          isOverridden: true,
          isDeleted: false,
        });
      } else {
        rules.push({
          ...builtin,
          isOverridden: false,
          isDeleted: false,
        });
      }
    }

    // Process custom rules
    for (const custom of customRules) {
      const override = overrides[custom.id];
      if (override?.deletedTombstone) {
        continue; // Custom rule deleted
      }

      if (override) {
        rules.push({
          ...custom,
          name: override.name ?? custom.name,
          description: override.description ?? custom.description,
          category: override.category ?? custom.category,
          pattern: override.pattern ?? custom.pattern,
          flags: override.flags ?? custom.flags,
          severity: override.severity ?? custom.severity,
          weight: override.weight ?? custom.weight,
          enabledByDefault:
            override.enabled !== undefined ? override.enabled : custom.enabledByDefault,
          isOverridden: true,
          isDeleted: false,
        });
      } else {
        rules.push({
          ...custom,
          isOverridden: false,
          isDeleted: false,
        });
      }
    }

    return rules;
  }

  /**
   * Returns active, compiled-ready rules for the detection engine (excluding deleted/disabled rules).
   */
  getActiveRules(
    overrides: Record<string, RuleOverride>,
    customRules: SlopRule[],
  ): SlopRule[] {
    const all = this.getAllEffectiveRules(overrides, customRules);
    return all.filter((r) => !r.isDeleted && r.enabledByDefault);
  }

  /**
   * Creates an override that disables or enables a rule.
   */
  static createToggleOverride(
    ruleId: string,
    enabled: boolean,
    existingOverride?: RuleOverride,
  ): RuleOverride {
    return {
      ...(existingOverride || { id: ruleId }),
      id: ruleId,
      enabled,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Creates an override that soft-deletes (tombstones) a built-in rule.
   */
  static createTombstoneOverride(
    ruleId: string,
    existingOverride?: RuleOverride,
  ): RuleOverride {
    return {
      ...(existingOverride || { id: ruleId }),
      id: ruleId,
      deletedTombstone: true,
      enabled: false,
      updatedAt: new Date().toISOString(),
    };
  }
}
