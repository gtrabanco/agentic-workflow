---
type: fix
scope: xs
---

# fix/484-chore-deps-pin-drift

> The runner crate's `typebox` pin (`1.4.5`) is behind the registry's latest
> (`1.4.6`). The drift lands as one deliberate `fix(deps)` unit: the pin moves,
> the lock rides the same commit, and the release intent carries the notes
> window the watch named but did not read.

## Issue

`#484` — tracked issue in the project's forge. The PR must close it via
`Closes #484` in the body (the commit carries the footer, so the merge closes it).

## Specs

**S1 — the drift the watch named.**
> "`@gtrabanco/agentic-workflow` pins `typebox` at **1.4.5**,
> but the registry published **1.4.6**."

**S2 — the delivery shape and the parity rule.**
> "**The fix is a deliberate `fix(deps)` PR**: bump the pin and the package
> version together, with the CHANGELOG companion row — the rule lives in
> `docs/workflow/PACKAGES.md` (Version bumps)."

**S3 — never an automation side effect.**
> "Nothing is bumped automatically — dependency upgrades are never side effects
> of other work."

**S4 — read the window's notes and record what mattered.**
> "Release notes: https://github.com/sinclairzx81/typebox/releases
> Read the release notes that cover this window before bumping, and record in
> the PR which changes matter here and which do not: the watch names the
> version that moved, not what it changed."

**S5 — the watched manifest.**
> "Watched manifest: `packages/agentic-workflow/package.json`"

**S6 — the closure trace.**
> "Resolve by closing this issue from that PR (a `Closes` footer keeps the trace)."

## Impact

- `packages/agentic-workflow/package.json` — the `typebox` pin `1.4.5` →
  `1.4.6`. No other field changes; no dependency added or removed.
