---
name: planning-preflight
user-invocable: false
version: 1.0.0
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
metadata:
  internal: true
description: >
  Internal planning gate: consumes the normalized repository state and makes
  the ONE final architectural classification, taken only after the complete
  engineering plan exists. Used by plan-feature, plan-feature-from-issue,
  plan-feature-scaffold, and plan-fix. Not a menu entry.
---

# Planning Preflight (internal)

The single owner of the planning-side repository gates. `plan-feature` and
`plan-fix` consume this one contract instead of each internal repeating its own
normalized-state read and architectural classification.

## When to use

Any planner route that can write planning artifacts:

- `plan-feature` — every route that will scaffold (scoped, issue, `--next`).
- `plan-fix` — every fix-SPEC draft.

Composed internals (`plan-feature-from-issue`, `plan-feature-scaffold`)
consume the same result via the in-turn planning context the router creates;
they never re-run discovery or classification.

## Step 0 — Consume the normalized repository state

When `docs/workflow/REPOSITORY_STATE.md` exists, plan from its frozen facts and
decisions. An absent fact may be inspected; a conflict is a resolver
contradiction, never a rewrite. Planned work and documentation are not
implementation evidence. A present ledger whose status is `draft`,
`contradicted`, or `resolved` stops planning and routes to discovery or
resolution first. If no ledger exists, inspect the repository directly and
record `n/a: no normalized repository state`; NRS is optional.

## Step 1 — Final architectural classification (once, after the plan exists)

Routers may do a cheap read-only eligibility check before writing, but the
FULL classification happens exactly once, only after the complete engineering
plan exists (the SPEC is filled and the phases are cut) — never per-composed-internal.

Discover the optional project invariant document declared in the documentation
map (normally `docs/architecture/ARCHITECTURAL_INVARIANTS.md`). If absent,
record `n/a: no project invariants declared` and continue. For every applicable
rule, cite its ID and repository evidence and classify the planned change as
`preserves`, `violates`, `introduces`, or `changes`. Only `preserves` may reach
emission. A violation, new rule, or changed rule stops for an explicit
architectural decision through the project's declared authority; never convert
it into an engineering task or infer approval from the SPEC. Use frozen NRS
facts when available, but repository inspection remains authoritative.

## Result — fixed classification record

Return exactly one line back to the router:

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
