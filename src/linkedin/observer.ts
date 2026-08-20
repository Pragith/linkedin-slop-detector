import { SlopDetector } from '../core/detector';
import { ExtensionSettings, PageDetectionStats, PostElementState } from '../core/types';
import { generateTextFingerprint } from '../core/normalization';
import {
  findClosestPostContainer,
  findPostContainers,
  isLinkedInHomeFeedUrl,
  isLinkedInPostPageUrl,
  LINKEDIN_SELECTORS,
  resolvePostElements,
} from './adapter';
import { extractPostText } from './postExtractor';
import {
  renderPostActions,
  resetPostRender,
  LSD_POST_PROCESSED_ATTR,
  LSD_FINGERPRINT_ATTR,
} from './postRenderer';

export class LinkedInObserver {
  private detector: SlopDetector;
  private settings: ExtensionSettings;
  private observer: MutationObserver | null = null;
  private routeCheckIntervalId: number | null = null;
  private lastObservedUrl = '';
  private postStates = new Map<HTMLElement, PostElementState>();
  private pendingRoots = new Set<Node>();
  private animationFrameId: number | null = null;
  private globalShowHidden = false;
  private onStatsChange?: (stats: PageDetectionStats) => void;

  constructor(
    detector: SlopDetector,
    settings: ExtensionSettings,
    onStatsChange?: (stats: PageDetectionStats) => void,
  ) {
    this.detector = detector;
    this.settings = settings;
    this.onStatsChange = onStatsChange;
  }

  updateConfiguration(detector: SlopDetector, settings: ExtensionSettings): void {
    this.detector = detector;
    this.settings = settings;
    this.reprocessAllPosts();
    this.scheduleProcess(document);
  }

  setGlobalShowHidden(show: boolean): void {
    this.globalShowHidden = show;
    this.reprocessAllPosts();
  }

  getGlobalShowHidden(): boolean {
    return this.globalShowHidden;
  }

