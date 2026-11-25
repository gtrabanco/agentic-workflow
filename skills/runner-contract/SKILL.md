---
name: runner-contract
user-invocable: false
version: 5.0.0-canary.20261125.1
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  The distributable runner's invocation contract: one train-stamped pin for
  every runtime command the workflow's skills cite. Referenced by the skills
  that run sensors, guards and ceremony operations; never a menu entry.
---

# Runner contract (internal)

The workflow's deterministic layer ships as **one npm package**, not as scripts
inside a skill folder: `@gtrabanco/agentic-workflow`, invoked at a version that
travels with the skills. A target project installs the skills and gets every
command they cite, with no clone of this repository.

[RUNNER.md](references/RUNNER.md) is that contract's one home: the closed
launcher set, the canonical invocation, the version pin, the subcommand map and
the exit codes. **The launcher and the pin live there and nowhere else** — a
skill cites the runner with the symbolic form below and points at RUNNER.md, so
a release stamps one file instead of thirteen and a runner choice has one
owner.

## What a skill cites

A skill that runs a runner command states the command with the symbolic form
below and names this contract beside it:

```text
runner <subcommand> [args...]
```

`runner`, the launcher order and the pin all come from
[RUNNER.md](references/RUNNER.md) — never spelled in a skill, never restated,
never guessed, never replaced by `latest`. A skill that hard-codes a launcher or
a version re-opens the per-release manual edit this contract exists to remove,
and `scripts/normative-drift.test.mjs` fails closed on a pin that drifts from
the crate's own version.

## What it covers

Every runtime command a skill cites: the sensors (`workflow-status`,
`phase-lint`, `diff-guard`, `pre-execution-snapshot`, `needs-input`,
`ledger-provenance`), the router (`unit-route`) and the ceremony CLI
(`ceremony <object> <op>`). The repository keeps its own authoring gates
(`check-skill-context`, `local-gate`, `release`, `test-impact`, …) — those never
ship, and no skill cites them.

## Authority

- The bin's surface: `packages/agentic-workflow/bin/agentic-workflow.mjs`.
- The subcommand table: `packages/agentic-workflow/src/runner/cli.mjs`.
- The launcher choice: `packages/agentic-workflow/src/runner/resolve.mjs`,
  printed by `runner resolve` and pinned to RUNNER.md's `runner-set@1` block by
  `test/runner.resolve.test.mjs`.
- The crate's README: `packages/agentic-workflow/README.md` (one Commands row
  per subcommand, asserted by `test/cli.surface.test.mjs`).
- The pin: [RUNNER.md](references/RUNNER.md), stamped by
  this repository's release tool at cut time.
