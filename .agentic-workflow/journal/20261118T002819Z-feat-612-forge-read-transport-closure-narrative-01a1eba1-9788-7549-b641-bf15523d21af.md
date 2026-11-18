## 2026-11-18T00:28:19Z — feat/612-forge-read-transport-closure — narrative
- **Commits:** 11 (`fbacbb9d…36a8b145`)
- **Files:** 35 files
- **Summary:** Closed #612: routed every content-bearing forge read through the content guard (#625)
- **Decisions:** Content guard #470 was only reachable from the collection seam; skills used raw gh issue view/pr view bypassing it. Decision: REST over gh view (author_association present in REST, not in pinned gh 2.46.0). Decision: shim is unarmed (#611). Decision: risk verdict high — review owned by owner.
- **Next:** Owner reviews PR #625 and merges; then arms the shim via #611 setup step
