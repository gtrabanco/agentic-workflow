---
name: runner-contract
user-invocable: false
version: 4.10.0
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  The distributable runner's invocation contract: one train-stamped pin for
  every runtime command the workflow's skills cite. Referenced by the skills
  that run sensors, guards and ceremony operations; never a menu entry.
---

# Runner contract (internal)

The workflow's deterministic layer ships as **one npm package**, not as scripts
inside a skill folder: `@gtrabanco/agentic-workflow`, invoked with `bunx` or
`npx` at a version that travels with the skills. A target project installs the
skills and gets every command they cite, with no clone of this repository.

[RUNNER.md](references/RUNNER.md) is that contract's one home: the canonical
invocation, the version pin, the subcommand map and the exit codes. **The pin
lives there and nowhere else** — a skill cites the runner and points at
RUNNER.md for the version, so a release stamps one file instead of thirteen.

## What a skill cites

A skill that runs a runner command states the command with the pin written as a
placeholder and names this contract beside it:

```text
bunx @gtrabanco/agentic-workflow@<pin> <subcommand> [args...]
```

`<pin>` is read from [RUNNER.md](references/RUNNER.md) — never restated, never
guessed, never replaced by `latest`. A skill that hard-codes a version re-opens
the per-release manual edit this contract exists to remove, and
`scripts/normative-drift.test.mjs` fails closed on a pin that drifts from the
crate's own version.

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
- The crate's README: `packages/agentic-workflow/README.md` (one Commands row
  per subcommand, asserted by `test/cli.surface.test.mjs`).
- The pin: [RUNNER.md](references/RUNNER.md), stamped by
  `scripts/release.mjs` at cut time.
