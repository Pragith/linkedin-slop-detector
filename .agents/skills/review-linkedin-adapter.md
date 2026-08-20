---
name: review-linkedin-adapter
description: Best practices for reviewing and modifying LinkedIn DOM selectors and rendering hooks.
---

# Reviewing the LinkedIn Adapter

When modifying LinkedIn DOM handling:

1. **Keep Detection Logic DOM-Agnostic**:
   Never import `document`, `window`, or DOM APIs into `src/core/`. The core detector must remain pure and testable in headless node environments.

2. **Isolate Selectors**:
   Keep all query selectors inside `src/linkedin/adapter.ts`. Use fallback arrays to handle A/B tests or markup variations on LinkedIn.

3. **Safe Highlighting**:
   Never use `innerHTML` on LinkedIn post elements. Always use DOM `Range` and text-node insertion in `src/linkedin/postRenderer.ts` to prevent breaking React/Ember event handlers or causing XSS vulnerabilities.

4. **Recycled Nodes**:
   Always verify that recycled DOM nodes in infinite scroll feeds are properly tracked with text fingerprints (`data-lsd-fingerprint`).
