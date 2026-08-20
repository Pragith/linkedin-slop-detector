import React from 'react';
import { ExtensionSettings } from '../../../core/types';

interface Props {
  settings: ExtensionSettings;
  onUpdate: (partial: Partial<ExtensionSettings>) => Promise<void>;
}

export const DetectionTab: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">Detection & Scoring</h2>
        <p className="tab-subtitle">
          Fine-tune detection thresholds, diversity bonuses, and density scoring.
        </p>
      </div>

      <div className="card-section">
        <h3 className="section-title">Thresholds</h3>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Minimum Score Threshold</span>
            <span className="setting-desc">
              A post will only trigger actions if its accumulated pattern score meets or
              exceeds this value.
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="30"
            className="input-number"
            style={{ width: 80 }}
            value={settings.scoreThreshold}
            onChange={(e) =>
              onUpdate({ scoreThreshold: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Minimum Pattern Matches</span>
            <span className="setting-desc">
              Minimum number of qualified rule matches required to trigger action.
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="10"
            className="input-number"
            style={{ width: 80 }}
            value={settings.minMatches}
            onChange={(e) => onUpdate({ minMatches: parseInt(e.target.value, 10) || 1 })}
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Minimum Distinct Rule Families</span>
            <span className="setting-desc">
              Minimum number of distinct rule categories required to trigger action.
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="10"
            className="input-number"
            style={{ width: 80 }}
            value={settings.minDistinctFamilies}
            onChange={(e) =>
              onUpdate({ minDistinctFamilies: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Case-sensitive Custom Rules by Default</span>
            <span className="setting-desc">
              New custom rules omit the case-insensitive flag unless you add it manually.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Make new custom rules case-sensitive by default"
              checked={settings.defaultCaseSensitive}
              onChange={(event) =>
                onUpdate({ defaultCaseSensitive: event.target.checked })
              }
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="card-section">
        <h3 className="section-title">Diversity & Density Bonus</h3>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Category Diversity Bonus Points</span>
            <span className="setting-desc">
              Bonus score added when multiple distinct rule categories appear in the same
              post.
            </span>
          </div>
          <input
            type="number"
            min="0"
            max="20"
            className="input-number"
            style={{ width: 80 }}
            value={settings.categoryDiversityBonusPoints}
            onChange={(e) =>
              onUpdate({
                categoryDiversityBonusPoints: parseInt(e.target.value, 10) || 0,
              })
            }
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Diversity Category Threshold</span>
            <span className="setting-desc">
              Number of distinct categories needed to trigger the diversity bonus.
            </span>
          </div>
          <input
            type="number"
            min="2"
            max="8"
            className="input-number"
            style={{ width: 80 }}
            value={settings.categoryDiversityBonusThreshold}
            onChange={(e) =>
              onUpdate({
                categoryDiversityBonusThreshold: parseInt(e.target.value, 10) || 2,
              })
            }
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Density Scoring</span>
            <span className="setting-desc">
              Only score structural indicators (e.g., rule-of-three, em-dash spam) when
              they repeat beyond their individual thresholds.
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              aria-label="Enable density scoring"
              checked={settings.densityScoringEnabled}
              onChange={(e) => onUpdate({ densityScoringEnabled: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};
