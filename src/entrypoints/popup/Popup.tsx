import React, { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { SettingsRepository } from '../../storage/settingsRepository';
import { ExtensionSettings, PageDetectionStats } from '../../core/types';
import './popup.css';

export const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [stats, setStats] = useState<PageDetectionStats>({
    postsScanned: 0,
    postsMatched: 0,
    postsHidden: 0,
    postsCollapsed: 0,
  });
  const [showHidden, setShowHidden] = useState(false);
  const [isLinkedInTab, setIsLinkedInTab] = useState(false);
  const [connectionState, setConnectionState] = useState<
    'loading' | 'connected' | 'unavailable'
  >('loading');

  const settingsRepo = SettingsRepository.getInstance();

  useEffect(() => {
    async function loadData() {
      const state = await settingsRepo.getState();
      setSettings(state.settings);

      // Query active tab for live stats
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url && isLinkedInUrl(tab.url)) {
        setIsLinkedInTab(true);
        browser.tabs
          .sendMessage(tab.id, { type: 'GET_PAGE_STATS' })
          .then((response) => {
            if (response) {
              setConnectionState(response.connected ? 'connected' : 'unavailable');
              if (response.stats) setStats(response.stats);
              if (response.showHidden !== undefined) setShowHidden(response.showHidden);
            }
          })
          .catch(() => {
            setConnectionState('unavailable');
          });
      } else {
        setConnectionState('unavailable');
      }
    }

    loadData();

    const unsub = settingsRepo.onChanged((newState) => {
      setSettings(newState.settings);
    });

    return () => unsub();
  }, [settingsRepo]);

  const handleToggleEnabled = async () => {
    if (!settings) return;
    const updated = await settingsRepo.updateSettings({ enabled: !settings.enabled });
    setSettings(updated);
  };

  const handleThresholdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!settings || isNaN(val)) return;
    const updated = await settingsRepo.updateSettings({ scoreThreshold: val });
    setSettings(updated);
  };

  const handleToggleShowHidden = async () => {
    const nextVal = !showHidden;
    setShowHidden(nextVal);
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      try {
        await browser.tabs.sendMessage(tab.id, {
          type: 'SET_GLOBAL_SHOW_HIDDEN',
          payload: nextVal,
        });
      } catch {
        setShowHidden(!nextVal);
      }
    }
  };

  const handleOpenOptions = () => {
    browser.runtime.openOptionsPage();
  };

  const handleReloadLinkedIn = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await browser.tabs.reload(tab.id);
      window.close();
    }
  };

  if (!settings) {
    return <div className="popup-container">Loading settings...</div>;
  }

  return (
    <div className="popup-container">
      {/* Header with Title and Global Toggle */}
      <div className="popup-header">
        <div className="header-brand">
          <span className="brand-title">Slop Detector</span>
        </div>
        <label className="switch" title="Toggle Slop Detector">
          <input
            type="checkbox"
            aria-label="Enable Slop Detector"
            checked={settings.enabled}
            onChange={handleToggleEnabled}
          />
          <span className="slider"></span>
        </label>
      </div>

      {/* Live Page Statistics */}
      {isLinkedInTab && connectionState === 'connected' ? (
        <div className="stats-card">
          <div className="stats-title">Current LinkedIn Page</div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.postsScanned}</span>
              <span className="stat-label">Scanned</span>
            </div>
            <div className="stat-item">
              <span className="stat-value highlight">{stats.postsMatched}</span>
              <span className="stat-label">Slop Matched</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats.postsHidden + stats.postsCollapsed}
              </span>
              <span className="stat-label">Hidden / Collapsed</span>
            </div>
          </div>
        </div>
      ) : isLinkedInTab ? (
        <div className="stats-card connection-warning" role="status">
          <div className="stats-title">Detector not connected</div>
          <p>
            {connectionState === 'loading'
              ? 'Connecting to this LinkedIn tab...'
              : 'Reload LinkedIn after loading or reloading the extension.'}
          </p>
          {connectionState === 'unavailable' && (
            <button
              type="button"
              className="action-btn btn-primary"
              onClick={handleReloadLinkedIn}
            >
              Reload LinkedIn
            </button>
          )}
        </div>
      ) : (
        <div className="stats-card" style={{ textAlign: 'center', color: '#64748b' }}>
          Open LinkedIn to see live post detection stats.
        </div>
      )}

      {/* Sensitivity Threshold Slider */}
      <div className="control-section">
        <div className="control-label-row">
          <span>Score Threshold</span>
          <span>{settings.scoreThreshold} pts</span>
        </div>
        <input
          type="range"
          min="1"
          max="15"
          value={settings.scoreThreshold}
          onChange={handleThresholdChange}
          className="range-slider"
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="quick-actions">
        {isLinkedInTab && (
          <button
            type="button"
            className={`action-btn toggle-hidden-btn ${showHidden ? 'active' : ''}`}
            onClick={handleToggleShowHidden}
          >
            {showHidden ? 'Restore Filtered State' : 'Temporarily Reveal Hidden'}
          </button>
        )}
        <button
          type="button"
          className="action-btn btn-secondary"
          onClick={handleOpenOptions}
        >
          Open Full Settings
        </button>
      </div>
    </div>
  );
};

function isLinkedInUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
  } catch {
    return false;
  }
}
