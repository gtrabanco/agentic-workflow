# 60 — path-protection-guards

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> **One SPEC, two halves.** `design-feature` wrote the **Product half**
> (product definition, capability closure, acceptance criteria) and stamps
> `## Design status`. `plan-feature` refuses to plan a feature not marked
> `designed`, then writes the **Engineering half** (architecture, design,
> phases, testing). Never split this into a separate design document —
> one file, two owners, no drift.

## Goal

Move the repo's "never change a test to pass it" rule from prose to a
deterministic, shipped-default path-protection guard so an agent model cannot
weaken or rewrite expected-behaviour tests — or the guard policy itself —
outside the phase's declared policy. Tests are authored first, exactly as the
plan declares them; once the declared test set is complete they freeze, and
from the freeze point onward modifying or deleting a frozen test requires an
explicit justification plus, after freeze, a recorded owner approval. The
policy ships as defaults (zero config to get expected behaviour) and stays
owner-configurable per project; nothing project-specific is hardcoded in
skills.

## Branch

`feat/60-path-protection-guards`

## Size

`M` — a new deterministic gate subcommand, a pi-package extension guard, a
shipped policy default, and wording/tests across the touched skills and the
template. Phased work: the full artifact set (`PLAN.md`, `TASKS.md`, …) is
generated and execution goes phase by phase.

## Dependencies

