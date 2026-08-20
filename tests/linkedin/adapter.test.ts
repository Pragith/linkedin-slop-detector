import { describe, it, expect, beforeEach } from 'vitest';
import { findPostContainers, resolvePostElements } from '../../src/linkedin/adapter';
import { extractPostText } from '../../src/linkedin/postExtractor';
import {
  applyHighlights,
  removeHighlights,
  injectBadge,
  setCollapsedState,
  renderPostActions,
  resetPostRender,
} from '../../src/linkedin/postRenderer';
import { DetectionResult } from '../../src/core/types';
import { DEFAULT_SETTINGS } from '../../src/storage/defaultSettings';

describe('LinkedIn DOM Adapter and Post Renderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('discovers LinkedIn post containers in DOM fixture', () => {
    document.body.innerHTML = `
      <div id="feed">
        <div class="feed-shared-update-v2" data-urn="urn:li:activity:1001">
          <div class="feed-shared-update-v2__description">Post 1 Content</div>
        </div>
        <div class="feed-shared-update-v2" data-urn="urn:li:activity:1002">
          <div class="feed-shared-update-v2__description">Post 2 Content</div>
        </div>
      </div>
    `;

    const containers = findPostContainers(document);
    expect(containers.length).toBe(2);

    const elements1 = resolvePostElements(containers[0]!);
    expect(elements1.urn).toBe('urn:li:activity:1001');
    expect(elements1.textElement).not.toBeNull();
  });

  it('discovers semantic article containers from current post body components', () => {
    document.body.innerHTML = `
      <main>
        <article role="article">
          <div data-view-name="feed-update-text">It's not just engineering. It's every field.</div>
        </article>
      </main>
    `;

    const containers = findPostContainers(document);
    expect(containers).toHaveLength(1);
    expect(containers[0]?.tagName).toBe('ARTICLE');
    expect(resolvePostElements(containers[0]!).textElement?.textContent).toContain(
      "It's not just engineering",
    );
  });

  it('discovers the generated-class LinkedIn feed markup and isolates its body', () => {
    document.body.innerHTML = `
      <main>
        <div role="list">
          <div role="listitem" class="generated-card-class">
            <h2>Feed post</h2>
            <p>Author Name</p>
            <p>Operations Executive and Engineering Leader</p>
            <p>It's not just engineering. It's every field. Absolutely.</p>
            <button><p>Follow</p></button>
          </div>
        </div>
      </main>
    `;

    const containers = findPostContainers(document);
    expect(containers).toHaveLength(1);
    const elements = resolvePostElements(containers[0]!);
    expect(elements.textElement?.textContent).toBe(
      "It's not just engineering. It's every field. Absolutely.",
    );
    expect(extractPostText(elements)).not.toContain('Author Name');
  });

  it('extracts post text while ignoring buttons, actors, and visually hidden elements', () => {
    document.body.innerHTML = `
      <div class="feed-shared-update-v2" data-urn="urn:li:activity:1001">
        <div class="update-components-actor">
          <span class="actor-name">John Doe</span>
        </div>
        <div class="feed-shared-update-v2__description">
          This is the visible post body.
          <span class="visually-hidden">Screen reader text</span>
          <button class="artdeco-button">Follow</button>
        </div>
      </div>
    `;

    const container = document.querySelector<HTMLElement>('.feed-shared-update-v2')!;
    const elements = resolvePostElements(container);
    const text = extractPostText(elements).trim();

    expect(text).toContain('This is the visible post body.');
    expect(text).not.toContain('John Doe');
    expect(text).not.toContain('Screen reader text');
    expect(text).not.toContain('Follow');
  });

  it('applies contrast-safe non-destructive highlighting and removes cleanly', () => {
    document.body.innerHTML = `
      <div class="text-container">It is not just about AI.</div>
    `;

    const textEl = document.querySelector<HTMLElement>('.text-container')!;
    const mockResult: DetectionResult = {
      score: 4,
      normalizedScore: 66.7,
      matches: [
        {
          ruleId: 'contrast-not-just',
          ruleName: 'Not Just X',
          category: 'contrast',
          start: 0,
          end: 14,
          matchedText: 'It is not just',
          weight: 4,
          severity: 4,
        },
      ],
      matchedRuleIds: ['contrast-not-just'],
      categories: ['contrast'],
      stats: {
        totalMatches: 1,
        distinctRuleCount: 1,
        distinctCategoryCount: 1,
        wordCount: 6,
        diversityBonusApplied: false,
        diversityBonus: 0,
        densityScore: 0,
      },
      shouldAct: true,
      recommendedAction: 'highlight',
    };

    applyHighlights(textEl, mockResult);
    expect(textEl.querySelector('mark.lsd-highlight')).not.toBeNull();
    expect(textEl.querySelector('mark.lsd-highlight')?.textContent).toBe(
      'It is not just',
    );
    const lightHighlight = textEl.querySelector<HTMLElement>('mark.lsd-highlight')!;
    expect(lightHighlight.style.getPropertyValue('--lsd-highlight-bg')).toBe('#FEF08A');
    expect(lightHighlight.style.getPropertyValue('--lsd-highlight-text')).toBe('#000000');
    expect(extractPostText({ container: textEl, textElement: textEl, urn: null })).toBe(
      'It is not just about AI.',
    );

    // Remove highlights cleanly
    removeHighlights(textEl);
    expect(textEl.querySelector('mark.lsd-highlight')).toBeNull();
    expect(textEl.textContent).toBe('It is not just about AI.');

    applyHighlights(textEl, mockResult, '#1F2937');
    const darkHighlight = textEl.querySelector<HTMLElement>('mark.lsd-highlight')!;
    expect(darkHighlight.style.getPropertyValue('--lsd-highlight-bg')).toBe('#1F2937');
    expect(darkHighlight.style.getPropertyValue('--lsd-highlight-text')).toBe('#FFFFFF');
  });

  it('injects badge and toggles breakdown popover', () => {
    document.body.innerHTML = `
      <div class="feed-shared-update-v2">
        <div class="feed-shared-update-v2__description">Post Content</div>
      </div>
    `;

    const container = document.querySelector<HTMLElement>('.feed-shared-update-v2')!;
    const mockResult: DetectionResult = {
      score: 7,
      normalizedScore: 70,
      matches: [
        {
          ruleId: 'r1',
          ruleName: 'Rule 1',
          category: 'contrast',
          start: 0,
          end: 4,
          matchedText: 'Post',
          weight: 4,
          severity: 4,
        },
        {
          ruleId: 'r2',
          ruleName: 'Rule 2',
          category: 'canned-opener',
          start: 5,
          end: 12,
          matchedText: 'Content',
          weight: 3,
          severity: 3,
        },
      ],
      matchedRuleIds: ['r1', 'r2'],
      categories: ['contrast', 'canned-opener'],
      stats: {
        totalMatches: 2,
        distinctRuleCount: 2,
        distinctCategoryCount: 2,
        wordCount: 2,
        diversityBonusApplied: false,
        diversityBonus: 0,
        densityScore: 0,
      },
      shouldAct: true,
      recommendedAction: 'outline',
    };

    injectBadge(container, mockResult, DEFAULT_SETTINGS);
    const badge = container.querySelector<HTMLElement>('.lsd-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toContain('Slop: 7');

    // Click badge to show popover
    badge?.querySelector<HTMLButtonElement>('.lsd-badge-trigger')?.click();
    const popover = badge?.querySelector('.lsd-popover');
    expect(popover).not.toBeNull();
    expect(popover?.textContent).toContain('Rule 1');
    expect(popover?.textContent).toContain('Rule 2');
  });

  it('renders collapse state and allows user reveal', () => {
    document.body.innerHTML = `
      <div class="feed-shared-update-v2">
        <div class="feed-shared-update-v2__description">Post Content</div>
      </div>
    `;

    const container = document.querySelector<HTMLElement>('.feed-shared-update-v2')!;
    const mockResult: DetectionResult = {
      score: 8,
      normalizedScore: 80,
      matches: [],
      matchedRuleIds: [],
      categories: [],
      stats: {
        totalMatches: 2,
        distinctRuleCount: 2,
        distinctCategoryCount: 2,
        wordCount: 2,
        diversityBonusApplied: false,
        diversityBonus: 0,
        densityScore: 0,
      },
      shouldAct: true,
      recommendedAction: 'collapse',
    };

    let revealed = false;
    setCollapsedState(container, mockResult, true, (r) => {
      revealed = r;
    });

    expect(container.classList.contains('lsd-is-collapsed')).toBe(true);
    const placeholder = container.querySelector<HTMLElement>(
      '.lsd-collapsed-placeholder',
    )!;
    expect(placeholder).not.toBeNull();

    // Click reveal button
    const btn = placeholder.querySelector<HTMLButtonElement>('.lsd-placeholder-btn')!;
    btn.click();
    expect(revealed).toBe(true);
  });

  it('restores pre-existing inline display values after collapse', () => {
    document.body.innerHTML = `
      <div class="feed-shared-update-v2">
        <div class="feed-shared-update-v2__description" style="display: flex">Post Content</div>
      </div>
    `;
    const container = document.querySelector<HTMLElement>('.feed-shared-update-v2')!;
    const result: DetectionResult = {
      score: 4,
      normalizedScore: 4,
      matches: [],
      matchedRuleIds: [],
      categories: [],
      stats: {
        totalMatches: 1,
        distinctRuleCount: 1,
        distinctCategoryCount: 1,
        wordCount: 2,
        diversityBonusApplied: false,
        diversityBonus: 0,
        densityScore: 0,
      },
      shouldAct: true,
      recommendedAction: 'collapse',
    };

    setCollapsedState(container, result, true, () => {});
    setCollapsedState(container, result, false, () => {});
    expect(container.firstElementChild).toHaveStyle({ display: 'flex' });
  });

  it('resets all post rendering cleanly', () => {
    document.body.innerHTML = `
      <div class="feed-shared-update-v2">
        <div class="feed-shared-update-v2__description">Sample text</div>
      </div>
    `;

    const container = document.querySelector<HTMLElement>('.feed-shared-update-v2')!;
    const elements = resolvePostElements(container);

    const mockResult: DetectionResult = {
      score: 8,
      normalizedScore: 80,
      matches: [],
      matchedRuleIds: [],
      categories: [],
      stats: {
        totalMatches: 2,
        distinctRuleCount: 2,
        distinctCategoryCount: 2,
        wordCount: 2,
        diversityBonusApplied: false,
        diversityBonus: 0,
        densityScore: 0,
      },
      shouldAct: true,
      recommendedAction: 'outline',
    };

    renderPostActions(elements, mockResult, DEFAULT_SETTINGS);
    expect(container.classList.contains('lsd-outline')).toBe(true);

    resetPostRender(elements);
    expect(container.classList.contains('lsd-outline')).toBe(false);
    expect(container.classList.contains('lsd-action-applied')).toBe(false);
  });
});
