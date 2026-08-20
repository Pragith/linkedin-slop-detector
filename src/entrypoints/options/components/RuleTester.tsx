import React, { useMemo, useState } from 'react';
import { SlopRule, ExtensionSettings } from '../../../core/types';
import { SlopDetector } from '../../../core/detector';

interface Props {
  rules: SlopRule[];
  settings: ExtensionSettings;
}

export const RuleTester: React.FC<Props> = ({ rules, settings }) => {
  const [sampleText, setSampleText] = useState(
    "In today's fast-paced world, it's not just about AI. It's about people. Let's delve into why this game-changer plays a pivotal role. The answer is simple: innovate or be left behind.",
  );

  const detector = useMemo(
    () => new SlopDetector(rules.filter((rule) => rule.enabledByDefault)),
    [rules],
  );
  const result = detector.detect(sampleText, settings);

  return (
    <div className="card-section" style={{ marginTop: 24 }}>
      <h3 className="section-title">Live Rule Sandbox & Tester</h3>
      <p className="setting-desc" style={{ marginBottom: 12 }}>
        Test active rules against sample post text in real time to verify match behavior
        and score calculations.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea
          className="form-textarea"
          style={{ width: '100%', minHeight: 80, fontSize: 13 }}
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          placeholder="Paste or type test LinkedIn post text here..."
        />

        {/* Live Score Summary */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            gap: 20,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
              Calculated Score
            </span>
            <strong style={{ fontSize: 18, color: '#d97706' }}>{result.score} pts</strong>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
              Matched Patterns
            </span>
            <strong style={{ fontSize: 16 }}>{result.matches.length}</strong>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
              Distinct Families
            </span>
            <strong style={{ fontSize: 16 }}>{result.stats.distinctCategoryCount}</strong>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
              Diversity Bonus
            </span>
            <strong
              style={{
                fontSize: 16,
                color: result.stats.diversityBonusApplied ? '#4f46e5' : '#64748b',
              }}
            >
              {result.stats.diversityBonusApplied
                ? `+${result.stats.diversityBonus} pts`
                : 'None'}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
              Action Triggered?
            </span>
            <strong
              style={{ fontSize: 14, color: result.shouldAct ? '#dc2626' : '#16a34a' }}
            >
              {result.shouldAct
                ? `Yes (${result.recommendedAction})`
                : 'No (Below threshold)'}
            </strong>
          </div>
        </div>

        {/* Matched Breakdown */}
        {result.matches.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}
            >
              Matched Phrases:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.matches.map((m, idx) => (
                <span
                  key={idx}
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                  title={m.ruleName}
                >
                  &quot;{m.matchedText}&quot; <strong>(+{m.weight})</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
