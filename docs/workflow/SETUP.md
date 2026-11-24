# Authoring-repo setup

One page for provisioning the toolchain a developer (or agent session) needs to
work on **this** repository — the workflow skills, scripts and templates — as
opposed to a *target project* that consumes `template/`. What used to be
archaeology through logs and side notes is two scripts plus this page
(issue #331).

```sh
bun run setup:env            # provision everything that is missing
bun run setup:env:check      # verify only — installs nothing, writes nothing
bun run setup:env:doctor     # the tool doctor's evidence, per surface (JSON envelope)
```

The root `package.json` scripts forward to `node scripts/setup-env.mjs`; the direct
forms are the same:

All three run with `node`; bun runs them too. The first two are this repository's
provisioner; `--doctor` is the deterministic **checker** (feature 537,
`runner doctor`) and prints the same `doctor@1` envelope the bin and
`init-workspace` read, so a state is never re-derived by hand.

When the tools are already present and only stale, `update-dev-tools` is the
one-shot refresher — the mirror image of the provisioner: it upgrades only what
exists (an absent tool is an honest skip naming `setup-env`), runs the same
routes the table below pins, and never installs bun, node, pi or a package
manager. It is the blanket counterpart of `update-tools`'s deliberate,
drift-driven close for the two watched tools: the refresher borrows that
script's upgrade constants, so the two surfaces cannot drift apart:

```sh
bun scripts/update-dev-tools.mjs           # refresh the installed toolchain (installs nothing)
bun scripts/update-dev-tools.mjs --plan    # plan only — print what a refresh would run
```

Every step's progress goes to stderr; the exit code (0 ok · 1 a step failed ·
2 a refusal) is the receipt. ripgrep is the honest edge: it refreshes through
Homebrew when a brew channel exists and reports the package-manager hand-off
otherwise. Supported on macOS and Linux. Supported on macOS and Linux. **Windows is WSL-only** — not a supported
target: run everything inside WSL (the scripts refuse `win32` with this note).

## Prerequisites

| Requirement | Why | Provisioned by |
|---|---|---|
| `node` | runs the repo's scripts and suites; you need it anyway to install the `pi` CLI (`npm install -g @earendil-works/pi-coding-agent` requires npm) | you — the scripts neither verify nor install node (S11) |
| `git` | the repo itself | you |
| `pi` CLI | the agent this workflow ships for; hosts the `gentle-engram` pi package | you — `npm install -g @earendil-works/pi-coding-agent`; `setup-env.mjs` fails with a clear message when it is absent, it never installs pi |

`.node-version` records the Node major the repo's own CI suites run (`v24` at
the time of writing); it is read by CI, not by `setup-env.mjs`. A newer major
on your machine is fine — node is your prerequisite, not the script's concern
(S11).

## The doctor — what the state actually is

`runner doctor` (`node scripts/setup-env.mjs --doctor` here) is one
read-only pass over the **documented** tool inventory — the `tool-inventory@1`
block of [`packages/agentic-workflow/README.md`](../../packages/agentic-workflow/README.md) —
and it is the single declaration of what the workflow depends on: each row says
what the tool is, why it exists, whether it is required or optional, how it is
detected, its alternative and its install route.

Per row it answers with real evidence, never a guess: the resolved path, the
version, a version **pair** where one exists (bun against `.bun-version`, the
`engram` binary against what its `/health` endpoint serves), the health answer,
and the config state. The status is one of `ok`, `missing`, `mismatch`,
`unarmed` (a declared contract whose configuration was never applied — an
un-armed shared-merge driver, a missing `pre-push` hook), `unreachable`, or
`not-applicable` (the project does not declare that surface, which is not a
defect). A missing **required** surface exits 1; a missing optional one is an
advisory that never fails the run.

`runner setup` is the mutating half and asks only where a write or a
real decision exists: `ask-consent-write` runs the **project's own** installer
after an explicit yes, `instruct-only` prints the exact command, `residual` names
a decision another owner makes, and the second run is a no-op. Nothing installs
a package for you — an install route is text you paste.

## The vehicle — running this checkout instead of the release

