import React, { useState } from 'react';
import { EffectiveRule, SlopRule, ExtensionSettings } from '../../../core/types';
import { SettingsRepository } from '../../../storage/settingsRepository';
import { RuleRepository } from '../../../rules/ruleRepository';
import { VALID_CATEGORIES } from '../../../rules/ruleValidation';
import { RuleEditorModal } from '../components/RuleEditorModal';
import { RuleTester } from '../components/RuleTester';

interface Props {
  rules: EffectiveRule[];
  settings: ExtensionSettings;
  onRefresh: () => Promise<void>;
}

export const RulesTab: React.FC<Props> = ({ rules, settings, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [enabledFilter, setEnabledFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('name-asc');

  const [editingRule, setEditingRule] = useState<Partial<SlopRule> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const settingsRepo = SettingsRepository.getInstance();

  const handleToggleRule = async (rule: EffectiveRule) => {
    const nextEnabled = !rule.enabledByDefault;
    if (rule.source === 'builtin') {
      await settingsRepo.saveRuleOverride({
        id: rule.id,
        enabled: nextEnabled,
      });
    } else {
      await settingsRepo.saveCustomRule({
        ...rule,
        enabledByDefault: nextEnabled,
      });
    }
    await onRefresh();
  };

  const handleSaveRule = async (rule: SlopRule) => {
    if (rule.source === 'builtin') {
      await settingsRepo.saveRuleOverride({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        pattern: rule.pattern,
        flags: rule.flags,
        severity: rule.severity,
        weight: rule.weight,
        enabled: rule.enabledByDefault,
        isDensityRule: rule.isDensityRule,
        densityThreshold: rule.densityThreshold,
      });
    } else {
      await settingsRepo.saveCustomRule(rule);
    }
    await onRefresh();
  };

  const handleDeleteRule = async (rule: EffectiveRule) => {
    const confirmed = window.confirm(
      rule.source === 'builtin'
        ? `Remove “${rule.name}” from the effective built-in rules? You can restore it later.`
        : `Permanently delete the custom rule “${rule.name}”?`,
    );
    if (!confirmed) return;

    if (rule.source === 'builtin') {
      // Tombstone built-in
      await settingsRepo.saveRuleOverride(
        RuleRepository.createTombstoneOverride(rule.id),
      );
    } else {
      // Delete custom rule
      await settingsRepo.deleteCustomRule(rule.id);
    }
    await onRefresh();
  };

  const handleRestoreRule = async (rule: EffectiveRule) => {
    await settingsRepo.restoreBuiltinRule(rule.id);
    await onRefresh();
  };

  const handleDuplicateRule = async (rule: EffectiveRule) => {
    const newId = `custom-rule-${crypto.randomUUID()}`;
    const duplicate: SlopRule = {
      ...rule,
      id: newId,
      name: `Copy of ${rule.name}`,
      source: 'custom',
      enabledByDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await settingsRepo.saveCustomRule(duplicate);
    await onRefresh();
  };

  const handleEnableAll = async () => {
    await settingsRepo.setAllRulesEnabled(true);
    await onRefresh();
  };

  const handleDisableAll = async () => {
    await settingsRepo.setAllRulesEnabled(false);
    await onRefresh();
  };

  const handleResetRuleOverrides = async () => {
    if (
      window.confirm(
        'Reset all rule modifications and restore original built-in defaults?',
      )
    ) {
      await settingsRepo.resetBuiltinRules();
      await onRefresh();
    }
  };

  // Filter rules
  const filteredRules = rules
    .filter((rule) => {
      const matchesSearch =
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.pattern.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || rule.category === categoryFilter;

      let matchesSource = true;
      if (sourceFilter === 'builtin')
        matchesSource =
          rule.source === 'builtin' && !rule.isOverridden && !rule.isDeleted;
      else if (sourceFilter === 'custom') matchesSource = rule.source === 'custom';
      else if (sourceFilter === 'overridden')
        matchesSource = Boolean(rule.isOverridden && !rule.isDeleted);
      else if (sourceFilter === 'deleted') matchesSource = Boolean(rule.isDeleted);

      let matchesEnabled = true;
      if (enabledFilter === 'enabled')
        matchesEnabled = !rule.isDeleted && rule.enabledByDefault;
      else if (enabledFilter === 'disabled')
        matchesEnabled = rule.isDeleted || !rule.enabledByDefault;

      return matchesSearch && matchesCategory && matchesSource && matchesEnabled;
    })
    .sort((left, right) => {
      switch (sortBy) {
        case 'name-desc':
          return right.name.localeCompare(left.name);
        case 'weight-desc':
          return right.weight - left.weight || left.name.localeCompare(right.name);
        case 'severity-desc':
          return right.severity - left.severity || left.name.localeCompare(right.name);
        case 'category-asc':
          return (
            left.category.localeCompare(right.category) ||
            left.name.localeCompare(right.name)
          );
        default:
          return left.name.localeCompare(right.name);
      }
    });

  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">Detection Rules Repository</h2>
        <p className="tab-subtitle">
          Manage, customize, and inspect built-in and user-defined pattern matching rules.
        </p>
      </div>

      <div className="card-section">
        {/* Rules Toolbar */}
        <div className="rules-toolbar">
          <div className="rules-filters">
            <input
              type="text"
              className="input-text"
              placeholder="Search rules or patterns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 220 }}
            />

            <select
              className="select-dropdown"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {VALID_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="select-dropdown"
              value={sortBy}
              aria-label="Sort rules"
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="weight-desc">Weight (high-low)</option>
              <option value="severity-desc">Severity (high-low)</option>
              <option value="category-asc">Category</option>
            </select>

            <select
              className="select-dropdown"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="builtin">Built-in (Default)</option>
              <option value="overridden">Built-in (Overridden)</option>
              <option value="custom">Custom</option>
              <option value="deleted">Deleted / Tombstoned</option>
            </select>

            <select
              className="select-dropdown"
              value={enabledFilter}
              onChange={(e) => setEnabledFilter(e.target.value)}
            >
              <option value="all">All States</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingRule(null);
                setIsModalOpen(true);
              }}
            >
              + Create Rule
            </button>
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={handleEnableAll}
          >
            Enable All
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={handleDisableAll}
          >
            Disable All
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={handleResetRuleOverrides}
          >
            Reset Built-ins
          </button>
          <span
            style={{
              fontSize: 12,
              color: '#64748b',
              alignSelf: 'center',
              marginLeft: 'auto',
            }}
          >
            Showing {filteredRules.length} of {rules.length} rules
          </span>
        </div>

        {/* Rules Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="rules-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>Active</th>
                <th>Name & Description</th>
                <th style={{ width: 120 }}>Category</th>
                <th style={{ width: 70 }}>Sev</th>
                <th style={{ width: 70 }}>Weight</th>
                <th style={{ width: 90 }}>Source</th>
                <th style={{ width: 220, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => {
                return (
                  <tr
                    key={rule.id}
                    style={{
                      opacity: rule.isDeleted || !rule.enabledByDefault ? 0.6 : 1,
                    }}
                  >
                    <td>
                      <label className="switch" style={{ width: 34, height: 18 }}>
                        <input
                          type="checkbox"
                          aria-label={`${rule.enabledByDefault ? 'Disable' : 'Enable'} ${rule.name}`}
                          checked={!rule.isDeleted && rule.enabledByDefault}
                          disabled={rule.isDeleted}
                          onChange={() => handleToggleRule(rule)}
                        />
                        <span
                          className="slider"
                          style={{
                            borderRadius: 18,
                          }}
                        ></span>
                      </label>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{rule.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {rule.description}
                      </div>
                      <code
                        style={{
                          fontSize: 11,
                          color: '#4f46e5',
                          background: '#eef2ff',
                          padding: '1px 4px',
                          borderRadius: 3,
                          marginTop: 4,
                          display: 'inline-block',
                          maxWidth: 320,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        /{rule.pattern}/{rule.flags}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#475569' }}>
                        {rule.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{rule.severity}/5</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#d97706' }}>
                        +{rule.weight}
                      </span>
                    </td>
                    <td>
                      {rule.isDeleted ? (
                        <span className="badge-tag deleted">Deleted</span>
                      ) : rule.source === 'custom' ? (
                        <span className="badge-tag custom">Custom</span>
                      ) : rule.isOverridden ? (
                        <span className="badge-tag overridden">Overridden</span>
                      ) : (
                        <span className="badge-tag builtin">Built-in</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        {(rule.isOverridden || rule.isDeleted) && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            title="Restore default rule"
                            onClick={() => handleRestoreRule(rule)}
                          >
                            Restore
                          </button>
                        )}

                        {!rule.isDeleted && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            title="Edit rule"
                            onClick={() => {
                              setEditingRule(rule);
                              setIsModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: 11 }}
                          title="Duplicate as custom rule"
                          onClick={() => handleDuplicateRule(rule)}
                        >
                          Copy
                        </button>

                        {!rule.isDeleted && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            title={
                              rule.source === 'builtin'
                                ? 'Remove from active rules'
                                : 'Delete rule'
                            }
                            onClick={() => handleDeleteRule(rule)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded Live Rule Tester */}
      <RuleTester rules={rules} settings={settings} />

      {/* Editor Modal */}
      {isModalOpen && (
        <RuleEditorModal
          isOpen
          initialRule={editingRule}
          defaultCaseSensitive={settings.defaultCaseSensitive}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRule(null);
          }}
          onSave={handleSaveRule}
        />
      )}
    </div>
  );
};
