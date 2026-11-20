---
scope: medium
---

# 598 — test-estate-sweep

> One-line: this repository applies its own test-surplus criteria to its own
> test estate — every root and package suite gets a recorded keep/merge/delete
> verdict from measured evidence, the slowest cost is cut at the runner before
> any test is touched, and future units inherit a committed baseline plus a
> declared pre-push budget instead of a feeling.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
estate.md | kept · the generated per-suite baseline this unit commits (S6)
```

## Issue

`#598` — `NEW FEATURE: test-estate sweep of the current repo — per-suite
keep/merge/delete verdicts with evidence + measured suite and pre-push speedup`.
The unit dir is `docs/features/598-test-estate-sweep/` because the roadmap row
this issue already carries (`docs/ROADMAP.md:181`) links this path; creating the
doc anywhere else would leave that hand-owned row pointing at nothing, and a
roadmap row is never hand-edited to match a folder (`D1`).

## Specs

Cut from the issue's `## Expected behaviour` and `## Acceptance criteria`, one
requirement per enumerated ask, quoted verbatim; the issue's own words are the
authority and this document never paraphrases them.

**S1 — apply issue #598 to this repository.**
> Apply to this repository: issue #598

**S2 — per-suite inventory and verdict, with the obligation class applied early.**
> 1. **Per-suite inventory + verdict.** For every root suite (and both packages' suites): the surface(s) it protects, the obligation class (#596's vocabulary, applied early — one line beside the suite), and a verdict per owner rule: keep / merge / delete, with evidence. Expected deletion classes, from the criteria:
>    - tests asserting surfaces that no longer exist (dead-surface — the gentle-ai #4120 analog: their sweep found 78 dead clusters incl. ~20 orphan test helpers, i.e. tests deleted and helpers left behind);
>    - obligation-level duplicates (same asserted behavior on the same surface — keep **one** survivor per owner rule 2026-11-16; merge or delete the rest);
>    - cost-over-risk tests (asserting constants/strings the risk-based standard does not justify; e.g. verifying a literal heading string vs verifying a complex calculation).

**S3 — deletion discipline on the sweep itself.**
> 2. **Deletion discipline on the sweep itself**: every deletion cites its ground and evidence in the unit doc; deletions land as their own commits; nothing is deleted to make a red suite green; the boundary deletion ≠ weakening (TESTS.md) applies. Deletion on this unit requires the plan to mark each deletion (execute-phase's planned-deletion authority, #597).

**S4 — speed work measured, not vibes.**
> 3. **Speed work — measured, not vibes.** The wall-clock per change class (docs-only / script change / package change) is measured **before and after** this unit (#364's point 4, owner-requested inclusion). Then, in impact order:
>    - the slowest suites get a per-suite wall-clock budget and a reduction pass (merge redundant fixtures, share setup, remove repeated full-tree rebuilds where a fixture suffices);
>    - the pre-push offline subset gets a budget: the hook must return in a bounded time on a typical push, with the measured before/after recorded;
>    - runner-level wins first (already bun-first; pool sizing, suite isolation costs) before any test is touched — speed must never come from weakening or deleting a needed guard.

**S5 — the speed/deletion link is explicit.**
> 4. **The speed/deletion link is explicit**: deleting obligation-duplicates also speeds the suite, but a test that must stay does not get relaxed for speed — its cost is reduced (fixtures, parallelism, budgets), never its assertions.

**S6 — record the baseline so future units compare.**
> 5. **Record the baseline** so future units compare: per-suite cost table committed (or emitted) as part of the unit's evidence; the #596 sweep and the tag gate inherit it.

**S7 — the issue's own acceptance criteria.**
> - [ ] Every root suite has a recorded verdict (keep / merge / delete) with evidence; deletions cite their ground and land in their own commits.
> - [ ] Where duplicates merged: exactly one survivor per obligation.
> - [ ] Wall-clock per change class measured before and after, recorded in Evidence.
> - [ ] A typical pre-push runs within its declared budget on this host; the budget is recorded, not just claimed.
> - [ ] Root suites green (`node scripts/run-root-suite.mjs`), context budgets green, gate green, changeset per repo rule.

**S8 — non-goals, verbatim.**
> - No weakening, emptying, or skipping of assertions for speed — cost reduction changes how a test runs, never what it proves.
> - No deletion without the evidence standard (dead-surface / obligation-duplicate / cost-over-risk) recorded per deletion.
> - No exhaustive mutation sweep — selective kill-rate only where a merge/delete verdict is contested.
> - No decision-model dependency; the substrate's future role stays recorded in #444.
> - No new skill surface — this unit applies existing criteria to this repository (a dogfooding application unit of #595/#596's standards).

## Impact

- **The test estate is the repository's guard rail.** 136 root suites and 227
  package suites run on every push and every merge; a verdict written without
  evidence removes a guard, so the evidence carriers (`estate.md`, the
  adjudication section) are the unit's product and the emitter is regenerable.
- **`test-obligation-tags` is the one owner of the suite declarations.** Its
  `--sweep` mode clusters root suites by tag; this unit adds the estate inventory
  beside it instead of a second command, so the tags, the gate and the inventory
  cannot disagree about what a suite declares (`D2`).
- **`scripts/local-gate.mjs` is what a push runs.** A budget row and any
  runner-level saving lands there and in `docs/workflow/GATE_INVENTORY.md`; the
  pre-push hook prints the step timings the budget is measured from.
- **No test is weakened.** The unit may delete only on a recorded ground, and a
  test that must stay keeps every assertion — its cost is reduced at the runner
  (`D4`).
- **Package suites carry no tag** (#596's gate scopes `scripts/`), so their
  obligation class is recorded as `undeclared` rather than guessed (`D3`).

## Surfaces

- `scripts`
- `packages/agentic-workflow`
- `docs`

## Retirements

Strictly additive until a deletion is adjudicated: the emitter, the baseline
artifact and the budget row are new surfaces, and each row's consumer is named
here rather than promised.

| added surface | how it is consumed from day one |
|---|---|
| `packages/agentic-workflow/src/test-obligation-tags/index.mjs` → `--estate` | the committed `estate.md` is its output; the sibling suite pins all four modes |
| `docs/features/598-test-estate-sweep/estate.md` | the baseline future units compare against (S6); regenerated, never typed |
| `docs/workflow/GATE_INVENTORY.md` → the `test-obligation-tags` row's estate claim | `prose-gate-inventory` resolves the row against the suite it cites |

A deletion retired from the estate carries its own row in `estate.md` and its own
commit (`S3`); no deletion is planned at cut, and the adjudication in `estate.md`
§ Adjudication records why each fired standard was kept or removed.

## Non-goals

Inherited verbatim from the issue (S8), plus two this unit adds for itself:

- No new CLI surface: the estate inventory is a mode of the command that already
  owns the suite declarations, not a second command (`D2`).
- No package-suite tags authored by this unit: the tag is a semantic claim beside
  a suite, and 227 invented claims would be fabrication, not evidence (`D3`).

## Risk tier

Computed, never chosen:

```
bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths scripts/test-obligation-tags.test.mjs,packages/agentic-workflow/src/test-obligation-tags/index.mjs,docs/workflow/GATE_INVENTORY.md,docs/features/598-test-estate-sweep/SPEC.md
```

- **Tier** — `standard` · **Task Size** — `standard`
- **Reason** — `executable-content` (2 escalating paths, 2 inert)
- **Named high-risk item** — `none — not a high-tier unit`

## Future

None deferred.

## Future cost

- **The baseline is a dated measurement, not a live table.** A future unit
  regenerates `estate.md` with its own gate log; reading stale numbers as current
  is the defect this row names. Binds: whoever compares cost across units.
- **A fired standard is adjudicated before anything is deleted.** Binds: any
  later sweep that reads `estate.md` and wants to act on a `suspect` row.

## Applicable tests

- `node --test scripts/test-obligation-tags.test.mjs` (the emitter's contract:
  discovery, verdict derivation, the cost parse, the JSON document).
- `node scripts/run-root-suite.mjs` (the whole root estate, unchanged assertions).
- `bun run test` in `packages/agentic-workflow` (the crate suite the touched
  module belongs to).

## Known pre-existing issues

- **`docs/fix/596-test-relevance-sweep/sweep.md` cost log is not committed**
  (`PE-004` in that unit) — `does-not-affect` this unit: the estate baseline this
  unit commits is the durable artifact that log was not.
- **The box is shared.** Every wall-clock measurement here is taken under the
  load average it records; a delta smaller than that variance is reported as
  noise, never as a saving (`D5`).

## Acceptance criteria

Frozen at cut. One observable criterion per `S#`, each naming the check that
proves it.

- **AC-S1** — the unit exists as a recorded delivery of issue #598 with both
  planning ledgers. Check: `rg -c '^\*\*S[1-8] — ' docs/features/598-test-estate-sweep/SPEC.md`
  prints `8`; `ls docs/features/598-test-estate-sweep/planning-{evidence,obligations}.md`
  lists both.
- **AC-S2** — every root suite and every package suite carries a recorded verdict
  with the evidence class that produced it, and the obligation class is the
  tag's or the honest `undeclared`. Check:
  `bun scripts/test-obligation-tags.mjs --estate` exits 0 and its table has one
  row per suite on disk (its header prints both counts); a row whose obligation
  class is not a published kind prints `undeclared`.
- **AC-S3** — every deletion records its ground and lands in its own commit, and
  nothing is deleted without one. Check: `git log --oneline main...HEAD --diff-filter=D -- scripts packages/*/test`
  lists exactly the commits named in `estate.md` § Adjudication (zero is a legal
  answer, and then no row exists).
- **AC-S4** — the wall-clock per change class is measured before and after, and
  the pre-push budget is a recorded measurement. Check:
  `rg -c '^\| `(docs-only|script change|package change)` ' docs/features/598-test-estate-sweep/estate.md`
  prints `3`; `rg -c 'pre-push-budget' docs/workflow/GATE_INVENTORY.md` prints `1`.
- **AC-S5** — no test assertion is weakened for speed. Check:
  `git diff main...HEAD --numstat -- scripts/*.test.mjs packages/*/test`
  reports deletions only for suites named in § Adjudication (zero rows ⇒ no
  deleted assertion).
- **AC-S6** — the baseline is committed as evidence and is the emitter's output,
  not typed prose. Check: `bun scripts/test-obligation-tags.mjs --estate --cost <log>`
  reproduces `estate.md`'s table byte-for-byte apart from the dated header.
- **AC-S7** — the issue's acceptance list holds: root suites green, context
  budgets green, gate green, changeset present. Check:
  `node scripts/run-root-suite.mjs` exits 0; `bun scripts/check-skill-context.mjs`
  exits 0 and its `--documents` mode too; `bun scripts/local-gate.mjs` exits 0;
  `bun scripts/lint-changeset.mjs` exits 0.
- **AC-S8** — no non-goal is crossed: no new skill surface, no package-suite tag
  invented, no target-selection change that lets a push skip a test-bearing step
  beyond the declared `empty` verdict. Check:
  `git diff --name-only main...HEAD -- skills template` prints nothing;
  `rg -c 'test-obligation:' packages/*/test` prints `0`;
  `git diff main...HEAD -- scripts/local-gate.mjs | rg -c 'pushBase|test-impact'`
  prints `0`.

## Tasks

Dependency-topological, smallest first. One task per phase; the phase's
validator is the command that proves the whole phase.

- P1 — Freeze the unit doc and both planning ledgers: the eight requirements
  verbatim, the acceptance criteria, the evidence and obligation ledgers
  (validator: `rg -c '^\*\*S[1-8] — ' docs/features/598-test-estate-sweep/SPEC.md` prints `8`)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  - Relevant files: docs/features/598-test-estate-sweep/SPEC.md, docs/features/598-test-estate-sweep/planning-evidence.md, docs/features/598-test-estate-sweep/planning-obligations.md, docs/features/598-test-estate-sweep/decisions.md
- P2 — Extend `test-obligation-tags` with the estate inventory, red-first: the
  sibling suite's new cases observed failing on the missing mode, then the mode
  (validator: `node --test scripts/test-obligation-tags.test.mjs` exits 0)
  (Implements: S2, S6)
  - Relevant files: scripts/test-obligation-tags.test.mjs, packages/agentic-workflow/src/test-obligation-tags/index.mjs
- P3 — Emit and commit the baseline `estate.md` from a measured gate log, and
  adjudicate every fired standard: keep or delete per row, a deletion in its own
  commit with its ground recorded
  (validator: `bun scripts/test-obligation-tags.mjs --estate --cost <log>` exits 0 and prints one row per suite on disk)
  (Implements: S2, S3, S7)
  - Relevant files: docs/features/598-test-estate-sweep/estate.md
- P4 — Measure and cut the cost: the three change classes before and after, the
  runner-level savings, and the declared pre-push budget row
  (validator: `rg -c 'pre-push-budget' docs/workflow/GATE_INVENTORY.md` prints `1` and `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS`)
  (Implements: S4, S5)
  - Relevant files: scripts/local-gate.mjs, docs/workflow/GATE_INVENTORY.md, docs/features/598-test-estate-sweep/estate.md
- P5 — Verify and write the state: the gates in the foreground, the changeset,
  the projection re-rendered, the session entry written
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S7, S8)
  - Relevant files: .changeset/, docs/generated/, docs/LOGS.md

### Planning evidence

The ledger lives beside this document — `planning-evidence.md` — with one row per
Engineering claim the change rests on. This section names it; it does not embed a
second copy.

### Obligations

The ledger lives beside this document — `planning-obligations.md` — in the closed
nine-column shape (owner: `skills/pre-execution-review/references/LEDGERS.md`).
This section names it; it does not embed a second copy.

## Triaged steps

This unit is applied inline on the owner's local-workflow instruction, which
substitutes for the lane's plan step; the plan is `## Tasks` above and the ledger
freeze below, never a re-derived step list:

```text
docs → implement → tests → evidence
```

## Findings

Open rows only (carrier grammar: `findings-table@1`).

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-26, the owner's request, verbatim:
  ```
  Apply to this repository: issue #598
  ```
- **L2** — 2026-11-26, the issue text, verbatim: the body of issue #598 as
  fetched with `gh api repos/gtrabanco/agentic-workflow/issues/598 --jq .body`;
  its `## Expected behaviour`, `## Acceptance criteria` and `## Non-goals` are
  quoted verbatim as `S2`–`S8` above.

## Next

The owner's external verdict on the diff.

## References

- Issue [#598](https://github.com/gtrabanco/agentic-workflow/issues/598) — closed
  by the unit's pull request via `Closes #598`.
- Issue [#596](https://github.com/gtrabanco/agentic-workflow/issues/596) — the
  tag surface and the `--sweep` mode this unit extends with the estate inventory.
- Issue [#595](https://github.com/gtrabanco/agentic-workflow/issues/595) — the
  surplus criteria the verdicts apply.
- Issue [#597](https://github.com/gtrabanco/agentic-workflow/issues/597) — the
  deletion authority a plan-marked deletion exercises.
- `skills/unit-lane/references/TESTS.md` — the tag grammar and the
  deletion-vs-weakening boundary.
- `docs/workflow/GATE_INVENTORY.md` — the budget row this unit declares.

## Branch

`feat/598-test-estate-sweep` (worktree `.worktrees/feat-598-test-estate-sweep`).

## Depends on

Soft (prose only, no native blocker): #595 and #596 landed the criteria and the
tag surface this unit applies; #597 landed the deletion authority its own
deletions would exercise.

## Regression scope

- **The gate stays exactly as strict on a push.** The offline subset keeps every
  step it runs today; a runner-level saving changes how a step is dispatched, not
  what it proves. Verified by `scripts/local-gate.test.mjs` (the step table and
  the graph) and by the gate's own run.
- **The tag gate keeps its four refusals.** `--estate` is a report mode beside
  `--sweep`; the default invocation's verdict is unchanged. Verified by
  `node --test scripts/test-obligation-tags.test.mjs`.
- **No suite loses an assertion.** Any deletion needs a recorded ground and its
  own commit; otherwise the suites are byte-identical apart from the emitter's
  own additions. Verified by `git diff main...HEAD -- scripts packages/*/test`.
