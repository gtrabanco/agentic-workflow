## 2026-11-23T19:22:34Z — feat/603-self-documenting-cli — narrative
- **Commits:** 14 (`eee21de3…a2d24495`)
- **Files:** 47 files
- **Summary:** Closed issue #603: the CLI serves its own grammar (help/--help/-h/--json from one registry of 73 subcommands), every closed-registry failure names legal candidates plus a help pointer, a self-documenting-cli usage skill carries recipes without restating flags, and the pi runner tool's deferred description carries the family index. S5 (gh public-skills route) recorded uncovered — host pins gh 2.46.0, needs 2.90.0. Two pre-existing red gates disclosed: workspace-install and runner.distribution (reproduced on base commit).
- **Decisions:** D1 unit home = docs/features/603-self-documenting-cli/ (feature, promoted); D2 one PR not stacked (stacking forbidden by AGENTS.md); D3 refusal keeps exit 2 (pinned by runner.dispatch tests); D4 S5 uncovered, not guessed — evidence recorded in known-issues.md
- **Next:** Owner review of PR #700 — nothing self-approved. After merge: decide on gh public-skills integration (vendor, skip, or npx skills add). Release the bumped 4.10.1 to npm.
