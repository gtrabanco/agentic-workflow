## 2026-11-20T10:53:05Z — feat/646-docs-skills-reconciliation — narrative
- **Commits:** 25 (`36fc12b1…f9a79d00`)
- **Files:** 53 files
- **Summary:** Applied issue #646 (docs + skills reconciliation): refreshed the REPOSITORY_STATE snapshot with freshness guards, converted duplicated rule copies into owner pointers, built and deployed the restatement detector, introduced progressive loading for the guide, ran a second full read, and recorded all decisions and evidence in the unit doc and ledgers. 16 commits, 48 files, PR #662.
- **Decisions:** Dropped the UI/adapter-glue exception from execute-phase; added the host-naming carve-out to the stack-agnostic rule; resolved the REPOSITORY_STATE fossil contradiction (F011/AD-002); used the writers (rowUpsert, fixrow) for roadmap settlement instead of hand edits. The push required dimension-regression re-verification which was recorded as E19 (refused) and E20 (clean) in the unit doc.
- **Next:** Owner runs external verification of PR #662, then decides on R1 (docs/assets/ship-roadmap.png deletion). After merge, the roadmap row must be set to done by the owner.
