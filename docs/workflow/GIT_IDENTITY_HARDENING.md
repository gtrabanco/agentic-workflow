# Git identity & signing hardening

A signed commit proves *a key signed bytes*. It proves nothing about **who** the
commit is attributed to: a leaked fixture identity or an agent's deliberate
`user.name` produces exactly the same valid signature as the owner's own commit.
This repository measured the cost — three leaks in nine days, 139 of 4,437
commits on `origin/main` carrying the wrong author, every one of them
"verified" in the forge UI.

This page is the annex: what the guard does, how to install the opt-in half, the
environment layout that makes identity drift hard to produce, and what is
deliberately **not** recommended. `init-workspace` applies none of it without an
explicit yes.

## The two layers, and why both exist

| Layer | Carrier | Sees | Does not see |
|---|---|---|---|
| 1 — agent config-write guard | the `pi-agentic-workflow` extension | every `bash` call a model asks the host to run | a script the model launches, a `!` command the human types, another agent host, variable indirection |
| 2 — fail-fast verification | the pre-commit hook, and the push-range step of the local gate | every commit made in this checkout (hook) and every never-published commit of the push range (gate) | a commit made elsewhere and pushed from a machine without the gate |

Layer 1 stops the *intent*; Layer 2 stops the *result*. Two of the three recorded
leaks came from processes Layer 1 cannot see, which is why Layer 2 is not
optional in a repository that cares about attribution.

## One profile, three readers

The approved identity lives in the unified config, base file, section
`gitIdentity` — never in a second file:

```jsonc
// .pi/agentic-workflow.json (project scope; project wins over global)
{
  "gitIdentity": {
    // off | commit | push | push-upstream | commit-and-push | commit-and-push-upstream
    // `off` is inert and the default; `push` judges a push to any remote,
    // `push-upstream` only the branch's tracked upstream remote
    "enforce": "commit-and-push-upstream",
    "approved": {
      "name": "Gabriel Trabanco Llano",              // git user.name
      "email": "1969593+gtrabanco@users.noreply.github.com",
      "fullName": "Gabriel Trabanco Llano",           // legal name, checked against the key's UID (openpgp)
      "format": "openpgp",                           // openpgp (default) or ssh
      "signingKey": "B8629F2451528D18",               // key id, fingerprint, or ssh key path
      "signingKeys": ["B8629F2451528D18"],            // the same fact, one entry per machine
      "signing": "allowed",                           // required | allowed (default) | off (sign-off)
    },
    "agentGuard": {
      "mode": "ask",                                  // ask | block (block never prompts)
      "allow": [],                                    // config keys the agent may write locally, e.g. ["user.name"]
    },
  },
}
```

Only the declared facts are verified: a profile with `name` and `email` and no
key checks exactly those two. `enforce: "off"`, or no profile at all, leaves every
carrier inert — an install that never configures identity is never blocked.

