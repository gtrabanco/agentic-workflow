# #597 — Test justification at creation + evidence-backed deletion authority

## Origin

Issue [#597](https://github.com/gtrabanco/agentic-workflow/issues/597).
Triaged 2026-11-17: promoted to feature (new workflow contracts).
Promoted label applied.

## What

Two gaps: (1) new tests have no recorded justification naming the independent
behavioral gap they cover, and (2) no surface authorizes or executes test
deletion — skills say "findings only" or "never weaken", but an agent cannot
distinguish evidence-backed deletion from forbidden weakening.

This unit adds: oracle justification at test creation (execute-phase) and
deletion authority where deletions are executed (execute-phase and fold-findings).

## Acceptance criteria

- [ ] A unit whose plan marks a test deletion executes it with an evidence row citing the ground; a red-first pair is unaffected.
- [ ] A `fix-now (delete)` row folds with the test deleted and the deletion recorded in the fold receipt.
- [ ] A new test without a justification line surfaces as a finding (fixture).
- [ ] The boundary (deletion ≠ weakening) is stated in TESTS.md and linked from AGENTS.md; no second copy.
- [ ] `bun scripts/check-skill-context.mjs` green; root suites green; changeset per repo rule.

## Dependencies

Soft order after **#595** (the finding class it folds exists there) and **#596** (the tags its evidence can cite).
Soft Related: **#444** (decision-substrate — nothing here consumes it).

## Relevant files

- `skills/unit-lane/references/TESTS.md` — the justification line, the deletion authority and the boundary (prose owner)
- `skills/execute-phase/` — the RED-evidence justification line; the planned-deletion task shape
- `skills/fold-findings/SKILL.md` — the `fix-now (delete)` execution contract
- `AGENTS.md` — link-only amendment to the tests-before-implementation bullet
- `docs/workflow/GATE_INVENTORY.md`, `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, `.changeset/`

## Non-goals

- No decision-model dependency (the substrate's role is recorded in #444; nothing here reads a model).
- No new gate or script — prose contracts and existing gates only.
- No reclassification power for fold-findings (it executes what the finding already says).
- No deletion without the #595/#596 evidence standard.