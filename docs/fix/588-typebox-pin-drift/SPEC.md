---
type: fix
scope: xs
---

# fix/588-typebox-pin-drift

> The runner crate's `typebox` pin (`1.4.6`) is behind the registry's latest
> (`1.4.7`). The drift lands as one deliberate `fix(deps)` unit: the pin moves,
> the lock rides the same commit, and the release intent carries the notes
> window the watch named but did not read.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#588` — tracked issue in the project's forge. The PR must close it via
`Closes #588` in the body (the implementation commit carries the footer).

## Specs

**S1 — the drift the watch named.**
> "`@gtrabanco/agentic-workflow` pins `typebox` at **1.4.6**,
> but the registry published **1.4.7**."

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
> "Resolve by closing this issue from that PR (a `Closes` footer keeps the trace).
> Repository: gtrabanco/agentic-workflow"

## Impact

- `packages/agentic-workflow/package.json` — the `typebox` pin `1.4.6` →
  `1.4.7`. No other field changes; no dependency added or removed.
- `bun.lock` (root, the workspace's one lockfile) — the resolved artifact and
  its integrity ride the same commit, so `bun install --frozen-lockfile` stays
  installable. `bun install --lockfile-only` on the bumped manifest answers a
  two-line diff (the importer's pin and the `typebox` entry) — measured in a
  `mktemp -d` fixture before the live tree was touched (E5).
- `.changeset/588-typebox-pin-bump.md` — new; the release intent for the crate
  (`@gtrabanco/agentic-workflow`: patch) and the S4 window record.
- `docs/ROADMAP.md` `## Fixes` row (written through the crate's `roadmap
  fixrow`, never by hand), `docs/LOGS.md` session entry, and the
  `docs/generated/` projections that read the unit tree.
- Consumers: the crate imports `typebox` lazily from exactly two modules
  (`src/doc/envelope.mjs:42-44`, `src/doc/structure-schema.mjs:15-17`) and
  builds only `Type.Object/String/Integer/Number/Boolean/Literal/Union/Array/
  Tuple/Record/Unknown` plus `Compile` — no `$ref`, `$id`, `$dynamicRef` or
  `$dynamicAnchor` anywhere in `src/` or `test/` (E4), so the release's only
  behavioural surface is unreachable. No skill, template or package README
  states the typebox version, so no prose stops being true.

## Retirements

None — the change only moves a value. It supersedes no surface: the pin is a
value, not a contract, and the previous version leaves no helper, flag or doc
behind. The one narration that names an older number is another unit's frozen
ledger of what it read at its own cut (`docs/fix/484-chore-deps-pin-drift/`),
which is never rewritten.

## Non-goals

- The `--pins` gate's default wiring. `scripts/version-parity-gate.mjs`
  resolves `packageDir` to `PACKAGE_DIR` (the Pi package) when `--package` is
  absent, and `scripts/local-gate.mjs` runs it flagless, so the crate's pins
  are checked only when a caller passes the flag — while the script's own
  header says "by default every package under `packages/` is checked". S1's
  premise ("the PR-time `--pins` half fails the same drift") therefore does not
  hold for the wired gate (Known pre-existing issues). It is a behaviour change
  to a gate, needs its own unit, and this unit must not widen its own diff.
- A manual `version:` bump of the crate: D-40-14 keeps one train version across
  the four packages (`scripts/unit-doc-contract.test.mjs:433` enforces it) and
  the release train stamps every version at cut from the changeset (PE-004).
  Bumping one package by hand would break the train invariant, not satisfy S2.
- Any other pin: the watch reports this one drift only, and a dependency
  upgrade is never a side effect of unrelated work (S3).

## Risk tier

Computed by the crate's own classifier over this unit's declared paths at the
cut, copied verbatim, never written from memory.

- **Cut verdict** — `standard` (`reason_kind: executable-content` — 2 paths
  carry executable content: `bun.lock`, `packages/agentic-workflow/package.json`)
  · **Task Size** — `understood: true`, `contained_risk: contained`,
  `resumable_from_diff: true`, `ceremony: unit-doc`, `verification: gates` ·
  **signals** — `[]`
- **Named high-risk item** — none — not a high-tier unit

## Acceptance criteria

- **AC1 (S1)** — the crate's `typebox` pin names the registry's latest release
  and both drift reproducers turn green: `bun scripts/pin-watch.mjs --check`
  exits 0 with no `drift:` line, and
  `bun scripts/version-parity-gate.mjs --pins --package packages/agentic-workflow`
  exits 0 (both were exit 1 at the cut, E1/E2b).
- **AC2 (S2)** — the release intent declares the crate and the content half
  accepts it in place of a manual bump:
  `bun scripts/lint-changeset.mjs .changeset/588-typebox-pin-bump.md` exits 0
  and `bun scripts/version-parity-gate.mjs --content --base origin/main`
  exits 0.
- **AC3 (S3)** — the drift lands only through this unit's own commits: the
  branch diff is the pin, the lock, the changeset and the unit's docs, and no
  other work is folded in — `git diff --stat origin/main...HEAD` names exactly
  those paths.
- **AC4 (S4)** — the window is read and its record separates what matters from
  what does not: the changeset body names the 1.4.6→1.4.7 surface change
  (`$dynamicRef` anchor-name resolution and scoped-anchor search order, the
  remote `$ref` relative base, the removed internal `IsPointerFragment`
  helper, the readme's spec-conformance table) and states that the crate
  reaches none of it.
- **AC5 (S5)** — the bumped manifest is the crate's and the lock agrees with
  it: `rg -c '"typebox": "1.4.7"' packages/agentic-workflow/package.json`
  matches 1, `rg -c 'typebox@1\.4\.7' bun.lock` matches 1, and
  `bun install --frozen-lockfile` exits 0.
- **AC6 (S6)** — the trace exists:
  `git log -1 --format=%B | rg -c 'Closes #588'` matches 1 on the
  implementation commit.

## Future

none — nothing was deferred. The `--pins` default wiring is a pre-existing gate
gap recorded for the owner under Known pre-existing issues, not a deferred row of
this unit.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| A pin bump is only ever a deliberate `fix(deps)` unit with its release intent — never a side effect of unrelated work | every future dependency bump |
| The crate's `typebox` surface stays the `Type` builders plus `typebox/compile`; reaching for `$ref`/`$dynamicRef` helpers would put the one part of the library 1.4.7 rewrote into this crate's load path | future `doc` / schema work in the crate |

## Applicable tests

No new test — the change is a manifest value and its lock, and every rule it
must satisfy already has an owner-backed check. The derived set
(`bun scripts/test-impact.mjs --paths packages/agentic-workflow/package.json
bun.lock` → verdict `targeted`, 10 suites, E6) is:

- `scripts/pin-watch.test.mjs` — the drift evaluator that produced the finding
  (exact-pin drift, the local-sibling rule, partial pins; unchanged here).
- `scripts/version-parity-gate.test.mjs` — the content/pins matrix (unchanged).
- `scripts/workspace-lock-policy.test.mjs` — the lock-policy contract the
  refreshed lock must keep satisfying.
- `scripts/differential-baseline.test.mjs`, `scripts/normative-drift.test.mjs`,
  `scripts/gate-receipt.test.mjs`, `scripts/release.test.mjs`,
  `scripts/dependency-advisory-pass.test.mjs` —
  the release-intent, receipt and advisory paths the changed manifest feeds.
- `packages/agentic-workflow-schema/test/gate-receipt.test.mjs`,
  `packages/agentic-workflow-schema/test/verification-gates.test.mjs` — the
  schema package's contract suites the workspace lock resolves.
- `packages/agentic-workflow/test/doc.section-locator.test.mjs` — the crate's
  own consumer of the bumped runtime.

The differential (§6) is the crate suite at base vs head: no new failure is
allowed (E3 vs E9).

## Known pre-existing issues

- **`version-parity-gate --pins` defaults to the Pi package only** — the
  script's header and `docs/workflow/PACKAGES.md` both say every package under
  `packages/` is checked; `main()` does not, and `scripts/local-gate.mjs` runs
  it flagless, so a crate-only pin drift passes the wired gate.
  **does-not-affect** this unit's deliverable (the drift is caught by
  `pin-watch` and by `--pins --package packages/agentic-workflow`); it
  **affects** the premise S1 quotes. Recorded for the owner — a pre-existing
  gate gap, deliberately not repaired here.
- **Sibling worktrees in progress** (`feat/563-init-workspace-interview`,
  `feat/565-quality-sensor`) — `scripts/worktree-guard.mjs` judges each one;
  neither touches this unit's paths, and this unit neither reads nor writes
  their checkouts. **does-not-affect** this unit.

## Tasks

- P1 — Cut the unit doc, both planning ledgers and the `## Fixes` row (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/588-typebox-pin-drift/SPEC.md` prints `verdict PASS`)
  (Implements: S1, S2, S3, S4, S5, S6)
- P2 — Move the pin in the crate manifest and refresh the root lockfile (validator: `bun install --frozen-lockfile` exits 0 and `rg -c 'typebox@1\.4\.7' bun.lock` matches 1)
  (Implements: S1, S5)
- P3 — Ship the release intent with the notes-window record (validator: `bun scripts/lint-changeset.mjs .changeset/588-typebox-pin-bump.md` exits 0)
  (Implements: S2, S4)
  - Relevant files: .changeset/588-typebox-pin-bump.md
- P4 — Verify the drift reproducers, the gate halves and the crate differential (validator: `bun scripts/pin-watch.mjs --check` exits 0 and `bun scripts/version-parity-gate.mjs --content --base origin/main` exits 0)
  (Implements: S1, S2, S3)
- P5 — Docs and state: roadmap row, session log, projections (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/roadmap-settle.mjs` verdict PASS)
  (Implements: S1, S2, S6)

### Planning evidence

One row per Engineering claim (column order and vocabularies owned by
`skills/pre-execution-review/references/LEDGERS.md`).

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | registry | `typebox`'s latest published release is `1.4.7` (2026-11-12T16:30:12Z); `1.4.6` published 2026-11-08T10:59:01Z, so the window is one release | `https://registry.npmjs.org/typebox` (`dist-tags.latest`, `time`) fetched 2026-11-16 | current | O1, O2 |
| PE-002 | repository | the drift is real at the cut HEAD `15b04c2a`: the crate pins `1.4.6` and the watch reports it | `packages/agentic-workflow/package.json` (`dependencies.typebox`); `bun scripts/pin-watch.mjs --check` → exit 1, `drift: @gtrabanco/agentic-workflow · typebox 1.4.6 → 1.4.7` (E1) | current | O1, O2 |
| PE-003 | repository | `version-parity-gate --pins` defaults to `PACKAGE_DIR` (Pi only) when `--package` is absent, and the local gate calls it flagless — so the crate's pins are only checked with an explicit `--package` | `bun scripts/version-parity-gate.mjs --pins` → PASS, 4 Pi pins (E2a) vs `--pins --package packages/agentic-workflow` → FAIL, `GATE REJECTION — dependency-pin-drift` (E2b) | current | O1, known pre-existing issue 1 |
| PE-004 | repository | a valid `.changeset/*.md` declaring the package satisfies the version-parity content half in place of a manual version bump, and the release train applies it at cut; D-40-14 keeps one train version across the four packages | `docs/workflow/PACKAGES.md:46-50`; `scripts/unit-doc-contract.test.mjs:433` (one train version); precedent `docs/fix/484-chore-deps-pin-drift/` D1 | current | O4, O7, S2 |
| PE-005 | repository | no deterministic emitter writes a single package's companion CHANGELOG row: the row is inserted only by `release.mjs apply` (the whole train) | `scripts/release.mjs` (`insertCompanionRow`, apply path only); `docs/fix/484-chore-deps-pin-drift/` PE-005 (same package, same gate) | current | O4 |
| PE-006 | tool-behaviour | `typebox` 1.4.7 changes no surface this crate reaches: three files differ from 1.4.6 (`build/schema/resolve/resolve.mjs`, `package.json`, `readme.md`), 0 added, 0 removed, and the crate imports only `Type` builders plus `typebox/compile` while using no `$ref`/`$id`/`$dynamicRef`/`$dynamicAnchor` | npm tarball diff 1.4.6 vs 1.4.7 (E4); `rg -n '\$ref|\$id|\$dynamicRef|\$dynamicAnchor' packages/agentic-workflow/src packages/agentic-workflow/test` → no schema keyword (E4); `src/doc/envelope.mjs:42-44`, `src/doc/structure-schema.mjs:15-17` | current | O6 |
| PE-007 | registry | upstream publishes no GitHub release notes for this window: the `releases` API answers an empty array, so the recorded effect is the npm tarball diff | `https://api.github.com/repos/sinclairzx81/typebox/releases?per_page=5` fetched 2026-11-16 → `[]` (E4) | current | O4 |
| PE-008 | environment | the toolchain is complete in this worktree: bun `1.4.5`, node `v26.13.0`, npm `11.20.0`; `node scripts/setup-env.mjs` provisioned the schema `dist/` and the pi package's modules, and the crate suite runs on both runtimes | `node scripts/setup-env.mjs --check`; `bun test --timeout=30000 test/` in the crate → 858 pass / 0 fail (E3) | current | O6, O1, O2 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state (shape owned by
`skills/pre-execution-review/references/LEDGERS.md`).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | the crate's `typebox` pin never lags the registry's latest release | P1 | P2 | execute-phase | `bun scripts/version-parity-gate.mjs --pins --package packages/agentic-workflow` exits 0 | the E line quoting the run, replacing E2b's rejection | verified |
| O2 | S1 | the scheduled watch's drift reproducer turns green (the §2 frozen failure) | P1 | P4 | execute-phase | `bun scripts/pin-watch.mjs --check` exits 0 and prints no `drift:` line | the E line with exit 0 and `VERDICT: PASS` | verified |
| O3 | S3 | the bump arrives only as this unit's deliberate work — no schedule, hook or unrelated commit touches a pin | P1 | P2 | execute-phase | `git diff --stat origin/main...HEAD` names only the pin, `bun.lock`, the changeset and this unit's docs | the stat listed in the Log's P line | verified |
| O4 | S2, S4 | the release intent declares `@gtrabanco/agentic-workflow` and its body records the window: what changed and what does not reach the crate | P1 | P3 | execute-phase | `bun scripts/lint-changeset.mjs .changeset/588-typebox-pin-bump.md` exits 0 | the E line with the lint's output | verified |
| O5 | S5 | the bumped manifest is the crate's and the workspace lock resolves exactly that artifact, installable frozen | P1 | P2 | execute-phase | `bun install --frozen-lockfile` exits 0 and `rg -c 'typebox@1\.4\.7' bun.lock` matches 1 | the E line with both results | verified |
| O6 | regression scope | the crate's behaviour on 1.4.7 is unchanged: no new failure against the base commit | P1 | P4 | execute-phase | `bun test --timeout=30000 test/` in `packages/agentic-workflow` reports the same 858 pass / 0 fail as the base run E3 | the differential pair of E lines (base vs head) | verified |
| O7 | S2 | the version-parity gate's content half accepts the change without a manual version bump | P1 | P4 | execute-phase | `bun scripts/version-parity-gate.mjs --content --base origin/main` exits 0 | the E line with the gate's verdict | verified |
| O8 | S6 | the tracked issue is closed by the landing commit (a `Closes` footer keeps the trace) | P1 | P2 | execute-phase | `git log -1 --format=%B \| rg -c 'Closes #588'` matches 1 | the commit footer in the Log's P line | verified |

## Triaged steps

Verbatim from `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route
--triage 588-typebox-pin-drift` after the doc was cut:

```
TRIAGE — 588-typebox-pin-drift (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/588-typebox-pin-drift
relay-next: create .pi-web/relays/588-typebox-pin-drift/ (charter → docs/fix/588-typebox-pin-drift/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/588-typebox-pin-drift", leg: "1") · legs: 6 = 5 phases + 1 coherence review
```

The lane runs inline (owner's apply workflow, §4): no Relay packet is cut for
this unit and the `relay-next` addendum is not acted on; the review step is the
owner's external verification. The deterministic readers still run over the doc
— `phase-lint` (P1's validator), `roadmap-settle` and `docs-generate --check`
(P5's) — so it satisfies the same grammars a lane-cut doc does.

## Findings

No OPEN row: this unit carries no `review-change` or `triage-issue` run (§4
runs the surgery inline), so nothing here was persisted by either writer of the
`review-findings` truth class. The one advisory the verification surfaced — the
`--pins` default that never checks the crate — is a pre-existing gate gap
recorded under `## Known pre-existing issues` and in the handoff, not a finding
this unit owns.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the issue, verbatim:
  ```
  `@gtrabanco/agentic-workflow` pins `typebox` at **1.4.6**,
  but the registry published **1.4.7**.

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
  Repository: gtrabanco/agentic-workflow
  ```
- **L2** — 2026-11-16, owner apply-request, verbatim: "Apply to this repository: issue #588" then "continue" — state resolved it to **proceed** (branch `fix/588-typebox-pin-drift` at `15b04c2a`, clean worktree, no unit folder, nothing in flight).
- **E1** — 2026-11-16, `node scripts/pin-watch.mjs --check` at `15b04c2a` · exit 1 · `pins checked: 14`, `drift: @gtrabanco/agentic-workflow · typebox 1.4.6 → 1.4.7`, `VERDICT: DRIFT` (the §2 frozen failure).
- **E2a** — 2026-11-16, `node scripts/version-parity-gate.mjs --pins` (as wired, flagless) at `15b04c2a` · exit 0 · `[@gtrabanco/pi-agentic-workflow] exact pins checked: 4`, `VERDICT: PASS` — the crate unchecked (PE-003, Known pre-existing issues).
- **E2b** — 2026-11-16, `node scripts/version-parity-gate.mjs --pins --package packages/agentic-workflow` at `15b04c2a` · exit 1 · `GATE REJECTION — dependency-pin-drift … pins typebox at 1.4.6 but the registry published 1.4.7`.
- **E3** — 2026-11-16, `bun test --timeout=30000 test/` in `packages/agentic-workflow` at `15b04c2a` (resolved `typebox` 1.4.6) · 858 pass / 0 fail (174s) — the differential baseline.
- **E4** — 2026-11-16, the notes window read from the two npm tarballs in `/tmp` (upstream publishes none: `https://api.github.com/repos/sinclairzx81/typebox/releases?per_page=5` → `[]`): 1419 files in both, **0 added, 0 removed, 3 content-changed** — `build/schema/resolve/resolve.mjs`, `package.json`, `readme.md` (readme 96-line diff, entirely the spec-conformance table). `rg -n '\$ref|\$id|\$dynamicRef|\$dynamicAnchor' packages/agentic-workflow/{src,test}` · 0 schema-keyword hits. Scratch removed.
- **E5** — 2026-11-16, the §3 lock fixture: a `mktemp -d` mirror of the root manifest, the four package manifests and `bun.lock`, with the crate pin set to `1.4.7`; `bun install --lockfile-only` · exit 0 · **two-line diff** — the importer's `"typebox": "1.4.6" → "1.4.7"` and `typebox@1.4.6` → `typebox@1.4.7` with its integrity; `node -p` on the fixture resolves `1.4.7`. Scratch removed.
- **E6** — 2026-11-16, `bun scripts/test-impact.mjs --paths packages/agentic-workflow/package.json bun.lock` · `verdict: targeted`, `tier: rg`, 10 suites, `sources: path` (the `## Applicable tests` set).
- **P1** — 2026-11-16 18:31, the unit doc, both planning ledgers (every obligation row `planned` at cut) and the `## Fixes` row through the crate's `roadmap fixrow` writer (`d607c29b → f75ba33a`) · `8e4faa77`.
- **D1** — 2026-11-16, decision (route for S2): the release intent carries the version and the train stamps it at cut. D-40-14 keeps **one** version across the four packages (`scripts/unit-doc-contract.test.mjs` enforces it), the version-parity content half accepts a changeset in place of a manual bump (`docs/workflow/PACKAGES.md`), and no deterministic emitter writes a single package's CHANGELOG row outside `release.mjs apply` (PE-004, PE-005). A hand bump of `@gtrabanco/agentic-workflow` alone would break the train invariant, and a hand CHANGELOG row for a version no release cut would record a release that never happened.
- **P2** — 2026-11-16 18:35, the pin moves (`1.4.6` → `1.4.7`), the root lock is refreshed with `bun install --lockfile-only` (two-line diff, exactly the fixture's, E5), and the release intent ships with the notes-window record — P2 and P3 landed in one commit because they are one change unit · `3469cb45`.
- **E7** — 2026-11-16, `bun scripts/pin-watch.mjs --check` at `3469cb45` · exit 0 · `no drift — every exact pin matches the registry's latest or its local package version…`, `VERDICT: PASS` — E1's reproducer is green (O2).
- **E8** — 2026-11-16, `bun scripts/version-parity-gate.mjs --pins --package packages/agentic-workflow` · exit 0 · `[@gtrabanco/agentic-workflow] exact pins checked: 3`, `VERDICT: PASS`, replacing E2b's rejection; `--pins` flagless (as wired) · exit 0 · `VERDICT: PASS` (O1; the flagless default still skips the crate — Known pre-existing issues).
- **E9** — 2026-11-16, `bun test --timeout=30000 test/` in `packages/agentic-workflow` at `3469cb45` (resolved `typebox` 1.4.7) · **858 pass / 0 fail** (171s) — byte-identical to the base run E3 (O6).
- **E10** — 2026-11-16, `bun scripts/version-parity-gate.mjs --content --base origin/main` · exit 0 · `[@gtrabanco/agentic-workflow]` change accepted by the changeset, `VERDICT: PASS` (O7).
- **E11** — 2026-11-16, `bun install --frozen-lockfile` at the root · exit 0 · `2 packages installed`; `rg -c '"typebox": "1.4.7"' packages/agentic-workflow/package.json` matches 1; `rg -c 'typebox@1\.4\.7' bun.lock` matches 1; `rg -c 'typebox@1\.4\.6' bun.lock` matches 0; the crate resolves `1.4.7` (O5).
- **E12** — 2026-11-16, `bun scripts/lint-changeset.mjs .changeset/588-typebox-pin-bump.md` · exit 0 · `ok 588-typebox-pin-bump.md`; `bun scripts/release.mjs plan` reads the intent and resolves `train version: 5.0.0` without it breaking the plan (O4, regression scope).
- **E13** — 2026-11-16, the frozen differential against a `git archive` copy of `15b04c2a` in `/tmp` (base installed 1.4.6, head 1.4.7): a 19-case probe through `validateEnvelope` (6 accepted/refused cases), `validateDocIndex` (4), `degradationIsKnown` (5 values), `buildEnvelope` (2 throw paths), `buildResultRow`, `DOC_COMMANDS`, `DOC_INDEX_VERSION` — **byte-identical** between base and head; three crate CLI invocations (no args, unknown service, unknown op) — identical stdout/stderr/exit (O6). Scratch removed.
- **E14** — 2026-11-16, `git diff --stat origin/main...HEAD` names only `.changeset/588-typebox-pin-bump.md`, `bun.lock`, `packages/agentic-workflow/package.json`, `docs/ROADMAP.md`, `docs/generated/units.md` and the unit folder + journal fragment — no unrelated work folded in (O3); `git log -1 --format=%B 3469cb45 | rg -c 'Closes #588'` matches 1 (O8).
- **E15** — 2026-11-16, the state surfaces: `bun scripts/docs-generate.mjs` regenerated `docs/generated/units.md` and `--check` then answers `verdict: PASS`; `bun scripts/roadmap-settle.mjs` · `verdict: PASS`, `violations: 0`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` · exit 0 · `{"ok":true,"checked":12,"refusals":[]}`; `bun scripts/log-immutability.mjs` · exit 0 · `0 violations`.
- **D2** — 2026-11-16, decision (the session entry's carrier): `docs/LOGS.md` has exactly one legal writer — the merge-to-main aggregator — and `scripts/log-immutability.mjs` refuses a non-aggregator commit that touches it, so this unit ships its session entry as a committed **journal fragment** (`.agentic-workflow/journal/20261116T183801Z-fix-588-typebox-pin-drift-narrative-local.md`, written through `journal write`), which the aggregator appends at merge. A hand append here would be the one thing the gate exists to stop.
- **D3** — 2026-11-16, decision (the advisory's carrier): the `--pins` default gap was first written as a `## Findings` row, which turned `scripts/findings-corpus.test.mjs`'s frozen census red (1153 → 1154). The row left the table instead of re-baselining the census: the `findings-table@1` grammar admits OPEN rows only and they are appended by `review-change`/`triage-issue`, neither of which ran here (§4), so the row was in the wrong carrier — the gap is recorded under `## Known pre-existing issues` instead. The census is untouched (the suite is green again in G1/G2).
- **G1** — 2026-11-16, `bun scripts/local-gate.mjs --jobs auto` · **PASS — 19 step(s) in 400s** (the first run bailed at `root-suite` on `scripts/findings-corpus.test.mjs`, 1154 vs 1153 — the census red D3 resolves; every other suite was already green).
- **G2** — 2026-11-16, `node scripts/run-root-suite.mjs` · exit 0 · **114 suites PASS / 0 FAIL** — the root suite under the node leg agrees with the bun leg G1 ran.
- **P4** — 2026-11-16 19:05, the advisory's carrier corrected, the gate receipts (G1/G2) recorded, and the stale `F1` references re-pointed at `## Known pre-existing issues` · this commit.
- **P3** — 2026-11-16 18:40, the evidence rows above, the fragment and the regenerated projection · this commit.

## Next

The unit is built and its reproducers, gate halves and differential are green
(E7–E15); it hands back for the owner's external verdict over
`8e4faa77..HEAD`. PR [#592](https://github.com/gtrabanco/agentic-workflow/pull/592)
is open against `main` with the `Closes #588` footer. Open, deliberately out of
this unit: the `--pins` default that never checks the crate (Known pre-existing
issues).

## References

Issue [#588](https://github.com/gtrabanco/agentic-workflow/issues/588) · the PR
[#592](https://github.com/gtrabanco/agentic-workflow/pull/592) · the watch
that filed it, issue [#219](https://github.com/gtrabanco/agentic-workflow/issues/219)
(`scripts/pin-watch.mjs`, feature 67 AC2) · the same package's previous bump,
[#484](https://github.com/gtrabanco/agentic-workflow/issues/484) (`1.4.5` →
`1.4.6`) and [#425](https://github.com/gtrabanco/agentic-workflow/issues/425)
(`1.4.3` → `1.4.5`) · `docs/workflow/PACKAGES.md` (Version bumps).

## Branch

`fix/588-typebox-pin-drift` — the worktree the owner created at
`.worktrees/fix-588-typebox-pin-drift`.

## Depends on

none — independent.

## Regression scope

| Scenario | Verified by |
|---|---|
| The crate's `doc` envelope and index schemas still build and validate on 1.4.7 (the only `typebox` load path) | `bun test --timeout=30000 test/` in `packages/agentic-workflow` — 858/858 at head (E9), byte-identical to the base run E3 |
| The rest of the crate suite is unchanged by the bump — no new failure, no newly-skipped case | the base-vs-head differential in E3/E9 (O6) |
| A fresh checkout stays installable from the committed lock | `bun install --frozen-lockfile` at the repo root exits 0 (O5) |
| The sibling packages' pins that live in the same lock are untouched | `git diff origin/main...HEAD -- bun.lock` touches only the `typebox` entry (O3, E5) |
| The release train still reads the crate's intent | `bun scripts/release.mjs plan` lists the new changeset and resolves without breaking the plan (O4) |
| The wired pin gate and the scheduled watch still agree | `bun scripts/pin-watch.mjs --check` and `bun scripts/version-parity-gate.mjs --pins` both exit 0 (O1, O2) |
