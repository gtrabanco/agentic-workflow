# NN — <feature-slug>

> Feature specification. The doc read at the start of the workflow. Fill every
> section. Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning from this spec.
>
> Copy this folder to `docs/features/NN-<feature-slug>/` and register the feature
> in `docs/features/ROADMAP.md` before starting.

## Goal

One paragraph: what this feature delivers and why it exists now.

## Branch

`feat/<NN>-<feature-slug>`

## Size

`XS | S | M | L` — estimated in planning, drives how much ceremony follows.
**XS/S** (≤ one commit / ≤ half a day): this SPEC is the only planning artifact —
implement with `execute-phase <NN>` in a single pass. **M/L** (phased work): the
full artifact set (`PLAN.md`, `TASKS.md`, …) is generated and execution goes phase
by phase. **L** additionally: consider splitting into independently shippable
features.

## Dependencies

What must be merged or true before this can start. Distinguish hard dependencies
(cannot start without) from soft ones.

## Context

Why this feature, why now. What already exists, what is missing, and what problem
the gap causes. Reference prior features and their open questions where relevant.

## Business goals

The business outcome this serves. Omit only if the feature is purely
internal/technical.

## Technical goals

The architectural outcomes — not implementation detail.

## Scope

### In scope

Concrete, checkable list of what this feature delivers.

### Out of scope / non-goals

Explicit list of what this feature deliberately does NOT do, and which feature
owns each item instead. This is the primary defence against scope creep.

## Architecture impact

How the feature interacts with the project's architecture (per
`docs/architecture/ARCHITECTURE.md`). State the invariants the implementation
must hold (which modules/layers it may and may not touch, dependency-direction
rules). If it touches sensitive boundaries, justify it here.

## Design

The substantive technical content: data shapes, entities, interfaces, schema,
algorithms, state machines. Pre-resolve every decision the implementer would
otherwise have to guess. Close inherited open questions explicitly. This section
most reduces implementation risk — if it is vague, the implementation improvises.

## Decisions to confirm

Decisions the lead must make (or has made) before implementation starts. Record
the chosen option and the rationale.

## Acceptance criteria

Objective, verifiable conditions for "done". Each must be checkable without
judgement.

## Testing requirements

What must be tested and how. State the test layer (unit / integration /
architecture) and any tooling constraints. Prefer integration and architecture
tests over heavy mocking.

## Dev scenarios

The situations this feature introduces that must be reproducible in local dev —
happy path **and** failure modes (empty/degraded state, races, outages, mass
changes, data loss). For each, name it and state how it is reached through an
**existing** mechanism. Until a runnable harness exists, list them as prose.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `<area>:<name>` | the situation | the existing trigger |

## Phases

High-level phase breakdown; detailed tasks are expanded in `TASKS.md`. **Phases
are labelled `P1, P2, …` and called *phases* — never `S1`/`S2` or "Steps".**
Planning (producing the planning artifacts) is done by `plan-feature` before
execution, so it is **not** a numbered phase here. `P1` is the first
implementation phase (it also commits the planning artifacts); the **last phase
is always hardening** (edge cases + the dev-scenario failure modes). Opening the
PR is the final *step* of the last phase, not a phase of its own.

## Deploy & rollback

Only when shipping needs more than merging: schema migrations and their order,
feature flag (if gradual rollout), config/env changes, and the rollback path
(revert PR? data cleanup?). State **n/a** explicitly when merging is enough.

## Open questions / risks

Known unknowns and risks. Promote to `TASKS.md` if they become blockers. Mark
inherited questions as RESOLVED or DEFERRED with a pointer to where they're now
handled.

## Deliverables

The concrete artifacts the PR contains.

## Post-merge next feature

The expected next feature in the sequence — see `docs/features/ROADMAP.md`.
