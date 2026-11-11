---
# type: fix | scope: medium | ac-hash: written after the ## Acceptance criteria section is frozen
---

# fix/509-batch-scheduler-stale-claims

> Fix specification — one single unit document. Applied through the owner's
> local unpublished workflow (§5 ledger freeze substitutes for the lane's plan
> step); no repo review/fold machinery runs on this change.

## Issue

`#509` — "BUG: batch-scheduler stale claims, false launch detection, no
file-overlap between lanes". The PR closes it via `Closes #509`.

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #509

**S2 — Per-lane claims, not per-issue claims.**
> ## Bug 1: `claimed` is per-issue, not per-lane — once claimed, always reported everywhere
>
> ### What happens
>
> The state file (`.agentic-workflow/batches.json`) stores a `claimed` map keyed by issue number …
> Each run, the scheduler re-marks an issue as `claimed: true` **if it appeared in any lane during any previous run**. The claim is per-issue, not per-lane.
>
> ### Impact
>
> A user who launched #487 in `.github` lane sees it marked as claimed in every other lane it appears, even if it was never touched there. This makes it impossible to tell which lanes have actually been claimed and which have not.
>
> ### Root cause
>
> `const previousClaims = previous?.claimed ?? {}; const claimedNumbers = new Set(Object.keys(previousClaims).map(Number)); // ... if (claimedNumbers.has(row.number)) row.claimed = true;`
>
> The key is `row.number` (issue ID), not `(row.number, lane)` pair.
>
> ### Fix
>
> Key claims by `(number, lane)` pair:
> ```json
> {
>   "claimed": {
>     "487|scripts": { "batch": 1, ... },
>     "487|.github": { "batch": 1, ... }
>   }
> }
> ```

**S3 — Launch detection from evidence, not unit-doc existence.**
> ## Bug 2: `launched` detection uses unit-doc existence, not PR merge state
>
> ### What happens
>
> The scheduler determines if an issue is "launched" (in-flight) by checking if a unit doc (`docs/fix/<N>-*/SPEC.md` or `docs/features/<N>-*/SPEC.md`) exists on disk …
>
> This means:
> - **Merged PRs still show as "launched"** — the unit docs persist after merge, so the scheduler thinks they are still in-flight
> - **Parked branches also show as "launched"** — issue #269 is parked (PR #506 open but waiting on #434), yet the scheduler marks it as launched
>
> ### Impact
>
> Users are given launch commands for issues that are either already merged or parked — wasting time and causing confusion.
>
> ### Root cause
>
> Unit-doc existence ≠ PR merge state ≠ branch existence. The scheduler has no way to check the forge for PR merge state.
>
> ### Fix options
>
> A. **Check `git branch --contains <sha>`** — if the unit doc exists but no local branch points to a commit containing the unit docs, the issue is not launched
> B. **Check forge PR state** — `gh pr list --state open` filtered by the issue body/labels
> C. **Read a dedicated field** in the unit doc SPEC (e.g., `launch_state: in-progress | parked | merged`)
>
> Option B is most correct but requires forge access. Option A is a reasonable heuristic.

The issue's evidence section states the expected outcome directly: "The
scheduler should NOT list it as a runnable batch lane."

