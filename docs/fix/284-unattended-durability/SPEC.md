---
type: fix
scope: medium
---

# fix/284-unattended-durability

> Make an `advance` (pi-native conductor) run survive process death without a
> human: the operator-side restarter plus a `--resume` entry that reconciles
> from ground truth before it continues.

## Issue

`#284` — tracked issue in the project's forge. The PR must close it via
`Closes #284` in the body.

## Specs

**S1 — the supervisor and the resume entry (issue P1).**
> "**Supervisor**: an external restarter of the operator's choice (systemd-run /
>  cron / launchd / a small daemon — ask-first provisioning per #219's pattern)
>  that detects conductor process death and re-invokes `advance`.
> - **Resume entry**: `advance --resume` (or resume-by-default when a run-log is
>  present) runs the crash reconcile first and continues **only** on
>  CLEAN/RESUMABLE; AMBIGUOUS stops for a human — unchanged, by design.
> - Ground truth stays the authority: the supervisor's restart hint has the same
>  status as `--last-envelope` — a hint; git/docs win on any disagreement."

**S2 — kill -9 survival with zero human interaction.**
> "AC1 `kill -9` in the middle of a multi-iteration `advance` run →
>  supervisor restarts → the run completes with **zero human interaction**."

**S3 — AMBIGUOUS halts for a human and is recorded.**
> "AC2 AMBIGUOUS reconcile still halts for a human (no silent continuation)
>  and the run-log records the stop."

**S4 — the resume is auditable and idempotent.**
> "AC3 The resume is auditable: run-log rows record death → restart →
>  resumed iteration, and no phase runs twice (idempotent re-entry +
>  receipts verified by the gate)."

**S5 — no new runtime dependencies; the supervisor is operator-side.**
> "AC4 No new runtime dependencies inside the package; supervisor is
>  operator-side, documented ask-first."

**S6 — one operator runbook, skill prose untouched.**
> "AC5 Docs: one procedure doc (operator runbook) + skill prose untouched
>  where it would break stack-agnosticism."

**S7 — the Pi Durable spike is a later phase, gated on the issue's own P1.**
> "## P2 — Pi Durable driver spike (experimental, gated on P1)"

