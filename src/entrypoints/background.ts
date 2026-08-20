import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { SettingsRepository } from '../storage/settingsRepository';

export default defineBackground(() => {
  console.log('[LinkedIn Slop Detector] Service worker active.');

  // Initialize storage defaults if new installation
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install' || details.reason === 'update') {
      const repo = SettingsRepository.getInstance();
      await repo.loadState();
      console.log(`[LinkedIn Slop Detector] Lifecycle event: ${details.reason}`);
    }
  });

  // Handle messages from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PAGE_STATS_UPDATED' && sender.tab?.id) {
      const stats = message.payload;
      const tabId = sender.tab.id;

      if (stats.postsMatched > 0) {
        browser.action.setBadgeText({ tabId, text: String(stats.postsMatched) });
        browser.action.setBadgeBackgroundColor({ tabId, color: '#F59E0B' });
      } else {
        browser.action.setBadgeText({ tabId, text: '' });
      }
      sendResponse({ received: true });
      return true;
    }
    return false;
  });
});
