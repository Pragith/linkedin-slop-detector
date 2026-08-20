import { SlopRule, SlopCategory } from '../core/types';
import safeRegex from 'safe-regex2';

export const VALID_CATEGORIES: readonly SlopCategory[] = [
  'contrast',
  'canned-opener',
  'canned-conclusion',
  'dramatic-reveal',
  'faux-insight',
  'canned-exploration',
  'throat-clearing',
  'generic-world',
  'generic-bridge',
  'inflated-metaphor',
  'llm-vocabulary',
  'corporate-language',
  'empty-intensifier',
  'unsupported-authority',
  'scaffolding',
  'structural',
  'formatting',
  'other',
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Max allowed pattern length to protect against runaway regular expressions
export const MAX_PATTERN_LENGTH = 500;
export const MAX_CUSTOM_RULES = 200;
export const MAX_RULE_WEIGHT = 100;
export const MAX_DENSITY_THRESHOLD = 100;

const RULE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,99})$/;
const ALLOWED_REGEX_FLAGS = /^[gimsu]+$/;

export function validateRule(rule: Partial<SlopRule>): ValidationResult {
  const errors: string[] = [];

  if (!rule.id || !RULE_ID_PATTERN.test(rule.id)) {
    errors.push(
      'Rule ID must be 1-100 lowercase letters, numbers, dots, underscores, or hyphens.',
    );
  }

  if (!rule.name || rule.name.trim().length === 0) {
    errors.push('Rule name is required.');
  } else if (rule.name.length > 100) {
    errors.push('Rule name must not exceed 100 characters.');
  }

  if (!rule.category || !VALID_CATEGORIES.includes(rule.category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!rule.pattern || rule.pattern.trim().length === 0) {
    errors.push('Pattern is required.');
  } else if (rule.pattern.length > MAX_PATTERN_LENGTH) {
    errors.push(
      `Pattern length exceeds maximum allowed (${MAX_PATTERN_LENGTH} characters).`,
    );
  } else {
    // Validate regular expression syntax
    try {
      // Validate flags
      const flags = rule.flags || 'i';
      const cleanFlags = Array.from(new Set(flags.split(''))).join('');
      if (flags && !ALLOWED_REGEX_FLAGS.test(flags)) {
        errors.push(`Invalid regex flags: "${flags}". Allowed flags: g, i, m, s, u.`);
      } else {
        const regex = new RegExp(rule.pattern, cleanFlags);
        if (!safeRegex(regex, { limit: 25 })) {
          errors.push(
            'Pattern is potentially unsafe because its repetition can cause excessive backtracking.',
          );
        }
      }
    } catch (err) {
      errors.push(
        `Invalid regular expression: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (
    rule.severity === undefined ||
    !Number.isInteger(rule.severity) ||
    rule.severity < 1 ||
    rule.severity > 5
  ) {
    errors.push('Severity must be an integer between 1 and 5.');
  }

  if (
    rule.weight === undefined ||
    typeof rule.weight !== 'number' ||
    !Number.isFinite(rule.weight) ||
    rule.weight < 0 ||
    rule.weight > MAX_RULE_WEIGHT
  ) {
    errors.push(`Weight must be a finite number between 0 and ${MAX_RULE_WEIGHT}.`);
  }

  if (rule.isDensityRule) {
    if (
      rule.densityThreshold === undefined ||
      !Number.isInteger(rule.densityThreshold) ||
      rule.densityThreshold < 1 ||
      rule.densityThreshold > MAX_DENSITY_THRESHOLD
    ) {
      errors.push(
        `Density threshold must be an integer between 1 and ${MAX_DENSITY_THRESHOLD}.`,
      );
    }
  }

  if (rule.examples !== undefined && !isStringArray(rule.examples)) {
    errors.push('Examples must be an array of strings.');
  }

  if (rule.counterExamples !== undefined && !isStringArray(rule.counterExamples)) {
    errors.push('Counterexamples must be an array of strings.');
  }

  if (rule.enabledByDefault !== undefined && typeof rule.enabledByDefault !== 'boolean') {
    errors.push('Enabled must be a boolean.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeRegexFlags(flags: string | undefined): string {
  if (!flags) return 'i';
  const allowed = new Set(['g', 'i', 'm', 's', 'u']);
  const unique = Array.from(new Set(flags.split('').filter((f) => allowed.has(f))));
  return unique.join('');
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 100 &&
    value.every((item) => typeof item === 'string' && item.length <= 2_000)
  );
}
