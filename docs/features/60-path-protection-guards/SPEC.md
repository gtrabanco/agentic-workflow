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

Written by `plan-feature` / `plan-feature-scaffold` after the Product-review
gate passed (receipt SPEC-REVIEW-60-2, snapshot `12121bff…1682e`). Product
bytes are untouched; the artifact revision of this plan set is `60-plan-1`
(initial cut by `plan-feature-scaffold` on 2026-09-18).

### Technical goals

- One deterministic policy, three consumers: a single `path-protection-policy@1`
  document is owned by the crate's policy module, shipped as a template seed, and
  read by the Tier 1 gate and the pi Tier 2 guard. No model decides what is
  protected (D-60-1).
- The freeze is a plan-declared fact, not an inference: the plan carries a
  `path-protection-plan@1` declaration (declared test set + `freeze-after` phase);
  the gate compares the current phase ordinal against it (D-60-2).
- Every escape is durable and owner-made: justifications and approvals are append-
  only rows in the unit's `decisions.md` ledger under the already-declared
  `execute-phase:phase-decisions` / `human-owner:ratified-verdicts` column sets;
  no code path grants an approval (D-60-3).
- Zero-config behaviour with visible degradation: absent or malformed config falls
  back to the shipped defaults and reports the fallback; it never fails open and
  never disappears (D-60-4).
- Preventive on pi, portable elsewhere: pi blocks the tool call before the write;
  every other host gets the Tier 1 checkpoint gate, exactly as the Product half
  scopes it (D-60-5).

### Architecture impact

Two layers are touched, both outer; no inner-layer rule is stressed:

- **config/infra** — `packages/agentic-workflow/` gains the policy module
  (`src/path-policy.mjs`), the gate CLI (`bin/path-guard.mjs`), and its engine
  suite; `scripts/path-protection.test.mjs` is the repo-root discipline suite.
  `packages/pi-agentic-workflow/src/config/` gains the strict `pathProtection`
  key + the tighten-only intersection, and `src/extension/index.ts:163-165` gains
  the `tool_call` registration beside the existing `model_select` /
  `thinking_level_select` / `agent_settled` handlers.
- **docs** — `template/.agentic-workflow/` gains the policy seed and its doc page;
  `skills/execute-phase/references/PREFLIGHT.md:154` gains the checkpoint step;
  `skills/pre-execution-review/references/POLICY.md:188` gains the rejection
  type; `skills/orchestration-envelope/references/TURN_CONTRACT.md:78` gains the
  grammar block; `CLAUDE.md:314` gains the normative-surface row; the plan
  templates and the scaffold/init-workspace references carry the declaration and
  seeding instructions.

The existing command-guard boundary is preserved: `guard-command.sh` keeps its
command-only policy (the normalized payload carries no write intent, so a
path check there would block reads too — D-60-6). Path enforcement is the Tier 1
gate plus the pi guard.

The gate is read-only over the repository (it spawns `git status`/`git diff` and
prints; it writes nothing), so the crate's scratch convention
(`.agentic-workflow/tmp/`, committed as a directory) is untouched.

Preflight (planning-preflight contract):

```text
Preflight: Stage 1 — NRS consumed · arch: deferred
Preflight: NRS consumed · invariant classification: n/a (no project invariants declared — REPOSITORY_STATE.md F010)
```

### Design

**Policy document (`path-protection-policy@1`).** One JSON document at
`.agentic-workflow/path-policy.json` in the target repository, shipped as the
template seed. Shape (all keys required; the reader fails closed on anything
else):

```json
{
  "schema": "path-protection-policy@1",
  "classes": {
    "tests":         { "globs": ["tests/**"], "freeze": true },
    "e2e":           { "globs": ["e2e/**"], "freeze": true },
    "test-file":     { "globs": ["**/*.test.*", "**/*.spec.*"], "freeze": true },
    "fixtures":      { "globs": ["fixtures/**", "**/fixtures/**"], "freeze": true },
    "policy-config": { "globs": [".agentic-workflow/path-policy.json"], "freeze": false }
  },
  "matrix": {
    "pre-freeze":  { "create": "none", "modify": "justification", "delete": "justification", "rename": "justification" },
    "post-freeze": { "create": "justification", "modify": "approval", "delete": "approval", "rename": "approval" },
    "always":      { "create": "approval", "modify": "approval", "delete": "approval", "rename": "approval" }
  }
}
```

