# Review step

## Purpose

Proportional + materiality review. A finding blocks only when a user-visible
outcome the ACs would miss, or a contract violation.

## Receipt boundary (issue #291 AC1)

The in-doc `REVIEW-VERDICT` is prose evidence, **not** the machine receipt
`/audit-pr` consumes. The receipt's sole owner is `/review-change`
(`bun scripts/review-receipt.mjs emit`). At close-out, with the PR open:

- `bun scripts/review-receipt.mjs verify --pr <N>` exit 0 → the closing block
  recommends `/audit-pr <PR-url>` as the terminal stage.
- otherwise → the closing block is `→ Next: /review-change <NN-slug>` and
  `/audit-pr` is never printed first. `n/a: no PR` is not a silent pass — the
  release step opens the PR before close-out, so the hand-off always fires.

## Inputs

- The unit's Evidence section (reviewer re-runs it)
- The unit's Acceptance criteria (to compare AC section hash with triage time)
- The review-pack axes from the project's Workflow conventions

## Fixed output contract

Write the review verdict and any findings into the unit doc:

```
REVIEW-VERDICT: PASS | FAIL
- Findings: <n> material, <n> report-notes
- Evidence reproduced: yes/no
- AC integrity: unchanged from triage
```

## Checklist (pass only if)

- [ ] Reviewer re-runs each evidence row and confirms reproducibility
- [ ] AC section hash compared with the one recorded at triage — unaltered
- [ ] Every finding classified: material (blocks) or report-note (informational)
- [ ] Wording/cosmetic notes are report-notes, never a cycle restart reason
- [ ] Verdict uses only the closed set: PASS or FAIL

## Allowed

- Report notes on wording, formatting, or cosmetic issues
- Observations about code quality that do not affect the ACs
- Suggestions for future improvements (not current unit scope)

## Forbidden

- Never block on wording/cosmetic-only issues — report-note them instead
- Never alter the acceptance criteria during review
- Never approve without re-running the evidence
- Never skip an axis the catalog demands
- Never reuse a finding from a previous cycle without re-evaluating it
- Never treat the in-doc verdict as the merge gate's receipt — the close-out
  ladder verifies `review-receipt.mjs` before any `/audit-pr` mention