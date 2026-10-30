---
"@gtrabanco/agentic-workflow-schema": minor
---

feat(schema): publish the evidence-row grammar (#318 S12)

`EVIDENCE_ROW_COLUMNS` (`claim | command | output | status`), the closed
`EVIDENCE_ROW_VERDICTS` set, and `parseEvidenceRow` / `validateEvidenceRow`.
A repair claim's row is now a shape a driver can check: a row that omits its
claim, a backticked command, a backticked observed output or a ✓/✗ verdict
fails closed naming the cell it lacks, instead of relying on the model to
follow a sentence in a skill body.
