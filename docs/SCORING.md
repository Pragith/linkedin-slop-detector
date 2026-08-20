# Scoring Model & Action Precedence

## Weighted Scoring Engine

Rather than a simplistic binary flag (_"AI detected"_), the engine calculates an accumulated **Slop Score** based on pattern weights, density thresholds, and category clustering.

### Standard Scoring Matrix

| Rule Pattern Family                                   | Default Weight | Severity |
| ----------------------------------------------------- | -------------- | -------- |
| Negation Contrast (_"Not just X, it's Y"_)            | +4.0           | 4/5      |
| Bipartite Contrast (_"Not only X but Y"_)             | +4.0           | 4/5      |
| Faux Insight (_"What most people get wrong"_)         | +3.0           | 3/5      |
| Canned Opener (_"The answer is simple:"_)             | +3.0           | 3/5      |
| Dramatic Colon Reveal (_"The result: ..."_)           | +3.0           | 3/5      |
| Inflated Metaphors (_testament to, tapestry of_)      | +3.0           | 3/5      |
| Classic LLM Vocabulary (_delve, underscore, pivotal_) | +2.0           | 2/5      |
| Corporate Inflation (_leverage, utilize, foster_)     | +1.0           | 1/5      |
| Generic Transitions (_moreover, furthermore_)         | +1.0           | 1/5      |
| Empty Intensifiers (_fundamentally, truly_)           | +1.0           | 1/5      |

---

## Density-Based Rules

Isolated occurrences of certain stylistic elements (such as a single em-dash or a single list of three items) do not constitute slop.

When density scoring is enabled, density rules only contribute points when they repeat at or above their configured **`densityThreshold`**. When it is disabled, each occurrence scores normally.

- **Rule of Three Lists**: Minimum 2 occurrences in one post.
- **Em-Dash Density**: Minimum 3 occurrences in one post (0.5 pts each).

---

## Category Diversity Bonus

A hallmark of generated or formulaic writing is the simultaneous stacking of multiple cliché families.

- **Threshold**: 3 or more distinct rule categories within a 250-word window.
- **Bonus**: +5.0 points added to the total score.

---

## Action Precedence

When a post meets every configured threshold, filtering actions use this precedence:

```text
Hide > Collapse > Dim > Outline > Highlight
```

1. **Hide**: If enabled, post is removed from the DOM layout.
2. **Collapse**: Post body is replaced by a compact placeholder with a one-click **"Show post"** toggle.
3. **Dim**: Post opacity is reduced to 38% and desaturated until hovered.
4. **Outline**: An accented border is applied around the card.
5. **Highlight**: Exact matched phrases are wrapped with `<mark class="lsd-highlight">`.

Badge, score, count, outline, and highlighting controls remain independently configurable where the selected filtering action leaves the post visible.
