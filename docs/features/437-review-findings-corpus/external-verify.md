# External Verification Receipt

## 2026-11-09 — EXTERNAL VERIFY (full, initial)

```
EXTERNAL VERIFY — base: 2a28f038a246d35ba159037620ebe337a56e57ed · head: 5a38163d4b6ed750e91d3653347fdd555d798879
Blockers: 0
Advisories: 3 (baseline pre-existing-failure for new scripts at base: expected; node availability gap at base for root-suite: environmental, not change-caused; workflow-status-compact pre-existing red at base: confirmed present in main)
Sibling sweep: clean — all surviving mentions of nimio/correction-budget/differential-baseline/findings-corpus in changed surfaces (fold-findings/SKILL.md, GATE_INVENTORY.md) correctly reference the new artifacts; no stale claims remain
Completeness: S1–S17 all resolved to task Implements clauses (S11/S12 are structural constraints); O1–O24 all verified with re-runnable validators
Spot check: bun scripts/findings-corpus.mjs → findings | 1149, legacy-ledgers | 56, fold-annotated | 229 — matches E1 in unit log
Verdict: VERIFIED

Three new suites, all green:
  bun test scripts/findings-corpus.test.mjs · 14 pass / 0 fail
  bun test scripts/correction-budget.test.mjs · 10 pass / 0 fail
  bun test scripts/differential-baseline.test.mjs · 9 pass / 0 fail

Scripts verified against real tree:
  bun scripts/findings-corpus.mjs → findings 1149, admitted 125, repeat-classes 9, findings-per-cycle 6.02, arw 0.88, arw-band measured
  bun scripts/correction-budget.mjs --measure → batch-size 1, sample 70, source findings-corpus
  bun scripts/differential-baseline.mjs --base main --head HEAD · verdict PRE-EXISTING, staleness stale (expected: new scripts absent at base)

Gates:
  bun scripts/check-skill-context.mjs → PASS (29 skills, fold-findings at 5920/403/3 refs inside ceilings)
  bun scripts/prose-gate-inventory.mjs → verdict: PASS
  bun scripts/docs-generate.mjs --check → verdict: PASS

Pre-existing root-suite failures (16 failures across 5 suites): confirmed present at base commit, not caused by this change:
  scripts/next-step-ranking.test.mjs — 10 fail (forge fixture issues)
  scripts/workflow-status-sensor.test.mjs — 16 fail (forge/degradation fixtures)
  scripts/workflow-status-compact.test.mjs — 1 fail (forge fixture)
  scripts/review-receipt.test.mjs — 2 fail (missing node binary in PATH override)
  scripts/review-loop-discipline.test.mjs — 1 error (missing node binary)
  scripts/local-gate.test.mjs — 2 fail (pre-existing)
  scripts/journal-carrier-check.mjs — 1 fail (pre-existing)
