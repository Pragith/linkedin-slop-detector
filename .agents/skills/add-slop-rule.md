---
name: add-slop-rule
description: Step-by-step instructions for adding a new detection rule to the LinkedIn Slop Detector codebase.
---

# Adding a New Slop Rule

Follow these deterministic steps to add a new pattern rule:

1. **Identify Rule Properties**:
   - Unique ID (kebab-case, e.g., `contrast-new-pattern`)
   - Descriptive title-cased name
   - Clear description explaining why this indicates formulaic writing
   - Extensible category (from `VALID_CATEGORIES` in `src/rules/ruleValidation.ts`)
   - Clean regular expression pattern and flags (typically `'i'` or `'im'`)
   - At least 2 positive examples (real phrases that match)
   - At least 1 counter-example (phrases that must NOT match)
   - Severity (1-5) and Weight (e.g. 1 to 4)

2. **Add to Default Seed**:
   - Open `src/rules/defaultRules.ts`.
   - Add the rule object to the `DEFAULT_RULES` array in the appropriate category block.

3. **Verify Tests**:
   - Run `npm test`. The automated seed test in `tests/rules/defaultRules.test.ts` will automatically validate that:
     - Regex compiles cleanly.
     - All positive examples match.
     - All counter-examples do NOT match.

4. **Formatting & Quality**:
   - Run `npm run compile`.
   - Run `npm run lint`.
   - Run `npm run format`.
