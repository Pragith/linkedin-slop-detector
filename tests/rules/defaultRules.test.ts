import { describe, it, expect } from 'vitest';
import { DEFAULT_RULES } from '../../src/rules/defaultRules';
import { compileRule, executeRules } from '../../src/core/matcher';

describe('Built-in Rules Seed Validation', () => {
  it('contains comprehensive rule definitions', () => {
    expect(DEFAULT_RULES.length).toBeGreaterThanOrEqual(30);
  });

  DEFAULT_RULES.forEach((rule) => {
    describe(`Rule: [${rule.category}] "${rule.name}" (${rule.id})`, () => {
      it('has valid regex compilation', () => {
        const compiled = compileRule(rule);
        expect(
          compiled.isValid,
          `Regex compilation failed for ${rule.id}: ${compiled.compileError}`,
        ).toBe(true);
      });

      it('defines at least one positive example and at least one counter-example', () => {
        expect(
          rule.examples.length,
          `Rule ${rule.id} is missing positive examples`,
        ).toBeGreaterThanOrEqual(1);
        expect(
          rule.counterExamples && rule.counterExamples.length >= 1,
          `Rule ${rule.id} is missing counterExamples`,
        ).toBe(true);
      });

      it('matches all its positive examples', () => {
        for (const example of rule.examples) {
          const matches = executeRules(example, [rule]);
          expect(
            matches.length,
            `Expected rule "${rule.name}" (${rule.id}) to match positive example: "${example}"`,
          ).toBeGreaterThanOrEqual(1);
        }
      });

      it('does NOT match its counter examples', () => {
        if (rule.counterExamples) {
          for (const counter of rule.counterExamples) {
            const matches = executeRules(counter, [rule]);
            expect(
              matches.length,
              `Expected rule "${rule.name}" (${rule.id}) NOT to match counter-example: "${counter}"`,
            ).toBe(0);
          }
        }
      });
    });
  });
});
