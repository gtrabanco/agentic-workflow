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
  already landed an entry **of the same kind** now gets exit 2 `already
  registered` instead of a second fragment. Both composed commands carry
  `--session`, so both are affected doors: the `/log-session` directive's
  `--kind narrative` is refused only by a second narrative, and the auto-log's
  `--kind mechanical` only by a second mechanical — the two kinds coexist (see
  O12, correction batch 1). The skill's step-4 prose names the same writer.
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
  `bun test scripts/log-immutability.test.mjs` exiting 0, including the two
  uncommitted working-tree refusals.
- **AC2 (S2)** — `node scripts/local-gate.mjs --list` lists `log-immutability`
  among the offline non-test-bearing steps, and both step-id pin suites pass:
  `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs`
  exits 0.
- **AC3 (S3)** — `agentic-workflow journal write --session <id>` into a carrier
  that already holds a fragment of that session exits 2 with
  `JOURNAL REFUSAL — … already registered …` and writes no byte, while two
  writes without `--session` still both land — proven by
  `bun test packages/agentic-workflow/test/journal.write.test.mjs` exiting 0.
- **AC4 (S3, A2)** — one entry per conversation **per kind**: the conversation's
  two write orders both land (auto-log mechanical then `/log-session`
  narrative; narrative then the shutdown's mechanical write), and a second
  fragment of the same kind for that conversation is refused with its bytes
  untouched — proven by `bun test packages/agentic-workflow/test/journal.write.test.mjs`
  exiting 0 with the two write-order cases and the same-kind refusal case.

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
- P9 — Correction batch 1, the external verification's advisories (A1–A3): the guard's unit is (session, kind) so the shipped write orders land; the grammar row and the template carrier doc state the same-kind scope and both `local` exemptions; AC1's stale count drops (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` and `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` exit 0)
  (Implements: S3)

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
- **P1** — 2026-11-08 22:55, unit doc + ledgers + roadmap row cut · `16995817`.
- **P2** — 2026-11-08 23:02, gate implementation landed · `9b873e03`.
- **P3** — 2026-11-08 23:10, step-id pins landed, observed red · `168d4b16`.
- **P4** — 2026-11-08 23:15, offline step + DEPS + GATE_INVENTORY row + crate changeset · `e0b03e5d`.
- **P5** — 2026-11-08 23:20, crate RED suite landed, observed red (2 fail of 19) · `1bdcbb2a`.
- **P6** — 2026-11-08 23:30, writer's already-registered check + grammar/skill prose · `2e80db4f`.
- **P7** — 2026-11-08 23:35, budget re-base · `656205f3`; pi changeset · `2da2bbfa`.
- **P8** — 2026-11-08 23:50, live-tree fixes (maxBuffer ceiling, like-for-like carrier diff) · `fc6b20ca`.
- **E2** — 2026-11-08, `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs` at `168d4b16` without the step · 62 pass 3 fail (the three step-id pins red — O8's red half).
- **E3** — 2026-11-08, `bun test packages/agentic-workflow/test/journal.write.test.mjs` at `1bdcbb2a` · 17 pass 2 fail (the two already-registered cases red; the fallback-slug differential pin green before and after — O10).
- **E4** — 2026-11-08, `bun test scripts/log-immutability.test.mjs` at `9b873e03` · exit 0 · 16 pass 0 fail (O1–O6, including the §2 reproducer pair).
- **E5** — 2026-11-08, the two pin suites after `e0b03e5d` · exit 0 · 65 pass 0 fail (O7/O8 green half).
- **E6** — 2026-11-08, crate suites at `2e80db4f`: `bun run test` · 493 pass 0 fail; `bun run test:node` · 494 pass 0 fail (O9/O10).
- **E7** — 2026-11-08, the gate's first foreground run on the live tree found two fixture-invisible defects (spawnSync's 1 MiB maxBuffer vs the 1,054,227-byte real journal; a tracked `.gitkeep` misread as a lost entry) — fixed at `fc6b20ca`, suite 18 pass 0 fail, live gate PASS over this branch's own range.
- **G1** — 2026-11-08, `node scripts/run-root-suite.mjs` · exit 0 · 92/92 suites PASS (twice: at `656205f3` and after `fc6b20ca`).
- **G2** — 2026-11-08, `bun scripts/local-gate.mjs --only log-immutability,journal-carrier-check,docs-generated-projection,version-parity-content` · exit 0 · `PASS — 4 step(s)`.
- **G3** — 2026-11-08, `node scripts/local-gate.mjs --list` lists `log-immutability` (O7) · `node scripts/version-parity-gate.mjs --content` · exit 0 after both changesets · `node scripts/docs-generate.mjs --check` · exit 0 · `bun scripts/check-skill-context.mjs` + `--documents` · PASS · `bun scripts/skill-lint.mjs` · 0 findings · `bun scripts/unit-route.mjs --triage 468-log-immutability` · exit 0 · `bun scripts/phase-lint.mjs docs/fix/468-log-immutability/SPEC.md` · verdict PASS.

- **L3** — 2026-11-08, owner instruction, verbatim: "create the pr".
- **P9** — 2026-11-08, branch pushed (`5ba1d670..3eda945f`, pre-push gate `PASS — 10 step(s)` both pushes) and PR opened: [#469](https://github.com/gtrabanco/agentic-workflow/pull/469) · the roadmap row reads `done` with the PR open.
- **L4** — 2026-11-09, owner instruction, verbatim: "Apply to this repository: fix the findings but just after verify are legit and after understand full context, make sure dont let other bugs open due the reach of the first fix, do this in loop until full fix is done. Make sure you havent broken other thing and fix all context (symbol)."
- **D1** — 2026-11-09, decision (correction batch 1, O12): the external verification's A2 is a **behavioral** finding, not a wording one. The `already-registered` guard was kind-wide; the auto-log passes an explicit session at shutdown (`auto-log-session-wiring.ts`:94, kind `mechanical`) and the `/log-session` directive hands the model `--session ${record.session} --kind narrative` (`log-session-invocation.ts`:343), so with that exact session the documented narrative door was refused — reproduced in scratch: mechanical `sess-A` exit 0, then the skill's own `--content -` narrative `sess-A` exit 2. S3 says "instead of writing a duplicate", and `journal-write-grammar@1` already says **one entry per session per kind**, so the guard's unit is (session, kind). Fixing prose alone would have left the refusal wider than its own contract and split the shipped flow.
- **D2** — 2026-11-09, decision (O12's boundary): the guard never fires when a fragment of that conversation and kind already exists — the template SessionEnd hook writes `${now_second}-${branch}-mechanical-${session}` itself (`log-session-end.sh`:69) and a session can already carry two mechanical fragments, so a naive same-kind rule would red that population on re-run. Same kind **and** a different target name is the refusal (PE-009).
- **P10** — 2026-11-09, RED first (correction batch 1), against the pre-fix writer: the four AC4/shape cases written before the guard moved (the two write orders, the born-before measurement, the same-kind refusal) · observed 4 fail of 22 in `packages/agentic-workflow/test/journal.write.test.mjs`.
- **P11** — 2026-11-09, the guard's unit becomes (session, kind) and the spanning case is replaced by the same-kind refusal · `packages/agentic-workflow/src/journal/write.mjs`.
- **P12** — 2026-11-09, the declared prose: the grammar row (same-kind scope, both `local` exemptions) and the template carrier doc (the refusal + one entry per conversation per kind, replacing its own older summary); AC1's stale count dropped · `packages/agentic-workflow/README.md`, `template/.agentic-workflow/journal.md`, this doc's AC1.
- **E8** — 2026-11-09, `bun test packages/agentic-workflow/test/journal.write.test.mjs` at `4974bbbc` (RED commit, pre-fix writer) · 20 pass 3 fail — the auto-log-then-narrative order, the narrative-then-auto-log order and the hook-created-fragment case red, exactly the three P11 must turn green (O12).
- **E9** — 2026-11-09, `bun test packages/agentic-workflow/test/journal.write.test.mjs` at `fdb9ac34` · exit 0 · 22 pass 0 fail, then 23 pass after the prose pin in the same commit (O12; O13's validator on the README row and the carrier doc).
- **E10** — 2026-11-09, differential against base `5ba1d670` (a real `bun add` of the crate's two declared deps in a `mktemp -d` archive, removed after): unflagged narrative, explicit `--session local`, a first-ever explicit `s1`, `journal name`, an unknown flag, a missing `--summary`, an absent carrier and `journal aggregate --check` — all 8 byte-identical in stdout/exit at base and head; the only diffs are the asked-for same-kind second entry and, at head, the shipped order now landing.
- **E11** — 2026-11-09, `bun run test` in `packages/agentic-workflow` · 497 pass 0 fail; `bun run test:node` · 498 pass 0 fail; `bun run test` in `packages/pi-agentic-workflow` · 640 pass 0 fail (O12/O13, P9).
- **G4** — 2026-11-09, `node scripts/run-root-suite.mjs` · exit 0 · 92/92 suites PASS; `bun scripts/local-gate.mjs --only log-immutability,journal-carrier-check,docs-generated-projection,version-parity-content` · exit 0 · `PASS — 4 step(s)`; `node scripts/log-immutability.mjs` on the live tree · `verdict: PASS`; `node scripts/docs-generate.mjs --check` · exit 0 · `node scripts/roadmap-settle.mjs` · verdict PASS · `bun scripts/check-skill-context.mjs` + `--documents` · PASS · `bun scripts/skill-lint.mjs` · 0 findings · `bun scripts/phase-lint.mjs docs/fix/468-log-immutability/SPEC.md` · verdict PASS.

## Next

Correction batch 1 is applied and verified by its own commands; the branch is
handed back for the owner's re-verification (a delta verdict over
`a4692ad1..`, limited to A1–A3 plus the spot check). The PR to `main`
(`Closes #468`) stays the owner's call — the branch has already been merged
once locally, so the delivery shape is the owner's decision.

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
| One conversation's two kinds both land, in either write order — the auto-log at shutdown plus the `/log-session` narrative (AC4) | `packages/agentic-workflow/test/journal.write.test.mjs` — the two write-order cases |
| A session's second fragment of the same kind is still refused, its bytes untouched (the S3 rule, scoped) | `packages/agentic-workflow/test/journal.write.test.mjs` — the same-kind refusal case |
| The aggregator's read side (`journal aggregate --check`) is untouched | `bun run test` in `packages/agentic-workflow` (crate suite) |
| The gate never writes a byte (read-only) | the suite's fixtures assert stdout/exit only; `scripts/log-immutability.mjs` performs no fs writes |
