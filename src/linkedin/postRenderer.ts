import { DetectionResult, ExtensionSettings } from '../core/types';
import { resolveNonOverlappingMatches } from '../core/matcher';
import { LinkedInPostElements } from './adapter';
import { extractPostTextWithSegments } from './postExtractor';

export const LSD_CLASS_PREFIX = 'lsd-';
export const LSD_POST_PROCESSED_ATTR = 'data-lsd-processed';
export const LSD_FINGERPRINT_ATTR = 'data-lsd-fingerprint';

const originalDisplayValues = new WeakMap<HTMLElement, string>();

export function applyHighlights(
  textElement: HTMLElement,
  result: DetectionResult,
  highlightColor = '#FEF08A',
): void {
  removeHighlights(textElement);
  if (result.matches.length === 0) return;

  const { segments } = extractPostTextWithSegments(textElement);
  const matches = resolveNonOverlappingMatches(result.matches).reverse();

  for (const match of matches) {
    for (const segment of segments) {
      const overlapStart = Math.max(match.start, segment.start);
      const overlapEnd = Math.min(match.end, segment.end);
      if (overlapStart >= overlapEnd || !segment.node.isConnected) continue;

      try {
        const range = document.createRange();
        range.setStart(segment.node, overlapStart - segment.start);
        range.setEnd(segment.node, overlapEnd - segment.start);

        const mark = document.createElement('mark');
        mark.className = 'lsd-highlight lsd-ui-element';
        mark.style.backgroundColor = highlightColor;
        mark.title = `${match.ruleName} (+${match.weight})`;
        mark.dataset.lsdRule = match.ruleId;
        range.surroundContents(mark);
      } catch (error) {
        console.debug('[SlopDetector] Could not highlight a text range:', error);
      }
    }
  }
}

export function removeHighlights(textElement: HTMLElement): void {
  const marks = textElement.querySelectorAll<HTMLElement>('.lsd-highlight');
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }
}

export function injectBadge(
  container: HTMLElement,
  result: DetectionResult,
  settings: ExtensionSettings,
): void {
  container.querySelector('.lsd-badge')?.remove();
  if (!settings.postActions.showBadge || result.score <= 0) return;

  const wrapper = document.createElement('div');
  wrapper.className = `lsd-badge lsd-ui-element lsd-badge-${settings.badgePosition}`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'lsd-badge-trigger';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', badgeAriaLabel(result, settings));

  const score = document.createElement('span');
  score.className = 'lsd-badge-score';
  score.textContent = settings.postActions.showScore ? `Slop: ${result.score}` : 'Slop';
  button.appendChild(score);

  if (settings.postActions.showMatchCount) {
    const count = document.createElement('span');
    count.className = 'lsd-badge-count';
    count.textContent = `(${result.stats.totalMatches} matches)`;
    button.appendChild(count);
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleBadgePopover(wrapper, button, result);
  });
  wrapper.appendChild(button);
  container.appendChild(wrapper);
}

function badgeAriaLabel(result: DetectionResult, settings: ExtensionSettings): string {
  const parts = ['Slop detection details'];
  if (settings.postActions.showScore) parts.push(`score ${result.score}`);
  if (settings.postActions.showMatchCount) {
    parts.push(`${result.stats.totalMatches} matches`);
  }
  return parts.join(', ');
}

