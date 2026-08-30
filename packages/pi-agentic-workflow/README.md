# @gtrabanco/pi-agentic-workflow

> 🇪🇸 [Versión en español](README.es.md)

One install of the [agentic-workflow](https://github.com/gtrabanco/agentic-workflow)
method into [Pi](https://github.com/badlogic/pi-mono): the canonical skills, a
friendly slash command for each of them, and optional per-command model routing
that gives your session back afterwards.

- **Canonical skills, unchanged.** The package ships the same `SKILL.md` files as
  this repository, byte for byte — no Pi-specific fork to drift.
- **Friendly commands.** Type `/plan-feature --next`, not
  `/skill:plan-feature --next`.
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
| `/design-feature` | Turn a raw idea into a designed SPEC. |
| `/discover-repository-state` | Freeze verified repository facts. |
| `/execute-phase` | Implement the remaining phases of a planned unit. |
| `/fold-findings` | Repair persisted fix-now findings. |
| `/generate-docs` | Generate incremental, diff-driven developer guides. |
| `/init-workspace` | Adapt the workflow scaffold to a repository. |
| `/log-session` | Append a structured session entry to `docs/LOGS.md`. |
| `/loop-review-fold` | Review a unit, then fold what it found. |
| `/plan-feature` | Route designed work into planning and the roadmap. |
| `/plan-fix` | Draft a phased fix SPEC from one or more issues. |
| `/product-audit` | Audit the product surface, not just the diff. |
| `/resolve-repository-state` | Resolve a contradiction in frozen facts. |
| `/review-change` | Review a change with the applicable axes. |
| `/ship-roadmap` | Find or continue a roadmap, one stage per run. |
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
    "plan-feature": { "model": "anthropic/claude-sonnet-4-5", "thinking": "medium" },
    "review-change": { "thinking": "max" }
  },
  "onUnavailableRoute": "stop"
}
```

A value is taken from the first place that declares it: **project command →
global command → resolved default route → shipped default**. `review-change`
above runs on the default model with `max` thinking; anything else runs on
whatever the session already had, because the shipped default route is
`{"model": "inherit", "thinking": "inherit"}`.

- `model` must be `provider/modelId` — the exact reference `/model` shows — or
  `"inherit"`.
- `thinking` is one of `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`,
  or `"inherit"`.
- Unknown keys, `null`s and malformed references are **rejected**, not ignored: a
  typo that silently did nothing is the bug you would never find.

The first workflow command you run after install says once that routing is
configurable, then never again. That acknowledgement is stored in
`~/.pi/agent/pi-agentic-workflow-state.json`, not in your config.

## When a configured model is unavailable

Default: the command **refuses to start** and tells you why — the model is not in
the registry, has no credentials, or could not be selected. Nothing is sent, so
nothing runs on a model you did not pick. To run anyway on the current model, set:

```json
{ "onUnavailableRoute": "inherit" }
```

## Your session comes back

Routing lasts one command. When the turn settles, the session is put back the way
you had it — the model *and* the thinking level, because selecting a model can
move the level. If you change the model yourself mid-turn, with `/model`, say,
nothing is restored: your choice wins, and the command says so. Change only the
thinking level and you keep it while the model still comes back.

## Settings console

```
/agentic-workflow-settings
```

Shows what each command runs on right now, and which file is refusing to parse,
then lets you edit **one file at a time** and save to global or project scope. It will not save over a file it cannot parse, and it will not
touch the project file while the project is untrusted.

## Troubleshooting

| You see | Means |
| --- | --- |
| `refused: invalid configuration` | A config file was rejected. The same message names the field, e.g. `$.commands.plan-feature.model`. Run `/agentic-workflow-settings` to see the file, or fix the JSON. |
| `stopped: the configured model` … `is not in the model registry` | The reference is wrong or the provider is not configured. Use `/model` to see the exact `provider/modelId`. |
| `has no configured credentials` | The model exists but you cannot use it yet. Authenticate, or set `onUnavailableRoute` to `inherit`. |
| `could not be selected` | Pi refused the switch. The command stops with the reason — unless `onUnavailableRoute` is `inherit`, in which case it warns and runs on your current model. |
| `refused: the agent is busy` | A turn is running. Wait for it to settle. |
| `is still routed` | The previous routed command has not settled yet. |
| `leaving the model you chose in place` | You changed the model during a routed turn, so nothing was restored — your choice won. |
| `these configured routes match no command` | A `commands` key names nothing. Fix the spelling or delete the entry. |

## Notes

- Verified against Pi 0.84.3 (`pi install`, package skills, `sendUserMessage` with
  prompt template expansion).
- The package declares Pi as a peer dependency; it bundles no copy of Pi.
- Skills can instruct the model to run commands. Review them as you would any
  third-party package.

MIT · [Repository](https://github.com/gtrabanco/agentic-workflow) ·
[`docs/features/27-pi-agentic-workflow/`](../../docs/features/27-pi-agentic-workflow/SPEC.md)
