# Decisions — 78-unit-cycle

Conversation record for the coded delivery loop. Append-only.

## Decisions

- **D1 · 2026-10-23 · decision · owner directive** — the delivery cycle
  (design → plan → phases → review → fold ≤ X → receipt → audit → fix loop)
  is **code, not prose for an LLM**: a deterministic control loop invokes the
  judgment steps as `pi -p` sessions and stops only for manual input or a
  closed terminal state. *Why:* feature 22 defined exactly this
  (`loop-review-fold`, budget two cycles, no-progress, closed terminals) and
  feature 61's absorption left only prose, which re-derives every transition
  per model run.
- **D2 · 2026-10-23 · decision · owner directive** — the loop lives in the
  root scripts (`scripts/unit-cycle.mjs`), self-hosting first, reusing the
  repo's existing sensing primitives; promotion to a pi-package command is a
  later move, not this unit.
- **D3 · 2026-10-23 · decision · owner directive** — sequencing: unit 67 was
  closed out in-session and this unit is built in the same session **without
  lane ceremony** (no triage/design/plan phases, no `execute-phase` hand-offs);
  tests-first and the root suite remain the gates.

## Open questions

none — no questions: every claim was settled by provenance or research

## Path-protection records (P1)

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/unit-cycle.mjs, scripts/unit-cycle.test.mjs | P1 | 2026-10-23 | execute-phase | P1 authors the coded delivery loop and its offline suite together (red-first: the suite pins the state machine, prompt builder, sensing helpers and runner before the module exists); the module under test and the tests that exercise its control flow land as one unit, the same pair shape as the pin-watch watcher and suite
```
