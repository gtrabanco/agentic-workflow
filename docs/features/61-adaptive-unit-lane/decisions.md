# Feature 61 — decisions & justification records

## Path protection

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/next-recommendations.test.mjs | P4 | 2026-09-22 | execute-phase | pin re-aim: the executor terminal hand-offs were re-homed after UNIT_LOOP.md and CLOSEOUT.md retired (feature 61 P4); the review-before-fold assertion is re-pointed at the surviving SKILL.md and FOLDING.md surfaces.
justification | scripts/workflow-status-pre-execution.test.mjs | P8b | 2026-01-04 | execute-phase | retire fix-template LEDGERS.md reference: P8b de-receipts pre-execution machinery; fixture LEDGERS.md is deleted, TEMPLATE_RELS is emptied.
justification | scripts/review-loop-discipline.test.mjs | P8b | 2026-01-04 | execute-phase | retire fix-template LEDGERS.md reference: P8b de-receipts pre-execution machinery; fixture LEDGERS.md is deleted, template injection tests are simplified.
justification | packages/agentic-workflow-schema/test/fixtures/pre-execution-documents.mjs | P8b | 2026-09-22 | execute-phase | migrate toySpec() from the retired two-half SPEC vocabulary to the unit document's 13-section list (feature 61 P8); the selector now validates against UNIT_DOC_REQUIRED_SECTIONS.
justification | scripts/pre-execution-sensor.test.mjs | P8b | 2026-09-22 | execute-phase | replace specText() fixture with 13-section unit doc: the spec-product-v1 selector no longer accepts the retired two-half SPEC format.
justification | scripts/pre-execution-timeline.test.mjs | P8b | 2026-09-22 | execute-phase | replace specText() fixture with 13-section unit doc: the spec-product-v1 selector no longer accepts the retired two-half SPEC format.
justification | scripts/pre-execution-attribution.test.mjs | P8b | 2026-09-22 | execute-phase | change editedSpec() override from Goal to Objective: Goal is not a required section in the 13-section list, so the old override was a no-op on the Product projection (same digest, comparator returned fresh instead of stale-artifact-content).
```
