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
  `logSession`, `memory`, `telemetry`, `guards`, `gitIdentity`, `advance`,
  `pathProtection`.
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
| `telemetry` | base | `{ "enabled": true, "jsonFile": ".pi/.telemetry/sessions.jsonl" }` | measures the per-unit cost sample by default — the sample stays local and anonymized (no prompt text, no model output, no diff, no file content); `"enabled": false` opts a project out. `jsonFile` is the per-session JSONL path, resolved against the project root (issue #504) |
| `guards` | base | `{ "merge": false, "history": false, "ci": false, "cost": { "maxTokens": 500000 } }` | booleans plus a positive `cost.maxTokens` |
| `advance` | base | `{ "iterationsCap": 12, "sensitivePaths": [], "securityPaths": [], "runLogPath": ".agentic-workflow/advance-run.log" }` | conductor knobs |
| `gitIdentity` | base | `{ "enforce": "off", "approved": {}, "agentGuard": { "mode": "ask", "allow": [] } }` | `enforce` = `off`/`commit`/`push`/`push-upstream`/`commit-and-push`/`commit-and-push-upstream` (`push` judges a push to any remote, `push-upstream` only the branch's tracked upstream remote); `approved` = `name`, `email`, `fullName`, `format` (`openpgp`/`ssh`), `signingKey`, `signingKeys` (per-machine keys), `signing` (`required`/`allowed`/`off` — `off` is a sign-off workflow) — only the declared facts are verified; `agentGuard.mode` = `ask`/`block`, `agentGuard.allow` = config keys the agent may write without asking |
| `pathProtection` | base | `{}` | `protectedGlobs` plus `requirements.<pre-freeze\|post-freeze\|always>.<create\|modify\|delete\|rename>` = `none`/`justification`/`approval` |
| `contentGuard` | base | `{ "trustedRoles": ["OWNER", "MEMBER", "COLLABORATOR"], "allowLogins": [], "denyLogins": [] }` | `trustedRoles` = the author associations whose forge content may be ingested (any value `packages/agentic-workflow-schema/src/content-guard.ts` publishes); `allowLogins` admits a login regardless of association, `denyLogins` refuses one regardless of role. There is no `enabled` switch: the layer is always active and an unconfigured project runs the strictest policy. The merge between scopes tightens only — roles intersect, the login lists union — and a list that is not the declared shape (a wrong type, or an entry that is not a string) is never narrowed into an empty one: the section is refused whole, the caller gets the shipped strictest policy and the refusal is declared (`malformed-config`) |
| `pi` | extension | routing defaults | `default`, `commands`, `onUnavailableRoute`, `onSettle`, `recommendedModels`, `profiles`, `profileOrder`, `profileFallback`, `passes`, `subagents`, `stateFlow`, `toolChoice` (`enabled: true`, `mode: "block"` — the command-time `rg`/`bun` carrier; `mode: "rewrite"` forwards instead of refusing) |

Unknown keys are refused, never merged or coerced. `config validate` reports
each one by path; `--sanitize` removes them; `--no-warn-unknown` suppresses only
that class.

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
| session_start | index.ts (readiness notice, hooks session:start seam, wiring registration), telemetry-wiring.ts (session id, accumulator, phase reset), auto-log-session-wiring.ts (marker, stale sweep) | a session runtime starts: startup, /new, /resume, /fork, reload | fires | fires | fires | reliable | the session's marker, its accumulator, and a cleared AG_WF_PHASE | — |
| agent_settled | index.ts (router and stateflow settle, terminal and /log-session notices), telemetry-wiring.ts (per-run sample), auto-log-session-wiring.ts (the session's journal entry) | a run settles: after retries, compaction and queued follow-ups | fires | fires | fires | reliable | the cost sample reaches its sinks and the journal entry lands, with no teardown involved | — |
| turn_start | telemetry-wiring.ts (the turn window opens) | each turn begins | fires | fires | fires | reliable | — | — |
| turn_end | telemetry-wiring.ts (tokens, model, turn count) | each turn ends | fires | fires | fires | reliable | the sample's token, model and turn fields | — |
| tool_execution_end | telemetry-wiring.ts (tool duration) | a tool call finishes | fires | fires | fires | reliable | the sample's tool_ms | — |
| session_shutdown | index.ts (hooks session:end seam), telemetry-wiring.ts (final flush, phase clear), auto-log-session-wiring.ts (fallback entry, marker removal) | a runtime is torn down: exit (Ctrl+C/D, SIGHUP, SIGTERM), session replacement (/new, /resume, /fork, /clone), reload, ctx.shutdown() | fires | conditional | fires | unreliable | the final sample, the fallback entry, the marker removal, and the hooks session:end seam | a web session that stays alive between prompts never tears down, so this event does not fire there between prompts — and a hook declared for the session:end seam therefore never runs in it. That is a known-issue, warned about here: the seam cannot move earlier (it reports on a session that has ended), so the sample, the entry and the marker removal were moved to agent_settled instead, and the seam's own gap stays declared rather than silently repaired |
| model_select | index.ts (routing state note) | the host selects a model | conditional | conditional | conditional | host-dependent | — | a host without model selection never fires it, and no observable effect depends on it |
| thinking_level_select | index.ts (routing state note) | the thinking level changes | conditional | conditional | conditional | host-dependent | — | the same: a routing note, never a persistence trigger |
| tool_call | index.ts (path protection, shell write guard, tool-choice carrier, receipt guard; hooks pre:commit and pre:push) | before a tool runs | fires | fires | fires | reliable | block decisions and rewritten inputs | — |
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
   (`<project>/.agentic-workflow/config-extensions/`,
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
