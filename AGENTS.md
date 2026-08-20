# Instructions for AI & Autonomous Coding Agents

This repository is **LinkedIn Slop Detector**, a production-quality, open-source browser extension built with strict TypeScript, WXT, React, and Vitest.

When modifying this repository, you **MUST** follow these mandatory rules and boundaries.

---

## 1. Architectural Boundaries

- **`src/core/` (Pure Logic)**: Must remain 100% pure, deterministic, and DOM-free. Never import `document`, `window`, `HTMLElement`, or browser storage into `src/core/`.
- **`src/rules/` (Rule Management)**: Contains immutable shipped defaults (`defaultRules.ts`), override merging (`ruleRepository.ts`), and regex validation (`ruleValidation.ts`).
- **`src/storage/` (Persistence)**: Handles schema migrations and cross-browser WebExtension storage synchronization.
- **`src/linkedin/` (DOM Adapter)**: All LinkedIn DOM queries, MutationObservers, and UI renderers reside here.
- **`src/entrypoints/` (Extension Entrypoints)**: WXT entrypoints (`background.ts`, `content.ts`, `popup/`, `options/`).

---

## 2. Mandatory Rules for Agents

1. **Never Silently Weaken Tests**:
   - Do NOT delete tests, reduce assertions, or disable checks to make a suite pass.
   - If a test fails because of a behavior change, update the test explicitly and document the rationale.
2. **Never Break Privacy Guarantees**:
   - Zero telemetry.
   - Zero remote network requests during detection.
   - Zero transmission of LinkedIn post text.
3. **Never Use `innerHTML` on Post Content**:
   - Always use `Range` or standard DOM node manipulation to avoid breaking LinkedIn event listeners and prevent XSS.
4. **Never Bypass Storage Migrations**:
   - Schema version bumps must include migration handlers in `src/storage/migrations.ts` and automated migration tests.
5. **Update Documentation When Behavior Changes**:
   - If scoring, rules, or UI changes, update `README.md`, `docs/store/CHROME_WEB_STORE.md`, and relevant docs in `docs/`.

---

## 3. Mandatory Commands That Must Pass Before Completion

Every agent task must verify:

```bash
npm run compile       # Strict TypeScript typecheck
npm run lint          # ESLint rules
npm run format:check  # Prettier style check
npm test              # Full Vitest test suite
npm run version:check # Version consistency check
npm run build:all     # Build Chrome, Firefox, Edge, and Brave
npm run artifacts:check # Verify manifests, permissions, and referenced files
```

---

## 4. Conventional Commits & SemVer

All commits must follow Conventional Commits format:

- `feat(rules): ...`
- `fix(linkedin): ...`
- `docs: ...`
- `test: ...`
- `perf: ...`
- `chore: ...`

Release Please automatically cuts releases based on these prefixes.
