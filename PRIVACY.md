# Privacy Policy

LinkedIn Slop Detector processes post text locally and does not collect user data.

Last updated: August 20, 2026

## Local processing

Every LinkedIn post scanned by the extension is processed inside the browser. Post content, author information, timestamps, matches, and scores are not transmitted to Pragith Prakash or any third party.

The extension does not contain analytics, tracking pixels, advertising SDKs, crash-reporting services, remote rule configuration, cloud detection, or LLM API calls.

## Stored data

The extension stores the following configuration in local WebExtension storage:

- Detection and appearance settings
- Built-in rule overrides and deletion tombstones
- User-created rules
- Storage schema version and last-update timestamp

This data remains in the browser profile. It can be exported or deleted from the Data & Backup settings page.

## Permissions

- `storage` saves local settings and rules.
- `*://*.linkedin.com/*` allows the content script to inspect and render controls around LinkedIn posts.

No additional browser permissions are requested by the Chrome, Brave, Edge, or Firefox builds.

The Firefox manifest also declares `data_collection_permissions.required: ["none"]`, the Mozilla-specific disclosure that the extension collects or transmits no data.

## Security safeguards

Custom regular expressions are treated as untrusted configuration. The extension validates syntax and flags, limits pattern length and custom-rule count, rejects patterns with unsafe repetition complexity, caps scanned text and matches, and isolates compilation or matching errors.

Post highlighting uses text nodes and DOM ranges. Imported text is never inserted as executable HTML, and the extension does not use dynamic code execution.

## Contact

For privacy questions, open an issue in the [GitHub repository](https://github.com/Pragith/linkedin-slop-detector/issues).
