# Chrome Web Store Listing: LinkedIn Slop Detector

_Last Updated: 2026-08-20_

---

## 1. Store Metadata

- **Extension Name**: LinkedIn Slop Detector
- **Summary / Short Description**: Detects common AI-generated writing clichés, formulaic openers, and stylistic slop patterns in LinkedIn posts.
- **Category**: Productivity / Social & Communication
- **Primary Language**: English

---

## 2. Detailed Description

Take back control of your LinkedIn feed with **LinkedIn Slop Detector** — a privacy-first, lightweight browser extension that highlights and filters formulaic writing clichés, corporate buzzword inflation, and overused AI tropes.

### Key Capabilities

- **Deterministic Pattern Matching**: Evaluates posts using 61 transparent, customizable linguistic pattern rules (contrast tropes, canned hooks, dramatic reveals, buzzword clusters, and formatting quirks).
- **Customizable Actions**: Outline, highlight matched phrases, display an unobtrusive score badge, dim, collapse, or completely hide detected posts.
- **Full Rule Customization**: Create custom regular expression rules, edit existing rules, or tune sensitivity thresholds directly in the settings dashboard.
- **100% Private & Local**: Scanning runs entirely on your device. Zero telemetry, zero tracking, and no external AI services or cloud servers.

### What Does It Detect?

- **Contrast Tropes**: _"It's not just X, it's Y"_, _"X isn't just about Y"_, _"Not only X but also Y"_
- **Canned Openers**: _"The answer is simple:"_, _"Here's the thing:"_, _"Let me be clear:"_
- **Faux Insights**: _"What most people get wrong"_, _"Here's what nobody tells you"_
- **Inflated Metaphors**: _"Stands as a testament to"_, _"Navigate the complexities of"_, _"Tapestry of"_
- **Overused LLM Words**: _delve, underscore, pivotal, nuanced, multifaceted, seamless, transformative_

---

## 3. Permissions Justifications

| Permission                               | Justification                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `storage`                                | Required to store user settings, detection score thresholds, custom regex rules, and rule overrides locally on the user's computer.  |
| `*://*.linkedin.com/*` (Host Permission) | Required to inspect post text and inject non-intrusive visual badges, highlights, and collapsed placeholders on LinkedIn feed pages. |

---

## 4. Privacy & Data Disclosures

- **Single Purpose**: Detect and filter formulaic writing tropes on LinkedIn.
- **Data Collection**: None. The extension collects zero user data, personal info, or browsing history.
- **External Calls**: Zero. All pattern recognition runs offline in JavaScript.

---

## 5. Version History

- **v0.1.0 (2026-08-20)**: Initial production release for Chrome, Firefox, Edge, and Brave with 61 built-in rules and full CRUD rule override management.
