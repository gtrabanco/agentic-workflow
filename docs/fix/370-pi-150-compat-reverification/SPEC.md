# fix/370-pi-150-compat-reverification

> Fix specification — one single unit document, cut in the re-cut
> `spec-by-reference` shape from `docs/fix/_TEMPLATE/SPEC.md`. Size: **S** — the
> planning ledgers are embedded below (`### Planning evidence`, `### Obligations`),
> never beside this doc.

## Issue

`#370` — chore(deps): pi 1.5.0 compatibility re-verification + dependency refresh
in pi-agentic-workflow. The PR closes it via `Closes #370`, and closes the folded
pin-drift issue `#367` via `Closes #367`.

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. The frozen
request is L1; every later decision cites its `S#`.

**S1 — Re-run the two-leg guard and record COMPAT-OK.**
> Re-run the two-leg `pi-compat-guard` (`tsc --noEmit`, legs `0.99.1` + `latest` → 1.5.0) and record COMPAT-OK.

**S2 — Refresh the README baseline.**
> Update the README "Verified against the peer floor" note with the new verification version/date.

**S3 — The peer floor stays where it is.**
> Confirm the peer floor stays `>=0.99.1` — no 1.5.0 API is adopted (see table above), so no floor bump is justified.

**S4 — Fold the `@types/node` drift in.**
> Fold the `@types/node` pin bump from #367 into the same `fix(deps)` PR (read its release notes first, per that issue).

**S5 — Release intent, same PR.**
> Per AGENTS.md → Packages: bump the package version and add the CHANGELOG companion row in the same PR (or ship the changeset intent); close #367 from that PR.

**S6 — The audit is recorded where the PR can be read.**
> Record this audit (what was checked, why nothing changed) in the PR description.

The issue's own premise, which S1 and S6 answer:

> Pi 1.5.0 shipped (changelog: pi.dev/changelog/releases/1.5.0). A surface-by-surface audit of `@gtrabanco/pi-agentic-workflow` found **zero required code changes** — but the repo's own re-verification pattern (feature 72 / issue #283) and the standing `fix(deps)` cadence (AGENTS.md → Packages) both apply. This issue collects the deliberate, same-PR work.

## Impact

- `packages/pi-agentic-workflow/README.md` — the `## Notes` baseline is the
  at-a-glance record every consumer reads; it is the only claim this unit edits
  in prose, and its peer-floor sentence is a second copy of the manifest's floor.
- `packages/pi-agentic-workflow/package.json` — a `devDependencies` pin only.
  No `src/` line, no `dependencies`, no `peerDependencies` entry moves.
- `bun.lock` (repository root) — the one lockfile for the whole workspace; the
  `@types/node` entry and its `undici-types` resolution move with the pin.
- `packages/pi-agentic-workflow/test/verified-baseline.test.mjs` (new) — the
  parity reader that keeps the README floor equal to the manifest floor and the
  dated baseline at or above it.
- Readers of both `/tmp`-free commands: `scripts/pin-watch.mjs` and the `--pins`
  half of `scripts/version-parity-gate.mjs` (the scheduled watch files the issue;
  the PR gate checks `dependencies` only) — the drift they report is this unit's
  frozen failure, so both are re-run, not trusted.
- `.changeset/` — the release intent the train consumes at cut time; the
  CHANGELOG companion row for the version this PR ships is written by
  `scripts/release.mjs apply`, never by hand.
- Forge trail — the PR body carries the audit (S6) and auto-closes `#367` on
  merge (S5). `#367`'s own text asks for exactly that.

## Retirements

Nothing is removed from code. Two live claims stop being true and are replaced in
the same change:

