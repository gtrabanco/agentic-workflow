---
"@gtrabanco/agentic-workflow-schema": patch
"batch-scheduler": patch
"triage-issue": patch
---

fix(574): make the batch scheduler declare surfaces instead of guessing them

The planner read an issue's surfaces only from `## Where`/`## In scope`, with a
global backtick pairing over whatever slice it found. Two blind spots followed:
a fenced code block desynchronised that pairing, so every declaration after it
vanished (issue #504 declares `packages/pi-agentic-workflow/` and resolved to no
surface at all, while its file claims harvested the fence's own contents); and an
issue declaring nothing landed in the `general` lane with no degradation and no
finding — planned as if it touched nothing.

- `proseTokens` reads tokens per line with fenced blocks inert.
- `## Surfaces` is the declaration the issue forms and the four SPEC templates
  publish; `## Where`/`## In scope` keep the union they had, so no existing
  issue changes lane. An empty declaration is a declaration of unknown.
- The unit doc (`## Surfaces`, then its `Tasks` `Relevant files:`) is the
  fallback when the body declares nothing.
- An issue nothing declares is `surface-unknown-issue-<n>` in `degraded[]`, and
  a batch carrying two or more is a new `blind-spot` finding. Both are
  vocabulary-only extensions: `batch-plan@3` keeps its version.
- `batch-scheduler --infer-surfaces <n>` prints the declaration triage pastes
  into the issue body (print-only: no state, no forge write).

The section stays outside the unit-doc required-section lists — declaring it
required would refuse the 108 unit docs that resolve `spec-by-reference` today
and the 7 at `legacy` (the `## Retirements` precedent, #318).
