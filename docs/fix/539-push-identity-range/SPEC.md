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
- The superseded claim — "every commit of `<base>..<head>` is judged" — is
  prose in three places (the two headers and
  `docs/workflow/GIT_IDENTITY_HARDENING.md`); each is rewritten in this change,
  and `rg -n 'every author \*and\* committer of' docs/workflow
  template/docs/workflow` still resolves to prose that names the published-ref
  boundary.
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

- None observed at the cut: `bun test scripts/push-identity-check.test.mjs`
  (8 pass) and `bun test scripts/log-immutability.test.mjs` (19 pass) are green
  at `a83b9b38`, and the gate's own state on this branch is recorded in the
  `## Log` `G` line. A red found later is recorded here rather than excused.

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
| O1 | S2, S3 | the incident's use case: the pre-push range of a branch that merged `origin/main` judges only the branch's own commits, so the push is accepted when they carry the approved identity | P4 | P4 | direct application (this session) | `bun test scripts/push-identity-check.test.mjs` exits 0 (`PASS: a push that merges origin/main skips its published commits and judges its own (S3)` → `ok: 3 commit(s) verified`) | E line in `## Log` | planned |
| O2 | S3, S4 | a published commit outside the approved profile is skipped, not judged, so a merge-push of main is not refused for main's own history | P4 | P4 | direct application (this session) | `bun test scripts/push-identity-check.test.mjs` exits 0 (`PASS: a commit already published on origin/main is not judged (S3)` → `ok: 1 commit(s) verified`) | E line in `## Log` | planned |
| O3 | S4, S7 | the required failure state: a genuinely new misattributed commit is still refused while a published ref exists — the guard keeps all its teeth | P4 | P4 | direct application (this session) | `bun test scripts/push-identity-check.test.mjs` exits 0 (`FAIL: a new misattributed commit is still refused beside a published ref (S4)` → exit 1, `failed: 1 of 1`, the new sha named and the published sha absent) | E line in `## Log` | planned |
| O4 | S4 | the third issue case: a published approved commit is skipped and the new commit is verified — `ok` with the judged count, not the range count | P4 | P4 | direct application (this session) | `bun test scripts/push-identity-check.test.mjs` exits 0 (`PASS: a published approved commit is skipped and the new one is verified (S4)`) | E line in `## Log` | planned |
| O5 | S5 | the journal's identity half skips a published hand-append, and the byte-prefix baseline accepts the published journal tip, so an integration push passes when its own appends are conforming | P5 | P5 | direct application (this session) | `bun test scripts/log-immutability.test.mjs` exits 0 (`PASS: a published hand-append is not re-judged (S5)`, `PASS: a journal that extends the published tip passes (S5)`, `PASS: a fragment the published history deleted is not blamed on a merge (S5)`) | E line in `## Log` | planned |
| O6 | S6, S7 | the required failure state: a genuinely new hand-appended commit still fails beside a published one, and the violation names the new commit only | P5 | P5 | direct application (this session) | `bun test scripts/log-immutability.test.mjs` exits 0 (`FAIL log-hand-appended: a new hand-append fails beside a published one (S6)` → exit 1, the new short sha named, the published sha absent) | E line in `## Log` | planned |
| O7 | S3, S5, S7 | the compatibility invariant: with no published ref resolvable both gates behave exactly as before — same stdout, stderr and exit status for the same repository — and neither gains an identity-class allowlist, an escape hatch or a write | P6 | P6 | direct application (this session) | the differential harness over one corpus (the base commit's scripts vs this change) reports only the declared deltas, `bun test scripts/push-identity-check.test.mjs scripts/log-immutability.test.mjs` exits 0 with every pre-existing case unchanged, `rg -n 'journal-bot\|github-actions\[bot\]\|noreply@github.com' scripts/push-identity-check.mjs` matches 0, and `rg -n -- '--no-verify\|SKIP_LOCAL_GATE\|--force\|writeFile\|appendFile\|unlink\|rmSync' scripts/published-refs.mjs scripts/push-identity-check.mjs` matches 0 | E line in `## Log` with the diff summary and both rg receipts | planned |
| O8 | S1 | repository state ships in the same change: the unit doc with its closed ledger, both hardening-annex copies, the two gate-inventory rows, the roadmap `## Fixes` row through the writer, the rendered projection and the journal fragment | P7 | P7 | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/539-push-identity-range/SPEC.md` exits 0, and `rg -n '#539' docs/ROADMAP.md` matches 1 | E line in `## Log` | planned |

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
  - **PR [#524](https://github.com/gtrabanco/agentic-workflow/pull/524) is blocked by this issue**: its branch cannot be pushed until the range policy lands. Declared here in prose and as the native `blocked-by` relationship.

  ---
  Automated writed using a AI
  ```

## Next

The owner's external verification of this branch's diff; then the PR against
`main` (`Closes #539`).

## References

- Issue: [#539](https://github.com/gtrabanco/agentic-workflow/issues/539)
- Relates to: [#514](https://github.com/gtrabanco/agentic-workflow/issues/514)
  (the identity guard, whose push-range check this fixes) and
  [#468](https://github.com/gtrabanco/agentic-workflow/issues/468) (the journal
  write-path gate)
- Owner: `scripts/published-refs.mjs` (the range policy), `docs/workflow/GIT_IDENTITY_HARDENING.md`
  (§The push-range check), `docs/workflow/GATE_INVENTORY.md` (rows
  `push-identity` and `log-immutability`)

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
