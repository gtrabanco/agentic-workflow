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

## Git identity & signing

`git-identity-check.sh` is the opt-in pre-commit half of the identity guard
(issue #514). It refuses a commit whose resolved author or committer is not the
project's approved identity in `.pi/agentic-workflow.json` → `gitIdentity`, and —
while `commit.gpgsign` is true — whose signing key is absent, of the wrong format,
or not the approved one. It reads and prints; it never repairs, rewrites or
retries, and it suggests the correct `--unset` form rather than the inverted one
that once set the literal value `--unset`.

It is **inert without a declared profile** (`enforce` defaults to `off`), so
installing the scaffold never blocks a project that never configures identity.
Install it by consent, chained from an existing hook when there is one:

```sh
cat > .git/hooks/pre-commit <<'SH'
#!/usr/bin/env bash
set -u
.agentic-workflow/hooks/git-identity-check.sh || exit 1
SH
chmod +x .git/hooks/pre-commit
bash .agentic-workflow/hooks/tests/test-git-identity-check.sh
```

The full annex — the two layers, the corporate profile, the environment layout,
and what is deliberately not recommended — is
[`../../docs/workflow/GIT_IDENTITY_HARDENING.md`](../../docs/workflow/GIT_IDENTITY_HARDENING.md).

## Automated merge

Direct merge commands are always blocked. The former `ship-roadmap --fullauto`
was the sole automated merge authority and called `fullauto-merge.sh` only after
a fresh SHA-bound audit. The wrapper created a transient marker under the git
common directory, removed it on every exit, and posted an idempotent audit
comment on the merged PR. It never created a persistent `.automerge` permission.
The unattended-conductor role is deferred to roadmap row 62.

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
