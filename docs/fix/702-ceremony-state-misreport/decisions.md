# Decisions — fix/702-ceremony-state-misreport

The owner decisions this unit took (D1–D9) are recorded as `D` lines in the unit
doc's `## Log` — one owner, never a second copy here. This file carries the
path-protection records the guard reads when the unit edits a protected path.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/gate-receipt.test.mjs | P1 | 2026-11-23 | execute-phase | the check-status family gains `unevaluatable` (issue #702 S5/S10), so the suite's own pinned literal and a new acceptance case must land with it — the assertion that changes is restated to the wider contract, never weakened, and no other case is touched
justification | packages/agentic-workflow/test/runner.ceremony-p0.test.mjs | P4 | 2026-11-23 | execute-phase | the legacy-side-ledger case's fixture carried both a `## Findings` section and a `review-findings.md`, which issue #702 S4 makes a typed `dual-findings-carrier` defect; the fixture becomes a real legacy unit (no section), the assertion (readable, never rewritten) is unchanged, and the dual case is pinned in the new suite
justification | scripts/audit-pr-receipt.test.mjs | P6 | 2026-11-23 | execute-phase | one assertion pinned the misreport issue #702 S5 corrects (`gate pr-ready failed` for a gate nobody evaluated); it is restated to the truthful outcome with its intent intact (blocked, the gate named), and four cases are added — no other assertion is relaxed
justification | scripts/findings-corpus.test.mjs | P5 | 2026-11-23 | execute-phase | one case is added for issue #702 S4: a doc table parsed in the ledger grammar is reported while its rows still read, and the frozen live-tree counts stay untouched — no existing assertion changes
justification | scripts/gate-receipt.test.mjs | P6 | 2026-11-23 | execute-phase | the `gateReceiptGate` assertions pinned its old string return; issue #702 S5/S10 splits a judged missing receipt from an unreadable judge, so the two assertions move to the structured outcome (`outcome` + `reason`) with the same pass/blocks meaning — no other assertion changes
justification | scripts/review-loop-discipline.test.mjs | P9 | 2026-11-24 | execute-phase | the external-verify receipt's blocker B3 needs a regression pin on the sibling's fold-persist rule: the suite gains two asserts (`fail`-outcome scoping present, the pre-#702 absolute absent) and its obligation tag names `skills/fold-findings/SKILL.md` as protected — no existing assertion changes
```