**S8 — the pick-up drift sweep runs before any P1 scope decision.**
> "When this issue is picked up, first sweep the latest pi changelog
>  (https://pi.dev/changelog/releases/) for changes affecting
>  `@gtrabanco/pi-agentic-workflow` or this issue's surface, record anything
>  relevant as a scope note here, and adopt any improvement that benefits
>  functioning, performance, or cost"

**S9 — inline, test-first delivery; the deterministic gates still run.**
> "No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate
> exceptions on this change. Direct application: the §5 ledger freeze **is** the
> plan; implement against it, hand the diff to me. The one exception is the
> repo's deterministic gates (tests, lints) — run those always."

**S10 — the P2 spike is authorized now (owner amendment, 2026-11-09).**
> "Hazlo aunque sea experimental."

**S11 — publish the unit: commit, push and open the PR.**
> "Cuando acabes commit y push y crea la PR."

## Acceptance criteria

One observable criterion per requirement, each naming the check that proves it.

- **AC-S1** — `advance --resume` runs the crash reconcile from the sensor's own
  verdict before the first invocation, and a run with an interrupted journal and
  no `--resume` reconciles too. Proved by `bun test
  test/conductor-loop-resume.test.mjs` (the reconcile and preflight cases).
- **AC-S2** — a conductor process SIGKILLed mid-run is restarted by the rendered
  supervisor and completes on the next attempt with no human input. Proved by
  `bun test test/conductor-crash-resume.test.mjs` (the SIGKILL end-to-end).
- **AC-S3** — an interrupted run whose sensor verdict is `AMBIGUOUS` stops
  before any invocation, and the journal records the halt. Proved by `bun test
  test/conductor-loop-resume.test.mjs` (the halt case) and the crash fixture's
  ambiguous scenario.
- **AC-S4** — every run writes `run/start` and `run/stop`, and the resume path
  writes the death→restart→resume rows; a stage that completed before the kill
  is not invoked again (its receipt is the ground truth that advances the
  sensor). Proved by `bun test test/conductor-crash-resume.test.mjs` (the
  per-stage invocation count assertion).
- **AC-S5** — the package manifest's `dependencies` and `devDependencies` are
  unchanged, and the supervisor exists only as rendered operator-side text.
  Proved by `git diff --exit-code 1fa39fe1 --
  packages/pi-agentic-workflow/package.json` (no dependency line changes) and
  `bun test test/conductor-supervisor.test.mjs` (the renderer is a pure
  string function).
- **AC-S6** — one operator runbook exists at
  `packages/pi-agentic-workflow/README.md` and no `skills/**` file is modified.
  Proved by `rg -c 'stop-crash-ambiguous' packages/pi-agentic-workflow/README.md`
  → 2 and `git diff --name-only 1fa39fe1 -- skills/` → empty.
- **AC-S7** — the P2 spike is not implemented here and the exclusion is
  recorded with evidence. Proved by this document's D2 row and PE-006.
- **AC-S8** — the drift sweep ran and is recorded. Proved by PE-005 / PE-006 and
  the scope note in the Log (L3).
- **AC-S9** — no repo review machinery ran on this change (no `review-change`,
  no `audit-pr`, no fold cycle), and the deterministic gates did run. Proved by
  the `## Log` `G` lines and the absence of `R`/`F` lines.
- **AC-S10** — the P2 spike ran on the real substrate, was killed in two places,
  resumed without a human, and recorded a verdict with its numbers. Proved by
  the receipts in `docs/research/284-pi-durable-spike.md` and by `bun test
  scripts/pi-durable-spike.test.mjs` (the offline contract; SP6 replays the
  killed lane when `PI_DURABLE_DIR` is set).
- **AC-S11** — the branch is pushed and an open PR closes the issue. Proved by
  the pushed head and the PR URL recorded in the `## Log`.

## Impact

- `packages/pi-agentic-workflow/src/conductor/` gains three modules
  (`journal.ts`, `resume.ts`, `supervisor.ts`) and `index.ts` re-exports them;
  `loop.ts` gains the run boundary rows and the reconcile gate behind two new
  optional `LoopDeps` fields, so every existing caller keeps its behaviour when
  they are absent.
- `packages/pi-agentic-workflow/src/extension/conductor-command.ts` wires the
  preflight reader, the `--resume` flag and `--print-supervisor`; no other
  command changes.
- `packages/pi-agentic-workflow/README.md` gains the operator runbook (S6). No
  `skills/**` file changes: the conductor is package layer, and a stack-agnostic
  skill has nothing to say about a restarter.
- The run log (`.agentic-workflow/advance-run.log`, `advance.runLogPath`) gains
  `run/start`, `run/stop`, `resume/*` and `supervisor/*` rows in the existing
  `YYYY-MM-DD HH:MM — kind/code — detail — k/cap` grammar. Consumers that read
  the log as prose (the operator, the docs) keep working; nothing parses it as a
  closed set today (`rg -n 'advance-run' packages scripts` → the config default
  and its two tests only).
- The roadmap row 81 (`unattended-durability`, `idea`) moves to `in-progress`
  and points at this unit folder; the issue stays open for P2.
- Package manifest: no dependency added or removed; one `.changeset/` intent
  (minor) ships instead of a hand version bump.

## Retirements

Nothing is retired. The change only adds surfaces: the run log's grammar is
extended append-only, `advance` gains flags it never had, and every loop
behaviour is preserved when the new optional deps are absent. The one
near-retirement — the "one stage per invocation" default — stays: `--continue`
is still opt-in, and the supervisor template passes it explicitly.

## Non-goals

- The P2 Pi Durable spike (S7): a separate phase the issue gates on P1 landing.
- Any new reconciler. The sensor's existing `crash_recovery` verdict (features
  03/38) is the one authority; this change only *reads* it.
- Durable state as an authority. The run journal is a hint; git/docs win.
- A daemon, a lock file, or a heartbeat protocol inside the package: the
  restarter is operator-side shell (S5).
- No `skills/**` prose (S6).

## Risk tier

- **Tier** — `standard` · **Task Size** — understood + contained risk + resumable
  from the diff (`task_size: {understood: true, contained_risk: "contained",
  resumable_from_diff: true}`)

Computed, not chosen: `scripts/risk-tiers.mjs` `classifyTier()` was called with
the change's paths and their contents and returned `standard`,
`reason_kind: executable-content` ("14 path(s) carry executable content"), no
escalating signal. The wrapper (`bun scripts/ceremony.mjs tier classify`) cannot
run in **this** worktree because its `git diff … HEAD` argument is ambiguous
while the linked worktree's metadata (`HEAD`, `index`, …) shares the working
directory — a pre-existing repository-layout quirk, recorded below; the
classifier itself is the same pure function the wrapper calls.

