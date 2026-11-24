## 2026-11-24T14:49:40Z — feat/705-tool-doctor-relay-check — narrative
- **Commits:** 16 (`6144d9d3…a5e3f62b`)
- **Files:** 24 files
- **Summary:** Issue #705 completed: the tool doctor gains a  row that reports Relay dispatch capability up front — PI WEB session marker, session daemon endpoint, and the  package with its skills — plus  to read one row; the lane's degradation prose and init-workspace's interview cite it instead of re-deriving presence.
- **Decisions:** The relay row answers only the generic layer (observable without a live session) because the dispatch bridge is a synchronous session event no CLI can probe;  carries no advisory so a healthy host keeps  at 0; shared facts are now lazy-read via  (3.3s→0.24s); no flag on the wizard; the marker/daemon/bridge wording has one owner ( imported by router and probe); the  row is the unit's sole in-scope surface and #705 forbids an install; the PR URL lives in the roadmap row, not the unit doc (roadmap check reads a doc's own URL as settle signal).
- **Next:** External verification of PR #714 by the operator, then merge gate (), then merge. After merge: the roadmap row settles to  by the  skill.
