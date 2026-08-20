import { SlopRule, ExtensionSettings, DetectionResult } from './types';
import { executeRules } from './matcher';
import { calculateDetectionResult } from './scoring';

export class SlopDetector {
  private activeRules: SlopRule[] = [];

  constructor(rules: SlopRule[] = []) {
    this.setRules(rules);
  }

  setRules(rules: SlopRule[]): void {
    this.activeRules = [...rules];
  }

  getRules(): readonly SlopRule[] {
    return [...this.activeRules];
  }

  detect(rawText: string, settings: ExtensionSettings): DetectionResult {
    if (!rawText || rawText.trim().length === 0) {
      return {
        score: 0,
        normalizedScore: 0,
        matches: [],
        matchedRuleIds: [],
        categories: [],
        stats: {
          totalMatches: 0,
          distinctRuleCount: 0,
          distinctCategoryCount: 0,
          wordCount: 0,
          diversityBonusApplied: false,
          diversityBonus: 0,
          densityScore: 0,
        },
        shouldAct: false,
        recommendedAction: 'none',
      };
    }

    const rawMatches = executeRules(rawText, this.activeRules);
    return calculateDetectionResult(rawText, rawMatches, this.activeRules, settings);
  }

  /**
   * Benchmarks detector execution time against sample text.
   */
  benchmark(
    text: string,
    settings: ExtensionSettings,
    iterations = 100,
  ): {
    totalMs: number;
    avgMs: number;
    result: DetectionResult;
  } {
    if (!Number.isInteger(iterations) || iterations < 1) {
      throw new RangeError('Benchmark iterations must be a positive integer.');
    }
    const start = performance.now();
    let lastResult: DetectionResult | null = null;
    for (let i = 0; i < iterations; i++) {
      lastResult = this.detect(text, settings);
    }
    const totalMs = performance.now() - start;
    return {
      totalMs,
      avgMs: totalMs / iterations,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result: lastResult!,
    };
  }
}
