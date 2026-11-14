---
type: fix
scope: small
ac-hash: 4b5f0511aa0b6734834c7b3996ddec931c05935e
---

# fix/539-push-identity-range

> `scripts/push-identity-check.mjs` (#514) and `scripts/log-immutability.mjs`
> (#468) judge the whole `<branch upstream>..HEAD` range, so a local push of a
> branch that merged `origin/main` is judged on commits that are already
> published — a structural false positive that refuses every merge-push. Both
> gates now judge only what the push can still affect: commits not reachable
> from a published ref, and a journal baseline that may be the published tip.
> Applied through the owner's local unpublished workflow (§5 ledger freeze
> substitutes for the lane's plan step); no repo review/fold machinery runs on
> this change.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#539` — "push-identity and log-immutability refuse every local push of a branch
that merges origin/main: judge only never-published commits". The PR closes it
via `Closes #539` in the body.

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. `S1` is
the owner's apply instruction; `S2`–`S7` are the issue's own lines, in the order
the issue states them.

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #539

**S2 — Both gates refuse a push that introduces nothing new.**
> `scripts/push-identity-check.mjs` (issue #514) and `scripts/log-immutability.mjs` (#468) judge the whole `<branch upstream>..HEAD` range. For any local push of a branch that has merged current `origin/main`, that range necessarily contains commits that are **already published on `origin/main`** through routes that never pass a local hook (GitHub web merges, CI journal aggregations). Both gates then refuse a push that introduces nothing new — a structural false positive that blocks every local push of a merge of main. It had never fired before because no branch had merged this main (`git branch -r --contains <sha>` → only `origin/main`).

**S3 — push-identity judges only never-published commits.**
> - **`push-identity-check`**: while walking `base..head`, skip commits already reachable from a published ref (`origin/main`, plus the pushed branch's own remote tip); every other commit is judged unchanged.

**S4 — The three push-identity cases land red-first in the existing suite.**
>   - Cases added first in `scripts/push-identity-check.test.mjs` (8 existing): `[published-non-approved, new-approved]` → `ok` (**red today**); `[new-non-approved]` → still `failed` — the guard keeps all its teeth; `[published-approved, new-approved]` → `ok`.

**S5 — log-immutability skips published commits and accepts the published journal tip as its baseline.**
> - **`log-immutability`**: the same ancestry skip on the identity half; the byte-prefix baseline accepts the **published** journal tip (`origin/main`) as well as the branch upstream for an integration push.

**S6 — The three journal cases land in the existing suite.**
>   - Cases in `scripts/log-immutability.test.mjs` (19 existing): published hand-appends skipped; a journal that extends the published one passes; a genuinely **new** hand-appended commit still fails.

**S7 — Reachability only; no identity classes and no escape hatch.**
> - No identity-class exemptions (bots / forge accounts): a local process can spoof them — the filter is about **reachability**, not identity classes.
> - No escape hatch (`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE`), no `--no-verify`, no force-push and no history rewrite of any kind as the solution.

## Impact

- `scripts/published-refs.mjs` — **new**, and the only place the range policy is
  decided: `publishedRefs()` names the already-published refs (the remote's
  mainline first — `refs/remotes/origin/HEAD`'s target, else
  `refs/remotes/origin/main` — then the caller's extras, which is how the pushed
  branch's own remote tip enters), and `unpublishedCommits()` answers the
  commits of a range that no published ref reaches. Absent refs drop out, so a
  checkout with no remote keeps today's semantics exactly.
- `scripts/push-identity-check.mjs` — `rangeCommits()` filters its walking list
  through `unpublishedCommits()`; `main()` passes the resolved base as an extra
  published ref (it is the pushed branch's own remote tip when the hook supplies
  it). Rendering, exit codes, usage errors and the config resolution are
  untouched.
- `scripts/log-immutability.mjs` — `checkRange()` builds the published set once,
  skips the **identity** judgement of a commit that set already reaches, and
  tries the published journal tip as a byte-prefix baseline before the range
  base. Every commit in the range is still *walked* (a published aggregator's
  fragment consumption stays attributed, so a merge resolution is never blamed
  for a deletion the aggregator already published). The working-tree half, the
  grammar checks and every exit code are untouched.
- `scripts/push-identity-check.test.mjs`, `scripts/log-immutability.test.mjs` —
  the frozen corpus each issue names, extended; every pre-existing case keeps
  its exact assertions. `scripts/published-refs.test.mjs` — **new** sibling
  suite for the new module.
- `docs/workflow/GIT_IDENTITY_HARDENING.md` + its `template/` twin — the
  push-range section states what the range is judged against.
- `docs/workflow/GATE_INVENTORY.md` — the two gate rows' statements of what they
  check.
- Repository state: the roadmap `## Fixes` row (through the writer), the
  rendered projection, the journal fragment for the session entry.

Consumers of the changed surface: `scripts/local-gate.mjs` (the `push-identity`
and `log-immutability` steps, both argv-only — no argument changes) and the
documented by-hand invocation. Nothing imports `rangeCommits`, `checkRange` or
the new module outside these files (`rg -n 'rangeCommits|checkRange' scripts
packages skills docs` reports the definitions, their callers and the suites).

## Retirements

Nothing is retired. The change is additive in behaviour and subtractive only in
what the two gates judge:

- No export, flag, output line or exit code is removed:
  `rg -n 'PUSH IDENTITY —|Log-immutability:' scripts` still finds the same two
  renderers, and `PUSH IDENTITY — skipped:` / `Log-immutability: <code>` keep
  their wording.
- The superseded claim — "every commit of `<base>..<head>` is judged" — was
  prose in three places (the two headers and
  `docs/workflow/GIT_IDENTITY_HARDENING.md`). Each now carries the boundary: the
  log header's baseline bullet and both annex layer-table rows were rewritten in
  place, and the push-identity header sentence plus the annex push-range lead
  keep their general wording directly beside the reachability paragraph that
  names it ("only the never-published commits are judged"). The old
  single-asterisk phrasing is absent from the docs surface: `rg -n 'every author
  \*and\* committer of' docs/workflow template/docs/workflow` finds nothing
  (exit 1), while `rg -c 'never-published' docs/workflow/GIT_IDENTITY_HARDENING.md
  template/docs/workflow/GIT_IDENTITY_HARDENING.md` answers 2 lines in each
  copy.
- No second copy of the range policy survives: the two scripts call one module
  (`rg -c 'publishedRefs\\(' scripts/*.mjs` → the module's definition and its two
  callers, never a private copy).

## Non-goals

- No identity-class exemption and no reachability exception keyed on *who*
  authored a commit (S7): the filter is ancestry, so a bot identity that is
  genuinely new is still judged like any other commit.
- No escape hatch, `--no-verify`, force-push or history rewrite (S7). The
  bypass the issue names (`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE`) stays exactly as
  the hook already documents it, and neither script grows a second one.
- No network: the published refs are the checkout's own remote-tracking refs. A
  stale `origin/main` therefore still leaves a published commit judged — the
  conservative direction, and the operator's `git fetch` is the repair.
- No change to *what* either gate decides about a never-published commit: the
  identity comparison, the journal grammar, the aggregator identity set, the
  fragment rules and the working-tree half are byte-identical.
- No new config key: the policy is derived from the repository's refs, so
  nothing enters the unified config (config policy, question 1).
- No `--published <ref>` flag: the hook has one argv shape and the issue names
  no new surface.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict (`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier
classify --base a83b9b38 --paths scripts/push-identity-check.mjs
scripts/log-immutability.mjs scripts/published-refs.mjs
scripts/push-identity-check.test.mjs scripts/log-immutability.test.mjs
scripts/published-refs.test.mjs
docs/fix/539-push-identity-range/SPEC.md docs/workflow/GIT_IDENTITY_HARDENING.md
docs/workflow/GATE_INVENTORY.md docs/ROADMAP.md`, at the cut head `a83b9b38`):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"1 path(s) carry executable content: scripts/push-identity-check.mjs","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

Two read-only gate scripts plus one pure helper module. Both gates only read
git; the risk is a *missed* offender (the guard losing teeth), which is exactly
what O2/O6 pin with a failing case.

## Future

- **2026-11-14, open** — the same reachability rule is a candidate for every
  other push-range reader (`scripts/test-impact.mjs` already derives its range
  from the caller, and `secret-scan` (#487) will inherit the question). Owner
  decision: fold the module into a shared range policy when a third reader lands,
  never preemptively.

## Future cost

- A future published ref that is *not* the remote mainline (a release tag, a
  second remote, a forge mirror) is invisible to this policy until
  `publishedRefs()` learns it: every new publication route must extend the one
  module, not a caller (owner: `scripts/published-refs.mjs`).
- The two gates now depend on a resolvable `refs/remotes/origin/main` (or
  `origin/HEAD`) to skip anything. A checkout that never fetches keeps judging
  published commits; the grep-able marker is the module's own docstring, and the
  repair is `git fetch`, never a loosened matcher.

## Applicable tests

- `bun test scripts/published-refs.test.mjs` — the new module's sibling suite
  (red first: it fails on the missing module).
- `bun test scripts/push-identity-check.test.mjs` — the issue's three cases,
  red first, plus every pre-existing case unchanged.
- `bun test scripts/log-immutability.test.mjs` — the issue's three cases, red
  first, plus every pre-existing case unchanged.
- `bun scripts/local-gate.mjs` — the whole gate on the implemented diff,
  including both steps this change moves and `test-impact` over the range.

## Known pre-existing issues

Every row below is red at the base commit `a83b9b38` in a clean `git archive`
copy (E9) and does **not affect** this unit: none of them is on a surface this
change edits, and each is another unit's to repair.

- `scripts/check-skill-context.test.mjs` — `FAIL context documents: AGENTS.md:
  machine-table lines 135 != the declared 134`
  (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`). **Does not affect** this unit:
  neither file is touched here (the base archive copy reproduces it), and this
  change adds no `normative-surfaces@1` row.
- `scripts/residual-classify.test.mjs` — every case fails with `Cannot find
  module './ceremony/lib.mjs' from scripts/residual-classify.mjs`: the
  `feat/352` merge retired `scripts/ceremony/*` and left that import behind
  (`git ls-tree a83b9b38 scripts/ceremony/` → `testing.mjs` only). **Does not
  affect** this unit: a different script, and the import is broken at base.
- `worktree-guard` (a `local-gate` step, no remote twin) — at G1 it reported 2
  findings on the shared checkout: `.worktrees/fix-538-engram-startup-report` and
  `.worktrees/fix-540-embedding-pass-batch-limit` were merged into `origin/main`
  (`STALE`); at G3 the same step answers `4 worktree(s) · 0 finding(s)` — the
  other units moved on, nothing here changed. **Does not affect** this unit:
  another unit's parked worktrees, and this unit's own worktree is clean and was
  never among the findings.
- `dependency-advisories` reports 4 blocking `undici` rows and exits 0 by its
  own contract (report-only, scoped by the review to dependencies a change adds
  or updates). **Does not affect** this unit: no dependency is added or changed.

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

- **AC-S1** — The unit is applied through the owner's local workflow: the
  planning ledgers and the acceptance criteria are frozen in this document
  before the implementation lands, and the work arrives as conventional commits
  with no review/fold machinery. Check: `ls docs/fix/539-push-identity-range/`
  lists `SPEC.md` and `decisions.md` (a small unit embeds its ledgers);
  `git log --oneline a83b9b38..HEAD` shows the unit's own conventional commits.
- **AC-S2** — A local push of a branch that merged `origin/main` is accepted
  when it introduces nothing outside the approved identity: both gates answer
  their pass verdicts over the incident's exact range shape. Check:
  `bun test scripts/push-identity-check.test.mjs` exits 0 (the merged-main case
  answers `ok`) and `bun test scripts/log-immutability.test.mjs` exits 0 (the
  published-journal-extension case answers `verdict: PASS`).
- **AC-S3** — `push-identity-check` skips every commit reachable from
  `origin/main` (and from the pushed branch's remote tip) and judges every other
  commit unchanged, printing the judged count. Check: the
  `PASS: a commit already published on origin/main is not judged (S3)` case
  exits 0 with `ok: 1 commit(s) verified`, and the merged-main case exits 0 with
  `ok: 3 commit(s) verified` (the published commit excluded, the branch's own
  three judged).
- **AC-S4** — The three issue-named push-identity cases exist and hold:
  `[published-non-approved, new-approved]` → `ok`;
  `[new-non-approved]` → still `failed`; `[published-approved, new-approved]` →
  `ok`. Check: `bun test scripts/push-identity-check.test.mjs` exits 0 with the
  four named cases (the three above plus the merged-main shape of S2), and the
  red run at the pre-change tree is recorded in `## Log`.
- **AC-S5** — `log-immutability` skips the identity judgement of published
  commits and accepts the published journal tip as a byte-prefix baseline. Check:
  the `PASS: a published hand-append is not re-judged (S5)` and
  `PASS: a journal that extends the published tip passes (S5)` cases exit 0 with
  `verdict: PASS`, and the published fragment deletion is not blamed on a merge.
- **AC-S6** — The three issue-named journal cases exist and hold: published
  hand-appends skipped; a journal extending the published one passes; a
  genuinely new hand-append still fails. Check: `bun test
  scripts/log-immutability.test.mjs` exits 0 with
  `FAIL log-hand-appended: a new hand-append fails beside a published one (S6)`
  green, and its output names the new commit only.
- **AC-S7** — Reachability only, no identity classes, no escape hatch, and both
  gates stay read-only. Check:
  `rg -n 'journal-bot|github-actions\\[bot\\]|noreply@github.com' scripts/push-identity-check.mjs`
  matches 0;
  `rg -n -- '--no-verify|SKIP_LOCAL_GATE|--force' scripts/push-identity-check.mjs scripts/log-immutability.mjs scripts/published-refs.mjs`
  matches 0; `rg -n 'writeFile|appendFile|unlink|rmSync' scripts/published-refs.mjs`
  matches 0; and the pre-existing read-only case in the push-identity suite and
  the working-tree deletion/rewrite cases in the log suite stay green.

## Tasks

- P1 — Freeze this unit doc with its embedded planning ledgers, the acceptance
  criteria and the path-protection declaration, before the first line of code
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint
  docs/fix/539-push-identity-range/SPEC.md` prints `verdict: PASS` and exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/539-push-identity-range/SPEC.md,
    docs/fix/539-push-identity-range/decisions.md
- P2 — RED corpus first: the new sibling suite and the issue's six cases land as
  checks observed failing on the pre-change tree (validator: `bun test
  scripts/published-refs.test.mjs` and `bun test scripts/push-identity-check.test.mjs`
  and `bun test scripts/log-immutability.test.mjs` all exit non-zero at the red
  commit, recorded in `## Log`)
  (Implements: S2, S3, S4, S5, S6)
  - Relevant files: scripts/published-refs.test.mjs,
    scripts/push-identity-check.test.mjs, scripts/log-immutability.test.mjs
- P3 — The range policy module: `publishedRefs()` and `unpublishedCommits()`
  (validator: `bun test scripts/published-refs.test.mjs` exits 0)
  (Implements: S3, S5)
  - Relevant files: scripts/published-refs.mjs
- P4 — `push-identity-check` walks only never-published commits
  (validator: `bun test scripts/push-identity-check.test.mjs` exits 0 with every
  pre-existing case green)
  (Implements: S2, S3, S4)
  - Relevant files: scripts/push-identity-check.mjs
- P5 — `log-immutability` skips published identities and accepts the published
  journal tip as its baseline (validator: `bun test
  scripts/log-immutability.test.mjs` exits 0 with every pre-existing case green)
  (Implements: S2, S5, S6)
  - Relevant files: scripts/log-immutability.mjs
- P6 — Differential check: each touched command run through a copy of the base
  commit and through this change over one corpus, in `mktemp -d`, with every
  difference declared (validator: the harness prints `UNDECLARED 0` and exits 0,
  and every declared delta is listed, recorded in `## Log`)
  (Implements: S2, S7)
- P7 — Documentation and repository state in the same change: both hardening
  annex copies, the two gate-inventory rows, the roadmap `## Fixes` row through
  `agentic-workflow roadmap fixrow`, the rendered projection, the journal
  fragment, the closed obligations and the declared verification commands in the
  foreground (validator: `bun scripts/docs-generate.mjs --check` exits 0,
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify
  docs/fix/539-push-identity-range/SPEC.md` exits 0, and `bun
  scripts/local-gate.mjs` exits 0)
  (Implements: S1, S7)
  - Relevant files: docs/workflow/GIT_IDENTITY_HARDENING.md,
    template/docs/workflow/GIT_IDENTITY_HARDENING.md,
    docs/workflow/GATE_INVENTORY.md, docs/ROADMAP.md, docs/generated/

### Planning evidence

One row per Engineering claim the change rests on, in the ledger's closed column
order. Every claim below was read or sampled in this session at the cut head
`a83b9b38` (branch head `a83b9b38`).

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | forge-issue | The defect and its six reproducers are real as filed: both gates judge `base..head`, the incident range's offenders are all ancestors of `origin/main`, and the issue names the exact cases each suite must gain | issue [#539](https://github.com/gtrabanco/agentic-workflow/issues/539) body (Problem / Evidence / Proposed fix) | read 2026-11-14 (this session) | O1–O6; the whole change |
| PE-002 | committed-source | The pre-push hook passes one base per push: the single non-delete ref's remote tip, else the merge-base with `origin/HEAD` (else `origin/main`), and `local-gate` forwards it to the step as `--base`; a full local run drops the step | `scripts/local-gate.mjs:701-757` (`hookBody`), `:248-268` (the two steps), `:523-530` (`pushBase`) | read 2026-11-14 (this session) | O1, O7 |
| PE-003 | committed-source | Both gates judge `base..head`: `rangeCommits()` maps every sha of `git rev-list --reverse <base>..<head>` through one `git log` each, and `checkRange()` walks the same list, judging every non-merge commit that touched `LOG` or the carrier | `scripts/push-identity-check.mjs:187-200`, `scripts/log-immutability.mjs:205-260` | read 2026-11-14 (this session) | O1, O3, O4, O5, O6 |
| PE-004 | observed | `git rev-list --reverse <base>..<head> --not <ref>` drops exactly the commits the ref reaches and keeps the rest oldest-first — sampled in a `mktemp -d` fixture (3 commits, `origin/main` at the middle one → the range answers 2, the filtered range answers 1) | this session, `mktemp -d` fixture; the same shape lands as the module suite's case | sampled 2026-11-14 (this session) | O1, O4, O5 |
| PE-005 | observed | This checkout has **no** `refs/remotes/origin/HEAD` (`git symbolic-ref refs/remotes/origin/HEAD` → empty) while `refs/remotes/origin/main` resolves, so the resolver's second candidate is the one that answers here; a fixture creates either ref with `git update-ref` / `git symbolic-ref`, no remote needed | `git symbolic-ref --quiet refs/remotes/origin/HEAD` (empty) and `git rev-parse refs/remotes/origin/main` (a83b9b38) in this checkout | sampled 2026-11-14 (this session) | O7; the module's candidate order |
| PE-006 | committed-source | The journal's shape contract is exactly `blobAt(base, LOG)` vs `blobAt(HEAD, LOG)`: prefix extension, then `contentFault` per appended block; `blobAt` returns `null` when the revision has no such file, and a `null` baseline fails closed | `scripts/log-immutability.mjs:122-127` (`blobAt`), `:149-180` (`logShapeViolations`) | read 2026-11-14 (this session) | O5 |
| PE-007 | measured-baseline | The two frozen suites are green at the cut head with the counts the issue names — 8 and 19 — so every later red is this change's | `bun test scripts/push-identity-check.test.mjs` → 8 pass · 0 fail; `bun test scripts/log-immutability.test.mjs` → 19 pass · 0 fail | run 2026-11-14 (this session) | O7 |
| PE-008 | unknown | Whether every checkout this gate runs in carries a resolvable remote-tracking ref is not sampled (a `git clone --single-branch` of a non-default branch, a shallow clone, or a repository whose default branch is not `main` would differ); the module therefore degrades to the pre-change semantics when nothing resolves, and the degradation is the owner's to confirm | not sampled — no such checkout exists in this session | unverified 2026-11-14 (this session) | O7; the module's fail-safe |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state, in the ledger's 9-column order. Each row carries its
`S#` in `authority-source`, exactly one phase and one task, a backticked
validator with the outcome it must produce, and is `planned` at cut time.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2, S3 | the incident's use case: the pre-push range of a branch that merged `origin/main` judges only the branch's own commits, so the push is accepted when they carry the approved identity | P4 | P4 | direct application (this session) | `bun test scripts/push-identity-check.test.mjs` exits 0 (`PASS: a push that merges origin/main skips its published commits and judges its own (S3)` → `ok: 3 commit(s) verified`) | E line in `## Log` | verified — E3 (12 pass) and E4 (the live history: `ok: 4` where the base answers `failed: 72 of 316`) |
| O2 | S3, S4 | a published commit outside the approved profile is skipped, not judged, so a merge-push of main is not refused for main's own history | P4 | P4 | direct application (this session) | `bun test scripts/push-identity-check.test.mjs` exits 0 (`PASS: a commit already published on origin/main is not judged (S3)` → `ok: 1 commit(s) verified`) | E line in `## Log` | verified — E2 (red: `failed: 1 of 2`) and E3 (green) |
| O3 | S4, S7 | the required failure state: a genuinely new misattributed commit is still refused while a published ref exists — the guard keeps all its teeth | P4 | P4 | direct application (this session) | `bun test scripts/push-identity-check.test.mjs` exits 0 (`FAIL: a new misattributed commit is still refused beside a published ref (S4)` → exit 1, `failed: 1 of 1`, the new sha named and the published sha absent) | E line in `## Log` | verified — E3 (the case green) and E6 (differential c4/c5: the new offender still fails) |
| O4 | S4 | the third issue case: a published approved commit is skipped and the new commit is verified — `ok` with the judged count, not the range count | P4 | P4 | direct application (this session) | `bun test scripts/push-identity-check.test.mjs` exits 0 (`PASS: a published approved commit is skipped and the new one is verified (S4)`) | E line in `## Log` | verified — E3 (the case green; `ok: 1` where the base answers `ok: 2`) |
| O5 | S5 | the journal's identity half skips a published hand-append, and the byte-prefix baseline accepts the published journal tip, so an integration push passes when its own appends are conforming | P5 | P5 | direct application (this session) | `bun test scripts/log-immutability.test.mjs` exits 0 (`PASS: a published hand-append is not re-judged (S5)`, `PASS: a journal that extends the published tip passes (S5)`, `PASS: a fragment the published history deleted is not blamed on a merge (S5)`) | E line in `## Log` | verified — E2 (red: `log-rewritten … byte 102` + `log-hand-appended`) and E3 (23 pass) |
| O6 | S6, S7 | the required failure state: a genuinely new hand-appended commit still fails beside a published one, and the violation names the new commit only | P5 | P5 | direct application (this session) | `bun test scripts/log-immutability.test.mjs` exits 0 (`FAIL log-hand-appended: a new hand-append fails beside a published one (S6)` → exit 1, one violation, the fresh subject named, the published one absent) | E line in `## Log` | verified — E3 (the case green) and E6 (differential c5: 1 violation, the fresh commit) |
| O7 | S3, S5, S7 | the compatibility invariant: with no published ref resolvable both gates behave exactly as before — same stdout, stderr and exit status for the same repository — and neither gains an identity-class allowlist, an escape hatch or a write | P6 | P6 | direct application (this session) | the differential harness over one corpus (the base commit's scripts vs this change) reports only the declared deltas, `bun test scripts/push-identity-check.test.mjs scripts/log-immutability.test.mjs` exits 0 with every pre-existing case unchanged, `rg -n 'journal-bot\|github-actions\[bot\]\|noreply@github.com' scripts/push-identity-check.mjs` matches 0, and `rg -n -- '--no-verify\|SKIP_LOCAL_GATE\|--force\|writeFile\|appendFile\|unlink\|rmSync' scripts/published-refs.mjs scripts/push-identity-check.mjs` matches 0 | E line in `## Log` with the diff summary and both rg receipts | verified — E6 (`UNDECLARED 0`, the two no-remote repositories byte-identical) and E7 (both rg receipts: 0) |
| O8 | S1 | repository state ships in the same change: the unit doc with its closed ledger, both hardening-annex copies, the two gate-inventory rows, the roadmap `## Fixes` row through the writer, the rendered projection and the journal fragment | P7 | P7 | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/539-push-identity-range/SPEC.md` exits 0, and `rg -n '#539' docs/ROADMAP.md` matches 1 | E line in `## Log` | verified — E7 (fixrow receipt), E8 (`docs-generate` PASS) and the `verify` run recorded before this row closed |

## Path protection

The two frozen suites this unit edits are protected paths (`**/*.test.*`,
`freeze: true`), so each modification carries its justification record in this
folder's [`decisions.md`](decisions.md). Every record is an *expansion*: no
pre-existing assertion is deleted, relaxed or narrowed.

```text
path-protection-plan@1
freeze-after: P2
kind | path | justification
not-created | scripts/push-identity-check.test.mjs | the identity guard's own frozen corpus: P2 appends the issue's cases (S3, S4) and keeps every pre-existing case byte-identical
not-created | scripts/log-immutability.test.mjs | the journal gate's own frozen corpus: P2 appends the issue's cases (S5, S6) and keeps every pre-existing case byte-identical
not-created | scripts/published-refs.test.mjs | the new module's sibling suite: created by P2 as the red commit, before the module exists (red-first)
```

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo review, audit, fold or
settlement machinery runs on this surgery. The `## Tasks` section above is the
authoritative step list.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-14, the owner's request, verbatim:
  ```
  Apply to this repository: issue #539
  ```
- **L2** — 2026-11-14, the issue, verbatim (body as filed, no labels):
  ```
  ## Problem

  `scripts/push-identity-check.mjs` (issue #514) and `scripts/log-immutability.mjs` (#468) judge the whole `<branch upstream>..HEAD` range. For any local push of a branch that has merged current `origin/main`, that range necessarily contains commits that are **already published on `origin/main`** through routes that never pass a local hook (GitHub web merges, CI journal aggregations). Both gates then refuse a push that introduces nothing new — a structural false positive that blocks every local push of a merge of main. It had never fired before because no branch had merged this main (`git branch -r --contains <sha>` → only `origin/main`).

  ## Evidence (2026-11-13, branch `feat/352-new-feature-distributable-ceremony-runner`, PR #524)

  - `git push` → pre-push hook → `local-gate: FAILED at push-identity`, nothing uploaded.
  - `node scripts/push-identity-check.mjs --base <branch upstream tip>` → `failed: 13 of 101 commits`; **every** offender satisfies `git merge-base --is-ancestor <sha> origin/main`:

    | count | author | committer | class |
    |---|---|---|---|
    | 5 | `Gabriel Trabanco <1969593+…>` (old name form) | `GitHub <noreply@github.com>` | PR web-merges |
    | 4 | `journal-bot <journal-bot@…>` | `journal-bot <journal-bot@…>` | journal aggregations |
    | 4 | `github-actions[bot] <41898282+…>` | `GitHub <noreply@github.com>` | CI runs |

    The branch's own new commits (the merge + its correction commits) all carry the approved identity from `.pi/agentic-workflow.json` — **0 offenders of its own**.
  - `node scripts/log-immutability.mjs` (default base = upstream merge-base) → 3 violations: `log-hand-appended` for main's already-published `b012b31d` and `3cbc1237`, plus `log-rewritten` (a byte-extension of the *published* journal cannot also be a byte-extension of the *branch's* baseline — an integration makes both impossible). With the base pinned to the origin/main merge-base → `0 violations · verdict PASS`.

  ## Why it happens

  Both guards exist to stop **new, locally misattributed commits** from being published — the two recorded leaks (#514) were local (a fixture's `t@example.test` and an agent identity). A commit already on `origin/main` cannot be affected by any local push: judging it prevents nothing and refuses every merge-push forever.

  ## Proposed fix (red-first, in the existing suites)

  - **`push-identity-check`**: while walking `base..head`, skip commits already reachable from a published ref (`origin/main`, plus the pushed branch's own remote tip); every other commit is judged unchanged.
    - Cases added first in `scripts/push-identity-check.test.mjs` (8 existing): `[published-non-approved, new-approved]` → `ok` (**red today**); `[new-non-approved]` → still `failed` — the guard keeps all its teeth; `[published-approved, new-approved]` → `ok`.
  - **`log-immutability`**: the same ancestry skip on the identity half; the byte-prefix baseline accepts the **published** journal tip (`origin/main`) as well as the branch upstream for an integration push.
    - Cases in `scripts/log-immutability.test.mjs` (19 existing): published hand-appends skipped; a journal that extends the published one passes; a genuinely **new** hand-appended commit still fails.

  ## Non-goals

  - No identity-class exemptions (bots / forge accounts): a local process can spoof them — the filter is about **reachability**, not identity classes.
  - No escape hatch (`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE`), no `--no-verify`, no force-push and no history rewrite of any kind as the solution.

  ## Dependencies

  - Relates to [#514](https://github.com/gtrabanco/agentic-workflow/issues/514) (the identity guard) and [#468](https://github.com/gtrabanco/agentic-workflow/issues/468) (the journal write-path gate).
  [… marked elision: the block's second bullet is preserved verbatim in `## References` below. Its `pull/` URL is another unit's PR, and `roadmap-settle` reads any `pull/` URL in `## Next`/`## Log`/`## Evidence` as this doc's own PR — a verbatim quote of a foreign PR link would make the doc claim a settle it does not have …]

  ---
  Automated writed using a AI
  ```
- **P1** — 2026-11-14, this unit doc, `decisions.md` (the path-protection records
  for the two frozen suites) and the embedded planning ledgers frozen before the
  first line of code · `d7082de7`.
- **E1** — 2026-11-14, baseline at the cut head: `bun test
  scripts/push-identity-check.test.mjs` · exit 0 · 8 pass · 0 fail; `bun test
  scripts/log-immutability.test.mjs` · exit 0 · 19 pass · 0 fail — the counts the
  issue names.
- **P2** — 2026-11-14, RED corpus: the new module's sibling suite plus four cases
  in each frozen suite · `44173398`.
- **E2** — 2026-11-14, RED at `44173398`: `bun test scripts/published-refs.test.mjs`
  · exit 1 · `Cannot find module './published-refs.mjs'`; `bun test
  scripts/push-identity-check.test.mjs` · exit 1 · 8 pass · 4 fail —
  `failed: 1 of 2`, `1 of 4`, `1 of 1` where `1 of 2` was expected, and `ok: 2`
  where `ok: 1` was; `bun test scripts/log-immutability.test.mjs` · exit 1 · 19
  pass · 4 fail — `log-rewritten … first difference at byte 102` plus
  `log-hand-appended` for the published commit, and `fragment-hand-deleted … by
  non-aggregator commit` for the published deletion.
- **P3** — 2026-11-14, the range-policy module · `cf2766fa`.
- **E3** — 2026-11-14, GREEN: `bun test scripts/published-refs.test.mjs` · exit 0
  · 6 pass · 0 fail; `bun test scripts/push-identity-check.test.mjs` · exit 0 ·
  12 pass · 0 fail (the 8 pre-existing cases untouched); `bun test
  scripts/log-immutability.test.mjs` · exit 0 · 23 pass · 0 fail (the 19
  pre-existing cases untouched).
- **P4** — 2026-11-14, both gates wired to the module · `5e3104b4`.
- **E4** — 2026-11-14, the incident reproduced on this repository's own history
  and fixed: `node scripts/push-identity-check.mjs --base a83b9b38~40` · exit 0 ·
  `PUSH IDENTITY — ok: 4 commit(s) verified` (only this branch's commits), while
  the same command through a `git archive` copy of `a83b9b38` answers `failed: 72
  of 316 commit(s)` — its first offenders are published history
  (`t <t@example.test>`, `--unset <--unset>`) no local push can change.
- **E5** — 2026-11-14, the live gates on this branch: `node
  scripts/log-immutability.mjs --base a83b9b38` · exit 0 · `0 violations · base
  a83b9b38 · range 4 commits` · `verdict: PASS`; `journal aggregate --check` ·
  exit 0 · `{"ok":true,"checked":9,"refusals":[]}`.
- **E6** — 2026-11-14, the differential: one corpus of 6 throwaway repositories ×
  2 gates, the base commit's scripts (`git archive a83b9b38`) against this
  change, in `mktemp -d` · `UNDECLARED 0` — 6 rows `same` (both no-remote
  repositories byte-identical, exit and both streams), 6 `DECLARED` (the three
  published-ref skips, the journal baseline, and the published deletion).
- **E7** — 2026-11-14, O7's static half: `rg -n 'journal-bot|github-actions\[bot\]|noreply@github.com'
  scripts/push-identity-check.mjs` · 0 matches; `rg -n --
  '--no-verify|SKIP_LOCAL_GATE|--force|writeFile|appendFile|unlink|rmSync'
  scripts/published-refs.mjs scripts/push-identity-check.mjs` · 0 matches.
- **E8** — 2026-11-14, repository state: `agentic-workflow roadmap fixrow
  docs/ROADMAP.md … --expect d72f47f9` · exit 0 · `Before: d72f47f9 · After:
  f00688c4`; `bun scripts/docs-generate.mjs` · exit 0 · `Files: 2 written · 0
  deleted · 1 unchanged` · `verdict: PASS`; `bun scripts/docs-generate.mjs
  --check` · exit 0 · PASS.
- **E9** — 2026-11-14, the pre-existing reds reproduced at the base commit in a
  clean `git archive a83b9b38` copy: `bun test scripts/check-skill-context.test.mjs`
  · exit 1 · `FAIL context documents: AGENTS.md: machine-table lines 135 != the
  declared 134`; `bun test scripts/residual-classify.test.mjs` · exit 1 · every
  case `Cannot find module './ceremony/lib.mjs'`.
- **L3** — 2026-11-14, this doc's own amendment before the handoff: the issue's
  `## Dependencies` block is marked as elided from the `## Log` quote and
  preserved verbatim in `## References`, because `roadmap-settle`'s
  `ownPrUrls()` reads any `pull/` URL in `## Next`/`## Log`/`## Evidence` as this
  doc's own PR (`scripts/roadmap-settle.test.mjs` reported
  `pr-url-unsettled: expected 'done · [#524](…)'` against row `#539`). Nothing
  normative is lost: every requirement is quoted verbatim in `## Specs`, and the
  elided block's text is in this document.
- **G1** — 2026-11-14, HEAD 5e3104b488f9223928f7679da467918e5d1def10 · `bun scripts/local-gate.mjs` · exit 1 · `FAILED at
  worktree-guard` (the two other units' parked worktrees, a local-only step with
  no remote twin); the steps this change moves are green —
  `docs-generated-projection`, `log-immutability` (`0 violations · verdict: PASS`)
  — and `push-identity` is dropped without a `--push-base`, by design. The
  suite-bearing steps ran separately (G2).
- **G2** — 2026-11-14, HEAD 5e3104b488f9223928f7679da467918e5d1def10 · `bun scripts/run-root-suite.mjs` · the three reds it
  reports are `check-skill-context` and `residual-classify` (both reproduced at
  the base commit, E9) and `roadmap-settle` (the quoted issue's foreign PR URL,
  amended in L3 and green after it: `bun test scripts/roadmap-settle.test.mjs
  scripts/unit-doc-contract.test.mjs scripts/spec-by-reference.test.mjs` · exit 0 ·
  46 pass · 0 fail).
- **P5** — 2026-11-14, documentation and repository state · `8a642cfd`: both
  hardening-annex copies, the two gate-inventory rows, the roadmap row through
  the writer, the rendered projection and the journal fragment.
- **G3** — 2026-11-14, HEAD 8a642cfdbf84ffb8aba01ef64519905c776b1859 · the
  final verification at the committed head. `bun scripts/run-root-suite.mjs` ·
  exit 1 · **110 PASS / 2 FAIL of 112** — `check-skill-context` and
  `residual-classify`, both reproduced at the base commit (E9), none on this
  change's surface. At the same head and green: `bun test
  scripts/published-refs.test.mjs scripts/push-identity-check.test.mjs
  scripts/log-immutability.test.mjs` · exit 0 · 41 pass · 0 fail;
  `bun scripts/docs-generate.mjs --check` · exit 0 · PASS; `bun
  scripts/red-first.mjs` · exit 0 · 52 pairs · 27 after the cutoff · 0 findings
  (the new pair's suite precedes its module); `agentic-workflow verify` on this
  doc · exit 0 · `VERIFY PASS` (7 checks, 0 violations); `bun
  scripts/promise-coherence.mjs` · exit 0 · `verdict PASS` · 2 claims checked ·
  13 skipped; `agentic-workflow phase-lint` · exit 0 · `verdict PASS`;
  `node scripts/log-immutability.mjs --base a83b9b38` · exit 0 · `0 violations ·
  verdict: PASS`; `node scripts/push-identity-check.mjs --base a83b9b38` · exit 0
  · `ok: 5 commit(s) verified`. `bun scripts/local-gate.mjs` · exit 1 ·
  `FAILED at root-suite` — the same two pre-existing reds, with
  `worktree-guard` now green (0 findings).
- **P6** — 2026-11-14, the ledger line above, recorded at the head it names
  (docs-only; no source, script or template byte moves in that commit).
- **P7** — 2026-11-14, the push: the first attempt ran the pre-push gate and was
  refused at `root-suite` (the two pre-existing reds of E9; the crate suites
  reported 697 pass · 0 fail before the stop), then
  `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1` pushed it — the hatch AGENTS.md documents,
  its reason recorded here and in the PR body. Branch
  `fix/539-push-identity-range` pushed; PR [#542](https://github.com/gtrabanco/agentic-workflow/pull/542)
  opened; the `## Fixes` row settled `done · [#542]` through `roadmap fixrow`
  (CAS `f00688c4` → `2292abc8`).
- **L4** — 2026-11-14, the correction request, verbatim:
  ```
  Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff
  ```
  Correction batch for the 2026-11-14 `EXTERNAL VERIFY` (2 blockers): the
  `## Retirements` receipt now records its true observed result (the
  single-asterisk phrasing matches nothing in the two docs directories; the
  boundary-naming prose is the rewritten rows and the reachability paragraphs),
  and G3's promise-coherence invocation is corrected here, not edited — the
  recorded tally belongs to the path-scoped command
  `bun scripts/promise-coherence.mjs docs/fix/539-push-identity-range/SPEC.md`
  (exit 0 · `verdict PASS` · 2 claims checked · 13 skipped, reproduced at the
  recorded head `8a642cfd` and at this batch), whose path argument G3's line
  omitted; the bare command answers `38 checked · 22 skipped`. A correction
  appends — it never edits an earlier line.
- **E10** — 2026-11-14, the blockers-only recheck and the S2 differential ·
  `rg -n 'every author \*and\* committer of' docs/workflow template/docs/workflow`
  · exit 1 · 0 matches — the result the rewritten `## Retirements` records;
  `rg -c 'never-published' docs/workflow/GIT_IDENTITY_HARDENING.md template/docs/workflow/GIT_IDENTITY_HARDENING.md`
  · exit 0 · `2` lines per copy; the path-scoped promise-coherence of L4 · exit
  0 · `2 claims checked · 13 skipped`; the bare
  `bun scripts/promise-coherence.mjs` · exit 0 · `38 checked · 22 skipped`
  (unchanged by this batch); `bun test scripts/published-refs.test.mjs
  scripts/push-identity-check.test.mjs scripts/log-immutability.test.mjs` · exit
  0 · 41 pass · 0 fail; `agentic-workflow verify` on this doc · exit 0 ·
  `ok: true` (0 violations); `agentic-workflow phase-lint` · exit 0 ·
  `verdict PASS` (fingerprint unchanged); `bun scripts/docs-generate.mjs --check`
  · exit 0 · PASS; `bun scripts/red-first.mjs` · exit 0 · 0 findings;
  `node scripts/log-immutability.mjs --base a83b9b38` · exit 0 · `0 violations ·
  range 7 commits · verdict: PASS`; `agentic-workflow journal aggregate --check`
  · exit 0 · `{"ok":true,"checked":9}`; the five load-flaked suites alone
  (byte-identical to base) · exit 0 · 156 pass · 0 fail.
- **G4** — 2026-11-14, the correction head. `bun scripts/run-root-suite.mjs` ·
  exit 1 · 109 PASS · 2 FAIL — `check-skill-context` and `residual-classify`,
  the E9 base reds only; two interim runs showed extra `ceremony-*`,
  `next-step-ranking` and `setup-env` reds while two sibling sessions ran their
  own root-suite/local-gate on this shared box (load 6–9 on 6 CPUs), and every
  one of those suites is byte-identical to base and passes standalone. `bun
  scripts/local-gate.mjs` · exit 1 · `FAILED at root-suite` — the same red step
  (fail-fast also cut in-flight suites short under that load); the steps this
  change moves are green in E10.

## Next

PR [#542](https://github.com/gtrabanco/agentic-workflow/pull/542) is open against
`main` (`Closes #539`) and the row is settled; the next action is the owner's
review of that PR, then its merge.

## References

- Issue: [#539](https://github.com/gtrabanco/agentic-workflow/issues/539)
- Relates to: [#514](https://github.com/gtrabanco/agentic-workflow/issues/514)
  (the identity guard, whose push-range check this fixes) and
  [#468](https://github.com/gtrabanco/agentic-workflow/issues/468) (the journal
  write-path gate)
- Owner: `scripts/published-refs.mjs` (the range policy), `docs/workflow/GIT_IDENTITY_HARDENING.md`
  (§The push-range check), `docs/workflow/GATE_INVENTORY.md` (rows
  `push-identity` and `log-immutability`)
- The issue's `## Dependencies` block, verbatim (elided from the `## Log` quote
  above so its foreign `pull/` URL is never read as this doc's own PR):

  > - **PR [#524](https://github.com/gtrabanco/agentic-workflow/pull/524) is blocked by this issue**: its branch cannot be pushed until the range policy lands. Declared here in prose and as the native `blocked-by` relationship.

## Branch

`fix/539-push-identity-range`

## Depends on

None — independent. (PR #524 was blocked by this issue; it is not this unit's
dependency.)

## Regression scope

- A misattributed **new** commit is still refused by both gates: the
  `a misattributed author fails …` and `a misattributed committer fails …` cases
  in the push-identity suite, and `FAIL log-hand-appended: a session appends to
  docs/LOGS.md` in the journal suite, must keep passing unchanged (`bun test
  scripts/push-identity-check.test.mjs scripts/log-immutability.test.mjs` exits
  0).
- The config surface is untouched: the skip / config-error / JSONC / read-only
  cases keep their exact output and exit codes, and a checkout with no remote
  ref answers exactly what the base commit answers (O7's differential receipt).
