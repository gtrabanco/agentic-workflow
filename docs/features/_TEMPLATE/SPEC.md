# NN — <feature-slug>

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> Copy this folder to `docs/features/NN-<feature-slug>/` and keep the
> file named `SPEC.md`. Register the feature in
> `docs/features/ROADMAP.md` before starting.
>
> **One SPEC, two halves.** `design-feature` writes the **Product half**
> (product definition, capability closure, acceptance criteria) and stamps
> `## Design status`. `plan-feature` refuses to plan a feature not marked
> `designed`, then writes the **Engineering half** (architecture, design,
> phases, testing). Never split this into a separate design document —
> one file, two owners, no drift.

## Goal

One paragraph: what this feature delivers and why it exists now.

## Branch

`feat/<NN>-<feature-slug>`

## Size

`XS | S | M | L` — estimated in planning, drives how much ceremony follows.
**XS/S** (≤ one commit / ≤ half a day): this SPEC is the only planning artifact —
implement with `execute-phase <NN>` in a single pass. **M/L** (phased work): the
full artifact set (`PLAN.md`, `TASKS.md`, …) is generated and execution goes phase
by phase. **Split — mandatory, not advisory**: an M/L feature MUST be split into
`Depends on:`-chained features if the plan would exceed ~5 phases, OR a single
phase would touch more than one layer/concern, OR a phase would require a design
decision not resolved in this SPEC. More, smaller, slower features is the
accepted trade — a phase a weak executor cannot complete without judgement is not
well-cut.

## Dependencies

What must be merged or true before this feature can start. Distinguish
hard dependencies (cannot start without) from soft ones.

---

## Product half

Written by `design-feature`. Not complete until `## Design status` below reads
`designed` — `plan-feature` refuses to plan this feature until then.

### Context

Why this feature, why now. What already exists, what is missing, and
what problem the gap causes. Reference prior features and their open
questions where relevant.

### Business goals

The business outcome this serves. Omit only if the feature is purely
internal/technical.

### Scope

#### In scope

Concrete, checkable list of what this feature delivers.

#### Out of scope / non-goals

Explicit list of what this feature deliberately does NOT do, and which
feature owns each item instead. This section is the primary defence
against scope creep during implementation.

### Capability closure

For **each entity** this feature introduces or touches, **each capability**
(action a user can take), and **each role/permission** — a checklist row a
weak model cannot misread. Every row resolves to a filled surface **or** an
explicit `n/a: <reason>` — a blank row fails the gate. The filled rows become
the Acceptance criteria below.

```markdown
For EACH entity this feature introduces or touches:
- [ ] Create — UI entry point: <where> · API: <surface> · test: <name>  | n/a: <reason>
- [ ] Read/list — UI: <where> · API: <surface> · test: <name>           | n/a: <reason>
- [ ] Update — UI: <where> · API: <surface> · test: <name>              | n/a: <reason>
- [ ] Delete — UI: <where> · API: <surface> · test: <name>              | n/a: <reason>
- [ ] State transitions (suspend/block/archive/…): <list> — each with UI+API+test | n/a: <reason>

For EACH capability (action a user can take):
- [ ] Visible entry point: <where>
- [ ] Who may execute it (ACL): <role(s)>

For EACH role / permission:
- [ ] Assigned where · Revoked where · Viewed where
```

### Acceptance criteria

Objective, verifiable conditions for "done". Each must be checkable
without judgement — the filled rows of Capability closure above, plus any
criteria the Engineering half adds once phased. Emit command-checkable
criteria as runnable commands where possible (a `grep`, a test invocation, a
build) — not as prose; genuinely judgement-only criteria stay prose, labelled
`read-verified`.

### Tooling

