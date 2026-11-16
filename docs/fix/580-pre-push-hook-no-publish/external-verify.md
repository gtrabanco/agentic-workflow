# External verification — fix/580-pre-push-hook-no-publish

Full verdict (no earlier `EXTERNAL VERIFY` block existed for this unit; no
correction has landed since the last receipt). Unit bound: this directory, base
`a05d6907` (the merge-base with `origin/main` `d1287c3d`), head `71285603`.
Read-only: no commit, no push, no branch, no forge mutation. Probes ran in
`mktemp -d` scratch; the changed installer and hook were never executed against
the live repository. Disclosure: this verifier is the session that wrote the
unit's journal fragment — every probe below was derived from the `S#` wording and
run independently of the change's own cases, which were also re-run against the
base implementation (P7).

```text
EXTERNAL VERIFY — base: a05d6907 · head: 71285603
Blockers: 2 —
  B1 AGENTS.md:270 — the rewritten paragraph fuses two sentences: the bytes read
     `…the range-bound steps stay dropped.A checkout carrying the old hook…` —
     no space after the period. Reproducer: `rg -o 'stay dropped\.A checkout'
     AGENTS.md` → 1 match. Base a05d6907 ends that line at `…never a silent
     skip.` and opens the reinstall sentence on a fresh line, so the fusion is
     this diff's. Smallest action: insert the space.
  B2 AGENTS.md:270 — the new clause "several refs, or a ref git cannot prove a
     base for, leaves the base unproven" drops the qualifier the behaviour and
     the issue's own wording carry (`publishable`). The hook counts ref
     *updates* (scripts/local-gate.mjs:813-822), so a push mixing a deletion
     with a branch update carries several ref lines and still proves a base.
     Reproducer (P4 "deletion + publishable"): two ref lines, one deletion, one
     update → gate argv ["--skip-network","--remote","origin","--jobs","auto",
     "--push-base","1111…"] — a base, where the guide promises none. Base
     a05d6907's guide had no such clause (the claim is new text) and the
     issue's S-level wording is "Several publishable refs leave the base
     unproven". Smallest action: insert `publishable`.
Advisories: 4 —
  A1 docs/fix/441-triage-issue-rescope/SPEC.md:222-228 — a surviving mention
     asserting the old truth (`installHook` builds `<root>/.git/hooks`; "smallest
     action: resolve the hooks directory with `git rev-parse --git-common-dir`,
     as its own unit"). A frozen legacy unit doc, never edited in place, and the
     "own unit" it names is this one.
  A2 AGENTS.md:267-269 — unchanged lines still say the hook "passes the remote
     tip to the gate as `--push-base`", which was never true for the single
     new-branch case (the merge-base is passed — measured, P3). Present at base,
     untouched by this diff.
  A3 delivery state, not behaviour: PR #581 reports `mergeable: false`
     (`mergeable_state: dirty`) because `origin/main` moved 13 commits after
     a05d6907 and #568 added a docs/ROADMAP.md row in the same table region. The
     armed drivers resolve both shared docs (`git merge-tree --write-tree` →
     tree 01633edf, no conflict); GitHub has no drivers. Integration is the
     owner's step (AGENTS.md › Working rules).
  A4 obligation O3's declared validator names branch
     `fix/568-doctor-unreachable-gutter`; it is merged into main and its
     worktree is gone, so that receipt cannot be re-run verbatim. The mechanism
     is re-proven in scratch (P3 legs).
Sibling sweep: clean on live surfaces — no skill, `docs/workflow/` page, README
     or template text still asserts the fabricated range or the `.git/hooks`
     guess. The two surviving mentions are A1 and append-only `docs/LOGS.md`
     history. The hook's own comment was rewritten with the code: "the gate runs
     every step" became "the range-bound steps stay dropped".
Completeness: S1→P1,P2,P4 · S2→P2,P4 · S3→P1,P3 · S4→P1,P3 — every `S#`
     resolves to a task carrying it with a validator that re-runs green here; no
     open ids. Obligations O1-O7 all `verified`, validators re-run green
     (O3 receipt-only, A4).
Spot check: bun test scripts/local-gate.test.mjs → match (59 pass · 0 fail this
     run; reported E3 59 pass · 0 fail)
