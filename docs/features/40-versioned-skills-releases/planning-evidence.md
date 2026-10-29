# Planning evidence — 40-versioned-skills-releases

Frozen at plan cut (2026-10-28). One row per Engineering claim the change rests
on. Row shape: `id | authority-kind | claim | source | freshness |
affected-decision-or-obligation`. An unsampled assumption is `unknown` with an
owner — never a silent citation.

```text
planning-evidence@1 (row shape per skills/unit-lane/references/EVIDENCE.md)
id | authority-kind | claim | source | freshness | affected-decision-or-obligation
PE-001 | repo-surface | Per-skill bump policy (major/minor/patch definitions) and the per-skill changelog row shape `| <version> | <date> | <type> | <summary> |` under `## Per-skill version history` are the authoritative bump contract | CHANGELOG.md "Versioning policy" + skills/bump-skill/references/VERSION_AND_DOCS.md | current at 2026-10-28 HEAD | O1, O2, O3
PE-002 | repo-surface | version-parity-gate content half triggers on `skills/**` + `packages/pi-agentic-workflow/**` and requires a package version bump + CHANGELOG.md "Companion npm packages" row | scripts/version-parity-gate.mjs header + TRIGGER_PREFIXES | current at 2026-10-28 HEAD | O5, O23, O24
PE-003 | tool-doc | `npm publish --tag <name>` attaches the given dist-tag; only `--tag latest` (the default) moves `latest` | npm CLI documentation (npm-publish) | stable standard | O15, O16
PE-004 | tool-doc | `gh release create <tag> --generate-notes --notes <body>` combines auto-generated notes (title + contributor credits from merged PR authors) with the provided body | `gh release create --help`, sampled in-session 2026-10-28 | fresh (sampled) | O17
PE-005 | standard | Semver prerelease versions are excluded by `^`/`~` ranges, so `<base>-canary.<date>.<n>` never satisfies a consumer range | semver.org §9 (ranges) | stable standard | O11
PE-006 | design | AC-03 fixes ALL three package.json versions to the train version — the unified train (D-40-2) means one version number across packages | docs/features/40-versioned-skills-releases/SPEC.md AC-03 + decisions.md D-40-2 | frozen design | O10
PE-007 | design | Canary version shape is `<base>-canary.<yyyymmdd>.<n>` (Bun-style), monotonic, deterministic per HEAD | SPEC AC-07/AC-12 + decisions.md D-40-3 | frozen design | O11
PE-008 | repo-surface | npm Trusted Publisher records are bound to (repository, workflow filename); renaming publish-*.yml breaks npm-side publishing until re-registered | .github/workflows/publish-pi-package.yml header comment | current at 2026-10-28 HEAD | O22
PE-009 | external-standard | Changesets intent-file format: markdown with YAML frontmatter mapping `"<package-name>": patch|minor|major`, body = release note | changesets official docs (file format) | stable standard | O9
PE-010 | unknown | Determinism of GitHub's `--generate-notes` rendered body (not asserted in tests; tests assert command construction only) | owner: execute-phase, verify manually at first real release | unsampled | O17
PE-011 | repo-surface | Root suites run under both `bun` and `node --test`; every new test file must pass under both runtimes | AGENTS.md "Verification" + CI node-compat job pattern | current at 2026-10-28 HEAD | O21
PE-012 | repo-surface | The `.claude-plugin/plugin.json` skills array is alphabetical and `bump-skill` is `metadata.internal` (filtered from the npm bundle) | .claude-plugin/plugin.json + skills/bump-skill/SKILL.md frontmatter | current at 2026-10-28 HEAD | O4
```
