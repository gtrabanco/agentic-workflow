# Review step

## Purpose

Proportional + materiality review. A finding blocks only when a user-visible
outcome the ACs would miss, or a contract violation.

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