---
type: fix
scope: xs
roadmap_summary: Issue [#580](https://github.com/gtrabanco/agentic-workflow/issues/580): a push that publishes nothing — an up-to-date branch, a dry run, a deletion — carried no ref line on the `pre-push` hook's stdin, and the hook fabricated a mainline merge-base range from it; the range gates then judged already-published history (a GitHub web-UI merge) and refused a push that sent nothing. The hook now exits 0 before any range step when nothing is published, several refs leave the base unproven, `--install-hook` asks git where the hooks live (so it works from a worktree) and its own-body marker is interpolated into the body it generates. SPEC: [SPEC](fix/580-pre-push-hook-no-publish/SPEC.md)
---

# fix/580-pre-push-hook-no-publish

> The installed `pre-push` hook resolved one base per push from the refs git
> delivers on stdin, and fell back to the mainline merge-base whenever that list
> produced none. git runs the hook even when the push sends no ref update, so an
> up-to-date branch, a dry run and a deletion-only push all reached the gate
> with a fabricated range: published history came back into it, `push-identity`
> refused a GitHub web-merge that can never be rewritten, and the push failed
> for sending nothing. The same surface's installer guessed `.git/hooks` from
> the shape of `.git` — which is a file in every worktree this repository builds
> its units in — and its "is this my hook?" marker no longer appeared in the
> body it generates.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#580` — the pre-push hook judges a fabricated range when a push publishes
nothing, and `--install-hook` dies in a worktree. The PR closes it via
`Closes #580`.

## Specs

**S1 — the failing push, verbatim.**
> "There are errors while trying to push this branch:
> [...]
> `local-gate: the push range verdict targeted (TEST IMPACT — targeted) — the test step(s) run`
> `PUSH IDENTITY — failed: 1 of 10 commit(s) outside the approved profile`
> `  a239a75ae6f801c91bb040dd5830c32c502f3516 author Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com> — expected Gabriel Trabanco Llano <1969593+gtrabanco@users.noreply.github.com>`
> `  a239a75ae6f801c91bb040dd5830c32c502f3516 committer GitHub <noreply@github.com> — expected Gabriel Trabanco Llano <1969593+gtrabanco@users.noreply.github.com>`
> `local-gate: FAILED at push-identity`
> `error: failed to push some refs to 'github.com:gtrabanco/agentic-workflow.git'`"

**S2 — the remedy, verbatim.**
> "I had done git push --no-verify but this need to be fixed"

**S3 — the installer, reported while reinstalling, verbatim.**
> "`ENOTDIR: not a directory, mkdir '…/.worktrees/fix-568-doctor-unreachable-gutter/.git/hooks'`"

**S4 — the stale-hook marker, reported while reinstalling, verbatim.**
> "`local-gate: /home/agent/projects/agentic-workflow/.git/hooks/pre-push exists and is not this gate's hook — re-run with --force to replace it`"

## Impact

- `scripts/local-gate.mjs` — `hookBody()`'s stdin loop and fallback;
  `installHook()`'s hooks path, plus `HOOK_MARKER` (now interpolated into the
  body, so it cannot drift from the body it marks) and a new `hooksDir()`.
- `scripts/local-gate.test.mjs` — the hook and installer corpus: six new cases
  plus two fixture corrections (see `## Log` L3).
- `AGENTS.md` › Verification › "Where the gate runs" — the paragraph that states
  what the hook passes as `--push-base`; the no-publish and unproven-base rules
  are stated there now, and the reinstall sentence says the installer asks git
  for the hooks directory.
- Consumers: the installed hook in every checkout of this repository (the hooks
  directory is shared, so one install serves all worktrees), and
  `bun scripts/local-gate.mjs --install-hook` used by hand.
- No gate step, no step id and no `--`-flag of the gate changed: `push-identity`
  and `log-immutability` keep their argv, so `docs/workflow/GATE_INVENTORY.md`
  needs no row change and none was made.

## Retirements

