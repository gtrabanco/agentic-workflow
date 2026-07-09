# 08 — phase-economics

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> **One SPEC, two halves.** `design-feature`/`plan-feature-from-issue` write the
> **Product half** (product definition, capability closure, acceptance criteria)
> and stamp `## Design status`. `plan-feature` refuses to plan a feature not
> marked `designed`, then writes the **Engineering half** (architecture, design,
> phases, testing). One file, two owners, no drift.

## Goal

Move the workflow's cost from **execution to planning** so that a phase can be
executed by a *weak, cheap* model. Today `plan-feature-scaffold` cuts phases
with a soft heuristic ("**L**: consider splitting") and lets acceptance criteria
stay prose — both assume a strong executor that can exercise judgement and hold a
long horizon. The user's execution fleet is the opposite (unlimited cheap models
for execution; strong models reserved for plan/review/audit), so a phase that
requires judgement, spans multiple concerns, or carries an unresolved design
decision is *unexecutable* by that fleet. This feature hardens the planner: a
**hard split rule** (replaces the soft one), a **per-phase cheap-executability
checklist**, **acceptance criteria emitted as runnable commands** where possible,
and the **one-phase-one-session** rule stated for the executor — the "expensive,
closed SPEC buys unlimited cheap execution" economics. This is U5 of the
2026-07-09 backlog ([#15](https://github.com/gtrabanco/agentic-workflow/issues/15)).

## Branch

`feat/08-phase-economics`

## Size

`M` — no new skill; a planner-discipline change concentrated in
`plan-feature-scaffold` (the split rule + cheap-executability checklist +
criteria-as-commands guidance), mirrored into the shared **SPEC template** (repo
**and** `template/`), plus a one-phase-one-session rule in `execute-phase`'s batch
section and the `FEATURE_WORKFLOW` convention doc (repo **and** `template/`), then
full `bump-skill` bookkeeping (EN/ES). Phased (full artifact set), last phase
hardening. It does not need splitting under its own new rule: 3 phases (≤ 5), each
touches a single concern (P1 the scaffold+template split/checklist, P2 the
criteria-as-commands + executor session rule, P3 hardening), and every design
decision is resolved here in the SPEC.

## Dependencies

**Soft: `06-design-feature`** ([#13](https://github.com/gtrabanco/agentic-workflow/issues/13),
[PR #24](https://github.com/gtrabanco/agentic-workflow/pull/24) — **merged**
2026-07-09) **and `07-roadmap-status-machine`** ([#14](https://github.com/gtrabanco/agentic-workflow/issues/14),
[PR #25](https://github.com/gtrabanco/agentic-workflow/pull/25) — **merged**
2026-07-09). The backlog records U5 as a soft dependency on U3 (design/plan
split) so the new rules land in the **already-slimmed** planner; U4 further
reshaped `plan-feature-scaffold` (it now owns the `defined → planned` roadmap
write). Both are merged, so nothing gates this feature's start — the soft
dependency is satisfied and the roadmap `Depends on` column is `—`. The fix index
(`docs/fix/`) is empty and no open fix-now issue touches `plan-feature-scaffold`,
`execute-phase`, the SPEC template, or `FEATURE_WORKFLOW.md` — the only open
issues are the remaining backlog units (#16–#21), none of which this feature
depends on.

---

## Product half

Written by `plan-feature-from-issue` from issue
[#15](https://github.com/gtrabanco/agentic-workflow/issues/15). Complete —
`## Design status` below reads `designed`.

### Context

The repo's economics thesis (backlog U5, and the Bun-port article that validated
it): **an expensive, closed SPEC buys unlimited cheap execution.** The user runs
strong models (Claude Opus / GLM 5.2) only for plan/review/audit and executes
phases on unlimited cheap models (qwen3.6, gemma4; DeepSeek v4 flash mid-tier). A
phase is therefore only well-formed if a weak model can execute it *without
judgement*: every task independently checkable, zero open design decisions, one
concern, a locally-runnable verification gate.

Two things in today's planner quietly assume a strong executor:

1. **Soft split guidance.** The SPEC template's Size section says only "**L**:
   consider splitting into independently shippable features," and
   `plan-feature-scaffold` inherits that softness. "Consider" is a heuristic — a
   weak planner (or a hurried strong one) keeps producing 8-phase, multi-layer
   features whose phases a cheap model cannot execute. The dependency
   infrastructure to split aggressively already exists (transitive dependency
   gate + build order in `workflow-status`, both shipped) — the planner just
   isn't *required* to use it.
2. **Prose acceptance criteria.** When a criterion is checkable by a command
   (`grep`, a test invocation, a build), leaving it as prose forces the executor
   to *judge* whether it's met. A weak model judges poorly; a command it can
   simply *run*. Feature 07 already emits its own criteria as commands
   (`testing.md`) — this feature makes that the planner's default output, not a
   one-off.

Nothing here changes *what* gets built; it changes how the planner **cuts and
specifies** work so the cheap fleet can execute it. It deliberately does **not**
add dynamic model self-selection (rejected: the model is the worst judge of its
own difficulty — routing is fixed by the human/driver per step type).

### Business goals

n/a — internal workflow-quality feature (no external product surface). The
outcome it serves is **cheap-fleet executability**: planning cost (paid once, on a
strong model) is traded for unlimited cheap execution, and a phase becomes a unit
of work a weak model can complete correctly without judgement. "More, smaller,
slower features/phases" is the accepted trade.

### Scope

#### In scope

- **Hard split rule in `plan-feature-scaffold`** (replaces the soft "consider
  splitting"). During phase planning, the planner **must SPLIT into
  `Depends on:`-chained features** when *any* of:
  - the plan would exceed **~5 phases**, OR
  - a single phase touches **more than one layer/concern**, OR
  - a phase requires a **design decision not resolved in the SPEC**.
  The split uses the existing dependency infrastructure (transitive gate + build
  order). "More, smaller, slower features is the accepted trade" is stated as the
  rule's rationale so it isn't second-guessed.
- **Per-phase cheap-executability checklist in `plan-feature-scaffold`.** A phase
  is well-cut **only if** all hold (each independently checkable, `n/a` stated
  explicitly where truly inapplicable):
  - ✓ every task independently checkable **without judgement**;
  - ✓ **zero open design decisions** (all resolved in `SPEC.md` / `decisions.md`);
  - ✓ **one layer/concern**;
  - ✓ its **verification gate runs locally**.
  The planner runs this checklist against every phase it emits; a phase that fails
  any box is re-cut or split (feeds the hard split rule above).
- **Acceptance criteria as runnable commands.** Where a criterion is
  command-checkable, `plan-feature-scaffold` emits it in `TASKS.md` (and the
  feature's `testing.md`) **as the command**, not as prose — a weak model verifies
  by *running*, not by judging. Genuinely judgement-only criteria stay prose and
  are labelled "read-verified" (the same split feature 07's `testing.md` uses).
- **One-phase-one-session rule for the executor.** State as a rule, next to
  `execute-phase`'s Batch-execution section **and** in the `FEATURE_WORKFLOW`
  convention doc: **one phase = one session** — never execute two phases in one
  conversation on non-frontier models (models degrade over long horizons; a fresh
  session per phase preserves the cheap-execution guarantee). The existing
  `/loop`-based batch execution keeps its per-phase clear/re-invoke shape; this
  rule makes the *why* explicit and binding for weak models.
- **SPEC-template mirror.** Replace the soft "**L**: consider splitting" line in
  `docs/features/_TEMPLATE/SPEC.md` **and** `template/docs/features/_TEMPLATE/SPEC.md`
  with the hard split-trigger rule, and add the "acceptance criteria as runnable
  commands where possible" convention to the template's Acceptance-criteria
  section — so a project scaffolded from `template/` inherits the discipline.
- **`FEATURE_WORKFLOW` mirror.** Add the one-phase-one-session rule to
  `docs/workflow/FEATURE_WORKFLOW.md` **and** its `template/` mirror if present
  (else state the assumption).
- **Bookkeeping.** `bump-skill`: a minor bump for each touched skill
  (`plan-feature-scaffold`, `execute-phase`) with changelog rows (EN/ES) and
  README skills+model table updates (EN/ES).

#### Out of scope / non-goals

- **Dynamic model self-selection** ("if the phase looks hard, upgrade the model")
  — explicitly rejected (the model is the worst judge of its own difficulty).
  Model routing stays fixed by the human/driver per step type.
- **A runnable golden-fixture harness** to test skill edits against the weakest
  fleet model — that is **U9** ([#19](https://github.com/gtrabanco/agentic-workflow/issues/19)),
  a separate unit. This feature only *states* the one-phase-one-session rule; it
  does not build tooling to enforce it.
- **The JSON-envelope removal** (U7, [#17](https://github.com/gtrabanco/agentic-workflow/issues/17))
  — untouched here.
- **Auto-splitting an already-planned feature** — the hard rule governs the
  planner *at cut time*; retro-splitting a shipped feature is a `product-audit`
  proposal, not this feature.
- **Changing the execution engine.** `execute-phase` gains a documented rule, not
  new batch machinery; `/loop` behavior is unchanged.

### Capability closure

The "entity" this feature introduces is the **phase-cut discipline** — a rule set
the planner applies and the executor obeys, not a CRUD record. There is no runtime
UI/API and no end-user roles; the "surfaces" are the skills and shared docs that
carry the rules. Each closure row resolves to a skill/doc surface + a checkable
`grep`/read test, or an explicit `n/a` with reason (the same adaptation features
06 and 07 used for a docs/skills feature).

```markdown
For the entity "phase-cut discipline" (a rule set applied by the planner):
- [x] Create — the discipline is authored, not instantiated per record: the
      hard split rule + cheap-executability checklist are written into
      `plan-feature-scaffold`. UI entry: the scaffold skill body · API: n/a
      (Markdown skill) · test: `grep -iq 'cheap-executab\|split' skills/plan-feature-scaffold/SKILL.md`.
      | (create-of-an-instance: n/a — the rule is applied every scaffold run, not stored)
- [x] Read/list — where the rules are read: `plan-feature-scaffold` (planner
      applies them), the SPEC template (`_TEMPLATE/SPEC.md` repo + `template/`),
      `execute-phase` + `FEATURE_WORKFLOW` (executor reads the session rule) ·
      API: n/a · test: the grep suite in `testing.md` covers each surface.
- [x] Update — the soft "consider splitting" line is REPLACED by the hard rule in
      both SPEC templates; the criteria-as-commands convention is ADDED to the
      template's Acceptance-criteria section · test:
      `grep -iq 'more than one layer\|~5 phases\|independently shippable' docs/features/_TEMPLATE/SPEC.md`.
- [x] Delete — n/a: no rule is deleted, only the soft guidance is upgraded to a
      hard rule (an edit, not a delete).
- [x] State transitions — n/a: the discipline has no lifecycle states; it is a
      always-on planner rule, not a stateful record.

For EACH capability (action a user/agent can take):
- [x] "Have a phase forcibly split when it fails the split triggers" — entry
      point: `plan-feature-scaffold` phase-planning step · ACL: n/a (planner rule,
      no permissions).
- [x] "Run a phase's acceptance criteria as commands rather than judge them" —
      entry point: the feature's `TASKS.md` / `testing.md` emitted by the scaffold ·
      ACL: n/a.
- [x] "Execute exactly one phase per session on a weak model" — entry point:
      `execute-phase` Batch-execution section + `FEATURE_WORKFLOW` convention ·
      ACL: n/a (a documented rule the executor/driver honors; no runtime gate — the
      golden-fixture enforcement is out of scope, U9).

For EACH role / permission:
- [x] n/a — no runtime users or roles. The only authority distinction is
      skill-internal (planner vs executor), already covered by the capability rows.
```

### Acceptance criteria

Each is objectively checkable; textual ones are runnable commands (repo-verify
gate — no application build). Grep patterns are illustrative; the executor
confirms the exact wording by read.

1. **Hard split rule in the scaffold.** `plan-feature-scaffold` states the split
   **must** happen on any of the three triggers (>~5 phases, multi-layer/concern
   phase, unresolved design decision), replacing the soft "consider":
   `grep -iq 'must' skills/plan-feature-scaffold/SKILL.md` at the split rule
   **and** the three triggers present (verified by read).
2. **Cheap-executability checklist in the scaffold.** The four-box checklist
   (independently checkable · zero open decisions · one concern · gate runs
   locally) is present as a per-phase gate:
   `grep -iq 'cheap-executab' skills/plan-feature-scaffold/SKILL.md` (the four
   boxes verified by read).
3. **Criteria-as-commands in the scaffold.** The scaffold instructs emitting
   command-checkable acceptance criteria as commands in `TASKS.md`/`testing.md`,
   prose only for judgement-only criteria:
   `grep -iq 'runnable command\|as the command\|command-checkable' skills/plan-feature-scaffold/SKILL.md`.
4. **One-phase-one-session in `execute-phase`.** Its Batch-execution section
   states one phase = one session / never two phases per conversation on
   non-frontier models:
   `grep -iq 'one phase = one session\|one phase per session\|one session' skills/execute-phase/SKILL.md`.
5. **One-phase-one-session in `FEATURE_WORKFLOW`.** The convention doc carries the
   same rule: `grep -iq 'one phase' docs/workflow/FEATURE_WORKFLOW.md`.
6. **SPEC template (repo) hardened.** The soft "consider splitting" is replaced by
   the hard split-trigger rule, and the criteria-as-commands convention is added:
   `grep -iq 'one layer\|more than one\|independently shippable' docs/features/_TEMPLATE/SPEC.md`
   **and** the old "consider splitting" phrasing gone (verified by read).
7. **SPEC template (`template/`) mirrored.** Same edits in
   `template/docs/features/_TEMPLATE/SPEC.md`:
   `grep -iq 'one layer\|more than one\|independently shippable' template/docs/features/_TEMPLATE/SPEC.md`.
8. **Discoverable / parses.** `npx skills add . --list` lists every skill (all
   touched SKILL.md files parse).
9. **Bookkeeping consistent.** `bump-skill` ran: a minor bump for
   `plan-feature-scaffold` and `execute-phase` has rows in `CHANGELOG.md` **and**
   `CHANGELOG.es.md`, and the README skills + model tables (EN/ES) reflect the new
   versions — the consistency `audit-docs` checks.
10. **No stack leakage.** No product/stack/framework/ORM/runtime reference leaked
    into the touched skills or shared docs (generic phrasing only) — verified by
    read.
11. **`## Portability` intact.** `execute-phase` still carries its `## Portability`
    section and closing `→ Next:` block (scaffold is an internal step; it keeps its
    fixed completion report) — verified by read.
12. **PR carries `Closes #15`.**

### Tooling

- `bump-skill` (repo skill) — mandatory after every SKILL.md edit; drives the
  version bumps + changelog + README tables.
- `audit-docs` (installed skill) — cross-doc consistency check run in hardening.
- No MCPs apply. n/a beyond the above.

### Product decisions

- **Hard split rule replaces the soft heuristic** — RESOLVED (issue #15). The
  three triggers (>~5 phases, multi-layer/concern phase, unresolved design
  decision) force a `Depends on:`-chained split. Rationale: the dependency
  infrastructure already exists; only the *requirement* to use it was missing, and
  a soft "consider" is invisible to a weak planner.
- **Acceptance criteria emitted as commands where checkable** — RESOLVED (issue
  #15). Command-checkable → command in `TASKS.md`/`testing.md`; judgement-only →
  prose labelled read-verified. Rationale: a weak model runs a command reliably
  but judges prose poorly (feature 07 already demonstrated the pattern).
- **One phase = one session, stated as a rule, not enforced by tooling here** —
  RESOLVED (issue #15). The rule lands in `execute-phase` + `FEATURE_WORKFLOW`;
  automated enforcement against the weakest model is U9 (golden fixtures), out of
  scope. Rationale: models degrade over long horizons; a fresh session per phase
  preserves cheap execution, and the batch `/loop` shape already re-invokes per
  phase.
- **Dynamic model self-selection rejected** — RESOLVED (issue #15, prior
  decision). Model routing stays fixed by the human/driver per step type; the
  model does not choose its own tier.
- **Soft dependency on U3/U4, both merged → `—` in the roadmap** — RESOLVED. The
  rules land in the slimmed planner (06) that 07 further reshaped; both are merged,
  so nothing gates start and the `Depends on` column is `—` (soft dep documented
  in prose above).

## Design status

`designed` — every capability-closure row is filled or explicitly `n/a`;
acceptance criteria are checkable. `plan-feature-scaffold` may fill the
Engineering half below.

---

## Engineering half

Written by `plan-feature-scaffold`.

### Technical goals

- Turn the planner's soft phase-cutting heuristic into a **deterministic gate** a
  weak planner cannot skip (checklist + hard split triggers with `must`).
- Make command-checkable acceptance criteria the planner's **default emitted
  form**, reusing the pattern feature 07 proved in its `testing.md`.
- State the one-phase-one-session execution rule where the executor reads it,
  without changing the `/loop` batch machinery.
- Mirror the shared-substrate pieces (SPEC template, `FEATURE_WORKFLOW`) into
  `template/` so a scaffolded project inherits the same economics.

### Architecture impact

Docs/skills-only change — outer-layer only. No code, no runtime, no schema. The
"architecture" invariants:

- **Planner vs executor separation preserved.** The split rule + checklist +
  criteria-as-commands live in `plan-feature-scaffold` (planning); the
  one-phase-one-session rule lives in `execute-phase` + `FEATURE_WORKFLOW`
  (execution). Neither crosses into the other's job.
- **Repo ↔ `template/` mirror invariant.** Any change to the SPEC template or a
  workflow convention doc must be applied to **both** the repo copy and its
  `template/` mirror in the same PR (the same coupling feature 07 held for the
  roadmap legend) — else a scaffolded project drifts from the dogfooded repo.
- **No new dependency between skills.** The hard split rule *uses* the existing
  `Depends on:` infrastructure (already shipped); it introduces no new envelope
  field, no new skill, no new cross-skill contract.

### Design

**Where each rule lands and its exact shape.**

1. **`plan-feature-scaffold` — Process step 4 ("Scale the artifacts to the
   size").** Insert, before/within the M/L artifact generation:
   - A **hard split rule** block: "**Split — mandatory, not advisory.** Before
     emitting the phase list, split this feature into `Depends on:`-chained
     features if **any** holds: (a) the plan would exceed ~5 phases; (b) a phase
     touches more than one layer/concern; (c) a phase requires a design decision
     not resolved in `SPEC.md`/`decisions.md`. Use the existing dependency
     infrastructure (transitive gate + `workflow-status` build order). More,
     smaller, slower features is the accepted trade." This **replaces** the soft
     "**L** → consider splitting" note (which currently only lives in the SPEC
     template; the scaffold gains the explicit gate).
   - A **per-phase cheap-executability checklist**: "Each phase you emit passes
     only if: ✓ every task independently checkable without judgement; ✓ zero open
     design decisions (all resolved in SPEC/decisions.md); ✓ one layer/concern;
     ✓ its verification gate runs locally. A phase failing any box is re-cut or
     split (feeds the split rule above). State `n/a: <reason>` only where a box is
     genuinely inapplicable."
2. **`plan-feature-scaffold` — `TASKS.md` / `testing.md` generation (Process step
   4 bullets).** Add: "Emit each **command-checkable** acceptance criterion as the
   command in `TASKS.md` and `testing.md` (e.g. a `grep`, a test invocation, a
   build) — not as prose. Only genuinely judgement-only criteria stay prose,
   labelled `read-verified`." Reference feature 07's `testing.md` as the shape.
3. **`execute-phase` — Batch-execution section (line ~434).** Add a rule box:
   "**One phase = one session.** Never execute two phases in one conversation on a
   non-frontier model — models degrade over long horizons; a fresh session per
   phase preserves the cheap-execution guarantee. The `/loop` batch shape already
   clears and re-invokes per phase; this is the rule it enforces." Portability note
   pairs the `/loop` convenience with the generic fallback (re-invoke manually per
   phase in a fresh conversation).
4. **SPEC template (repo + `template/`).** Replace the Size section's "**L**
   additionally: consider splitting into independently shippable features" with the
   hard split-trigger wording, and add to the Acceptance-criteria section:
   "Emit command-checkable criteria as runnable commands where possible;
   judgement-only criteria stay prose (labelled read-verified)."
5. **`FEATURE_WORKFLOW.md` (repo + `template/` mirror if present).** Add the
   one-phase-one-session convention to the execution section; if no `template/`
   mirror exists, state the assumption in `decisions.md`.

**Naming/format constraints (repo rules that bind this edit):** phases stay
`P1, P2, …` (never `S1`/"Steps"); checklists over heuristics; fixed output
contracts preserved; `## Portability` and closing `→ Next:` blocks intact on
`execute-phase`; no stack/framework leakage.

### Decisions to confirm

All resolved in the Product half's **Product decisions** and in `decisions.md`.
No engineering decision is left open — a precondition of this feature's own
cheap-executability checklist (a phase with an open decision must be split, so the
SPEC itself carries none).

### Testing requirements

No application build — "green" is the repo's doc-verification gate. Test layers,
in order of authority: **structural** (`npx skills add . --list` parses every
skill), **textual** (the acceptance-criteria `grep` commands in `testing.md`),
**cross-doc** (`bump-skill` bookkeeping consistency EN/ES + `/audit-docs`), and a
**weak-model read-through** of every edited skill (each new rule independently
checkable, `n/a` explicit). Prefer the runnable `grep`/`--list` checks over prose
assertions — this feature's own subject.

### Dev scenarios

Docs/skills repo — no runtime harness; scenarios are read-through verifications of
the skill bodies (same approach as feature 07's `testing.md`).

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `plan:split-oversize` | a feature planned to >5 phases | scaffold's hard split rule STOPs and chains via `Depends on:` — verified by the rule's `must` wording + three triggers in the skill body |
| `plan:split-multilayer` | a phase touching >1 concern | the cheap-executability checklist fails box "one layer/concern" → re-cut/split |
| `plan:open-decision` | a phase needing an unresolved design decision | checklist fails box "zero open decisions" → split; decision recorded in `decisions.md` first |
| `plan:criteria-as-commands` | a command-checkable acceptance criterion | scaffold emits it as a command in `TASKS.md`/`testing.md`, not prose |
| `exec:one-phase-session` | two phases attempted in one session on a weak model | `execute-phase` batch rule + `FEATURE_WORKFLOW` convention forbid it — fresh session per phase |

### Phases

`P1, P2, …`; planning (this artifact set) is done. `P1` is the first
implementation phase and also commits the planning artifacts. `P3` is hardening;
opening the PR is the final *step* of `P3`, not a phase of its own. Three phases
(≤ 5, each one concern) — the feature satisfies its own split rule.

- **P1 — Hard split rule + cheap-executability checklist.** `plan-feature-scaffold`
  gains the mandatory split-trigger block and the four-box per-phase checklist;
  the SPEC template (repo + `template/`) Size section is upgraded from soft to
  hard. Commit planning artifacts; register roadmap row 08 → `in-progress`.
- **P2 — Criteria-as-commands + one-phase-one-session.** `plan-feature-scaffold`
  emits command-checkable criteria as commands (TASKS/testing); SPEC template
  Acceptance-criteria convention added (repo + `template/`); `execute-phase` batch
  section + `FEATURE_WORKFLOW` (repo + `template/` mirror) carry the
  one-phase-one-session rule. Minor version bumps (bookkeeping deferred to P3).
- **P3 — Hardening + bookkeeping.** Verify the dev-scenario read-throughs; run
  `bump-skill` (EN/ES changelogs + README tables); `npx skills add . --list`; run
  every acceptance-criteria `grep`; `/audit-docs`; weak-model read-through; confirm
  no stack leakage and `## Portability`/`→ Next:` intact; open the PR with
  `Closes #15`, print the URL, set row 08 → `done`, commit `docs: link PR #<n>`.

### Deploy & rollback

n/a — docs/skills only; shipping is merging the PR. Rollback is a revert PR (no
data, no migration, no flag).

### Open questions / risks

- **Risk: the hard split rule over-fragments trivial features.** Mitigated by the
  "~5 phases" threshold and the `n/a`-explicit checklist — XS/S features (SPEC-only,
  single-pass) never reach phase-splitting, and the rule fires only at M/L phase
  planning. Noted for the P3 read-through.
- **Risk: repo↔`template/` drift** if only one SPEC template / `FEATURE_WORKFLOW`
  copy is edited. Mitigated by explicit paired acceptance criteria (AC6/AC7) and
  the `/audit-docs` mirror check.
- No blocking open questions (a precondition of the feature's own checklist).

### Deliverables

- `skills/plan-feature-scaffold/SKILL.md` — hard split rule, cheap-executability
  checklist, criteria-as-commands guidance (minor bump).
- `skills/execute-phase/SKILL.md` — one-phase-one-session rule in the batch
  section (minor bump).
- `docs/features/_TEMPLATE/SPEC.md` + `template/docs/features/_TEMPLATE/SPEC.md` —
  hard split-trigger rule + criteria-as-commands convention.
- `docs/workflow/FEATURE_WORKFLOW.md` (+ `template/` mirror if present) —
  one-phase-one-session convention.
- `CHANGELOG.md` + `CHANGELOG.es.md` + README skills/model tables (EN/ES) — via
  `bump-skill`.
- `docs/features/08-phase-economics/` — this SPEC + planning artifact set.
- The PR (`Closes #15`).

### Post-merge next feature

Per the backlog order (U5 → U6): **U6 — installed skill/MCP discovery sweep in
`product-audit`** ([#16](https://github.com/gtrabanco/agentic-workflow/issues/16)).
See `docs/features/ROADMAP.md`.