Verdict: NEEDS-DECISION (B1, B2)
```

## Probe ledger (`mktemp -d`, removed after the run)

- **P1** — installer writes exactly the body it declares: head
  `--install-hook` → exit 0, `cmp` against `hookBody()` byte-identical; base →
  exit 0, byte-identical to its own body.
- **P2** — hook body delta base→head is one hunk: the base-selection comment,
  the `publishable` counter, the no-publish early exit, the guarded fallback,
  `HOOK_MARKER` interpolation. Nothing else in the body moved: the skip hatch,
  `--remote`, the jobs budget and the neither-runtime refusal are unchanged, and
  the step table is untouched (`git diff a05d6907..HEAD -- scripts/local-gate.mjs`
  = 53 lines, all inside `hookBody`/`hooksDir`/`installHook`/`HOOK_MARKER`).
- **P3** — real `git push` over a local file remote, branch carrying an
  already-published commit authored by `GitHub <noreply@github.com>`, up to date
  with its own remote ref. Base hook: the gate runs with
  `--push-base cb404796…` = `origin/main` = the mainline merge-base, and the
  range contains the published foreign-committer commit — the S1 mechanism.
  Head hook, same repository and same invocation (`git push` and
  `git push --dry-run`): exit 0, exactly one stderr line
  `local gate: nothing to publish — …no range to judge`, the gate never ran.
  New-branch leg: the fallback still passes the merge-base
  (`--push-base cb404796…`, equal to `git merge-base HEAD origin/main`).
- **P4** — ref-line shapes against the installed head hook: deletion-only → exit
  0, no gate; empty stdin → exit 0, no gate; one new branch → gate with
  `--push-base <merge-base>`; two publishable refs → no `--push-base`, offline
  subset still runs; deletion + publishable → gate with a base (B2); single
  update → the remote sha as base.
- **P5** — `--install-hook --repo <worktree>`: base → exit 1, `ENOTDIR` in
  `binding.mkdir`; head → exit 0, writes `<main>/.git/hooks/pre-push`,
  byte-identical to `hookBody()`. `--repo <plain dir>` → exit 2,
  `<dir> is not a git checkout`.
- **P6** — marker: foreign hook → exit 2 "exists and is not this gate's hook";
  an older gate-owned body (the header sentence, stale content) → exit 0,
  replaced with the current body, no `--force`; identical re-run → `already
  installed`, exit 0. Base installer over the head body → exit 2 (the S4 defect
  it repairs).
- **P7** — red-first, independently: the head corpus against the base
  implementation → `1 pass · 5 fail` (the new-branch pin, which must stay green,
  is the pass); the same corpus against the head implementation →
  `6 pass · 0 fail`.
- **P8** — declared validators, foreground: `bun scripts/docs-generate.mjs
  --check` → PASS (`3 files · 0 stale · roadmap unchanged`);
  `bun scripts/check-skill-context.mjs --documents` → PASS
  (`AGENTS.md 708` of `709`).
- **P9** — `bun scripts/local-gate.mjs --jobs auto` at this head (run this
  session, before this verdict): exit 0 · `local-gate: PASS — 19 step(s) in
  409s`; the pi-package suite's single `skipped` is
  `packages/pi-agentic-workflow/test/config-jsonc.test.mjs:127`
  (`this runtime has no native JSONC parser`), a pre-existing conditional skip.

## Correction batch and blockers-only recheck — 2026-11-16

One batch, applied by the implementer under `/aw-local-apply`'s correction bounds:
B1, B2 and the advisories that deserve repair (A1, A2, A4-record); A3 is the
owner's integration step and was not touched.

| finding | correction | reproducer, re-run |
|---|---|---|
| B1 fused sentences | `stay dropped.A checkout` → `stay dropped. A checkout` (`AGENTS.md:270`) | `rg -c 'stay dropped\.A checkout' AGENTS.md` → **0** (was 1) |
| B2 "several refs" | `several publishable refs` in the guide, in the hook's own comment (`scripts/local-gate.mjs:810-812`), in the unit doc's roadmap summary and corpus line, and in the regenerated `docs/ROADMAP.md` row | `rg -n 'several refs'` on those surfaces → only the unit doc's L5 sentence quoting the corrected claim |
| A1 stale record | additive `## Superseded record:` section in `docs/fix/441-triage-issue-rescope/SPEC.md` (the #572 shape: annotate a frozen doc, never rewrite it) | `bun test scripts/triage-rescope.test.mjs` → `20 pass · 0 fail` (`#441-B5` reads that file) |
| A2 remote tip | the sentence now names the single-new-branch merge-base it actually passes | behaviour re-measured: new branch → `--push-base <merge-base>` |
| A4 O3 validator | recorded in the unit doc's `## Log` L5, not re-runnable (branch merged, worktree gone) | n/a — receipt limitation, stated |

