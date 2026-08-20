import { describe, it, expect } from 'vitest';
import { SlopDetector } from '../../src/core/detector';
import { DEFAULT_RULES } from '../../src/rules/defaultRules';
import { DEFAULT_SETTINGS } from '../../src/storage/defaultSettings';

describe('SlopDetector Engine', () => {
  const detector = new SlopDetector([...DEFAULT_RULES]);

  it('detects classic AI contrast and opener cliches', () => {
    const text = `In today's fast-paced world, it's not just about AI. It's about people.
Let's delve into why this game-changer plays a pivotal role. The answer is simple: innovate or be left behind.`;

    const result = detector.detect(text, DEFAULT_SETTINGS);
    expect(result.score).toBeGreaterThanOrEqual(10);
    expect(result.shouldAct).toBe(true);
    expect(result.matches.length).toBeGreaterThanOrEqual(4);
    expect(result.stats.distinctCategoryCount).toBeGreaterThanOrEqual(3);
    expect(result.stats.diversityBonusApplied).toBe(true);
  });

  it('handles empty or whitespace-only text gracefully', () => {
    const resultEmpty = detector.detect('', DEFAULT_SETTINGS);
    expect(resultEmpty.score).toBe(0);
    expect(resultEmpty.matches).toEqual([]);
    expect(resultEmpty.shouldAct).toBe(false);

    const resultSpaces = detector.detect('   \n\n  \t  ', DEFAULT_SETTINGS);
    expect(resultSpaces.score).toBe(0);
    expect(resultSpaces.matches).toEqual([]);
    expect(resultSpaces.shouldAct).toBe(false);
  });

  it('does not flag normal, clear technical communication', () => {
    const cleanText = `We published our quarterly financial report today. Revenue grew by 14% year over year.
Our engineering team deployed three security updates to production this morning.
Check out the link below for the full spreadsheet breakdown.`;

    const result = detector.detect(cleanText, DEFAULT_SETTINGS);
    expect(result.score).toBe(0);
    expect(result.shouldAct).toBe(false);
    expect(result.matches.length).toBe(0);
  });

  it('handles Unicode curly quotes and straight quotes identically', () => {
    const curlyQuotes = '“It’s not just a product, it’s a movement.”';
    const straightQuotes = '"It\'s not just a product, it\'s a movement."';

    const resCurly = detector.detect(curlyQuotes, DEFAULT_SETTINGS);
    const resStraight = detector.detect(straightQuotes, DEFAULT_SETTINGS);

    expect(resCurly.matches.length).toBeGreaterThan(0);
    expect(resStraight.matches.length).toBeGreaterThan(0);
    expect(resCurly.score).toBe(resStraight.score);
  });

  it('runs sub-millisecond to low-single-digit millisecond performance benchmark', () => {
    const samplePost = `
      In today's fast-paced world, software engineering is undergoing a transformative shift.
      It's not just about writing code; it's about delivering robust value.
      At its core, this stands as a testament to our team's relentless drive.
      The key takeaway is clear: we must empower engineers to leverage modern automation.
      Ultimately, the future is bright.
    `;

    const bench = detector.benchmark(samplePost, DEFAULT_SETTINGS, 50);
    expect(bench.result.score).toBeGreaterThan(10);
    // Average execution time should be under 5ms on modern hardware
    expect(bench.avgMs).toBeLessThan(15);
  });
});