An authoring session must run **this** checkout, not the last release it happens
to have installed: a merged unit lands in the tree and reaches an installed
release only at the next cut, so a session on the release cannot see its own
work. The mechanism is the runner's documented override
([`skills/runner-contract/references/RUNNER.md`](../../skills/runner-contract/references/RUNNER.md)
owns its value shape and every consumer); this page owns only how this
repository's checkout is **armed** with it.

```sh
node scripts/setup-env.mjs           # arms it: writes .pi/vehicle.env (gitignored)
. .pi/vehicle.env                    # source it in the shell that launches your session
node scripts/setup-env.mjs --check   # verifies it, read-only: the row names the observed source
```

`setup-env.mjs` writes the override pointing at this checkout's
`packages/agentic-workflow/bin/agentic-workflow.mjs` (`bun` when it is installed,
`node` otherwise). The file is local and per-checkout by construction — its value
is an absolute path — so a fresh worktree re-runs the provisioner instead of
copying one. The step is **default-on where pi is installed** (the authoring
environment) and opt-in elsewhere: a contributor without pi gets the export line
in the check output and nothing is written. An empty value is the unset spelling;
`--check` reports it as unarmed rather than guessing.

### The post-merge refresh — a vehicle is stale by construction after a merge

When a merged unit touched `skills/` or `packages/`, the next session's installed
release is behind the tree **by construction** — that is the normal state, not a
defect. The tool doctor's `dogfooding-vehicle` row is what makes it visible:
`bun scripts/setup-env.mjs --doctor` prints it with the installed version, the
newest canary tag and the resolved target. Two moves, and only two:

- **arm the override** for a session that must see the tree right now (the
  command above), or
- **cut and reinstall** — `bun scripts/release.mjs apply --channel canary`, then
  `pi install npm:@gtrabanco/pi-agentic-workflow@canary` — when the release half
  is what you need.

A session that meets a refusal for a subcommand the tree already ships has a
**setup state**, not a bug: the triage route reads the row and applies the move
instead of filing a defect (owner:
[`skills/triage-issue/references/ISSUE_PROCESS.md`](../../skills/triage-issue/references/ISSUE_PROCESS.md)
§ the setup-defect check).

## The toolchain, per tool

`node scripts/setup-env.mjs` is **progressive** (S8): every pass probes the
machine and runs one layer of fixes — tools first, then config — so a step is
installed before the next one runs. A failed step stops the pipeline naming
the tool; the loop re-verifies (max 3 passes) until everything checks out or
reports what is still missing. It exits non-zero naming the tool when a
prerequisite is unresolvable. These are the exact commands it runs, per tool:

