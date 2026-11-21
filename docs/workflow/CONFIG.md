# Unified config

One schema, two files, two scopes, one CLI. This page is the human guide; the
machine contract (section list, defaults, `config.schema.json`) is owned by
`@gtrabanco/agentic-workflow-schema`, and the operator surface by
`@gtrabanco/agentic-workflow config`.

## Files and scopes

| Scope | Directory | Base file | Extension file |
|---|---|---|---|
| global (per user) | `~/.pi/agent/` (the host's agent directory) | `agentic-workflow.json` | `pi-agentic-workflow.json` |
| project | `.pi/` | `agentic-workflow.json` | `pi-agentic-workflow.json` |

- **Base file** — feature config every agentic-workflow install shares:
  `logSession`, `memory`, `telemetry`, `guard`, `gitIdentity`, `advance`,
  `pathProtection`, `contentGuard`.
  It is cross-tool: the value means the same on Claude Code, Codex, OpenCode2
  and π; only the implementation of each feature differs.
- **Extension file** — package-specific config. The `pi-agentic-workflow`
  package owns `pi-agentic-workflow.json` (model routing, profiles, passes,
  subagent limits, State Flow, shell-tool choice). A package that is not installed contributes
  neither a section nor a file, so the base config never breaks.
- Both files are **JSONC**: `//` and `/* */` comments and trailing commas are
  accepted. On Bun the runtime's own parser (`Bun.JSONC.parse`) reads the file
  first; the schema package's `parseJsonc` remains the acceptance boundary on
  both runtimes and reports every refusal with its line and column, so a file
  means the same thing under Bun and Node — including the spellings only Bun's
  parser would take (`'single quotes'`, `0x` numbers), which are refused on
  both. The settings console edits the file it read, so a save keeps your
  comments and rewrites only what changed; adding or removing a key re-renders
  the object that holds it, and a removed key takes its own comment with it.
- The project config is not read while the project is untrusted.

## Resolution

```
1. shipped defaults (in code)     fill only keys the operator left UNDEFINED
2. global file                    overlay defined keys
3. project file                   overlay defined keys (project wins)
→ validate against the schema
→ EffectiveConfig
```

There is no deep merge of defaults over user config. If the operator writes
`"logSession": false`, the result is `{ enabled: false, publisher: null }`; the
default `publisher` does not replace anything the operator defined. Project over
global merges per key for objects (a project that sets only `logSession.enabled`
keeps the global `publisher`), and whole for arrays. `pathProtection` is the one
tighter-only section: globs union and requirements take the higher rank, so a
project can never silently drop a global glob or lower a requirement.

## Sections

| Section | File | Default | Values |
|---|---|---|---|
| `logSession` | base | `false` | `true`/`1`/`"on"` enable the mechanical LOGS.md entry; `false`/`0`/`"off"` disable it; `{ "publisher": { "command": [...], "timeoutMs": 5000 }, "enabled": true }` runs the publisher and (when `enabled`) appends too |
| `memory` | base | `{ "engram": false }` | `{ "engram": true }` opts in to Engram MCP registration |
| `telemetry` | base | `{ "enabled": true, "jsonFile": ".pi/.telemetry/sessions.jsonl" }` | measures the per-unit cost sample by default — the sample stays local and anonymized (no prompt text, no model output, no diff, no file content); `"enabled": false` opts a project out. `jsonFile` is the per-session JSONL path, resolved against the project root (issue #504). A sample the wiring never flushed (`session_shutdown` does not fire while a pi-web session stays alive) is recovered by hand with `agentic-workflow telemetry reconstruct write` (issue #624), which reads Pi's own transcripts and merges only the sessions a store does not already carry |
| `guard` | base | `{ "default": "ask" }` | one disposition per guard — `allow`, `deny` or `ask` — with a global fallback; see [Guards](#guards) for the reference table, the resolution order and the guards that are always on. Issue #626 replaced the retired `guards` section and the `gitIdentity.agentGuard.mode` pair |
| `advance` | base | `{ "iterationsCap": 12, "sensitivePaths": [], "securityPaths": [], "runLogPath": ".agentic-workflow/advance-run.log" }` | conductor knobs |
| `gitIdentity` | base | `{ "enforce": "off", "approved": {}, "agentGuard": { "allow": [] } }` | `enforce` = `off`/`commit`/`push`/`push-upstream`/`commit-and-push`/`commit-and-push-upstream` (`push` judges a push to any remote, `push-upstream` only the branch's tracked upstream remote); `approved` = `name`, `email`, `fullName`, `format` (`openpgp`/`ssh`), `signingKey`, `signingKeys` (per-machine keys), `signing` (`required`/`allowed`/`off` — `off` is a sign-off workflow) — only the declared facts are verified; `agentGuard.allow` = config keys the agent may write without asking. The guard's own disposition is `guard.gitIdentity.mode`, never a second `mode` here |
| `pathProtection` | base | `{}` | `protectedGlobs` plus `requirements.<pre-freeze\|post-freeze\|always>.<create\|modify\|delete\|rename>` = `none`/`justification`/`approval` |
| `contentGuard` | base | `{ "trustedRoles": ["OWNER", "MEMBER", "COLLABORATOR"], "allowLogins": [], "denyLogins": [] }` | `trustedRoles` = the author associations whose forge content may be ingested (any value `packages/agentic-workflow-schema/src/content-guard.ts` publishes); `allowLogins` admits a login regardless of association, `denyLogins` refuses one regardless of role. There is no `enabled` switch: the layer is always active and an unconfigured project runs the strictest policy. The merge between scopes tightens only — roles intersect, the login lists union — and a list that is not the declared shape (a wrong type, or an entry that is not a string) is never narrowed into an empty one: the section is refused whole, the caller gets the shipped strictest policy and the refusal is declared (`malformed-config`) |
| `docRetention` | base | `{ "mode": "keep-all", "pendingTrimAfterDays": 0, "archiveDir": ".agentic-workflow/archive", "archiveRetentionDays": null, "seamHook": null }` | `mode` = `keep-all` (detection only — the shipped posture) or `archive` (the trim step may run); `pendingTrimAfterDays` is the window `workflow-status` waits before offering a merge, measured from the unit's last `## Log` entry; `archiveDir` is the repo-relative, gitignored archive (`doc archive` refuses a directory git does not ignore); `archiveRetentionDays` = `null` never prunes the archive, a number prunes it after that many days; `seamHook` is the project-declared offsite copy, run after the local archive is durable with `AGENTIC_WORKFLOW_UNIT` and `AGENTIC_WORKFLOW_ARCHIVE_DIR` in its environment. The section gates the trim step only — it never makes a document invalid (see [RETENTION.md](RETENTION.md)) |
| `pi` | extension | routing defaults | `default`, `commands`, `onUnavailableRoute`, `onSettle`, `recommendedModels`, `profiles`, `profileOrder`, `profileFallback`, `passes`, `subagents`, `stateFlow`, `toolChoice` (`enabled: true`, `mode: "block"` — the command-time `rg`/`bun` carrier; `mode: "rewrite"` forwards instead of refusing), `phaseBatching` (`enabled: false` — the model-aware phase-batching switch; see [Phase batching](#phase-batching)), `guardPlugins` (`enabled: true`, `guards: {}` — the project's own guards, declared as data; see [Guard plugins](#guard-plugins)) |

Unknown keys are refused, never merged or coerced. `config validate` reports
each one by path; `--sanitize` removes them; `--no-warn-unknown` suppresses only
that class.

## Phase batching

The `phaseBatching` switch asks the provider preset to recommend how many
execute-phase steps one context holds on the model the session is running — the
whole-unit mode that has always been an operator choice, now backed by the
model's recorded capability instead of an assumption. It is one optional
boolean and there is no second knob: the thresholds are preset data, because the
kernel has no business knowing a vendor's context windows.

```jsonc
{ "phaseBatching": { "enabled": true } }
```

- **Absent or `false` is the shipped posture, and it is byte-identical to the
  workflow before the key existed**: the policy inspects nothing and answers one
  phase per turn. Nothing else moves — one phase is still one commit, the diff
  guard still runs per phase, and the evidence rows are the same rows.
- **The policy lives where the model knowledge lives.** `@gtrabanco/pi-nan-agentic-workflow`
  owns the capability record and the recommendation
  (`phase-batching@1`); with only `@gtrabanco/pi-agentic-workflow` installed the
  key is a documented no-op, and `/nan-phase-batching` is the command that
  prints the document from a live session.
- **A misspelled key is refused by name** (`unknown phaseBatching key`), never
  resolved to the shipped default, so an operator cannot believe batching is on
  while `false` runs.
- **Default OFF until the measurement says otherwise.** The default flips only
  when the tier-cost corpus (issue #631's surface) shows, over at least three
  real units per tier, a measured saving at equal first-review PASS parity. The
  trigger is a measurement contract, not a roadmap note: flipping the default
  without that evidence is the change this paragraph forbids.

## Guards

Every guard answers one of three dispositions (issue #626):

- **`allow`** — the guard stands down and the action runs untouched.
- **`deny`** — the guard refuses without asking, and its reason teaches the
  supported route.
- **`ask`** — the guard asks the operator when the host has a UI, and answers
  `deny` when it cannot ask. A headless session is never asked, and the refusal
  says so.

`deny` replaced the retired `block` spelling: `block` named the mechanism rather
than the decision and read as "stops" instead of "refuses". A config carrying
`block` is refused by validation, not silently mapped.

**Resolution order.** The guard's own entry wins; `guard.default` is what every
guard falls back to; the shipped default is `ask`. So an install that never
writes the section behaves exactly as it did before #626, and
`"default": "allow"` is the global off switch the issue asked for:

```jsonc
{
  "guard": {
    "default": "allow"          // every guard stands down
  }
}
```

A value the schema refuses is never honoured — a typo cannot allow a guard: the
resolved value falls back to the shipped `ask`.

### The guard reference — guard-reference@1

| guard | what it decides | modes | shipped default | can it ask | configured by |
|---|---|---|---|---|---|
| `gitIdentity` | an agent's `git config` write (issue #514) | `allow`/`deny`/`ask` | `ask` | yes — the consent store remembers the answer; a session with no UI is refused in every mode except `allow` | `guard.gitIdentity.mode`, plus the per-key exemption list `gitIdentity.agentGuard.allow` |
| `toolChoice` | a `grep`-as-search or `node`-as-default command (issue #610) | `allow`/`deny`/`ask` | `ask` | no — `ask` answers as `deny` | `guard.toolChoice.mode`, plus the carrier's own `enabled` and `mode` (`block`/`rewrite`) under `pi.toolChoice` |
| `receipt` | an inline `gh pr comment` carrying a review marker (issue #182) | `allow`/`deny`/`ask` | `ask` | no — `ask` answers as `deny` | `guard.receipt.mode` |
| `pathProtection` | a write or rename to a protected path (feature 60), and the out-of-root refusal for the file tools (OS-temp scratch excepted, issue #654) | always on (no disposition) | `approval` per phase/operation | not configurable — the section is tighten-only, so no scope can lower the floor | `pathProtection.protectedGlobs` and `pathProtection.requirements` |
| `contentGuard` | who may be ingested from forge content (issue #470) | always on (no disposition) | the strictest role set | not configurable — there is no bypass switch on purpose | `contentGuard.trustedRoles`, `.allowLogins`, `.denyLogins` |

The last two rows are the deliberate boundary: a global `allow` that reached
them would be a security regression wearing a UX fix's clothes. Their own
sections stay the only knobs, and they are tighten-only where they can be
configured at all.

Three worked examples:

```jsonc
{
  // Refuse identity writes outright; keep every other guard at the default.
  "guard": { "gitIdentity": { "mode": "deny" } }
}
```

```jsonc
{
  // Silence the shell-tool-choice carrier in a project that has its own rule.
  "guard": { "toolChoice": { "mode": "allow" } }
}
```

```jsonc
{
  // Ask everywhere the host can ask, and let the two guards without a question
  // path behave as they always did (they answer `ask` as `deny`).
  "guard": { "default": "ask" }
}
```

## Guard plugins

A project's restrictions are its own, so the extension accepts guards as **data**:
`guardPlugins` in `pi-agentic-workflow.json` declares them, and the same
declaration is enforced by whichever carrier is installed. The section is the one
authoring surface — `agentic-workflow provision permissions` projects it into the
operator-level permission layer's own policy file, so a rule is written once.

```jsonc
{
  "guardPlugins": {
    "guards": {
      "no-dotenv": {
        "kind": "deterministic",
        "surface": "path",
        "rules": [
          { "match": "**/.env", "verdict": "deny", "reason": "secrets never enter the agent's reach" }
        ]
      }
    }
  }
}
```

- **Surfaces** — `bash`, `path`, `tool`, `skill`, `mcp`. **Verdicts** — `allow`,
  `ask`, `deny` (the published disposition vocabulary), with an omitted verdict
  asking. **Order** — the LAST matching rule wins, so a specific rule belongs
  after its catch-all; patterns use `*` as the only metacharacter, and it crosses
  separators.
- **Kinds** — `deterministic` is evaluated locally with no model and no network.
  `model-backed` is accepted and enforced only once an adapter supplies that
  kind's handler (a case-by-case reviewer); until then it registers nothing and
  the extension says so once per session rather than pretending.
- **Two carriers, one decision.** The deterministic kind reaches the permission
  layer's static policy (projected by the command above) and its authorizer chain
  (an ask the static policy left open). The chain is only consulted for an `ask`,
  so a declared `ask` rule answers exactly like the prompt it defers to.
- **Strict, never merged.** An unknown section key, guard key or rule key, a
  malformed guard name, an unknown kind or surface, and a malformed verdict are
  each refused by path; nothing is coerced into a shipped default.
- **Merge between scopes.** `enabled` resolves per field, project over global; the
  guards resolve per name, and a project's declaration replaces the global one
  WHOLE — a rule list is one ordered policy, and a half-merged list would silently
  evaluate a different one.
- **`enabled: false` stands the whole chain down** without deleting the
  declarations, which is the off switch a project needs to try a rule safely.

The command writes the projection; it never owns the file:

```bash
agentic-workflow provision permissions [--scope project|global] [--write] [--json]
```

`--write` creates the policy file only when it does not exist; an existing file is
refused with the block printed for a hand merge. Without `--write` it prints the
block and touches nothing.

## A complete example file

`runner config init --scope project` writes this template, every value commented
out so the file starts at the shipped defaults. `runner config default` is the
other half: it writes those values out explicitly, each with the same
documentation, keeping whatever the operator already set. The template is
reproduced here as the reference: every section, every option this repository
publishes, and the default each one resolves to.

```jsonc
{
  // logSession — Automatic session logging: a boolean-like switch and an optional publisher command.
  // default: {"enabled":false,"publisher":null}
  // "logSession": {"enabled":false,"publisher":null},

  // memory — Memory-substrate consent (the Engram MCP registration is ask-first).
  // default: {"engram":false}
  // "memory": {"engram":false},

  // telemetry — Per-unit cost measurement.
  // default: {"enabled":true,"jsonFile":".pi/.telemetry/sessions.jsonl"}
  // "telemetry": {"enabled":true,"jsonFile":".pi/.telemetry/sessions.jsonl"},

  // guard — Guard dispositions — allow, deny or ask — as one global default plus one override per guard.
  // default: {"default":"ask"}
  "guard": {
    "default": "ask",
    "gitIdentity": { "mode": "ask" },
    "toolChoice": { "mode": "ask" },
    "receipt": { "mode": "ask" }
  },

  // gitIdentity — Approved commit identity and the agent config-write guard.
  // default: {"enforce":"off","approved":{},"agentGuard":{"allow":[]}}
  // "gitIdentity": {"enforce":"off","approved":{},"agentGuard":{"allow":[]}},

  // advance — Conductor knobs: iteration ceiling, sensitive/security path sets, run-log path.
  // default: {"iterationsCap":12,"sensitivePaths":[],"securityPaths":[],"runLogPath":".agentic-workflow/advance-run.log"}
  // "advance": {"iterationsCap":12,"sensitivePaths":[],"securityPaths":[],"runLogPath":".agentic-workflow/advance-run.log"},

  // pathProtection — Path-protection override: extra globs and raised requirements (never a lowering).
  // default: {}
  // "pathProtection": {},

  // contentGuard — Author-provenance policy for third-party forge content.
  // default: {"trustedRoles":["OWNER","MEMBER","COLLABORATOR"],"allowLogins":[],"denyLogins":[]}
  // "contentGuard": {"trustedRoles":["OWNER","MEMBER","COLLABORATOR"],"allowLogins":[],"denyLogins":[]}
}
```

The package-owned extension file is the `pi` section, defined by
`@gtrabanco/pi-agentic-workflow` (routing, profiles, passes, subagent limits,
State Flow, shell-tool choice); `runner config list --category pi` prints every
node it publishes and its shipped default.

## Pi event reliability

The extension registers ten of Pi's events, and they do not all fire in every
host. The ones a session cannot count on are exactly the ones a *session
lifecycle* event suggests: `session_shutdown` tears a runtime down, and a host
whose sessions stay alive between prompts never tears one down. So every
observable effect the package produces — the cost sample, the journal entry, the
marker — hangs off the run boundary (`agent_settled`), and the shutdown stays the
closing call rather than the only one.

This table is the surface the wiring is built against. It also carries the
evidence behind each `reliable` claim, because a documented host behaviour that
nobody sampled is an assumption wearing a heading.

```text
pi-event-reliability@1
source | pi.dev/docs/latest/extensions and the installed @earendil-works/pi-coding-agent@1.5.2 docs/extensions.md (identical 37-event catalogues), plus the installed pi-web session service, which branches on agent_settled on every run and names no session_shutdown
column | meaning
event | the Pi event, spelled exactly as pi.on() spells it
listeners | the handlers this package registers, by file
fires | when Pi emits it, in any host
tui | the terminal host
web | the pi-web host
headless | pi -p and RPC-driven hosts
reliability | reliable | unreliable | host-dependent
effect | the observable effect the listeners produce
gap | what a session loses when the event does not fire
cells | fires | not-fire | conditional
reliability-vocabulary | reliable | unreliable | host-dependent
| event | listeners | fires | tui | web | headless | reliability | effect | gap |
| session_start | index.ts (readiness notice, hooks session:start seam, wiring registration, guard-plugin registration), telemetry-wiring.ts (session id, accumulator, phase reset), auto-log-session-wiring.ts (marker, stale sweep) | a session runtime starts: startup, /new, /resume, /fork, reload | fires | fires | fires | reliable | the session's marker, its accumulator, and a cleared AG_WF_PHASE | — |
| agent_settled | index.ts (router and stateflow settle, terminal and /log-session notices), telemetry-wiring.ts (per-run sample), auto-log-session-wiring.ts (the session's journal entry) | a run settles: after retries, compaction and queued follow-ups | fires | fires | fires | reliable | the cost sample reaches its sinks and the journal entry lands, with no teardown involved | — |
| turn_start | telemetry-wiring.ts (the turn window opens) | each turn begins | fires | fires | fires | reliable | — | — |
| turn_end | telemetry-wiring.ts (tokens, model, turn count) | each turn ends | fires | fires | fires | reliable | the sample's token, model and turn fields | — |
| tool_execution_end | telemetry-wiring.ts (tool duration) | a tool call finishes | fires | fires | fires | reliable | the sample's tool_ms | — |
| session_shutdown | index.ts (hooks session:end seam), telemetry-wiring.ts (final flush, phase clear), auto-log-session-wiring.ts (fallback entry, marker removal) | a runtime is torn down: exit (Ctrl+C/D, SIGHUP, SIGTERM), session replacement (/new, /resume, /fork, /clone), reload, ctx.shutdown() | fires | conditional | fires | unreliable | the final sample, the fallback entry, the marker removal, and the hooks session:end seam | a web session that stays alive between prompts never tears down, so this event does not fire there between prompts — and a hook declared for the session:end seam therefore never runs in it. That is a known-issue, warned about here: the seam cannot move earlier (it reports on a session that has ended), so the sample, the entry and the marker removal were moved to agent_settled instead, and the seam's own gap stays declared rather than silently repaired |
| model_select | index.ts (routing state note) | the host selects a model | conditional | conditional | conditional | host-dependent | — | a host without model selection never fires it, and no observable effect depends on it |
| thinking_level_select | index.ts (routing state note) | the thinking level changes | conditional | conditional | conditional | host-dependent | — | the same: a routing note, never a persistence trigger |
| tool_call | index.ts (path protection, tool-choice carrier, receipt guard; hooks pre:commit and pre:push) | before a tool runs | fires | fires | fires | reliable | block decisions and rewritten inputs | — |
| tool_result | index.ts (hooks post:commit notice) | after a tool ran | fires | fires | fires | reliable | the post-commit warning notice | — |
```

`test/event-reliability-matrix.test.mjs` derives the registered set from
`src/extension/` and compares it with this table: a listener with no row, a row
for an event nobody listens to, a host cell outside the declared vocabulary or an
empty `effect`/`gap` fails the suite, so the table cannot drift away from the
code it describes.

**Warning — `session:end` hooks do not run in a long-lived web session.** The
seam is dispatched only at `session_shutdown`; a session that never tears down
never dispatches it. Nothing can undo that from inside the extension (a session
that has not ended has no `session:end` to report), so a web-hosted project that
declares one gets no report until its session is closed or replaced. The
`session:start` half of the seam is unaffected.

What the wiring does with this table:

- `telemetry` emits at `agent_settled` and keeps `session_shutdown` as the final
  flush. Each settled run appends one cumulative line to `jsonFile`, and the
  ledger keeps one row per session, upserted on the sample's `source`, so a
  session that settles ten times is ten lines and one row.
- `logSession` publishes the session's entry at the first boundary it reaches —
  the settled run, or the shutdown when no run settled — and removes the marker
  there. A second boundary adds no second entry: the journal is append-only, so
  "later" cannot mean "replaces".
- A marker a crash or an older build stranded is swept at `session_start` once it
  is older than seven days. The sweep dates each file by the epoch it records and
  never adopts one.

## Materialize the explicit defaults — `config default`

Resolution fills defaults in code, so a config file shows only what the operator
wrote and the rest of the surface is invisible. `config default` makes every
declared option explicit: each key is written with its shipped default, and an
English comment naming the option, its type and that default — the same data
`config list` exposes, so neither can drift.

```bash
runner config default                 # every file of both scopes
runner config default --scope project
runner config default --no-backup
runner config default --json
```

- **Merge, never clobber.** A value the operator set is preserved exactly; only
  an `undefined` key gains its default. A key the schema no longer declares is
  dropped.
- **Backup first.** An existing file is copied to `<file>.bak-<timestamp>` beside
  it before anything changes. `--no-backup` skips the copy, never the write; the
  settings console has no opt-out.
- **Idempotent.** A second run changes no byte and takes no second backup, so the
  operation is safe to re-run after every upgrade.
- **Every installed file.** The base `agentic-workflow.json` always;
  `pi-agentic-workflow.json` only while `pi-agentic-workflow` is installed, and
  any other extension the same way, through `config-extension@1` discovery — the
  mechanism is generic, never a per-package case.
- **Refuse before writing.** A file that does not parse, and a merge that fails
  validation, exit 2 with `CONFIG REFUSAL — <reason>` and leave the file (and its
  backup directory) untouched.
- **A written default resolves exactly like the absent key.** Materializing is a
  visibility change, never a resolution change.
- **The divergence check.** `doctor` compares each existing project config file's
  key set with the schema and reports "new options available … run config
  default" or the removed keys, so an upgrade that adds or retires an option has
  a reporter. The doctor only observes: it writes nothing.

The receipt is JSON on stdout and the progress lines are stderr only:

```json
{ "contract": "config-materialize@1", "scope": "both",
  "files": [ { "scope": "project", "file": "agentic-workflow.json",
               "path": ".pi/agentic-workflow.json", "existed": true,
               "written": true, "backup": ".pi/agentic-workflow.json.bak-20261121T013000Z",
               "materialized": ["logSession.publisher"], "removed": [] } ] }
```

## CLI

```bash
# Read (default scope: project; `resolved` merges both scopes and defaults)
runner config get logSession
runner config get --scope resolved pi.default.model

# Write (validated before the file changes; no coercion)
runner config set logSession true
runner config set pi.model.default "nan/qwen3-32b" --scope global

# Discover every writable node, its type, category and shipped default
runner config list
runner config list --category pi --json

# Resolved view, validation, reset, initializer, composed schema
runner config show
runner config validate --scope both
runner config validate --sanitize
runner config reset logSession.publisher
runner config init --scope project
runner config default [--scope global|project|both] [--no-backup]
runner config schema
```

`--project <dir>` points at the project root (default: cwd); `--global-dir <dir>`
overrides `$PI_CODING_AGENT_DIR` / `~/.pi/agent`. A refusal exits 2 with
`CONFIG REFUSAL — <reason>` and leaves the file untouched.

## Programmatic API

`@gtrabanco/agentic-workflow` exports the same operations as a library:

```js
import { createConfigApi } from "@gtrabanco/agentic-workflow/src/config/api.mjs";

const config = createConfigApi({ projectDir, globalDir, extensions });
config.get("resolved", ["logSession"]);
config.set("project", ["pi", "model", "default"], "nan/qwen3-32b");
config.list({ scope: "resolved", category: "feature" });
config.showResolved();
config.validate("both", { sanitize: false, noWarnUnknown: false });
```

The materialization engine is exported beside the API, because it is not a
single-path operation — it reconciles every file of a scope:

```js
import { configDivergence, materializeConfig } from "@gtrabanco/agentic-workflow/src/config/materialize.mjs";

const receipt = materializeConfig({ projectDir, globalDir, scope: "both", backup: true });
const divergence = configDivergence({ projectDir, globalDir, scope: "project" });
```

Every write validates first. `list` returns `{ path, type, writable,
defaultValue, description, category }` for each node.

## Extension contract (plugin / strategy)

A package publishes its own section without this repository knowing it:

1. Ship a `config-extension@1` descriptor (JSON):

   ```json
   {
     "contract": "config-extension@1",
     "key": "pi",
     "file": "pi-agentic-workflow.json",
     "description": "package-internal config",
     "schema": { "type": "object", "additionalProperties": false, "properties": { } },
     "defaults": { }
   }
   ```

2. Name it from `package.json`:

   ```json
   { "agenticWorkflow": { "config": "./agentic-workflow.config.json" } }
   ```

3. Or drop the descriptor into `config-extensions/` at either scope
   (`<project>/config-extensions/`,
   `<globalDir>/config-extensions/`).

Discovery reads data only — it never executes extension code. A key may be
claimed once; a duplicate or a descriptor that redefines a base section is
reported, never silently overwritten. This is the same strategy the
`pi-agentic-workflow` package uses for its `pi` section.

## Adding a config key to a feature

The process (triage, scope, schema, defaults, docs, `init-workspace` offer,
changeset, roadmap) is owned by the repository's `AGENTS.md`; read the target
project's guide before adding a section.

## Migration from the pre-unified files

- Feature keys (`memory`, `telemetry`, `advance`, `pathProtection`,
  `autoLogSession`) moved out of `pi-agentic-workflow.json` into the base
  `agentic-workflow.json`.
- `autoLogSession: { "mode": "mechanical" }` became `logSession: true`;
  `autoLogSession: { "mode": "off" }` became `logSession: false` (or absent).
  A publisher moves to `logSession.publisher`.
- Routing and profile keys stay in `pi-agentic-workflow.json` unchanged; they
  are now the `pi` section.
- Run `config validate --scope both` after moving values; it names every key
  that is now in the wrong file.

### Issue #626 (breaking)

- **`guards` retired.** Its four keys (`merge`, `history`, `ci`,
  `cost.maxTokens`) had no runtime consumer in this repository; a file that still
  carries the section is refused with the ordinary unknown-key report. Delete the
  key.
- **`gitIdentity.agentGuard.mode` retired.** The identity guard's disposition is
  `guard.gitIdentity.mode`. `block` became `deny`, and `allow` is new. A file
  that still carries the old key is refused — and, because the guard never reads
  it, a rewritten mode there would decide nothing.
- **`block` is not mapped.** It is the retired spelling of `deny`; validation
  refuses it against the published enum instead of translating it.
- **A shared first path segment needs its section prefix.** `guard.default` and
  the `pi` section's own `default` now share a segment, so `config get
  default.model` is refused with `"default" belongs to several sections: guard,
  pi; prefix the section key` — write `config get pi.default.model`.
