# Roadmap

This roadmap records intended product direction. It is not a promise of a release date, and planned behavior may change after testing and community feedback.

## Next minor release: LinkedIn comments

The next version is planned to extend slop detection to LinkedIn comments. Comment scanning will be disabled by default until its false-positive behavior and performance are well understood.

The implementation should:

- add a separate LinkedIn comment adapter without coupling comment markup to the core detector;
- support dynamically loaded, expanded, paginated, and recycled comment nodes;
- provide an independent setting for enabling comment detection;
- reuse configurable rules and scoring while allowing comment-specific thresholds;
- highlight, outline, dim, collapse, or hide matched comments where each action is safe;
- avoid scanning author names, timestamps, reaction controls, and accessibility-only metadata;
- preserve keyboard navigation, focus, and LinkedIn event handlers;
- add fixture-based adapter tests, mutation tests, performance coverage, and browser smoke tests; and
- keep all processing local with no telemetry, remote classifiers, or post/comment text leaving the browser.

## Later possibilities

Potential later work includes per-site profiles, additional writing surfaces, language-specific rule packs, and inspectable community rule packs. These remain exploratory and are not part of the next release.
