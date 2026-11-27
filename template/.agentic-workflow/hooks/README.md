# Agent safety hooks

Repository-scoped, opt-in adapters for the agentic workflow. Each platform
normalizes its payload into the command guard's decision; the policy blocks
obvious environment disclosure, direct environment-file reads, and direct merge
commands. Legitimate assignments such as `export NODE_ENV=test` remain allowed.

## The CLI is the one implementation

Every hook in this directory is a **shim**: it resolves the `agentic-workflow` CLI,
`exec`s it with its own argv, and forwards the exit code. It holds no rule, no
allowlist, no payload precedence and no merge precondition — those live in the CLI
(`@gtrabanco/agentic-workflow`), which is also what the shipped skills and this
repository's own gates run. One implementation, two faces: `src/<name>.mjs` is the
module a JavaScript caller imports, and the subcommand is the face a shell hook,
a skill or a CI job spawns.

| Hook | Subcommand | What decides |
|---|---|---|
| `guard-command.sh` | `guard-command` | the allowlist, the merge families of every forge, environment disclosure, `.env` reads |
| `turn-contract.sh` | `turn-contract` | the five boxes of the canonical turn contract, box4 asked of the checked remote's forge |
| `git-identity-check.sh` | `git-identity-check` | the resolved author/committer against `gitIdentity`, and the signing policy |
| `fullauto-merge.sh` | `fullauto-merge` | every precondition of the automated merge, then the merge itself |
| `index-sync.sh` | `doc --sync --quiet` | the documentation index refresh (unit 65's fast path; runs the runner argv the install resolved) |
| `adapters/pre-tool-guard.sh` | `guard-command --payload --format plain` | the decision, answered in plain text on stderr |
| `adapters/copilot-guard.sh` | `guard-command --payload --format copilot` | the decision, answered as Copilot's `{continue, stopReason}` |
| `adapters/normalize-hook-payload.sh` | `guard-command --payload --format json` | the payload normalized to `[command, path]` for an adapter that formats its own answer |
| `secret-scan.sh` | `bun`, else `node` | the push-range secret scan (its own runner; see below) |

The resolution is one line in every shim and it is ordered: `AGENTIC_WORKFLOW_BIN`
when the caller set it, else `command -v agentic-workflow`. A project that installs
the scaffold gets the CLI from `npx`/`bunx` or a global install; a source checkout
points the variable at `packages/agentic-workflow/bin/agentic-workflow.mjs`, which
is what the hook suites do. `jq` is no longer required by any hook: the payload rule
and every forge document are parsed in JavaScript.

`index-sync.sh` is the one shim that must also run where the crate is **not** on
`PATH` — a host that runs the workflow through `bunx` (issue #718). It adds one
step between the override and `command -v`: the machine-local pin
`.agentic-workflow/hooks/runner.local`, which `init-workspace` writes from the
crate's own resolver answer (`runner resolve --json doc --sync --quiet`) as one
argv token per line, and which the hook executes verbatim. The pin is a local
file, gitignored on install, so the template ships no second runner version
literal — the contract's pin stays the only one.

## Degradation

A shim whose CLI is absent cannot decide, so each capability answers with its own
declared contract — never silence, and never a guess:

| Hook | Without the CLI |
|---|---|
| `guard-command.sh`, `adapters/*` | **refuses** (exit 2, or `{continue:false}` for Copilot), naming the missing CLI: an absent decision engine must not allow |
| `git-identity-check.sh` | **refuses the commit** (exit 1), naming the missing CLI: an unverified identity is not an approved one |
| `turn-contract.sh` | **exit 2**, naming the missing CLI: it never prints a receipt it did not compute |
| `fullauto-merge.sh` | **exit 1**, naming the missing CLI: nothing merges without the preconditions |
| `index-sync.sh` | **silent no-op, exit 0**: a best-effort index refresh must never fail a git operation (unit 65, AC21), so with no entry point installed — no override, no pin, no `PATH` entry — the hook is inert and the `grep` fallback holds |
| `secret-scan.sh` | **exit 2** naming both runtimes: a scanner that cannot look never reports nothing to see |

The same rule covers a forge that cannot be asked: an uninstalled `gh`/`glab`/`gt`,
a Bitbucket remote (no official pull-request CLI) and a self-hosted hostname that
says nothing are refused with the message that names the missing thing and both
overrides (`--forge`, `AGENTIC_WORKFLOW_FORGE`). None of them passes silently, and
none of them "helpfully" continues.

## Activate one or more adapters

| Agent | Activate |
|---|---|
| Claude Code | merge `.claude/settings.json.example`'s `PreToolUse` block into `.claude/settings.json` |
| Cursor | copy `.cursor/hooks.json.example` to `.cursor/hooks.json` or merge its `beforeShellExecution` entry |
| Copilot | copy `.github/hooks/agentic-workflow.json.example` to `.github/hooks/agentic-workflow.json` |
| OpenCode | copy `.opencode/plugins/agentic-workflow-guard.ts.example` to `.opencode/plugins/agentic-workflow-guard.ts` |

The adapters own their platform's *shape* (which file carries the payload, and
which document the host reads back) and nothing else: which key holds the command,
which holds the path, and what is allowed are the CLI's. Run the suites:

```sh
bash .agentic-workflow/hooks/tests/test-hook-shims.sh
bash .agentic-workflow/hooks/tests/test-command-guard.sh
bash .agentic-workflow/hooks/tests/test-turn-contract.sh
bash .agentic-workflow/hooks/tests/test-git-identity-check.sh
bash .agentic-workflow/hooks/tests/test-fullauto-merge.sh
bash .agentic-workflow/hooks/tests/test-secret-scan.sh
bash .agentic-workflow/hooks/tests/test-index-sync.sh
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

The profile rule — the enforce vocabulary, the approved facts, the signing policy
— and the commit comparison are one module
(`@gtrabanco/agentic-workflow/src/guard/git-identity.mjs`). The pre-commit shim and
`scripts/push-identity-check.mjs` are its two carriers, and the pi extension's
agent guard imports the same normalizer. Two carriers, one implementation: the
parity corpus holds them to the same verdicts.

The full annex — the two layers, the corporate profile, the environment layout,
and what is deliberately not recommended — is
[`../../docs/workflow/GIT_IDENTITY_HARDENING.md`](../../docs/workflow/GIT_IDENTITY_HARDENING.md).

## Push-range secret scan

`secret-scan.mjs` refuses a push whose **added lines** carry a credential shape —
a private-key header, a provider token prefix, a high-entropy assignment, a
password inside a connection string — on every tracked text path, with no
directory exempt. `secret-scan.sh` is the runner: it resolves `bun`, else `node`,
execs the module beside it with your argv, and forwards the exit code. Two doors,
one implementation: a repository that ships the workflow and a project that
installs it run the same file, so a rule is never written twice.

Install it by consent, chained from an existing hook when there is one (the hook
never installs itself):

```sh
cat > .git/hooks/pre-push <<'SH'
#!/usr/bin/env bash
set -u
.agentic-workflow/hooks/secret-scan.sh "$@" || exit 1
SH
chmod +x .git/hooks/pre-push
bash .agentic-workflow/hooks/tests/test-secret-scan.sh
```

Or run it by hand — from anywhere inside the checkout, since the scanned root is
the working tree's top, never the directory you happen to be in:

```sh
bash .agentic-workflow/hooks/secret-scan.sh            # the push range
bash .agentic-workflow/hooks/secret-scan.sh --all      # every tracked file
bash .agentic-workflow/hooks/secret-scan.sh --base <rev> --json
```

**Exit contract:** `0` the range is clean (or every hit is allowlisted) · `1` a
finding — the push is refused · `2` a usage error. The range is resolved from
`--base`, then the branch's upstream merge-base, then `origin/main`'s, then the
whole tracked tree: a shallow clone and a hook that cannot prove its refs are
scanned *more*, never skipped.

**Fail-closed degradation, always named:** no `bun` and no `node` → exit 2 naming
both runtimes and the repair; a directory that is not a git checkout → exit 2
naming the directory; an unreadable tree or an unresolvable `--base` → exit 2;
a malformed allowlist → exit 2 naming the file. A scanner that cannot look never
reports nothing to see, and a finding never echoes the secret it caught — the
detail carries a four-character prefix and the payload's length.

**The allowlist is per project**, at
`<project root>/.agentic-workflow/hooks/secret-scan-allowlist.json` — the scanned
root, not this directory — override it with `--allowlist <path>` (relative to
that root):

```json
[
  { "path": "docs/examples/*.md", "rule": "credential-assignment", "reason": "documented sample values" }
]
```

It lives at `.agentic-workflow/hooks/secret-scan-allowlist.json` beside this
README, one entry per `path` (with `*`/`**` globs) and `rule` (`*` allowed), each
carrying its reason. **An absent file allows nothing.** An entry that matches
nothing in a whole-tree run is itself a finding, so the file cannot rot into a
blanket silence.

## Forges, remotes and degradation

`turn-contract` and `fullauto-merge` ask a forge, and which one is a fact about the
remote they are pointed at (`--remote`, default `origin`), never a build-time
choice. The CLI's `src/forge.mjs` resolves it, and it is the only place a forge
binary is named:

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

## Automated merge

Direct merge commands are always blocked. The former `ship-roadmap --fullauto`
was the sole automated merge authority and asked for `fullauto-merge` only after
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

## Temporary directories

One resolution serves every consumer that needs a scratch file:
`@gtrabanco/agentic-workflow/src/temp.mjs` — `TMPDIR`, then `TEMP`, then `TMP`,
then `/tmp`, each used only when it is a writable directory. That order is what
makes a Windows host (which sets `TEMP`, not `TMPDIR`) and a minimal container
(which sets neither) both work, and no hook carries its own `${TMPDIR:-/tmp}`
anymore because no hook carries a rule at all.

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
