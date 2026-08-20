# Local Development Guide

## Environment Setup

Ensure you have Node.js 22+ and npm 10+ installed.

```bash
git clone https://github.com/pragith/linkedin-slop-detector.git
cd linkedin-slop-detector
npm ci
```

---

## Available NPM Scripts

- `npm run dev`: Launch WXT Chrome development server with Hot Module Reloading (HMR).
- `npm run dev:firefox`: Launch Firefox development server.
- `npm run build:all`: Compile production extensions for Chrome, Firefox, Edge, and Brave.
- `npm run zip:all`: Create browser-specific release archives and SHA-256 checksums under `build/release/`.
- `npm test`: Run full Vitest test suite.
- `npm run compile`: Run strict TypeScript compiler verification without emitting.
- `npm run lint`: Run ESLint across all TypeScript and React components.
- `npm run format`: Auto-format all code with Prettier.
- `npm run version:check`: Verify version sync between `package.json` and release manifests.
