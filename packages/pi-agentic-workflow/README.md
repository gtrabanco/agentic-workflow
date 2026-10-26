# @gtrabanco/pi-agentic-workflow

One install of the [agentic-workflow](https://github.com/gtrabanco/agentic-workflow)
method into [Pi](https://github.com/badlogic/pi-mono): the canonical skills, a
friendly slash command for each of them, and optional per-command model routing
that gives your session back afterwards.

- **Canonical skills, unchanged.** The package ships the same `SKILL.md` files as
  this repository, byte for byte — no Pi-specific fork to drift.
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
| `/discover-repository-state` | Freeze verified repository facts. |
| `/execute-phase` | Implement the remaining phases of a planned unit. |
| `/fold-findings` | Repair persisted fix-now findings. |
| `/init-workspace` | Adapt the workflow scaffold to a repository. |
| `/log-session` | Append a structured session entry to `docs/LOGS.md`. |
| `/product-audit` | Audit the product surface, not just the diff. |
| `/resolve-repository-state` | Resolve a contradiction in frozen facts. |
| `/review-change` | Review a change with the applicable axes. |
| `/unit-lane` | Run the adaptive lane on a unit: triage, steps, evidence, release. |
| `/triage-issue` | Verify an issue or finding against current code. |
| `/workflow-status` | Read-only state of the repository and roadmap. |

Arguments are forwarded verbatim: `/execute-phase P3 --fix` reaches the skill as
`P3 --fix`.

## Model routing

Two JSON files, both optional:

| Scope | Path | Read when |
| --- | --- | --- |
| Global | `~/.pi/agent/pi-agentic-workflow.json` | always |
| Project | `<repo>/.pi/pi-agentic-workflow.json` | the project is trusted |

```json
{
  "default": { "model": "anthropic/claude-opus-4-5", "thinking": "high" },
  "commands": {
    "plan-feature": { "model": ["anthropic/claude-sonnet-4-5", "openai/gpt-5.2"], "thinking": "medium" },
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
  it was skipped. `plan-feature` above tries `anthropic/claude-sonnet-4-5` first,
  then `openai/gpt-5.2`.
- `thinking` is one of `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`,
  or `"inherit"`.
- `` `onSettle` `` is one of `"keep"` (the default) or `"restore"` — see
  [Your session after a command](#your-session-after-a-command).
- Unknown keys, `null`s and malformed references are **rejected**, not ignored: a
  typo that silently did nothing is the bug you would never find.

The first workflow command you run after install says once that routing is
configurable, then never again. That acknowledgement is stored in
`~/.pi/agent/pi-agentic-workflow-state.json`, not in your config.

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
- **Built-in `nan` profile.** With `recommendedModels: true` (the default), when the
  session has models from the `nan` provider, a code-only `nan` profile is appended
  to the end of the chain (or used alone when you set no `profileOrder`). It carries
  the per-command ladders from the README's NaN section. Any route you declare —
  including an explicit `"inherit"` — wins over it. Set `recommendedModels: false`
  to switch it off; the settings console writes the key explicitly on save when the
  provider is available.
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
  The built-in `nan` profile is shown but not editable — create a profile to
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

## When a configured model is unavailable

Default: the command **refuses to start** and tells you why — the model is not in
the registry, has no credentials, or could not be selected. Nothing is sent, so
nothing runs on a model you did not pick. To run anyway on the current model, set:

```json
{ "onUnavailableRoute": "inherit" }
```

## Your session after a command

By default (**`onSettle: "keep"`**), the routed model and thinking level **stay**
in the open chat window once the command settles. If `plan-feature` runs on
`glm-5` and you want to tweak the plan it produced, your next prompt keeps
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
| `refused: invalid configuration` | A config file was rejected. The same message names the field, e.g. `$.commands.plan-feature.model`. Run `/agentic-workflow-settings` to see the file, or fix the JSON. |
| `stopped: the configured model` … `is not in the model registry` | The reference is wrong or the provider is not configured. Use `/model` to see the exact `provider/modelId`. |
| `has no configured credentials` | The model exists but you cannot use it yet. Authenticate, or set `onUnavailableRoute` to `inherit`. |
| `could not be selected` | Pi refused the switch. The command stops with the reason — unless `onUnavailableRoute` is `inherit`, in which case it warns and runs on your current model. |
| `refused: the agent is busy` | A turn is running. Wait for it to settle. |
| `is still routed` | The previous routed command has not settled yet. |
| `leaving the model you chose in place` | (in `restore` mode) You changed the model during a routed turn, so nothing was restored — your choice won. |
| `these configured routes match no command` | A `commands` key names nothing. Fix the spelling or delete the entry. |

## Notes

- Verified against the peer floor Pi 0.99.1 (2026-09-29) (`pi install`, package skills, friendly
  command registration, routed set/clear, settings console round-trip, `sendUserMessage`
  with prompt template expansion). Also verified against Pi 1.2.0 (2026-10-14) via a local
  two-leg `tsc --noEmit` run (legs `0.99.1` + `latest`, the `latest` leg resolving to pi
  1.2.0; COMPAT-OK); continuously against the
  `latest` dist-tag by the `pi-compat-guard` PR gate (the leg is a moving tripwire,
  not a pinned version — a breaking release shows red here first).
- The package declares Pi as a peer dependency; it bundles no copy of Pi.
- Skills can instruct the model to run commands. Review them as you would any
  third-party package.

MIT · [Repository](https://github.com/gtrabanco/agentic-workflow) ·
[`docs/features/27-pi-agentic-workflow/`](../../docs/features/27-pi-agentic-workflow/SPEC.md)