- `bun.lock` (root, the workspace's one lockfile) — the resolved artifact and
  its integrity ride the same commit, so `bun install --frozen-lockfile` stays
  installable.
- `.changeset/484-typebox-pin-bump.md` — new; the release intent for the crate
  (`@gtrabanco/agentic-workflow`: patch) and the S4 notes record.
- `docs/ROADMAP.md` `## Fixes` row + `docs/LOGS.md` session entry + the
  `docs/generated/` projections that read the unit tree.
- Consumers: the crate imports `typebox` lazily from one place
  (`src/doc/envelope.mjs:32-34`, `import("typebox")` + `import("typebox/compile")`)
  and builds only `Type.Object/…` schemas — no changed export of 1.4.6 is
  reached (PE-006). No skill, template, or package README states the typebox
  version, so no prose stops being true.

## Retirements

None — the change only adds. It supersedes no surface: the pin is a value, not
a contract, and the previous version leaves no helper, flag or doc behind. The
one narration that names the old number (`docs/fix/374-pluggable-session-journal/`
PE-010 and `docs/fix/366-doc-cli/` PE-012) is a historical ledger of what that
unit read at its own cut, which is never rewritten.

## Non-goals

- The `--pins` gate's default wiring. `scripts/version-parity-gate.mjs:672`
  resolves `packageDir` to `PACKAGE_DIR` (the Pi package) when `--package` is
  absent, and `scripts/local-gate.mjs:309` runs it without `--package`, so the
  crate's pins are checked only when a caller passes the flag — while the
  script's own header says "by default every package under `packages/` is
  checked". S1's premise ("the PR-time `--pins` half fails the same drift")
  therefore does not hold for the wired gate. Reported as F1, not fixed here:
  it is a behavior change to a gate, needs its own unit, and this unit must not
  widen its own diff.
- The `npm`-less environment (no `node`, no `npm` in PATH) — an environment
  fact, recorded as PE-008, not repaired here.
- A version bump of the crate itself: the release train moves package versions
  at cut (`scripts/release.mjs apply`), and the release intent is the changeset
  (PE-004). No manual bump, no second 4.10.x row.

## Risk tier

Computed by `bun scripts/ceremony.mjs tier classify --paths …` over this unit's
declared paths at the cut; copied verbatim, never written from memory.

- **Cut verdict** — `standard` (`reason_kind: executable-content` — 2 paths
  carry executable content: `bun.lock`, `packages/agentic-workflow/package.json`)
  · **Task Size** — `understood: true`, `contained_risk: contained`,
  `resumable_from_diff: true`, `ceremony: unit-doc`, `verification: gates` ·
  **signals** — `[]`
- **Named high-risk item** — none — not a high-tier unit

## Acceptance criteria

- **AC1 (S1)** — the crate's `typebox` pin names the registry's latest release
  and the drift reproducer turns green: `bun scripts/pin-watch.mjs --check`
  exits 0 with no `drift:` line, and
  `bun scripts/version-parity-gate.mjs --pins --package packages/agentic-workflow`
  exits 0 (both were exit 1 at the cut, E1/E2).
- **AC2 (S2)** — the release intent declares the package and the content half
  accepts it in place of a manual bump:
  `bun scripts/lint-changeset.mjs .changeset/484-typebox-pin-bump.md` exits 0
  and `bun scripts/version-parity-gate.mjs --content --base origin/main`
  exits 0.
- **AC3 (S3)** — the drift lands only through this unit's own commits: the
  branch's diff is the pin, the lock, the changeset and the unit's docs, and
  no other work is folded in — `git diff --stat origin/main...HEAD` names
  exactly those paths.
- **AC4 (S4)** — the window is read and its record separates what matters from
  what does not: the changeset body names the 1.4.5→1.4.6 surface change
  (`Schema.Pointer` / `Schema.Resolve` namespace re-export, `Indices` →
  `Fragments` plus `EncodeFragment`/`DecodeFragment`, the `_pathing` module
  removed, the engine's namespace-import rewrite) and states that the crate
  reaches none of it.
- **AC5 (S5)** — the bumped manifest is the crate's and the lock agrees with
  it: `rg -c '"typebox": "1.4.6"' packages/agentic-workflow/package.json`
  matches 1, `rg -c 'typebox@1\.4\.6' bun.lock` matches 1, and
  `bun install --frozen-lockfile` exits 0.
- **AC6 (S6)** — the trace exists: `git log -1 --format=%B | rg -c 'Closes #484'`
  matches 1 on the implementation commit.

## Future

none — nothing was deferred. The `--pins` default wiring is a finding for the
owner's triage (F1), not a deferred row of this unit.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| A pin bump is only ever a deliberate `fix(deps)` unit with its release intent — never a side effect of unrelated work | every future dependency bump |
| The crate's `typebox` surface stays the `Type` builders plus `typebox/compile`; reaching for `Schema.Pointer` / `Schema.Resolve` / pointer helpers would put a second 1.4.x-renamed API in the load path | future `doc` / schema work in the crate |

## Applicable tests

No new test — the change is a manifest value and its lock, and every rule it
must satisfy already has an owner-backed check. The suite set it runs:

- `scripts/pin-watch.test.mjs` — the drift evaluator that produced the finding
  (its fixtures cover exact-pin drift, the local-sibling rule and partial pins;
  the change adds no code to it).
- `scripts/version-parity-gate.test.mjs` — the content/pins matrix the gate
  change would live in (unchanged here).
- `packages/agentic-workflow/test/` (crate suite, `bun test --timeout=30000 test/`)
  — the regression set for the bumped runtime: the `doc` envelope validation is
  the only path that loads `typebox`.

The differential (§6) is the crate suite at base vs head: no new failure is
allowed, and the three `node`-spawning failures are identical on both sides
(PE-008).

## Known pre-existing issues

- **`version-parity-gate --pins` defaults to the Pi package only** — the
  script's header and `docs/workflow/PACKAGES.md` both say every package under
  `packages/` is checked, `main()` does not. `scripts/local-gate.mjs:309` runs
  it flagless, so a crate-only pin drift passes the wired gate.
  **does-not-affect** this unit's deliverable (the drift is caught by
  `pin-watch` and by `--pins --package packages/agentic-workflow`); it
  **affects** the premise S1 quotes. Recorded as F1 for the owner.
- **No `node` binary in this environment** (bun only, no `npm`) — three crate
  suites spawn `node` and fail identically at base and head
  (`CLI smoke > spawn bin/agentic-workflow.mjs unit-doc create --json parses`,
  `box2 phase-lint green`, `the box2 phase-lint clause is read-only`).
  **does-not-affect** the differential verdict; it narrows the runnable gate to
  the bun leg (`node --test` fallback unavailable). Disclosed in the handoff.
- **Worktree root carries git's admin files as untracked entries** (`HEAD`,
  `index`, `logs/`, …) because the worktree lives at `.git/worktrees/<name>` —
  **does-not-affect** this unit; explicit revs are used for every diff.

