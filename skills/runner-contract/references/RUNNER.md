# The runner — one invocation, one pin, one closed set

> Owner of the runner's invocation contract (feature 91, issue #352; the closed
> set and the symbolic citation are issue #555's). Every skill that runs a
> deterministic workflow command cites this file for the **launcher** and the
> **version** and nothing else; the command itself it states with the symbolic
> form below.

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

```text
runner-set@1
candidate | requires | invocation
bunx | bun >= the crate's engines.bun | bunx @gtrabanco/agentic-workflow@<pin> <subcommand> [args...]
npx | node >= the crate's engines.node | npx --yes @gtrabanco/agentic-workflow@<pin> <subcommand> [args...]
pnpm dlx | pnpm on PATH, and node >= its floor when node is present | pnpm dlx @gtrabanco/agentic-workflow@<pin> <subcommand> [args...]
```

The set is **closed and ordered**: the first candidate present and at or above
its floor launches the package, and a later one is a fallback only — never a
second launch, never a probe that guesses. The floors are the crate's own
`engines` (its manifest is the authority, the numbers are not restated here), and
a standalone `pnpm` ships its own runtime, so the node floor binds it only when a
node is present. `npx` carries `--yes` because a skill is non-interactive: the
install prompt would be a hang, not a question.

The same order is implemented **once**, in
`packages/agentic-workflow/src/runner/resolve.mjs`: `agentic-workflow runner
resolve` prints the answer a caller spawns, and
`packages/agentic-workflow/test/runner.resolve.test.mjs` refuses a drift between
this table and that module. A new candidate is one row here plus one entry there,
in the same change — the set is a contract, not a list of habits.

## What a skill cites

A skill that runs a runner command states it with the symbolic form and names
this contract beside it:

```text
runner <subcommand> [args...]
```

`runner` means "the first candidate in The invocation's closed set that is
eligible, at the pin above". A skill never spells a launcher and never restates
the order: the words live here, the choice lives in code, and the two cannot
drift apart.

`<pin>` is read from this file — never restated, never guessed, never replaced by
`latest`. A skill that hard-codes a version re-opens the per-release maintenance
this contract exists to remove, and `scripts/normative-drift.test.mjs` fails
closed on a pin that drifts from the crate's own version.

## What the pin buys: one download, then a cache hit

The first run of a candidate downloads `@gtrabanco/agentic-workflow@<pin>`; every
run after it is a cache hit — `bunx` keeps its installs in Bun's global cache for
future use, `npx` installs a specifier's package into a folder of the npm cache,
and `pnpm dlx` reuses its own cached install. The exact pin is what makes that
cache correct rather than merely convenient: it names one immutable train, so
the behaviour a skill describes and the behaviour a caller gets are the same
release until a cut moves the pin and the package together. `latest` would let
the cache serve a contract nobody wrote; an exact pin cannot.

## The local and canary override

Testing a local build never touches the pin. Set the override in the
environment, in the same shape `AGENTIC_WORKFLOW_RUNTIME` uses:

```text
AGENTIC_WORKFLOW_RUNNER="bun /absolute/path/to/packages/agentic-workflow/bin/agentic-workflow.mjs"
```

- The value is one command, tokenised on whitespace, so the spaced form above is
  the legal form — and every consumer honours it: the crate's resolver, the
  distributable action in `journal/`, and the pi package. An empty value is the
  unset spelling.
- A skill or a test that finds `AGENTIC_WORKFLOW_RUNNER` set runs **that**
  command instead of the closed set, and says so in its output.
- Unset, the closed set decides. The repository's own suite sets it to the
  working tree's bin, which is how the crate is dogfooded before a cut.
- **This repository's authoring checkout arms the override by default**:
  `scripts/setup-env.mjs` writes a gitignored `.pi/vehicle.env` naming this
  checkout's bin, and the tool doctor's `dogfooding-vehicle` row reports the state
  (owner: `docs/workflow/SETUP.md` § The vehicle). This file stays the only home
  of the value's shape and of what honours it.
- A canary cut stages its version into this file for the duration of the publish
  and restores it, so the committed pin always names a stable release. A project
  that never upgrades keeps the pair (skills at vX, package at vX) coherent with
  zero maintenance: the pin is exact, so vX stays installable forever.

## In a pi session

Pi resolves the runner for you, so nothing here asks a session to pick one. The
crate ships as this package's own dependency and the extension spawns its bin
under the runtime that launched pi (`createRequire`, never a download); the
resolver above is the fallback for a tree where that dependency is missing.

The package's workflow tools are **deferred** (`tool_search` finds the
`agentic-workflow` namespace), and `agentic_workflow_run` runs any subcommand
with its arguments in the session's project, returning stdout, stderr and the
exit code. In a pi session `runner <subcommand>` means that tool — or the typed
tool for the commands that carry one. The closed set exists for the standalone
skills and for code without an installed crate.

## Subcommands

One package, one bin. The editor services and the runtime commands share it;
the runner half is this table, and a name outside it is a usage error, never a
shell fallback.

| Subcommand | What it runs |
|---|---|
| `runner resolve` | the programmatic launcher answer — `source`, `program`, `argv` and every candidate it tried; exit 2 with `RUNNER REFUSAL —` when none of the set resolves |
| `workflow-status` | the workflow sensor — the Envelope v2 result the drivers consume |
| `phase-lint <plan-path>` | the phase linter over a unit doc's `## Tasks` |
| `diff-guard --base <ref>` | the diff-size guard |
| `pre-execution-snapshot <build\|verify\|contract>` | the pre-execution snapshot and its drift check |
| `needs-input <unit-dir> [--workspace <dir>]` | the open-question sensor — the third route (`init-workspace:<class>`) is verified against the workspace's substrate census before it is granted |
| `substrate check --workspace <dir> [--guide AGENTS.md] [--json]` | the substrate coverage gate — one row per class (`present`/`declined`/`absent`), the summary and the verdict |
| `ledger-provenance <ledger> [--check\|--annotate]` | the fold-queue recount |
| `quality-metrics [--window <days>] [--until <instant>] [--repo <dir>] [--out <path>]` | the project-quality sensor — the DORA four keys plus the reversion ratio as one `quality-metrics@1` document (definitions in the crate README) |
| `forge-read <issue\|pr> <number> [--comments] [--reviews] [--json]` | the guarded forge read — one issue or pull request, its threads on request, every content field through the content guard and printed as the fenced delivery (or as the `forge-read@1` envelope with `--json`); `forge-read shim <install\|check\|exec>` is the ad-hoc `gh` interceptor the same route drives |
| `unit-route <unit\|issue> [--triage <unit> [--json]]` | the unit router and the triage step list |
| `skills <discover\|register\|inventory> [flags]` | the skill-discovery route's machine half — the screen, the consented install decision and the registration/decay inventory (issue #591; grammars in the crate README) |
| `relevant-files <unit-doc> [--phase P<k>\|all] [--changed <a,b> \| --base <ref>]` | the phase read-set resolver and its changed-file discipline — the paths a phase must read, and the one failure it reports (issue #269) |
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
