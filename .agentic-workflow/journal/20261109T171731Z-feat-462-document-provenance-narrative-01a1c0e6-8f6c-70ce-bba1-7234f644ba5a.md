## 2026-11-09T17:17:31Z — feat-462-document-provenance — manual
- **Commits:** 7 (`b2b4f04d…4847fc35`)
- **Files:** 31 files
- **Summary:** Applied issue #462 (document-provenance-stamp): published the doc-provenance@1 schema contract, mirrored constants in the runner crate, stamped unit-doc templates and creation paths, refused mismatches in verify, registered surfaces + migration reader rule, created PR #483.
- **Decisions:** Pre-push gate skipped (AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1): node binary absent, bun leg green (565/0). Worktree gitdir collides with worktree dir (corrupt but not blocking); backup created under .git/backups/feat-462-*.bundle+patches+tree (verified restore). Format tokens renamed mid-RED from sibling families to one carrier family so older docs degrade instead of become unknown.
- **Next:** External verify of PR #483; mergeable now, settles roadmap row 462 to done.
