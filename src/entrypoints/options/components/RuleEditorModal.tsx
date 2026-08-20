import React, { useState } from 'react';
import { SlopRule, SlopCategory } from '../../../core/types';
import { validateRule, VALID_CATEGORIES } from '../../../rules/ruleValidation';

interface Props {
  initialRule?: Partial<SlopRule> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: SlopRule) => Promise<void>;
  defaultCaseSensitive?: boolean;
}

export const RuleEditorModal: React.FC<Props> = ({
  initialRule,
  isOpen,
  onClose,
  onSave,
  defaultCaseSensitive = false,
}) => {
  const isEditing = Boolean(initialRule?.id);

  const [id] = useState(() => initialRule?.id || `custom-rule-${crypto.randomUUID()}`);
  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [category, setCategory] = useState<SlopCategory>(
    initialRule?.category || 'contrast',
  );
  const [pattern, setPattern] = useState(initialRule?.pattern || '');
  const [flags, setFlags] = useState(
    initialRule?.flags ?? (defaultCaseSensitive ? '' : 'i'),
  );
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(initialRule?.severity || 3);
  const [weight, setWeight] = useState(
    initialRule?.weight !== undefined ? initialRule.weight : 3,
  );
  const [isDensityRule, setIsDensityRule] = useState(initialRule?.isDensityRule || false);
  const [densityThreshold, setDensityThreshold] = useState(
    initialRule?.densityThreshold || 2,
  );
  const [examplesText, setExamplesText] = useState(
    (initialRule?.examples || []).join('\n'),
  );
  const [enabled, setEnabled] = useState(initialRule?.enabledByDefault ?? true);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const examples = examplesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const ruleData: SlopRule = {
      id,
      name,
      description,
      category,
      pattern,
      flags,
      examples,
      severity,
      weight,
      enabledByDefault: enabled,
      source: initialRule?.source || 'custom',
      isDensityRule,
      densityThreshold: isDensityRule ? densityThreshold : undefined,
    };

    const validation = validateRule(ruleData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    setIsSaving(true);
    try {
      await onSave(ruleData);
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : String(error)]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rule-editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title" id="rule-editor-title">
            {isEditing
              ? initialRule?.source === 'builtin'
                ? 'Edit Built-in Rule (Override)'
                : 'Edit Custom Rule'
              : 'Create Custom Rule'}
          </h3>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {errors.length > 0 && (
          <div className="alert-box alert-error">
            <ul style={{ paddingLeft: 16 }}>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSave} className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="rule-name">
              Rule Name *
            </label>
            <input
              id="rule-name"
              type="text"
              className="input-text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Negation Contrast"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="rule-category">
              Category *
            </label>
            <select
              id="rule-category"
              className="select-dropdown"
              value={category}
              onChange={(e) => setCategory(e.target.value as SlopCategory)}
            >
              {VALID_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="rule-pattern">
              Regular Expression Pattern *
            </label>
            <input
              id="rule-pattern"
              type="text"
              className="input-text"
              required
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="\\b(?:it['’]?s|it is)\\s+not\\s+just\\b"
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="rule-flags">
                Regex Flags
              </label>
              <input
                id="rule-flags"
                type="text"
                className="input-text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                placeholder="i"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Severity (1-5)</label>
              <input
                type="number"
                aria-label="Rule severity"
                min="1"
                max="5"
                className="input-number"
                value={severity}
                onChange={(e) =>
                  setSeverity((parseInt(e.target.value, 10) || 3) as 1 | 2 | 3 | 4 | 5)
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (Score)</label>
              <input
                type="number"
                aria-label="Rule weight"
                step="0.5"
                min="0"
                className="input-number"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="setting-row" style={{ padding: '4px 0' }}>
            <div className="setting-info">
              <span className="setting-name">Enabled</span>
              <span className="setting-desc">Include this rule in feed detection.</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                aria-label="Enable rule"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-row" style={{ padding: '4px 0' }}>
            <div className="setting-info">
              <span className="setting-name">Density Rule</span>
              <span className="setting-desc">
                Only trigger score when repeated at or above threshold.
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                aria-label="Use density threshold"
                checked={isDensityRule}
                onChange={(e) => setIsDensityRule(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {isDensityRule && (
            <div className="form-group">
              <label className="form-label">Minimum Occurrences Threshold</label>
              <input
                type="number"
                aria-label="Minimum occurrences threshold"
                min="1"
                max="20"
                className="input-number"
                style={{ width: 100 }}
                value={densityThreshold}
                onChange={(e) => setDensityThreshold(parseInt(e.target.value, 10) || 2)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              aria-label="Rule description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this pattern indicates formulaic or cliché writing style..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Examples (one per line)</label>
            <textarea
              aria-label="Positive examples"
              className="form-textarea"
              value={examplesText}
              onChange={(e) => setExamplesText(e.target.value)}
              placeholder="Example phrase 1&#10;Example phrase 2"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Save Rule Override' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