Behaviour re-check on the corrected hook body (comment-only delta, `diff` of the
installed bytes base→head shows the intended hunk and nothing else): up-to-date
`git push` → exit 0, one stderr line, gate never ran; deletion-only → exit 0, no
gate; deletion + publishable → gate with the publishable ref's remote sha as
base; two publishable refs → no `--push-base`, offline subset still runs.

Recheck verdict: **B1 and B2 reproduce as fixed; no new finding.** A3 stays open
with the owner (PR #581 is `dirty` against a `main` that moved 13 commits).

### Validators re-run in the foreground

- `bun test scripts/local-gate.test.mjs` · exit 0 · `59 pass · 0 fail`
- `bun test scripts/triage-rescope.test.mjs` · exit 0 · `20 pass · 0 fail`
- `bun test scripts/release-workflows.test.mjs` · exit 0 · `26 pass · 0 fail`
- `bun test scripts/invocation-drift.test.mjs` · exit 0 · `13 pass · 0 fail`
- `bun test scripts/residue-dimensions.test.mjs` · exit 0 · `30 pass · 0 fail`
- `bun scripts/check-skill-context.mjs --documents` · exit 0 · `AGENTS.md 708` lines
  (ceiling 709) · estimate `12483` (ceiling `13259`)
- `bun scripts/docs-generate.mjs --check` · exit 0 · `3 files · 0 stale`
- `bun scripts/local-gate.mjs --jobs auto --no-bail` · exit 0 · `PASS — 19 step(s) in 610s`
- Honest note: a first `--bail` run of that gate stopped at `worktree-guard` with two
  STALE findings naming `feat-565-quality-sensor` and `fix-570-track-undici-advisories`
  — worktrees owned by concurrent sessions, sitting on merged tips. Not this
  change's surface (`git status` carried only this unit's files); both advanced
  their branches and the guard is `0 finding(s)` now. Nothing of theirs was
  removed or touched.

## After the batch: integration and recheck on the integrated head

The owner integrated `main` into the branch while the batch was in flight
(`9c1a4d56`, GitHub web-merge). The batch's two unpublished commits were
replayed onto it; the armed shared-doc driver resolved `docs/ROADMAP.md` to the
union of both sides' rows (568's and 580's) and the emitter reported the
projection unchanged.

- `bun test scripts/local-gate.test.mjs` · 59 pass · 0 fail
- `bun test scripts/triage-rescope.test.mjs` · 20 pass · 0 fail
- `bun test scripts/release-workflows.test.mjs` · 26 pass · 0 fail
- `bun test scripts/invocation-drift.test.mjs` · 13 pass · 0 fail
- `bun test scripts/residue-dimensions.test.mjs` · 30 pass · 0 fail
- `bun test scripts/pre-execution-quality.test.mjs` · 1 pass · 0 fail
- `bun test scripts/git-env.test.mjs` · 6 pass · 0 fail
- `bun test packages/agentic-workflow/test/doctor.checks.test.mjs` · 21 pass · 0 fail
- `bun scripts/local-gate.mjs --jobs auto --no-bail` · exit 0 · `PASS — 19 step(s) in 841s`

Two reds seen and cleared during that sequence, both foreign to this change and
both named here rather than buried: `worktree-guard` flagged
`feat-563-init-workspace-interview` (another session's fresh worktree, no commits
of its own, so the guard reads it as merged); and one `--no-bail` run reported
`root-suite` red under load average 10 with one worker, a step that passes
standalone (`bun scripts/run-root-suite.mjs` exit 0) and in the next gate run.
