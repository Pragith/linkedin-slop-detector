# Architecture Documentation

## System Overview

LinkedIn Slop Detector follows a modular, decoupled architecture where text analysis is isolated from DOM manipulation and browser extension APIs.

```text
               +----------------------------------+
               |     LinkedIn DOM (SPA Feed)     |
               +-----------------+----------------+
                                 | MutationObserver / DOM Traversal
                                 v
               +----------------------------------+
               |        LinkedIn Adapter          |
               |  (adapter.ts, postExtractor.ts)  |
               +-----------------+----------------+
                                 | Clean Raw Text
                                 v
               +----------------------------------+
               |      Core Detection Engine       |
               | (normalization, matcher, scoring)|
               +-----------------+----------------+
                                 | DetectionResult
                                 v
               +----------------------------------+
               |        LinkedIn Renderer         |
               |   (postRenderer.ts, injected.css)|
               +-----------------+----------------+
                                 | Range Highlights / Badges / Placeholders
                                 v
               +----------------------------------+
               |       Filtered LinkedIn Post     |
               +----------------------------------+
```

---

## Module Breakdown

### 1. `src/core/` (Pure Logic)

- **`types.ts`**: TypeScript contracts for rules, overrides, matches, results, and settings.
- **`normalization.ts`**: Replaces Unicode whitespace and curly quotes with equal-length scan characters, preserving exact source offsets, and computes deterministic string fingerprints.
- **`matcher.ts`**: Caches compiled regexes, caps scan work, tracks match character offsets, and resolves overlapping highlight spans.
- **`scoring.ts`**: Calculates weighted scores, checks structural density thresholds, applies category diversity bonuses, and resolves action precedence.
- **`detector.ts`**: Orchestrates scanning pipeline and provides performance benchmarking.

### 2. `src/rules/` (Rule Architecture)

- **`defaultRules.ts`**: Version-controlled application defaults with positive and counter-examples.
- **`ruleRepository.ts`**: Merges built-ins with persisted user overrides and custom rules.
- **`ruleValidation.ts`**: Safety guards, regex syntax validation, and pattern length limits.

### 3. `src/storage/` (Persistence & Reactive Sync)

- **`defaultSettings.ts`**: Default configuration constants.
- **`migrations.ts`**: Versioned state migrations and schema recovery.
- **`settingsRepository.ts`**: Singleton repository with real-time storage event listeners.

### 4. `src/linkedin/` (DOM Integration)

- **`adapter.ts`**: Centralized selector dictionary for feed cards and text containers.
- **`observer.ts`**: Incremental, animation-frame-batched mutation processing with text fingerprints for recycled nodes.
- **`postExtractor.ts`**: Safe tree traversal and text-node offset mapping that exclude author tags, buttons, and screen-reader elements.
- **`postRenderer.ts`**: Non-destructive highlighting using DOM Ranges, badges, and collapse/hide placeholders.

### 5. `src/entrypoints/` (Extension Shell)

- **`background.ts`**: Manifest V3 service worker managing badge counts.
- **`content.ts`**: Content script coordinator.
- **`popup/`**: Toolbar action quick popup.
- **`options/`**: Full settings application with live sandbox.