function toggleBadgePopover(
  wrapper: HTMLElement,
  trigger: HTMLButtonElement,
  result: DetectionResult,
): void {
  const existing = wrapper.querySelector<HTMLElement>('.lsd-popover');
  if (existing) {
    existing.remove();
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
    return;
  }

  const popover = document.createElement('div');
  popover.className = 'lsd-popover lsd-ui-element';
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-label', 'Slop pattern breakdown');

  const header = createElement('div', 'lsd-popover-header');
  const title = createElement(
    'div',
    'lsd-popover-title',
    `Pattern breakdown (score: ${result.score})`,
  );
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'lsd-popover-close';
  close.setAttribute('aria-label', 'Close pattern breakdown');
  close.textContent = 'Close';
  header.append(title, close);

  const body = createElement('div', 'lsd-popover-body');
  for (const match of result.matches) {
    const row = createElement('div', 'lsd-popover-item');
    const info = createElement('div', 'lsd-popover-rule-info');
    info.append(
      createElement('span', 'lsd-popover-rule-name', match.ruleName),
      createElement('span', 'lsd-popover-matched-text', `“${match.matchedText}”`),
    );
    row.append(info, createElement('span', 'lsd-popover-score', `+${match.weight}`));
    body.appendChild(row);
  }

  if (result.stats.diversityBonusApplied) {
    const bonus = createElement('div', 'lsd-popover-item lsd-popover-bonus');
    bonus.append(
      createElement(
        'span',
        'lsd-popover-rule-name',
        `Category diversity bonus (${result.stats.distinctCategoryCount} categories)`,
      ),
      createElement('span', 'lsd-popover-score', `+${result.stats.diversityBonus}`),
    );
    body.appendChild(bonus);
  }

  const footer = createElement(
    'div',
    'lsd-popover-footer',
    `Normalized: ${result.normalizedScore} points per 100 words`,
  );
  popover.append(header, body, footer);

  const dismiss = (): void => {
    popover.remove();
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  };
  close.addEventListener('click', (event) => {
    event.stopPropagation();
    dismiss();
  });
  popover.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') dismiss();
  });

  wrapper.appendChild(popover);
  trigger.setAttribute('aria-expanded', 'true');
  close.focus();
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function setCollapsedState(
  container: HTMLElement,
  result: DetectionResult,
  isCollapsed: boolean,
  onToggleReveal: (revealed: boolean) => void,
): void {
  let placeholder = container.querySelector<HTMLElement>('.lsd-collapsed-placeholder');

  if (!isCollapsed) {
    placeholder?.remove();
    container.classList.remove('lsd-is-collapsed');
    restoreContainerChildren(container);
    return;
  }

  container.classList.add('lsd-is-collapsed');
  hideContainerChildren(container);

  if (!placeholder) {
    placeholder = createElement('div', 'lsd-collapsed-placeholder lsd-ui-element');
    const content = createElement('div', 'lsd-placeholder-content');
    const text = createElement('div', 'lsd-placeholder-text');
    text.append(
      createElement('strong', '', 'Hidden by Slop Detector'),
      createElement('span', 'lsd-placeholder-subtext'),
    );
    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.className = 'lsd-placeholder-btn';
    reveal.textContent = 'Show post';
    reveal.setAttribute('aria-label', 'Show hidden post content');
    reveal.addEventListener('click', (event) => {
      event.stopPropagation();
      onToggleReveal(true);
    });
    content.append(text, reveal);
    placeholder.appendChild(content);
    container.appendChild(placeholder);
  }

  const summary = placeholder.querySelector<HTMLElement>('.lsd-placeholder-subtext');
  if (summary) {
    summary.textContent = `Score: ${result.score} · ${result.stats.totalMatches} matched patterns`;
  }

  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && container.contains(activeElement)) {
    placeholder.querySelector<HTMLButtonElement>('.lsd-placeholder-btn')?.focus();
  }
}

function hideContainerChildren(container: HTMLElement): void {
  for (const child of container.children) {
    if (!(child instanceof HTMLElement) || child.classList.contains('lsd-ui-element')) {
      continue;
    }
    if (!originalDisplayValues.has(child))
      originalDisplayValues.set(child, child.style.display);
    child.style.display = 'none';
  }
}

function restoreContainerChildren(container: HTMLElement): void {
  for (const child of container.children) {
    if (!(child instanceof HTMLElement) || child.classList.contains('lsd-ui-element')) {
      continue;
    }
    const originalDisplay = originalDisplayValues.get(child);
    if (originalDisplay !== undefined) {
      child.style.display = originalDisplay;
      originalDisplayValues.delete(child);
    }
  }
}

export function renderPostActions(
  elements: LinkedInPostElements,
  result: DetectionResult,
  settings: ExtensionSettings,
  isTemporarilyRevealed = false,
  globalShowHidden = false,
  onToggleReveal: (revealed: boolean) => void = () => {},
): void {
  const { container, textElement } = elements;
  container.classList.remove(
    'lsd-outline',
    'lsd-dimmed',
    'lsd-hidden',
    'lsd-action-applied',
  );

  if (!settings.enabled || !result.shouldAct) {
    resetPostRender(elements);
    return;
  }

  container.classList.add('lsd-action-applied');
  const isFiltered = !isTemporarilyRevealed && !globalShowHidden;
  const shouldHide = settings.postActions.hide && isFiltered;
  const shouldCollapse = !shouldHide && settings.postActions.collapse && isFiltered;

  if (settings.postActions.outline && !isTemporarilyRevealed) {
    container.classList.add('lsd-outline');
    container.style.setProperty('--lsd-outline-color', settings.outlineColor);
  } else {
    container.style.removeProperty('--lsd-outline-color');
  }

  if (settings.postActions.dim && !isTemporarilyRevealed) {
    container.classList.add('lsd-dimmed');
  }

  if (shouldHide) {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && container.contains(activeElement)) {
      activeElement.blur();
    }
    container.classList.add('lsd-hidden');
  }
  setCollapsedState(container, result, shouldCollapse, onToggleReveal);

  if (textElement && settings.postActions.highlight && !shouldHide && !shouldCollapse) {
    applyHighlights(textElement, result, settings.highlightColor);
  } else if (textElement) {
    removeHighlights(textElement);
  }

  injectBadge(container, result, settings);
}

export function resetPostRender(elements: LinkedInPostElements): void {
  const { container, textElement } = elements;
  container.classList.remove(
    'lsd-outline',
    'lsd-dimmed',
    'lsd-hidden',
    'lsd-action-applied',
    'lsd-is-collapsed',
  );
  container.style.removeProperty('--lsd-outline-color');
  restoreContainerChildren(container);
  container.querySelector('.lsd-collapsed-placeholder')?.remove();
  container.querySelector('.lsd-badge')?.remove();
  if (textElement) removeHighlights(textElement);
}
