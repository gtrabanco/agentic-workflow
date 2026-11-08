---
type: fix
scope: medium
ac-hash: 16e20c6fd2c9e23a08489d4d66d7f3737285f651458db32e2851590297a46219
---

# fix/468-log-immutability

> The journal carrier (`docs/LOGS.md` + `.agentic-workflow/journal/`) becomes
> aggregator-only at push level: one offline gate script judges the push range,
> rides the local gate's pre-push subset, and the fragment writer refuses a
> session that already registered its entry.

## Issue

`#468` — tracked issue in the project's forge. The PR must close it via
`Closes #468` in the body.

## Specs

**S1 — the push-level write-path gate.**
> "`scripts/log-immutability.mjs` + sibling suite (red-first): over a push range, `docs/LOGS.md` must be a byte-prefix extension of its base (append at EOF only), every appended block must conform to the entry-block grammar (one owner: the crate's `src/journal/fragment.mjs`), and every commit touching `docs/LOGS.md` or deleting/editing a tracked fragment must carry the aggregator identity (committer `journal-bot@users.noreply.github.com`, or `GITHUB_ACTOR=github-actions[bot]` in CI). Additions to the carrier stay legal for anyone — that door is the flow."

**S2 — the local-gate step.**
> "Local-gate step (offline subset — rides the pre-push hook and CI), with the two step-id pin suites updated."

**S3 — the writer's already-registered check.**
> "`log-session`: before writing, the writer checks whether this conversation already landed an entry (fragments whose name carries the session slug) and reports \"already registered\" instead of writing a duplicate."

## Impact

- `scripts/local-gate.mjs` gains one offline step; the two pin suites that name
  step ids (`scripts/local-gate.test.mjs`, `scripts/release-workflows.test.mjs`)
  change with it, as S2 orders.
- `packages/agentic-workflow/src/journal/fragment.mjs` gains one export
  (`contentFault`) — the grammar's one owner lends its predicate to the gate;
  no behavior change on any existing caller.
- `packages/agentic-workflow/src/journal/write.mjs` gains a refusal; every
  caller of `agentic-workflow journal write` with an explicit `--session` that
  already landed an entry now gets exit 2 `already registered` instead of a
  second fragment. The `/log-session` directive's composed command carries
  `--session`, so it is the affected door; the skill's step-4 prose names the
  same writer.
- `docs/workflow/GATE_INVENTORY.md` gains one row (the new gate is enumerated
  there); `packages/agentic-workflow/README.md`'s `journal-write-grammar@1`
  block gains the refusal row; `skills/log-session/SKILL.md` names the refusal.

## Retirements

None — the change only adds. Nothing it supersedes exists: the push-level gap
issue #468 documents is an absence (`session-close close` covers the working
tree only), so there is no surface to retire.

## Non-goals

Verbatim from the issue, both decisions deliberately open:

> "A CLI provenance stamp on fragments (refuse hand-composed fragments at `--check`) — schema-touching, needs its own decision."

> "CODEOWNERS + ruleset hardening (require code-owner review for `docs/LOGS.md`, bypass `github-actions[bot]`) — owner-side repo settings."

Also not here: retroactive judgment of already-merged history (the gate judges
`base..HEAD` forward; the 2026-11-08 incident is reproduced by tests, not
re-litigated on `main`), and no CI workflow edit (the manual gate delegates to
`scripts/local-gate.mjs`, so the step rides CI without touching
`.github/workflows/`).

## Risk tier

Computed by `bun scripts/ceremony.mjs tier classify --paths …` over this unit's
declared paths at the cut; copied verbatim, never written from memory.

- **Cut verdict** — `standard` (`reason_kind: executable-content` — 6 paths
  carry executable content) · **Task Size** — `understood: true`,
  `contained_risk: contained`, `resumable_from_diff: true`,
  `ceremony: unit-doc`, `verification: gates` · **signals** — `[]`
- **Named high-risk item** — none — not a high-tier unit

## Acceptance criteria