## Tasks

- P1 — Cut the unit doc, both planning ledgers and the `## Fixes` row (validator: `bun scripts/unit-route.mjs --triage 484-chore-deps-pin-drift` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6)
- P2 — Move the pin in the crate manifest and refresh the root lockfile (validator: `bun install --frozen-lockfile` exits 0 and `rg -c 'typebox@1\.4\.6' bun.lock` matches 1)
  (Implements: S1, S5)
- P3 — Ship the release intent with the notes window record (validator: `bun scripts/lint-changeset.mjs .changeset/484-typebox-pin-bump.md` exits 0)
  (Implements: S2, S4)
  Relevant files: .changeset/484-typebox-pin-bump.md
- P4 — Verify the drift reproducers and the crate differential (validator: `bun scripts/pin-watch.mjs --check` exits 0 and `bun scripts/version-parity-gate.mjs --content --base origin/main` exits 0)
  (Implements: S1, S2, S3)
- P5 — Docs and state: roadmap row, session log, projections (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/roadmap-settle.mjs` verdict PASS)
  (Implements: S1, S2, S6)

### Planning evidence

One row per Engineering claim (column order and vocabularies owned by
`skills/pre-execution-review/references/LEDGERS.md`).

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | registry | `typebox`'s latest published release is `1.4.6` (2026-11-08T10:59:01Z); `1.4.5` published 2026-11-06T10:28:44Z, so the window is one release | `https://registry.npmjs.org/typebox` (`dist-tags.latest`, `time`) fetched 2026-11-09 | current | O1, O2 |
| PE-002 | repository | the drift is real at the cut HEAD `2a28f038`: the crate pins `1.4.5` and the watch reports it | `packages/agentic-workflow/package.json:31`; `bun scripts/pin-watch.mjs --check` → exit 1, `drift: @gtrabanco/agentic-workflow · typebox 1.4.5 → 1.4.6` (E1) | current | O1, O2 |
| PE-003 | repository | `version-parity-gate --pins` defaults to `PACKAGE_DIR` (Pi only) when `--package` is absent, and the local gate calls it flagless — so the crate's pins are only checked with an explicit `--package` | `scripts/version-parity-gate.mjs:672`; `scripts/local-gate.mjs:309`; `bun scripts/version-parity-gate.mjs --pins` → PASS (E2a) vs `--pins --package packages/agentic-workflow` → FAIL (E2b) | current | O1, F1 |
| PE-004 | repository | a valid `.changeset/*.md` declaring the package satisfies the version-parity content half in place of a manual version bump, and the release train applies it at cut | `docs/workflow/PACKAGES.md:37-41`; `scripts/version-parity-gate.mjs` header; precedent `3135e366` (#425, the same package and the same drift class) | current | O4, O7 |
| PE-005 | repository | no deterministic emitter writes a single package's companion CHANGELOG row: `insertCompanionRow` runs only inside `release.mjs apply` (the whole train), and the crate's `changelog` op cannot address the `#### [\`name\`](path)` heading | `scripts/release.mjs:817`; `packages/agentic-workflow/src/edit/Changelog.mjs:44` (`^#### \`(.+)\`` regex); `packages/agentic-workflow/bin/agentic-workflow.mjs:1145` | current | O4 |
| PE-006 | tool-behaviour | `typebox` 1.4.6 changes no surface the crate reaches: the crate imports `Type` builders and `typebox/compile` only, while the release's changes are in `Schema.Pointer` / `Schema.Resolve` namespacing, pointer fragments and the engine's internal imports | `packages/agentic-workflow/src/doc/envelope.mjs:32-34`; npm tarball diff 1.4.5 vs 1.4.6 (24 files differ, 2 removed: `build/schema/engine/_pathing.{mjs,d.mts}`, none added, `fileCount` 1421 → 1419) | current | O6 |
| PE-007 | registry | upstream publishes no GitHub release notes for this window: the `releases` API answers an empty array, so the recorded effect is the npm tarball diff | `https://api.github.com/repos/sinclairzx81/typebox/releases?per_page=5` fetched 2026-11-09 → `[]` | current | O4 |
| PE-008 | environment | this checkout has no `node` and no `npm` in PATH (bun 1.4.4 only), so three crate suites that spawn `node` fail at base and at head alike, and the `node --test` fallback cannot run | `which node npm` → nothing; `bun test --timeout=30000 test/` in the crate → 583 pass / 3 fail at base (E3) | current | O6 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state (shape owned by
`skills/pre-execution-review/references/LEDGERS.md`).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | the crate's `typebox` pin never lags the registry's latest release | P1 | P2 | execute-phase | `bun scripts/version-parity-gate.mjs --pins --package packages/agentic-workflow` exits 0 | the E line quoting the run, replacing E2b's red | planned |
| O2 | S1 | the scheduled watch's drift reproducer turns green (the §2 frozen failure) | P1 | P4 | execute-phase | `bun scripts/pin-watch.mjs --check` exits 0 and prints no `drift:` line | the E line with exit 0 and `VERDICT: PASS` | planned |
| O3 | S3 | the bump arrives only as this unit's deliberate work — no schedule, hook or unrelated commit touches a pin | P1 | P2 | execute-phase | `git diff --stat origin/main...HEAD` names only the pin, `bun.lock`, the changeset and this unit's docs | the stat listed in the Log's P line | planned |
| O4 | S2, S4 | the release intent declares `@gtrabanco/agentic-workflow` and its body records the window: what changed and what does not reach the crate | P1 | P3 | execute-phase | `bun scripts/lint-changeset.mjs .changeset/484-typebox-pin-bump.md` exits 0 | the E line with the lint's output | planned |
| O5 | S5 | the bumped manifest is the crate's and the workspace lock resolves exactly that artifact, installable frozen | P1 | P2 | execute-phase | `bun install --frozen-lockfile` exits 0 and `rg -c 'typebox@1\.4\.6' bun.lock` matches 1 | the E line with both results | planned |
| O6 | regression scope | the crate's behaviour on 1.4.6 is unchanged: no new failure against the base commit | P1 | P4 | execute-phase | `bun test --timeout=30000 test/` in `packages/agentic-workflow` shows the same 583 pass / 3 environment failures as the base copy | the differential pair of E lines (base vs head) | planned |
| O7 | S2 | the version-parity gate's content half accepts the change without a manual version bump | P1 | P4 | execute-phase | `bun scripts/version-parity-gate.mjs --content --base origin/main` exits 0 | the E line with the gate's verdict | planned |
| O8 | S6 | the tracked issue is closed by the landing commit (a `Closes` footer keeps the trace) | P1 | P2 | execute-phase | `git log -1 --format=%B \| rg -c 'Closes #484'` matches 1 | the commit subject line in the Log's P line | planned |

## Triaged steps

Verbatim from `bun scripts/unit-route.mjs --triage 484-chore-deps-pin-drift`
after the doc was cut:

```
TRIAGE — 484-chore-deps-pin-drift (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/484-chore-deps-pin-drift
```

The lane runs inline (owner's apply workflow, §4): no Relay packet is cut for
this unit and the `relay-next` addendum is not acted on; the review step is the
owner's external verification.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | S1 · scripts/version-parity-gate.mjs:672 | correctness | WARNING | report-only | source | product owner — the `--pins` default is the Pi package while the script header and `docs/workflow/PACKAGES.md` say every package under `packages/`; `scripts/local-gate.mjs:309` runs it flagless, so a crate-only pin drift passes the wired gate. Needs its own unit (a gate behaviour change), deliberately out of this unit's scope. |

## Log

- **L1** — 2026-11-09, the issue, verbatim:
  ```
  `@gtrabanco/agentic-workflow` pins `typebox` at **1.4.5**,
  but the registry published **1.4.6**.

  Reported by the scheduled pin watch (`scripts/pin-watch.mjs`, feature 67
  AC2 / issue #219). The PR-time `version-parity-gate.mjs --pins` half fails
  the same drift once it reaches a PR; this is the early warning in front of it.

  **The fix is a deliberate `fix(deps)` PR**: bump the pin and the package
  version together, with the CHANGELOG companion row — the rule lives in
  `docs/workflow/PACKAGES.md` (Version bumps).
  Nothing is bumped automatically — dependency upgrades are never side effects
  of other work.

  Release notes: https://github.com/sinclairzx81/typebox/releases
  Read the release notes that cover this window before bumping, and record in
  the PR which changes matter here and which do not: the watch names the
  version that moved, not what it changed.

  Watched manifest: `packages/agentic-workflow/package.json`
  Resolve by closing this issue from that PR (a `Closes` footer keeps the trace).
  ```
- **L2** — 2026-11-09, owner apply-request, verbatim: "Apply to this repository: issue #484" — plain prose; state resolved it to **continue** (`HEAD == origin/main`, no unit folder, no open PR).
- **E1** — 2026-11-09, `bun scripts/pin-watch.mjs --check` at `2a28f038` (with a scratch `npm view` shim on PATH, PE-008) · exit 1 · `drift: @gtrabanco/agentic-workflow · typebox 1.4.5 → 1.4.6`, `VERDICT: DRIFT`.
- **E2a** — 2026-11-09, `bun scripts/version-parity-gate.mjs --pins` (flagless) at `2a28f038` · exit 0 · `VERDICT: PASS` — the Pi package only, the crate unchecked (PE-003, F1).
- **E2b** — 2026-11-09, `bun scripts/version-parity-gate.mjs --pins --package packages/agentic-workflow` at `2a28f038` · exit 1 · `GATE REJECTION — dependency-pin-drift … pins typebox at 1.4.5 but the registry published 1.4.6`.
- **E3** — 2026-11-09, `bun test --timeout=30000 test/` in `packages/agentic-workflow` at `2a28f038` · 583 pass / 3 fail — the three `node`-spawning suites (PE-008). Differential baseline.
- **D1** — 2026-11-09, decision (route for S2): the release intent carries the version, per `docs/workflow/PACKAGES.md`'s own alternative, `scripts/pin-watch.mjs`'s `--file-pr` prose ("the package versions themselves move on the release train, never here") and the same package's precedent `3135e366` (#425). No manual `package.json` version bump and no hand-written CHANGELOG row: the train stamps both at cut, and a hand row for an unpublished version would record a release that never happened (PE-004, PE-005). Disclosed to the owner in the handoff as the one reading of S2 that could go the other way.
- **D2** — 2026-11-09, decision (F1 boundary): the `--pins` default gap is reported, not repaired — it changes a gate's behaviour and belongs to its own unit (§4 forbids widening this diff; a new finding never earns a cycle).

## Next

P2 — move the pin, ride the lock, ship the changeset; then the verification block
and the owner's external verification.

## References

Issue [#484](https://github.com/gtrabanco/agentic-workflow/issues/484) · the watch
that filed it, issue [#219](https://github.com/gtrabanco/agentic-workflow/issues/219)
(`scripts/pin-watch.mjs`, feature 67 AC2) · the same package's previous bump,
`3135e366` (#425) · `docs/workflow/PACKAGES.md` (Version bumps).

## Branch

`feat/484-chore-deps-pin-drift` — the harness-created branch. The repo's
convention for a fix unit is `fix/<issue>-<slug>`; the worktree path and the
branch name are the owner's, so the name is recorded as it is rather than
renamed under the harness.

## Depends on

none — independent.

## Regression scope

| Scenario | Verified by |
|---|---|
| The crate's `doc` envelope validation still accepts the shipped envelopes on 1.4.6 (the only `typebox` load path) | `bun test --timeout=30000 test/` in `packages/agentic-workflow` — the `doc` suites green at head, same count as base (O6) |
| The rest of the crate suite is unchanged by the bump — no new failure, no newly-skipped case | the base-vs-head differential in E3/E7 (O6) |
| A fresh checkout stays installable from the committed lock | `bun install --frozen-lockfile` at the repo root exits 0 (O5) |
| The sibling packages' pins that live in the same lock are untouched | `git diff origin/main...HEAD -- bun.lock` touches only the `typebox` entry (O3) |
| The release train still reads the crate's intent | `bun scripts/release.mjs plan` lists `@gtrabanco/agentic-workflow` and resolves without the new changeset breaking the plan (E6) |