`freeze: true` means the class resolves to `pre-freeze` or `post-freeze` from the
plan declaration; `freeze: false` means the class always resolves to the `always`
row (the policy config is protected at all times — D4). `requirement` ∈
`none | justification | approval`, strictly ordered `none < justification <
approval`. An override may only union globs and raise a requirement; a removal or
a lowering is ignored and reported (D-60-7).

**Effective-policy resolution.** `resolvePathPolicy(shipped, override)` returns
`{ classes, matrix, degradations }`: `classes[k].globs = shipped.globs ∪
override.globs`; `matrix[state][op] = max(shipped, override)`. Each ignored
removal/lowering appends one degradation record. The Tier 1 gate reads the doc
config as its override; the pi guard reads its settings as its override. Both
start from the same shipped-defaults module.

**Changed-path derivation (Tier 1 input).** The gate reads
`git status --porcelain=v1 -z --untracked-files=all` and maps each entry to
`(path, operation)`: `A` / `??` → `create`, `M` / `T` → `modify`, `D` → `delete`,
`R` → `rename` (expanded to the delete + create pair the Product half's
expectation 4 requires). With `--base <ref>` it additionally unions
`git diff --name-status --diff-filter=ACMRD <ref>` so a committed phase range can
be checked. Porcelain is the source for the working tree because a checkpoint
sees the dirty tree, and it catches shell redirects (expectation 13) that
Tier 2 cannot see.