**The scope the project declares is a fact about its situation, not a preference
for laxity.** `push` means "every commit I publish must carry my identity, to any
remote"; `push-upstream` means "only what lands upstream is mine to vouch for", so
a contributor whose `origin` is a personal fork pushes to the fork freely and the
check applies when the same commits are pushed to the tracked upstream. An
unenforced project and an enforced one differ by one word, and nothing between
them is a hole: a caller that names no remote keeps the check (see
[the push scope](#the-push-scope)).

The corporate case is the same shape: `name`, a legal `fullName`, the
organisation `email`, and the certificate or SSH key that must sign. `fullName`
is verified against an OpenPGP key's UID lines; with an SSH key there is no UID,
so declaring `fullName` with `format: "ssh"` is refused rather than silently
ignored — declare the key path in `signingKey` instead.

## Install the pre-commit hook (opt-in, by consent)

```sh
# the hook ships in the scaffold
ls .agentic-workflow/hooks/git-identity-check.sh

# chain it from your pre-commit hook (the safe route when you already have one)
cat > .git/hooks/pre-commit <<'SH'
#!/usr/bin/env bash
set -u
.agentic-workflow/hooks/git-identity-check.sh || exit 1
SH
chmod +x .git/hooks/pre-commit
```

The hook reads the *resolved* identity (`git var GIT_AUTHOR_IDENT` /
`GIT_COMMITTER_IDENT`), so every layer that git already supports keeps working:
the global default, an `includeIf` per-project block, a consented repo-local
value, and `-c` per invocation (git exports `-c` to hooks through
`GIT_CONFIG_PARAMETERS`).

It refuses — it never repairs, never rewrites, never retries — and prints the
correct repair forms:

```sh
git config --show-origin --get-all user.name   # which file wins, and why
git config --show-origin --get-all user.email
git config --unset user.name                   # verb FIRST
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
```

**The inverted form is the incident.** `git config user.name --unset` does not
unset anything: it *sets* the literal value `--unset`, which then fails the
identity check forever after. The hook's text names the correct form for exactly
this reason.

When `commit.gpgsign` is true the hook also checks that the resolved signing key
exists (secret keyring for OpenPGP, file for SSH), that its format is the approved
one, and — when the profile declares `signingKey`/`signingKeys` — that it is one
of *those* keys.

## The signing policy

A second machine, a sign-off workflow and a corporate keyring are three
legitimate shapes a single "which key is approved" rule cannot express, so the
profile declares what a signature means (`approved.signing`):

| `signing` | A signed commit | An unsigned commit |
|---|---|---|
| `required` | the resolved key must exist and match the approved key(s) | refused — the project wants signatures |
| `allowed` (default) | the same checks, **except** that a machine whose `user.signingKey` does not resolve passes (gpg selects the key from the keyring by UID) | passes |
| `off` | refused — a sign-off workflow approves unsigned commits | passes |

`approved.signingKeys` is the per-machine form of `signingKey`: declare one entry
per machine and each machine's key is approved, so revoking one does not break
the others. The two declarations are a union — declare `signingKey` for the
canonical key and `signingKeys` for the rest, or only one of them.

The hook checks the *resolved* key, so a per-machine key needs no per-machine
configuration: `user.signingKey` (or the keyring default) is what the check reads.

## The push-range check

The local gate's `push-identity` step runs on a real push (the installed
`pre-push` hook passes the proven base) and verifies every author **and**
committer of the never-published commits of `<base>..HEAD`:

```sh
bun scripts/push-identity-check.mjs --base origin/main   # the same command, by hand (node runs it too)
git push --no-verify                                     # the escape hatch; record why
```

A full local run without a push range drops the step: there is nothing to
verify, and failing on an absent base would train operators to ignore it.

## The push scope

The check has two scopes, and the pushed remote decides which one applies:

- `push` — judge every push. The approved identity must be behind everything the
  project publishes, wherever it is published.
- `push-upstream` — judge only a push to the branch's tracked upstream remote. A
  contributor whose `origin` is a fork can push reviewed work to the fork under
  their own identity and let the upstream maintainer take it from there.

The tracked upstream is resolved in one order, and the resolution is printed when
it decides a skip:

1. the branch's own upstream ref (`@{upstream}` → `<remote>/<branch>`);
2. `branch.<name>.remote` — a branch that has not been pushed yet still names the
   remote git will track once it is;
3. the remote that owns the mainline (`refs/remotes/<remote>/HEAD`);
4. `origin`.

`pre-push` passes the remote being pushed to (`--remote`); a name that is not a
configured remote — a URL, an ad-hoc path — stays unnamed, and **an unnamed remote
keeps the check**. The scope can only ever skip a push whose remote is explicitly
named and differs from the upstream one, so a caller that forgets the flag loses
convenience, never the guard.

```sh
bun scripts/push-identity-check.mjs --base origin/main --remote fork   # by hand (node runs it too)
```

What the range is respects reachability (issue #539): a commit already reachable
from a published ref — the remote mainline, and the pushed branch's own remote
tip the hook passes as the base — cannot be changed by this push, so it is
skipped and only the never-published commits are judged. Merging `origin/main`
into a branch used to put main's own history in the range and refuse the push
over commits (forge web-merges, journal aggregations, CI runs) that no local
push could affect. The same rule governs the journal gate, which additionally
accepts the published journal tip as a byte-prefix baseline for an integration
push. A checkout with no remote-tracking ref keeps the strict reading — fetch,
never loosen the matcher.

## Portability of the whole guard surface

The identity guard is one carrier of a set that used to assume one machine, one
remote and one forge. The rest — the turn-contract verifier, the merge wrapper and
the command guard — resolve their forge from the remote (`gh`, `glab`, `gt`; a
Bitbucket remote is refused with the message naming its absent CLI) and their
temporary directory through one shared helper. The matrix, the allowlist and the
degradation contract are documented where those hooks live:
[`template/.agentic-workflow/hooks/README.md`](../../template/.agentic-workflow/hooks/README.md).
A `rigidity-review` gate step audits that surface, so a hardcoded forge binary, a
`/tmp` fallback or an `origin/HEAD` coming back fails the gate instead of the next
external contributor.

## Test suites: `-c`, never `git config`

A fixture that writes configuration writes it into *whichever* file git resolves,
and that is not always the throwaway one — a `GIT_DIR` inherited from `git push`,
or a failed `mkdtemp`, sends the write into the shared checkout. The convention is
one invocation, one value:

```js
const ID = ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false"];
execFileSync("git", [...ID, "commit", "-qm", "fixture"], { cwd: root });
```

`scripts/git-config-writes.mjs` enforces it over every test carrier in this
repository, and every `bunfig.toml` preloads the locator scrub so a single-file
run is as protected as a gate run.

## Recommended environment layout

None of this is applied by the workflow; each line is the operator's.

1. **`user.useConfigOnly = true`** — git refuses to invent an identity from the
   hostname. The failure is loud and early instead of a commit attributed to
   `root@buildbox`.
   ```sh
   git config --global user.useConfigOnly true
   ```
2. **One identity per project through `includeIf`** — the multi-identity layout,
   kept out of the repository and out of every agent's reach:
   ```gitconfig
   [user]
       useConfigOnly = true
       name = Personal Name
       email = personal@example.com
   [includeIf "gitdir:~/work/"]
       path = ~/.gitconfig-work
   ```
3. **`git config --show-origin --show-scope --list user\.`** as the first
   diagnostic for any attribution question: it names the file and the scope that
   won, which is the fact a repair needs.
4. **A dedicated signing key per machine**, with its public key uploaded once —
   a key shared across machines cannot be revoked without breaking the others.
5. **A guard for the other dangerous commands** (not identity-specific, and never
   a substitute for Layer 2): a permission layer that persists approvals and does
   not fail closed in a loop. Re-prompt fatigue is what makes an operator click
   through a real question.
6. **`pre-commit` + the push gate armed in CI for the branches you protect**, so a
   machine without the local hook still cannot publish a misattributed commit.

## Not recommended

- **Pinning identity with `GIT_CONFIG_COUNT` environment variables.** Rejected
  by owner decision (2026-11-11): it fights git's own layering and destroys
  legitimate per-project identities. At most an emergency-containment procedure
  for a machine that is actively leaking, never the design.
- **Rewriting published history to fix attribution.** It invalidates every
  signature and every SHA-bound receipt; only the owner may decide it.
- **Blocking `git config` wholesale.** Hermetic fixtures, the docs-generated
  merge driver and legitimate setup flows need it; the guard questions identity,
  signing, scope escalation and removal — not every write.
- **Automatic repair.** A tool that "fixes" identity overwrites the value the
  operator chose. Diagnose, refuse, print the command; the human decides.
- **A blanket permission gate with no persistence.** Asking the same question on
  every call trains the operator to approve without reading.

## What `init-workspace` does

Nothing from this page by default. It may *offer*, once, with an explicit yes:

- install the pre-commit hook (or chain it from an existing one);
- scaffold `.pi/agentic-workflow.json` with a `gitIdentity` block whose
  `enforce` is `off` and whose `approved` is empty, for the operator to fill in.

A "no" is remembered for the session and installs nothing.
