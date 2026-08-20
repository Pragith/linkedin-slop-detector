/**
 * Normalizes input text for resilient pattern matching.
 * Preserves character index mappings where needed and unifies Unicode variants.
 */

// Replace curly apostrophes and quotes with ASCII standard
export function normalizeQuotes(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"');
}

// Replace non-breaking spaces and zero-width spaces
export function normalizeSpaces(text: string): string {
  return text
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    .replace(/\r/g, '\n');
}

// Standardize text for scanning while preserving string length wherever possible
export function normalizeTextForScan(text: string): string {
  if (!text) return '';
  return normalizeSpaces(normalizeQuotes(text));
}

// Count approximate words in text
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  const tokens = text.trim().split(/\s+/);
  return tokens.filter((t) => t.length > 0).length;
}

// Fast string fingerprint (djb2 hash) for checking if post text changed
export function generateTextFingerprint(text: string): string {
  let hash = 5381;
  const len = text.length;
  for (let i = 0; i < len; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return `${len}_${(hash >>> 0).toString(16)}`;
}
