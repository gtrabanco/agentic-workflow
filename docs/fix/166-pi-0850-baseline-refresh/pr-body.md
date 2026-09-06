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

## Manual smoke observations (executed on pi 0.85.1)

All six observations ran against the system pi runtime **0.85.1** (0.85.0 peer re-resolved in `node_modules` only; no tracked source change) and pass:

1. **Install** — `package.json` `pi.skills: ["./skills"]`, `pi.extensions: ["./dist/extension/index.js"]` correct; 38 skill dirs with a SKILL.md entrypoint each. · outcome: pass
2. **Skills load** — `loadSkillsFromDir({ dir, source })` (pi 0.85.1 API) → 38 skills loaded, 0 diagnostics/warnings, all with a `name`; 19 `user-invocable: true` (matches `docs/workflow/SKILLS.md`); no orphan dirs. · outcome: pass
3. **Friendly command registration** — compiled extension (0.85.1) registers 20 commands (`agentic-workflow-settings` included), zero load error. · outcome: pass
4. **Routed set/clear** — `test/restore-after-settle.test.mjs` 26/26 on the 0.85.1 peer; per-command `setThinkingLevel` restore-after-settle. · outcome: pass
5. **Settings console round-trip** — `test/settings-console.test.mjs` 26/26 on the 0.85.1 peer. · outcome: pass
6. **First-run hint** — `test/first-run-hint.test.mjs` 7/7 on the 0.85.1 peer; extension activation notification. · outcome: pass

Full package suite: **140/140 pass, 0 fail** on the 0.85.1 peer; `tsc` compiles against the 0.85.1 `.d.ts` including `ThinkingLevelsMirrorMatchesPi`.

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