**S4 — File-level overlap audit between lanes.**
> ## Bug 3: No file-level overlap detection between different lanes
>
> ### What happens
>
> The scheduler groups issues into lanes by **surface** (`scripts`, `docs`, `packages/`, etc.) and serializes issues within the same surface. But it never checks if two issues in **different surfaces** actually rewrite the same file.
>
> ### Concrete evidence
>
> Issue **#507** (driver-write) modifies:
> - `scripts/docs-generate.mjs`
> - `scripts/docs-generated-merge.mjs`
> - `scripts/local-gate.mjs`
>
> Issue **#269** (efficient context targeting) modifies:
> - `scripts/docs-generate.mjs` (among others)
>
> These are in different lanes (`scripts` for #507 vs `docs` for #269), so the scheduler would allow them to run in parallel. But they **both rewrite `scripts/docs-generate.mjs`**, making them impossible to merge without conflict.
>
> ### Fix
>
> After lane assignment, cross-check all pairs of issues across lanes for shared file paths:
> ```js
> // After batch assignment, before printing:
> for (const [laneA, issuesA] of lanes) {
>   for (const [laneB, issuesB] of lanes) {
>     if (laneA >= laneB) continue;
>     for (const issueA of issuesA) {
>       for (const issueB of issuesB) {
>         const sharedFiles = fileOverlaps(issueA, issueB);
>         if (sharedFiles.length > 0) {
>           findings.push({
>             code: "file-overlap",
>             numbers: [issueA.number, issueB.number],
>             detail: `both modify: ${sharedFiles.join(", ")}`,
>           });
>         }
>       }
>     }
>   }
> }
> ```
>
> This should be a **finding** (not a block), because the user might want to run them sequentially within a batch. But it must be reported.

**S5 — Stale claims expire.**
> ## Bug 4: State file never expires stale claims — claims from months ago still active
>
> ### What happens
>
> The state file (`.agentic-workflow/batches.json`) persists across all runs and is never pruned. Once an issue is `claimed`, it stays claimed in every subsequent plan — even if:
> - The branch was merged and deleted months ago
> - The issue is closed
> - The issue was only ever a one-off experiment
>
> ### Impact
>
> Old claims pollute every subsequent batch plan, making it hard to see what is actually active vs. what was claimed weeks ago.
>
> ### Root cause
>
> No TTL, no cleanup policy, no eviction mechanism in the state file management.
>
> ### Fix
>
> Add an expiration policy:
> ```js
> // In buildBatchPlan:
> const CLAIM_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
> const now = Date.now(); // or use a deterministic revision timestamp
>
> for (const [key, entry] of Object.entries(previousClaims)) {
>   if (now - new Date(entry.last_seen).getTime() > CLAIM_TTL_MS) {
>     staleClaims.push(key); // report as degradation
>   }
> }
> ```
>
> Or better: use the source revision as the expiration key. If a claim was made at revision X, and the current HEAD is Y, the claim is stale if no work on that lane's branch has been committed since X.

The issue's closing section names the same three items: "The batch scheduler
needs a **file-overlap audit** step before printing the plan, a **pruned claim
system** (per-lane claims with TTL), and a **forge-aware launch detection**
that checks PR state, not just unit-doc existence."

**S6 — The skill document states the new contract.**
> The skill document (`skills/batch-scheduler/SKILL.md`) should also be updated to note these known limitations and how the consumer should handle them.

**S7 — Regression bound.**
> **Differential check**: run each touched command against a copy of the base commit (in `mktemp -d`, never committed) and against the change; any stdout/stderr/exit difference nobody asked for is a regression — fix and pin it.

## Decisions

**D1 — S3's mechanism (authority: S3's "What needs to change" — "a
forge-aware launch detection that checks PR state, not just unit-doc
existence").** Both offered sources are implemented, in evidence order:

1. **The forge PR state** (S3 option B): one `gh pr list --state all --json
   number,headRefName,state` call, mapped from the PR head branch back to the
   issue number. `OPEN` ⇒ in flight; `MERGED`/`CLOSED` ⇒ terminal, never in
   flight.
2. **Local git branch evidence** (S3 option A): a `fix/<n>-*`/`feat/<n>-*`
   branch (`for-each-ref refs/heads`, worktrees included) that is not an
   ancestor of the trunk ⇒ in flight.
3. **The unit doc** is corroboration only — it appears in the evidence string,
   never as the decision.

When the two disagree the forge wins (it is the authoritative lifecycle), and
when the forge is unreadable the plan degrades declared
(`unavailable-forge-pr-list-<cause>`) and falls back to the branch evidence —
never to the unit doc.

**D2 — S5's TTL, determinism preserved (authority: S5's own "or use a
deterministic revision timestamp", plus the pinned invariant that the document
carries no wall clock — the suite's `S8` test).** Expiry is decided against a
**run instant the CLI supplies** and the state's own `last_seen`, never a
timestamp field inside the envelope: identical (state, issues, evidence,
instant) inputs still produce a byte-identical document, which is what `S8`
pins. Expiry fires on, in order: a pre-v3 bare-number claim key; terminal
evidence (merged/closed PR, merged branch, roadmap fix-row `done`); a
`last_seen` older than `CLAIM_TTL_MS` (48 h). Every expired claim is reported
as a `stale-claim` finding **and** pruned from the written state, so the report
happens once rather than repeating.

**D3 — S4's "across lanes" is read as "inside one batch, across lanes"**
(authority: S4's snippet — "After batch assignment, before printing", iterating
one batch's lanes). Issues in different **batches** never run in parallel, so a
shared file between them is not a conflict; issues in the same **lane**
serialize by the standing rule and are not a finding either.

**D4 — S4's file claims, and their honest limit (authority: S4's
`fileOverlaps(issueA, issueB)` with no declared source).** A claim is a
concrete file token declared in the issue's `## Where`/`## In scope` sections
(a token with an extension and no wildcard — `scripts/docs-generate.mjs`,
`skills/x/SKILL.md`, `README.md`), unioned with the files the issue's own branch
actually touched (`git diff --name-only <trunk>...<branch>` when that branch
exists). An issue that names only directories has no file claim and cannot
produce an overlap — a declared limitation, not a guessed expansion (**D5**).

**D5 — D4's fallback stays out (authority: the repo's fail-closed convention,
the #460 S5 precedent for the prose parser).** Expanding a directory token into
its children's files would make one issue's claim match every sibling's, which
is the false findings the #460 parser fix already refused once. No expansion:
an unclaimed file is silent, never a guess.

**D6 — The envelope stays `batch-plan@2`** (authority: the schema package's
"adding or changing a core field bumps this"). S4/S5 add two values to the
**closed finding-code vocabulary** and touch no field, so the version does not
move; the vocabulary, its validator, the JSON Schema enum and the package suite
change together. No new envelope field is introduced (the file claims live in
the finding's `detail`, per S4's own shape).

**D7 — The state file moves to version 3** (authority: S2's key shape). The
key changes from `<number>` to `<number>|<lane>`, so a v2 file's entries are
not readable as claims: they are reported once as `stale-claim`
(`pre-v3 per-issue claim key`) and dropped, never honored under a guessed lane.
No migration shim ships — the repo's no-backward-compatibility rule, and a
guessed lane assignment is exactly the bug S2 names.

## Impact

- **`scripts/batch-scheduler.mjs`** (the whole producer): claim read/write
  (S2, S5), launch evidence (S3), file claims + the overlap audit (S4). Three
  new public exports for the suite's benefit (`claimedKey`, `CLAIM_TTL_MS`,
  `collectLaunchEvidence`, `extractFileClaims`) and no CLI flag changes — the
  evidence sources are the local git plumbing and the same `gh` the issue and
  relation reads already use.
- **`packages/agentic-workflow-schema`**: `BATCH_FINDING_CODES` gains
  `file-overlap` and `stale-claim`; the validator's refusal message, the
  `batch-plan.schema.json` enum and the package suite move with it (D6).
  `BATCH_PLAN_FIELDS` is untouched (no field is added).
- **Consumers of the envelope**: `skills/batch-scheduler/SKILL.md` +
  `references/PLAN.md` (the grammar's `findings[]` row, the state-file shape,
  the launch-evidence rule), `README.md` and `docs/workflow/SKILLS.md` (the two
  skill tables that describe the planner). The #295 panel reads the envelope as
  data — additive finding codes only.
- **State file**: `.agentic-workflow/batches.json` v3, untracked. A v2 file is
  read, reported and dropped per D7.
- **Nothing live is touched**: the planner is never run against this
  repository's live tree during the change; every run uses a scratch root under
  `mktemp -d` (§4 of the owner's workflow).

## Retirements

- **Unit-doc-existence launch detection** (S3): `unitDirByIssue` stops deciding
  `launched[]`; it survives only as evidence text. Its replacement is the
  evidence map (`collectLaunchEvidence`). No-consumer evidence for the retired
  rule: the rewritten `S3` test asserts a unit doc alone does **not** launch.
- **The bare-number claim key** (S2): `state.claimed["<n>"]` is retired for
  `"<n>|<lane>"`; `updateState` and `--mark-launched` are its only two writers
  and both move. No-consumer evidence: the state-shape test asserts no bare
  numeric key survives a write.
- **The unit-doc-only `occupied_by`** follows the same evidence change — the
  field stays, its source becomes the in-flight set.
- Nothing else is removed: the hard-blocker gate, soft ordering, the triage
  signal, the lifecycle delta, the fail-closed parser and the planner-only pins
  are untouched (S7).

## Non-goals

- No launching, spawning or worktree creation — the planner plans (the existing
  source-level pin stays).
- No forge write of any kind; the PR read is one `gh pr list` and its failure
  degrades.
- No fix to the work graph itself: an overlap finding is reported, never
  auto-resolved by reordering or by editing the issues' prose.
- No version bump of the envelope (D6) and no state migration shim (D7).
- No directory→file expansion for overlap detection (D5).

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict (`bun scripts/ceremony.mjs tier classify --base 675f06c4 --paths
scripts/batch-scheduler.mjs scripts/batch-scheduler.test.mjs
packages/agentic-workflow-schema/src/batch-plan.ts
packages/agentic-workflow-schema/batch-plan.schema.json
packages/agentic-workflow-schema/test/batch-plan.test.mjs
skills/batch-scheduler/SKILL.md skills/batch-scheduler/references/PLAN.md
README.md docs/workflow/SKILLS.md
docs/fix/509-batch-scheduler-stale-claims/SPEC.md`, at the cut head
`675f06c4`):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"1 path(s) carry executable content: scripts/batch-scheduler.mjs","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

## Future

none

## Future cost

- Every scheduler run now makes up to four local git calls per unit branch
  (list, merge-base, diff) plus one forge PR list. On a repository with dozens
  of live branches the cost is linear in branches; a future caching layer must
  keep the envelope deterministic (the evidence map is its input, not its
  cache).
- The `claimed` map's key shape (`<n>|<lane>`) is a durable contract: a future
  lane-vocabulary change (a new surface class) invalidates every combination
  key for the lanes it renames, which surfaces as `stale-claim` findings — by
  design, not by accident.
- The overlap audit's file claims are only as good as the issue's `## Where`
  prose and the branch's diff; a project that never declares file paths gets no
  overlap signal and must not read silence as "no conflict" (D5, documented in
  `references/PLAN.md`).

## Applicable tests

`bun test scripts/batch-scheduler.test.mjs` (red first per §2/§6), `cd
packages/agentic-workflow-schema && bun run test` (the finding vocabulary and
its JSON Schema projection), `bun test scripts/normative-drift.test.mjs`,
`bun scripts/check-skill-context.mjs`, `bun scripts/roadmap-settle.mjs`, and the
root gate (`bun scripts/local-gate.mjs`) before handoff.

## Known pre-existing issues

- The worktree `fix/509-batch-scheduler-stale-claims` starts with no
  `node_modules` and no schema `dist/`, so the suite fails 4 tests
  (`Cannot find module '../packages/agentic-workflow-schema/dist/index.js'`)
  until `bun install --frozen-lockfile` + `cd packages/agentic-workflow-schema
  && bun run build`. Does-not-affect: this unit — both ran before the baseline
  (PE-011).
- The sensor's per-issue state growth on large repositories (noted by unit
  #460's Future cost). **Affects** this unit positively: the `claimed` map is
  now pruned on evidence and on age (O14), which is part of S5.

## Acceptance criteria

- **AC-S1** — The unit is applied through the owner's local workflow: the
  ledgers exist beside this SPEC, no repo review/fold machinery ran, and the
  work lands as conventional commits. Check: `ls
  docs/fix/509-batch-scheduler-stale-claims/` lists `SPEC.md`,
  `planning-evidence.md`, `planning-obligations.md`; `git log --oneline
  origin/main..HEAD` shows the unit's own conventional commits.
- **AC-S2** — Claims are keyed `(number, lane)` in the state file and in the
  envelope: an issue occupying two lanes reads `claimed: true` only in the lane
  that carries the claim, and no bare numeric key is ever written. Check: the
  `C1`/`C2`/`C3` tests in `scripts/batch-scheduler.test.mjs` exit 0.
- **AC-S3** — `launched[]` is decided by evidence: an unmerged branch or an
  `OPEN` PR marks the issue in flight; a merged branch, a `MERGED`/`CLOSED` PR
  or a unit doc alone does not; an unreadable forge degrades declared. Check:
  the `V1`–`V4` tests exit 0.
- **AC-S4** — Two issues of the same batch on different lanes whose file claims
  intersect produce exactly one `file-overlap` finding naming both numbers and
  the shared paths; disjoint claims and same-lane pairs produce none. Check:
  the `W1`–`W3` tests exit 0.
- **AC-S5** — A persisted claim expires on a pre-v3 key, on terminal evidence,
  or past the 48-hour TTL against the run instant, is reported as a
  `stale-claim` finding, and is pruned from the written state; a fresh claim is
  neither reported nor dropped. Check: the `X1`–`X4` tests exit 0.
- **AC-S6** — Every surface that describes the planner states the landed
  contract and no longer narrates the superseded one. Check: the
  "superseded narration" pin in the suite exits 0 and `bun
  scripts/check-skill-context.mjs` exits 0.
- **AC-S7** — Everything else unchanged: the pre-existing suite stays green, no
  CLI flag changes, and the differential run against the base commit differs
  only in the declared deltas. Check: `bun test scripts/batch-scheduler.test.mjs`
  and `cd packages/agentic-workflow-schema && bun run test` exit 0; the
  differential run's diff is recorded in `## Log`.

## Tasks

- P1 — Freeze the planning ledgers from the issue's verbatim text (validator:
  `ls docs/fix/509-batch-scheduler-stale-claims/` lists SPEC.md,
  planning-evidence.md, planning-obligations.md) (Implements: S1)
  - Relevant files: docs/fix/509-batch-scheduler-stale-claims/
- P2 — RED corpus: one failing test per requested rule in
  `scripts/batch-scheduler.test.mjs` (per-lane claims, claim expiry, launch
  evidence, file overlap) plus the schema package's finding-vocabulary
  expectation, observed failing before any implementation (validator:
  `bun test scripts/batch-scheduler.test.mjs` exits non-zero on the new tests)
  (Implements: S2, S3, S4, S5, S6, S7)
  - Relevant files: scripts/batch-scheduler.test.mjs,
    packages/agentic-workflow-schema/test/batch-plan.test.mjs
- P3 — Schema package: `BATCH_FINDING_CODES` += `file-overlap`, `stale-claim`;
  the validator's refusal message, the `batch-plan.schema.json` enum and the
  package corpus move with it (no field added, version stays `2` per D6)
  (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S4, S5)
  - Relevant files: packages/agentic-workflow-schema/src/batch-plan.ts,
    packages/agentic-workflow-schema/batch-plan.schema.json,
    packages/agentic-workflow-schema/test/batch-plan.test.mjs
- P4 — Script: per-lane claims — state version 3, `<number>|<lane>` read and
  write, `--mark-launched` writing the pair key (validator: `bun test
  scripts/batch-scheduler.test.mjs` exits 0 — `C1`–`C3`) (Implements: S2)
  - Relevant files: scripts/batch-scheduler.mjs
- P5 — Script: claim expiry — pre-v3 key, terminal evidence and the 48-hour TTL
  against the injected run instant produce a `stale-claim` finding and a pruned
  state (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 —
  `X1`–`X4`) (Implements: S5)
  - Relevant files: scripts/batch-scheduler.mjs
- P6 — Script: launch evidence — `collectLaunchEvidence` (branches, worktrees,
  merged check, changed files, one forge PR list with a declared degradation)
  replaces unit-doc-only launch detection (validator: `bun test
  scripts/batch-scheduler.test.mjs` exits 0 — `V1`–`V4`) (Implements: S3)
  - Relevant files: scripts/batch-scheduler.mjs
- P7 — Script: file-overlap audit — file claims from the declared tokens plus
  the branch diff, cross-lane same-batch pairs reported as one `file-overlap`
  finding (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 —
  `W1`–`W3`) (Implements: S4)
  - Relevant files: scripts/batch-scheduler.mjs
- P8 — Docs and repository state in the same change: `references/PLAN.md`
  grammar (findings, state shape, launch evidence, TTL), `SKILL.md` (turn
  contract, guardrails, the S6 limitation note), `README.md` +
  `docs/workflow/SKILLS.md` currency, the roadmap `## Fixes` row (hand edit —
  no emitter appends fix rows), changeset intent, `docs/LOGS.md` session entry,
  generated projection via the renderer (validator: `bun
  scripts/check-skill-context.mjs` exits 0, `bun test
  scripts/normative-drift.test.mjs` exits 0, `bun scripts/docs-generate.mjs
  --check` exits 0) (Implements: S6, S1)
  - Relevant files: skills/batch-scheduler/, README.md,
    docs/workflow/SKILLS.md, docs/ROADMAP.md, .changeset/, docs/LOGS.md
- P9 — Verification: the declared gates in the foreground, the differential run
  base-vs-change, every obligation closed (validator: `bun
  scripts/local-gate.mjs` exits 0) (Implements: S1, S7)

### Planning evidence

M/L unit: the ledger lives in this folder's
[`planning-evidence.md`](planning-evidence.md) — one row per Engineering claim.

### Obligations

M/L unit: the ledger lives in this folder's
[`planning-obligations.md`](planning-obligations.md) — one row per normative
behaviour, compatibility invariant, affected use case, and required failure
state.

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this
surgery.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-11, the request, verbatim:
  ```
  Apply to this repository: issue #509
  ```
- **L2** — 2026-11-11, the issue, verbatim (title + the four bug sections and
  the closing "What needs to change", quoted as S2–S5 above; full text in the
  forge):
  ```
  BUG: batch-scheduler stale claims, false launch detection, no file-overlap between lanes
  (Four independent bugs observed during the 2026-11-10 batch plan run, source
  revision 27275c94: per-issue claims; unit-doc launch detection; no file-level
  overlap between lanes; no claim expiration.)
  ```
- **D1** — 2026-11-11, owner-workflow interpretation (authority: S3's "forge-aware
  launch detection"): both sources ship, the forge wins on disagreement, the
  unit doc is corroboration only. See Decision D1.
- **D2** — 2026-11-11, owner-workflow interpretation (authority: S5's
  "or use a deterministic revision timestamp" + the pinned no-wall-clock
  invariant): the TTL is decided against an injected run instant, never a
  timestamp field. See Decision D2.
- **D3** — 2026-11-11, owner-workflow interpretation (authority: S4's snippet):
  "across lanes" = inside one batch. See Decision D3.
- **D4** — 2026-11-11, owner-workflow interpretation (authority: S4's
  `fileOverlaps` with no declared source): claims are declared file tokens
  unioned with the branch's diff; directory-only issues claim nothing. See
  Decision D4.
- **D5** — 2026-11-11, scope bound on D4 (authority: the repo's fail-closed
  convention): no directory→file expansion. See Decision D5.
- **D6** — 2026-11-11, owner-workflow interpretation (authority: the schema
  package's core-closed rule): the envelope stays `batch-plan@2` — a vocabulary
  value is not a core field. See Decision D6.
- **D7** — 2026-11-11, owner-workflow interpretation (authority: S2's key shape
  + the no-backward-compatibility rule): state version 3, v2 keys reported and
  dropped, no migration shim. See Decision D7.

## Next

Close the obligations ledger and hand the diff to the owner (the external
verifier): the delivered commits, the obligations ledger state, the foreground
verification block, and every failed/skipped/pending check.

## References

- Issue [#509](https://github.com/gtrabanco/agentic-workflow/issues/509) —
  closed by this unit's PR (`Closes #509` in the body).
- Unit #449 (`docs/fix/449-batch-scheduler-sensor/`) — the sensor this fixes;
  context only, no blocker.
- Unit #460 (`docs/fix/460-batch-scheduler-verification/`) — the previous
  verification pass over the same producer; its `batch-plan@2` envelope and
  fail-closed parser are the base this change extends.
- `docs/ROADMAP.md` `## Fixes` row `#509` (status carried by the row).

## Branch

`fix/509-batch-scheduler-stale-claims`

## Depends on

none

## Regression scope

- The untouched sensor behaviors — hard blockers gate, soft ordering across and
  inside lanes, one lane per surface, tree-root expansion, size hints, triage
  readiness, the lifecycle delta, the fail-closed prose parser, the CLI flags
  and exit codes, the planner-only source pins — verified by the pre-existing
  suite (`bun test scripts/batch-scheduler.test.mjs`) and by the differential
  run against the base commit on an identical fixture (declared deltas only).
- The one superseded assertion: the suite's `S3` test encoded "a unit doc on
  disk marks the issue launched", which is the behaviour S3 declares buggy. Its
  replacement asserts the new rule (unit doc alone does **not** launch; a live
  branch does) over the same fixture shape.
- The schema package's other contracts (envelope, journal, projections,
  gate-receipt) — verified by `cd packages/agentic-workflow-schema && bun run
  test`.
- The roadmap and generic docs emitters — verified by `bun scripts/docs-generate.mjs
  --check` and `bun scripts/roadmap-settle.mjs`.