none — strictly additive. The only behaviour removed is the fabricated
merge-base range, which was never a contract: it is the defect. `HOOK_MARKER`'s
old value (`scripts/local-gate.mjs --skip-network`) is superseded by the
interpolated sentence; no consumer reads the constant besides `installHook()`
(`rg -n 'HOOK_MARKER' scripts/` → the definition, the interpolation and the one
use in the refusal). No package surface changed, so this unit carries no
`.changeset/` intent — the same shape every `scripts/`-only fix lands with
(`git log --no-merges -- scripts/` for #441, #537, #571).

## Non-goals

- Not a change to the two range gates' policy. `published-refs.mjs` keeps its
  published set exactly as issue #539 shipped it; this unit stops the hook from
  handing it a range nobody is pushing. Making `publishedRefs()` resolve
  `@{upstream}` by itself would also fix the by-hand `--base origin/main`
  recipe in `docs/workflow/GIT_IDENTITY_HARDENING.md`, and that is its own
  unit — no open issue covers it at this writing.
- No new escape hatch, no `--no-verify` and no history rewrite: the offending
  commit of S1 is a forge-made, already-published merge, so no local rewrite can
  reach it.
- Not a change to `test-impact`, to the step table or to `--install-hook`'s
  output wording beyond the hooks path it names.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood · contained · resumable-from-diff`
- **Named high-risk item** — the hook is the only thing between a push and the
  gate: a wrong early exit would let an unverified push through. The rule is
  narrow on purpose — `publishable` counts ref *updates* only, and every case
  that publishes a commit still reaches the gate.

## Future

none

## Future cost

- A future git that delivers ref lines for a no-op push would make the early
  exit unreachable and the fabrication return; the case "a push that publishes
  nothing runs no range step" feeds an empty stdin directly, so the rule is
  pinned independently of git's own behaviour.
- A `HOOK_MARKER` that stops being the header sentence it interpolates cannot
  happen silently: the marker *is* the header text, and the "older gate-owned
  hook is replaced without --force" case fails the moment that stops being true.

## Applicable tests

- `scripts/local-gate.test.mjs` — the hook's own corpus: the six cases this unit
  adds (empty stdin, deletion-only, new-branch fallback, several refs, worktree
  install, older-body replacement) plus every pre-existing body and installer
  pin.

## Known pre-existing issues

- A fresh worktree has no `node_modules`, so the suite's
  `journal-carrier-check` case fails there with
  `Cannot find package 'mdast-util-from-markdown'` until `bun install
  --frozen-lockfile` runs in that worktree. Measured at base `a05d6907` before
  any change here, and green after the install (§`## Log` E12).

## Acceptance criteria

- **AC-S1** — A push that sends no ref update publishes nothing and is let
  through: empty stdin → exit 0, one stderr line, no gate run. Check: the case
  "a push that publishes nothing runs no range step" (E3) and the receipt at the
  branch S1 named (E6).
- **AC-S2** — A deletion-only push is the same case; a single new branch keeps
  its merge-base fallback; several publishable refs leave the base unproven.
  Check: the three cases of the same name (E3).
- **AC-S3** — `--install-hook` resolves the hooks directory through git: it
  installs the shared hook from a worktree and replaces an older gate-owned body
  without `--force`. Check: the two installer cases (E3), and the real
  installation from a worktree (E8, E9).
- **AC-S4** — Nothing else about the hook or the gate changes: the jobs budget,
  the `--remote` flag, the skip hatch, the neither-runtime refusal and every
  step row keep their pins. Check: `bun test scripts/local-gate.test.mjs` (E3)
  and the root gate (G1).

## Tasks

- P1 — The red corpus: six cases in the hook/installer sections, observed
  failing on the base implementation. (Implements: S1, S3, S4)
  (validator: `bun test scripts/local-gate.test.mjs` exits non-zero, only the new cases red)
  - Relevant files: scripts/local-gate.test.mjs
- P2 — `hookBody()`: count the ref updates a push actually publishes, exit 0
  before any range step when there are none, fall back to the merge-base only
  for a single new ref. (Implements: S1, S2)
  (validator: the four hook cases green; the pre-existing body pins unchanged)
  - Relevant files: scripts/local-gate.mjs
- P3 — `installHook()`: resolve the hooks directory with
  `git rev-parse --git-path hooks`, and interpolate `HOOK_MARKER` into the body
  it marks. (Implements: S3, S4)
  (validator: the two installer cases green; `--install-hook` from this worktree installs the shared hook)
  - Relevant files: scripts/local-gate.mjs
- P4 — Surfaces: the guide paragraph, the unit doc, the `## Fixes` row, the
  generated projection, the journal fragment and the gate. (Implements: S1, S2)
  (validator: `bun scripts/check-skill-context.mjs --documents` exits 0; `bun scripts/docs-generate.mjs --check` exits 0)
  - Relevant files: AGENTS.md, docs/ROADMAP.md, docs/generated/units.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-probe | git runs `pre-push` with an empty stdin when the push sends no ref update: `git push` on an up-to-date branch and `git push --dry-run` both delivered zero lines, while a new branch delivered one line with an all-zero remote sha | a logging `core.hooksPath` wrapper capturing the real invocation, this session | run 2026-11-16 at `a05d6907` | S1; O1, O2, O3 |
| PE-002 | committed-source | The fallback was unconditional: `if [ -z "$base" ]` ran `git merge-base HEAD <remote>/main` whenever the loop produced no base, with no distinction between "no ref" and "a ref with no remote tip" | `scripts/local-gate.mjs:806-821` at base `a05d6907` | read 2026-11-16 at `a05d6907` | S1; O1, O2, O3 |
| PE-003 | measured-probe | With the fabricated base the range is `44a20ab6..HEAD` (10 commits) and `push-identity` refuses `a239a75a`; with the branch's own remote tip it is `ok: 4 commit(s)` and with the current tip `ok: 0` | `bun scripts/push-identity-check.mjs --base <rev>` over the branch named in S1 | run 2026-11-16 | S1, S2; O1, O2 |
| PE-004 | committed-source | `installHook()` built `path.join(root, ".git", "hooks")` and created it with `mkdir`, so a worktree (`.git` is a file) raises `ENOTDIR` | `scripts/local-gate.mjs:845-848` at base `a05d6907` | read 2026-11-16 at `a05d6907` | S3; O4 |
| PE-005 | committed-source | `HOOK_MARKER` was `"scripts/local-gate.mjs --skip-network"`, while the body writes `"$root/scripts/local-gate.mjs" --skip-network` — the quote between them means the marker never matches the body it generates, so a real body change made `--install-hook` refuse its own hook | `scripts/local-gate.mjs:72`, `:790-800`, `:882` at base `a05d6907` | read 2026-11-16 at `a05d6907` | S4; O5 |
| PE-006 | committed-source | `--install-hook` is the documented reinstall path for an older body (`AGENTS.md` › Verification), and the repository builds every unit in a worktree (`AGENTS.md` › Worktree creation), so both installer defects hit the normal path | `AGENTS.md` §Verification, §Worktree creation at `a05d6907` | read 2026-11-16 | S3, S4; O4, O5 |
| PE-007 | measured-probe | The suite's runtime-refusal case reached the refusal through an empty stdin; with the early exit that input no longer represents "a push", so the case feeds the ref line git delivers — its assertion is untouched | `scripts/local-gate.test.mjs` (the neither-runtime case) at base `a05d6907`; §`## Log` L3 | run 2026-11-16 | S1; O6 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1, S2 | A push that sends no ref update is let through with one stderr line and no gate run, instead of being refused on published history | P2 | P2 | direct application (this session) | the case "a push that publishes nothing runs no range step" asserts exit 0, the stderr line and that the stub gate never ran | `E` line in SPEC `## Log` (E3) | verified (E3) |
| O2 | S1, S2 | The frozen failure: at base the same invocation runs the 16-step gate and fails at `push-identity` on the forge-made merge | P1 | P1 | direct application (this session) | the base reproduction, `git push --dry-run` with the installed base hook | `E` line naming the failing step and the offending commit (E5) | verified (E5) |
| O3 | S1 | Reachability of the fix, not of a fixture: the branch named in S1 runs the installed hook to exit 0 on the same invocation that failed at base | P2 | P4 | direct application (this session) | `printf '' \| bash <shared hook> origin <url>` in that worktree | `E` line naming the worktree and the exit status (E6) | verified (E6) |
| O4 | S3 | `--install-hook` resolves the hooks directory through git, so a worktree install writes the shared hook; a directory that is not a checkout is still a usage error (exit 2) | P3 | P3 | direct application (this session) | the case "--install-hook installs the shared hook from a worktree" and the pre-existing "outside a git checkout" case | `E` lines for the suite (E3) and the real install (E8) | verified (E3, E8) |
| O5 | S4 | A gate-owned hook from an older body is replaced without `--force`, and a foreign hook is still refused without it | P3 | P3 | direct application (this session) | the case "an older gate-owned hook is replaced without --force" plus the pre-existing foreign-hook case | `E` line for the suite (E3) and the real replacement (E9) | verified (E3, E9) |
| O6 | S1, S3, S4 | Red-first: the new cases are observed failing on the base implementation before the fix lands | P1 | P1 | direct application (this session) | the two red commits' suite runs | `E` lines naming both red runs (E1, E2) | verified (E1, E2) |
| O7 | S1 | No step, step id, argv flag or gate-inventory row changes, and the rest of the hook body keeps its pins | P4 | P4 | direct application (this session) | the full suite (E3) and the root gate (G1) | `G` line in SPEC `## Log` | verified (E3, G1) |

## Triaged steps

n/a — no `## Triaged steps` block is pasted: this unit was applied through the
owner's local workflow (the issue's own words are S1/S2), which freezes the two
ledgers above in place of the lane's plan step and does not run the lane
machinery on the repository's own tooling.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the request, verbatim: the gate output of S1 plus
  "I had done git push --no-verify but this need to be fixed".