| retired claim / pin | replacement | negative-capability evidence |
|---|---|---|
| README `Also verified against Pi 1.2.0 (2026-10-14)` | `Also verified against Pi 1.5.0 (2026-11-02)` | `rg -c '1\.2\.0' packages/pi-agentic-workflow/README.md` matches 0 after P4 (the 1.2.0 record survives only in the frozen `CHANGELOG.md` release note for 0.19.1, which is history, not a live claim) |
| `devDependencies."@types/node": "24.13.3"` | `"26.6.6"` | `rg -c '24\.13\.3' packages/pi-agentic-workflow/package.json` matches 0 after P5; the workspace lock carries no 24.13.3 entry |

## Non-goals

Quoted from the issue, verbatim:

> - No adoption of 1.5.0-only APIs (no `pi.changelogPath`/extension changelog — that is a separate feature decision, no issue yet).
> - No model-catalog refresh beyond confirming the router's degradation path — no evidence of affected configs.
> - No TypeBox/`pi-ai` dependency introduced: the package's TypeBox advantage is nil today (zero registered tools) and 1.5.0 narrows TypeBox to JSON Schema features anyway; the only future consumer is #274.

Plus, declared by this unit: no `src/` change, no peer-range change, no
`.node-version` change, no second lockfile, no hand-written CHANGELOG row.

## Future

| deferred idea (verbatim) | date | status |
|---|---|---|
| "no `pi.changelogPath`/extension changelog — that is a separate feature decision, no issue yet" | 2026-11-02 | open |

Nothing else was deferred. This unit implements nothing above.

## Future cost

- **The README baseline and the peer floor move together.** Whoever bumps
  `peerDependencies` of `@earendil-works/pi-coding-agent` must edit the floor
  sentence in `README.md`'s `## Notes` in the same change — the new
  `test/verified-baseline.test.mjs` fails when the two disagree.
- **The typings now lead the CI runtime by two majors.** `@types/node` 26.6.6
  describes Node 26, `.node-version` runs v24.21.0, and `engines.node` says
  `>=18`: `tsc` will accept a Node-26-only API that the declared floor lacks.
  Binds whoever adds a Node API to the package or moves `.node-version` — the
  types are bumped by the `fix(deps)` cadence, not by this unit's needs.
- **The `latest` guard leg is a moving tripwire** (feature 72 AC2). A breaking
  pi release reddens this repo first; the reaction is a re-verification unit
  like this one, never a pin.

## Applicable tests

- `cd packages/pi-agentic-workflow && bun run test` — the package suite
  (includes `test/lockfile-policy.test.mjs`, which refuses an npm lockfile under
  `packages/`, the one way the guard's temp copy could leave a trace).
- `cd packages/pi-agentic-workflow && bun test test/verified-baseline.test.mjs` —
  the new README/manifest parity pin (S2, S3).
- `node scripts/run-root-suite.mjs` — the root suites, including
  `scripts/workspace-lock-policy.test.mjs` (one lockfile) and
  `scripts/version-parity-gate.test.mjs`.
- `node scripts/pin-watch.mjs --check` — the frozen failure (CR-1), offline-safe
  apart from the registry read it exists to do.
- The two-leg `tsc --noEmit` run — the reproducer (CR-2) and S1's instrument.

## Known pre-existing issues

- **The pin watch files a major jump as drift.** `scripts/pin-watch.mjs` compares
  exact pins against the registry's `latest` regardless of major, while its own
  doc says a newer major outside a *partial* pin's range is a notice. `@types/node`
  is an exact pin, so 24.13.3 → 26.6.6 was filed as drift (#367) and only a bump
  silences it. **Affects** S4's target (26.6.6, the version the issue names) and
  D1; does not affect the package's runtime behaviour.
- **`docs/LOGS.md:3675` already names this unit's target** ("a fix(deps) PR for
  @types/node 24.13.3 -> 26.6.6, which the watch now reports"), written by the
  session that opened #370. **Does not affect** the ledgers: it is a prior
  decision record, cited in D1 rather than re-derived.
- **`/tmp` is a 5.8 GB tmpfs on this dev machine** (feature 72's report-note). The
  two-leg run fit (both legs, 21.7 s, ~2.8 GB free at start). **Does not affect**
  the guard job, which uses the runner's own `mktemp -d`.

## Tasks

- P1 — Cut this unit doc: `S1`–`S6` verbatim, the two ledgers, the acceptance
  criteria, and the frozen-failure corpus (`CR-1`, `CR-2`) in the Log (validator:
  `bun scripts/phase-lint.mjs docs/fix/370-pi-150-compat-reverification/SPEC.md`
  exits 0 and its final line before the fingerprint reads `verdict PASS`)
  (Implements: S1, S2, S3, S4, S5, S6)
  Relevant files: docs/fix/370-pi-150-compat-reverification/SPEC.md
- P2 — Tests first: add `test/verified-baseline.test.mjs`, the parity pin between
  the README's `Also verified against Pi …` baseline (and its peer-floor
  sentence) and `package.json`'s `peerDependencies` floor (validator:
  `cd packages/pi-agentic-workflow && bun test test/verified-baseline.test.mjs`
  exits 0 with 3 cases)
  (Implements: S2, S3)
  Relevant files: packages/pi-agentic-workflow/test/verified-baseline.test.mjs
- P3 — Re-run the two legs exactly as `root-suite.yml`'s `pi-compat-guard` job
  does — temp copy, `npm install --no-save --no-package-lock` for `0.99.1` and
  `latest`, `tsc --noEmit` — and record both legs' verbatim result (validator:
  the two-leg sequence exits 0 on both legs and prints
  `pi leg <leg>: tsc --noEmit clean` twice)
  (Implements: S1, S3)
  Relevant files: docs/fix/370-pi-150-compat-reverification/SPEC.md
