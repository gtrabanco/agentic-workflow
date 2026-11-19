---
type: fix
scope: xs
---

# local-f7-progress-log-scan-flake

> One-line: the F7 pin finally measures the scan it judges, on the input shape that carries the defect, at a bound with measured provenance — never the CLI spawn's startup noise.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

No forge issue. Local unit, applied inline by the owner's local workflow: the
apply request's answer ("Fix F7 if you can") declined the issue-filing option,
so this document is the tracker. The directory name carries no issue number by
design — `scripts/docs-generate.mjs`'s `unitDirs()` filters `/^\d/`, so a
non-digit unit dir stays invisible to the roadmap projection (precedent:
`docs/fix/agents-md-single-agent-guide/`, `docs/fix/local-first-gate/`); no
roadmap row exists and none is owed. The defect's history lives in unit 73's
folded finding F7 (`docs/features/73-lane-closeout-handoffs/review-findings.md:27`,
fold 80ada291) and unit 631's external verify receipt
(`docs/features/631-per-tier-cache-hit-rate/external-verify.md`, advisory 1).

## Specs

**S1 — Apply the loop: triage, fix what deserves it, check nothing else broke.**
> Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff

**S2 — The owner bound the scope to the F7 advisory.**
> Fix F7 if you can

**S3 — The advisory the fix repairs, verbatim from the verify receipt.**
> scripts/unit-route.test.mjs:582 (case "F7: long Progress-log line uses linear scan", assertion at :615): a timing assertion (500ms bound) that failed once under the bare 6-worker root-suite pool (750.668ms observed) — the same flake G1 records; the suite passes standalone (node --test scripts/unit-route.test.mjs → 64 pass / 0 fail), the suite and everything it imports are untouched by this change's diff, and the same pool behavior predates the change (recorded at G1), so per the stability check the reproducer is misattributed to adjacent code, not a change-caused defect.

## Impact

**What consumes this unit's deliverable.** The root gate: `scripts/unit-route.test.mjs`
runs in every `node scripts/run-root-suite.mjs` and `bun scripts/local-gate.mjs`
execution, and its F7 case flaked the bare-pool root suite twice in recorded
history (unit 631's G1 line: 585 ms; the external verify: 750.7 ms against the
500 ms bound), costing a re-run each time. Every other consumer reads the same
answers: the shipped `unit-route` CLI's bytes do not move — the judged module
(`recordedPhases`, `packages/agentic-workflow/src/runner/unit-route.mjs:923`)
is correct and untouched.

**What this unit consumes.** Unit 73's F7 finding (the measured quadratic curve
and the historical fold 80ada291), the fixture
`scripts/fixtures/unit-route/docs/features/13-execute-unit/SPEC.md`, and the
measurement facts established in scratch this session (PE-002..PE-004).

**What stops being true.** The F7 case's spawn-elapsed assertion
(`elapsed < 500` over the whole CLI spawn) is retired: it measured the
runtime's startup noise, not the scan, and it never exercised the defect it
names — the blind-spot receipt (E1c) shows it passes against a module regressed
to the historical quadratic. The case's comment claimed the standalone
whitespace line "would stall" a quadratic split — measured false for that
shape (PE-002); the comment now states the measured truth.

**What must be asked before touching something live.** Nothing. The change
touches one test file and one local unit doc; the fixture copy and cleanup
(`fs.cpSync`/`fs.rmSync` under `os.tmpdir()`) are the same paths the shipped
case already used.

## Surfaces

- `scripts` (the unit-route test suite only)

## Retirements

- The spawn-elapsed timing assertion in the F7 case (and its `Date.now()`
  bracket around the spawn) — replaced by the in-process `performance.now()`
  bracket around `recordedPhases` with a 100 ms bound. The correctness
  assertions (exit status, no phantom phase capture, the `next:` hand-off
  line) survive in kind; the spawn itself stays as the end-to-end correctness
  check.
