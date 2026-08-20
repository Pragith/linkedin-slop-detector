# Troubleshooting Guide

## Common Issues & Solutions

### 1. Posts are not being highlighted or badged on LinkedIn

- **Check Extension Switch**: Open the toolbar popup and verify the global switch is ON.
- **Check Threshold**: The post's accumulated score may be below the configured threshold (default: 4). Try lowering the threshold in the popup or options page.
- **Single Post Permalinks**: Ensure **"Individual Post Pages"** is enabled in the General tab if viewing permalink URLs.

### 2. LinkedIn DOM markup changes

- If LinkedIn updates their class names or DOM hierarchy, posts might not be detected.
- Inspect `src/linkedin/adapter.ts` to add new fallback selector candidates to `LINKEDIN_SELECTORS`.

### 3. Custom Rule gives "Invalid regular expression" error

- Ensure you do not include surrounding slashes `/.../` in the Pattern field — enter only the raw regex string.
- Check that all parentheses and brackets are properly closed.