- **AC1 (S1)** — over a push range, a hand-append to `docs/LOGS.md`, a rewrite
  of its past, a malformed appended block, and a pending-fragment deletion or
  edit by a non-aggregator commit each fail `scripts/log-immutability.mjs`
  (exit 1, named code), while the aggregator's appends, fragment consumptions
  and anyone's carrier additions pass (exit 0) — proven by
  `bun test scripts/log-immutability.test.mjs` exiting 0 (16 tests, including
  the two uncommitted working-tree refusals).
- **AC2 (S2)** — `node scripts/local-gate.mjs --list` lists `log-immutability`
  among the offline non-test-bearing steps, and both step-id pin suites pass:
  `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs`
  exits 0.
- **AC3 (S3)** — `agentic-workflow journal write --session <id>` into a carrier
  that already holds a fragment of that session exits 2 with
  `JOURNAL REFUSAL — … already registered …` and writes no byte, while two
  writes without `--session` still both land — proven by
  `bun test packages/agentic-workflow/test/journal.write.test.mjs` exiting 0.

## Future

none — nothing was deferred.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| The aggregator identity set (committer `journal-bot@users.noreply.github.com`, the forge bot identity, `GITHUB_ACTOR=github-actions[bot]`) is closed — any future writer of `docs/LOGS.md` or consumer of fragments must be added to `aggregatorCommit` and its pin test in the same change | future journal/aggregation work |
| The offline pre-push subset's step list is pinned twice (step-id pin suites) — a step added or removed updates both pins in the same change | future local-gate work |

## Applicable tests

`scripts/log-immutability.test.mjs` (the frozen-failure corpus) ·
`scripts/local-gate.test.mjs` + `scripts/release-workflows.test.mjs` (the two
step-id pin suites) · `packages/agentic-workflow/test/journal.write.test.mjs`
+ the crate suite bun/node (the writer change).

## Known pre-existing issues

- The worktree checkout path coincides with git's worktree admin dir, so git
  internals (`HEAD`, `index`, …) show as untracked files at the root and a bare
  `HEAD` revision argument is ambiguous (`git diff … HEAD` fails) —
  **does-not-affect** this unit's behavior; tooling is driven with explicit
  revs (`--paths`, resolved SHAs). Environment note for the handoff.
- `main` runs the root suite red until this unit's green commit lands: the
  owner merged the red suite (`5ba1d670`, `f764060a`) while the implementation
  was still uncommitted — **affects** this unit (it is the reason P2 lands
  first).

## Tasks

- P1 — Cut the unit doc, the two planning ledgers and the roadmap Fixes row (validator: `bun scripts/unit-route.mjs --triage 468-log-immutability` exits 0)
  (Implements: S1, S2, S3)
- P2 — Land the gate implementation (`scripts/log-immutability.mjs` + the `contentFault` export), green for the already-red suite (validator: `bun test scripts/log-immutability.test.mjs` exits 0)
  (Implements: S1)
- P3 — Pin the new step id in the two step-id pin suites, observed red first (validator: `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs` exits 1 before P4)
  (Implements: S2)
- P4 — Register the offline step in `STEPS` + `DEPS` and add the GATE_INVENTORY row (validator: `node scripts/local-gate.mjs --list` lists `log-immutability`; both pin suites exit 0)
  (Implements: S2)
- P5 — RED crate test: an explicit session already registered in the carrier is refused (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 1 on the new case)
  (Implements: S3)
- P6 — The writer reports `already registered`; the default-session flow pinned unchanged; README grammar row + skill line (validator: `bun run test` and `bun run test:node` in `packages/agentic-workflow` exit 0)
  (Implements: S3)