Hard: feature 37 (`phase-lint-script`, PR #212) — the phase fingerprint and
the plan-grammar parser the gate hooks into. Merged; verified 2026-09-17
(roadmap row 37 `done`; `scripts/phase-lint.mjs` present at HEAD).
Soft: feature 42 (`deterministic-review-change`, `idea`) — the Tier 1 gate's
diff-vs-policy output is a future review-surface input, but nothing here
depends on it landing first. Parallel-safe with review-side features
(issue #220 `Depends on` section).

---

## Product half

Written by `design-feature` 2026-09-17. Complete: `## Design status` below
reads `designed`; `plan-feature` may plan this feature.

### Context

The repo's working rules state "never change a test to pass it" and "do tests
before implementation" (`CLAUDE.md`), but both are prompt-level prohibitions:
advisory text a weak or pressured model can still violate silently. Feature 20
already shipped the same move for two other prohibitions — secret disclosure
and direct merges — as a deterministic guard pack
(`template/.agentic-workflow/hooks/`, feature 20 SPEC); issue #220 extends
that family to test files. Today nothing in the runtime detects that a phase
rewrote a frozen test, deleted an edge-case suite, or edited the guard policy
itself; such a change surfaces only in review, after the damage.

The gap: an executing model can commit a change to `tests/**`, `e2e/**`,
`*.test.*`, or `fixtures/**` at any phase, with no constraint other than the
prompt, and the only record is the diff itself. This feature adds the
missing deterministic constraint: protected paths are guarded by shipped
defaults, the test set is planned and justified up front, and test
modifications after freeze carry an auditable justification and owner
approval.

### Business goals

- Make the test-immutability rule fail deterministically at the agent boundary
  instead of only in review — the same cost-reduction the feature 20 family
  delivered for secrets and merges.
- Keep the zero-config promise: defaults ship so the guard behaves as expected
  in a fresh project without any configuration; owners can extend or tighten.
- Preserve the TDD ordering the repo mandates: tests are written first,
  exactly as the plan declares them, and become the frozen expected behaviour
  the implementation must satisfy.
- Keep every escape auditable and never silent: a justified test change leaves
  a durable record the gate verifies; an unjustified one fails the gate.

### Scope

#### In scope

1. **Shipped-default policy** — a protected-path policy (default glob set ×
   phase-policy matrix) shipped in `template/` and read from a repo doc-config
   location beside the feature 20 hooks; the owner may extend or tighten per
   project; skills carry no project-specific globs.
2. **Tier 1 — portable gate (any host)** — a deterministic gate (producer
   crate subcommand) run at phase checkpoints: `git diff` changed paths against
   the effective policy; a protected-path change without its justification
   record is a workflow finding and a gate fail with a closed reason.
3. **Tier 2 — preventive (pi)** — a pi-package extension that blocks edit/write
   tool calls targeting protected paths outside the current phase policy via
   the `tool_call` blocking contract; other hosts get Tier 1 only.
4. **Escape hatch (never silent)** — a justified change carries an explicit
   justification record; after the declared test freeze point, modify/delete
   additionally requires a recorded owner approval (ask-first; no auto-approval
   path exists).
5. **Plan-declared test set** — the plan declares which tests are needed
   (every test created, not created, or ignored carries a justification;
   docs-only work justifies no tests) and declares the freeze point where the
   declared test set is complete.
6. **Config degradation reporting** — absent or malformed config falls back to
   the shipped defaults and reports the fallback; the guard never silently
   disappears.

#### Out of scope / non-goals

- **No silent auto-approval** — an approval is always recorded and owner-made
  (issue #220 non-goals).
- **No hardcoded project globs in skills** — the policy is data, shipped as
  defaults; skills reference the mechanism, never a project's paths.
- **Tier 1 not pi-locked** — the gate runs on any host; only Tier 2 prevention
  is pi-only.
- **No policing of test *content*** — whether a test is *good* stays with
  `review-code` / `review-verify`; this feature guards the *authorization to
  modify* protected paths only.
- **No lockfile/dependency protection** — package-lock-style files are not a
  protected class in this unit.
- **No test deletions as a separate class** — a delete follows the same
  modify/delete policy row as an edit; no third class is introduced.
- **No forge-side enforcement** — no branch protection, PR checks, or
  CODEOWNERS automation ships here (that is the owner's platform config).
- **No weakening of feature 20's guard pack** — its command-guard and
  fullauto-merge behaviour is unchanged; this feature adds a sibling guard.

### Capability closure

Derived subsystem inventory — `docs/CAPABILITIES.md` is unseeded in this repo,
so the inventory is derived from the architecture docs and codebase and
recorded here (offer: seed `docs/CAPABILITIES.md` from the template):

`guard hooks (template/.agentic-workflow/hooks)` · `deterministic scripts /
producer crate (scripts/, packages/agentic-workflow)` · `pi package
extension (packages/pi-agentic-workflow)` · `execution checkpoints
(skills/execute-phase preflight + phase fingerprint)` · `turn contract /
machine envelope` · `decisions ledger (human-owner:ratified-verdicts column set)` ·
`init-workspace install/upgrade path` · `template/docs scaffold` ·
`discipline tests (scripts/*.test.mjs)` · `workflow-status sensor` ·
`forge/GitHub integration` · `roadmap/status machine`.

**1. Entity closure** — entities this feature introduces/touches, with their
capabilities and roles:

Entity **Path Protection Policy** (config artifact shipped as defaults):

- Create — UI entry point: none (no UI surface) · API: gate subcommand and
  pi extension read the effective policy; owner creates project config by
  copying the shipped default · test: policy-matrix fixture loads shipped
  defaults and an owner-extended config
- Read/list — UI: gate output at phase checkpoints names the effective policy
  · API: `--policy` read by the gate; pi extension loads it at startup ·
  test: policy-matrix fixtures
- Update — UI: owner edits the project config file · API: agent runtime is
  denied (policy updates are owner-made) · test: matrix fixture proving an
  agent-side policy edit is treated as a protected change
- Delete — UI: owner removes project overrides, falling back to shipped
  defaults · API: gate falls back to defaults · test: fallback fixture
- State transitions: active → degraded (defaults substituted on absent/
  malformed config, fallback reported) — UI: degradation line in gate output ·
  API: gate exit carries the degradation code · test: config-failure fixture

Entity **Justification & approval record** (durable, append-only):

- Create — UI entry point: none · API: the executing agent appends the
  justification when a protected change is intended (a phase-decision row,
  `execute-phase:phase-decisions`); the owner appends the approval row after
  freeze, asked first (`human-owner:ratified-verdicts`) — both are append-only
  rows of the unit's `decisions.md` ledger (the `ledger-ownership@1`
  `decisions` row) · test: marker fixture
- Read/list — UI: none · API: gate verifies records against the changed paths
  at the checkpoint · test: Tier 1 pass case with recorded approval
- Update — n/a: records are append-only; a superseded approval is a new row
  (owner-owned correction), never an edit
- Delete — n/a: never deleted; evidence survives the unit
- State transitions: proposed → approved (owner, post-freeze) or void
  (unmatched record fails the gate) — UI: none · API: gate verdict rows ·
  test: void-record fixture

Entity **Guard verdict** (ephemeral, per checkpoint):

- Create — UI entry point: none · API: produced by the Tier 1 gate at each
  phase checkpoint · test: gate fixtures (fail/pass)
- Read/list — UI: gate stdout lines at the checkpoint · API: preflight and
  turn-contract receipt quote the verdict · test: preflight wiring test
- Update/Delete — n/a: recomputed at every checkpoint; receipts quote, never
  mutate

**2. Integration closure** — one row per derived inventory subsystem:

- Guard hooks (`template/.agentic-workflow/hooks`) — the path policy ships as
  a sibling default beside `guard-command.sh`; the hooks README documents the
  new guard; platform adapters normalize edits into the same policy ·
  test: template mirror test
- Deterministic scripts / producer crate — Tier 1 gate lands as a
  `packages/agentic-workflow` subcommand (producer-vehicle rule, roadmap row
  43); `git diff` changed paths parsed, not re-derived by the model ·
  test: crate gate fixtures
- pi package extension — new `tool_call` blocking guard in
  `packages/pi-agentic-workflow` for edit/write tools against protected
  paths; settings may only tighten the shipped defaults, never loosen ·
  test: extension unit test
- Execution checkpoints (`skills/execute-phase`) — the Tier 1 gate runs at the
  phase fingerprint checkpoint inside the preflight; a fail blocks the phase ·
  test: preflight wiring test
- Turn contract / machine envelope — wording gains the justification marker
  as the place a protected change is declared at a checkpoint · test:
  grammar test covers the marker line
- Decisions ledger (`docs/features/<NN>-<slug>/decisions.md`, the
  `ledger-ownership@1` `decisions` row) — owner approvals and justifications
  are recorded as append-only rows under its already-declared
  `human-owner:ratified-verdicts` (owner) and `execute-phase:phase-decisions`
  (agent) column sets, which the gate verifies · test: ledger-record fixture
- `init-workspace` — install and upgrade modes seed the shipped policy
  defaults and offer the platform adapters additively · test: seeding
  acceptance
- `template/` docs scaffold — policy defaults and their doc page mirror into
  new installs · test: template mirror test
- Discipline tests — new `scripts/*.test.mjs` freezes the closed reason codes
  and matrix semantics (tests are authored first, per the repo rule) ·
  test: the discipline tests themselves
- Workflow-status sensor — n/a: the gate is phase-local; the sensor's
  envelope is untouched in this unit
- Forge/GitHub integration — n/a: no PR-side enforcement ships (out of
  scope); the gate's findings are quoted in the existing flow
- Roadmap/status machine — the roadmap row and statuses are maintained by the
  standard workflow; no new state is introduced

**3. Role matrix** — derived roles, every capability decided (no role
unlisted). Capabilities: policy administration, justified protected-path
change, unjustified protected-path change, viewing guard verdicts.

| Role | Policy administration | Justified protected change | Unjustified protected change | View guard verdicts |
|---|---|---|---|---|
| Human owner / maintainer | allowed | allowed (with recorded approval post-freeze) | denied | allowed |
| Agent model (executor) | denied (policy edits are protected changes) | allowed with justification marker, approval required post-freeze | denied (gate fail / tool-call block) | allowed |
| Reviewer agent (clean context) | denied | denied (reviews, never authorizes) | denied | allowed |
| Orchestrator / driver (unattended) | denied | denied (no approval authority exists) | denied | allowed |
| pi host runtime (extension host) | denied | enforces only (blocks/permits per policy) | blocks | allowed |

For each capability, the role matrix above is the single authority source: no
other role exists in the derived inventory, and "unattended auto-approval" is
structurally absent — the orchestrator role has no approval capability
anywhere.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | The gate runs at every phase checkpoint, not only test phases | in-scope | AC2 checks the checkpoint wiring; In scope 2 |
| 2 | Creating a new test file pre-freeze needs no marker (TDD authoring) | in-scope | AC6 (creation ≠ modification); In scope 5 |
| 3 | Deleting a frozen test counts as a modify/delete protected change | in-scope | AC6 matrix row; Out of scope "no separate delete class" |
| 4 | A rename is one delete plus one create (both matrix rows apply) | in-scope | AC1 matrix includes rename coverage |
| 5 | Config absent → shipped defaults still protect | in-scope | AC3; In scope 6 |
| 6 | Config malformed → defaults apply and the fallback is reported | in-scope | AC3; In scope 6 |
| 7 | Owner approval is asked first, never auto-granted | in-scope | AC5; Role matrix (orchestrator denied) |
| 8 | The guard blocks writes, never reads, of test files | in-scope | AC4 (edit/write tools only) |
| 9 | Post-freeze, a marker alone is insufficient — approval required | in-scope | AC5; In scope 4 |
| 10 | Docs-only work needs no tests; the plan records the justification | in-scope | In scope 5 (per-test justification incl. none) |
| 11 | The block reason names the escape path instead of a bare denial | in-scope | AC4 reason text; AC2 closed reasons |
| 12 | Fixtures get the same protection as tests | in-scope | AC1 default glob set |
| 13 | A shell redirect (`echo > tests/x`) is caught like a tool edit | in-scope | AC2 (Tier 1 diffs, write-path-agnostic) |
| 14 | Skills stay project-agnostic (no project globs inline) | in-scope | AC7 grep gate; Out of scope |
| 15 | The shipped defaults can be tightened but never silently loosened | in-scope | AC10 (tighten-only pi override) + AC3 (fallback); In scope 1 |

### Acceptance criteria

1. **AC1 — Policy matrix fixtures:** `node --test packages/agentic-workflow`
   (gate test file) exits 0 over the phase × path-class matrix, including
   create/modify/delete/rename rows for `tests/**`, `e2e/**`, `*.test.*`,
   `fixtures/**`, and the policy config itself.
2. **AC2 — Tier 1 gate:** on a dirty protected path without a justification
   record, the gate subcommand exits non-zero and prints a closed reason;
   with a justification (and, post-freeze, a recorded approval) it exits 0 and
   the approval is verified against the changed paths. Frozen as
   `scripts/*.test.mjs` discipline tests.
3. **AC3 — Config fallback:** with the config absent or malformed, the gate
   applies the shipped defaults and emits a degradation report; zero-config
   behaviour is asserted by a fixture with no project config present.
4. **AC4 — Tier 2 prevention:** the pi extension unit test proves an
   edit/write tool call against a frozen test file returns
   `{ block: true, reason }`, the reason naming the escape path; read-only
   tool calls are unaffected.
5. **AC5 — Escape hatch:** a post-freeze protected change with a justification
   but no recorded owner approval fails the gate; adding the recorded approval
   makes the identical diff pass. No code path grants approval automatically
   (asserted by the negative case in the gate tests).
6. **AC6 — Creation ≠ modification:** matrix fixtures prove pre-freeze test
   authoring (create) passes without a marker while modify/delete of already
   committed test files requires one.
7. **AC7 — No hardcoded project globs:** `grep -nE 'tests/\*\*|e2e/\*\*'`
   over `skills/` returns no project-specific policy data inline; skills
   reference the policy mechanism only.
8. **AC8 — Checkpoint wiring:** the `execute-phase` preflight test proves the
   Tier 1 gate runs at the phase fingerprint checkpoint and a gate fail blocks
   the phase (read-verified for prose wiring, command-verified for the gate
   itself via AC2).
9. **AC9 — Template mirror:** the shipped policy default and its doc page
   exist under `template/.agentic-workflow/` and the hooks README documents
   the guard (grep-verified).
10. **AC10 — Tighten-only pi override:** the `packages/pi-agentic-workflow`
    extension unit test proves the effective policy is the shipped defaults
    **intersected** with any pi settings override: a tightening override (an
    added protected glob, or a phase made stricter) is honored, while a
    loosening override (removing a shipped protected glob, or relaxing a
    phase) is rejected — the shipped protection stays in force and the
    rejected loosening emits the degradation report, so the defaults can never
    be silently loosened.

### Tooling

- `packages/agentic-workflow` producer crate — Tier 1 gate subcommand + node
  test runner for the discipline tests.
- `packages/pi-agentic-workflow` — Tier 2 extension guard (existing extension
  factory; `tool_call` blocking contract, pi docs verified 2026-09-17).
- `template/.agentic-workflow/hooks` — shipped policy defaults and platform
  adapters (feature 20 family, extended).
- `gh` — issue #220 traceability only (PR closes the issue at merge).

### Product decisions

| Decision | Chosen option | Rationale |
|---|---|---|
| D1 — Tests freeze definition | The plan declares which tests are needed (each test justified: done, not done, or ignored); the plan's test-authoring phases come first; the freeze point is where the declared test set is complete, and from it the policy tightens | User decision 2026-09-17. Deterministic: the freeze point is a plan-declared fact, not an inferred one — the same plan grammar feature 37 already parses. A test bug is fixable, but tests are the expected behaviour and cannot be rewritten to finish early without a justification. |
| D2 — Policy location | Doc-config canonical in the target repo (`.agentic-workflow/` convention, beside the feature 20 hooks, shipped via `template/`); pi settings may only tighten; the Tier 1 gate reads the doc config | User decision 2026-09-17 ("both"). Doc config keeps the zero-config promise portable across hosts; a tighten-only pi override cannot silently weaken the owner's policy. |
| D3 — Absent/malformed config | Fall back to the shipped defaults and report the fallback; never fail open, never fail everything shut | User decision 2026-09-17 ("provide default values") + issue #220's never-silent rule. Defaults exist precisely so a missing file degrades to expected behaviour; the report keeps the degradation visible. |
| D4 — Default protected set | `tests/**`, `e2e/**`, `*.test.*`, `fixtures/**`, plus the policy config itself; creation ≠ modification; the policy config is protected at all times | Issue #220 default globs (confirmed 2026-09-17) + the bypass close-out: the guard that can edit its own policy is no guard. |
| D5 — Approval recording | Append-only justification/approval rows in the unit's `decisions.md` ledger (the `ledger-ownership@1` `decisions` row) — the agent's justification under `execute-phase:phase-decisions`, the owner's approval under `human-owner:ratified-verdicts` — which the gate verifies | User decision 2026-09-17 ("ledger"), surface corrected 2026-09-18 (SPEC60-F1, user instruction: "move D5's approval record off finding-mark@1 onto a ledger-sanctioned column set/writer"). The `review-findings` `finding-mark@1` row has the single writer `review-change` and no owner-approval column, so a sanctioned column set of the `decisions` ledger hosts the record instead. Append-only records survive the unit, are machine-checkable against the diff, and reuse an existing ledger instead of inventing a parallel surface. |
| D6 — Tier 1 producer home | Crate subcommand (`packages/agentic-workflow`), producer-vehicle rule | Roadmap rows 37/43: producers land as subcommands of the existing crate; no new package. |
| D7 — Architectural invariants | `n/a: no project invariants declared` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` absent; NRS F010) | Standard classification record; workflow-level invariants (`docs/workflow/WORKFLOW_INVARIANTS.md`) are unaffected — this feature preserves them. |

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Exact closed reason-code vocabulary and justification-marker syntax | Engineering half owns the grammar the gate parses and phase-lint already reads; product only requires closed, machine-checkable values | `plan-feature` — cut into the gate design (P1) |
| Whether `review-change`'s diff scope consumes the gate's changed-path list | Feature 42 is `idea`; wiring the review surface now would couple this unit to an unplanned one | Revisit when feature 42 enters planning (roadmap trigger) |

### Spec-lint (mechanical — presence checks only)

Product boxes (run by `design-feature` before stamping `designed`):

- [x] No template placeholders left in the product half (grep clean).
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet (8 bullets).
- [x] Every Capability closure row is filled or explicitly n/a — zero blank
      rows.
- [x] Integration closure has one row per subsystem in the derived inventory
      (recorded above; `docs/CAPABILITIES.md` unseeded) — zero skipped.
- [x] Every capability's role matrix lists every derived role with an explicit
      value — no role unlisted.
- [x] `### Expectation sweep` has ≥ 10 resolved rows (15 rows), every row
      `in-scope` / `out-of-scope` / `deferred` with a pointer.
- [x] Every In-scope bullet maps to ≥ 1 Acceptance criterion (items
      1→AC1/AC3/AC9/AC10, 2→AC2, 3→AC4/AC10, 4→AC5, 5→AC1/AC6, 6→AC3; plus
      AC7/AC8 from the closure).
- [x] Every Acceptance criterion is a runnable command or labelled
      `read-verified` (AC8's prose clause is labelled).
- [x] `### Deferred decisions` exists; both rows have decide-by triggers.

## Design status

`designed` — capability closure complete (2026-09-17); every closure row is
filled or explicitly `n/a`. Review batch SPEC60-F1…F3 (spec-review-fail,
2026-09-18) repaired 2026-09-18 — three `product`-class findings, one batch:
F1 moved the owner-approval record onto the `decisions` ledger's sanctioned
`human-owner:ratified-verdicts` / `execute-phase:phase-decisions` column sets,
F2 normalized the product evidence rows to the closed `authority-kind` /
`freshness` vocabularies, F3 froze AC10 for the tighten-only pi override. No
scope, role, authority, or user-outcome change beyond the corrected approval
surface (user-directed; `decisions.md` D-60-14). Readiness re-run for
re-review by `review-spec`.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product
half above is marked `designed`.

### Technical goals

### Architecture impact

### Design

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|

### Decisions to confirm

### Testing requirements

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|

### Phases

### Deploy & rollback

Merging is expected to be enough; state otherwise when planning.

### Open questions / risks

### Deliverables

### Post-merge next feature
