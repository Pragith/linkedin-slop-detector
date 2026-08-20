import { describe, it, expect } from 'vitest';
import {
  normalizeQuotes,
  normalizeSpaces,
  normalizeTextForScan,
  countWords,
  generateTextFingerprint,
} from '../../src/core/normalization';

describe('Text Normalization', () => {
  it('normalizes curly single and double quotes to ASCII quotes', () => {
    const input = '“It’s not just about AI,” he said.';
    const normalized = normalizeQuotes(input);
    expect(normalized).toBe('"It\'s not just about AI," he said.');
  });

  it('normalizes non-breaking and zero-width spaces', () => {
    const input = 'Hello\u00A0World\u200B!';
    const normalized = normalizeSpaces(input);
    expect(normalized).toBe('Hello World !');
  });

  it('normalizes combined quotes and spaces', () => {
    const input = '“In\u00A0today’s\u00A0world”';
    const normalized = normalizeTextForScan(input);
    expect(normalized).toBe('"In today\'s world"');
  });

  it('preserves string length so detector offsets remain valid', () => {
    const input = 'Header\r\nIt’s\u00a0not just a tool';
    expect(normalizeTextForScan(input)).toHaveLength(input.length);
  });

  it('accurately counts words in string', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords('This is a test sentence with eight words.')).toBe(8);
  });

  it('generates consistent fingerprints for identical text', () => {
    const text = 'Consistent post content for testing.';
    const fp1 = generateTextFingerprint(text);
    const fp2 = generateTextFingerprint(text);
    expect(fp1).toBe(fp2);

    const fp3 = generateTextFingerprint('Different post content.');
    expect(fp1).not.toBe(fp3);
  });
});
