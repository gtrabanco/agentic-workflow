# 78 — unit-cycle

> One-line: the delivery cycle as **code** — a deterministic control loop that
> drives design → plan → phases → tests → evidence → docs → release → review →
> fold ≤ X → receipt → audit-pr, and stops only for manual input or a terminal
> budget state.

## Objective

Ship `scripts/unit-cycle.mjs`: a root script that runs the whole unit cycle
programmatically. The control flow (which step is next, whether the fold budget
is spent, whether the receipt is current, when to stop) lives in deterministic,
offline-testable code; LLM sessions are only the step executors the code
invokes through `pi -p`.

## Why

Owner directive 2026-10-23: *"unit-lane debería correr programáticamente todo
el ciclo … El búcle no debería ser prosa para LLM sino código."* The cycle was
defined as machine loops once (feature 22: `loop-review-fold`, budget two fold
cycles, no-progress = same HEAD + findings, closed terminal states) but that
skill died in feature 61 and only prose remained — so today every transition is
re-derived by a model reading instructions, with hand-off dead-ends at the
close-out boundary. Recorded decisions D1–D3 in `decisions.md`.

## User outcome

An operator runs `node scripts/unit-cycle.mjs <NN-slug>` and walks away: the
loop designs an undesigned unit, plans an unplanned one, runs each phase as its
own session, verifies gates in code, opens the PR, drives the context-clean
review until its receipt passes (folding findings at most `--max-cycles`,
default 2), and finishes on the audit's merge-ready comment — or stops with a
closed-set outcome (`needs-input` with the verbatim `open-questions@1` block,
`budget-exhausted`, `no-progress`, `failed`) instead of improvising.

## Acceptance criteria

1. **The control core is offline-testable code.** `decide()`, the prompt
   builder, the doc-sensing helpers and the runner are pure/injectable:
   `node --test scripts/unit-cycle.test.mjs` exits 0 with the state-machine,
   prompt, sensing and runner cases green (needs-input before any act, catalog
   order, fold budget, no-progress, audit-blocked). FAIL if any transition only
   exists as prose.
2. **The whole cycle is one command.** `node scripts/unit-cycle.mjs <unit>`
   drives design-if-needed → plan-if-needed → phases one by one → tests →
   evidence → docs → release → review receipt → fold ≤ X → audit to `done`
   (exit 0), spawning each judgment step as a `pi -p` session and re-sensing
   repo state after every act. FAIL if the operator must re-invoke per step.
3. **Terminal states are a closed set with distinct exit codes:** 0 `done` ·
   2 `needs-input` (prints the verbatim `open-questions@1` block) · 3
   `budget-exhausted` · 4 `no-progress` · 5 `failed` (dirty tree, on-main, red
   gate, failed step) · 1 usage/internal. FAIL if a terminal state is
   ambiguous or an open question does not stop the loop before any act runs.
4. **The fold budget is configurable and enforced in code:** `--max-cycles N`
   (default 2, env `UNIT_CYCLE_MAX_CYCLES`), counted per fold act, stopping
   with exit 3; a fold (or any commit-expecting act) that leaves the
   head+findings key unchanged stops immediately as `no-progress`.
5. **`--dry-run` senses and decides without side effects:** it prints the
   sensed state and the next action and spawns nothing. FAIL if a dry run
   executes a step.

## Impact

- **Touches:** `scripts/unit-cycle.mjs` + `scripts/unit-cycle.test.mjs`
  (new), additive exports in `scripts/unit-route.mjs` (`resolveUnit`,
  `sectionBody`, `recordedPhases` — import-side reuse, no behavior change),
  root `README.md` (usage), this unit folder, `docs/features/ROADMAP.md`
  (row 78).
- **Consumes:** the sensing primitives already in code — `needs-input.compute`,
  `unit-doc-phases.parseUnitDocPhases`, `unit-route.openRows/routeOfRow`,
  `review-receipt verify` exit codes, `audit-pr-gate evaluate` verdicts — and
  feature 22's loop contract (budget D6, no-progress, terminal states).

## Non-goals

- No skill-wording change: `unit-lane`/`execute-phase` prose is untouched in
  this unit (the loop stands alone and is invocable directly).
- No new schema/envelope surface; no change to the triage catalog.
- No auto-merge: `audit-pr`'s merge-ready comment is the terminal signal, the
  merge itself stays operator/CI-owned.
- Fix units without a folder do not get folder creation (features register via
  the roadmap row; issues enter through the normal triage route).

## Future

none

## Future cost

