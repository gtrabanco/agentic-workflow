# #596 — Test relevance sweep: obligation tags per suite, duplication evidence, measured wall-clock

## Origin

Issue [#596](https://github.com/gtrabanco/agentic-workflow/issues/596).
Triaged 2026-11-17: promoted to feature (new workflow capability).
Promoted label applied.

## What

Re-cut of the unshipped half of #364 ("test triage — relevance review of all suites").
Adds obligation tags beside each suite, a deterministic duplication-evidence
mechanism, and measured wall-clock per change class. #356 shipped the execution
half (test targeting); #364's remaining points were never implemented.

## Acceptance criteria

- [ ] The obligation vocabulary ships as a schema-export with its owner doc and normative rows.
- [ ] Every root suite carries a tag; the gate refuses an untagged new suite (red-first pair).
- [ ] The sweep completed with a recorded keep/merge/delete decision per cluster; every deletion cites dead-surface, obligation-duplication, or cost-over-risk evidence.
- [ ] Selective kill-rate ran on the deterministic suspect list only; the selection rule is declared.
- [ ] Wall-clock per change class measured before/after, recorded in evidence.
- [ ] Root suites green (`node scripts/run-root-suite.mjs`), context budgets green, changeset per repo rule.

## Dependencies

Soft order: **#595** (product-audit surplus direction) can land first — it works on claims and owner evidence today and consumes these tags once they exist; neither blocks the other natively.
Soft Related: **#444** (decision-substrate — model-scored candidate proposal for the sweep; the evidence producers here stay model-free by design).

## Relevant files

- `packages/agentic-workflow-schema/` — the obligation vocabulary (`schema-export`), version bump
- `scripts/` — the tag-presence gate check + its sibling suite (red-first, two commits); optional: the duplication-evidence helper and its suite
- `skills/unit-lane/references/TESTS.md` + AGENTS.md — the deletion-vs-weakening boundary and the tag rule
- `docs/workflow/GATE_INVENTORY.md`, the AGENTS.md owner tables, `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, `.changeset/`

## Non-goals

- No deletion of tests without obligation-level evidence.
- No exhaustive mutation sweep.
- No decision-model dependency anywhere (deterministic scripts and prose only).
- No weakening, deletion, or skipping of tests to make anything pass.
- No test-framework choice; no graph infrastructure beyond the declared tag surface.