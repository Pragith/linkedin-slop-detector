---
name: prepare-release
description: Instructions for preparing and validating a release with release-please and multi-browser zip artifacts.
---

# Preparing a Release

1. **Ensure Conventional Commits**:
   Ensure all changes are committed following Conventional Commits format (`feat:`, `fix:`, `docs:`, `perf:`).

2. **Verify Version Consistency**:
   Run `npm run version:check`.

3. **Verify Artifact Packaging**:
   Run `npm run zip:all` to ensure valid Chrome, Brave, Firefox, and Edge archives plus `SHA256SUMS.txt` are generated under `.output/release/`.

4. **Review Permissions & Manifests**:
   Ensure permissions remain strictly minimal (`storage`, `*://*.linkedin.com/*`). Never introduce unexpected host permissions or permissions like `<all_urls>`.
