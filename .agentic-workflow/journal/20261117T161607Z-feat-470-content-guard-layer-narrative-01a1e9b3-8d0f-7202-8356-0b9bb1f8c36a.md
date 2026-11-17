## 2026-11-17T16:16:07Z — feat/470-content-guard-layer — narrative
- **Commits:** 32 (`bbb124c5…1866bc96`)
- **Files:** 37 files
- **Summary:** Merged origin/main (PR #609) into feat/470-content-guard-layer, resolved conflicts in GATE_INVENTORY.md, SKILL_CONTEXT_BUDGETS.json, ROADMAP.md and units.md by unioning rows and regenerating. Fixed batch-scheduler envelope rejection (extended DEGRADED regex for content-guard reasons, allowed empty title for excluded units, fixed size-hint regex). Fixed policy merge to pass invalid types through. Added guard limitation docs. Opened issue #615 for pi-extensible-workflows pin drift.
- **Decisions:** Merge: git merge not rebase (revertable). Guard envelope: extended DEGRADED regex from content-guard-reason vocabulary. Policy merge: invalid types never silently narrowed. Issue workflow: pin drift always a separate fix(deps) PR.
- **Next:** Resolve dependency pin drift via fix(deps) PR for pi-extensible-workflows 6.3→6.4.0 (issue #615 opened, needs triage). Clean stale worktree feat-610 for local gate. Push branch for owner review of PR #605.
