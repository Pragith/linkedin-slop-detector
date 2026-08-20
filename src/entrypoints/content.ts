import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { SlopDetector } from '../core/detector';
import { RuleRepository } from '../rules/ruleRepository';
import { SettingsRepository } from '../storage/settingsRepository';
import { LinkedInObserver } from '../linkedin/observer';
import '../styles/injected.css';

export default defineContentScript({
  matches: ['*://*.linkedin.com/*'],
  cssInjectionMode: 'manifest',
  main() {
    console.log('[LinkedIn Slop Detector] Content script initialized.');

    const settingsRepo = SettingsRepository.getInstance();
    const ruleRepo = new RuleRepository();
    const detector = new SlopDetector();

    let observer: LinkedInObserver | null = null;

    // Register immediately so the popup can distinguish initialization from a missing
    // content script instead of presenting silent zeroes.
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'GET_PAGE_STATS') {
        const stats = observer
          ? observer.getStats()
          : { postsScanned: 0, postsMatched: 0, postsHidden: 0, postsCollapsed: 0 };
        const showHidden = observer ? observer.getGlobalShowHidden() : false;
        sendResponse({
          connected: true,
          initialized: observer !== null,
          stats,
          showHidden,
        });
        return true;
      }

      if (message.type === 'SET_GLOBAL_SHOW_HIDDEN') {
        if (observer) observer.setGlobalShowHidden(Boolean(message.payload));
        sendResponse({ success: observer !== null });
        return true;
      }

      return false;
    });

    async function init() {
      const state = await settingsRepo.getState();
      const activeRules = ruleRepo.getActiveRules(state.ruleOverrides, state.customRules);
      detector.setRules(activeRules);

      observer = new LinkedInObserver(detector, state.settings, (stats) => {
        // Notify background / popup if needed
        try {
          browser.runtime
            .sendMessage({
              type: 'PAGE_STATS_UPDATED',
              payload: stats,
            })
            .catch(() => {
              // Popup may not be open, safe to ignore
            });
        } catch {
          // Ignore context invalidated
        }
      });

      if (state.settings.enabled) {
        observer.start();
      }

      // Subscribe to real-time storage changes
      settingsRepo.onChanged((newState) => {
        const updatedActiveRules = ruleRepo.getActiveRules(
          newState.ruleOverrides,
          newState.customRules,
        );
        detector.setRules(updatedActiveRules);

        if (observer) {
          observer.updateConfiguration(detector, newState.settings);

          if (newState.settings.enabled) {
            observer.start();
          } else {
            observer.stop();
          }
        }
      });
    }

    init().catch((err) => {
      console.error('[LinkedIn Slop Detector] Initialization error:', err);
    });
  },
});
