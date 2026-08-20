# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1](https://github.com/Pragith/linkedin-slop-detector/compare/v0.1.0...v0.1.1) (2026-08-20)


### Bug Fixes

* **accessibility:** keep highlights readable in dark mode ([5828d0c](https://github.com/Pragith/linkedin-slop-detector/commit/5828d0ce8c9d71dc44b57aae9175a342615e26c8))

## [0.1.0] - 2026-08-20

### Features

- Initial release of LinkedIn Slop Detector browser extension (Manifest V3).
- Support for Google Chrome, Mozilla Firefox, Microsoft Edge, and Brave.
- 61 seeded built-in detection rules spanning contrast tropes, canned openers, faux insights, inflated metaphors, LLM vocabulary, corporate jargon, and structural density indicators.
- Override-based rule management supporting enable/disable, parameter editing, tombstoning, and restoration of built-in rules.
- Full CRUD for user-defined custom regular expression rules.
- Real-time options interface with live rule sandbox, search/filter controls, and JSON export/import.
- Flexible post rendering: highlight matched phrases, slop badge with interactive breakdown popover, outlining, dimming, collapsible placeholders with instant reveal, and layout-level hiding.
- Resilient LinkedIn DOM observer with mutation batching and node recycling protection.
- 100% on-device deterministic detection with zero telemetry or network calls.
