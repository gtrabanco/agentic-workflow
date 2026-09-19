# Agent safety hooks

Repository-scoped, opt-in adapters for the agentic workflow. Every platform
normalizes its payload into `guard-command.sh`; the policy blocks obvious
environment disclosure, direct environment-file reads, and direct merge
commands. Legitimate assignments such as `export NODE_ENV=test` remain allowed.

## Activate one or more adapters

| Agent | Activate |
|---|---|
| Claude Code | merge `.claude/settings.json.example`'s `PreToolUse` block into `.claude/settings.json` |
| Cursor | copy `.cursor/hooks.json.example` to `.cursor/hooks.json` or merge its `beforeShellExecution` entry |
| Copilot | copy `.github/hooks/agentic-workflow.json.example` to `.github/hooks/agentic-workflow.json` |
| OpenCode | copy `.opencode/plugins/agentic-workflow-guard.ts.example` to `.opencode/plugins/agentic-workflow-guard.ts` |

The shell adapters require `jq`; OpenCode uses Bun's built-in process API. Run:

```sh
bash .agentic-workflow/hooks/tests/test-command-guard.sh
```

Do not activate or overwrite a customized platform hook without explicit
maintainer consent. `init-workspace` discovers the platform, asks, installs
additively, and reports residuals.

## Automated merge

Direct merge commands are always blocked. `ship-roadmap --fullauto` is the sole
automated merge authority and calls `fullauto-merge.sh` only after a fresh
SHA-bound audit. The wrapper creates a transient marker under the git common
directory, removes it on every exit, and posts an idempotent audit comment on
the merged PR. It never creates a persistent `.automerge` permission.

These hooks are defense-in-depth, not a sandbox. Keep secret-manager controls
and forge branch protection/rulesets enabled.

## Path protection

`guard-command.sh` guards commands; the path-protection policy guards **paths**.
The policy document is `../path-policy.json`, with its doc page at
`../path-protection.md`. The shipped defaults protect `tests/**`, `e2e/**`,
`**/*.test.*`, `fixtures/**` and the policy config itself, and a project extends
or tightens them from there — the defaults can never be silently loosened.

The two tiers do not read the same file:

- the **Tier 1 checkpoint gate** (`path-guard`, a producer-crate subcommand)
  reads `../path-policy.json`; it runs at each phase checkpoint over the phase's
  committed range and fails a protected change with no recorded
  justification/approval;
- the **Tier 2 pi guard** never reads `../path-policy.json`: it applies the
  shipped defaults, tightened by the optional `pathProtection` key in the pi
  config (`~/.pi/agent/pi-agentic-workflow.json` /
  `<repo>/.pi/pi-agentic-workflow.json`), and blocks a `write` / `edit` tool call
  to an existing protected path with no matching justification record (reads and
  new-file creates pass).

The command guard deliberately stays command-only: the normalized hook payload
carries no write intent, so a path check there would block reads of protected
files too. Path enforcement is the checkpoint gate plus the pi guard.
