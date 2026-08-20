import { describe, it, expect } from 'vitest';
import { validateRule, sanitizeRegexFlags } from '../../src/rules/ruleValidation';
import { SlopRule } from '../../src/core/types';

describe('Rule Validation and Safety Guards', () => {
  const validRule: SlopRule = {
    id: 'rule-1',
    name: 'Valid Rule',
    description: 'Valid description',
    category: 'contrast',
    pattern: '\\btest\\b',
    flags: 'i',
    examples: ['test'],
    severity: 3,
    weight: 2,
    enabledByDefault: true,
    source: 'custom',
  };

  it('passes validation for well-formed rules', () => {
    const result = validateRule(validRule);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects rules missing a name or with empty names', () => {
    const res = validateRule({ ...validRule, name: '' });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('name is required'))).toBe(true);
  });

  it('rejects rules with invalid regular expression syntax', () => {
    const res = validateRule({ ...validRule, pattern: '(?<invalid-group' });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Invalid regular expression'))).toBe(true);
  });

  it('rejects invalid category names', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = validateRule({ ...validRule, category: 'unsupported-category' as any });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Category must be one of'))).toBe(true);
  });

  it('rejects potentially catastrophic regexes and non-finite weights', () => {
    const unsafe = validateRule({ ...validRule, pattern: '(a+)+$' });
    expect(unsafe.valid).toBe(false);
    expect(unsafe.errors.some((error) => error.includes('potentially unsafe'))).toBe(
      true,
    );

    const infinite = validateRule({ ...validRule, weight: Number.POSITIVE_INFINITY });
    expect(infinite.valid).toBe(false);
  });

  it('sanitizes regex flags safely', () => {
    expect(sanitizeRegexFlags('gim')).toBe('gim');
    expect(sanitizeRegexFlags('gixyz')).toBe('gi');
    expect(sanitizeRegexFlags('')).toBe('i');
    expect(sanitizeRegexFlags(undefined)).toBe('i');
  });
});
