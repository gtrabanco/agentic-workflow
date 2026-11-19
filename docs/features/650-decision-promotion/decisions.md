# Decisions — feat/650-decision-promotion

Append-only path-protection records for this unit (grammar
`path-protection-records@1`, owner: `skills/orchestration-envelope/references/TURN_CONTRACT.md`).
The unit declares no `path-protection-plan@1` block, so no phase freeze is armed;
this unit's decisions are the `D` lines in [`SPEC.md`](SPEC.md) `## Log` — one
home, never a second table here.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/decision-promotion.test.mjs | P2 | 2026-11-19 | execute-phase | The suite is the unit's frozen-failure corpus and the producer's calibration: without it the detection dimension ships unfalsified. It lands alone, observed red against the missing `scripts/decision-promotion.mjs` (the repo's red-first rule), and its cases are the ones the implementation must satisfy — no assertion is ever relaxed to pass. Grammar: `test-obligation: protects=scripts/decision-promotion.mjs obligations=contract,failure-path,fixture-support`.
justification | packages/agentic-workflow/test/runner.sensors.test.mjs | P3 | 2026-11-19 | execute-phase | The ledger reader's own suite is where the tolerance obligation lives: a legacy `decision` row with no scope cell, a row carrying one, and a row whose tail merely looks like one. Pinning it beside the reader keeps the failing state next to the code that would regress; no existing case is edited, the new cases are additive.
justification | packages/agentic-workflow-schema/test/index.test.mjs | P3 | 2026-11-19 | execute-phase | The package-root export suite is where a published const's surface is pinned; without the case the new vocabulary could be dropped from `src/index.ts` and only a consumer import would notice. Additive: one case asserting `DECISION_SCOPES` is exported and closed.
```
