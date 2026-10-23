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

Build executed in-session per the owner's no-ceremony directive (D3): tests
red-first, then the module, then the live run. Phases are not cut — no
`execute-phase` hand-offs are planned for this unit.

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

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | `node --test scripts/unit-cycle.test.mjs` | 0 · 34 pass / 0 fail | decide transitions (needs-input before any act, catalog order, fold budget, audit-blocked), prompt grammar, sensing helpers and the runner's terminal states all green | main agent |
| AC1 | `node --test scripts/*.test.mjs` (whole root suite, branch `feat/78-unit-cycle` at `4b71e7d3`) | 0 · 809 pass / 0 fail | the loop's suite joins the root suite without disturbing any existing gate | main agent |
| AC5 | `node scripts/unit-cycle.mjs 67-serena-provisioning --dry-run` (before commit — tree dirty) | 0 | `branch … (dirty) · receipt: absent · phases: 6/6 · questions: 0` · `next: stop — failed (dirty-tree)` — senses the real unit, decides, spawns nothing | main agent |
| AC3 | exit-code table enforced by `decide`/`runCycle` cases in the suite (done, needs-input, budget-exhausted, no-progress, failed) | 0 | one case per terminal outcome, incl. act-throws → `failed` with the step named | main agent |
| AC2/AC3 | live run 3 — `node scripts/unit-cycle.mjs 67-serena-provisioning --repo /home/agent/projects/agentic-workflow-cycle67` | 2 | acts `tests → review → audit`; review's write-then-report order held (receipt **current** at `16420012`, `verify --pr 313` exit 0); terminal `needs-input — audit-blocked` naming the single CI blocker | main agent |
| AC2 | live run 1 (fresh worktree) | 5 | `tests: root suite red` — surfaced the gitignored `schema/dist` missing in a fresh checkout (not an assertion); the `tests` step now builds it when absent | main agent |
| AC3 | live run 2 | 5 | `review-no-receipt` — review sessions had emitted the receipt before their last commit; the act prompt pinned `write-then-report` (persist+push → receipt last), run 3 converged | main agent |
| AC2 | audit verdict from the live run | BLOCKED | full gate table: receipt current · hygiene · lineage · phases · scope · docs · traceability · mergeability · invariants all pass · **1 blocker: `dependency-pin-gate` (pre-existing pin drift — human-owned `fix(deps)` decision)** | main agent |

## Progress log

`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

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

## Next

Human decision first (audit-blocked on PR #313: bump the two drifted pins —
`fix(deps)` branch vs in-PR), then re-run
`node scripts/unit-cycle.mjs 67-serena-provisioning --repo <67-worktree>`.
For this PR: `/review-change 78-unit-cycle` (receipt for #314), then
`/audit-pr`.

## References

- PR: https://github.com/gtrabanco/agentic-workflow/pull/314
- Branch: `feat/78-unit-cycle`
- Commit: `4b71e7d3` (release bookkeeping follows on the same branch)
- Owner directives, session 2026-10-23 (loop-as-code; root script; both units
  in-session without lane ceremony).
- `docs/features/22-bounded-delivery-loops/SPEC.md` — the original machine-loop
  definition (budget D6, no-progress, terminal states).
- `docs/features/61-adaptive-unit-lane/SPEC.md` — what absorbed and then lost it.
- `scripts/needs-input.mjs`, `scripts/review-receipt.mjs`,
  `scripts/audit-pr-gate.mjs`, `scripts/unit-doc-phases.mjs` — sensing
  primitives the loop reuses.