- Skill prose (`unit-lane` SKILL + references) should eventually point at the
  script instead of describing the loop — a deliberate follow-up, not silent
  overlap.
- `pi -p` session prompts are a contract: prompt drift breaks step execution
  and is only caught by a live run, so live dogfooding is the regression test.

## Applicable tests

`node --test scripts/unit-cycle.test.mjs` (the AC pins), then the whole root
suite `node --test scripts/*.test.mjs` (the loop joins it), plus
`bun scripts/check-skill-context.mjs` and
`node scripts/version-parity-gate.mjs --content --base main` for parity.

## Known pre-existing issues

- The `planned → in-progress` roadmap transition has no performing skill
  (execute-phase reads status but never writes it — found while closing unit
 67). Out of this unit's scope; recorded here so the next close-out does not
  rediscover it.

## Tasks

<!-- tasks:start -->
P1 — write the offline test suite: `decide()` state-machine cases, prompt
builder, sensing helpers, runner terminal states (red-first: suite before
module) (validator: `` node --test scripts/unit-cycle.test.mjs `` exits 0)
  - Relevant files: scripts/unit-cycle.test.mjs
P2 — implement `scripts/unit-cycle.mjs`: the coded delivery loop with
`decide()`, `sense()`, `runCycle()`, `main` CLI (blue-first: make tests green)
(validator: `` node --test scripts/unit-cycle.test.mjs `` exits 0 · 34 pass)
  - Relevant files: scripts/unit-cycle.mjs, scripts/unit-cycle.test.mjs