- P7 — Changeset, generated projection refresh, `ac-hash` (validator: `node scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3)
- P8 — Verification: root suite + the offline gate steps in the foreground; journal fragment + session close (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3)

### Planning evidence

M/L unit — the ledger lives beside this doc:
[`planning-evidence.md`](planning-evidence.md).

### Obligations

M/L unit — the ledger lives beside this doc:
[`planning-obligations.md`](planning-obligations.md).

## Triaged steps

Pasted from `bun scripts/unit-route.mjs --triage 468-log-immutability` after
the doc was cut:

```
TRIAGE — 468-log-immutability (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

The lane runs inline (owner's apply workflow, §4): no Relay packet is cut for
this unit; the review step is the owner's external verification.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-08, the issue, verbatim:
  ```
  Guard: docs/LOGS.md and the fragment carrier are aggregator-only — log-immutability gate + log-session already-registered check

  ## Evidence (2026-11-08, commit 37e5e01f, merged via PR #464)

  One session commit played the aggregator by hand:

  - deleted the 19 pending fragments under `.agentic-workflow/journal/` (written by other sessions, 12:18→18:44Z),
  - appended 138 lines (20 entry blocks) directly to `docs/LOGS.md` in the same commit.

  All 19 blocks are byte-identical to the fragments they replaced (no data drift), but the write path was violated end to end. Two further hand-appended entries (12:22:44Z, 19:41:18Z) exist nowhere as fragments — composed by hand, never through the CLI.

  ## Existing enforcement and its gap

  `session-close close` (carrier mode) already refuses fragment deletions, fragment edits and any `docs/LOGS.md` touch — but only over the working tree, and only when the session runs it. The violating sessions never did. Nothing at push or CI level fails a hand-append to `docs/LOGS.md` or a hand-deletion of pending fragments.

  ## Scope

  1. `scripts/log-immutability.mjs` + sibling suite (red-first): over a push range, `docs/LOGS.md` must be a byte-prefix extension of its base (append at EOF only), every appended block must conform to the entry-block grammar (one owner: the crate's `src/journal/fragment.mjs`), and every commit touching `docs/LOGS.md` or deleting/editing a tracked fragment must carry the aggregator identity (committer `journal-bot@users.noreply.github.com`, or `GITHUB_ACTOR=github-actions[bot]` in CI). Additions to the carrier stay legal for anyone — that door is the flow.
  2. Local-gate step (offline subset — rides the pre-push hook and CI), with the two step-id pin suites updated.
  3. `log-session`: before writing, the writer checks whether this conversation already landed an entry (fragments whose name carries the session slug) and reports "already registered" instead of writing a duplicate.

  ## Decisions deliberately out of scope (open)

  - A CLI provenance stamp on fragments (refuse hand-composed fragments at `--check`) — schema-touching, needs its own decision.
  - CODEOWNERS + ruleset hardening (require code-owner review for `docs/LOGS.md`, bypass `github-actions[bot]`) — owner-side repo settings.
  ```
- **L2** — 2026-11-08, owner apply-request, verbatim: "Apply to this repository: issue #468" — plain prose; state resolved it to **continue** (red commit merged, implementation uncommitted, scopes 2–3 not started).
- **E1** — 2026-11-08, `node --test scripts/log-immutability.test.mjs` at `5ba1d670` in a scratch `git archive` copy · suite fails on the missing module (RED confirmed at base, before any further code).

## Next

P2 — land the gate implementation, green for the red suite.

## References

Issue [#468](https://github.com/gtrabanco/agentic-workflow/issues/468) ·
incident commit `37e5e01f` (merged via PR #464) · the aggregator's own surface,
issue #405 · the carrier validation unit, #452.

## Branch

`feat/468-log-immutability-guard`

## Depends on

none — independent.

## Regression scope

| Scenario | Verified by |
|---|---|
| A project without the fragment carrier still refuses `journal write` (the opt-in rule) | `packages/agentic-workflow/test/journal.write.test.mjs` — "an absent carrier is refused, never created" |
| Two writes without `--session` in one carrier both land (the multi-conversation default flow) | O10's differential test (P6) |
| Every existing local-gate step keeps its id, order and tests marker | `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs` |
| The aggregator's read side (`journal aggregate --check`) is untouched | `bun run test` in `packages/agentic-workflow` (crate suite) |
| The gate never writes a byte (read-only) | the suite's fixtures assert stdout/exit only; `scripts/log-immutability.mjs` performs no fs writes |
