# 15 — injection-safe-urgency · architecture-notes

## What this touches

This repo is **not an application** — it ships `skills/` (agent behavior),
`docs/workflow/` (workflow docs), and `template/` (an exportable scaffold).
"Architecture" here is which surfaces a change touches and the invariants between
them.

| Surface | Touched? | Note |
|---|---|---|
| `skills/triage-issue/SKILL.md` | **yes** (P1) | Sole owner of the label vocabulary; creates + applies on verdict. |
| `skills/workflow-status/SKILL.md` | **yes** (P2) | `detail.urgent` field (labels-only) + interruptibility facts. |
| `docs/workflow/ORCHESTRATION.md` | **yes** (P3) | Canonical pause-vs-finish micro-judge rubric (doc — no `bump-skill`). |
| `skills/ship-roadmap/SKILL.md` | **yes** (P3) | SELECT references the rubric; two-label handling. |
| `skills/init-workspace/SKILL.md` | **yes** (P4) | Seeds both labels (scaffold + upgrade). |
| `CHANGELOG.md` / `CHANGELOG.es.md`, README skill tables | **yes** (P1–P4) | Via `bump-skill`, per touched skill. |
| `docs/features/ROADMAP.md` | **yes** (planning/P5) | Row 15 `defined → planned` (scaffold) → `done` (P5). |
| `template/` | **no** | Labels seed via `init-workspace` behavior, not a templated file. |
| `packages/agentic-workflow-schema/` | **no** | `detail.urgent` extends the envelope's `detail` object, which is open/unschematized; no schema/type change (confirm during P2 — if the envelope schema pins `detail`, mirror the field there in the same PR). |
| any app/source code | **no** | None exists; docs/wording-only. |

## Invariants the implementation must hold

1. **The one data-flow path.** Issue → priority change goes only through
   `label object → sensor field → consumer judge`. Text may *inform* the judge's
   choice between two already-authorized paths; it can never create urgency. This
   is the security property — every phase preserves it.
2. **Single owner of the vocabulary.** `triage-issue` defines the label names,
   colors, and apply-rules; `workflow-status` (read), `ship-roadmap` (SELECT), and
   `init-workspace` (seed) refer to that vocabulary — never re-spell it.
3. **Sensor never decides.** `workflow-status` emits facts; the pause-vs-finish
   decision lives only in the consumer (driver / `ship-roadmap` / human).
4. **Judge is tool-less by construction.** Giving it any effector reintroduces the
   injection surface — a hard invariant, not a preference.
5. **One canonical rubric.** The rule table lives once, in `ORCHESTRATION.md`;
   `ship-roadmap` references it — no second copy that can drift.
6. **No new park/resume machinery.** Interrupt/park reuses `RESUMABLE` (feature
   03) + `execute-phase` idempotent re-entry.
7. **Docs/wording-only, stack-agnostic.** No code, no dependency, no CI; no
   product/stack/framework reference leaks. `gh` is the pre-existing forge client.
8. **Version discipline.** Every `SKILL.md` edit ⇒ `bump-skill` (minor) in the
   same PR; `ORCHESTRATION.md` is a doc (no bump).
9. **`Closes #42`.** Issue-born — the PR body closes the issue.

## Relationship to sibling skills (unchanged contracts)

- **Feature 03 (`orchestrator-crash-recovery`)** — the reconcile facts
  `workflow-status` already computes (phase · dirty/clean · commit boundary) are
  reused for interruptibility; `RESUMABLE` + idempotent re-entry are the park path.
- **Feature 07 (`roadmap-status-machine`)** — the five-state machine
  `workflow-status` reports against; `detail.urgent` is an additional field, not a
  status change.
- **Feature 10 (`envelope-orchestrator-only`)** — the machine envelope and its
  driver-side repair loop that `detail.urgent` extends and the judge's
  schema-validated output reuses. `workflow-status` remains the one skill that
  still emits the envelope.
