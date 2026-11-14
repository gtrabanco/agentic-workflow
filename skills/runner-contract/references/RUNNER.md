# The runner — one invocation, one pin

> Owner of the runner's invocation contract (feature 91, issue #352). Every
> skill that runs a deterministic workflow command cites this file for the
> **version** and nothing else; the command itself it states in full.

## The invocation

Copy this line, replace `<subcommand>` with the command the skill names, and
append its arguments. The pin is stamped at release time by
`scripts/release.mjs`; `scripts/normative-drift.test.mjs` recomputes it against
the crate's own `package.json` and fails closed on a mismatch.

```text
runner-pin@1
# channel: stable
field | value
invocation | bunx @gtrabanco/agentic-workflow@4.10.0 <subcommand> [args...]
```

`bunx` first, `npx` when bun is not installed — the same bun-first rule the
workflow applies to its own scripts, spelled `npx` in place of `bunx` and
pinning the same version. An unpinned `latest` is never a legal invocation: the
skills that call it were written against one train.

## The local and canary override

Testing a local build never touches the pin. Set the override in the
environment, in the same shape `AGENTIC_WORKFLOW_RUNTIME` uses:

```text
AGENTIC_WORKFLOW_RUNNER="bun /absolute/path/to/packages/agentic-workflow/bin/agentic-workflow.mjs"
```

- A skill or a test that finds `AGENTIC_WORKFLOW_RUNNER` set runs **that**
  command instead of the pinned invocation, and says so in its output.
- Unset, the pinned invocation runs. The repository's own suite sets it to the
  working tree's bin, which is how the crate is dogfooded before a cut.
- A canary cut stages its version into this file for the duration of the
  publish and restores it, so the committed pin always names a stable release.
  A project that never upgrades keeps the pair (skills at vX, package at vX)
  coherent with zero maintenance: the pin is exact, so vX stays installable
  forever.

## Subcommands

One package, one bin. The editor services and the runtime commands share it;
the runner half is this table, and a name outside it is a usage error, never a
shell fallback.

| Subcommand | What it runs |
|---|---|
| `workflow-status` | the workflow sensor — the Envelope v2 result the drivers consume |
| `phase-lint <plan-path>` | the phase linter over a unit doc's `## Tasks` |
| `diff-guard --base <ref>` | the diff-size guard |
| `pre-execution-snapshot <build\|verify\|contract>` | the pre-execution snapshot and its drift check |
| `needs-input <unit-dir>` | the open-question sensor |
| `ledger-provenance <ledger> [--check\|--annotate]` | the fold-queue recount |
| `unit-route <unit\|issue> [--triage <unit> [--json]]` | the unit router and the triage step list |
| `ceremony <object> <op> [flags...]` | the closed ceremony CLI — `workspace`, `docs`, `findings`, `ledger`, `unit`, `plan`, `tier`, `passive`, `review`, `acceptance`, `refutation`, `fusion`, `delta`, `progress`, `evidence`, `commit`, `roadmap`, `pr` (see the crate README's ceremony row for the live object set) |
| `unit-doc`, `roadmap`, `changelog`, `budgets`, `manifest`, `config`, `doc`, `section`, `relay`, `memory`, `log`, `journal`, `resolve-passes`, `verify`, `resources`, `provision` | the typed file services and the other guards (see the crate README) |

## Exit codes

Two contracts coexist and neither is negotiable:

- **Editor services and the runner's guards**: `0` success, `1` usage error,
  `2` refusal or ceremonial block — a refusal prints
  `EDIT REFUSAL — <reason>` (or the service's own `<SERVICE> REFUSAL —` line)
  **before** any byte moves.
- **The ceremony CLI**: `0` success with JSON on stdout, `1` usage error as
  JSON, `2` a ceremonial block. A sensor keeps its own published code
  (`needs-input`: `0` answered, `1` refused, `2` usage; `phase-lint`: `0` pass,
  `1` blocked or usage).

A caller reads the exit code and the fixed block; it never parses stderr to
decide what happened.
