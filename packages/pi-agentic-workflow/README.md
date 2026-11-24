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
| `/agentic-workflow-doctor` | Batch-triage the ceremony failures this project's own record carries, anonymized and routed upstream with consent. |
| `/audit-docs` | Check that docs, roadmap, code and the fix index agree. |
| `/audit-pr` | The merge gate: is this PR ready? |
| `/aw-doctor` | The short name for `/agentic-workflow-doctor`. |
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
rejected: none | <n> chunk(s) · <status> <provider's own words> (+<n> more)
degradations: <comma-separated|none>
next: <n> chunk(s) remain unembedded — …   (only while pending > 0)
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
- **A refusal is not an outage** (fix #540). When the provider rejects a request
  (a non-rate-limit `4xx`, typically a chunk larger than its input window), the
  sync skips that batch, embeds the rest and reports `embeddings-request-rejected`
  with the provider's status and body excerpt in `rejected:`. The chunks stay
  pending, and the `next:` line names the remedy: re-running is resumable, and
  `agentic-workflow doc --rebuild` re-chunks under the configured
  `provider.chunk_limit` and embeds in the same pass.

Since the write path is paced and retried, this command is also the honest way
to backfill a store that a rate limit interrupted — it makes progress on every
run instead of aborting on the first 429.

## Doc-index embedding profile — a preset's `index.json` (issue #541)

The `doc` engine is provider-neutral: it reads the committed
`.agentic-workflow/index.json` and nothing else. What a provider *needs* — its
endpoint, model, key variable, a chunk limit its input window tolerates, pacing
its rate limit tolerates — is provider data, so a companion package ships it as
a preset's **embed profile** and this package materializes it on request.

**The seam.** `ProviderPreset.embedProfile` is the literal `provider` block
(`baseUrl`, `model`, `envVar`, `chunk_limit`, `max_request_chars`, `pacing`) the
companion wants a project to use. It is data: this package names no provider,
and the preset is refused at registration if the runner crate's schema would
refuse it, so a broken companion fails loudly instead of staging an unusable
config. `getEmbedProfiles()` is the read surface.

**The surface.** `/agentic-workflow-settings` → `Doc index embedding profile`
shows, per key, whether the value in force came from the preset, from you, or
from the crate's shipped default:

```text
doc-index embedding profile — <provider>
  <root>/.agentic-workflow/index.json (absent — the file is created on write)
  provider.baseUrl = (none — keyword-only) · default (preset: https://…)
  provider.model = mine-embed · user (preset: acme-embed-1)
  provider.pacing.batchSize = 6 · preset
  <n> key(s) to fill from the preset · <m> kept as written
```

- **Nearest instruction wins, per key.** A value your `index.json` already
  carries always wins — the write fills only the keys that are *absent*, never
  rewrites one (not even one the preset wrote earlier), and decides `pacing`
  knob by knob. That makes a second run a no-op, and it means a later change to
  the preset's values reaches your file only if you delete the key and re-apply.
- **Consent, every time.** The action asks before writing, writes nothing on a
  no, writes nothing outside an explicit answer, and refuses while the project is
  untrusted (the index config is committed project state). An `index.json` that
  does not parse is refused by name and left alone.
- **Validated by the crate, never here.** The candidate file is judged by the
  runner crate's own `validateIndexConfigObject` before a byte is written, so a
  bad preset value is refused rather than staged and this package keeps no copy
  of the schema.
- **Origin is a comparison, not a record.** `preset` means the value in force
  equals the preset's (whoever wrote it); `user` means a different value is in
  force; `default` means the key is absent and the crate's shipped value is what
  runs today. Nothing is stored in your file to say so.
- **Why not automatically.** Nothing is written at extension load, in a query, or
  by `doc --sync`: a committed config file changes only when you say so.

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

Beside the commands, the package registers the envelope-emitting deterministic
scripts — plus one generic door for the subcommands without a typed tool — as
**deferred pi tools** in the `agentic-workflow` namespace. Deferred means the
model is never shown them: there is no standing token cost, `tool_search` can
find and activate them, and codemode scripts can call them by name at any time.

| Tool | Wraps | Returns as `structuredContent` |
| --- | --- | --- |
| `agentic_workflow_status` | `agentic-workflow workflow-status --json-only` | The validated Envelope v2 (the schema package's published `envelope.schema.json`, reused verbatim) |
| `agentic_workflow_diff_guard` | `agentic-workflow diff-guard --json` | Measured lines/files/additions/deletions against the budget |
| `agentic_workflow_phase_lint` | `agentic-workflow phase-lint` | `{ verdict, fingerprint, phases[], docFindings[] }` parsed from the byte-stable block |
| `agentic_workflow_audit_pr_gate` | `scripts/audit-pr-gate.mjs evaluate` | The merge verdict report (`verdict`, `action`, `actionReason`, head/pr) |
| `agentic_workflow_snapshot_verify` | `agentic-workflow pre-execution-snapshot verify` | The freshness report (`current`, `digestMatches`, `structural`) |
| `agentic_workflow_run` | any other runner subcommand (`unit-route`, `needs-input`, `ceremony`, …) | `{ subcommand, stdout, stderr, exitCode }` — the command's own output, and a non-zero exit arrives as `isError` carrying it |

Two properties hold for every tool:

- **One pinned runner over the project's bytes.** Each tool spawns the
  pinned package's `agentic-workflow` bin (`workflow-status`, `diff-guard`,
  `phase-lint`, `pre-execution-snapshot`, or whatever subcommand
  `agentic_workflow_run` was given) with the session's cwd as the project
  root — the pin decides the behaviour and the project's tree supplies the
  data; `audit-pr-gate` still runs the project's own
  `scripts/audit-pr-gate.mjs`. The command itself is composed by the crate's
  own resolver: the installed dependency first, its closed runner set only when
  that dependency is missing. The receipts are the same ones the skills'
  symbolic `runner <subcommand>` wording produces.
- **Red gates are errors with data.** A breach, a `BLOCKED` verdict, a stale or
  missing receipt, or a non-`MERGE-READY` gate returns `isError: true` with the
  structured result still attached, so a programmatic consumer reads findings
  as data instead of re-parsing an exit code.

Two properties guard the call itself (issue #678):

- **The host's signature is the adapter's job.** pi calls a tool as
  `execute(toolCallId, params, signal, onUpdate, ctx)`; the tools' own module is
  Pi-free and declares `execute(params, cwd)`, and the adapter translates the
  host's five arguments into that pair. The project a tool runs against is
  `ctx.cwd` — the session's project, never the process's directory.
- **An unreadable project refuses loudly.** When the cwd cannot be read, the
  run returns `isError: true` with a `sensor-degraded` record whose `detail`
  names the unresolved path (`cwd-unresolved: …`). It never falls back to
  `process.cwd()` and never reports another project's numbers as this one's.

The model-facing text of a successful run is the same JSON, so nothing is lost
for a consumer that ignores structured content. Skills never change: the bash
wording stays the portable path across agents, and these tools are the
pi-native shortcut — not a second source of truth for any receipt.

### The symbolic `runner` citation reaches the session (issue #696)

A packaged skill states its command as `runner <subcommand> [args...]` and never
spells a launcher, so a session that has not read
`runner-contract/references/RUNNER.md` used to take the citation literally:
`runner batch-scheduler` in bash, exit 127, and then a hunt through this
package's tree for a binary the contract never installs. Three surfaces close
that gap, and exactly one of them owns the words:

- **The bundle delivers the mapping.** `scripts/bundle-skills.mjs` splices the
  `runner-mapping@1` block — owned by `RUNNER.md` — into every staged `SKILL.md`
  that cites the symbolic form, immediately after the frontmatter, so the
  mapping arrives with the skill and the first plausible reading is the tool.
  A skill that cites nothing is untouched; the block's cost is declared (`132`
  est, measured after the block was written, never before); and the parity suite
  recomputes the injection from the owner text instead of trusting the build, so
  a hand-edited copy fails its suite.
- **The bash seam refuses the shell form.** A bare `runner` head is refused
  before anything runs (`dist/extension/runner-citation.js`), with the same
  block the bundle carries and the subcommand named. A path-qualified spelling
  (`./runner …`) is a real binary a project may ship, and is never judged.
- **The repair never leaves the project.** See the shell-tool-choice section
  below.

Outside a pi session nothing changes: the closed set and the pin stay in the
standalone `RUNNER.md`, and no skill spells a launcher.

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
file; cross-tool feature config (`logSession`, `memory`, `telemetry`, `guard`,
`gitIdentity`, `advance`, `pathProtection`, `contentGuard`) lives in the base
`agentic-workflow.json` at the
same scope (guide: `docs/workflow/CONFIG.md`, machine contract:
`@gtrabanco/agentic-workflow-schema`). Bun's native parser reads the file first
and the schema package's `parseJsonc` stays the acceptance boundary, so `//` and
`/* */` comments and trailing commas mean the same thing — and are refused with
the same line and column — under bun and node. The `/settings` console edits the
file in place, so a save keeps your comments and only what changed is rewritten:
adding or removing a key re-renders the object that holds it, and a removed key
takes its own comment with it.

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

- **Durable subagents** (`pi-extensible-workflows` 6.4.0, pinned — the
  substrate the owner adopted in 2026-11-08 for issue #260 and moved to 6.4.0
  on 2026-11-17). The package
  registers only that extension's five tools: `subagents_run`,
  `subagents_inspect`, `subagents_steer`, `subagents_stop`,
  `subagents_retry` — subagent runs persist durable records with their own
  model/tools/cost accounting, and a crash reconciles the record instead of
  losing the work. The workflow-engine, starter and trajectory extensions
  are **not** loaded. To disable the substrate entirely, remove the
  `./node_modules/pi-extensible-workflows/dist/subagents/index.js` line from
  this package's `pi.extensions` (a local `package.json` edit — pi has no
  per-extension switch). Since 6.4.0 the extension ships **no release notes**
  of its own (its startup notice is gone and `changelog-state.json` is no
  longer used), and because it is registered **by path**, Pi's *Extension
  Updates* page — which reads npm- and git-installed packages — cannot show
  them for it: read `node_modules/pi-extensible-workflows/CHANGELOG.md` after
  an upgrade.
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
  here. A preset may also carry the provider's **doc-index embedding profile**
  (`embedProfile`) — see [Doc-index embedding profile](#doc-index-embedding-profile--a-presets-indexjson-issue-541).
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

## Git identity guard (issue #514)

A signed commit proves *a key signed bytes*, not who the commit is attributed
to. Three leaks in nine days produced 139 commits with the wrong author — signed
and forge-verified, which is why nothing caught them. The guard closes that half.

On every `bash` call the extension reads the command, finds the `git config`
writes in it (legacy flags such as `--unset`, modern subcommands such as
`git config unset`), and answers. The rows are the shipped `ask` posture — what
the guard asks about — and the project's disposition answers them:

| Invocation | Verdict |
|---|---|
| read-only (`--get`, `--list`, `--show-origin`, `get`, `list`) | passes |
| one positional — `git config user.name`, `git config --global user.email` (git prints the value) | passes |
| per-invocation `-c user.name=…` | passes — it writes nothing |
| identity or signing write (`user.*`, `commit.gpgsign`, `gpg.*`, `tag.gpgsign`) | asks |
| `--unset`, `--unset-all`, `--replace-all`, `remove-section`, `rename-section`, `edit` | asks |
| `--global`, `--system`, `--worktree`, `--file` outside a scratch directory | asks |
| a local, non-identity write (`core.autocrlf`, `merge.<driver>.driver`) | passes |

An approval is remembered **per project and per scope+key** in
`git-identity-consent.json` beside the config, so the same question is never
asked twice and a different project is never covered. Two keys control it:
`guard.gitIdentity.mode` (issue #626 — `ask` shows the dialog and remembers the
answer, `deny` refuses the write without opening one, `allow` stands the guard
down; a session with no UI is refused in every mode except `allow`, and a stored
approval never reopens a `deny`) and `gitIdentity.agentGuard.allow:
["user.name"]` for local, non-destructive writes a project permits without
asking.

The verdict is about the command bash runs, never the prose it carries: a
heredoc body is data (a `git config user.email` line quoted inside one is a
read, not a write), and a backtick span is a substitution, judged unquoted.

The profile is the base config section, so the hook and the push check read the
same one: `gitIdentity.enforce` (`off` by default — an unconfigured install is
never blocked), `approved` (`name`, `email`, `fullName`, `format`, `signingKey`)
and the same two guard keys. The boundary is honest: this sees what a model asks
the bash tool to run — not a script it launches, not a `!` command, not another
host. That is what the pre-commit hook and the push-range check exist for; see
[`docs/workflow/GIT_IDENTITY_HARDENING.md`](../../docs/workflow/GIT_IDENTITY_HARDENING.md).

## Permission layer — the operator's package (issue #654)

Bash and file-access gating is **not** this package's job any more. The
first-party shell write guard is retired: it judged `ctx.ui.confirm` synchronously
while the wiring supplied an async confirm, so a pending promise read as consent
and an out-of-root write ran the same second its dialog appeared; its static
extractor also scanned heredoc bodies as command text, had no session grant, no
off switch, and passed `python3 -c`, `dd of=`, `sed -i` and computed targets
silently. The replacement is a maintained specialist, installed by the operator:

```bash
pi install npm:@gotgenes/pi-permission-system
```

**What it decides.** A tree-sitter bash grammar (heredocs are data, chained and
nested commands are decomposed; `bash -c`, `eval`, `sudo`, `env` and `xargs`
indirection floors to **ask**, never a silent pass), `allow`/`ask`/`deny` per
surface with omitted asking, a cross-cutting `path` surface over every tool with
canonical-form matching, an `external_directory` pattern map for what lives
outside the working tree, `/dev/null` and `/dev/std*` always excluded, and a
`?`-free single metacharacter: `*`, which is greedy and crosses separators. Within
one surface map, the last matching rule wins.

**What an operator gets that the first-party guard lacked.** Native session
grants — the dialog offers "approve for this session" — and `promptTimeoutMs`,
which denies an unanswered prompt and tells the agent nobody answered. Unattended
runs set it; a run that leaves it unset waits indefinitely, and pressing any key
stops the clock.

**Where its policy lives.** Two files, one per scope, and the project one loads
only once the project is trusted:

| Scope | Path |
|---|---|
| global | `~/.pi/agent/extensions/pi-permission-system/config.json` |
| project | `.pi/extensions/pi-permission-system/config.json` |

The project's policy is a **projection** of this package's own section, never a
second place to write the same rule:

```jsonc
// .pi/pi-agentic-workflow.json — the authoring surface
{
  "guardPlugins": {
    "guards": {
      "no-dotenv": {
        "kind": "deterministic",
        "surface": "path",
        "rules": [{ "match": "**/.env", "verdict": "deny", "reason": "secrets never enter the agent's reach" }]
      }
    }
  }
}
```

```bash
agentic-workflow provision permissions --write   # creates the policy file when absent
```

`provision permissions` prints the block (baseline plus your declarations, in
last-match-wins order) and creates the file only when it does not exist: an
existing policy is refused with the block to merge, because two writers on one
policy file is how a policy becomes unknown. `kind: "model-backed"` is accepted
and registers nothing until an adapter for that kind exists; the seam names no
model and no vendor. The declaration shape, the merge rules and the two carriers
are owned by [`docs/workflow/CONFIG.md`](../../docs/workflow/CONFIG.md) § Guard
plugins.

**What this package still refuses**, because it is not a permission question:
the agent-side `git config` write guard (§ Git identity guard) and the inline
receipt guard (issue #182) run before the permission layer's own verdicts. The
boundary is honest — this layer decides, it does not isolate: a script the model
launches is judged by the layer, not by this package, and a sandbox is another
package's job.

**Verify it on your machine.** The three observations that matter need a live
session with the package installed: a prompt renders and resolves over
`extension_ui_request`/`extension_ui_response`, a declined prompt blocks the call,
and `promptTimeoutMs` denies an unanswered one instead of hanging. The
checklist is [init-workspace's permission reference](../../skills/init-workspace/references/PERMISSIONS.md).

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

Tier 2 is the **file tools'** guard, and the out-of-root refusal has one
carve-out: a canonical target under an OS temp root passes, because scratch is not
durable storage and `mktemp` depends on it (issue #654 moved that rule here from
the retired shell guard). Everything durable outside the tree is still refused.
`pathProtection` is always on: it has no disposition and no off switch, which is
the deliberate asymmetry with the guards above.

The override is **tighten-only**: `protectedGlobs` are unioned with the shipped
globs, and each `requirements` entry takes the stricter of the two — so a removal
or a lowering is ignored (the shipped protection stays in force) and reported
once per session as a `pi-agentic-workflow: path protection — <code>: <detail>`
notification. `requirements` is keyed by phase state (`pre-freeze`, `post-freeze`,
`always`) and operation (`create`, `modify`, `delete`, `rename`), with values
`none` < `justification` < `approval`. To allow a protected edit, record the
matching `path-protection-records@1` `justification` row in the unit's
`decisions.md`.

## Shell-tool choice, enforced at the tool call (issue #610)

The repository's convention — search with `rg` before `grep`, run scripts with
`bun` before `node` — used to live only in prose, and prose read once decays: the
audited authoring sessions behind this feature issued 15 `node`-as-default and 13
`grep`-as-search commands with both preferred tools on `PATH` the whole time. The
convention's own home stays [`AGENTS.md`](../../AGENTS.md) §Runtime convention
(#269 owns the `rg`-first default); this section is only what the package ships.

On every `bash` call the extension reads the command *before* it runs and answers:

| Command | Verdict |
|---|---|
| `grep` used as search (a path operand, or a recursion flag) | blocked, with the `rg` equivalent in the reason |
| `grep` behind a pipe (`… \| grep -v x`), or reading stdin | passes — a filter is not search |
| `node -e …`, `node -p …`, `node <script>` | blocked, with the `bun` form in the reason |
| `node --test …`, `node scripts/run-root-suite.mjs`, the bootstrap pair, `node --version` | passes — node is the guaranteed fallback |
| a `node` command naming a `scripts/…` file the project does not have (issue #696) | blocked, with no path in the reason: the repair is the pi tool surface |
| anything else | passes |

A preferred tool that is not on `PATH` stands the carrier down for its class, so
the documented fallback is never blocked. Availability is the tool doctor's own
resolver — one answer, no second `PATH` probe. The reason names the rule's owner
rather than restating it, so the carrier cannot become a second prose home.

**A repair hint is a claim about the session's project** (issue #696). The
incident sessions ran `node scripts/batch-scheduler.mjs` in a consumer project
that has no `scripts/` tree, and the guard's repair pointed at
`bun scripts/batch-scheduler.mjs` — a second command that cannot run either,
which is how one session ended up executing an authoring checkout's working copy
against that project. The classifier now takes an injected existence answer (it
reads no disk itself) and answers three ways: the file resolves, and today's
`bun` advice stands; it does not, and the violation stops being rewritable while
the reason names no path and points at `agentic_workflow_run` (or the runner
contract outside a session); or the caller supplies no answer, and the wording
is the pre-change one byte for byte.

```json
{
  "toolChoice": { "enabled": true, "mode": "block" }
}
```

`mode` is `block` (the default: refuse and name the equivalent) or `rewrite`
(forward the command in place when the translation is exact, block when it is
not — `rg` spells several `grep` flags differently, and a silent rewrite into a
different command would be worse than a refusal). `enabled: false` turns the
carrier off, and the base file's `guard.toolChoice.mode` (issue #626) is the
project-wide disposition: `allow` stands it down, `deny` keeps the refusal, and
`ask` answers as `deny` because this guard has no question path. The section lives in `pi-agentic-workflow.json`, so the base config
other hosts read is unchanged. Boundary: this sees the `bash` tool call itself,
not a `grep` inside a script the command executes. This is the recorded
domain-separation exception that lets the package carry the convention at all —
see [`docs/workflow/DOMAIN_SEPARATION.md`](../../docs/workflow/DOMAIN_SEPARATION.md).

## Phase batching — the model-aware whole-unit policy (issue #632)

The workflow always allowed running a whole unit in one context instead of one
phase per turn; it always left that to the operator. The switch below lets the
*provider preset* say how much of a unit this session's model holds, from the
model's recorded capability rather than from an assumption.

```json
{
  "phaseBatching": { "enabled": false }
}
```

One optional boolean, shipped `false`, and no second knob: the thresholds are
preset data, because this package knows nothing about any vendor's context
windows. **Absent or `false` is byte-identical to the workflow before the key
existed** — the policy inspects nothing and answers one phase per turn.

- **The policy lives where the model knowledge lives.** The companion preset
  package carries the capability record and the `phase-batching@1`
  recommendation; with only this package installed the key is a documented no-op,
  and nothing in the kernel names a provider (the same additive seam as
  `tierRouting`, #388).
- **The recommendation is not a route.** It answers a question and touches no
  dispatch: the preset registers the command that prints it, and the gates are
  untouched — one phase is still one commit, the diff guard still runs per
  phase, and the evidence rows are the same rows.
- **Unknown keys are refused**, like every other key in this section, and
  `agentic-workflow config validate` reports a misspelling by path.
- **The default flips only on measurement**: the tier-cost corpus (#631) showing,
  over at least three real units per tier, a measured saving at equal first-review
  PASS parity. Until then the operator decides.

## Memory substrate — Engram (optional, ask-first)

The workflow's units save and recall their decisions through Engram, the memory
layer its skills document. Three surfaces connect Pi to it, and the package
recognises all three before it registers anything:

| Surface | What it is |
|---|---|
| **Native extension** (recommended) | the `gentle-engram` Pi package: it provides the `mem_*` tools directly over Engram's HTTP server — no MCP registration exists or is wanted beside it |
| **Core binary** | the `engram` executable, on `PATH` or named by `ENGRAM_BIN`: the substrate both the native extension and an MCP server need |
| **Running server** | `ENGRAM_URL` names an externally managed Engram server — local or remote |

With consent (`memory.engram: true` in `agentic-workflow.json`), the package may
register Engram's MCP server for the session through Pi's own
`registerMcpServer` — **session-scoped and not persisted**, so nothing outlives
the session and nothing is written to your `mcp.json` behind your back. What
counts as "installed" is read from the files Pi itself reads: your
`~/.pi/agent/settings.json` `packages` list always, and `<cwd>/.pi/settings.json`
— where `pi install --local` writes — only for a trusted project, exactly as Pi
gates that file. `ENGRAM_BIN` is honoured by the binary lookup too, so a binary
reachable only through it is the one that gets registered.

The report is a consent × runtime-health state machine, not one advisory for
every session: once the substrate resolves — a working `engram` binary, or a
server `ENGRAM_URL` names — there is nothing to say, and a permanent remediation
line only teaches you to ignore the report that matters. The decision order:

| Situation | What happens |
|---|---|
| no `memory.engram` opt-in (the shipped default is `false`) | nothing is registered and nothing is said — an operator who does not want memory owes the report nothing |
| no readable opt-in — the file exists but does not validate | nothing is registered; an error tells you the config is invalid, because unreadable consent is never read as a refusal you made |
| the native `gentle-engram` package is installed and the substrate resolves — `native-active` | nothing is registered and nothing is said: its `mem_*` tools already exist and agent writes stay native-only |
| the native package is installed but no `engram` binary resolves and `ENGRAM_URL` is unset — `native-active` | nothing is registered; one error names the resolution that failed (quoting `ENGRAM_BIN` when it is set), every route that repairs it, and how to confirm the binary and the served version agree |
| the native package is installed and an `mcp.json` Pi reads still declares `engram` — `native-active` | nothing is registered; a warning names the entry, because native-only agent writes are not guaranteed while it stays |
| `ENGRAM_URL` is set — `external-server` | nothing is registered — the external server (local or remote) is your deliberate choice; stdio MCP cannot target a URL |
| no `engram` core binary on `PATH` or through `ENGRAM_BIN`, and no `ENGRAM_URL` — `binary-missing` | nothing is registered; the same error names all three surfaces — `PATH`/`ENGRAM_BIN` for the binary, `ENGRAM_URL` for a server, the companion route below |
| you already declared `engram` in a `mcp.json` Pi reads — `already-declared` | nothing is registered — your declaration takes precedence |
| binary present, opted in, nothing native or external in the way — `registered` | the server is registered and the line states exactly what was written |

Only a broken install is an error. A working or deliberately configured one is
silent or information (`registered`, `external-server`, `already-declared`), and
a working install whose native-only write guarantee is broken is a warning. The
opt-out stays silent.

Install the Pi companion (the native extension) with:

```sh
pi install npm:gentle-engram@latest
```

That is the only documented route on purpose: the CLI's own setup subcommand
pins whatever version ran it and keeps serving that version until it is run
again, so an updated binary can sit unused behind a stale registration. The
companion is one surface, not the fix for every failure: the core `engram`
binary still has to reach the session (`PATH`, or `ENGRAM_BIN=/absolute/path/to/engram`),
and a server you run yourself is joined with `ENGRAM_URL=http://host:7437` —
the remote-memory configuration Engram documents. `pi-engram init` never
creates an MCP entry; if you have a `mcpServers.engram` entry in an `mcp.json`
Pi reads, remove it and reload so agent writes stay native-only.

An older Pi host whose `ExtensionAPI` has no `registerMcpServer` is reported
instead of failing the session. The workflow-side protocol — when units save,
the recall order, the degraded path — lives in `unit-lane`'s memory reference,
not here.

## Session telemetry — the measured sample

Every session that runs a unit-scoped command emits a **sample**:
the unit it worked on, the phase (the command that started the work), this
package's version, the model that served the most turns, how many paths it
changed, its turns, the model's and the tools' milliseconds, and the provider's
own token counts — `tokens` plus the `input`, `output`, `cache_read`,
`cache_write` and `reasoning` fields that make it up. No prompt text, no model
output, no diff, no file content: the accumulator never receives any of them, so
the sample is local and anonymized by construction and measures by default —
`"enabled": false` opts a project out:

```json
{ "telemetry": { "enabled": false } }
```

Two destinations, one sample. The project's `tier-cost@2` ledger
(`docs/workflow/TIER_COST.md`) keeps one row per session: a new session appends
with one atomic write, and a later emission of the same session replaces its own
row. The JSONL file gets one JSON object per line at the path
`telemetry.jsonFile` names (`.pi/.telemetry/sessions.jsonl` by default), one line
per settled run and cumulative, so a consumer differences consecutive lines
instead of reading one row per session. Add the file to your ignore list if you
do not want it in the repository:

```gitignore
.pi/.telemetry/
```

**Where the unit comes from.** A sample needs a unit, and the unit is the
command's own argument — resolved against `docs/fix/` and `docs/features/`. The
session notes every command it dispatches, through both doors it has: the slash
command a person types (`/execute-phase 690`) and the deferred runner door a
model drives (`agentic_workflow_run` with `execute-phase 690`), which is the path
every `runner <subcommand> [args…]` citation takes. A command that names no unit
— a `runner roadmap read` — is noted for the phase it sets and produces no
sample: a row the ledger cannot attribute is worse than no row.

A destination that refuses its sample says so once — the operator's `notify` in a
session, stderr for a caller that named no channel — naming the sink and the
writer's own reason, instead of failing into silence on every settled run.

Read it back with the report, which answers JSON by default and a markdown table
on request — filters by model, unit and observed day, and aggregates by phase or
unit:

```bash
bun scripts/telemetry-report.mjs --ledger docs/workflow/TIER_COST.md --by phase
bun scripts/telemetry-report.mjs --jsonl .pi/.telemetry/sessions.jsonl --model qwen3.6 --human
```

Nothing is sent anywhere: there is no remote sink, no consent prompt and no
opt-out beside the switch itself — one switch, one path. A project that sets
`"enabled": false` measures nothing and carries no file.

**New command → register telemetry.**
**Delete command → remove telemetry.**
**Rename command → update telemetry.**
The phase vocabulary is the closed `PHASE_LABELS`
list the schema package publishes, and the repository's coverage suite crosses it
against the real command surface in both directions — a command with no label and
a label with no command are the same defect. Instrumenting anything else (the
repo's scripts, single tool calls) is out of scope: Pi's own session log already
carries tool-level detail.

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

- on start, records `.pi/.session-<id>.start` (`HEAD` sha, epoch, timestamp) and
  sweeps any marker older than seven days that a crash or an older build left;
- at the first boundary it reaches — the first settled run, or the shutdown when
  no run settled — appends **one** entry and removes that marker. A marker left
  by a crashed session is never adopted — each session only ever reads its own, and
  two sessions in one workspace stay two sessions. The entry is written at
  `agent_settled` because `session_shutdown` fires only when a runtime is torn
  down, and a session that stays alive between prompts never reaches it; a later
  boundary writes nothing, because the journal is append-only.

The one event this package cannot move is the hooks `session:end` seam: it is
dispatched only at `session_shutdown`, so a web session that never tears down
never runs a declared `session:end` hook. That gap is declared in
[`docs/workflow/CONFIG.md`](../../docs/workflow/CONFIG.md#pi-event-reliability)
with the reliability matrix, not silently repaired.

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

Regenerate an entry without a session (a CI job, a test, a byte diff): feed the
frozen facts to the crate's `log render` subcommand — the crate is this
package's dependency, and its README's Commands table names the invocation —
with `--facts -`, then diff the printed entry.

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
