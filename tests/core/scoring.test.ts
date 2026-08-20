import { describe, it, expect } from 'vitest';
import { calculateDetectionResult } from '../../src/core/scoring';
import { DEFAULT_SETTINGS } from '../../src/storage/defaultSettings';
import { SlopRule, DetectionMatch, ExtensionSettings } from '../../src/core/types';

describe('Scoring Engine', () => {
  const mockRules: SlopRule[] = [
    {
      id: 'r-contrast',
      name: 'Contrast Rule',
      description: 'desc',
      category: 'contrast',
      pattern: 'test',
      flags: 'i',
      examples: ['test'],
      severity: 4,
      weight: 4,
      enabledByDefault: true,
      source: 'builtin',
    },
    {
      id: 'r-opener',
      name: 'Opener Rule',
      description: 'desc',
      category: 'canned-opener',
      pattern: 'test',
      flags: 'i',
      examples: ['test'],
      severity: 3,
      weight: 3,
      enabledByDefault: true,
      source: 'builtin',
    },
    {
      id: 'r-metaphor',
      name: 'Metaphor Rule',
      description: 'desc',
      category: 'inflated-metaphor',
      pattern: 'test',
      flags: 'i',
      examples: ['test'],
      severity: 3,
      weight: 3,
      enabledByDefault: true,
      source: 'builtin',
    },
    {
      id: 'r-density',
      name: 'Em-Dash Density Rule',
      description: 'desc',
      category: 'structural',
      pattern: '--',
      flags: 'g',
      examples: ['--'],
      severity: 1,
      weight: 0.5,
      isDensityRule: true,
      densityThreshold: 3,
      enabledByDefault: true,
      source: 'builtin',
    },
  ];

  it('correctly calculates basic match scores', () => {
    const rawMatches: DetectionMatch[] = [
      {
        ruleId: 'r-contrast',
        ruleName: 'Contrast Rule',
        category: 'contrast',
        start: 0,
        end: 4,
        matchedText: 'test',
        weight: 4,
        severity: 4,
      },
    ];

    const result = calculateDetectionResult(
      'Short test post.',
      rawMatches,
      mockRules,
      DEFAULT_SETTINGS,
    );
    expect(result.score).toBe(4);
    expect(result.stats.totalMatches).toBe(1);
    expect(result.stats.distinctCategoryCount).toBe(1);
    expect(result.stats.diversityBonusApplied).toBe(false);
    expect(result.shouldAct).toBe(true); // Default threshold is 4
  });

  it('applies category diversity bonus when >= threshold distinct families are matched', () => {
    const rawMatches: DetectionMatch[] = [
      {
        ruleId: 'r-contrast',
        ruleName: 'Contrast Rule',
        category: 'contrast',
        start: 0,
        end: 4,
        matchedText: 'test',
        weight: 4,
        severity: 4,
      },
      {
        ruleId: 'r-opener',
        ruleName: 'Opener Rule',
        category: 'canned-opener',
        start: 10,
        end: 14,
        matchedText: 'test',
        weight: 3,
        severity: 3,
      },
      {
        ruleId: 'r-metaphor',
        ruleName: 'Metaphor Rule',
        category: 'inflated-metaphor',
        start: 20,
        end: 24,
        matchedText: 'test',
        weight: 3,
        severity: 3,
      },
    ];

    const result = calculateDetectionResult(
      'Test post with three categories.',
      rawMatches,
      mockRules,
      DEFAULT_SETTINGS,
    );
    // 4 + 3 + 3 + 5 (diversity bonus) = 15
    expect(result.score).toBe(15);
    expect(result.stats.distinctCategoryCount).toBe(3);
    expect(result.stats.diversityBonusApplied).toBe(true);
    expect(result.stats.diversityBonus).toBe(5);
  });

  it('only scores density rules if occurrences meet the density threshold', () => {
    // 2 occurrences (threshold is 3) -> should not count
    const belowThresholdMatches: DetectionMatch[] = [
      {
        ruleId: 'r-density',
        ruleName: 'Em-Dash Density Rule',
        category: 'structural',
        start: 0,
        end: 2,
        matchedText: '--',
        weight: 0.5,
        severity: 1,
      },
      {
        ruleId: 'r-density',
        ruleName: 'Em-Dash Density Rule',
        category: 'structural',
        start: 10,
        end: 12,
        matchedText: '--',
        weight: 0.5,
        severity: 1,
      },
    ];

    const resBelow = calculateDetectionResult(
      'Text with two dashes',
      belowThresholdMatches,
      mockRules,
      DEFAULT_SETTINGS,
    );
    expect(resBelow.score).toBe(0);
    expect(resBelow.stats.totalMatches).toBe(0);

    // 3 occurrences (meets threshold) -> should count: 3 * 0.5 = 1.5 pts
    const atThresholdMatches: DetectionMatch[] = [
      ...belowThresholdMatches,
      {
        ruleId: 'r-density',
        ruleName: 'Em-Dash Density Rule',
        category: 'structural',
        start: 20,
        end: 22,
        matchedText: '--',
        weight: 0.5,
        severity: 1,
      },
    ];

    const resAt = calculateDetectionResult(
      'Text with three dashes',
      atThresholdMatches,
      mockRules,
      DEFAULT_SETTINGS,
    );
    expect(resAt.score).toBe(1.5);
    expect(resAt.stats.totalMatches).toBe(3);
  });

  it('scores density-rule occurrences normally when density scoring is disabled', () => {
    const matches: DetectionMatch[] = [
      {
        ruleId: 'r-density',
        ruleName: 'Em-Dash Density Rule',
        category: 'structural',
        start: 0,
        end: 2,
        matchedText: '--',
        weight: 0.5,
        severity: 1,
      },
    ];
    const result = calculateDetectionResult('One -- dash', matches, mockRules, {
      ...DEFAULT_SETTINGS,
      densityScoringEnabled: false,
    });

    expect(result.score).toBe(0.5);
    expect(result.stats.totalMatches).toBe(1);
  });

  it('does not apply a diversity bonus to categories separated by over 250 words', () => {
    const longGap = `${'word '.repeat(260)}test`;
    const matches: DetectionMatch[] = [
      {
        ruleId: 'r-contrast',
        ruleName: 'Contrast Rule',
        category: 'contrast',
        start: 0,
        end: 4,
        matchedText: 'word',
        weight: 4,
        severity: 4,
      },
      {
        ruleId: 'r-opener',
        ruleName: 'Opener Rule',
        category: 'canned-opener',
        start: 10,
        end: 14,
        matchedText: 'word',
        weight: 3,
        severity: 3,
      },
      {
        ruleId: 'r-metaphor',
        ruleName: 'Metaphor Rule',
        category: 'inflated-metaphor',
        start: longGap.length - 4,
        end: longGap.length,
        matchedText: 'test',
        weight: 3,
        severity: 3,
      },
    ];

    const result = calculateDetectionResult(
      longGap,
      matches,
      mockRules,
      DEFAULT_SETTINGS,
    );
    expect(result.stats.diversityBonusApplied).toBe(false);
    expect(result.score).toBe(10);
  });

  it('strictly respects recommended action precedence: hide > collapse > dim > outline > highlight', () => {
    const sampleMatches: DetectionMatch[] = [
      {
        ruleId: 'r-contrast',
        ruleName: 'Contrast Rule',
        category: 'contrast',
        start: 0,
        end: 4,
        matchedText: 'test',
        weight: 10,
        severity: 5,
      },
    ];

    // Case 1: hide + collapse + dim + outline enabled -> hide wins
    const settingsAll: ExtensionSettings = {
      ...DEFAULT_SETTINGS,
      postActions: {
        outline: true,
        highlight: true,
        showBadge: true,
        showScore: true,
        showMatchCount: true,
        dim: true,
        collapse: true,
        hide: true,
      },
    };
    const res1 = calculateDetectionResult('Text', sampleMatches, mockRules, settingsAll);
    expect(res1.recommendedAction).toBe('hide');

    // Case 2: collapse + dim + outline enabled -> collapse wins
    const settingsCollapse: ExtensionSettings = {
      ...settingsAll,
      postActions: {
        ...settingsAll.postActions,
        hide: false,
      },
    };
    const res2 = calculateDetectionResult(
      'Text',
      sampleMatches,
      mockRules,
      settingsCollapse,
    );
    expect(res2.recommendedAction).toBe('collapse');

    // Case 3: dim + outline enabled -> dim wins
    const settingsDim: ExtensionSettings = {
      ...settingsCollapse,
      postActions: {
        ...settingsCollapse.postActions,
        collapse: false,
      },
    };
    const res3 = calculateDetectionResult('Text', sampleMatches, mockRules, settingsDim);
    expect(res3.recommendedAction).toBe('dim');

    // Case 4: outline only -> outline wins
    const settingsOutline: ExtensionSettings = {
      ...settingsDim,
      postActions: {
        ...settingsDim.postActions,
        dim: false,
      },
    };
    const res4 = calculateDetectionResult(
      'Text',
      sampleMatches,
      mockRules,
      settingsOutline,
    );
    expect(res4.recommendedAction).toBe('outline');
  });
});
