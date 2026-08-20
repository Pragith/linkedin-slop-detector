# Release Workflow

Release Please manages SemVer, the changelog, release pull requests, Git tags, GitHub release titles, and generated release notes from Conventional Commits.

## Automated pipeline

```text
Conventional Commits reach main
              |
              v
Release Please updates a release PR
              |
              v
The maintainer merges the release PR
              |
              v
Release Please creates tag vX.Y.Z and GitHub release vX.Y.Z
              |
              v
The same workflow checks out that exact tag, validates it, builds all targets,
packages archives, writes SHA256SUMS.txt, and attaches every file to the release
```

Keeping artifact upload in the same workflow is intentional: GitHub does not start a second workflow from release events created with the repository `GITHUB_TOKEN`.

Release assets use these names:

```text
linkedin-slop-detector-chrome-vX.Y.Z.zip
linkedin-slop-detector-brave-vX.Y.Z.zip
linkedin-slop-detector-edge-vX.Y.Z.zip
linkedin-slop-detector-firefox-vX.Y.Z.zip
SHA256SUMS.txt
```

The Brave archive is byte-for-byte identical to the Chrome archive because both browsers use the same Chromium Manifest V3 package. It receives a separate filename so users can select the intended download unambiguously.

## Local release verification

```bash
npm ci
npm audit --audit-level=high
npm run compile
npm run lint
npm run format:check
npm test
npm run build:all
npm run zip:all
npm run version:check
```

Set `RELEASE_TAG=vX.Y.Z` when checking a tagged build so `version:check` also compares the tag with package and generated manifest versions.

## Semantic Versioning

- Patch (`fix:`): bug fixes, false-positive reductions, rule corrections, and selector repairs.
- Minor (`feat:`): new rules, settings, and user-visible features.
- Major (`feat!:` or `BREAKING CHANGE:`): changes that cannot transparently migrate stored configuration or a public API.

The workflow `.github/workflows/release-please.yml` is the only automated publisher. Ordinary CI never publishes artifacts.
