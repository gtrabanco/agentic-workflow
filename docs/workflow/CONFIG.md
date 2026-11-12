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
  `logSession`, `memory`, `telemetry`, `guards`, `advance`, `pathProtection`.
  It is cross-tool: the value means the same on Claude Code, Codex, OpenCode2
  and π; only the implementation of each feature differs.
- **Extension file** — package-specific config. The `pi-agentic-workflow`
  package owns `pi-agentic-workflow.json` (model routing, profiles, passes,
  subagent limits, State Flow). A package that is not installed contributes
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
| `telemetry` | base | `{ "enabled": false }` | `{ "enabled": true }` measures the per-unit cost sample |
| `guards` | base | `{ "merge": false, "history": false, "ci": false, "cost": { "maxTokens": 500000 } }` | booleans plus a positive `cost.maxTokens` |
| `advance` | base | `{ "iterationsCap": 12, "sensitivePaths": [], "securityPaths": [], "runLogPath": ".agentic-workflow/advance-run.log" }` | conductor knobs |
| `pathProtection` | base | `{}` | `protectedGlobs` plus `requirements.<pre-freeze\|post-freeze\|always>.<create\|modify\|delete\|rename>` = `none`/`justification`/`approval` |
| `pi` | extension | routing defaults | `default`, `commands`, `onUnavailableRoute`, `onSettle`, `recommendedModels`, `profiles`, `profileOrder`, `profileFallback`, `passes`, `subagents`, `stateFlow` |

Unknown keys are refused, never merged or coerced. `config validate` reports
each one by path; `--sanitize` removes them; `--no-warn-unknown` suppresses only
that class.

## CLI

```bash
# Read (default scope: project; `resolved` merges both scopes and defaults)
bunx @gtrabanco/agentic-workflow config get logSession
bunx @gtrabanco/agentic-workflow config get --scope resolved pi.default.model

# Write (validated before the file changes; no coercion)
bunx @gtrabanco/agentic-workflow config set logSession true
bunx @gtrabanco/agentic-workflow config set pi.model.default "nan/qwen3-32b" --scope global

# Discover every writable node, its type, category and shipped default
bunx @gtrabanco/agentic-workflow config list
bunx @gtrabanco/agentic-workflow config list --category pi --json

# Resolved view, validation, reset, initializer, composed schema
bunx @gtrabanco/agentic-workflow config show
bunx @gtrabanco/agentic-workflow config validate --scope both
bunx @gtrabanco/agentic-workflow config validate --sanitize
bunx @gtrabanco/agentic-workflow config reset logSession.publisher
bunx @gtrabanco/agentic-workflow config init --scope project
bunx @gtrabanco/agentic-workflow config schema
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