- **E1** — 2026-11-16, red at `685e0e96` (the five cases alone, base
  implementation): `bun test scripts/local-gate.test.mjs` · exit 1 ·
  `54 pass · 4 fail` — the four cases that judge the fix
  (`a push that publishes nothing runs no range step`,
  `a deletion-only push publishes nothing`,
  `several publishable refs leave the base unproven`,
  `--install-hook installs the shared hook from a worktree`); the new-branch
  fallback case is green because it pins behaviour the fix must keep.
- **E2** — 2026-11-16, red at `698d18de` (the sixth case alone):
  `bun test scripts/local-gate.test.mjs` · exit 1 · `58 pass · 1 fail`, the
  failure being `an older gate-owned hook is replaced without --force
  (issue #580)`.
- **E3** — 2026-11-16, green at the change:
  `bun test scripts/local-gate.test.mjs` · exit 0 · `59 pass · 0 fail`.
- **E4** — 2026-11-16, the hook's stdin measured at base `a05d6907` with a
  logging `core.hooksPath` wrapper: `git push` on an up-to-date branch → no
  ref line; `git push --dry-run` → no ref line;
  `git push --dry-run origin HEAD:refs/heads/tmp-probe` → one line with an
  all-zero remote sha.
- **E5** — 2026-11-16, the frozen failure reproduced at base: with the base hook
  installed, `git push --dry-run` on branch `fix/568-doctor-unreachable-gutter`
  (head `ad9034cb`, equal to its remote tip) ran the 16-step gate and failed —
  `push-identity: exit 1` naming `a239a75a` (author `Gabriel Trabanco`,
  committer `GitHub <noreply@github.com>`), `local-gate: FAILED at push-identity`,
  `error: failed to push some refs`.