- **Named high-risk item** — none — not a high-tier unit.

## Future

none

## Future cost

- Whoever changes the run-log row grammar owns `conductor/journal.ts` and the
  supervisor template in `conductor/supervisor.ts`: the template greps
  `run/stop`, so a renamed row silently turns every clean stop into a restart
  loop. The pair is pinned by `conductor-supervisor.test.mjs`.
- The supervisor's restart cap is the operator's blast-radius control; raising it
  in a template is a behaviour change for every unattended run.

## Applicable tests

`packages/pi-agentic-workflow/test/conductor-journal.test.mjs`,
`conductor-resume.test.mjs`, `conductor-loop-resume.test.mjs`,
`conductor-supervisor.test.mjs`, `conductor-crash-resume.test.mjs` (the
SIGKILL end-to-end), plus the untouched `conductor-loop.test.mjs` as the
regression witness.

## Known pre-existing issues

- `advance` writes its run log best-effort (`appendRunLog` swallows write
  errors): a run whose log is unwritable cannot be reconciled. Does **not**
  affect this unit — resume fails closed to `AMBIGUOUS` when the journal cannot
  be read (an unreadable log is an unverifiable resume), and the existing
  swallow is unchanged.
- The wired `advance` decision path passes `lastOutcome: null` on every
  iteration (`conductor/loop.ts`), and `decideFromEnvelope` answers a null
  outcome with `sense-initial`. A multi-iteration run through the shipped wiring
  therefore senses twice and stops; the loop's multi-iteration behaviour is
  exercised with a supplied `decide`. **Does not affect this unit** — the run
  boundary, the reconcile gate and the supervisor are loop-level and are proven
  with a deterministic `decide` in the crasher fixture — but AC1's "multi-
  iteration `advance` run" is only reachable once that decision wiring carries a
  real outcome. Out of scope here (it needs an outcome-capture design), recorded
  for the owner.
- Two repository test suites fail for environment reasons, not for this change,
  and fail identically at the base commit `1fa39fe1` (differential run in
  `mktemp -d`): `scripts/ceremony-workspace.test.mjs` (one case, JSON usage
  output) and `scripts/local-gate.test.mjs` (`journal-carrier-check`). In
  `packages/pi-agentic-workflow`, two "live" cases in
  `test/workflow-tools.test.mjs` (`snapshot-verify live`, `audit-pr-gate live`)
  also fail at base; they are sandbox/environment dependent. This unit's own
  suites are green.

## Tasks

- P1 — the run journal: the row reader/writer and the interrupted-run detector.
  (validator: `bun test test/conductor-journal.test.mjs` exits 0)
  (Implements: S1, S4)
  Relevant files: packages/pi-agentic-workflow/src/conductor/journal.ts,
  packages/pi-agentic-workflow/test/conductor-journal.test.mjs
- P2 — the resume gate: the crash-verdict reader and the loop's next action
  from it, failing closed to `AMBIGUOUS` when the verdict is unreadable.
  (validator: `bun test test/conductor-resume.test.mjs` exits 0)
  (Implements: S1, S3)
  Relevant files: packages/pi-agentic-workflow/src/conductor/resume.ts,
  packages/pi-agentic-workflow/test/conductor-resume.test.mjs
- P3 — the operator supervisor renderer: a pure function over the spec whose
  output is one dependency-free POSIX shell script.
  (validator: `bun test test/conductor-supervisor.test.mjs` exits 0)
  (Implements: S1, S2, S5)
  Relevant files: packages/pi-agentic-workflow/src/conductor/supervisor.ts,
  packages/pi-agentic-workflow/test/conductor-supervisor.test.mjs
- P4 — the loop's run boundary: `run/start` before the first sensor and
  `run/stop` on every terminal return.
  (validator: `bun test test/conductor-loop-resume.test.mjs test/conductor-loop.test.mjs`
  exits 0)
  (Implements: S1, S2, S4)
  Relevant files: packages/pi-agentic-workflow/src/conductor/loop.ts,
  packages/pi-agentic-workflow/src/conductor/types.ts
