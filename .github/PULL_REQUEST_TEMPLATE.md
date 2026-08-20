## Description

Please provide a clear and concise summary of your changes.

- [ ] New Slop Detection Rule
- [ ] Rule Refinement / False-Positive Fix
- [ ] LinkedIn DOM Adapter Improvement
- [ ] UI / Settings Feature
- [ ] Bug Fix
- [ ] Documentation / CI

## Conventional Commit Check

- [ ] Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) specification (e.g., `feat(rules): ...`, `fix(linkedin): ...`).

## Testing Checklist

- [ ] Added unit tests covering positive cases.
- [ ] Added unit tests covering counter-examples (false-positive prevention).
- [ ] `npm run compile` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run format:check` passes.
- [ ] `npm test` passes (all test suites pass).
- [ ] `npm run build:all` builds successfully for Chrome, Firefox, and Edge.

## Privacy & Security

- [ ] Zero telemetry or tracking code added.
- [ ] Zero external network calls for detection.
- [ ] Zero unsafe DOM manipulation (`innerHTML` is never used on user post trees).