- The comment's mechanism claim ("a quadratic split would stall" for the
  standalone-whitespace shape) — replaced by the measured facts (PE-002/PE-003).

## Non-goals

- No change to `packages/agentic-workflow/src/**`: the judged scan is linear
  and correct; only the test's measurement moves.
- No hardening of the other timing bounds (`scripts/phase-lint.test.mjs:2115,2139`
  and `scripts/promise-coherence.test.mjs:362,382` — the same class at 5 s
  bounds with no observed flake in recorded gate history): triaged and
  recorded in O5, touched only on an observed flake, owner decides.
- No fix for the F10-class regex cost discovered while shaping this case
  (PE-008): unit 73's open `fix-now` row owns it; this unit only reports it.
- No forge issue, no roadmap row, no changeset: the change moves no package
  surface (a changeset would declare release intent for a root test file —
  none is shipped).

## Risk tier

- **Tier** — `high` · **Task Size** — `understood · contained · resumable-from-diff`
- **Named high-risk item** — `destructive` (`scripts/unit-route.test.mjs` · `rm`):
  the classifier names the fixture cleanup (`fs.rmSync` under `os.tmpdir()`),
  the same signal the shipped case has carried since 80ada291. No new
  destructive path is introduced; the cleanup target is the case's own
  scratch fixture.

