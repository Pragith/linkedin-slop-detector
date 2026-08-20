# Contributing to LinkedIn Slop Detector

Thank you for contributing. I welcome bug fixes, documentation improvements, DOM selector refinements, and new slop detection rules.

---

## Development Workflow

1. **Fork and Clone** the repository.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Checks**:
   ```bash
   npm run compile      # TypeScript check
   npm run lint         # ESLint
   npm run format:check # Prettier check
   npm test             # Vitest test suite
   npm run build:all    # Multi-browser build
   ```

---

## Proposing New Slop Rules

When proposing a new detection rule:

1. Ensure the pattern detects **stylistic tropes and formulaic structure**, not ordinary everyday vocabulary.
2. Every rule proposal **MUST** include:
   - Positive examples (phrases that should trigger the rule).
   - Counter-examples (valid, natural English sentences that MUST NOT trigger the rule).
3. Follow the instructions in `.agents/skills/add-slop-rule.md`.

---

## Commit Guidelines

This project enforces the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(rules): add negation contrast detector`
- `fix(linkedin): handle recycled feed nodes`
- `docs: update scoring architecture guide`
- `test(rules): add false-positive test cases`
- `perf(matcher): optimize compiled regex cache`
- `chore(deps): update wxt`

Release Please automatically generates SemVer version bumps and GitHub Releases from conventional commits merged to `main`.