- P5 — the loop's reconcile gate: the first iteration consults the gate and an
  `AMBIGUOUS` verdict halts before any invocation.
  (validator: `bun test test/conductor-loop-resume.test.mjs` exits 0)
  (Implements: S1, S3)
  Relevant files: packages/pi-agentic-workflow/src/conductor/loop.ts,
  packages/pi-agentic-workflow/test/conductor-loop-resume.test.mjs
- P6 — the conductor module's public exports for the new surfaces.
  (validator: `bun run build` exits 0)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/src/conductor/index.ts
- P7 — the `advance` flags: `--resume` and `--print-supervisor` through one
  parser shared with the entry.
  (validator: `bun test test/conductor-resume.test.mjs` exits 0)
  (Implements: S1, S5)
  Relevant files: packages/pi-agentic-workflow/src/extension/conductor-command.ts
- P8 — the `advance` preflight: the journal reader wired before the first
  sensor run, plus the run identity the boundary row carries.
  (validator: `bun run build` exits 0)
  (Implements: S1, S4)
  Relevant files: packages/pi-agentic-workflow/src/extension/conductor-command.ts
- P9 — the frozen-failure reproducer: a fixture conductor killed with SIGKILL
  mid-run, restarted by the rendered supervisor, completing unattended.
  (validator: `bun test test/conductor-crash-resume.test.mjs` exits 0)
  (Implements: S2, S3, S4)
  Relevant files: packages/pi-agentic-workflow/test/conductor-crash-resume.test.mjs,
  packages/pi-agentic-workflow/test/fixtures/advance-runner.mjs
- P10 — the operator runbook in the package README.
  (validator: `rg -c 'stop-crash-ambiguous' packages/pi-agentic-workflow/README.md`
  matches 1)
  (Implements: S6)
  Relevant files: packages/pi-agentic-workflow/README.md
- P11 — the repository indexes: the roadmap feature row, the fix row and the
  changeset intent.
  (validator: `rg -c 'docs/fix/284-unattended-durability' docs/ROADMAP.md` matches 2)
  (Implements: S9)
  Relevant files: docs/ROADMAP.md, .changeset/284-unattended-durability.md
- P12 — verification: the package suite, the root gate and the recorded drift
  evidence, with the P2 exclusion recorded.
  (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S1, S7, S8, S9)
  Relevant files: docs/fix/284-unattended-durability/planning-evidence.md,
  docs/fix/284-unattended-durability/planning-obligations.md

- P13 — the spike harness: one durable task per stage, the lane document
  committed with it, and the two real death points.
  (validator: `bun test scripts/pi-durable-spike.test.mjs` exits 0)
  (Implements: S10)
  Relevant files: scripts/pi-durable-spike.mjs,
  scripts/pi-durable-spike.test.mjs
- P14 — the spike report: the recorded runs, the numbers and the verdict.
  (validator: `rg -c 'Verdict: `REJECT`' docs/research/284-pi-durable-spike.md`
  matches 1)
  (Implements: S10)
  Relevant files: docs/research/284-pi-durable-spike.md
- P15 — publication: the commit, the push and the PR closing the issue.
  (validator: `gh pr list --head feat/284-unattended-durability --state open --json number` matches 1)
  (Implements: S11)
  Relevant files: docs/fix/284-unattended-durability/SPEC.md

### Planning evidence

Frozen in `planning-evidence.md` (medium unit: the ledger lives beside this
doc, never embedded).

### Obligations

Frozen in `planning-obligations.md` (medium unit: the ledger lives beside this
doc, never embedded).

## Triaged steps

```text
unit-route@1
unit: docs/fix/284-unattended-durability
route: execute
```

The route is read-only: the unit is known, it carries no OPEN findings row, and
it has open work. No triage block reorders the frozen task list.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the issue, verbatim (P1 half, the half this unit
  delivers):
  ```
  ## P1 — Supervisor + resume entry (deterministic, ship first)

  - **Supervisor**: an external restarter of the operator's choice (systemd-run /
    cron / launchd / a small daemon — ask-first provisioning per #219's pattern)
    that detects conductor process death and re-invokes `advance`.
  - **Resume entry**: `advance --resume` (or resume-by-default when a run-log is
    present) runs the crash reconcile first and continues **only** on
    CLEAN/RESUMABLE; AMBIGUOUS stops for a human — unchanged, by design.
  - Ground truth stays the authority: the supervisor's restart hint has the same
    status as `--last-envelope` — a hint; git/docs win on any disagreement.
  ```
