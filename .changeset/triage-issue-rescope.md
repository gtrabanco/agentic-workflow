---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
"triage-issue": minor
---

feat(triage-issue): re-scope the router — one-shot and remove verdicts, profile and provenance

`triage-issue` becomes the router the ODD-hybrid direction needs, without
touching the label contract:

- **Two new verdicts, published as machine grammar.** `TRIAGE_VERDICTS` gains
  `one-shot` (small understood work runs inline with the gate only, on the
  owner's explicit consent, no unit doc and no review pass — disqualified by a
  `standard`/`high` risk tier) and `remove` (a deletion decided by measurement:
  the residual classifier's state, the code-net band, and the impact sweep — no
  measured verdict, no removal). Neither applies a label.
- **`TRIAGE_CRITERIA_PROVENANCE`** publishes the three tokens every verdict now
  records on its `Criteria:` line: `workflow-generic`, `project-declared`,
  `stamped-assumption`; a touched open-with-default criterion is surfaced to the
  owner instead of assumed.
- **Ceremony profile consumed.** The skill reads the project's
  `ceremony-profile@1` before naming a surface, with the anti-gaming guard
  stated in both directions (the profile never waives a tier gate or a
  non-negotiable; a discarded piece is a recorded skip, never an error).
- **Typed receipts are a legal findings input** beside a markdown file:
  `EnvelopeFixNowFinding` rows, a `gate-receipt@1`, or the local flow's
  `EXTERNAL VERIFY` block, documented in the new
  `skills/triage-issue/references/RECEIPTS.md`.
- **The fold→repair switch stays off.** `execute-phase --repair <receipt>` is
  documented as the conditional end state and gated on the fold-findings
  retirement triggers plus the command's own existence; `/fold-findings` remains
  the only live route this skill emits.

The batch flow, the five original verdicts, the label vocabulary and the
injection-safety invariant are unchanged.
