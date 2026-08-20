import { SlopRule, CompiledRule, DetectionMatch } from './types';
import { normalizeTextForScan } from './normalization';
import { sanitizeRegexFlags } from '../rules/ruleValidation';

// In-memory cache for compiled regex instances
const regexCache = new Map<string, CompiledRule>();
export const MAX_SCAN_LENGTH = 20_000;

export function compileRule(rule: SlopRule): CompiledRule {
  const flags = sanitizeRegexFlags(rule.flags);
  // Ensure 'g' flag is present for scanning all occurrences, 'i' is default unless specified
  const effectiveFlags = flags.includes('g') ? flags : `${flags}g`;
  const cacheKey = `${rule.id}:${rule.pattern}:${effectiveFlags}`;

  const cached = regexCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const regex = new RegExp(rule.pattern, effectiveFlags);
    const compiled: CompiledRule = {
      rule,
      regex,
      isValid: true,
    };
    regexCache.set(cacheKey, compiled);
    return compiled;
  } catch (err) {
    const compiled: CompiledRule = {
      rule,
      regex: null,
      isValid: false,
      compileError: err instanceof Error ? err.message : String(err),
    };
    regexCache.set(cacheKey, compiled);
    return compiled;
  }
}

export function clearRegexCache(): void {
  regexCache.clear();
}

/**
 * Executes rules against text and returns all matches.
 */
export function executeRules(rawText: string, rules: SlopRule[]): DetectionMatch[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const scanText = rawText.slice(0, MAX_SCAN_LENGTH);
  const normalized = normalizeTextForScan(scanText);
  const rawMatches: DetectionMatch[] = [];

  for (const rule of rules) {
    const compiled = compileRule(rule);
    if (!compiled.isValid || !compiled.regex) {
      continue;
    }

    const regex = compiled.regex;
    regex.lastIndex = 0; // Reset state for global regex

    let match: RegExpExecArray | null;
    let matchCount = 0;
    const maxMatchesPerRule = 50; // Safety guard

    // Match against normalized text
    while ((match = regex.exec(normalized)) !== null && matchCount < maxMatchesPerRule) {
      const matchedText = match[0];
      if (!matchedText) {
        // Prevent infinite loops on zero-length matches
        regex.lastIndex++;
        continue;
      }

      matchCount++;
      const start = match.index;
      const end = match.index + matchedText.length;

      // Extract original un-normalized text slice for display fidelity
      const originalMatched = scanText.slice(start, end) || matchedText;

      rawMatches.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        start,
        end,
        matchedText: originalMatched,
        weight: rule.weight,
        severity: rule.severity,
      });

      if (!regex.global) {
        break;
      }
    }
  }

  return rawMatches;
}

/**
 * Merges overlapping matches for highlighting.
 * Prioritizes higher severity, higher weight, and longer match spans.
 */
export function resolveNonOverlappingMatches(
  matches: DetectionMatch[],
): DetectionMatch[] {
  if (matches.length <= 1) return [...matches];

  // Select the strongest spans first, then return them in document order.
  const sorted = [...matches].sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    if (b.weight !== a.weight) return b.weight - a.weight;
    const lengthDifference = b.end - b.start - (a.end - a.start);
    if (lengthDifference !== 0) return lengthDifference;
    return a.start - b.start;
  });

  const result: DetectionMatch[] = [];
  for (const match of sorted) {
    const overlapsSelected = result.some(
      (selected) => match.start < selected.end && match.end > selected.start,
    );
    if (!overlapsSelected) {
      result.push(match);
    }
  }

  return result.sort((a, b) => a.start - b.start || a.end - b.end);
}