- **L2** — 2026-11-09, the requester's delivery constraint, verbatim: "Work
  inline — never run this repo's own machinery on its own surgery … The one
  exception is the repo's deterministic gates (tests, lints) — run those always."
- **D1** — 2026-11-09, the unit folder is `docs/fix/284-unattended-durability/`
  because the requester's local workflow names the fix-lane carrier; roadmap row
  81 keeps its feature number and points here.
- **D2** — 2026-11-09, S7: the Pi Durable spike is not cut as a requirement of
  this change — the issue gates it on P1 ("experimental, gated on P1") and the
  owner's 2026-10-28 decision defers its ADOPT/REJECT verdict to the phase it
  opens. S8's drift sweep is run here and its evidence recorded.

- **D3** — 2026-11-09, ledger re-point at cut: `phase-lint` refused the first
  task cut (one bullet carried several deliverables), the tasks were split into
  twelve phases, and the obligations' phase/task cells were re-pointed to them.
  No obligation was added, removed or re-scoped.
- **L3** — 2026-11-09, two fixture inputs were corrected while the RED corpus was
  being made to run, never an assertion: the supervisor's "completed run"
  fixture wrote `stop-blocked` (a human-decision code, correctly exiting 3) and
  now writes `stop-nothing-startable`; the loop's fail-closed case passed
  `undefined` into a parameter with a default and therefore got a `RESUMABLE`
  envelope, and now builds an envelope with no `crash_recovery` section at all.
- **E1** — 2026-11-09, RED: `bun test test/conductor-journal.test.mjs` · 0 pass /
  10 fail (the module did not exist). GREEN after P1 · 10 pass / 0 fail.
- **E2** — 2026-11-09, RED: `bun test test/conductor-resume.test.mjs` · 0 pass /
  11 fail. GREEN after P2 · 11 pass / 0 fail.
- **E3** — 2026-11-09, RED: `bun test test/conductor-loop-resume.test.mjs` · 0
  pass / 8 fail. GREEN after P4/P5 · 8 pass / 0 fail.
- **E4** — 2026-11-09, RED: `bun test test/conductor-supervisor.test.mjs` · 0
  pass / 6 fail. GREEN after P3 · 6 pass / 0 fail.
- **E5** — 2026-11-09, RED: `bun test test/conductor-crash-resume.test.mjs` · 0
  pass / 2 fail. GREEN after P1–P9 · 2 pass / 0 fail (the SIGKILL end-to-end).
- **E6** — 2026-11-09, the regression witness: `bun test
  test/conductor-loop.test.mjs` · 18 pass / 0 fail, with the AC10 log assertion
  strengthened to the per-iteration count plus the run boundary.
- **E7** — 2026-11-09, the six conductor suites together · 55 pass / 0 fail.
- **E8** — 2026-11-09, differential: the package's two `valid envelope` sensor
  cases and the two `live` workflow-tools cases fail identically in a base
  checkout of `1fa39fe1` (`mktemp -d`), so they are environmental, not this
  change's.
- **E9** — 2026-11-09, `git diff --exit-code 1fa39fe1 --
  packages/pi-agentic-workflow/package.json` · exit 0 (no dependency change);
  `git diff --name-only 1fa39fe1 -- skills/` · no output;
  `rg -c 'stop-crash-ambiguous' packages/pi-agentic-workflow/README.md` · 2.
- **P1** — 2026-11-09, the five modules and their suites landed: the run journal,
  the resume gate, the supervisor renderer, the loop boundary + reconcile gate
  and the `advance` wiring · 9c40e590.
- **P2** — 2026-11-09, the ledgers, the operator runbook, the roadmap/fix rows, the
  changeset and the regenerated projection landed · 3f721446.
- **P3** — 2026-11-09, the session journal fragment landed
  (`.agentic-workflow/journal/20261109T155402Z-feat-284-unattended-durability-narrative-local.md`).
- **L4** — 2026-11-09, the owner's amendment, verbatim: "Hazlo aunque sea
  experimental. Cuando acabes commit y push y crea la PR. El worktree está
  corrupto, copia los cambios y haz un backup de ellos y repara el worktree si,
  y solo si, es necesario para poder hacer commit y push"
