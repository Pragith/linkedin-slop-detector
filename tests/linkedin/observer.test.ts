import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SlopDetector } from '../../src/core/detector';
import { LinkedInObserver } from '../../src/linkedin/observer';
import { DEFAULT_RULES } from '../../src/rules/defaultRules';
import { DEFAULT_SETTINGS } from '../../src/storage/defaultSettings';

describe('LinkedInObserver', () => {
  let observer: LinkedInObserver | null = null;

  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <div class="feed-shared-update-v2" data-urn="urn:li:activity:1">
          <div class="feed-shared-update-v2__description">It is not just a tool.</div>
        </div>
      </main>
    `;
  });

  afterEach(() => {
    observer?.stop();
    observer = null;
  });

  it('keeps highlighted text stable and reprocesses changed post text', async () => {
    observer = new LinkedInObserver(
      new SlopDetector([...DEFAULT_RULES]),
      DEFAULT_SETTINGS,
    );
    observer.start();
    await nextFrame();

    const textElement = document.querySelector<HTMLElement>(
      '.feed-shared-update-v2__description',
    )!;
    expect(observer.getStats()).toMatchObject({ postsScanned: 1, postsMatched: 1 });
    expect(textElement.textContent).toBe('It is not just a tool.');
    expect(textElement.querySelector('.lsd-highlight')).not.toBeNull();

    await nextFrame();
    expect(observer.getStats()).toMatchObject({ postsScanned: 1, postsMatched: 1 });

    textElement.textContent = 'A plain project update with concrete numbers.';
    await nextFrame();
    expect(observer.getStats()).toMatchObject({ postsScanned: 1, postsMatched: 0 });
    expect(textElement.querySelector('.lsd-highlight')).toBeNull();
  });
});

async function nextFrame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}
