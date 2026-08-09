---
name: planning-preflight
user-invocable: false
version: 1.1.1
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal planning gate: consumes the normalized repository state and makes
  the ONE final architectural classification, using a two-stage contract that
  allows a lightweight NRS read during planning and a full architectural
  classification after the plan is cut. Used by plan-feature,
  plan-feature-from-issue, plan-feature-scaffold, and plan-fix. Not a menu entry.
---

# Planning Preflight (internal)

The single owner of the planning-side repository gates. `plan-feature` and
`plan-fix` consume this one contract instead of each internal repeating its own
normalized-state read and architectural classification.

This skill uses a **two-stage contract** to resolve the tension between:
(1) the need for planners to read the NRS early (architecture discovery is
    read-only and required to inform the plan), and
(2) the requirement that the final architectural classification only happens
    after the complete engineering plan exists.

## When to use

Any planner route that can write planning artifacts:

- `plan-feature` — every route that will scaffold (scoped, issue, `--next`).
- `plan-fix` — every fix-SPEC draft.

Composed internals (`plan-feature-from-issue`, `plan-feature-scaffold`)
consume the same result via the in-turn planning context the router creates;
they never re-run discovery or classification.

## Two-Stage Contract

### Stage 1 — NRS read during planning (lightweight)

While the plan is still being built, routers may perform a read-only consumption
of the normalized repository state (NRS) for architectural context. At this
stage only the NRS port is classified; the architectural classification is
deferred.

Record the Stage 1 result using the following format:

```text
Preflight: Stage 1 — NRS <consumed|n/a> · arch: deferred
```

This result informs the plan but does not block emission.

### Stage 2 — Full classification after plan cut (final)

Once the complete engineering plan exists (the SPEC is filled and the phases
are cut), run the FULL architectural classification exactly once per plan —
never per-composed-internal.

Discover the optional project invariant document declared in the documentation
map (normally `docs/architecture/ARCHITECTURAL_INVARIANTS.md`). If absent,
record `n/a: no project invariants declared` and pass. For every applicable
rule, cite its ID and repository evidence and classify the planned change as
`preserves`, `violates`, `introduces`, or `changes`. Only `preserves` may
reach emission. A violation, new rule, or changed rule stops for an explicit
architectural decision through the project's declared authority; never convert
it into an engineering task or infer approval from the SPEC. Use frozen NRS
facts when available, but repository inspection remains authoritative.

Record the Stage 2 result using the following format:

```text
Preflight: NRS <consumed|n/a> · invariant classification: <preserves|violates|introduces|changes> (n/a when no invariants declared)
```

### When to run Stage 2

Run Stage 2 immediately after the engineering plan is complete and before the
router emits artifacts. This is the gate that decides whether the plan can be
emitted or must stop for an architectural decision.

Stage 2 must also run whenever a previously-passed plan is re-validated after
the engineering plan changes (e.g., a new phase was added or the SPEC was
expanded). In that case, re-run only the invariant rules that may have been
affected by the change.

## Step 0 — Consume the normalized repository state

When `docs/workflow/REPOSITORY_STATE.md` exists, plan from its frozen facts and
decisions. An absent fact may be inspected; a conflict is a resolver
contradiction, never a rewrite. Planned work and documentation are not
implementation evidence. A present ledger whose status is `draft`,
`contradicted`, or `resolved` stops planning and routes to discovery or
resolution first. If no ledger exists, inspect the repository directly and
record `n/a: no normalized repository state`; NRS is optional.

## Result — fixed classification record

Return exactly one line back to the router:

- **Stage 1** (while planning):

```text
Preflight: Stage 1 — NRS <consumed|n/a> · arch: deferred
```

- **Stage 2** (after plan is cut, final gate):

```text
Preflight: NRS <consumed|n/a> · invariant classification: <preserves|violates|introduces|changes> (n/a when no invariants declared)
```

`preserves` (or `n/a: no project invariants declared`) → the router proceeds to
emit the artifacts and register the roadmap/fix entry. Any other classification
→ STOP with the fixed ARCHITECTURAL INVARIANT GATE BLOCKED block:

```text
→ Next: resolve the architectural decision first — <rule-id>: <classification> (<evidence>).
  Run /design-feature or the project's declared decision authority; do not convert this into a phase task.
```

## Guardrails

- One classification per plan, taken after the engineering plan exists — never
  in each composed internal.
- Never let the SPEC, a passing test, or a roadmap row infer the decision.
- Docs only — no code, no branch, no forge writes.
- Two-stage contract: Stage 1 is lightweight NRS read; Stage 2 is the final
  architectural gate. Stage 2 supersedes Stage 1 for emission decisions.
