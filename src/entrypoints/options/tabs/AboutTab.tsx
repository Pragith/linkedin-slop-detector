import React from 'react';
import { browser } from 'wxt/browser';

export const AboutTab: React.FC = () => {
  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">About LinkedIn Slop Detector</h2>
        <p className="tab-subtitle">
          Production-quality, open-source pattern detection for clean LinkedIn feeds.
        </p>
      </div>

      <div className="card-section">
        <h3 className="section-title">Mission & Philosophy</h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#334155', marginBottom: 12 }}>
          <strong>LinkedIn Slop Detector</strong> does not claim to detect &quot;AI
          authorship&quot; or provide false &quot;98% AI&quot; probabilities. Instead, it
          is a transparent, deterministic pattern matching engine that highlights
          formulaic tropes, corporate buzzword inflation, canned dramatic reveals, and
          overused LLM clichés.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#334155' }}>
          A match represents stylistic evidence only. With fine-grained customizable
          rules, you retain complete control over how your feed is filtered and displayed.
        </p>
      </div>

      <div className="card-section">
        <h3 className="section-title">Strict Privacy Commitment</h3>
        <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: '#334155' }}>
          <li>
            <strong>100% On-Device:</strong> All text scanning and scoring occurs entirely
            inside your browser.
          </li>
          <li>
            <strong>Zero Telemetry:</strong> No analytics, tracking pixels, or user
            activity logs are collected.
          </li>
          <li>
            <strong>Zero External APIs:</strong> No post text or user data ever leaves
            your computer.
          </li>
          <li>
            <strong>Minimal Permissions:</strong> Only standard extension storage and
            LinkedIn host access are requested.
          </li>
        </ul>
      </div>

      <div className="card-section">
        <h3 className="section-title">Project & Open Source Details</h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 13,
            color: '#475569',
          }}
        >
          <div>
            <strong>Author:</strong> Pragith Prakash
          </div>
          <div>
            <strong>Version:</strong> {browser.runtime.getManifest().version}
          </div>
          <div>
            <strong>License:</strong> MIT License
          </div>
          <div>
            <strong>Browser Support:</strong> Google Chrome, Mozilla Firefox, Microsoft
            Edge, and Brave
          </div>
          <div>
            <strong>Source Code:</strong>{' '}
            <a
              href="https://github.com/Pragith/linkedin-slop-detector"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#4f46e5' }}
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