| Tool | Install route (binaries first) | Script step |
|---|---|---|
| bun | **opt-in (S11)** — if `bun` is absent the script **asks** before installing it, because bun is this repo's preferred package manager (performance); accepted, it installs the committed `.bun-version` minimum (`curl -fsSL https://bun.sh/install \| bash -s "bun-v1.4.0"`); declined (or a non-interactive run), nothing installs and node remains the runtime — the script prints how to opt in later. An installed bun **behind** the pin is repaired at the pinned version without asking (an old bun cannot parse the repo's lockfiles) | asks when `bun` is absent; repairs when behind the pin |
| uv | official installer: `curl -LsSf https://astral.sh/uv/install.sh \| sh` | runs it when `uv` is absent |
| serena-agent | `uv tool install -p 3.13 serena-agent` (the repo's canonical route; the committed `.serena/project.yml` is the project config, verified in every mode) | runs it when the `serena` binary is absent |
| engram | macOS with Homebrew: `brew install gentleman-programming/tap/engram` · otherwise the GitHub release tarball `engram_<version>_<os>_<arch>.tar.gz` extracted into `~/.local/bin` (from [releases](https://github.com/Gentleman-Programming/engram/releases)); assets carry Go's arch names, so `x64` maps to `amd64` | picks the route per platform; it is a Go binary — not a uv tool, not an npm package |
| gentle-engram (pi package) | `pi install npm:gentle-engram@latest` — feature 66's pinned route, **never** `engram setup pi` | runs it when the package is absent from the pi agent directory; a missing `pi` CLI fails the run naming it, even with the package already installed |

Restart your agent session after the pi-package install so the `mem_*` tools load.

### The config layer — what gets verified, what gets rebuilt

After the tools, the pipeline verifies config (owner decision: **local-only
repair** — committed shared state is read-only, never rewritten or
regenerated by the script):

| Row | Kind | What the pipeline does |
|---|---|---|
| `.serena/project.yml` | committed | verifies present and non-empty; missing/empty is a clear error, never a rewrite |
| `.engram/config.json` | committed | verifies valid JSON with a `project_name`; never rewritten, never initialized (AC3) |
| `.serena/cache` | local, gitignored | **creates it when missing** — a fresh worktree lacks it |
| `.serena/project.local.yml` | local, gitignored | **writes the known-good override when missing** (typescript, bash, json, yaml — markdown deliberately absent: marksman crashes without libicu and one failing LS kills the whole manager, PE-010); an existing override is never overwritten |
| `packages/agentic-workflow-schema/dist/` | local, gitignored | **installs and builds when missing**: `cd packages/agentic-workflow-schema && bun install --frozen-lockfile && bun run build` — the root suites fail without it; **requires bun** — skipped with a warning while bun is absent (S11) |
| `packages/pi-agentic-workflow/node_modules` | local, gitignored | **installs when missing**: `cd packages/pi-agentic-workflow && bun install --frozen-lockfile`; **requires bun** — skipped with a warning while bun is absent (S11) |

`--check` reports all six rows read-only; the provision run rebuilds the four
local ones. Missing **optional** bun (and the two bun-built rows while bun is
absent) report as `warn` rows that never fail the verdict — only required
tools and committed/local config do.

### Worktrees: the quick resetup

A fresh `git worktree add` has every committed file but none of the gitignored
local state — which is exactly what the config layer rebuilds. If serena (or
the root suites) misbehave in a new worktree, run the same command there:

```sh
cd /path/to/worktree && node scripts/setup-env.mjs
```

It converges to exit 0 once the local state exists, so a worktree resetup is
one command, not archaeology. The root cause of serena's own worktree failures
is PE-010 (planning evidence of this unit): the gitignored
`.serena/project.local.yml` override was the only thing keeping the main
checkout's serena alive, so creating it in every checkout that lacks it is what
makes a worktree's serena start — the provision run above does exactly that,
and the `--check` after it reports the override row `ok`.

### Keeping tools current

```sh
node scripts/update-tools.mjs --dry-run   # report installed vs published for both tools, change nothing
node scripts/update-tools.mjs             # upgrade: uv tool upgrade serena-agent + pi install npm:gentle-engram@latest
```

The scheduled `scripts/pin-watch.mjs` watch files drift issues for exactly
these two tools; upgrading through `update-tools.mjs` is the deliberate act
that closes them. Dependency *pins* inside `packages/` are a separate,
human `fix(deps)` PR (see AGENTS.md → Packages).

### Dogfooding the workflow on this repo (opt-in)

The skills run on *target projects*; sessions that author this repo opt in
per workspace with the gitignored symlink mount:

```sh
ln -sfn ../skills .claude/skills
```

## Committed vs local state

Committed shared state — the scripts verify it, they never rewrite it:

- `.node-version` — the Node major the repo's CI suites run (the setup script neither verifies nor installs node — S11).
- `.bun-version` — the minimum bun version (1.4.0, the version CI pins), used when you opt into bun; the script repairs an install that is behind the pin.
- `.serena/project.yml` — the Serena project config (verified present and
  non-empty in every `setup-env.mjs` mode).
- `.serena/memories/` — Serena's project memories.
- `.engram/` — Engram's project config and store (`config.json`,
  `manifest.json`, `chunks/`). **Byte-identical after any script run** — the
  guarantee is a test (`setup-env.test.mjs`), not prose: no script step
  targets `.engram/` and no `engram setup` / `pi-engram init` / `serena init`
  runs, because all three write config this repo owns.

Local machine state — never committed:

- the installed tools themselves (bun, uv, the `serena-agent` uv-tool venv,
  the `engram` binary in `~/.local/bin`, the pi agent directory
  `~/.pi/agent` or `$PI_CODING_AGENT_DIR`);
- `.serena/cache/` and `.serena/project.local.yml` (gitignored; the latter is
  **written by the setup** when missing — see the config layer above);
- Engram's global store outside the repo (`~/.local/share/engram` and the
  optional Engram Cloud enrolment — opt-in, never scripted here).
