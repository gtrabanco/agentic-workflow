## 2026-11-17T13:15:26Z — feat/595-test-surplus-audit — narrative
- **Commits:** 8 (`e59c5d45…862aa4ee`)
- **Files:** 14 files
- **Summary:** Issue #595 (test-surplus-audit) fully applied: prose, test pin, and roadmap settle on 8 commits (e59c5d45..862aa4ee), PR #609 open and mergeable
- **Decisions:** Roadmap row settled through the writer (rowUpsert), not hand-edited — two ceremony wrappers are broken (ceremony roadmap row-upsert/settle die ENAMETOOLONG). PR body patched via REST API because gh pr edit exits 1. Verify receipt sha required on every G/R log line. dimension-regression requires the gate name on the same line as the log marker.
- **Next:** Owner review of PR #609; also consider filing two follow-up issues: the broken ceremony roadmap wrappers and the version-parity-content / schema-build dependency edge
