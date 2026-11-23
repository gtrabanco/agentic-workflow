---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
---

fix(696): deliver the runner mapping at the point of execution

A packaged skill cites `runner <subcommand>` and never spells a launcher, so a
session that had not read `runner-contract/references/RUNNER.md` ran the
citation in bash, got exit 127, and went hunting for a binary the contract never
installs.

- `bundle-skills.mjs` splices the `runner-mapping@1` canon block (owned by
  `RUNNER.md`) into every staged `SKILL.md` that cites the symbolic form, after
  the frontmatter, and the parity suite recomputes the injection from the owner
  text instead of trusting the build.
- The `tool_call` bash seam refuses a bare `runner` head with that same block and
  the subcommand named; a path-qualified spelling is never judged.
- The shell-tool-choice repair stops leaving the session's project: a `node`
  command naming a `scripts/…` file the project does not have is refused with a
  pathless reason that points at `agentic_workflow_run`, and the verdicts of a
  caller that injects no existence answer are unchanged.
