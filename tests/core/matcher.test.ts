import { describe, it, expect } from 'vitest';
import {
  compileRule,
  executeRules,
  resolveNonOverlappingMatches,
} from '../../src/core/matcher';
import { SlopRule, DetectionMatch } from '../../src/core/types';

describe('Matcher & Regex Engine', () => {
  const sampleRule: SlopRule = {
    id: 'test-contrast',
    name: 'Test Contrast',
    description: 'Test rule',
    category: 'contrast',
    pattern: "\\b(?:it['’]?s|it is)\\s+not\\s+just\\b",
    flags: 'i',
    examples: ["It's not just a tool"],
    severity: 4,
    weight: 4,
    enabledByDefault: true,
    source: 'builtin',
  };

  it('safely compiles valid regular expressions', () => {
    const compiled = compileRule(sampleRule);
    expect(compiled.isValid).toBe(true);
    expect(compiled.regex).not.toBeNull();
    expect(compiled.compileError).toBeUndefined();
  });

  it('gracefully handles invalid regular expressions without throwing', () => {
    const invalidRule: SlopRule = {
      ...sampleRule,
      id: 'invalid-regex',
      pattern: '[unclosed-bracket(',
    };
    const compiled = compileRule(invalidRule);
    expect(compiled.isValid).toBe(false);
    expect(compiled.regex).toBeNull();
    expect(compiled.compileError).toBeDefined();
  });

  it('executes rules and captures match positions in text', () => {
    const text = "Let me say: it's not just about speed, it is not just about power.";
    const matches = executeRules(text, [sampleRule]);

    expect(matches.length).toBe(2);
    expect(matches[0]?.matchedText.toLowerCase()).toContain("it's not just");
    expect(matches[1]?.matchedText.toLowerCase()).toContain('it is not just');
  });

  it('returns original text slices at the correct offset after normalization', () => {
    const text = 'Header\r\nIt’s\u00a0not just a tool';
    const matches = executeRules(text, [sampleRule]);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.matchedText).toBe('It’s\u00a0not just');
  });

  it('resolves overlapping matches prioritizing severity, weight, and span', () => {
    const matches: DetectionMatch[] = [
      {
        ruleId: 'r1',
        ruleName: 'Short Rule',
        category: 'contrast',
        start: 0,
        end: 10,
        matchedText: '0123456789',
        weight: 2,
        severity: 2,
      },
      {
        ruleId: 'r2',
        ruleName: 'Longer Higher Severity Rule',
        category: 'contrast',
        start: 5,
        end: 20,
        matchedText: '5678901234567890',
        weight: 5,
        severity: 5,
      },
      {
        ruleId: 'r3',
        ruleName: 'Disjoint Rule',
        category: 'llm-vocabulary',
        start: 25,
        end: 35,
        matchedText: '25..35',
        weight: 2,
        severity: 2,
      },
    ];

    const nonOverlapping = resolveNonOverlappingMatches(matches);
    expect(nonOverlapping.length).toBe(2);
    // The higher-severity overlapping span wins, followed by the disjoint span.
    expect(nonOverlapping[0]?.ruleId).toBe('r2');
    expect(nonOverlapping[1]?.ruleId).toBe('r3');
  });
});