- **E6** — 2026-11-16, the same invocation after the change, in that worktree:
  `printf '' | bash <shared hook> origin git@github.com:gtrabanco/agentic-workflow.git`
  · exit 0 · `local gate: nothing to publish — this push sends no ref update, so
  it has no range to judge` (no gate step ran).
- **E7** — 2026-11-16, a deletion-only push: the same command with
  `refs/heads/gone <40 zeros> refs/heads/gone <40 ones>` on stdin · exit 0 · the
  same line.
- **E8** — 2026-11-16, the installer at base from the worktree:
  `bun scripts/local-gate.mjs --install-hook` · exit 1 · `ENOTDIR: not a
  directory, mkdir '…/.worktrees/fix-568-doctor-unreachable-gutter/.git/hooks'`;
  at the change, from
  `.worktrees/fix-580-pre-push-hook-no-publish` · exit 0 ·
  `local-gate: installed /home/agent/projects/agentic-workflow/.git/hooks/pre-push`.
- **E9** — 2026-11-16, the marker at base: `--install-hook` against the
  installed (older-body) hook · exit 2 · `exists and is not this gate's hook —
  re-run with --force to replace it`; at the change the same command · exit 0 and
  replaced it, and the installed bytes equal `hookBody()`.
- **E10** — 2026-11-16, the guide budget:
  `bun scripts/check-skill-context.mjs --documents` · exit 0 ·
  `PASS context documents: 4 budgeted documents` with `AGENTS.md` at
  `708` lines against its `709` ceiling — the added rule is one line, on the
  paragraph's own style.
- **L2** — 2026-11-16, recorded deviation (tooling, not the unit): the
  `edit`/`write` tools refuse a path outside this session's worktree
  (`path protection cannot verify it`), so every file of this unit was written
  through the shell in its own worktree. No protected path was involved and no
  policy file was changed.
