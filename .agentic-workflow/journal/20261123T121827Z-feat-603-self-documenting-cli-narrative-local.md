## 2026-11-23T12:18:27Z — feat/603-self-documenting-cli — narrative
- **Commits:** 4 (`eee21de3…91fd1ffa`)
- **Files:** 28 files
- **Summary:** Applied issue #603 through the owner's local workflow: the CLI now serves its own grammar (help/--help/-h/--json from one registry of 73 subcommands), every closed-registry failure names its legal candidates and one help pointer, a new self-documenting-cli skill carries the recipes without restating a flag, and the pi runner tool's deferred description carries the family index. S5 (the gh public-skills route) is recorded uncovered with its evidence: this host pins gh 2.46.0.
- **Decisions:** D2 the refusal keeps exit 2 (pinned by runner.dispatch); D3 S5 uncovered, not guessed; three subcommands keep their richer hand-written --help.
- **Next:** Owner review: the pre-existing red gates (workspace-install, runner.distribution, the pi suite) are on main before this unit.
