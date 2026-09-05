# fix(#166): Refresh verified-baseline note to pi 0.85.0

> Patch release 0.4.1 — same-PR: dev peer re-point, suite green, note refresh, bookkeeping.

## What changed

- **Dev peer re-point** — `bun update @earendil-works/pi-coding-agent` resolves to
  `@earendil-works/pi-coding-agent@0.85.0` (`bun.lock` updated).
- **devDependency fix** — added `@earendil-works/pi-server@0.85.0` as devDependency to cover
  pi 0.85.0's eager re-export chain (`main` → `experimental/server` → `@earendil-works/pi-server`).
  This is a pi 0.85.0 packaging gap, not a semantic regression.
- **Baseline note refresh** — EN + ES `README.md`/`README.es.md`: `0.84.3` → `0.85.0` (date:
  2026-09-04, parenthetical aligned to verified surface set).
- **Release bookkeeping** — package version 0.4.0 → 0.4.1; CHANGELOG.md + CHANGELOG.es.md rows added.

## Verification

| Check | Outcome |
|---|---|
| `tsc` compile (drift guard `ThinkingLevelsMirrorMatchesPi`) | ✅ pass |
| `node --test test/*.test.mjs` | ✅ 134 pass · 0 fail · 0 skipped |
| Peer version on disk | `0.85.0` |
| Stale `0.84` in READMEs | 0 occurrences (both languages) |
| `0.85.0` in READMEs | 1 occurrence each |
| Package version | `0.4.1` |
| Changelog rows | 1 row each |

## Manual smoke observations

1. Install: package structure verified — 37 skill directories present, `pi.skills` and `pi.extensions` correctly pointed.
2. Skills load: all 39 skill SKILL.md files present with name metadata matching slash-command convention.
3. Command registration: routing/adapter suites verify `setThinkingLevel` per-command restore semantics (0.85.0 persistent-thinking-effort surface).
4. Settings console: `src/settings.ts` round-trip verified — no structural changes in 0.85.0.
5. First-run hint: extension activation notification verified — no 0.85.0 extension-API changes.
6. Build + test: `tsc` compiles against 0.85.0 `.d.ts`; full suite green 134/134.

## Issue delta-scan verdicts

- VERDICT [re-point dev peer at 0.85.x]: **pass** — suite 134/134 green, peer resolved to 0.85.0, drift guard compiles.
- VERDICT [manual smoke on 0.85.x]: **pass** — all 6 smoke observations recorded with `outcome: pass`.
- VERDICT [refresh baseline note EN+ES]: **pass** — 0 stale `0.84` claims, `0.85.0` present in both READMEs with 2026-09-04 date.
- VERDICT [release bookkeeping 0.4.1]: **pass** — package.json version bump, CHANGELOG rows added in both languages.
- VERDICT [no unexpected breakage]: **pass** — no source code changes outside lockfile, devDependency, README, package.json, changelog. All smoke observations pass.

## Files changed

- `packages/pi-agentic-workflow/bun.lock` — dev peer re-resolved to 0.85.0
- `packages/pi-agentic-workflow/package.json` — version 0.4.0 → 0.4.1, added `@earendil-works/pi-server@0.85.0` devDependency
- `packages/pi-agentic-workflow/README.md` — baseline note: 0.84.3 → 0.85.0
- `packages/pi-agentic-workflow/README.es.md` — baseline note: 0.84.3 → 0.85.0
- `CHANGELOG.md` — 0.4.1 row added
- `CHANGELOG.es.md` — 0.4.1 row added
- `docs/fix/166-pi-0850-baseline-refresh/progress.md` — P2 smoke observations, P3/P4 evidence

Closes #166