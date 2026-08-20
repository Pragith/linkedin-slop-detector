import { describe, it, expect } from 'vitest';
import { RuleRepository } from '../../src/rules/ruleRepository';
import { SlopRule, RuleOverride } from '../../src/core/types';

describe('RuleRepository and Override Model', () => {
  const repo = new RuleRepository();

  it('retrieves default built-in rules without overrides', () => {
    const effective = repo.getAllEffectiveRules({}, []);
    expect(effective.length).toBe(repo.getBuiltinRules().length);
    expect(effective.every((r) => !r.isOverridden && !r.isDeleted)).toBe(true);
  });

  it('correctly applies user overrides to built-in rules', () => {
    const overrides: Record<string, RuleOverride> = {
      'contrast-not-just': {
        id: 'contrast-not-just',
        weight: 10,
        severity: 5,
        enabled: false,
      },
    };

    const effective = repo.getAllEffectiveRules(overrides, []);
    const rule = effective.find((r) => r.id === 'contrast-not-just');

    expect(rule).toBeDefined();
    expect(rule?.weight).toBe(10);
    expect(rule?.severity).toBe(5);
    expect(rule?.enabledByDefault).toBe(false);
    expect(rule?.isOverridden).toBe(true);
    expect(rule?.isDeleted).toBe(false);
  });

  it('tombstones built-in rules when soft-deleted without destroying original default', () => {
    const overrides: Record<string, RuleOverride> = {
      'contrast-not-just': {
        id: 'contrast-not-just',
        deletedTombstone: true,
        enabled: false,
      },
    };

    const effective = repo.getAllEffectiveRules(overrides, []);
    const rule = effective.find((r) => r.id === 'contrast-not-just');
    expect(rule?.isDeleted).toBe(true);

    const activeRules = repo.getActiveRules(overrides, []);
    expect(activeRules.some((r) => r.id === 'contrast-not-just')).toBe(false);
  });

  it('merges custom rules seamlessly with built-ins', () => {
    const customRule: SlopRule = {
      id: 'custom-buzzword',
      name: 'Custom Buzzword Rule',
      description: 'Finds custom pattern',
      category: 'corporate-language',
      pattern: '\\bparadigm\\s+shift\\b',
      flags: 'i',
      examples: ['a paradigm shift'],
      severity: 3,
      weight: 3,
      enabledByDefault: true,
      source: 'custom',
    };

    const effective = repo.getAllEffectiveRules({}, [customRule]);
    expect(effective.some((r) => r.id === 'custom-buzzword')).toBe(true);

    const active = repo.getActiveRules({}, [customRule]);
    expect(active.some((r) => r.id === 'custom-buzzword')).toBe(true);
  });
});