- P4 — README `## Notes`: baseline becomes `Pi 1.5.0 (2026-11-02)`, the floor
  sentence keeps `Pi 0.99.1` and the `latest`-is-a-tripwire clause (validator:
  `rg -c 'Also verified against Pi 1\.5\.0 \(2026-11-02\)' packages/pi-agentic-workflow/README.md`
  matches 1 and the P2 suite still exits 0)
  (Implements: S2, S3)
  Relevant files: packages/pi-agentic-workflow/README.md
- P5 — `@types/node` `24.13.3` → `26.6.6` with the release-notes read recorded
  (what moved, what does not matter here) and the workspace lock refreshed
  (validator: `node scripts/pin-watch.mjs --check` exits 0 with `VERDICT: PASS`
  and `bun install --frozen-lockfile` exits 0)
  (Implements: S4)
  Relevant files: packages/pi-agentic-workflow/package.json, bun.lock
- P6 — Ship the release intent: `.changeset/370-pi-150-compat-reverification.md`
  declaring the package name `@gtrabanco/pi-agentic-workflow` at `patch` with the
  audit in its body
  (validator: `bun scripts/lint-changeset.mjs` exits 0 and
  `node scripts/version-parity-gate.mjs --content --base main` prints
  `VERDICT: PASS` naming the changeset as the pi package's route)
  (Implements: S5)
  Relevant files: .changeset/370-pi-150-compat-reverification.md, docs/ROADMAP.md
- P7 — Verification: package suite, root suite, `phase-lint`, `unit-lineage` all
  green on the full diff, and every obligation row closed (validator:
  `cd packages/pi-agentic-workflow && bun run test` exits 0,
  `node scripts/run-root-suite.mjs` exits 0, and
  `node scripts/unit-lineage.mjs --unit 370-pi-150-compat-reverification` prints
  `LINEAGE OK`)
  (Implements: S1, S4, S5)
  Relevant files: packages/pi-agentic-workflow/, scripts/
- P8 — Hand off the diff as the `fix(deps)` PR: audit table in the body (what was
  checked, why nothing changed), `Closes #370` and `Closes #367` footers
  (validator: `gh pr view --json body` matches the six audit rows and both
  `Closes` footers, and `gh pr checks` exits 0)
  (Implements: S1, S6, S5)
  Relevant files: docs/fix/370-pi-150-compat-reverification/SPEC.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The npm `latest` dist-tag resolves to pi **1.5.0**, so the guard's `latest` leg is the version the issue names | `npm view @earendil-works/pi-coding-agent version dist-tags.latest` → `version = '1.5.0'`, `dist-tags.latest = '1.5.0'` | current | O1, O2 |
| PE-002 | known | The package registers zero tools and imports nothing from `pi-ai`: 1.5.0's pi-schema tool-argument validation and its TypeBox/`pi-ai` re-export change cannot reach it | `rg -c 'registerTool' src/` → 0, `rg -c 'Type\.' src/` → 0, `rg -c 'pi-ai' src/` → 0 (run in `packages/pi-agentic-workflow`) | current | O3, S6 audit row 1 |
| PE-003 | known | `pi.exec()` changes are unreachable: the package spawns node `child_process` directly (`spawn` in `conductor/sensor.ts:12`, `execFile` in `extension/conductor-command.ts:12`, `spawnSync` in `extension/receipt-guard.ts:19`) and `rg -c 'pi\.exec\('` → 0 | the three `src/` imports read at the cited lines; the grep returns 0 | current | O3, S6 audit row 2 |
| PE-004 | known | The settings picker opens inline `ctx.ui.custom()` with `{ overlay: true }` (`src/extension/index.ts:100`), and 1.5.0 states overlays ignore the new `blocked` option | changelog 1.5.0 ("Added a `blocked` option to inline `ctx.ui.custom()` components … Overlays ignore the option"); `src/extension/index.ts:100` | current | O3, S6 audit row 3 |
| PE-005 | known | The package renders no key hints: `rg -c 'keyText\|keyHint' src/` → 0, so 1.5.0's injected-form guidance has no target here | the grep in `packages/pi-agentic-workflow` returns 0 | current | O3, S6 audit row 4 |
| PE-006 | known | The router already degrades an unavailable route instead of failing the turn: `unavailable-route` is a notice kind (`routing/types.ts:96`) emitted from `routing/dispatch.ts:348,393` — the models.dev v2 catalog change needs no code | `rg -n 'unavailable-route' src/` → those three lines | current | O3, S6 audit row 6 |
| PE-007 | known | Both guard legs are clean **on the base tree**, before any change: legs `0.99.1` and `latest` (1.5.0), 21.7 s wall | `/tmp/compat-legs.sh` run at the cut head → `pi leg 0.99.1: tsc --noEmit clean`, `pi leg latest: tsc --noEmit clean` | current | O1 (CR-2) |
| PE-008 | known | The pin watch reports **exactly one** drift on the base tree, and it exits 1: `@types/node 24.13.3 → 26.6.6` | `node scripts/pin-watch.mjs --check` → `VERDICT: DRIFT`, exit 1 | current | O4 (CR-1) |
| PE-009 | known | `@types/node` 26.6.6 depends on `undici-types ~8.9.0`, while the committed lock resolves `undici-types 7.18.2` — so the lock genuinely moves with the pin | `npm view @types/node@26.6.6 dependencies --json` → `~8.9.0`; `rg '"undici-types"' bun.lock` → `7.18.2` | current | O4 |
| PE-010 | known | The 24.x line of `@types/node` ends at 24.19.2; 26.6.6 is the newest published version and the one #367 names | `npm view @types/node versions --json` (tail) → `24.19.2`, then 25.0.0 … 26.6.6 | current | O4, D1 |
| PE-011 | known | `release.mjs apply` writes the CHANGELOG companion row from the changeset body at cut time, and the content half of the parity gate accepts a changeset in place of a manual bump | `scripts/release.mjs:46,336-349,527-546`; `docs/workflow/PACKAGES.md` (same-PR bumps / changesets) | current | O5 |
| PE-012 | known | The local dev runtime is Node v26.13.0 while `.node-version` (CI) is v24.21.0 and `engines.node` is `>=18`, so `@types/node` 26 matches the operator's runtime and leads CI by two majors | `node -v` → v26.13.0; `cat .node-version` → v24.21.0; `package.json` engines | current | O4, D1, future cost |
| PE-013 | unknown | Whether any consumer's configured route names a model the models.dev v2 catalog retired. No config was sampled; the router's degradation path is the answer either way | owner: the issue (`No model-catalog refresh beyond confirming the router's degradation path — no evidence of affected configs`) — this unit replaces the unknown with the degradation path, it does not sample configs | not-applicable | O3, S6 audit row 6 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | the package type-checks against the peer floor `0.99.1` **and** the `latest` leg (1.5.0) — the re-verification the issue exists for (CR-2) | P3 | P3 | repo | `bash <(the guard job's two-leg sequence)` exits 0 and prints `pi leg 0.99.1: tsc --noEmit clean` and `pi leg latest: tsc --noEmit clean` | the two `clean` lines and the resolved `latest` version, recorded as an `E` line in the Log | verified |
| O2 | S2 | the README `## Notes` carries one dated verified baseline (1.5.0) at or above the floor, and no second stale baseline claim | P4 | P4 | docs | `cd packages/pi-agentic-workflow && bun test test/verified-baseline.test.mjs` exits 0 with 3 cases and `rg -c 'Also verified against Pi 1\.5\.0 \(2026-11-02\)' packages/pi-agentic-workflow/README.md` matches 1 | the suite's pass count and the README line, in the Log | verified |
| O3 | S3 | the pi peer range is untouched (`>=0.99.1`) and no 1.5.0-only API is adopted | P4 | P4 | repo | `git diff main -- packages/pi-agentic-workflow/package.json` shows only the `@types/node` line and `rg -c 'changelogPath' packages/pi-agentic-workflow/src packages/pi-agentic-workflow/package.json` matches 0 | the diff hunk and the zero match, in the Log | verified |
| O4 | S4 | the `@types/node` pin is an exact, current version and the workspace lock resolves it (CR-1: the pin watch's DRIFT flips to PASS) | P5 | P5 | deps | `node scripts/pin-watch.mjs --check` exits 0 and its last line reads `VERDICT: PASS`; `bun install --frozen-lockfile` exits 0 | both command outputs, in the Log | verified |
| O5 | S5 | the touched package ships a valid release intent instead of a hand-written bump + row | P6 | P6 | repo | `bun scripts/lint-changeset.mjs` exits 0 and `node scripts/version-parity-gate.mjs --content --base main` prints `VERDICT: PASS` | both command outputs, in the Log | verified |
| O6 | S6 | the PR body records the audit (what was checked, why nothing changed) and closes `#370` and `#367` on merge | P8 | P8 | repo | `gh pr view --json body` matches the six audit rows and both `Closes` footers, `gh pr checks` exits 0 | the PR URL, in the Log and in the hand-off | verified |
| O7 | S1, S5 | no behaviour regresses: the package suite and the root suite stay green with the pin moved and the README edited | P7 | P7 | repo | `cd packages/pi-agentic-workflow && bun run test` exits 0 and `node scripts/run-root-suite.mjs` exits 0 | both suites' pass/fail counts, in the Log | verified |

## Triaged steps

```text
TRIAGE — 370-pi-150-compat-reverification (fix)
Steps: implement, evidence
Tiers: implement: cheap, evidence: strong
Skipped: research: trivial scope, design: trivial scope, plan: trivial scope, tests: trivial scope, review: trivial scope, docs: trivial scope, release: not a feature
Budget: strong
```

Run 2026-11-02 via `bun scripts/unit-route.mjs --triage 370-pi-150-compat-reverification`.
This block is authoritative for routing, and the model never re-derives it.
**Declared deviation:** the catalog skips `tests` as trivial scope, but the process
that ordered this change writes a test before the behaviour it judges, so `P2`
exists and is the frozen proof of `O2`.

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it. Frozen at cut.

| S# | criterion | proving check |
|---|---|---|
| S1 | both guard legs are clean with `latest` resolving to pi 1.5.0, and the run is recorded verbatim | the two-leg sequence exits 0 printing `pi leg 0.99.1: tsc --noEmit clean` and `pi leg latest: tsc --noEmit clean`; the Log `E` line carries both plus `npm view … version` → `1.5.0` |
| S2 | `README.md`'s `## Notes` states the verified baseline `Pi 1.5.0 (2026-11-02)` beside the floor `Pi 0.99.1`, and no `1.2.0` baseline claim survives | `rg -c 'Also verified against Pi 1\.5\.0 \(2026-11-02\)' packages/pi-agentic-workflow/README.md` → 1 and `rg -c '1\.2\.0' packages/pi-agentic-workflow/README.md` → 0 |
| S3 | the `@earendil-works/pi-coding-agent` entry under `peerDependencies` still reads `>=0.99.1` and nothing in `src/` adopts a 1.5.0-only API | `git diff main -- packages/pi-agentic-workflow/package.json` contains no `peerDependencies` hunk; `rg -c 'changelogPath\|registerTool' packages/pi-agentic-workflow/src` → 0 |
| S4 | the `@types/node` pin is `26.6.6`, the workspace lock resolves it, and the scheduled watch stops reporting drift | `node scripts/pin-watch.mjs --check` exits 0 with `VERDICT: PASS`; `bun install --frozen-lockfile` exits 0 |
| S5 | a valid changeset declares the pi package (patch) in place of a manual bump, and the parity gate accepts it | `bun scripts/lint-changeset.mjs` exits 0; `node scripts/version-parity-gate.mjs --content --base main` prints `VERDICT: PASS` |
| S6 | the PR body carries the audit table (what was checked, why nothing changed) and closes both issues | `gh pr view --json body` shows the six audit rows and `Closes #370` + `Closes #367` |

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-02, the issue, verbatim (request cut above as `S1`–`S6`):
  ```
  ## Summary

  Pi 1.5.0 shipped (changelog: pi.dev/changelog/releases/1.5.0). A surface-by-surface audit of `@gtrabanco/pi-agentic-workflow` found **zero required code changes** — but the repo's own re-verification pattern (feature 72 / issue #283) and the standing `fix(deps)` cadence (AGENTS.md → Packages) both apply. This issue collects the deliberate, same-PR work.

  ## Tasks

  - [ ] Re-run the two-leg `pi-compat-guard` (`tsc --noEmit`, legs `0.99.1` + `latest` → 1.5.0) and record COMPAT-OK.
  - [ ] Update the README "Verified against the peer floor" note with the new verification version/date.
  - [ ] Confirm the peer floor stays `>=0.99.1` — no 1.5.0 API is adopted (see table above), so no floor bump is justified.
  - [ ] Fold the `@types/node` pin bump from #367 into the same `fix(deps)` PR (read its release notes first, per that issue).
  - [ ] Per AGENTS.md → Packages: bump the package version and add the CHANGELOG companion row in the same PR (or ship the changeset intent); close #367 from that PR.
  - [ ] Record this audit (what was checked, why nothing changed) in the PR description.
  ```
- **E1** — 2026-11-02, frozen failure **CR-1** on the untouched tree: `node scripts/pin-watch.mjs --check` · exit 1 · `drift: @gtrabanco/pi-agentic-workflow · @types/node 24.13.3 → 26.6.6`, `VERDICT: DRIFT`.
- **E2** — 2026-11-02, frozen failure **CR-2** on the untouched tree: the guard job's two-leg sequence (temp copy + `npm install --no-save --no-package-lock`, legs `0.99.1` and `latest` = 1.5.0, `tsc --noEmit`) · exit 0 · `pi leg 0.99.1: tsc --noEmit clean` / `pi leg latest: tsc --noEmit clean`.
- **E3** — 2026-11-02, the guard job's exact two-leg sequence re-run on the change tree (temp copy, `npm install --ignore-scripts --no-save --no-package-lock`, `tsc --noEmit`) · exit 0 · `resolved: pi=0.99.1 pi-tui=0.99.1 types/node=26.6.6 tsc=7.0.2` and `resolved: pi=1.5.0 pi-tui=1.5.0 types/node=26.6.6 tsc=7.0.2`; both legs printed `pi leg <leg>: tsc --noEmit clean` (COMPAT-OK, 20.5 s wall).
- **E4** — 2026-11-02, `cd packages/pi-agentic-workflow && bun test test/verified-baseline.test.mjs` · exit 0 · `3 pass / 0 fail`; `rg -c 'Also verified against Pi 1\.5\.0 \(2026-11-02\)' packages/pi-agentic-workflow/README.md` → `1`; `rg -c '1\.2\.0' packages/pi-agentic-workflow/README.md` → `0` (the retired baseline is gone).
- **E5** — 2026-11-02, `git diff main -- packages/pi-agentic-workflow/package.json` · exit 0 · one hunk, `-"@types/node": "24.13.3"` / `+"@types/node": "26.6.6"`; the `peerDependencies` block still reads `">=0.99.1"` and `"pi-tui": "*"`; `rg -c 'changelogPath|registerTool' packages/pi-agentic-workflow/src packages/pi-agentic-workflow/package.json` → `0`.
- **E6** — 2026-11-02, frozen failure **CR-1** flipped: `node scripts/pin-watch.mjs --check` · exit 0 · `no drift — every exact pin matches the registry's latest or its local package version … VERDICT: PASS` (was `VERDICT: DRIFT`, exit 1, at E1); `bun install --frozen-lockfile` · exit 0 · `Checked 134 installs across 151 packages (no changes)`; the lock now resolves `@types/node@26.6.6` + `undici-types@8.9.0`.
- **E7** — 2026-11-02, `bun scripts/lint-changeset.mjs` · exit 0 · `ok 370-pi-150-compat-reverification.md`; `node scripts/version-parity-gate.mjs --content --base main` · exit 0 · `[@gtrabanco/pi-agentic-workflow] changeset-intent — the bump happens at release time via scripts/release.mjs` and `VERDICT: PASS`.
- **E8** — 2026-11-02, differential + suites: `cd packages/pi-agentic-workflow && bun run test` · exit 0 · `457 pass / 0 fail across 38 files`; the same suite on a `git archive main` copy (`git init`-ed first — `test/bundle-lifecycle.test.mjs` reads the index) · exit 0 · `454 pass / 0 fail across 37 files`, so the delta is exactly the three new cases; `node scripts/run-root-suite.mjs` · exit 0 · `1348 pass / 0 fail / 0 skipped`.
- **E9** — 2026-11-02, the PR receipt: [PR #372](https://github.com/gtrabanco/agentic-workflow/pull/372) opened against `main`; its body carries the six-row audit table and both `Closes` footers, `gh pr view 372 --json body` reads them back, and `gh pr checks 372` exits 0 with `dependency-pin-gate` pass (1m14s), `root-suite` pass (1m54s) and `pi-compat-guard` pass (23s).
- **D1** — 2026-11-02, owner decision folded in (issue `#367` + `docs/LOGS.md:3675`): the `@types/node` pin takes the major the watch reports (`26.6.6`), not the last 24.x (`24.19.2`). Authority: `#367` names 26.6.6 as the published version and the pin watch compares exact pins against the registry's `latest`; the local dev runtime is Node v26.13.0, so the typings match the machine that type-checks. Cost recorded under Future cost (types lead the CI Node major by two).
- **D2** — 2026-11-02, delivery decision: the release intent is a `.changeset/` file, not a hand-written `package.json` bump + CHANGELOG row (S5's parenthetical), because the train (`scripts/release.mjs apply`, D-40-14) is the only writer of the companion row and stamps all three packages plus every skill at once — a lone 4.10.1 bump would put the train out of step between cuts.
- **P1** — 2026-11-02, planning freeze: `S1`–`S6`, both ledgers, the acceptance criteria, the frozen-failure corpus (`E1`, `E2`) and the triage block cut before the first line of code; `phase-lint` PASS (8/8) · commit recorded in the branch history.
- **P2** — 2026-11-02, tests first: `packages/pi-agentic-workflow/test/verified-baseline.test.mjs` added (three cases: one dated baseline, baseline at or above the floor, README floor equal to the manifest floor) and ablation-checked on a throwaway `/tmp` copy — dropping the claim, adding a second claim, a baseline below the floor, a floor drift and an impossible date each turn the suite red · commit in the branch history.
- **P3** — 2026-11-02, the two-leg guard re-run on the change tree; COMPAT-OK (E3) · commit in the branch history.
- **P4** — 2026-11-02, `README.md` `## Notes`: baseline `Pi 1.2.0 (2026-10-14)` → `Pi 1.5.0 (2026-11-02)`, floor sentence and tripwire clause untouched (E4) · commit in the branch history.
- **P5** — 2026-11-02, `@types/node` `24.13.3` → `26.6.6`, workspace lock refreshed; the release-notes read is recorded in D1's cost and in the changeset body (E6) · commit in the branch history.
- **P6** — 2026-11-02, `.changeset/370-pi-150-compat-reverification.md` ships the release intent with the audit as its body (E7) · commit in the branch history.
- **P7** — 2026-11-02, verification on the full diff: every obligation row closed (E4, E5, E6, E7, E8, E9) and the unit linters green — `phase-lint` `verdict PASS` (8/8) and `unit-lineage` `LINEAGE OK — obligations closed (7)`.
- **P8** — 2026-11-02, hand-off: PR #372 opened with the audit as its body; CI green on all three jobs (E9).

## Next

Owner verdict on the PR: the audit table in its body is the review surface, the
two-leg run and the suites are the evidence, and the merge closes `#370` + `#367`.

## References

- Issue [#370](https://github.com/gtrabanco/agentic-workflow/issues/370) — this unit.
- Issue [#367](https://github.com/gtrabanco/agentic-workflow/issues/367) — the `@types/node` pin drift folded in here; `Closes #367` rides the same PR.
- `docs/features/72-pi-100-compat-guard/SPEC.md` — the two-leg guard this unit re-runs and the README-baseline pattern it follows.
- `docs/workflow/PACKAGES.md` — pin, bump and changeset rules applied by S4/S5.
- `.github/workflows/root-suite.yml` → `pi-compat-guard` — the job whose exact sequence S1 re-runs.
- `docs/LOGS.md:3675` — the session that audited 1.5.0 and opened #370, including the 26.6.6 target.

## Branch

`fix/370-pi-150-compat-reverification`

## Depends on

None — independent of every open unit.

## Regression scope

| scenario | verifier |
|---|---|
| the package still type-checks against the peer floor `0.99.1` | the `0.99.1` guard leg exits 0 (O1) |
| the package still type-checks against `latest` (1.5.0) | the `latest` guard leg exits 0 (O1) |
| routing, config, settings and the shipped skills behave exactly as before | `cd packages/pi-agentic-workflow && bun run test` exits 0 (O7) |
| no npm lockfile appears under `packages/` (the guard's temp-copy pattern) | `test/lockfile-policy.test.mjs` inside the package suite (O7) |
| the workspace keeps one lockfile and the sibling pins stay at the local versions | `node scripts/run-root-suite.mjs` exits 0 (O7) |
| the README's floor sentence still names `0.99.1` and the tripwire clause survives | `test/verified-baseline.test.mjs` exits 0 (O2) |
