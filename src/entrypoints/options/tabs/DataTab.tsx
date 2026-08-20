import React, { useState } from 'react';
import {
  MAX_IMPORT_BYTES,
  SettingsRepository,
} from '../../../storage/settingsRepository';

interface Props {
  onRefresh: () => Promise<void>;
}

export const DataTab: React.FC<Props> = ({ onRefresh }) => {
  const [importJson, setImportJson] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const settingsRepo = SettingsRepository.getInstance();

  const handleExport = async () => {
    try {
      const dataStr = await settingsRepo.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkedin-slop-detector-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage({
        type: 'success',
        text: 'Settings and rules successfully exported to JSON.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please paste valid JSON before importing.',
      });
      return;
    }

    const res = await settingsRepo.importData(importJson);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setImportJson('');
      await onRefresh();
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setStatusMessage({ type: 'error', text: 'Import file exceeds the 1 MB limit.' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJson(content);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSettings = async () => {
    if (
      window.confirm(
        'Reset all detection and appearance settings to defaults? Your custom rules will remain.',
      )
    ) {
      await settingsRepo.resetSettings();
      await onRefresh();
      setStatusMessage({ type: 'success', text: 'Settings reset to default.' });
    }
  };

  const handleResetRules = async () => {
    if (
      window.confirm('Clear all custom rules and restore all built-in rules to default?')
    ) {
      await settingsRepo.resetRules();
      await onRefresh();
      setStatusMessage({ type: 'success', text: 'Rules reset to factory defaults.' });
    }
  };

  const handleResetAll = async () => {
    if (
      window.confirm(
        'Reset EVERYTHING back to initial factory state? This cannot be undone.',
      )
    ) {
      await settingsRepo.resetAll();
      await onRefresh();
      setStatusMessage({
        type: 'success',
        text: 'Full extension state reset to factory defaults.',
      });
    }
  };

  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">Data & Backup</h2>
        <p className="tab-subtitle">
          Export and import your custom rules and settings, or reset back to defaults.
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`alert-box ${statusMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="card-section">
        <h3 className="section-title">Export Configuration</h3>
        <p className="setting-desc" style={{ marginBottom: 16 }}>
          Download a complete backup JSON containing your active settings, rule overrides,
          and custom rules.
        </p>
        <button type="button" className="btn btn-primary" onClick={handleExport}>
          Download JSON Export
        </button>
      </div>

      <div className="card-section">
        <h3 className="section-title">Import Configuration</h3>
        <p className="setting-desc" style={{ marginBottom: 16 }}>
          Upload a backup file or paste your exported configuration JSON below.
        </p>

        <div style={{ marginBottom: 12 }}>
          <input type="file" accept=".json" onChange={handleFileUpload} />
        </div>

        <textarea
          className="form-textarea"
          style={{ width: '100%', minHeight: 120, marginBottom: 12 }}
          placeholder="Paste configuration JSON here..."
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
        />

        <button type="button" className="btn btn-secondary" onClick={handleImport}>
          Validate & Import
        </button>
      </div>

      <div className="card-section">
        <h3 className="section-title">Reset & Recovery</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetSettings}
          >
            Reset Settings Only
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleResetRules}>
            Reset Rules Only
          </button>
          <button type="button" className="btn btn-danger" onClick={handleResetAll}>
            Reset Everything
          </button>
        </div>
      </div>
    </div>
  );
};
