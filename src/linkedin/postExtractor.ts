import { LINKEDIN_SELECTORS, LinkedInPostElements } from './adapter';

export interface PostTextSegment {
  node: Text;
  start: number;
  end: number;
}

export interface ExtractedPostText {
  text: string;
  segments: PostTextSegment[];
}

export function extractPostText(elements: LinkedInPostElements): string {
  return extractPostTextWithSegments(elements.textElement || elements.container).text;
}

/**
 * Extracts body text and its source text nodes with identical exclusion rules.
 * The shared mapping keeps detector offsets and highlight ranges aligned.
 */
export function extractPostTextWithSegments(node: Node): ExtractedPostText {
  const chunks: string[] = [];
  const segments: PostTextSegment[] = [];
  let offset = 0;

  const visit = (current: Node): void => {
    if (current.nodeType === Node.TEXT_NODE) {
      const text = current.textContent || '';
      if (text.length === 0) return;
      chunks.push(text);
      segments.push({ node: current as Text, start: offset, end: offset + text.length });
      offset += text.length;
      return;
    }

    if (current.nodeType !== Node.ELEMENT_NODE) return;
    const element = current as HTMLElement;
    if (shouldExcludeElement(element)) return;

    for (const child of element.childNodes) visit(child);
  };

  visit(node);
  return { text: chunks.join(''), segments };
}

/** Retained for callers that need to extract from an arbitrary subtree. */
export function extractVisibleText(node: Node): string {
  return extractPostTextWithSegments(node).text;
}

function shouldExcludeElement(element: HTMLElement): boolean {
  // Highlights wrap post text and must remain part of subsequent scans.
  if (element.classList.contains('lsd-highlight')) return false;
  if (element.classList.contains('lsd-ui-element')) return true;
  if (element.matches('script, style, button, [aria-hidden="true"]')) return true;

  for (const selector of LINKEDIN_SELECTORS.excludedFromText) {
    if (element.matches(selector)) return true;
  }

  return element.style.display === 'none' || element.style.visibility === 'hidden';
}
