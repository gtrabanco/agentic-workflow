# Authoring-repo setup

One page for provisioning the toolchain a developer (or agent session) needs to
work on **this** repository — the workflow skills, scripts and templates — as
opposed to a *target project* that consumes `template/`. What used to be
archaeology through logs and side notes is two scripts plus this page
(issue #331).

```sh
node scripts/setup-env.mjs            # provision everything that is missing
node scripts/setup-env.mjs --check    # verify only — installs nothing, writes nothing
```

Both scripts are package-manager-agnostic and run with `node`; bun runs them
too. Supported on macOS and Linux. **Windows is WSL-only** — not a supported
target: run everything inside WSL (the scripts refuse `win32` with this note).

## Prerequisites

| Requirement | Why | Provisioned by |
|---|---|---|
| `node` (major ≥ `.node-version`) | runs the repo's scripts and suites | you — the scripts verify it, they never install node |
| `git` | the repo itself | you |
| `pi` CLI | the agent this workflow ships for; hosts the `gentle-engram` pi package | you — `setup-env.mjs` fails with a clear message when it is absent, it never installs pi |

`.node-version` pins the Node major the CI suites run (`v24` at the time of
writing). A newer major is accepted; the exact match is not required.

## The toolchain, per tool

`node scripts/setup-env.mjs` is idempotent: every step probes the machine and
only installs what is missing, so a second run is a no-op. It exits non-zero
naming the tool when a prerequisite is unresolvable. These are the exact
commands it runs, per tool:

| Tool | Install route (binaries first) | Script step |
|---|---|---|
| bun | official installer: `curl -fsSL https://bun.sh/install \| bash` | runs it when `bun` is absent |
| uv | official installer: `curl -LsSf https://astral.sh/uv/install.sh \| sh` | runs it when `uv` is absent |
| serena-agent | `uv tool install -p 3.13 serena-agent` (the repo's canonical route; the committed `.serena/project.yml` is the project config, verified in every mode) | runs it when the `serena` binary is absent |
| engram | macOS with Homebrew: `brew install gentleman-programming/tap/engram` · otherwise the GitHub release tarball `engram_<version>_<os>_<arch>.tar.gz` extracted into `~/.local/bin` (from [releases](https://github.com/Gentleman-Programming/engram/releases)) | picks the route per platform; it is a Go binary — not a uv tool, not an npm package |
| gentle-engram (pi package) | `pi install npm:gentle-engram@latest` — feature 66's pinned route, **never** `engram setup pi` | runs it when the package is absent from the pi agent directory |

Restart your agent session after the pi-package install so the `mem_*` tools load.

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

- `.node-version` — the Node major CI runs.
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
- `.serena/cache/` and `.serena/project.local.yml` (gitignored via
  `.serena/.gitignore`);
- Engram's global store outside the repo (`~/.local/share/engram` and the
  optional Engram Cloud enrolment — opt-in, never scripted here).

## CI

`.github/workflows/setup-check.yml` runs on `macos-latest` and
`ubuntu-latest`: it provisions a pristine runner with
`node scripts/setup-env.mjs`, then verifies with
`node scripts/setup-env.mjs --check` — the same two commands a fresh clone
runs. A red job means an upstream installer or a script step broke; it is
never silently skipped.
