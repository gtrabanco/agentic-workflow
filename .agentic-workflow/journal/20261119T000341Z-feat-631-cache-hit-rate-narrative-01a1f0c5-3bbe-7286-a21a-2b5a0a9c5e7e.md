## 2026-11-19T00:03:41Z — feat/631-cache-hit-rate — narrative
- **Commits:** 8 (`63e56450…5114d8d9`)
- **Files:** 12 files
- **Summary:** Unit 631 delivered (PR #641 opened). Stale-receipts pool discovered (~35 NEEDS-DECISION receipts across unit dirs). Owner directed fix of F7 advisory from unit 631's external verify. Fix rebuilds the F7 test pin in-process on the finding's shape (old pin blind — input shape cost 0.2ms, bound measured spawn startup). PR #647 opened; gates PASS (bare-pool root suite and full local gate). Worktree merged back to main.
- **Decisions:** F7 was blind: the case measured spawn startup not the scan; shipped case passed against regressed quadratic; the fix measures recordedPhases in-process at 100ms provenance bound
- **Next:** Owner merges PR #647 and decides whether to sweep the stale-receipts pool or fix unit 73's open F10 row first