Installed skills/MCPs relevant to *this* feature (not a global discovery
sweep — that is `product-audit`'s job). n/a if none apply.

### Product decisions

Product-definition decisions the project lead must make (or has made) before
implementation starts. Record the chosen option and the rationale.

## Design status

`not designed` — capability closure not yet complete. `design-feature` sets
this to `designed` once every closure row is filled or explicitly `n/a`.
`plan-feature` refuses to plan a feature not marked `designed`.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product
half above is marked `designed`.

### Technical goals

The architectural outcomes — not implementation detail.

### Architecture impact

How the feature interacts with the project's architecture and layering
(as defined in its architecture doc). State the invariants the
implementation must hold (e.g. "outer-layer-only — no changes to the
core/domain layer"). If the feature touches the core/domain, justify it
here.

### Design

The substantive technical content: entities, ports, adapters, schema,
data shapes, algorithms, state machines. Pre-resolve every decision the
implementer would otherwise have to guess. Close inherited open
questions explicitly. This is the section that most reduces
implementation risk — if it is vague, the implementation improvises.

### Decisions to confirm

Engineering decisions the project lead must make (or has made) before
implementation starts. Record the chosen option and the rationale, so
later reviewers understand the trade-off.

### Testing requirements

What must be tested and how. State the test layer (unit / integration
/ architecture) and any tooling or runtime constraints. The project
prefers integration and architecture tests over heavy mocking.

### Dev scenarios

The situations this feature introduces that must be reproducible in local
dev — happy path **and** failure modes (empty/degraded state, races,
outages, mass changes, data loss). For each, name it and state how it is
reached through an **existing** mechanism (queued message, guard threshold,
manual override, stubbed source) — scenarios are orchestration, never new
domain. If the project has a runnable dev-scenario harness, register each
scenario there (dev-gated, never reaching production) and link it here;
otherwise list them as prose.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `<area>:<name>` | the situation | the existing trigger |

### Phases

High-level phase breakdown; detailed tasks are expanded in `TASKS.md`.
**Phases are labelled `P1, P2, …` and called *phases* — never `S1`/`S2` or
"Steps".** Planning (producing the planning artifacts) is done by `plan-feature`
before execution, so it is **not** a numbered phase here. `P1` is the first
implementation phase (it also commits the planning artifacts); the **last phase
is always hardening** (edge cases + the dev-scenario failure modes). For **M/L**,
opening the PR is the final *step* of the hardening phase (its `TASKS.md`
checklist ends with the literal close-out tasks), not a phase of its own. For
**XS/S** (SPEC-only, no `TASKS.md`), list the phases **here, with checkbox
tasks** — **always ≥ 2**: `P1` implementation, final phase `P2 — Hardening & PR`
carrying the literal close-out tasks (fixed wording — see
`docs/fix/_TEMPLATE/SPEC.md` `## Phases`); `execute-phase` runs one phase per
invocation and ticks this section as its ledger. Each implementation phase
header is followed by `Layer: <schema/db|domain|api|ui|config/infra|docs|
hardening>. Done-when: <command> → <expected outcome>.` before its task list
(same scaffold as `docs/fix/_TEMPLATE/SPEC.md` `### P1`) — the phase-lint's
"one declared layer" and "machine-checkable done-when" boxes need somewhere to
be filled in, not invented.

#### Phase-lint (quoted — authoritative copy is `docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint"; keep in sync)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.

- [ ] Title names ONE deliverable — FAIL if it joins nouns with `+`, `,`,
      `&`, `and`/`y`, or `/`.
- [ ] One declared layer — each phase declares exactly one of the fixed enum
      `schema/db | domain | api | ui | config/infra | docs | hardening |
      close-out`; FAIL if any task's target file belongs to another. Tests
      for the phase's own layer belong to the phase; a test-only phase
      declares `hardening`.
- [ ] ≤ 8 tasks (close-out phase: ≤ 10, only the literal close-out chain).
- [ ] One checkbox = one deliverable — FAIL if a task contains a `→` chain
      of implementation steps, enumerates > 3 cases/scenarios, or creates
      > 1 file of distinct concerns.
- [ ] Zero decision words — FAIL on `Decide`, `choose`, `OR` between
      alternatives, `If … then <change scope>`.
- [ ] No conditional scope mutation — a task may not move work between
      phases at runtime.
- [ ] No external/manual gates inside implementation phases —
      human/out-of-repo verifications live in the hardening/close-out phase,
      marked `manual`.
- [ ] Machine-checkable done-when — every phase ends with one verifiable
      invariant (a command + expected outcome).

### Deploy & rollback

Only when shipping needs more than merging: schema migrations and their order,
feature flag (if gradual rollout), config/env changes, and the rollback path
(revert PR? data cleanup?). State **n/a** explicitly when merging is enough.

### Open questions / risks

Known unknowns and risks. Promote to `TASKS.md` if they become
blockers. Mark inherited questions as RESOLVED or DEFERRED with a
pointer to where they are now handled.

### Deliverables

The concrete artifacts the PR contains.

### Post-merge next feature

The expected next feature in the sequence — see `docs/features/ROADMAP.md`.
