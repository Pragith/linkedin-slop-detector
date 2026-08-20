import React, { useEffect, useState } from 'react';
import { SettingsRepository } from '../../storage/settingsRepository';
import { RuleRepository } from '../../rules/ruleRepository';
import { EffectiveRule, ExtensionSettings, StoredStateV1 } from '../../core/types';
import { GeneralTab } from './tabs/GeneralTab';
import { DetectionTab } from './tabs/DetectionTab';
import { RulesTab } from './tabs/RulesTab';
import { AppearanceTab } from './tabs/AppearanceTab';
import { DataTab } from './tabs/DataTab';
import { AboutTab } from './tabs/AboutTab';
import './options.css';

type TabKey = 'general' | 'detection' | 'rules' | 'appearance' | 'data' | 'about';

export const Options: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [state, setState] = useState<StoredStateV1 | null>(null);
  const [rules, setRules] = useState<EffectiveRule[]>([]);

  const settingsRepo = SettingsRepository.getInstance();

  useEffect(() => {
    const ruleRepo = new RuleRepository();

    const loadData = async () => {
      const currentState = await settingsRepo.getState();
      setState(currentState);
      const effective = ruleRepo.getAllEffectiveRules(
        currentState.ruleOverrides,
        currentState.customRules,
      );
      setRules(effective);
    };

    loadData();

    const unsub = settingsRepo.onChanged((newState) => {
      setState(newState);
      const effective = ruleRepo.getAllEffectiveRules(
        newState.ruleOverrides,
        newState.customRules,
      );
      setRules(effective);
    });

    return () => unsub();
  }, [settingsRepo]);

  const handleRefresh = async () => {
    const currentState = await settingsRepo.getState();
    setState(currentState);
    const ruleRepo = new RuleRepository();
    const effective = ruleRepo.getAllEffectiveRules(
      currentState.ruleOverrides,
      currentState.customRules,
    );
    setRules(effective);
  };

  const handleUpdateSettings = async (partial: Partial<ExtensionSettings>) => {
    await settingsRepo.updateSettings(partial);
    await handleRefresh();
  };

  if (!state) {
    return <div style={{ padding: 32 }}>Loading settings...</div>;
  }

  return (
    <div className="options-layout">
      {/* Sidebar Navigation */}
      <aside className="options-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-title">Slop Detector</span>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
            aria-current={activeTab === 'general' ? 'page' : undefined}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'detection' ? 'active' : ''}`}
            aria-current={activeTab === 'detection' ? 'page' : undefined}
            onClick={() => setActiveTab('detection')}
          >
            Detection & Scoring
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`}
            aria-current={activeTab === 'rules' ? 'page' : undefined}
            onClick={() => setActiveTab('rules')}
          >
            Rules Repository
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
            aria-current={activeTab === 'appearance' ? 'page' : undefined}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'data' ? 'active' : ''}`}
            aria-current={activeTab === 'data' ? 'page' : undefined}
            onClick={() => setActiveTab('data')}
          >
            Data & Backup
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
            aria-current={activeTab === 'about' ? 'page' : undefined}
            onClick={() => setActiveTab('about')}
          >
            About & Privacy
          </button>
        </nav>
      </aside>

      {/* Main Tab Content */}
      <main className="options-content">
        {activeTab === 'general' && (
          <GeneralTab settings={state.settings} onUpdate={handleUpdateSettings} />
        )}
        {activeTab === 'detection' && (
          <DetectionTab settings={state.settings} onUpdate={handleUpdateSettings} />
        )}
        {activeTab === 'rules' && (
          <RulesTab rules={rules} settings={state.settings} onRefresh={handleRefresh} />
        )}
        {activeTab === 'appearance' && (
          <AppearanceTab settings={state.settings} onUpdate={handleUpdateSettings} />
        )}
        {activeTab === 'data' && <DataTab onRefresh={handleRefresh} />}
        {activeTab === 'about' && <AboutTab />}
      </main>
    </div>
  );
};
