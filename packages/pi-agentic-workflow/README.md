# @gtrabanco/pi-agentic-workflow

One install of the [agentic-workflow](https://github.com/gtrabanco/agentic-workflow)
method into [Pi](https://github.com/badlogic/pi-mono): the canonical skills, a
friendly slash command for each of them, and optional per-command model routing
that gives your session back afterwards.

- **Canonical skills, projected.** The package ships the same `SKILL.md` sources
  as this repository — no Pi-specific fork to drift. A repo-internal manifest
  (`projection-manifest.json`, committed but never packed) declares prose
  sections the pi bundle drops or pointerizes because deterministic code
  enforces them; every file no rule names stays byte-identical to its source,
  and the parity suite recomputes the declared projection on every build
  (issue [#410](https://github.com/gtrabanco/agentic-workflow/issues/410)).
- **Friendly commands.** Type `/unit-lane <slug>`, not
  `/skill:unit-lane <slug>`.
- **Routing you can forget about.** Nothing is configured by default: every
  command runs on the model you already have.

## Install

```sh
pi install npm:@gtrabanco/pi-agentic-workflow
```

Restart Pi. `/agentic-workflow-settings` and the workflow commands are then
available in any project. If you previously copied the skills into
`~/.pi/agent/skills` by hand, delete that copy — the package provides them, and
two copies means two versions of the same method.

## Commands

Every bundled skill whose frontmatter says `user-invocable: true` gets a command
with the same name. The list is read from the skills at startup, so adding a
skill adds its command — there is no alias table to keep in sync. Internal
skills that a user-facing skill composes (the review passes, the planning
preflight, the envelope contract) ship inside the package but get no command of
their own — they are composed by the ones above:

| Command | Use it for |
| --- | --- |
| `/audit-docs` | Check that docs, roadmap, code and the fix index agree. |
| `/audit-pr` | The merge gate: is this PR ready? |
| `/batch-scheduler` | Plan parallel-execution batches over the open work graph. |
| `/discover-repository-state` | Freeze verified repository facts. |
| `/execute-phase` | Implement the remaining phases of a planned unit. |
| `/fold-findings` | Repair persisted fix-now findings. |
| `/init-workspace` | Adapt the workflow scaffold to a repository. |
| `/log-session` | Log the session: the invocation is recorded and the entry target resolved by code; you write Summary, Decisions and Next. |
| `/product-audit` | Audit the product surface, not just the diff. |
| `/resolve-repository-state` | Resolve a contradiction in frozen facts. |
| `/review-change` | Review a change with the applicable axes. |
| `/triage-issue` | Verify an issue or finding against current code. |
| `/unit-lane` | Run the adaptive lane on a unit: triage, steps, evidence, release. |
| `/workflow-status` | Read-only state of the repository and roadmap. |

Arguments are forwarded verbatim: `/execute-phase P3 --fix` reaches the skill as
`P3 --fix`.

Three names are **code doors** rather than skill doors — they have no `SKILL.md`,
no argument hint and no catalogue entry, and each does its work in code before
any model turn starts:

| Command | Use it for |
| --- | --- |
| `/advance` | The deterministic conductor: sensor → decide → invoke the next stage (feature 62). |
| `/aw-index` | Index the project docs now: a progressive, resumable sync that reports pending chunks, the pinned embedding model, the last sync and any degradation ([#443](#the-aw-index-command-issue-443)). |
| `/log-session` | Log the session: the invocation is recorded and the entry target resolved by code ([#429](#the-log-session-code-door-issued-429)). |

`/log-session` is the one door of the three that still also ships a skill: its
name comes from the skill's frontmatter — routing, the settings console and the
configuration above read the same catalogue entry — but a handler runs first, so
the mechanical part is a fact the harness holds instead of a claim the model
makes. See [The `/log-session` code door](#the-log-session-code-door-issued-429).
`/aw-index` has no skill at all; see
[The `/aw-index` command](#the-aw-index-command-issue-443).

## The `/aw-index` command (issue #443)

`/aw-index` is the docs retrieval index's write path, reachable in one press. It
carries no `SKILL.md`, no argument hint, no context budget and no catalogue
entry — the same vehicle as `/advance` — because there is nothing for a model to
decide: the work is one sync, and the report is its receipt.

It spawns the runner crate's own entry point
(`@gtrabanco/agentic-workflow/bin/agentic-workflow.mjs`, resolved from this
package's dependency) as `doc --sync --json-only` in the project directory and
renders the report from that one envelope:

```text
aw-index — <store path>
files: <n> · chunks: <n>
pending: <n|unknown> · model: <pinned model|none>
last sync: scanned <n> · changed <n> · deleted <n> · embedded <n>
degradations: <comma-separated|none>
```

- **Progressive and idempotent.** The sync embeds only the chunks that have no
  vector, so a run killed part-way resumes from the remainder and re-embeds
  nothing that already landed.
- **Safe on a cold project.** No store yet is not an error: the sync creates it.
  Rebuild is deliberately not reachable here — that stays a manual
  `agentic-workflow doc --rebuild`.
- **Declared, never silent.** A provider that is down, a missing key or a model
  mismatch arrives in `degradations:`; a failed spawn, a non-zero exit or
  unparseable output is reported as an error instead of an empty report.

Since the write path is paced and retried, this command is also the honest way
to backfill a store that a rate limit interrupted — it makes progress on every
run instead of aborting on the first 429.

## Unattended durability — supervisor resume (issue #284)

`/advance` is the deterministic conductor: sensor → decide → invoke, one stage
per invocation, or the bounded full loop with `--continue`. A run that loses its
process (OOM, redeploy, suspend, `kill -9`) can be resumed by an external
restarter without a human — and the resume never trusts the restarter.

### What a run writes

Every run opens and closes a boundary in the run log
(`.agentic-workflow/advance-run.log`, `advance.runLogPath`), in the log's
historical row grammar:

```text
2026-11-09 15:04 — run/start — r-4242-1762700640000 pid=4242 — 0/12
2026-11-09 15:04 — invoke/invoke-proven-transition — /skill:execute-phase 284 P1 — 1/12
2026-11-09 15:06 — resume/detected — r-1200-1762700730000 iteration=1 last=/skill:execute-phase 284 P1 — 1/12
2026-11-09 15:06 — resume/verdict:RESUMABLE — /skill:execute-phase 284 P2 — 0/12
2026-11-09 15:09 — run/stop — stop-nothing-startable — 3/12
```

A run with a `run/start` and no later `run/stop` **died**. Every exit writes
its closer — a clean stop, the one-stage `--continue` hand-off and the
iteration-cap stop included — so the missing row is unambiguous.

### `--resume`

`/advance --resume` runs the crash reconcile before anything is invoked and
continues only on the sensor's verdict:

| Verdict (from `workflow-status`, `detail.crash_recovery`) | What the run does |
| --- | --- |
| `CLEAN` | Continues — nothing was in flight. |
| `RESUMABLE` | Continues from the sensor's own recommendation (the ledger's unique next phase). |
| `AMBIGUOUS` | **Stops before any invocation** with `stop-crash-ambiguous`; a human decides. |

Resume is automatic when the journal shows an interrupted run, and `--resume`
forces the reconcile even when it does not. A missing or unreadable verdict
fails closed to `AMBIGUOUS`. The journal is a hint, never an authority: the
verdict is recomputed from git and the docs on every run, exactly like
`--last-envelope`.

### The supervisor (operator-side, ask-first)

Nothing is installed by the package. `/advance --print-supervisor` prints a
dependency-free POSIX shell script; read it, then install it under the
supervisor you already run. It re-invokes `pi -p '--resume --continue'` and
restarts **only** when the previous attempt appended no `run/stop` row:

```sh
# systemd (user unit) — write the printed script to
# ~/.config/agentic-workflow/advance-supervisor.sh, then:
systemd-run --user --unit=aw-advance --collect \
  ~/.config/agentic-workflow/advance-supervisor.sh

# cron — one line, every 10 minutes; the script itself decides whether to restart
*/10 * * * * ~/.config/agentic-workflow/advance-supervisor.sh >> ~/aw-advance.log 2>&1

# launchd — wrap the same script in a plist with KeepAlive=false and
# StartInterval=600; the script is the whole restart policy.
```

The script's exit codes are the operator's signal:

| Exit | Meaning |
| --- | --- |
| `0` | The run reached a terminal row and stopped on its own. |
| `1` | The restart cap was exhausted — `supervisor/exhausted` is in the run log. |
| `3` | A human-decision stop: `stop-crash-ambiguous`, `stop-needs-input` or `stop-blocked`. The loop is not retried. |

Rows the restarter adds to the run log keep the same grammar:
`supervisor/restart` (attempt `k/CAP`) and `supervisor/exhausted`.

The minimum pi version is **1.3.0** (`sessionResumption` keeps the session's
tools across resumptions, so a resumed conductor keeps its command surface).
Set `PI_BIN` when `pi` is not on the service manager's `PATH`.

> The Pi Durable driver spike (issue #284's P2) is a separate, experimental
> phase and is not part of this surface.

## Workflow tools (deferred — issue #274)

Beside the commands, the package registers the five envelope-emitting
deterministic scripts as **deferred pi tools** in the `agentic-workflow`
namespace. Deferred means the model is never shown them: there is no standing
token cost, `tool_search` can find and activate them, and codemode scripts can
call them by name at any time.

| Tool | Wraps | Returns as `structuredContent` |
| --- | --- | --- |
| `agentic_workflow_status` | `scripts/workflow-status.mjs --json-only` | The validated Envelope v2 (the schema package's published `envelope.schema.json`, reused verbatim) |
| `agentic_workflow_diff_guard` | `scripts/diff-guard.mjs --json` | Measured lines/files/additions/deletions against the budget |
| `agentic_workflow_phase_lint` | `scripts/phase-lint.mjs` | `{ verdict, fingerprint, phases[], docFindings[] }` parsed from the byte-stable block |
| `agentic_workflow_audit_pr_gate` | `scripts/audit-pr-gate.mjs evaluate` | The merge verdict report (`verdict`, `action`, `actionReason`, head/pr) |
| `agentic_workflow_snapshot_verify` | `scripts/pre-execution-snapshot.mjs verify` | The freshness report (`current`, `digestMatches`, `structural`) |

Two properties hold for every tool:

- **The project's own checkout runs.** Each tool spawns the script in the
  session's cwd — the repository being worked on — never the package's pinned
  copy, and never an in-process import. The receipts are the same ones the
  skills' bash wording produces.
- **Red gates are errors with data.** A breach, a `BLOCKED` verdict, a stale or
  missing receipt, or a non-`MERGE-READY` gate returns `isError: true` with the
  structured result still attached, so a programmatic consumer reads findings
  as data instead of re-parsing an exit code.

The model-facing text of a successful run is the same JSON, so nothing is lost
for a consumer that ignores structured content. Skills never change: the bash
wording stays the portable path across agents, and these tools are the
pi-native shortcut — not a second source of truth for any receipt.

## The `/log-session` code door (issue #429)

A skill invocation is a context injection: nothing executes behind the slash, so
a model can read `/log-session` and *describe* it. This command is the pilot
instance of anchoring the invocation itself in code; the prose contract in
`skills/log-session/SKILL.md` stays the same and stays the door for agents
without this package.

What the handler does before the skill reaches the model:

- **records the invocation** at `.pi/.session-<id>.log-session`
  (`log-session-invocation@1`): the resolved target, the session id it belongs
  to, and the baseline an entry is measured against. Nothing scans for it and no
  session reads another's record; a run that recorded nothing claims no
  invocation.
- **asks the project's own writer** for the facts — `scripts/session-close.mjs
  render --kind auto`, through the runtime that launched pi — and carries its
  answer **byte for byte** into the directive. The package renders no journal
  entry of its own: feature 66's two-writer split holds, so where a project
  ships no writer script the directive says so instead of inventing facts.
- **resolves where the entry must land**: with the fragment carrier
  `.agentic-workflow/journal/` present, the exact fragment name from the
  grammar's owner (`agentic-workflow journal name --kind narrative` — the same
  function, verified against the CLI); without it, the `docs/LOGS.md` append.
  It creates nothing: the carrier's presence is the opt-in, and a project
  without a journal creates it once, itself.
- **keeps the routing chain**: the skill is dispatched with the resolved values
  as its request, so `commands: { "log-session": { model: … } }`, the busy
  guard, the in-flight refusal and the first-run hint all behave as they did.

Then, when the turn settles, the extension checks its own record: an entry at
the resolved path clears it; none does not pass in silence — one warning names
the path it waited for, said once per invocation. A record that no longer parses
is reported and left alone, never deleted on a guess.

The record is package bookkeeping, so ignore it beside the start marker:

```gitignore
.pi/.session-*.log-session
```

## Model routing

Two JSONC files, both optional. Model routing lives in this package's extension
file; cross-tool feature config (`logSession`, `memory`, `telemetry`, `guards`,
`advance`, `pathProtection`) lives in the base `agentic-workflow.json` at the
same scope (guide: `docs/workflow/CONFIG.md`, machine contract:
`@gtrabanco/agentic-workflow-schema`). Bun's native parser reads the file first
and the schema package's `parseJsonc` stays the acceptance boundary, so `//` and
`/* */` comments and trailing commas mean the same thing — and are refused with
the same line and column — under bun and node. The `/settings` console rewrites
this package's file as plain JSON on save: comments do not survive a save.

| Scope | Path | Read when |
| --- | --- | --- |
| Global | `~/.pi/agent/pi-agentic-workflow.json` (routing) · `~/.pi/agent/agentic-workflow.json` (features) | always |
| Project | `<repo>/.pi/pi-agentic-workflow.json` (routing) · `<repo>/.pi/agentic-workflow.json` (features) | the project is trusted |

```json
{
  "default": { "model": "anthropic/claude-opus-4-5", "thinking": "high" },
  "commands": {
    "unit-lane": { "model": ["anthropic/claude-sonnet-4-5", "openai/gpt-5.2"], "thinking": "medium" },
    "review-change": { "thinking": "max" }
  },
  "onUnavailableRoute": "stop",
  "onSettle": "keep"
}
```

A value is taken from the first place that declares it: **project command →
global command → resolved default route → shipped default**. `review-change`
above runs on the default model with `max` thinking; anything else runs on
whatever the session already had, because the shipped default route is
`{"model": "inherit", "thinking": "inherit"}`.

- `model` can be `provider/modelId` — the exact reference `/model` shows —
  `"inherit"`, or an ordered **array** of 1–4 references (a fallback chain). For
  a chain, dispatch probes each reference in order and applies the first one that
  resolves and has credentials, without touching the session while probing; when
  every entry is unusable the command stops (or, with `onUnavailableRoute`
  `inherit`, warns and runs on the current model), naming each candidate and why
  it was skipped. `unit-lane` above tries `anthropic/claude-sonnet-4-5` first,
  then `openai/gpt-5.2`.
- `thinking` is one of `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`,
  or `"inherit"`.
- `` `onSettle` `` is one of `"keep"` (the default) or `"restore"` — see
  [Your session after a command](#your-session-after-a-command).
- Unknown keys, `null`s and malformed references are **rejected**, not ignored: a
  typo that silently did nothing is the bug you would never find.

### Spawned passes (issue #201)

The passes a review spawns — the `review-*` finders, the verification pass,
the classifier, the debt transform — do not route through `commands`: they
run wherever the spawning agent sends them. The top-level `passes` key gives
the operator the approved table for them:

```json
{
  "passes": {
    "review-code": { "model": "acme/qwen3.6", "thinking": "low" },
    "verify": { "model": "auto" },
    "default": { "model": ["acme/qwen3.6", "google/gemini-3-flash"] }
  }
}
```

- Keys are the published pass names (`PASS_NAMES` in
  `@gtrabanco/agentic-workflow-schema`) plus the `default` escape. Unknown
  pass names are rejected.
- `model` is `"inherit"`, `"auto"`, a `provider/modelId` reference, or a
  1–4 reference chain. `"auto"` — only ever valid because the operator wrote
  it — delegates the model choice to the orchestrating agent.
- Resolution is deterministic and fail-closed, applied in code by the
  `resolve-passes` command of `@gtrabanco/agentic-workflow`:
  `passes.<name>` → `passes.default` → the configured cheap tier
  (`commands.execute-phase`) → inline at the orchestrator's model, recorded
  with a reason. A spawned pass never lands on an unapproved model silently.
- Project entries merge over global per entry and per key, like every other
  route scope; an untrusted project's file is not read at all.

The first workflow command you run after install says once that routing is
configurable, then never again. That acknowledgement is stored in
`~/.pi/agent/pi-agentic-workflow-state.json`, not in your config.

## Subagent layer (issue #260)

The execution topology behind the lane's orchestrate path: the orchestrating
agent designs, briefs and verifies while atomic work runs in context-free
subagents on the cheap tier the `passes` table approves. Two pieces ship
here:

- **Durable subagents** (`pi-extensible-workflows` 6.3.0, pinned — the
  substrate the owner adopted in 2026-11-08 for issue #260). The package
  registers only that extension's five tools: `subagents_run`,
  `subagents_inspect`, `subagents_steer`, `subagents_stop`,
  `subagents_retry` — subagent runs persist durable records with their own
  model/tools/cost accounting, and a crash reconciles the record instead of
  losing the work. The workflow-engine, starter and trajectory extensions
  are **not** loaded. To disable the substrate entirely, remove the
  `./node_modules/pi-extensible-workflows/dist/subagents/index.js` line from
  this package's `pi.extensions` (a local `package.json` edit — pi has no
  per-extension switch).
- **Resource limits, optional** (owner decision 6, 2026-10-28): the
  top-level `subagents` config key bounds the trial envelope — parallelism
  plus explicit caps. Absent, the layer self-detects the host with
  conservative defaults (small hosts spawn one subagent at a time; the
  2026-10-27 OOM's lesson: every spawn is a bounded, observable trial with
  expectations declared in the brief, never an unobserved flood).

```json
{
  "subagents": {
    "parallelism": "auto",
    "memoryCap": "12 of 64 GB",
    "threadCap": "2 of 80 threads"
  }
}
```

- `parallelism` is `"serial"`, `"auto"` (derived from the host: ≤4 GB or
  ≤2 cores → serial; ≤8 GB or ≤4 threads → 2; larger hosts are bounded only
  by the caps), or a positive integer.
- `memoryCap` / `threadCap` are the `"<n> of <m> <unit>"` strings; a cap only
  ever bounds tighter than the host. Unknown inner keys are rejected.
- Admission is deterministic and fail-closed, applied in code by the
  `resources` command of `@gtrabanco/agentic-workflow`:
  `resources detect` prints the self-detected envelope; `resources admit`
  refuses a spawn whose brief declares no `expected_duration`/`requirements`,
  refuses a requirement over the cap, and blocks an identical re-run after a
  recorded bound-kill — re-decide with the receipt, never retry blind.
  `resources check` reads a recorded trial's receipt for the check-in verdict
  (within or over the estimate, unmeasurable, bound-killed) and
  `resources bound` prints the `systemd-run` trial envelope with its
  after-exit `systemctl show` receipt read.
- Entries merge project-over-global per key, like every other config scope.

## Model profiles

The routing config above is the **`default` profile**. A profile is one coherent
set of routes, and you can define as many as you like under `profiles`:

```json
{
  "recommendedModels": true,
  "profileOrder": ["work", "cheap"],
  "profileFallback": { "applyTo": "flow", "resume": "continue", "retryAfterSeconds": 86400 },
  "profiles": {
    "work": { "default": { "model": "anthropic/claude-opus-4-5", "thinking": "high" } },
    "cheap": { "default": { "model": "openai/gpt-5.2", "thinking": "medium" } }
  },
  "default": { "model": "inherit", "thinking": "inherit" },
  "commands": { "review-change": { "thinking": "max" } }
}
```

- **`profileOrder`** — the preference chain, first = most preferred/active. For each
  command the router probes the profiles in order and the **first whose model is
  usable** serves it; when the preferred profile's model is unavailable it falls
  through to the next. A profile participates only for keys it actually declares.
- **`profiles`** — unlimited named profiles. The implicit **`default`** profile is
  the top-level `default` + `commands` above, so a config with just those two keys
  resolves exactly as before.
- **Companion preset profiles (issue #388).** With `recommendedModels: true`
  (the default), when an installed companion preset package contributes a
  provider preset, its code-only profile(s) are appended to the end of the
  chain (or used alone when you set no `profileOrder`). It carries the
  vendor's own ladder and tier policy; the main package ships provider-neutral
  and names no provider — see `packages/` for the available companions. With
  **no** companion installed, `recommendedModels: true` is a documented no-op
  — every command routes on your session's model.
  A preset may carry several **named profiles** (issue #388 amendment 2) — a
  cost-posture catalog such as `quality` / `balanced` / `economy` — each under
  the chain name `<provider>.<profile>`; the bare `<provider>` entry resolves
  the preset's default profile. Select with **`presetProfile`** — one profile
  name or an ordered array (first = most preferred; when a profile's models
  are unusable, profile fallback demotes to the next entry, which is how you
  ride down the catalog as credits run out):

  ```json
  { "presetProfile": ["quality", "economy"] }
  ```

  Profile names are companion-defined; the registry filters unknown names at
  chain build, and if a selection names nothing the preset carries, the
  preset's default profile is used (a typo never silently drops the provider
  out of the chain). Any route you declare — including your own `profiles`
  entry under the same chain name — wins over a preset profile. Set
  `recommendedModels: false` to switch preset profiles off; the settings
  console writes the key explicitly on save when a preset provider is
  available. A preset may also read the generic `tierRouting` opt-out
  (`false`, or `{ "enabled": false }` global / `{ "skills": { … } }` per
  skill) — the cost policy the names stand for lives in the companion, never
  here.
- **`profileFallback`** — what happens when the preferred profile's model is
  unusable:
  - `applyTo`: `"flow"` (default) records the switch so later commands keep using the
    fallback profile; `"command"` falls back for this command only and the next
    command retries the preferred profile.
  - `resume`: `"continue"` (default) lets the in-flight stage run on the fallback
    profile; `"restart"` makes the `advance` conductor defer the switch and re-run
    the stage under the fallback profile instead.
  - `retryAfterSeconds`: how long a `flow` demotion lasts before the preferred
    profile is probed again (default `86400`, one day).
- **Rotation.** `/agentic-workflow-settings` is scope → profile → routes: pick the
  scope, pick the profile to edit, then edit its routes. `Rotate the active profile`
  moves a profile to the front of `profileOrder` and clears any recorded demotion.
  A preset-contributed profile is shown but not editable — create a profile to
  override it.

## Serena (native MCP registration)

Serena's language-server tools reach pi through Serena's own MCP server — the
interface Serena documents, tests and keeps version-stable — not through a
bundled bridge. This package ships no Serena dependency; provisioning is one
consented step:

```sh
pi mcp add serena -- serena start-mcp-server --context claude-code
pi mcp list   # verifies the connection
```

That writes the user-level `~/.pi/agent/mcp.json` (add `--local` for a
project-level `.pi/mcp.json`, read only after project trust is granted). The
tools appear under the `mcp__serena__<tool>` namespace — `find_symbol`,
`find_referencing_symbols`, `get_symbols_overview`, `get_diagnostics` and the
rest — and pi's per-server `toolExposure` config narrows the surface if the
full toolset is more than a session needs. The machine half is the same local
tool as before: `uv tool install -p 3.13 serena-agent` (or `/init-workspace`,
which offers the install, the registration and the global trust append in one
consented question).

**You must run `/init-workspace` once per project.** This package never writes or
repairs `.serena/project.yml` — `init-workspace` is its only writer, so there is
one implementation of that contract and no drift. A project whose config is
missing, lists no `language_servers`, or was provisioned by an older bundled
`init-workspace` gets **one** notification per session state pointing at
`/init-workspace`; the latch lives in this package's state file, so a restart does
not re-nag.

Nothing is uploaded and no key is configured.

**Switching it off.** Serena is an MCP server now, so pi's own MCP controls are
the off switch: `pi mcp remove serena` unregisters it, `/mcp` inside a session
disables or re-enables it, or set `"enabled": false` on the entry in
`~/.pi/agent/mcp.json` to keep it listed but disconnected.

## Path protection (optional)

The Tier 2 preventive guard blocks a `write` / `edit` tool call to an existing
protected path with no matching justification record. Its policy is the shipped
`path-protection-policy@1` default, tightened by an optional `pathProtection`
key in the same config files:

```json
{
  "pathProtection": {
    "protectedGlobs": ["secrets/**"],
    "requirements": { "post-freeze": { "modify": "approval" } }
  }
}
```

The override is **tighten-only**: `protectedGlobs` are unioned with the shipped
globs, and each `requirements` entry takes the stricter of the two — so a removal
or a lowering is ignored (the shipped protection stays in force) and reported
once per session as a `pi-agentic-workflow: path protection — <code>: <detail>`
notification. `requirements` is keyed by phase state (`pre-freeze`, `post-freeze`,
`always`) and operation (`create`, `modify`, `delete`, `rename`), with values
`none` < `justification` < `approval`. To allow a protected edit, record the
matching `path-protection-records@1` `justification` row in the unit's
`decisions.md`.

## Memory substrate — Engram (optional, ask-first)

The workflow's units save and recall their decisions through Engram, the memory
layer its skills document. This package can register Engram's MCP server for the
session, and it does so **only when you say so**:

```json
{
  "memory": { "engram": true }
}
```

Registration goes through Pi's own `registerMcpServer`, which is
**session-scoped and not persisted** — the package registers on every session
start, so nothing outlives the session and nothing is written to your `mcp.json`
behind your back. Five rules decide the outcome, and the package reports it
verbatim:

| Situation | What happens |
|---|---|
| no `memory.engram` opt-in (the shipped default is `false`) | nothing is registered and nothing is said (the opt-out stays quiet) |
| no readable opt-in — the file exists but does not validate | nothing is registered; you are told the config is invalid, because unreadable consent is never read as a refusal you made |
| no `engram` binary on `PATH` | nothing is registered; you are told the install route |
| you already declared `engram` in a `mcp.json` Pi reads — your user file, or `<cwd>/.pi/mcp.json` in a trusted project | nothing is registered — your declaration takes precedence |
| binary present, opted in | the server is registered and the notification states exactly what was written |

Install Engram with:

```sh
pi install npm:gentle-engram@latest
```

That is the only documented route on purpose: the CLI's own setup subcommand
pins whatever version ran it and keeps serving that version until it is run
again, so an updated binary can sit unused behind a stale registration.

An older Pi host whose `ExtensionAPI` has no `registerMcpServer` is reported
instead of failing the session. The workflow-side protocol — when units save,
the recall order, the degraded path — lives in `unit-lane`'s memory reference,
not here.

## Session journal — auto log-session (optional)

One mechanical entry in the project's `docs/LOGS.md` when a session ends: the
branch, how many commits the session made, and the paths it touched. No model
runs, nothing is summarised, and no prompt text, model output or file content
ever enters the entry — the same git facts the template's Claude Code hook
writes, byte for byte (a test runs that hook and diffs the bytes).

**Off by default, and it never creates the journal.** A project participates by
carrying `docs/LOGS.md`; enable the writer in the feature config file
(`.pi/agentic-workflow.json`; the project file wins over the global one):

```json
{ "logSession": true }
```

`logSession` accepts `true`/`1`/`"on"` (append), `false`/`0`/`"off"` (off), or
an object `{ "enabled": true, "publisher": { "command": [...], "timeoutMs": 5000 } }`.
The old `autoLogSession: { "mode": "mechanical" }` form is gone; `config
validate` names it and `docs/workflow/CONFIG.md` has the migration table.

Two cases write nothing at all, on purpose: a project that is not a git
repository (there are no facts to record), and a session that started before
the journal existed — the journal's presence at session start is the opt-in,
so creating `docs/LOGS.md` mid-session opts in the *next* session, not the
running one. Both refusals are silent because a refusal note would itself be
the residue a non-participating project must not carry.

What it does per session, all of it git:

- on start, records `.pi/.session-<id>.start` (`HEAD` sha, epoch, timestamp);
- on shutdown, appends **one** entry and removes that marker. A marker left by a
  crashed session is never adopted — each session only ever reads its own, and
  two sessions in one workspace stay two sessions.

The marker is this package's own bookkeeping, so add it to your ignore file (git
tracks nothing while a session runs; a crash can leave the file behind):

```gitignore
.pi/.session-*.start
```

**Publishers.** The local append is one strategy. Declare a second one and it
receives the same frozen payload (`timestamp`, `branch`, `reason`,
`commits{count,range}`, `files[]`) as JSON on stdin — an HTTP endpoint, a queue,
a path outside the repo, a log sink, whatever the argv runs:

```json
{
  "logSession": {
    "enabled": true,
    "publisher": { "command": ["curl", "-sS", "-X", "POST", "--data-binary", "@-", "https://example.test/journal"], "timeoutMs": 5000 }
  }
}
```

The local entry is written first and always kept: a publisher that fails, times
out or cannot be spawned is dropped — never retried, never blocking the
shutdown, and never costing the entry that is already on disk. **Paths travel**
in the payload; the destination is the one you declared.

**Independent of telemetry.** Turning this off keeps the per-unit cost sample;
turning telemetry off keeps the entry. Rich, narrative entries stay
`/log-session`'s job — this writer only ever produces the mechanical block.

Regenerate an entry without a session (a CI job, a test, a byte diff):

```sh
printf '%s' '{"timestamp":"2026-11-04T15:12Z","branch":"main","reason":"quit","commits":{"count":0,"range":null},"files":[]}' \
  | npx @gtrabanco/agentic-workflow log render --facts -
```

## State Flow (optional — issue #174)

An opt-in, command-scoped **episode lifecycle**: the long-running executor
commands (`/execute-phase`, `/fold-findings`) automatically enter and leave an
explicit execution-state mode, so their many-step runs keep compact working
state instead of replaying a growing transcript. You never type a state-flow
command on the happy path. Design, plan, review and audit commands are never
touched — they rely on readable history and clean-context receipts.

**Off by default, and the backend is a soft dependency.** The lifecycle is
driven through [llblab/pi-state-flow](https://github.com/llblab/pi-state-flow)
(a Pi extension inspired by the SKILL.state paper) if — and only if — it is
installed:

```bash
pi install npm:@llblab/pi-state-flow
```

Nothing in this package requires it: a session without the backend runs every
command exactly as before.

### Config

Both config files (`~/.pi/agent/pi-agentic-workflow.json`; project
`.pi/pi-agentic-workflow.json` — the project file wins per field):

```json
{
  "stateFlow": {
    "enabled": false,
    "backend": "pi-state-flow",
    "commands": ["execute-phase", "fold-findings"],
    "stopOn": "command_settled",
    "onBackendMissing": "noop"
  }
}
```

| Field | Meaning |
| --- | --- |
| `enabled` | Master switch; shipped `false` until you dogfood it |
| `backend` | v1: `"pi-state-flow"` only |
| `commands` | The allowlist of friendly command names (no leading slash); merges whole, never per entry |
| `stopOn` | v1: `"command_settled"` — the episode ends when the command settles (the same moment model routing restores the session) |
| `onBackendMissing` | `"noop"` (default; the command runs, one warning per session) or `"refuse"` (the command is refused before anything is dispatched) |

The same switch is editable in `/agentic-workflow-settings` (the **State Flow**
section shows the effective status — enabled, allowlist, backend, missing
policy — beside the edit path).

### Lifecycle

For an allowlisted command with `stateFlow.enabled: true` and the backend
present: the episode starts just before the skill prompt is sent, and it stops
when the command settles — **including on abort or error**, so a cancelled run
never leaves the session in state-mode. Only one package-owned episode exists
at a time: a second allowlisted dispatch stops the previous episode first. The
package stops only an episode **it** started; a mode you selected manually is
yours.

### Limitations (v1 vs full SKILLSTATE)

- v1 is the episode lifecycle only — not SKILLSTATE's per-tool-step projection
  (each LLM call seeing only the skill spec, the structured state and the last
  observation). The backend keeps Pi's native trace and does its own state
  compilation.
- A single logical execution spanning several user prompts (an `/execute-phase`
  phase continued by hand) is covered only for the first command turn: the
  episode stops when that turn settles. A follow-up can track the episode until
  a phase receipt or roadmap advance instead.
- An operator-started episode cannot be detected (the backend exposes no
  machine-readable mode read): the package never stops what it did not start,
  and re-selecting the mode re-runs the backend's bootstrap in an existing
  conversation.
- Orchestration coordination (issue #174, refs #260): the lifecycle follows the
  command turn. #260's orchestrator is one turn that spawns subagents and waits,
  so `stopOn: "command_settled"` covers it; a future orchestration that moves
  execution out of the command turn will need the episode to follow the spawned
  work.

The paper behind the design: Sanket Badhe, Priyanka Tiwari, and Jonghyun Chung,
"SKILL.state: Scalable Long-Horizon Agent Skills," arXiv:2608.26263 — cited in
the root README's References together with the prior-art extension.

## Workflow seam hooks (optional, consent-gated — issue #413)

Your project can declare commands that run deterministically at the workflow's
own lifecycle points (seams) — checks at `pre:commit`, notices at
`session:start`. The dispatcher runs them with **no model in the loop**: argv
spawn, bounded output, hard timeout, and a block at the seam with the declared
requirement quoted when a check fails.

**Nothing runs until two explicit gates are open** — off by default, proven by
test:

1. **Consent** — `/init-workspace` writes your project's entry into the global
   consent store (`<agentDir>/seam-hooks-consent.json`, keyed by absolute
   project path) after you say yes. No entry, no execution — ever. An `enabled`
   group without that entry announces itself on the first seam **once per
   project session** (a new session hears it again) and does not run until you
   consent.
2. **Opt-in per seam** — every matcher group in your `.pi/hooks.json` must set
   `"enabled": true`. Declaring a hook is not consent.

`<agentDir>` is pi's global agent directory — `getAgentDir()` in the extension,
`~/.pi/agent` on a default install (the same directory that holds
`pi-agentic-workflow.json` and `mcp.json`).

### Config form

`.pi/hooks.json` (project) or `<agentDir>/hooks.json` (global, same `~/.pi/agent`
default), in the Claude Code `hooks.json` shape, so existing declarations port:

```json
{
  "hooks": {
    "pre:commit": [
      {
        "enabled": true,
        "hooks": [{ "type": "command", "command": "bun run lint", "timeout": 30 }]
      }
    ]
  }
}
```

Precedence mirrors the routing config: both files load, global first, project
second; the project's flags win. While the project is untrusted, the project
file is never read.

### Event compatibility table

Every workflow seam is a member of the closed `PROJECTION_SEAMS` vocabulary
(`@gtrabanco/agentic-workflow-schema`); growing it is a schema-const change,
never a config trick. Claude Code event names are accepted where they map 1:1.

| Seam (native name) | Fires when | Claude Code alias |
|---|---|---|
| `session:start` | the pi session starts | `SessionStart` |
| `session:end` | the pi session shuts down | `SessionEnd` |
| `unit:start` / `unit:end` | the lane's unit boundary — validated, auto flags allowed; firing lands with the lane-boundary wiring | — |
| `phase:start` / `phase:end` | the executor's phase boundary — same status as `unit:*` | — |
| `pre:commit` | a bash `git commit` is intercepted, before it runs — a failing check **blocks the commit**. The matcher reads the invocation, not its text: `git -C <dir> commit`, `git -c k=v commit`, `git --git-dir=<p> commit` and `GIT_DIR=x git commit` all reach the seam | — |
| `post:commit` | after a `git commit` succeeded — a failing check is reported, never retro-blocking | — |
| `pre:push` | a bash `git push` is intercepted, before it runs — a failing check **blocks the push** | — |

Any other Claude Code event name (`PreToolUse`, `Stop`, …) is refused
`config-invalid`: this dispatcher has no seam for it, and the refusal says so
rather than silently dropping the declaration.

### Execution contract

- **No shell.** Commands are tokenized into an argv and spawned with
  `shell: false` through the package's runtime module (`bun`-else-`node`, the
  runtime pi itself runs under). Shell metacharacters (`| & ; < > ( ) $ \` *
  ? [ ] { } ~ #`, newlines) are refused before any process exists — a hook
  that needs a pipeline declares a wrapper script.
- **Bounded.** Captured output is capped per stream (32 KiB) with a
  `[truncated]` marker and the rest drained — a talkative hook costs no memory
  and no verdict, because the verdict is the exit code, never the volume. Every
  hook also has a hard timeout (declared `timeout` seconds, default 60, capped
  at 600).
- **Fail-closed.** Exit 0 → `allow`. Non-zero, a timeout, or a command that
  cannot start at all (missing binary, no execute bit) → `block`, and the
  teaching message quotes the declared requirement exactly as declared (its own
  quoting included), with the seam, the exit code or spawn failure, and the
  bounded output. `pre:commit`/`pre:push` blocks stop the intercepted git
  command; `session:*` and `post:commit` cannot block what already happened, so
  they report the same message instead of swallowing it.
- **Shutdown is bounded.** `session:end` runs while pi is tearing the session
  down, and pi awaits the handler — so the seam's report lands instead of dying
  with the process. Awaiting has a price, so this seam alone carries a 5 s
  budget that overrides a larger declared `timeout`: a slow check is reported as
  a timeout inside the bound rather than holding your quit.
- **Auto commit/push are explicit per-seam flags, never defaults.**
  `"autoCommit": true` (+ required `"commitMessage"`) and `"autoPush": true`
  are valid only on `phase:end` / `unit:end` groups, and run only after the
  seam's hooks all allow (`git add -A` → `git commit -m <declared>` → `git
  push`). Refused anywhere else.
- **Degradation is declared.** Missing config → quiet no-op. Present-but-broken
  config → the hooks announce the problem **once** per project session (and the
  next session hears it again) and then behave as a no-op — never a silent
  pass, never a throw into your session.
- **What it does not cover.** The matcher sees the bash command the model runs.
  A git call it cannot see — inside a script, behind `bash -c`, from another
  tool — is not intercepted: this is a guardrail on the agent's own commands,
  not an enforcement boundary. Your commit message's contents, your shell
  aliases and your own fingers are equally outside it.

The consent marker and the hook config are yours: this extension never writes
either. `/init-workspace` writes the consent entry; you write `.pi/hooks.json`.

## When a configured model is unavailable

Default: the command **refuses to start** and tells you why — the model is not in
the registry, has no credentials, or could not be selected. Nothing is sent, so
nothing runs on a model you did not pick. To run anyway on the current model, set:

```json
{ "onUnavailableRoute": "inherit" }
```

## Your session after a command

By default (**`onSettle: "keep"`**), the routed model and thinking level **stay**
in the open chat window once the command settles. If `unit-lane` runs on
`glm-5` and you want to tweak the SPEC it produced, your next prompt keeps
running on `glm-5` — same for a follow-up question. When you don't need the
heavy model, switch it yourself with `/model` (or Ctrl+P) to something cheaper;
nothing restores over your choice.

To bring back the pre-command model and thinking level after a command settles,
set:

```json
{ "onSettle": "restore" }
```

(The `restore` mode is the historical AC8 contract: after a routed command the
session is put back the way you had it — the model *and* the thinking level,
because selecting a model can move the level. If you change the model yourself
mid-turn, with `/model` say, nothing is restored: your choice wins, and the
command says so. Change only the thinking level and you keep it while the model
still comes back.)

## Settings console

```
/agentic-workflow-settings
```

`/aw-settings` is a shorthand for the same console.

Shows what each command runs on right now, and which file is refusing to parse,
then lets you edit **one file at a time** and save to global or project scope. It will not save over a file it cannot parse, and it will not
touch the project file while the project is untrusted.

The console's model and thinking pickers are searchable and windowed: typing
narrows the list, the cursor stays on screen, a position indicator shows where
you are, and the value currently in force is pre-selected and labelled
`(current)` / `(default route)`. A route edit asks which field to change
(model, thinking), so a no-change save leaves the file byte-identical; the
model field can build an ordered fallback chain (`a/m1 → b/m2`); and one pass
can apply or clear a route across several commands, warning per command when a
reference is missing from the live registry. Outside a TUI session the pickers
fall back to a plain prompt, so the console never dead-ends. Lists longer than
24 options never reach a single dialog either: over the cap the model picker
asks for the provider first, and an overlong provider or model list pages
(`More options…` / `◀ Previous page`) instead of crashing the host's select
dialog.

## Troubleshooting

| You see | Means |
| --- | --- |
| `refused: invalid configuration` | A config file was rejected. The same message names the field, e.g. `$.commands.unit-lane.model`. Run `/agentic-workflow-settings` to see the file, or fix the JSON. |
| `stopped: the configured model` … `is not in the model registry` | The reference is wrong or the provider is not configured. Use `/model` to see the exact `provider/modelId`. |
| `has no configured credentials` | The model exists but you cannot use it yet. Authenticate, or set `onUnavailableRoute` to `inherit`. |
| `could not be selected` | Pi refused the switch. The command stops with the reason — unless `onUnavailableRoute` is `inherit`, in which case it warns and runs on your current model. |
| `refused: the agent is busy` | A turn is running. Wait for it to settle. |
| `is still routed` | The previous routed command has not settled yet. |
| `leaving the model you chose in place` | (in `restore` mode) You changed the model during a routed turn, so nothing was restored — your choice won. |
| `these configured routes match no command` | A `commands` key names nothing. Fix the spelling or delete the entry. |

## Notes

- Verified against the peer floor Pi 1.1.0 (2026-11-03): the session telemetry
  reads `tool_execution_end.durationMs`, which 1.0.4's published types do not
  carry and 1.1.0's do (`npm pack @earendil-works/pi-coding-agent@1.0.4` and
  `@1.1.0`, then `dist/core/extensions/types.d.ts` — 0 vs 2 occurrences). The
  pre-telemetry surface was verified behaviourally at Pi 0.99.1 (2026-09-29)
  (`pi install`, package skills, friendly command registration, routed set/clear,
  settings console round-trip, `sendUserMessage` with prompt template expansion).
  Also verified against Pi 1.5.0 (2026-11-02) via a local two-leg `tsc --noEmit`
  run (legs `0.99.1` + `latest`, the `latest` leg resolving to pi 1.5.0;
  COMPAT-OK); continuously against the
  `latest` dist-tag by the `pi-compat-guard` PR gate (the leg is a moving tripwire,
  not a pinned version — a breaking release shows red here first).
- The package declares Pi as a peer dependency; it bundles no copy of Pi.
- Skills can instruct the model to run commands. Review them as you would any
  third-party package.

MIT · [Repository](https://github.com/gtrabanco/agentic-workflow) ·
[`docs/features/27-pi-agentic-workflow/`](../../docs/features/27-pi-agentic-workflow/SPEC.md)
