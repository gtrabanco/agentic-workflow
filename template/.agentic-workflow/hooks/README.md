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