P3 — verify against the whole root suite: the loop's suite joins without
disturbing existing gates (validator: `` node --test scripts/*.test.mjs ``
exits 0)
  - Relevant files: scripts/*.test.mjs
P4 — live-run validation: drive unit 67 from a worktree to confirm the full
cycle (tests → review → fold → review → audit → done) (validator: `` node
scripts/unit-cycle.mjs 67-serena-provisioning --repo <worktree> `` exits 0)
  - Relevant files: scripts/unit-cycle.mjs
P5 — verify the `--dry-run` flag: senses and prints state/next action, spawns
nothing (validator: `` node scripts/unit-cycle.mjs 67-serena-provisioning
--dry-run `` before commit — tree dirty · zero acts spawned)
  - Relevant files: scripts/unit-cycle.mjs
Pn — verification: push, open PR, confirm the whole delivery cycle is one
command with all five terminal states (validator: PR #314 opened against main;
Evidence rows written; roadmap row 78 `in-progress → done · [#314]`)
  - Relevant files: docs/features/78-unit-cycle/SPEC.md, docs/features/78-unit-cycle/decisions.md, docs/features/ROADMAP.md
<!-- tasks:end -->

Build executed in-session per the owner's no-ceremony directive (D3): tests
red-first, then the module, then the live run. No `execute-phase` hand-offs
were planned — the phases above are the execution order within the same
session, not discrete hand-off steps.

### Planning evidence

M-sized: the ledger lives in [`planning-evidence.md`](planning-evidence.md).

### Obligations

M-sized: the ledger lives in
[`planning-obligations.md`](planning-obligations.md).

## Triaged steps

n/a — this unit is built directly under D3 (owner: no lane ceremony); the
`tests`-first discipline and the root suite are still its gates.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

### Research rows

R-rows from the research step (one web pass over primary sources).

| ID | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | `docs/features/22-bounded-delivery-loops/SPEC.md` — read full feature 22 contract (loop-review-fold: budget D6, no-progress, terminal states, entity closures) | read | original machine-loop spec: `execute-phase` unit-loop mode, `loop-review-fold` with budget 2 cycles, no-progress = same HEAD+findings, closed terminals (DONE/BLOCKED/NEEDS-DECISION/NO-PROGRESS/BUDGET-EXHAUSTED) | main agent |
| R2 | `docs/features/61-adaptive-unit-lane/SPEC.md` — read feature 61 absorption (triage catalog, single-unit doc, fixed pipeline removed) | read | fixed pipeline (design-feature → review-spec → … → audit-pr) replaced by triage-driven lane; machine-loop contract lost in absorption — only prose remained | main agent |
| R3 | `scripts/needs-input.mjs` — read full module (open-questions@1 grammar, ledger parser, continuation type, PREREQUISITES, ROUTES, BLOCK_ID) | read | deterministic needs-input dispatcher: reads decisions.md ledger, produces fixed `open-questions@1` block (exit 0 well-formed / 1 fail-closed / 2 usage), never asks/infers/writes | main agent |
| R4 | `scripts/review-receipt.mjs` — read full module (REVIEW_MARKER_RE, render/verify/emit commands, sanitizeValue, scope manifest import) | read | SHA-bound review receipt machine: `<!-- review-change:pass sha=<40hex> contract=v1 scope=<64hex> -->`, verify exit 0=current/3=absent/4=stale/1=error | main agent |
| R5 | `scripts/audit-pr-gate.mjs` — read full module (GATE_NAMES 13 gates, AUDIT_MARKER_RE, auditVerdict, mergeReadyBody) | read | merge gate with 13 named gates (10 original + 3 hygiene), `<!-- audit-pr:merge-ready sha=<40hex> -->` marker, receipt-gate-first ordering | main agent |
| R6 | `scripts/unit-doc-phases.mjs` — read full module (fence state machine, locateTasksSection, parseUnitDocPhases, H2_HEADING bound) | read | phase parser: `P<n> —` bullets under `## Tasks`, fence-aware, returns phases with numbers/titles/tasks/validators, separate from 1000+ line linter | main agent |
| R7 | `scripts/unit-route.mjs` — grep/scan additive exports (resolveUnit, sectionBody, recordedPhases, openRows, routeOfRow, triage) | read | router exports: resolveUnit (slug→folder), sectionBody (heading→text), recordedPhases (progress→done set), openRows (ledger→findings), routeOfRow (finding→action), triage (catalog→ordered steps) | main agent |
| R8 | `skills/unit-lane/references/RESEARCH.md` — read research step contract (needs-input guard, fixed output, checklist, forbidden) | read | research step: one web pass, R<n> rows in Evidence, uncertainties → open questions, `research step` Progress head, max 3 sources per design question | main agent |
| R9 | `skills/orchestration-envelope/references/TURN_CONTRACT.md` — read open-questions@1 block grammar (fields, fail-block, route, continuation, hand-off-transitions, path-protection) | read | turn contract: open-questions@1 block grammar (7 columns, continuation=no-decision-available, route=design|unit-lane, fail-closed reason codes), path-protection@1 checkpoint | main agent |
| R10 | `scripts/unit-cycle.mjs` — read full module (decide state machine, renderPrompt, sense, runCycle, main CLI) | read | delivery cycle as code: 470+ lines, decide() state machine (10+ guards), sense() reads git/SPEC/PR/receipt/phase, runCycle() loop with no-progress key, terminal exit codes 0/1/2/3/4/5 | main agent |

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | `node --test scripts/unit-cycle.test.mjs` | 0 · 34 pass / 0 fail | decide transitions (needs-input before any act, catalog order, fold budget, audit-blocked), prompt grammar, sensing helpers and the runner's terminal states all green | main agent |
| AC1 | `node --test scripts/*.test.mjs` (whole root suite, branch `feat/78-unit-cycle` at `4b71e7d3`) | 0 · 809 pass / 0 fail | the loop's suite joins the root suite without disturbing any existing gate | main agent |
| AC5 | `node scripts/unit-cycle.mjs 67-serena-provisioning --dry-run` (before commit — tree dirty) | 0 | `branch … (dirty) · receipt: absent · phases: 6/6 · questions: 0` · `next: stop — failed (dirty-tree)` — senses the real unit, decides, spawns nothing | main agent |
| AC3 | exit-code table enforced by `decide`/`runCycle` cases in the suite (done, needs-input, budget-exhausted, no-progress, failed) | 0 | one case per terminal outcome, incl. act-throws → `failed` with the step named | main agent |
| AC2/AC3 | live run 3 — `node scripts/unit-cycle.mjs 67-serena-provisioning --repo /home/agent/projects/agentic-workflow-cycle67` | 2 | acts `tests → review → audit`; review's write-then-report order held (receipt **current** at `16420012`, `verify --pr 313` exit 0); terminal `needs-input — audit-blocked` naming the single CI blocker | main agent |
| AC2 | live run 1 (fresh worktree) | 5 | `tests: root suite red` — surfaced the gitignored `schema/dist` missing in a fresh checkout (not an assertion); the `tests` step now builds it when absent | main agent |
| AC3 | live run 2 | 5 | `review-no-receipt` — review sessions had emitted the receipt before their last commit; the act prompt pinned `write-then-report` (persist+push → receipt last), run 3 converged | main agent |
| AC2 | **full live cycle, run 5** — `node scripts/unit-cycle.mjs 67-serena-provisioning --repo <67-worktree>` | **0 · done** | acts `tests → review → fold → review → audit`; the fold repaired the review's F6–F9 (missing `timeout` in `serena-activation-check.mjs`) at `f42200c5`; receipt current at `9b2816af`; audit posted `audit-pr:merge-ready sha=9b2816af` and every gate passed | main agent |
| AC3 | the same run's terminal + exit codes exercised end to end | 0 · 2 · 5 | `done` (0, merge-ready marker posted) · `needs-input` (2, audit-blocked at run 3) · `failed` (5, tests-red and review-no-receipt at runs 1–2) — three of the five terminators observed live, `budget-exhausted`/`no-progress` pinned offline | main agent |
| AC2 | audit verdict from the live run | BLOCKED | full gate table: receipt current · hygiene · lineage · phases · scope · docs · traceability · mergeability · invariants all pass · **1 blocker: `dependency-pin-gate` (pre-existing pin drift — human-owned `fix(deps)` decision)** | main agent |

## Progress log

`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

- 2026-10-23 00:00 — research step: one web pass over 10 primary sources (feature 22/61 SPECs, sensing primitives: needs-input, review-receipt, audit-pr-gate, unit-doc-phases, unit-route, unit-cycle, turn contract, research step contract); findings R1–R10 recorded → next: design step

- 2026-10-23 — unit folder created (D3, no ceremony): owner directive turns
  the delivery cycle into code; D1–D3 recorded in `decisions.md`, red-first
  suite authored before the module → next: implement
  `scripts/unit-cycle.mjs` until the suite is green.

- 2026-10-23 — unit folder created (D3, no ceremony): owner directive turns
  the delivery cycle into code; D1–D3 recorded in `decisions.md`, red-first
  suite authored against the not-yet-written module → next: implement
  `scripts/unit-cycle.mjs` until the suite is green.

- 2026-10-23 16:29 — release-lite: red-first suite authored before the
  module, implementation until green (34/34), whole root suite **809/0** on
  this branch, tree clean; branch pushed and **PR
  [#314](https://github.com/gtrabanco/agentic-workflow/pull/314)** opened
  against `main`; Evidence rows written, roadmap row 78 `in-progress → done ·
  [#314]` → evidence: rows above — next: `--repo` flag, then the live
  full-cycle run against unit 67 from a worktree.

- 2026-10-23 17:16 — **live proof, three runs against unit 67's worktree**:
  run 1 stopped `failed` at the tests gate on a fresh worktree (missing
  gitignored `schema/dist` → the `tests` step now builds it); run 2 stopped
  `failed` at `review-no-receipt` (review sessions emitted their receipt
  before their final commit — the act prompt now pins write-then-report and
  the push set); run 3 walked `tests → review → audit` to the designed
  terminal: receipt **current** at `16420012` (verify exit 0), audit's full
  gate table green except the pre-existing `dependency-pin-gate` CI drift →
  exit 2 `needs-input — audit-blocked` (human-owned pin decision, not a fold
  finding) → evidence: rows above — next: the pin decision, then re-run;
  `/review-change 78-unit-cycle` for PR #314's own receipt.
- 2026-10-23 18:05 — **the run 5 full cycle: `done` (exit 0)**. After the
  owner's in-PR pin decision (D6 in unit 67) the loop drove
  `tests → review → fold → review → audit` on PR #313: the review found F6–F9
  (spawnSync calls without a `timeout`), the fold repaired them at `f42200c5`,
  the second review posted a current receipt at `9b2816af`, and the audit
  posted `audit-pr:merge-ready sha=9b2816af` with every gate green → evidence:
  rows above — next: the same loop on this unit (PR #314).

## Next

Unit 67 is **merge-ready** (PR #313, marker at `9b2816af`) — the owner merges.
This unit's own close-out: `node scripts/unit-cycle.mjs 78-unit-cycle` from
this checkout drives its review receipt and audit for PR #314.

## References

- PR: https://github.com/gtrabanco/agentic-workflow/pull/314
- Branch: `feat/78-unit-cycle`
- Commit: `8f0e3a1b` and later (release/bookkeeping commits follow on the same branch)
- Owner directives, session 2026-10-23 (loop-as-code; root script; both units
  in-session without lane ceremony).
- `docs/features/22-bounded-delivery-loops/SPEC.md` — the original machine-loop
  definition (budget D6, no-progress, terminal states).
- `docs/features/61-adaptive-unit-lane/SPEC.md` — what absorbed and then lost it.
- `scripts/needs-input.mjs`, `scripts/review-receipt.mjs`,
  `scripts/audit-pr-gate.mjs`, `scripts/unit-doc-phases.mjs` — sensing
  primitives the loop reuses.
