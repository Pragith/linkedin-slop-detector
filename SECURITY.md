# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a Vulnerability

I take the security and privacy of this extension seriously.

If you discover a security vulnerability (such as a Cross-Site Scripting vector, ReDoS vulnerability, or unsafe deserialization):

1. **Do not open a public GitHub issue.**
2. Please report the issue privately by emailing the maintainer or opening a GitHub Security Advisory.
3. I will review and address the issue promptly.

## Security Architecture Principles

- **Zero Dynamic Execution**: The extension does not use `eval()`, `new Function()`, or inline `<script>` tags.
- **Safe DOM Injection**: Highlighting and badges are constructed exclusively using standard DOM APIs (`document.createElement`, `document.createRange`), never raw unescaped `innerHTML` on user content.
- **Untrusted User Configuration**: Custom regex patterns are syntax- and complexity-checked, limited to 500 characters, bounded by rule and scan limits, and compiled within defensive error boundaries.