- **D5** — 2026-11-09, the unit's scope is extended by that amendment: P2 (the
  Pi Durable spike) is cut as P13–P15 and AC-S10/AC-S11, with one obligation per
  new phase. The verdict is `REJECT` (defer) on the evidence in
  `docs/research/284-pi-durable-spike.md`: the mechanism is validated, the
  substrate is still explicitly experimental, and AC7's token half needs a
  provider this environment does not have.
- **D6** — 2026-11-09, the worktree is not repaired. It stays usable for commit
  and push: the backup (`git bundle`, the patch series and a tarball) is taken,
  and the only blocker found was a missing `node`/`npm` on `PATH` for the
  pre-push gate, not the layout.
- **E10** — 2026-11-09, RED: `bun test scripts/pi-durable-spike.test.mjs` with
  the harness absent · 0 pass / 1 error (missing module). GREEN after P13 · 5
  pass / 1 skip without the substrate, 6 pass with
  `PI_DURABLE_DIR=/tmp/pdspike`.
- **E11** — 2026-11-09, the recorded substrate runs (pi-durable 1.5.0): clean
  lane `phases 3`, `reexecuted []`; `--kill-after 1` attempt exit **137**, then
  `resumed true`, `phases 3`, `reexecuted []`; `--kill-during stage-2` attempt
  exit **137**, then `resumed true`, `phases 4`,
  `per_stage {stage-1: 1, stage-2: 2, stage-3: 1}`.
- **G5** — 2026-11-09, HEAD 2b6059eb · `bun scripts/local-gate.mjs --skip-network --push-base
  1fa39fe1` · exit 0 · `local-gate: PASS — 13 step(s)`; the same hook run gated
  the push, and PR [#485](https://github.com/gtrabanco/agentic-workflow/pull/485)
  is open against `main`.
- **G1** — 2026-11-09, HEAD 9c40e590 · `bun scripts/version-parity-gate.mjs
  --content --base 1fa39fe1` · exit 0 · `changeset-intent` route,
  `VERDICT: PASS`.
- **G2** — 2026-11-09, HEAD 9c40e590 · `bun scripts/phase-lint.mjs
  docs/fix/284-unattended-durability/SPEC.md` · exit 0 · `verdict PASS` (12/12
  phases); `bun scripts/docs-generate.mjs --check` · exit 0 · no drift after the
  regeneration.
- **G3** — 2026-11-09, HEAD 9c40e590 · `bun scripts/run-root-suite.mjs` · 94
  PASS / 2 FAIL · both failing files fail at the base commit too
  (`ceremony-workspace`: one case; `local-gate`: `journal-carrier-check`). Run
  with `NODE_OPTIONS=--experimental-strip-types` because the installed node
  (22.11) cannot import the repo's `.ts` vocabularies without it.
- **G4** — 2026-11-09, HEAD 9c40e590 · `bun run test` in
  `packages/pi-agentic-workflow` · 746 pass / 2 fail · the two pre-existing
  `workflow-tools` live cases from E8.

## Next

Push the branch and open the PR (`Closes #284`), then hand the diff to the
external verifier: P1 and the P2 spike are green, the verdict is `REJECT`
(defer) with its flip conditions, and the two environmental failures are
disclosed.

## References

- Issue [#284](https://github.com/gtrabanco/agentic-workflow/issues/284) — P1 of
  this document; P2 stays open on the issue.
- Roadmap row 81 (`unattended-durability`), fix row #284.
- Feature 62 (`docs/features/62-pi-native-conductor/`) — the loop this unit
  makes recoverable.
- Features 03/38 — the `crash_recovery` verdict this unit reads.

## Branch

`feat-284-unattended-durability`

## Depends on

none

## Regression scope

| Scenario | Verifies it |
|---|---|
| A plain `advance` run (no `--resume`, no interrupted journal) logs exactly one `invoke`/`sense`/`stop` row per iteration and still stops on the same codes | `conductor-loop.test.mjs` (all cases) |
| The one-stage default (`maxInvokes: 1`) still returns `ADVANCE: CONTINUE` after one invocation | `conductor-loop.test.mjs` AC10 cases |
| The sensor's refusal, COMPLETE and BLOCKED banners are unchanged | `conductor-loop.test.mjs` AC8/AC3 cases |
| `DEFAULT_CONDUCTOR_CONFIG` and its loop alias stay one frozen object | `conductor-config-single-source.test.mjs` |
| No new dependency appears in the package manifest | `bun scripts/version-parity-gate.mjs --pins` and `test/lockfile-policy.test.mjs` |
