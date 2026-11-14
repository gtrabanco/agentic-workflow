# Agent safety hooks

Repository-scoped, opt-in adapters for the agentic workflow. Every platform
normalizes its payload into `guard-command.sh`; the policy blocks obvious
environment disclosure, direct environment-file reads, and direct merge
commands. Legitimate assignments such as `export NODE_ENV=test` remain allowed.

Two shared libraries carry the facts no hook should hardcode: `lib/forge.sh`
(which CLI speaks a forge, and how to ask it) and `lib/temp.sh` (the one writable
temporary directory). A hook that needs either sources the library from its own
directory — no `PATH` entry, no second copy.

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
bash .agentic-workflow/hooks/tests/test-temp-lib.sh
bash .agentic-workflow/hooks/tests/test-forge-adapter.sh
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
The two halves answer different scopes: `commit*` values run this hook, `push*`
values leave the commit alone, and the `*-upstream` pair adds "only the branch's
tracked upstream remote counts" to the push half. The signing policy
(`required`/`allowed`/`off`) and the per-machine `signingKeys` are what make a
second machine and a sign-off workflow legal; the annex
[`../../docs/workflow/GIT_IDENTITY_HARDENING.md`](../../docs/workflow/GIT_IDENTITY_HARDENING.md)
owns both.
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

## Forges, remotes and degradation

`turn-contract.sh` and `fullauto-merge.sh` ask a forge, and which one is a fact
about the remote they are pointed at (`--remote`, default `origin`), never a
build-time choice. `lib/forge.sh` resolves it:

| Remote names | CLI | Notes |
|---|---|---|
| `github.com` | `gh` | |
| a `gitlab` host (gitlab.com or self-hosted) | `glab` | |
| a `gitea` host | `gt` | the official CLI since 1.0; `tea` is archived upstream and is not used |
| `bitbucket.org` | none | Atlassian ships no pull-request CLI: the hook **refuses**, naming the REST route, instead of guessing one |
| a filesystem path, or a `file://` URL | `gh` | a bare path has no forge to detect |
| any other host (`git.example.com`) | none | **refused**, naming both overrides |

A self-hosted instance whose hostname says nothing is named explicitly —
`--forge github|gitlab|gitea|bitbucket` or `AGENTIC_WORKFLOW_FORGE` — and the
refusal names both, so the fix is one flag rather than an afternoon.

**Degradation is always fail-closed and always names the missing thing.** A forge
CLI that is not installed, a forge that cannot be classified, a Bitbucket remote, a
`pre-push` hook on a host with neither `bun` nor `node`, a missing `jq` in the
identity hook: each exits non-zero with a message naming the tool, the host or the
provider it could not use. None of them passes silently, and none of them
"helpfully" continues.

## Temporary directories

`lib/temp.sh` is the one resolution: `TMPDIR`, then `TEMP`, then `TMP`, then
`/tmp`, each used only when it is a writable directory. That order is what makes a
Windows host (which sets `TEMP`, not `TMPDIR`) and a minimal container (which sets
neither) both work, and it is why no hook carries its own
`${TMPDIR:-/tmp}` anymore. `aw_mktemp_file <prefix>` creates the file;
`aw_tmpdir` answers the directory.

## Automated merge

Direct merge commands are always blocked. The former `ship-roadmap --fullauto`
was the sole automated merge authority and called `fullauto-merge.sh` only after
a fresh SHA-bound audit. The wrapper creates a transient marker under the git
common directory, removes it on every exit, and posts an idempotent audit
comment on the merged PR/MR. It never creates a persistent `.automerge`
permission. The unattended-conductor role is deferred to roadmap row 62.

The wrapper takes `--remote` (default `origin`) and `--forge`, and its
preconditions are forge-independent: a clean, synchronized tree; a PR/MR based on
the forge's default branch whose head is the audited SHA; a green check rollup or
a fresh local gate for that same SHA; a `<!-- audit-pr:merge-ready sha=… -->`
comment; `merge: fullauto` in the head's own `docs/features/SHIP_DECISIONS.md`.
That decision file is read from the checkout at the audited SHA (`git show`), so
the bytes that authorize the merge are the bytes of the commit being merged and no
forge contents API is involved.

| Forge | SHA pin | Audit comment | CI surface |
|---|---|---|---|
| GitHub | `--match-head-commit` | PR comment | the check rollup |
| GitLab | `--sha` | MR note | the head pipeline status |
| Gitea | none — the wrapper re-reads the head after the merge and refuses a different one | PR comment | none — a fresh local gate for the same SHA is required |

These hooks are defense-in-depth, not a sandbox. Keep secret-manager controls
and forge branch protection/rulesets enabled.

## The command guard's allowlist

The guard blocks direct merges for every forge it knows (`gh`, `glab`, `gt`/`tea`,
`hub`, `git`, and the REST routes of GitHub, GitLab and Bitbucket). A project that
has one specific merge it wants an agent to run writes that **whole command line**
into `.agentic-workflow/hooks/guard-allow.txt`, one per line; `#` comments and
blank lines are never entries, and an absent file allows nothing. The comparison
is literal over the entire command, so an entry cannot widen into a prefix
(`… && cat .env` riding along), into another PR number, or into the
environment-disclosure rules — those run after the allowlist regardless.

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
