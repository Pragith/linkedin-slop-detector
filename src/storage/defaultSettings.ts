import { ExtensionSettings, StoredStateV1 } from '../core/types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  enableOnHomeFeed: true,
  enableOnPostPages: true,

  scoreThreshold: 4,
  minMatches: 1,
  minDistinctFamilies: 1,

  categoryDiversityBonusThreshold: 3,
  categoryDiversityBonusPoints: 5,
  densityScoringEnabled: true,
  defaultCaseSensitive: false,

  postActions: {
    outline: true,
    highlight: true,
    showBadge: true,
    showScore: true,
    showMatchCount: true,
    dim: false,
    collapse: false,
    hide: false,
  },

  badgePosition: 'top-right',
  highlightColor: '#FEF08A', // Soft amber/yellow
  outlineColor: '#F59E0B', // Amber
};

export const INITIAL_STORED_STATE: StoredStateV1 = {
  schemaVersion: 1,
  settings: DEFAULT_SETTINGS,
  ruleOverrides: {},
  customRules: [],
  lastUpdated: new Date().toISOString(),
};