- **L3** — 2026-11-16, two fixture corrections, disclosed because a test is never
  edited to pass: (a) `sandbox()` was a bare directory holding `.git/hooks`,
  which the installer can no longer accept — it now `git init`s, because
  "a directory with a `.git`" is not a checkout and the fix is exactly that
  distinction; (b) the neither-runtime case used an empty stdin as "a push
  happened", which is now the case that publishes nothing, so it feeds the ref
  line git delivers (`refs/heads/main <sha> refs/heads/main <zeros>`). Both keep
  their assertions byte-identical, and every other case in the file is untouched.
- **E11** — 2026-11-16, the real reinstall the owner asked for, from this
  worktree: `bun scripts/local-gate.mjs --install-hook` · exit 0 · the shared
  `<repo>/.git/hooks/pre-push` replaced, byte-identical to `hookBody()`.
- **E12** — 2026-11-16, the pre-existing worktree red and its repair:
  `bun test scripts/local-gate.test.mjs -t 'journal-carrier-check'` at base
  `a05d6907` · exit 1 · `Cannot find package 'mdast-util-from-markdown'`;
  after `bun install --frozen-lockfile` in the worktree · exit 0.
- **G1** — 2026-11-16, the root gate at head `c576debf`: `bun scripts/local-gate.mjs --jobs auto`
  · exit 0 · `local-gate: PASS — 19 step(s) in 408s` (the root suite, the crate and pi
  suites, the doc projections, the secret scan and the compat legs).

- **E13** — 2026-11-16, the push of the unit branch, with the installed hook:
  `git push -u origin fix/580-pre-push-hook-no-publish` ran the gate to
  `local-gate: PASS` (16 step(s) in 405s, then 439s, then 430s on three
  attempts) and every attempt ended `exit 141` (SIGPIPE) with no object sent and
  no remote ref created — git lists the remote refs (that is where `pre-push`'s
  remote sha comes from) and then waits for the hook, so the connection sits
  idle for the gate's whole run and the receive side is gone when the pack is
  written. The fourth push used the documented hatch
  (`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`) after the gate had passed at the same
  head — reason stated here and in the PR body — and completed in one second,
  which isolates the delay as the cause. **This is a separate defect of its own
  surface** (a push whose gate runs the test steps cannot complete), not
  introduced by this unit: the base hook also runs the full gate for a new
  branch, through the same merge-base fallback.

- **L4** — 2026-11-16, the §7 journal surface was the one row still absent at this
  head (no entry for this branch in `docs/LOGS.md` and no fragment in the
  carrier), so it is written through the carrier's own writer —
  `agentic-workflow journal write --kind narrative --base a05d6907` · exit 0 ·
  `20261116T112241Z-fix-580-pre-push-hook-no-publish-narrative-01a1e416-…md`,
  and `journal aggregate --check` · exit 0 · `checked: 70 · refusals: []`. No
  hand-written byte: the aggregator appends it to `docs/LOGS.md` at merge.

## Next

The diff goes to the owner as the external verifier; the `## Fixes` row leaves
the table once the PR merges. Two findings this unit does not fix and that no
open issue covers yet: the by-hand `--base origin/main` recipe in
`docs/workflow/GIT_IDENTITY_HARDENING.md` still over-judges a branch carrying a
forge merge, and the long-gate push above (E13).

## References

- Issue [#580](https://github.com/gtrabanco/agentic-workflow/issues/580) —
  `Closes #580`.
- Issue [#539](https://github.com/gtrabanco/agentic-workflow/issues/539) — the
  published-refs rule the fabricated range defeated.
- Issue [#546](https://github.com/gtrabanco/agentic-workflow/issues/546) — the
  `--remote` scope and the neither-runtime refusal this hook carries.

## Branch

`fix/580-pre-push-hook-no-publish`

## Depends on

none

## Regression scope

| Scenario | Verified by |
|---|---|
| An up-to-date or dry-run push publishes nothing and is let through | the empty-stdin case (E3) and the real branch (E6) |
| A deletion-only push is the same case | the deletion case (E3), receipt E7 |
| A single new branch still gets the merge-base base | the new-branch case (E3) |
| Several publishable refs leave the base unproven | the several-refs case (E3) |
| A worktree installs the shared hook; a non-checkout is a usage error | the two installer cases (E3), receipt E8 |
| An older gate-owned body is replaced without `--force`; a foreign hook still needs it | the two marker cases (E3), receipt E9 |
| The rest of the body and every gate step are unchanged | the full suite (E3), the root gate (G1) |
