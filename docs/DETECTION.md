# Detection Architecture & Philosophy

## Stylistic Evidence vs. AI Attribution

**LinkedIn Slop Detector does not classify posts as "AI-generated."**

Machine learning classifiers that output "98% AI" are notoriously prone to high false-positive rates on non-native English speakers, formal prose, and technical writing.

Instead, this extension detects **stylistic slop patterns**:

- Rhetorical clichés and formulaic contrast framing.
- Corporate inflation and buzzword stuffing.
- Overused LLM verb and adjective clusters.
- Manufactured drama hooks (_"Here's what nobody tells you"_).

---

## Detection Pipeline

1. **Text Extraction**: The post extractor extracts visible body text from `.feed-shared-update-v2__description-wrapper` while ignoring `.visually-hidden`, `.feed-shared-actor`, buttons, and comment trees.
2. **Text Normalization**: Quotes (`“`, `”`, `‘`, `’`) are converted to standard ASCII equivalents (`"`, `'`) to ensure resilient regex evaluation without changing character offset indices.
3. **Execution**: Syntax- and complexity-validated rules are compiled into cached `RegExp` instances and matched against bounded normalized text.
4. **Range Conflict Resolution**: If multiple rules overlap in the same text span, the engine chooses the span with the highest severity, highest weight, and longest span to ensure highlight stability.
5. **Scoring & Threshold Check**: Density rules are evaluated against occurrence thresholds, diversity bonuses are limited to 250-word windows, and score, match, and category totals are compared with the user's thresholds.
