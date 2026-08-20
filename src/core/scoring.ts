import {
  SlopRule,
  DetectionMatch,
  DetectionResult,
  DetectionStats,
  ExtensionSettings,
  SlopCategory,
} from './types';
import { countWords } from './normalization';

const DIVERSITY_WINDOW_WORDS = 250;

export function calculateDetectionResult(
  rawText: string,
  rawMatches: DetectionMatch[],
  activeRules: SlopRule[],
  settings: ExtensionSettings,
): DetectionResult {
  const wordCount = Math.max(1, countWords(rawText));
  const activeRuleMap = new Map(activeRules.map((r) => [r.id, r]));

  // Group matches by rule ID
  const matchesByRule = new Map<string, DetectionMatch[]>();
  for (const match of rawMatches) {
    const list = matchesByRule.get(match.ruleId) || [];
    list.push(match);
    matchesByRule.set(match.ruleId, list);
  }

  let totalScore = 0;
  let densityScore = 0;
  const qualifiedMatches: DetectionMatch[] = [];
  const matchedRuleIds = new Set<string>();
  const matchedCategories = new Set<SlopCategory>();

  for (const [ruleId, matches] of matchesByRule.entries()) {
    const rule = activeRuleMap.get(ruleId);
    if (!rule) continue;

    if (rule.isDensityRule && settings.densityScoringEnabled) {
      const threshold = rule.densityThreshold ?? 2;
      if (matches.length >= threshold) {
        // Density rule passed threshold
        const points = matches.length * rule.weight;
        densityScore += points;
        totalScore += points;
        matchedRuleIds.add(ruleId);
        matchedCategories.add(rule.category);
        qualifiedMatches.push(...matches);
      }
    } else {
      // Standard rule: add weight for each match
      for (const m of matches) {
        totalScore += m.weight;
      }
      matchedRuleIds.add(ruleId);
      matchedCategories.add(rule.category);
      qualifiedMatches.push(...matches);
    }
  }

  // Check Category Diversity Bonus
  const distinctCategoryCount = matchedCategories.size;
  const distinctRuleCount = matchedRuleIds.size;
  let diversityBonus = 0;
  let diversityBonusApplied = false;

  if (
    distinctCategoryCount >= settings.categoryDiversityBonusThreshold &&
    hasCategoryDiversityWindow(
      rawText,
      qualifiedMatches,
      settings.categoryDiversityBonusThreshold,
    )
  ) {
    diversityBonus = settings.categoryDiversityBonusPoints;
    totalScore += diversityBonus;
    diversityBonusApplied = true;
  }

  // Normalized score per 100 words (rounded to 1 decimal place)
  const normalizedScore = Number(((totalScore / wordCount) * 100).toFixed(1));

  const stats: DetectionStats = {
    totalMatches: qualifiedMatches.length,
    distinctRuleCount,
    distinctCategoryCount,
    wordCount,
    diversityBonusApplied,
    diversityBonus,
    densityScore,
  };

  // Determine whether to act based on thresholds
  const shouldAct =
    settings.enabled &&
    totalScore >= settings.scoreThreshold &&
    qualifiedMatches.length >= settings.minMatches &&
    distinctCategoryCount >= settings.minDistinctFamilies;

  // Determine recommended action by strict precedence:
  // hide > collapse > dim > outline > highlight > none
  let recommendedAction: DetectionResult['recommendedAction'] = 'none';

  if (shouldAct) {
    const actions = settings.postActions;
    if (actions.hide) {
      recommendedAction = 'hide';
    } else if (actions.collapse) {
      recommendedAction = 'collapse';
    } else if (actions.dim) {
      recommendedAction = 'dim';
    } else if (actions.outline) {
      recommendedAction = 'outline';
    } else if (actions.highlight) {
      recommendedAction = 'highlight';
    }
  }

  return {
    score: totalScore,
    normalizedScore,
    matches: qualifiedMatches.sort((a, b) => a.start - b.start || a.end - b.end),
    matchedRuleIds: Array.from(matchedRuleIds),
    categories: Array.from(matchedCategories),
    stats,
    shouldAct,
    recommendedAction,
  };
}

function hasCategoryDiversityWindow(
  text: string,
  matches: DetectionMatch[],
  threshold: number,
): boolean {
  if (matches.length === 0 || threshold < 1) return false;

  const wordStarts: number[] = [];
  const wordPattern = /\S+/g;
  let wordMatch: RegExpExecArray | null;
  while ((wordMatch = wordPattern.exec(text)) !== null) {
    wordStarts.push(wordMatch.index);
  }

  const positioned = matches
    .map((match) => ({
      category: match.category,
      wordIndex: findWordIndex(wordStarts, match.start),
    }))
    .sort((a, b) => a.wordIndex - b.wordIndex);

  for (let left = 0; left < positioned.length; left++) {
    const categories = new Set<SlopCategory>();
    const first = positioned[left];
    if (!first) continue;

    for (let right = left; right < positioned.length; right++) {
      const current = positioned[right];
      if (!current || current.wordIndex - first.wordIndex >= DIVERSITY_WINDOW_WORDS) {
        break;
      }
      categories.add(current.category);
      if (categories.size >= threshold) return true;
    }
  }

  return false;
}

function findWordIndex(wordStarts: number[], characterIndex: number): number {
  let low = 0;
  let high = wordStarts.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const start = wordStarts[middle];
    if (start !== undefined && start <= characterIndex) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return Math.max(0, low - 1);
}
