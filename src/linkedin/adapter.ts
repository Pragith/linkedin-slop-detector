/**
 * Centralized LinkedIn DOM Adapter.
 * Provides resilient selectors and fallback queries for locating posts and text.
 */

export interface LinkedInPostElements {
  container: HTMLElement;
  textElement: HTMLElement | null;
  urn: string | null;
}

export const LINKEDIN_SELECTORS = {
  // Feed post container candidates (ordered by specificity)
  postContainers: [
    'div.feed-shared-update-v2',
    'article[data-urn^="urn:li:"]',
    'article',
    '[role="article"]',
    '[data-urn^="urn:li:activity:"]',
    '[data-urn^="urn:li:ugcPost:"]',
    'div[data-urn*="activity:"]',
    'div[data-urn*="ugcPost:"]',
    'div[data-id*="urn:li:activity:"]',
    'div[data-view-name="feed-full-update"]',
    '.occludable-update',
  ],

  // Post text content candidates
  postText: [
    '.feed-shared-update-v2__description-wrapper',
    '.feed-shared-update-v2__description',
    '.feed-shared-inline-show-more-text',
    '.update-components-text',
    '.attributed-text-segment-list__container',
    'div[dir="ltr"].feed-shared-update-v2__commentary',
    'div[data-view-name="feed-update-text"]',
  ],

  // Elements to ignore during text extraction
  excludedFromText: [
    '.visually-hidden',
    '.feed-shared-actor',
    '.update-components-actor',
    '.feed-shared-control-menu',
    '.feed-shared-social-actions',
    '.comments-comment-item',
    '.artdeco-button',
    '.social-details-social-counts',
    '.feed-shared-see-more-less-toggle',
    '.lsd-ui-element',
  ],

  // "See more" expansion buttons
  seeMoreButtons: [
    'button.feed-shared-inline-show-more-text__see-more-less-toggle',
    'button.see-more',
    '.feed-shared-see-more-less-toggle button',
  ],
};

/**
 * Finds all post containers within a given root or the document.
 */
export function findPostContainers(root: ParentNode = document): HTMLElement[] {
  const elements = new Set<HTMLElement>();

  for (const selector of LINKEDIN_SELECTORS.postContainers) {
    if (
      root instanceof HTMLElement &&
      root.matches(selector) &&
      isTopLevelPostContainer(root)
    ) {
      elements.add(root);
    }
    const matches = root.querySelectorAll<HTMLElement>(selector);
    for (let i = 0; i < matches.length; i++) {
      const el = matches[i];
      if (el && isTopLevelPostContainer(el)) {
        elements.add(el);
      }
    }
  }

  const headings: HTMLHeadingElement[] = [];
  if (root instanceof HTMLHeadingElement && isFeedPostHeading(root)) {
    headings.push(root);
  }
  headings.push(
    ...Array.from(root.querySelectorAll<HTMLHeadingElement>('h2')).filter(
      isFeedPostHeading,
    ),
  );
  for (const heading of headings) {
    const semanticContainer = heading.closest<HTMLElement>('[role="listitem"]');
    if (semanticContainer) elements.add(semanticContainer);
  }

  // LinkedIn periodically replaces post-card attributes while retaining its body-text
  // components. Discovering outward from those components gives the adapter a safe,
  // semantic fallback without treating arbitrary page containers as posts.
  for (const selector of LINKEDIN_SELECTORS.postText) {
    const textElements: HTMLElement[] = [];
    if (root instanceof HTMLElement && root.matches(selector)) textElements.push(root);
    textElements.push(...root.querySelectorAll<HTMLElement>(selector));

    for (const textElement of textElements) {
      const knownContainer = findClosestPostContainer(textElement);
      if (knownContainer) {
        elements.add(knownContainer);
        continue;
      }

      const semanticContainer = textElement.closest<HTMLElement>(
        'article, [role="article"]',
      );
      if (semanticContainer && isTopLevelPostContainer(semanticContainer)) {
        elements.add(semanticContainer);
      }
    }
  }

  return Array.from(elements);
}

export function findClosestPostContainer(node: Node): HTMLElement | null {
  const element = node instanceof HTMLElement ? node : node.parentElement;
  if (!element) return null;

  for (const selector of LINKEDIN_SELECTORS.postContainers) {
    const container = element.closest<HTMLElement>(selector);
    if (container && isTopLevelPostContainer(container)) return container;
  }

  const semanticContainer = element.closest<HTMLElement>('[role="listitem"]');
  if (semanticContainer && isSemanticFeedPost(semanticContainer)) {
    return semanticContainer;
  }
  return null;
}

export function isLinkedInHomeFeedUrl(url: URL): boolean {
  return /^\/feed\/?$/.test(url.pathname);
}

export function isLinkedInPostPageUrl(url: URL): boolean {
  return /^\/(?:posts\/|feed\/update\/)/.test(url.pathname);
}

/**
 * Ensures we target the actual post card and not a nested sub-component.
 */
function isTopLevelPostContainer(el: HTMLElement): boolean {
  // If the element has a parent that is also a post container, only keep the outermost
  let parent = el.parentElement;
  while (parent) {
    for (const selector of LINKEDIN_SELECTORS.postContainers) {
      if (parent.matches && parent.matches(selector)) {
        return false;
      }
    }
    parent = parent.parentElement;
  }
  return true;
}

/**
 * Resolves post elements (container, text element, and URN identifier).
 */
export function resolvePostElements(container: HTMLElement): LinkedInPostElements {
  let textElement: HTMLElement | null = null;

  for (const selector of LINKEDIN_SELECTORS.postText) {
    const el = container.querySelector<HTMLElement>(selector);
    if (el) {
      textElement = el;
      break;
    }
  }

  textElement ??= findLikelyPostBody(container);

  const urn =
    container.getAttribute('data-urn') ||
    container.getAttribute('data-id') ||
    container.getAttribute('id') ||
    null;

  return {
    container,
    textElement,
    urn,
  };
}

function isFeedPostHeading(heading: HTMLHeadingElement): boolean {
  return heading.textContent?.trim().toLocaleLowerCase() === 'feed post';
}

function isSemanticFeedPost(container: HTMLElement): boolean {
  return Array.from(container.querySelectorAll<HTMLHeadingElement>('h2')).some(
    isFeedPostHeading,
  );
}

function findLikelyPostBody(container: HTMLElement): HTMLElement | null {
  const paragraphs = Array.from(container.querySelectorAll<HTMLElement>('p')).filter(
    (paragraph) => {
      const text = paragraph.textContent?.trim() || '';
      if (text.length === 0) return false;
      if (paragraph.closest('a, button, [aria-hidden="true"]')) return false;
      return !LINKEDIN_SELECTORS.excludedFromText.some((selector) =>
        paragraph.matches(selector),
      );
    },
  );

  return (
    paragraphs.sort(
      (left, right) =>
        (right.textContent?.trim().length || 0) - (left.textContent?.trim().length || 0),
    )[0] || null
  );
}
