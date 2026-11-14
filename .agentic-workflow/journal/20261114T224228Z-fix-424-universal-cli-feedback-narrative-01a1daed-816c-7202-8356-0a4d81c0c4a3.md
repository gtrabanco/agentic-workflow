## 2026-11-14T22:42:28Z — fix/424-universal-cli-feedback — narrative
- **Commits:** 21 (`c6f88cb0…f0fa013d`)
- **Files:** 22 files
- **Summary:** Unit 424 completed: feedback tiers universalized across the CLI, applied external-verify corrections (8 commits), created issues #552/#553/#554/#555 for the universal CLI migration
- **Decisions:** scripts stay repo-local; skills must invoke via universal CLI (bunx/npx/pnpm dlx) — template has no scripts folder; hook scripts (~1073 lines of shell) duplicate crate logic and must move into the CLI; runner detection must be programmatic with prose only in skills; template hook shims become thin resolve+exec delegates following index-sync.sh pattern; secret-scan must ship standalone in template, decoupled from local-gate
- **Next:** Review issue #424: apply the PR and merge; then triage issues #552/#553/#554/#555 for the universal CLI migration plan