`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
--paths scripts/unit-route.test.mjs,docs/fix/local-f7-progress-log-scan-flake/SPEC.md`
answers `tier: high`, `reason_kind: named-high-risk`, `signals: [destructive]`
(`E3`). The high tier's `review-change` ceremony is substituted by the owner's
external verification: this unit is applied inline under the owner's local
workflow (§4 forbids running the repo's review machinery on its own surgery),
so the diff is handed back for the owner's verdict.

## Future

none — nothing was deferred; the sibling bounds and the F10 regex are other
findings' scope, recorded as triage rows, not deferrals of this one.

## Future cost

- The 100 ms bound is a measured claim, not a constant of nature: a runtime
  whose linear scan of a 100 KB doc costs more than 100 ms would re-open the
  question. Whoever touches `recordedPhases` next re-runs the bound's
  provenance (the case's comment carries the measurement recipe) before
  moving it.
- The historical quadratic's future depends on regex engines, not this repo:
  a future engine change could make the old pattern fast or a new pattern
  slow. The pin guards the measured property (linear cost on the finding's
  shape), never the pattern's name — that is why the input shape, not a
  mocked implementation, carries the assertion.

## Applicable tests

- `bun test scripts/unit-route.test.mjs` and `node --test scripts/unit-route.test.mjs`
  — the rebuilt F7 case and the 63 untouched cases.
- `node scripts/run-root-suite.mjs` — the bare-pool gate that flaked twice;
  green here is the acceptance (O4).
- `bun scripts/local-gate.mjs --jobs 2` — the full gate (O4's second leg).

## Known pre-existing issues

- The F7 flake itself (pre-existing, this unit repairs it): the shipped case
  never exercised the quadratic path — its input shape is the fast one — so
  its 500 ms bound measured only spawn startup and flaked under load
  (585 ms at unit 631's G1, 750.7 ms at the external verify).
- Unit 73's F10 finding is still open in that ledger (`fix-now`, not folded):
  the action-word matcher's nested-quantifier regex backtracks super-linearly
  on the miss path. This session reproduced the class while shaping the new
  case: a marker entry worded `— follow-up notes…` followed by a 50 000-space
  run measured 134.6 ms in-process under bun (PE-008) — far from F10's 33.8 s
  only because the probe's word run is short. Reported to the owner; it is the
  stale-receipts pool's scope, not this unit's.
- The same-class sibling bounds (phase-lint F99 ×2, promise-coherence ×2) carry
  5 s bounds with no recorded flake — triaged, untouched (O5).

## Tasks

- P1 — Reproduce the frozen failures and measure the three costs in scratch
  (`mktemp -d`, removed after): the historical quadratic on the finding's
  shape under both runtimes, the shipped case's blind spot against a regressed
  module, the linear scan's cost (validator: the scratch receipts `E1a/E1b/E1c`
  and the probe table in `D2`)
  (Implements: S1, S3)
  - Relevant files: (scratch only — no tree change)
- P2 — Rebuild the F7 case in `scripts/unit-route.test.mjs`: the finding's
  input shape added beside the original shape, the timing assertion moved
  in-process onto `recordedPhases` with the 100 ms bound and its provenance,
  the comment's mechanism claim corrected, the spawn-level correctness
  assertions preserved (validator: `bun test scripts/unit-route.test.mjs`
  exits 0 (64 pass) and `node --test scripts/unit-route.test.mjs` exits 0
  (64 pass))
  (Implements: S2, S3)
  - Relevant files: scripts/unit-route.test.mjs
- P3 — Verify and settle: the bare-pool root suite (the config that flaked
  twice), the full local gate, the sibling sweep receipt, this ledger closed
  and the session logged (validator: `node scripts/run-root-suite.mjs` exits 0
  and `bun scripts/local-gate.mjs --jobs 2` exits 0)
  (Implements: S1, S2)
  - Relevant files: docs/LOGS.md, docs/fix/local-f7-progress-log-scan-flake/SPEC.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | file-read | The F7 case's timing assertion brackets the whole CLI spawn (`Date.now()` around `spawnSync`), so it measures runtime startup plus the full router run — the 585/750 ms gate flakes are startup noise, not scan cost | `scripts/unit-route.test.mjs:616-626` at origin/main, unit 631's `G1` and `external-verify.md` advisory | verified 2026-11-18 | O1 |
| PE-002 | measured-probe | The shipped case's input shape (a standalone 50 000-space line) does not trigger the historical quadratic: the old `split(/\s+next:.*$/i)` on that line costs 0.2 ms — the case never exercised the defect it names | scratch probe, bun 1.4.5-canary, 2026-11-18 (`E1c` setup) | measured 2026-11-18 | O2; D2 |
| PE-003 | measured-probe | The finding's shape (a marker line whose whitespace run follows non-whitespace with no ` next:` tail) is quadratic today on both runtimes: 10k=139/152 ms, 20k=659/319 ms, 40k=3443/1528 ms, 50k=4977/2464 ms (node/bun) — unit 73's F7 curve reproduces | scratch probe, `E1` setup, matching `docs/features/73-lane-closeout-handoffs/review-findings.md:27` | measured 2026-11-18 | O2; D2 |
| PE-004 | measured-probe | The linear scan (`indexOf(" next:")`) over the rebuilt fixture doc costs <1 ms in-process on both runtimes, so the 100 ms bound carries >100× headroom over the measurement and ≥13× below the regressed module's measured 1307/3056 ms | `E2` runs and the `E1a/E1b` red receipts | measured 2026-11-18 | O1; O2 |
| PE-005 | file-read | `recordedPhases` is exported from `packages/agentic-workflow/src/runner/unit-route.mjs:923` and the test file already imports the module (`findingsRows`, `routeOfRow`) — the in-process measurement adds no new surface | `scripts/unit-route.test.mjs:22`, `git show origin/main:…unit-route.mjs` | verified 2026-11-18 | O1 |
| PE-006 | file-read | The pre-fold code split only marker lines (`/^\s*[-*+]\s/`), so the quadratic miss path needs a marker line whose run follows non-whitespace — the fixture's second entry provides exactly that shape | `git show 80ada291^:scripts/unit-route.mjs` (`recordedPhases`) | verified 2026-11-18 | O2 |
| PE-007 | file-read | A non-digit unit dir is invisible to the projection (`unitDirs()` filters `/^\d/`), with in-tree precedent, so this local ledger adds no roadmap row and no emitter churn | `scripts/docs-generate.mjs:191-198`; `docs/fix/agents-md-single-agent-guide/`, `docs/fix/local-first-gate/` | verified 2026-11-18 | D1 |
| PE-008 | measured-probe | The action-word matcher's nested-quantifier regex (unit 73's OPEN F10 finding) is live in `recordedPhases`: a marker entry worded `— follow-up notes…` before a 50 000-space run measured 134.6 ms in-process under bun — the same class F10 measured at 33.8 s; the fixture line was reshaped to avoid tripping it, and the finding is reported, not fixed here | scratch probe during P2; `docs/features/73-lane-closeout-handoffs/review-findings.md:50` | measured 2026-11-18 | O5; Non-goals |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S3/S2 | the F7 case's timing assertion measures `recordedPhases` in-process on the finding's input shape — never the CLI spawn — with a 100 ms bound whose provenance is stated in the case | P2 | P2 | execute-phase | `bun test scripts/unit-route.test.mjs` exits 0 (64 pass) and `node --test scripts/unit-route.test.mjs` exits 0 (64 pass) | `E2` lines naming both runtimes | verified |
| O2 | S2 | the rebuilt pin keeps the guard's discriminating power: a module regressed to the historical split turns the case red on the bound on both runtimes, while the shipped case passed against the same regressed module | P1 | P1 | execute-phase | the scratch receipts: `bun test scripts/unit-route.test.mjs -t "F7"` fails with `F7 linear scan took 1307.9ms` and `node --test --test-name-pattern "F7"` fails with `3056.4ms` against the regressed module; the shipped case passes (162.8 ms) against the same module | `E1a`/`E1b`/`E1c` lines | verified |
| O3 | S1 | the spawn-level correctness assertions survive in kind: exit status 0, no phase captured from either long line, the `next: P2` hand-off line unchanged | P2 | P2 | execute-phase | the F7 case's diff keeps the three assertions; the suite's other 63 cases are byte-untouched (`git diff --stat` names one file) | `E2` + the diff receipt | verified |
| O4 | S1 | the bare-pool root suite (the configuration that flaked twice) passes with the change in the tree, and the full gate passes | P3 | P3 | execute-phase | `node scripts/run-root-suite.mjs` exits 0 and `bun scripts/local-gate.mjs --jobs 2` exits 0 | `G1`/`G2` lines with exit codes | verified |
| O5 | S1 | every same-class timing bound in the suites is triaged and recorded: the F7 case repaired, the five 5 s bounds (phase-lint ×2, promise-coherence ×2, schema min-of-3) classified with their observed-flake history, none touched without an observed flake | P3 | P3 | execute-phase | the sweep receipt `E4`: `rg -n "elapsed <" scripts/*.test.mjs packages/*/test/*.mjs` names only triaged rows, each carrying its disposition in this unit doc | `E4` line | verified |
| O6 | S1 | no shipped command's bytes move: the diff names only the test file, this unit's docs and the session journal fragment | P3 | P3 | execute-phase | `git diff --name-only b47c071e HEAD` (the branch point) names only `scripts/unit-route.test.mjs`, `docs/fix/local-f7-progress-log-scan-flake/**` and `.agentic-workflow/journal/*local-f7*` — `origin/main` itself moved after the branch was cut (unit 616 delivered), so the branch-point form is the one that isolates this delta | `E5` line | verified |

## Acceptance criteria

| # | Criterion | Proved by |
|---|---|---|
| AC-1 (S1) | The triage is recorded with its receipts: the verify receipt's 0-blocker/1-advisory state, the stale-receipts pool reported to the owner, and the F7 selection — all in this doc's Log | this document's `L1`/`L2`/`D2` lines and `external-verify.md` |
| AC-2 (S2/S3) | The F7 case pins the scan it judges at the layer the defect lives: in-process, finding-shape, measured bound | `bun test scripts/unit-route.test.mjs` exits 0 and `node --test scripts/unit-route.test.mjs` exits 0 (`E2`) |
| AC-3 (S2) | The rebuilt pin catches the frozen failure it names: red on the regressed module on both runtimes, green at head | `E1a`/`E1b` (red receipts) against `E2` |
| AC-4 (S1) | No collateral breakage: the bare-pool root suite exits 0 and the diff moves no shipped bytes | `G1` and the `E5` receipt |
| AC-5 (S1) | The same-class sibling bounds are triaged with dispositions, and the discovered F10-class cost is reported to the owner | `E4` and `PE-008` |

## Triaged steps

> Local, unpublished workflow: this unit is applied inline by the owner's
> instruction, so `runner unit-route` is not run and this block stays empty by
> design, never by omission (the change is handed back as a diff, not as a lane
> execution).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-18, the request, verbatim:
  ```
  Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff
  ```
- **L2** — 2026-11-18, the owner's scope answer to the one-question outcome
  contract ("Which findings does 'those that deserve to fix' cover?"), verbatim:
  `Fix F7 if you can` — the F7 advisory is the target; the stale-receipts pool
  (~35 `NEEDS-DECISION` external-verify receipts across other unit dirs) is
  reported, not swept.
- **D1** — 2026-11-18, ledger-home decision: local unit dir, no forge issue.
  The scope question embedded the issue-filing option and the answer declined
  it; §5's one ask was spent, so the conservative default applies — no forge
  mutation. The template's required `#<n>` Issue section is satisfied by the
  deviation statement in `## Issue` (PE-007 carries the emitter rationale).
- **D2** — 2026-11-18, the measurement facts this fix stands on, all measured
  this session in scratch, never carried from memory:
  - The shipped F7 case is blind to the defect it names: its input shape (a
    standalone whitespace line) is the fast path for the historical regex
    (0.2 ms), so the case never exercised the quadratic, and its 500 ms bound
    measured only spawn startup (PE-002, `E1c`).
  - The finding's shape (marker line, whitespace run after non-whitespace, no
    ` next:` tail) reproduces the quadratic today on both runtimes — unit 73's
    F7 curve is current, not stale (PE-003).
  - The rebuilt case on the linear module: <1 ms in-process; on the regressed
    module: 1307.9 ms (bun) / 3056.4 ms (node) — the 100 ms bound separates
    them with >13× margin on the red side and >100× on the green side
    (PE-004, `E1a`/`E1b`).
- **E3** — 2026-11-18, `bun packages/agentic-workflow/bin/agentic-workflow.mjs
  ceremony tier classify --paths scripts/unit-route.test.mjs,docs/fix/local-f7-progress-log-scan-flake/SPEC.md`
  · exit 0 · `tier: high`, `reason_kind: named-high-risk`, `signals: [destructive]`.
- **E1a** — 2026-11-18, RED, bun: scratch `git archive origin/main` copy with
  `packages/agentic-workflow/src/runner/unit-route.mjs` regressed to the
  historical `split(/\s+next:.*$/i)`, the new test file overlaid →
  `bun test scripts/unit-route.test.mjs -t "F7"` · exit 1 ·
  `F7 linear scan took 1307.9ms (expected <100ms…)` — the frozen failure
  reproduces through the rebuilt pin.
- **E1b** — 2026-11-18, RED, node: the same scratch → `node --test
  --test-name-pattern "F7" scripts/unit-route.test.mjs` · exit 1 ·
  `F7 linear scan took 3056.4ms` — the frozen failure reproduces under the
  other runtime.
- **E1c** — 2026-11-18, blind spot: the same regressed scratch with the
  SHIPPED test file restored → `bun test scripts/unit-route.test.mjs -t "F7"`
  · exit 0 · pass in 162.8 ms — the shipped case cannot see the defect it
  names; its 500 ms bound passed on a module carrying the quadratic.
- **E2** — 2026-11-18, green at head: `bun test scripts/unit-route.test.mjs` ·
  exit 0 · 64 pass · 0 fail, and `node --test scripts/unit-route.test.mjs` ·
  exit 0 · 64 pass · 0 fail — both runtimes, one file changed
  (`git diff --stat`: 33 insertions, 14 deletions).
- **E4** — 2026-11-18, the sibling sweep: `rg -n "elapsed <"
  scripts/*.test.mjs packages/*/test/*.mjs` names fourteen timing bounds
  besides the repaired one, each dispositioned here —
  `scripts/phase-lint.test.mjs:2115,2139` (F99 linearity pins, spawn-based,
  5 s bounds), `scripts/promise-coherence.test.mjs:362,382` (in-process
  refusal bounds, 5 s), `scripts/workflow-status-sensor.test.mjs:532,954`
  (45 s / 20 s hang guards), `packages/agentic-workflow/test/memory-probe.test.mjs:194`
  (100 ms shared-budget guard), `packages/agentic-workflow-schema/test/verification-preflight.test.mjs:109-215`
  (four refusal bounds behind a min-of-3 helper — already the noise-robust
  pattern), `packages/pi-agentic-workflow/test/hooks-wiring.test.mjs:424`
  (2.5 s shutdown budget), `settings-console.test.mjs:117` (100 ms trap
  guard), `receipt-guard.test.mjs:137` (5 s probe bound). Dispositions: none
  of the fourteen has an observed flake in recorded gate history; each is
  left untouched and re-triaged on its first observed flake (the phase-lint
  F99 pair and the promise-coherence pair are the closest class to F7 and the
  first to revisit).
- **G1** — 2026-11-18, HEAD 40cfeee7, `node scripts/run-root-suite.mjs` ·
  exit 0 · all suites PASS, no failing tests — the bare-pool configuration that
  flaked twice is green on the first attempt (O4 first leg; the F7 case no
  longer carries a spawn bound to flake).
- **G2** — 2026-11-18, HEAD 40cfeee7, `bun scripts/local-gate.mjs --jobs 2` ·
  exit 0 · `local-gate: PASS — 19 step(s) in 679s` (O4 second leg; the full
  gate including log-immutability, docs-generated-projection, context budgets
  and the identity steps).
- **E5** — 2026-11-18, `git diff --name-only b47c071e HEAD` (the branch
  point) names `scripts/unit-route.test.mjs`,
  `docs/fix/local-f7-progress-log-scan-flake/SPEC.md` and the session journal
  fragment under `.agentic-workflow/journal/` — no package, skill, template or
  gate surface moves. `origin/main` moved after the branch was cut (unit
  616's delivery landed, 10 commits); its files name none of this unit's
  surfaces, so the future merge is clean. The session entry lands as a
  fragment, never a `docs/LOGS.md` hand edit (`scripts/log-immutability.mjs`
  refuses those; the aggregator owns that file).

## Next

- The owner's external verification of this diff (the branch is local; the
  owner decides push/PR). The stale-receipts pool (~35 `NEEDS-DECISION`
  receipts, ~12 on unmerged units) waits for the owner's sweep decision; the
  F10-class regex cost observed in PE-008 belongs to that pool.

## References

- Unit 73's F7 finding and its fold: `docs/features/73-lane-closeout-handoffs/review-findings.md:27`,
  commit 80ada291.
- Unit 631's external verify receipt (the advisory this fix repairs):
  `docs/features/631-per-tier-cache-hit-rate/external-verify.md`.
- Unit 73's open F10 finding (the regex class observed in PE-008):
  `docs/features/73-lane-closeout-handoffs/review-findings.md:50`.

## Branch

`fix/local-f7-progress-log-scan-flake` — local branch off `origin/main`
(b47c071e), no push yet; the owner decides the delivery (push/PR or inline
fold).

## Depends on

none — the F7 advisory is independent of every open unit.

## Regression scope

`scripts/unit-route.test.mjs` — one case rebuilt, 63 untouched. The fixture
gains a second long line (the finding's shape) beside the original one; the
fixture doc itself (`scripts/fixtures/unit-route/**`) is read-only for this
change.
