## 2026-11-25T10:55:15Z — fix/706-logs-write-path — narrative
- **Commits:** 23 (`7f7a0e96…d2e0c6cb`)
- **Files:** 25 files
- **Summary:** Applied issue #706 inline: fixed five instruction-chain gaps letting sessions hand-append to the journal. Product CLI now refuses journal aggregate outside CI; this repo adds a log-local-push gate; log-session skill description updated with fragment caveat; docs/LOGS.md header reordered to lead the fragment rule (owner exception authorized). PR #721 open. Local workflow prompt §7 updated to fragment-only wording.
- **Decisions:** D1: P3 header rewrite lands under one-time owner exception because log-immutability enforces byte-prefix extension — gate stays untouched. D2: P4 local aggregate refused unless CI=true; project-only log-local-push guard blocks all non-CI pushes to docs/LOGS.md. D3: P1 adopts fragment-only wording for owner's local workflow prompt outside the repo.
- **Next:** Review PR #721, push under exception
