import React from 'react';
import { ExtensionSettings } from '../../../core/types';

interface Props {
  settings: ExtensionSettings;
  onUpdate: (partial: Partial<ExtensionSettings>) => Promise<void>;
}

export const GeneralTab: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">General Settings</h2>
        <p className="tab-subtitle">
          Configure core extension behavior and active site locations.
        </p>
      </div>

      <div className="card-section">
        <h3 className="section-title">Activation</h3>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Enable LinkedIn Slop Detector</span>
            <span className="setting-desc">
              Master switch to turn pattern detection on or off globally.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Enable LinkedIn Slop Detector"
              checked={settings.enabled}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">LinkedIn Home Feed</span>
            <span className="setting-desc">
              Inspect posts dynamically on the main LinkedIn feed.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Enable detection on LinkedIn home feed"
              checked={settings.enableOnHomeFeed}
              onChange={(e) => onUpdate({ enableOnHomeFeed: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Individual Post Pages</span>
            <span className="setting-desc">
              Inspect posts when opened directly on their permalink pages.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Enable detection on individual LinkedIn post pages"
              checked={settings.enableOnPostPages}
              onChange={(e) => onUpdate({ enableOnPostPages: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};
