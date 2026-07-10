# 08 — phase-economics · architecture-notes

Layer impact, ownership, and the boundaries this feature relies on. Docs/skills-only
change — the planner rules and the shared docs are the product.

## The economics (single thesis)

```
expensive, closed SPEC  ──buys──▶  unlimited cheap execution
```

Cost moves from execution to planning. A phase is a unit a **weak** model can
complete without judgement: independently-checkable tasks, zero open decisions,
one concern, a locally-runnable gate. The planner enforces this at cut time; the
executor honors one-phase-one-session at run time.

## Where each rule lives (planner vs executor)

| Rule | Home | Kind |
|---|---|---|
| Hard split (3 triggers) | `plan-feature-scaffold` + SPEC template ×2 | planner gate |
| Cheap-executability checklist (4 boxes) | `plan-feature-scaffold` | planner gate |
| Criteria-as-commands | `plan-feature-scaffold` (emits TASKS/testing) + SPEC template ×2 | planner output |
| One-phase-one-session | `execute-phase` batch section + `FEATURE_WORKFLOW` (+ mirror) | executor rule |

The planner rules never leak into `execute-phase`; the executor rule never leaks
into the planner. Separation preserved.

## Mirror invariant (repo ↔ template/)

The SPEC template and `FEATURE_WORKFLOW` convention exist in both `docs/` and
`template/`. **Both copies change in the same PR** — verified by paired acceptance
criteria (AC6/AC7) and the `/audit-docs` mirror check. A one-sided edit means a
project scaffolded from `template/` drifts from the dogfooded repo.

## Uses existing infrastructure (no new contract)

The hard split rule chains features via the **already-shipped** `Depends on:`
infrastructure — the transitive dependency gate (features cannot start until deps
merged) and `workflow-status`'s build order. This feature adds **no** new envelope
field, no new skill, no new cross-skill contract — only rules that use what
exists.

## Constraints that bind the edit (repo rules)

- Phases labelled `P1, P2, …` — never `S1`/"Steps".
- Checklists over heuristics; fixed output contracts preserved.
- `## Portability` + closing `→ Next:` block intact on `execute-phase`
  (user-facing); `plan-feature-scaffold` keeps its fixed completion report
  (internal step, no `→ Next:`).
- No product/stack/framework/ORM/runtime reference in any skill or shared doc —
  generic phrasing throughout.

## Backward compatibility

Pure addition/tightening of guidance. Existing feature folders are untouched;
already-planned features are not retro-split (that would be a `product-audit`
proposal). A project on the old template keeps working — the hardened template
applies to features scaffolded after adoption.
