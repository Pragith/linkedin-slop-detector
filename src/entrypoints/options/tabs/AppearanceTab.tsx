import React from 'react';
import { ExtensionSettings } from '../../../core/types';

interface Props {
  settings: ExtensionSettings;
  onUpdate: (partial: Partial<ExtensionSettings>) => Promise<void>;
}

export const AppearanceTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const updatePostActions = (
    partialActions: Partial<ExtensionSettings['postActions']>,
  ) => {
    return onUpdate({
      postActions: {
        ...settings.postActions,
        ...partialActions,
      },
    });
  };

  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">Appearance & Post Actions</h2>
        <p className="tab-subtitle">
          Configure visual feedback, highlighting colors, and post filtering actions.
        </p>
      </div>

      <div className="card-section">
        <h3 className="section-title">
          Post Filtering Actions (Precedence: Hide &gt; Collapse &gt; Dim &gt; Outline)
        </h3>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Hide Detected Posts</span>
            <span className="setting-desc">
              Completely removes detected posts from the feed layout. (Can be temporarily
              revealed from toolbar popup).
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Hide detected posts"
              checked={settings.postActions.hide}
              onChange={(e) => updatePostActions({ hide: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Collapse Detected Posts</span>
            <span className="setting-desc">
              Replaces the post body with a compact placeholder card with a one-click
              &quot;Show post&quot; reveal button.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Collapse detected posts"
              checked={settings.postActions.collapse}
              onChange={(e) => updatePostActions({ collapse: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Dim Detected Posts</span>
            <span className="setting-desc">
              Lowers opacity and grayscales detected posts until hovered.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Dim detected posts"
              checked={settings.postActions.dim}
              onChange={(e) => updatePostActions({ dim: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Outline Detected Posts</span>
            <span className="setting-desc">
              Adds a clear accent border around posts that trigger detection.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Outline detected posts"
              checked={settings.postActions.outline}
              onChange={(e) => updatePostActions({ outline: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="card-section">
        <h3 className="section-title">Visual Indicators</h3>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Highlight Matched Phrases</span>
            <span className="setting-desc">
              Safely highlights the exact clichés and buzzword matches inside visible post
              text.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Highlight matched phrases"
              checked={settings.postActions.highlight}
              onChange={(e) => updatePostActions({ highlight: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Show Slop Score Badge</span>
            <span className="setting-desc">
              Displays an unobtrusive badge on detected posts. Clicking exposes the full
              pattern breakdown.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Show slop score badge"
              checked={settings.postActions.showBadge}
              onChange={(e) => updatePostActions({ showBadge: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Show Score in Badge</span>
            <span className="setting-desc">
              Include the numeric slop score in the post badge.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Show score in badge"
              checked={settings.postActions.showScore}
              onChange={(e) => updatePostActions({ showScore: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Show Match Count in Badge</span>
            <span className="setting-desc">
              Include the number of matched patterns in the post badge.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Show match count in badge"
              checked={settings.postActions.showMatchCount}
              onChange={(e) => updatePostActions({ showMatchCount: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <label className="setting-name" htmlFor="badge-position">
              Badge Position
            </label>
            <span className="setting-desc">Choose where the post badge appears.</span>
          </div>
          <select
            id="badge-position"
            className="select-dropdown"
            value={settings.badgePosition}
            onChange={(event) =>
              onUpdate({
                badgePosition: event.target.value as ExtensionSettings['badgePosition'],
              })
            }
          >
            <option value="top-right">Top right</option>
            <option value="top-left">Top left</option>
            <option value="header">Below post header</option>
          </select>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Highlight Background Color</span>
            <span className="setting-desc">
              Accent color for highlighted matched phrases.
            </span>
          </div>
          <input
            type="color"
            aria-label="Highlight background color"
            value={settings.highlightColor}
            onChange={(e) => onUpdate({ highlightColor: e.target.value })}
            style={{
              width: 44,
              height: 32,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
            }}
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Outline Border Color</span>
            <span className="setting-desc">
              Border color for post outline indicators.
            </span>
          </div>
          <input
            type="color"
            aria-label="Outline border color"
            value={settings.outlineColor}
            onChange={(e) => onUpdate({ outlineColor: e.target.value })}
            style={{
              width: 44,
              height: 32,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};
