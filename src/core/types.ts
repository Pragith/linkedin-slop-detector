export type SlopCategory =
  | 'contrast'
  | 'canned-opener'
  | 'canned-conclusion'
  | 'dramatic-reveal'
  | 'faux-insight'
  | 'canned-exploration'
  | 'throat-clearing'
  | 'generic-world'
  | 'generic-bridge'
  | 'inflated-metaphor'
  | 'llm-vocabulary'
  | 'corporate-language'
  | 'empty-intensifier'
  | 'unsupported-authority'
  | 'scaffolding'
  | 'structural'
  | 'formatting'
  | 'other';

export interface SlopRule {
  id: string;
  name: string;
  description: string;
  category: SlopCategory;

  pattern: string;
  flags: string;

  examples: string[];
  counterExamples?: string[];

  severity: 1 | 2 | 3 | 4 | 5;
  weight: number;

  enabledByDefault: boolean;
  source: 'builtin' | 'custom';

  isDensityRule?: boolean;
  densityThreshold?: number; // Minimum match count required to trigger score (e.g., 3 for rule-of-three, 3 for em-dash)

  versionAdded?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RuleOverride {
  id: string;
  enabled?: boolean;
  name?: string;
  description?: string;
  category?: SlopCategory;
  pattern?: string;
  flags?: string;
  severity?: 1 | 2 | 3 | 4 | 5;
  weight?: number;
  isDensityRule?: boolean;
  densityThreshold?: number;
  deletedTombstone?: boolean;
  updatedAt?: string;
}

export interface EffectiveRule extends SlopRule {
  isOverridden?: boolean;
  isDeleted?: boolean;
}

export interface CompiledRule {
  rule: SlopRule;
  regex: RegExp | null;
  isValid: boolean;
  compileError?: string;
}

export interface DetectionMatch {
  ruleId: string;
  ruleName: string;
  category: SlopCategory;
  start: number;
  end: number;
  matchedText: string;
  weight: number;
  severity: 1 | 2 | 3 | 4 | 5;
}

export interface DetectionStats {
  totalMatches: number;
  distinctRuleCount: number;
  distinctCategoryCount: number;
  wordCount: number;
  diversityBonusApplied: boolean;
  diversityBonus: number;
  densityScore: number;
}

export interface DetectionResult {
  score: number;
  normalizedScore: number; // Score per 100 words
  matches: DetectionMatch[];
  matchedRuleIds: string[];
  categories: SlopCategory[];
  stats: DetectionStats;
  shouldAct: boolean;
  recommendedAction: 'hide' | 'collapse' | 'dim' | 'outline' | 'highlight' | 'none';
}

export interface PostActionSettings {
  outline: boolean;
  highlight: boolean;
  showBadge: boolean;
  showScore: boolean;
  showMatchCount: boolean;
  dim: boolean;
  collapse: boolean;
  hide: boolean;
}

export interface ExtensionSettings {
  enabled: boolean;
  enableOnHomeFeed: boolean;
  enableOnPostPages: boolean;

  // Detection thresholds
  scoreThreshold: number;
  minMatches: number;
  minDistinctFamilies: number;

  // Diversity & density bonuses
  categoryDiversityBonusThreshold: number; // default: 3 categories
  categoryDiversityBonusPoints: number; // default: 5 points
  densityScoringEnabled: boolean;
  defaultCaseSensitive: boolean;

  // Actions
  postActions: PostActionSettings;

  // Visual customization
  badgePosition: 'top-right' | 'top-left' | 'header';
  highlightColor: string;
  outlineColor: string;
}

export interface StoredStateV1 {
  schemaVersion: 1;
  settings: ExtensionSettings;
  ruleOverrides: Record<string, RuleOverride>;
  customRules: SlopRule[];
  lastUpdated: string;
}

export type StorageExportData = StoredStateV1;

export interface PageDetectionStats {
  postsScanned: number;
  postsMatched: number;
  postsHidden: number;
  postsCollapsed: number;
}

export interface PostElementState {
  id: string;
  processed: boolean;
  lastTextFingerprint: string;
  isTemporarilyRevealed: boolean;
  result: DetectionResult | null;
}
