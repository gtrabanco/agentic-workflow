## 2026-11-19T13:17:17Z — feat/643-single-source-vocabulary — narrative
- **Commits:** 27 (`00d5b60d…31890641`)
- **Files:** 45 files
- **Summary:** Verified and applied the external-verify correction batch for unit #643 (single-source-vocabulary), resolved merge conflicts from origin/main (PR #649 / issue #596), and pushed the complete branch. The branch is now MERGEABLE on PR #648.
- **Decisions:** CAS route over ceremony for roadmap settle: ceremony reads feature settle rows' wrong cell (sets 0 for row 643), so used `roadmap rowUpsert --expect` for correct 3→4 settlement. Pipe avoidance on O13 validator: rewrote regex alternation into multiple `-e` args to prevent breaking the 9-column pipe-separator ledger. Merge resolution: GATE_INVENTORY.md used full id-set union on shared rows + kept main's new rows; SKILL_CONTEXT_BUDGETS.json re-pinned per the fix #571 precedent (exact linesMax/machineLines over re-baseline, estimateMax kept from main's headroom ceiling).
- **Next:** Owner recheck: blockers-only recheck of PR #648 head 318906413 on the merged tree, then merge to main. The branch is CLEAN and MERGEABLE — git status shows 0 uncommitted, push confirmed.