  start(): void {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (isExtensionOwnedMutation(mutation)) continue;

        if (mutation.type === 'characterData') {
          this.scheduleProcess(mutation.target);
          continue;
        }

        this.scheduleProcess(mutation.target);
        for (const node of mutation.addedNodes) this.scheduleProcess(node);
      }
    });

    this.observer.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    document.addEventListener('click', this.handleDocumentClick, true);
    this.lastObservedUrl = window.location.href;
    this.routeCheckIntervalId = window.setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl === this.lastObservedUrl) return;
      this.lastObservedUrl = currentUrl;
      this.scheduleProcess(document);
    }, 500);
    this.scheduleProcess(document);
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.routeCheckIntervalId !== null) {
      window.clearInterval(this.routeCheckIntervalId);
      this.routeCheckIntervalId = null;
    }
    this.lastObservedUrl = '';
    document.removeEventListener('click', this.handleDocumentClick, true);
    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.pendingRoots.clear();
    this.clearAll();
  }

  private handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    for (const selector of LINKEDIN_SELECTORS.seeMoreButtons) {
      if (target.matches(selector) || target.closest(selector)) {
        window.setTimeout(() => this.scheduleProcess(target), 100);
        return;
      }
    }
  };

  private scheduleProcess(root: Node): void {
    if (!this.observer) return;
    this.pendingRoots.add(root);
    if (this.animationFrameId !== null) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      const roots = [...this.pendingRoots];
      this.pendingRoots.clear();
      this.processRoots(roots);
    });
  }

  private processRoots(roots: Node[]): void {
    if (!this.isCurrentPageEnabled()) {
      this.clearAll();
      return;
    }

    const containers = new Set<HTMLElement>();
    for (const root of roots) {
      const closest = findClosestPostContainer(root);
      if (closest) containers.add(closest);

      if (root instanceof Document || root instanceof HTMLElement) {
        for (const container of findPostContainers(root)) containers.add(container);
      }
    }

    for (const container of containers) this.processPost(container);
    this.pruneDetachedPosts();
    this.observer?.takeRecords();
    this.emitStats();
  }

  private processPost(container: HTMLElement): void {
    const elements = resolvePostElements(container);
    const text = extractPostText(elements);
    const fingerprint = generateTextFingerprint(text);
    const existingState = this.postStates.get(container);

    if (existingState?.processed && existingState.lastTextFingerprint === fingerprint) {
      return;
    }

    const result = this.detector.detect(text, this.settings);
    const state: PostElementState = {
      id: elements.urn || fingerprint,
      processed: true,
      lastTextFingerprint: fingerprint,
      // A recycled node represents a different post and must not inherit reveal state.
      isTemporarilyRevealed:
        existingState?.lastTextFingerprint === fingerprint
          ? existingState.isTemporarilyRevealed
          : false,
      result,
    };

    this.postStates.set(container, state);
    container.setAttribute(LSD_POST_PROCESSED_ATTR, 'true');
    container.setAttribute(LSD_FINGERPRINT_ATTR, fingerprint);
    this.renderPost(elements, state);
  }

  private renderPost(
    elements: ReturnType<typeof resolvePostElements>,
    state: PostElementState,
  ): void {
    if (!state.result) return;
    renderPostActions(
      elements,
      state.result,
      this.settings,
      state.isTemporarilyRevealed,
      this.globalShowHidden,
      (revealed) => {
        state.isTemporarilyRevealed = revealed;
        this.renderPost(elements, state);
        this.observer?.takeRecords();
        this.emitStats();
      },
    );
  }

  private reprocessAllPosts(): void {
    if (!this.isCurrentPageEnabled()) {
      this.clearAll();
      return;
    }

    this.pruneDetachedPosts();
    for (const [container, state] of this.postStates) {
      const elements = resolvePostElements(container);
      const text = extractPostText(elements);
      const fingerprint = generateTextFingerprint(text);
      if (state.lastTextFingerprint !== fingerprint) {
        state.isTemporarilyRevealed = false;
        state.lastTextFingerprint = fingerprint;
        container.setAttribute(LSD_FINGERPRINT_ATTR, fingerprint);
      }
      state.result = this.detector.detect(text, this.settings);
      this.renderPost(elements, state);
    }
    this.observer?.takeRecords();
    this.emitStats();
  }

  private isCurrentPageEnabled(): boolean {
    if (!this.settings.enabled) return false;
    const url = new URL(window.location.href);
    if (isLinkedInHomeFeedUrl(url)) return this.settings.enableOnHomeFeed;
    if (isLinkedInPostPageUrl(url)) return this.settings.enableOnPostPages;
    return false;
  }

  private pruneDetachedPosts(): void {
    for (const container of this.postStates.keys()) {
      if (!document.contains(container)) this.postStates.delete(container);
    }
  }

  private clearAll(): void {
    for (const container of this.postStates.keys()) {
      if (!document.contains(container)) continue;
      resetPostRender(resolvePostElements(container));
      container.removeAttribute(LSD_POST_PROCESSED_ATTR);
      container.removeAttribute(LSD_FINGERPRINT_ATTR);
    }
    this.postStates.clear();
    this.observer?.takeRecords();
    this.emitStats();
  }

  private calculateStats(): PageDetectionStats {
    const stats: PageDetectionStats = {
      postsScanned: 0,
      postsMatched: 0,
      postsHidden: 0,
      postsCollapsed: 0,
    };

    for (const [container, state] of this.postStates) {
      if (!document.contains(container)) continue;
      stats.postsScanned++;
      if (!state.result?.shouldAct) continue;
      stats.postsMatched++;
      if (
        this.settings.postActions.hide &&
        !this.globalShowHidden &&
        !state.isTemporarilyRevealed
      ) {
        stats.postsHidden++;
      } else if (
        this.settings.postActions.collapse &&
        !this.globalShowHidden &&
        !state.isTemporarilyRevealed
      ) {
        stats.postsCollapsed++;
      }
    }
    return stats;
  }

  private emitStats(): void {
    this.onStatsChange?.(this.calculateStats());
  }

  getStats(): PageDetectionStats {
    return this.calculateStats();
  }
}

function isExtensionOwnedMutation(mutation: MutationRecord): boolean {
  if (mutation.type === 'characterData') {
    return mutation.target.parentElement?.closest('.lsd-ui-element') !== null;
  }

  const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
  return (
    changedNodes.length > 0 &&
    changedNodes.every((node) => {
      const element = node instanceof HTMLElement ? node : node.parentElement;
      return element?.closest('.lsd-ui-element') !== null;
    })
  );
}