**Plan declaration (`path-protection-plan@1`).** A fenced block in the unit's
plan-carrying file (`PLAN.md` for M/L units, the SPEC's `### Phases` for XS/S):

```text
path-protection-plan@1
freeze-after: <P<n>|none>
kind | path | justification
created | <repo-relative path or glob> | <one-line justification>
not-created | <test name> | <one-line justification>
ignored | <test name> | <one-line justification>
```

`freeze-after` names the last test-authoring phase (`none` = no declared test
set, e.g. docs-only work). Every row carries a non-empty justification; a
missing block, a missing/unknown `freeze-after`, an unknown `kind`, or an empty
justification is `malformed-declaration`. A `created` row covers its path by
exact match or glob; a created protected path no `created` row covers is
`undeclared-test` (the plan-declared set makes the product's "every test
justified up front" promise checkable).

**Escape records (`path-protection-records@1`).** A fenced block in the unit's
`decisions.md` (the `ledger-ownership@1` `decisions` row; the agent writes
`justification` rows under `execute-phase:phase-decisions`, the owner writes
`approval` rows under `human-owner:ratified-verdicts` — append-only, never
edited):

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | <path or glob>[,<path or glob>] | <P<n>> | <YYYY-MM-DD> | execute-phase | <one-line justification>
approval | <path or glob>[,<path or glob>] | <P<n>> | <YYYY-MM-DD> | human-owner | <one-line justification>
```

A `justification` row satisfies operations requiring `justification`; an
`approval` row satisfies `approval` and additionally requires a matching
`justification` row for the same path. `authority` other than `execute-phase`
for `justification`, or `human-owner` for `approval`, is `malformed-declaration`
— there is structurally no auto-approval authority (D-60-3). A row whose `paths`
match no changed path is `unmatched-record` (a void record fails the gate).

**Closed reason vocabulary (`PATH_GUARD_REASONS`).**

| reason | kind | meaning |
|---|---|---|
| `clean` | pass | no protected path changed |
| `justified` | pass | every protected change carries a recorded justification |
| `approved` | pass | every post-freeze change carries a recorded owner approval |
| `protected-modification` | fail | a protected path changed without a recorded justification |
| `approval-required` | fail | a post-freeze change has a justification but no recorded owner approval |
| `undeclared-test` | fail | a created protected path is not declared by the plan |
| `unmatched-record` | fail | a justification or approval record matches no changed path |
| `malformed-declaration` | fail | the plan declaration block or a record row is missing or malformed |
| `missing-config` | degraded | the project policy is absent; the shipped defaults are in force |
| `malformed-config` | degraded | the project policy is unreadable or invalid; the shipped defaults are in force |

The vocabulary is closed: adding a reason is a SPEC change, never a code path.
`PATH_GUARD_REASONS` is exported by the crate module and declared as a normative
surface row (machine `path-protection-reason`, must-name `yes`).

**Tier 1 gate CLI.** `path-guard --unit <unit-dir> --phase <P<n>> [--base <ref>]`
(`packages/agentic-workflow/bin/path-guard.mjs`). It resolves the effective
policy (doc config over the shipped defaults; absent → `missing-config` + defaults,
unreadable/invalid or over the 256 KiB bound → `malformed-config` + defaults; a
changed-path list over 10,000 entries is a usage error), parses the declaration
and the records, evaluates every `(path, operation)` against the class and freeze
state, and prints one fixed block:

```text
PATH-GUARD <pass|fail> — <code>
offenders: <path:operation:reason[, …]|none>
phase: <P<n>> · freeze-after: <P<m>|none> · checked: <n>
DEGRADED — <missing-config|malformed-config>: shipped defaults in force   (only when degraded)
```

Exit: `0` pass (including a degraded but clean run), `1` fail, `2` usage error.
The gate is read-only and offline (git + local files only; no network, no forge).

**Checkpoint wiring.** `execute-phase`'s preflight runs the gate after the
phase-lint guard and before any edit; a fail prints the typed
`GATE REJECTION — path-protection` trace and stops. There is no `--force` bypass:
the escape hatch is a recorded justification/approval, not a force flag (D-60-8).
Where the crate is unavailable (installed-skill target; the scripts-distribution
gap), the skill applies the same disclose-and-degrade rule the phase-lint guard
already uses and records the unavailable gate — it never silently skips it.

**Tier 2 pi guard.** `packages/pi-agentic-workflow` registers `pi.on("tool_call")`
and blocks a `write` / `edit` call whose target is an **existing** protected path
and carries no matching `justification` record, returning
`{ block: true, reason }` with the reason naming the escape path (the record
procedure and the `path-protection-records@1` grammar). Read-only tool calls and
new-file creates pass (expectation 2 and expectation 8). Post-freeze approval is
Tier 1's checkpoint duty because the extension has no phase state; the extension
never weakens the shipped floor (D-60-5). The pi settings override is the strict
`pathProtection` key (`{ protectedGlobs?: string[]; requirements?: { [state]:
{ [operation]: requirement } } }`) merged by the same tighten-only rule: an added
glob or a raised requirement is honored, a removal or a lowering is rejected with
the degradation report (AC10).

**Three shipped-default surfaces, two pins.** The canonical defaults live in the
crate module; `template/.agentic-workflow/path-policy.json` is the install seed
(parity-checked against the crate serialization), and the pi package embeds a
mirror (parity-checked against the crate module in its own suite). The repo
pattern for a shipped mirror plus a parity test is the pi package's `skills/`
mirror (`packages/pi-agentic-workflow/test/skill-parity.test.mjs`).

### Planning evidence

See `planning-evidence.md` (M/L — the Plan-stage table is frozen there; 22 rows,
PE-001…PE-022, all `current` + `proven`).

### Obligations

See `planning-obligations.md` (M/L — O1…O17, one row per acceptance criterion
plus the read-only, vocabulary-closure, no-auto-approval, and
unavailable-gate-disclosure invariants and the `path-guard:empty-diff` /
`path-guard:two-runs` scenario pins; every row `planned` at freeze).

### Decisions to confirm

Frozen as engineering decisions in `decisions.md` (E-60-1…E-60-9); none is
open:

- **E-60-1** — canonical defaults live in the crate module; the template seed
  and the pi mirror are parity-pinned copies (three surfaces, two pins).
- **E-60-2** — the freeze point is plan-declared (`path-protection-plan@1`),
  never inferred from commit timestamps.
- **E-60-3** — records are append-only rows in the unit `decisions.md` under the
  sanctioned `execute-phase:phase-decisions` / `human-owner:ratified-verdicts`
  column sets; `authority` is validated, so no auto-approval path exists.
- **E-60-4** — absent/malformed config degrades to the shipped defaults and is
  reported; it never fails open and never disappears.
- **E-60-5** — Tier 2 blocks writes to existing protected paths without a
  justification record; creates and reads pass; post-freeze approval is the
  Tier 1 checkpoint duty.
- **E-60-6** — `guard-command.sh` stays command-only; the normalized payload
  carries no write intent, so a path check there would block reads (Product
  half out-of-scope 3 keeps prevention pi-only).
- **E-60-7** — the pi `pathProtection` override is tighten-only: globs union,
  requirement max, a removal/lowering is ignored and reported (AC10).
- **E-60-8** — the path-protection checkpoint has no `--force` bypass; the
  escape hatch is the recorded justification/approval (safety gate, not an
  ordering stop).
- **E-60-9** — the five-phase cut, one layer each, derived from the
  `phase-lint.mjs` `layerForTarget()` table (`template/` and `skills/` map to
  `docs`; `packages/` and `scripts/` map to `config/infra`).

### Testing requirements

Test layers (repo convention — integration over mocks; throwaway git fixture
repos per the existing `scripts/continuation-discipline.test.mjs` harness);
`bun`-first with the `node` fallback:

- **Crate engine suite** (`node --test packages/agentic-workflow`) — the
  freeze × class × operation matrix, creation-vs-modification, the
  justification / approval / unmatched-record / malformed-declaration cases, and
  the shipped-default fallback + degradation cases (AC1, AC3, AC5, AC6).
- **Repo-root discipline suite** (`node --test scripts/path-protection.test.mjs`,
  new) — the CLI end-to-end exit codes and fixed block over throwaway fixture
  units, the closed-reason closure, the no-auto-approval negative case, and the
  policy-config-always-protected case (AC2).
- **Pi package suite** (`cd packages/pi-agentic-workflow && bun run test`) — the
  block / reason / read-passthrough / create-passthrough cases and the
  tighten-only resolution cases with the cross-package default parity pin (AC4,
  AC10).
- **Template + wiring gates** — the template mirror command (AC9), the
  `grep` over `skills/` (AC7), the drift gate (AC8's grammar surface), and the
  budget gate.
- **Read-verified rows** — AC8's prose-wiring clause, checked by the phase
  handoff quoting the landed `PREFLIGHT.md` text.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `path-guard:empty-diff` | A checkpoint on a clean tree — no protected change | fixture unit with no diff; gate prints `pass — clean`, exit 0 (P1 pins) |
| `path-guard:malformed-config` | An unreadable or invalid project policy | fixture unit with a malformed policy file; shipped defaults in force, `DEGRADED — malformed-config` line, exit 0 on a clean diff (P1 pins) |
| `path-guard:missing-approval` | Post-freeze modify with a justification only | fixture unit past `freeze-after`; gate prints `fail — approval-required`, exit 1 (P1 pins) |
| `path-guard:unmatched-record` | A record matching no changed path | fixture unit with an orphan approval row; gate prints `fail — unmatched-record`, exit 1 (P1 pins) |
| `path-guard:freeze-boundary` | The phase ordinal exactly at and one past `freeze-after` | two fixture units, `--phase` at the boundary; the requirement flips `justification` → `approval` (P1 pins) |
| `path-guard:two-runs` | Two consecutive runs on the same tree | stateless read-only gate; byte-identical blocks, `git status` unchanged after both runs (P1 pins) |
| `pi:read-passthrough` | A `read` tool call against a protected path | extension fixture; no block returned, read allowed by the role matrix (P4 pins) |
| `pi:create-passthrough` | A `write` to a new protected file pre-freeze | extension fixture with a non-existent target; no block returned (TDD authoring, expectation 2) (P4 pins) |

Category walk: empty/zero state → `path-guard:empty-diff`; invalid or oversized
input → `path-guard:malformed-config` (the policy size bound) and the
changed-path-list bound; permission denied / wrong role → `pi:read-passthrough`
plus the role matrix (read allowed, write denied); dependency outage or timeout →
n/a: the gate is offline (git + local files only, no network or forge call);
concurrent/duplicate action → `path-guard:two-runs`; limit or threshold hit →
`path-guard:freeze-boundary`.

### Phases

Five phases, one layer each, zero open decisions; detailed checklists in
`TASKS.md`, phase-lint output in the scaffold report. P1 commits the planning
artifacts with its first change.

- **P1 — Tier 1 path gate** (config/infra): the `path-protection-policy@1` model
  with the shipped defaults and tighten-only resolution, the
  `path-protection-plan@1` / `path-protection-records@1` parsers, the pure
  evaluator, the closed reason vocabulary, the `path-guard` CLI, the crate engine
  suite, and the repo-root discipline suite. Done-when:
  `node --test packages/agentic-workflow scripts/path-protection.test.mjs` → exit 0.
- **P2 — Template policy ship** (docs): the policy seed and its doc page under
  `template/.agentic-workflow/`, the hooks README section, and the
  `init-workspace` install/upgrade seeding. Done-when: the template mirror diff
  is empty and the seeding references are present.
- **P3 — Checkpoint contract adoption** (docs): the `path-protection@1` grammar
  block, the `execute-phase` checkpoint step + rejection type, the
  `verification-contract` pointer, the plan-declaration instruction in the
  templates and the scaffold reference, the `normative-surfaces@1` row, and the
  budget re-basis. Done-when: `node --test scripts/normative-drift.test.mjs &&
  node scripts/check-skill-context.mjs` → exit 0.
- **P4 — Pi preventive guard** (config/infra): the embedded default mirror, the
  strict `pathProtection` key and tighten-only intersection in the config layer,
  the `tool_call` guard, and the package suite. Done-when:
  `cd packages/pi-agentic-workflow && bun run test` → exit 0.
- **P5 — Hardening & PR** (hardening): the full ladder, the pi mirror re-bundle
  + parity, the acceptance blob receipt, the fingerprint check, and the literal
  close-out chain. Done-when: the whole ladder green and the PR URL printed.

### Deploy & rollback

n/a — docs-and-scripts repository; shipping is the PR merge. Rollback is the
standard revert. The new policy file is additive (a repository without it keeps
running on the shipped defaults, and the gate reports the degradation), so no
migration step exists.

### Open questions / risks

All inherited Product questions are resolved (rows above); no new open question
is deferred to execution.

- **R1 — scripts-distribution gap (inherited, tracked):** the crate and
  `scripts/` do not travel with installed skills (feature 59 B-01), so in a
  target project the Tier 1 gate is unavailable until feature 44 (#198) lands;
  the checkpoint wiring discloses this and the pi guard still prevents. Recorded
  in `known-issues.md` as B-01.
- **R2 — shell-hook hosts get Tier 1 only:** expected by the Product half's
  out-of-scope 3; recorded as E-60-6, not a defect.
- **R3 — budget headroom:** the P3 skill edits re-base the touched routes with
  the declared `ceil(measured × 1.10)` rule; an unrelated over-ceiling route at
  execution is a pre-existing repo condition and is named in the phase handoff
  rather than widening this unit.

### Deliverables

- `packages/agentic-workflow/src/path-policy.mjs` — policy model, parsers,
  evaluator, closed vocabularies.
- `packages/agentic-workflow/bin/path-guard.mjs` — the Tier 1 gate CLI.
- `packages/agentic-workflow/test/path-guard.engine.test.mjs` — engine suite.
- `scripts/path-protection.test.mjs` — repo-root discipline suite.
- `template/.agentic-workflow/path-policy.json` + `path-protection.md` — the
  shipped seed and its doc page.
- `template/.agentic-workflow/hooks/README.md` — documented guard.
- `skills/init-workspace/references/{BOOTSTRAP_WRITE,UPGRADE}.md` — seeding.
- `skills/orchestration-envelope/references/TURN_CONTRACT.md` — the grammar
  block.
- `skills/execute-phase/references/PREFLIGHT.md` +
  `skills/pre-execution-review/references/POLICY.md` — the checkpoint and its
  rejection type.
- `skills/verification-contract/SKILL.md` — the enforcement pointer.
- `skills/plan-feature-scaffold/references/SCAFFOLD_PROCESS.md` +
  `docs/features/_TEMPLATE/SPEC.md` + `docs/fix/_TEMPLATE/SPEC.md` — the
  declaration instruction.
- `CLAUDE.md` + `scripts/normative-drift.test.mjs` — the normative surface row.
- `packages/pi-agentic-workflow/src/config/` +
  `packages/pi-agentic-workflow/src/extension/index.ts` +
  `packages/pi-agentic-workflow/test/path-protection.test.mjs` — the Tier 2
  guard.
- `docs/features/60-path-protection-guards/` — this plan set.

### Post-merge next feature

Feature 42 (`deterministic-review-change`, roadmap row 42) — the gate's
changed-path output is a future review-surface input (the Product half's second
deferred decision); nothing in this unit depends on it landing first.

