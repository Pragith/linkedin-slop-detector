---
name: test-extension
description: Instructions for running complete quality assurance checks on the extension.
---

# Testing the LinkedIn Slop Detector

Run the full verification pipeline:

```bash
# 1. Typecheck
npm run compile

# 2. Linting
npm run lint

# 3. Code formatting
npm run format:check

# 4. Unit & integration test suite
npm test

# 5. Version consistency check
npm run version:check

# 6. Build all browser packages
npm run build:all

# 7. Verify manifests, permissions, and referenced assets
npm run artifacts:check
```

Never proceed if any of the above commands fail.
