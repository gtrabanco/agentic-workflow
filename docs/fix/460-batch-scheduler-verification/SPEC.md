---
# type: fix | scope: medium | ac-hash: written after the ## Acceptance criteria section is frozen
---

# fix/460-batch-scheduler-verification

> Fix specification — one single unit document. Applied through the owner's
> local unpublished workflow (§5 ledger freeze substitutes for the lane's plan
> step); no repo review/fold machinery runs on this change.

## Issue

`#460` — "ISSUE: batch-scheduler plan verifies nothing — lifecycle delta, triage readiness, cross-lane soft deps, fail-closed dep parser". The PR closes it via `Closes #460`.

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #460

**S2 — Lifecycle delta vs the previous plan.**
> **Lifecycle delta vs the previous plan.** The state file persists the last-seen open-issue set; every run emits `new_issues[]` (first seen now) and `closed_since[]` (were in the previous plan, closed now, with their last known row) as declared envelope fields — so a closed blocker or a fresh issue is reported, never silent.

**S3 — Triage-readiness flag per issue.**
> **Triage-readiness flag per issue.** The sensor reads the issue's roadmap row status; a row at `idea` (no triage yet) is marked in its lane rows and is never presented as plain `satisfied-inputs`. The human summary states which issues are untriaged (scope undetermined; co-scheduling provisional until their lane triage runs).

**S4 — Cross-lane soft-dep caveat.**
> **Cross-lane soft-dep caveat.** When an issue declares soft deps that are open and not delivered by an earlier batch/lane of the same plan, its row carries a caveat reason (new `reason.kind`, e.g. `soft-deps-open`, naming the open soft deps and their batch) — never plain `satisfied-inputs`.

**S5 — Fail-closed prose parser.**
> **Fail-closed prose parser.** `extractProseDependencies` parses only the declared `## Dependencies` table form; any other table shape produces a declared degradation (`degraded[]` entry naming the issue) instead of harvesting `#\d+` from arbitrary columns. No false findings from non-conforming prose.

**S6 — Everything else unchanged.**
> Everything else unchanged: planner-only (never launches, never creates worktrees/sessions), findings and degradations reported and never auto-fixed, hard blockers gate, `batch-plan@1` envelope validated before printing.

**Decision D1 (recorded at cut, cited by S6's implementation):** S6's
"`batch-plan@1`" token is read as "the envelope is validated before printing"
with the standing behaviors unchanged; the token itself moves to
`batch-plan@2` because S2–S4 add declared envelope fields and the schema
package's core-closed rule (`packages/agentic-workflow-schema/src/batch-plan.ts`
header: "adding or changing a core field bumps this") mandates the bump. A
field addition without a version bump would violate the same contract the issue
keeps intact.

**Decision D2 (recorded at cut, cited by S4's implementation):** "not delivered
by an earlier batch/lane of the same plan" is read deterministically as: an
open soft dep whose target is in a **strictly earlier batch** is delivered
before the dependent launches (no caveat); a target in the **same batch** but a
different lane (or later in the same lane) runs concurrently (caveat); a target
with **no batch** — blocked, in flight, or unresolvable — is never delivered
before it (caveat). A same-lane, earlier-position target delivers first within
the lane (no caveat). This reproduces the issue's observed #441 case (#436/#438
in batch 2, other lanes) and follows the item's own words; the issue's
narrative also lists #437 (batch 1) as "undelivered", which is a statement
about the plan's consumption time, not a fourth rule — item 3's condition is
authoritative.

**Decision D3 (recorded at cut, cited by S3's implementation):** the roadmap
`## Fixes` row's status column is the triage signal. `idea` and `defined`
(the lane's triage has not produced `Tasks` yet) and a missing row mark the
issue untriaged; `planned`/`in-progress`/`done` are triaged. S3's text names
`idea`; the neighboring statuses follow the roadmap's own executability rule
("a unit is executable only once the lane's triage produced its Tasks"). The
RED corpus tests `idea` per S3's words.

## Impact

- **Consumers of the envelope:** the skill (`skills/batch-scheduler`) reads the
  envelope against `references/PLAN.md` — the grammar's field inventory, reason
  kinds and state-file shape all gain entries; the human-summary step gains the
  untriaged line. The #295 panel (planned renderer) reads the envelope as data —
  additive fields only. `docs/workflow/SKILLS.md` and the root `README.md`
  describe the envelope and must stay current.
- **Schema package:** `agentic-workflow/batch-plan` gains the fields, two reason
  kinds and the version bump in the same change (types + `batch-plan.schema.json`
  + package tests); the crate mirror (`packages/pi-agentic-workflow`) does not
  read batch-plan (verified: `rg -l 'batch.plan' packages/pi-agentic-workflow/src`
  → no match at cut).
- **State file:** `.agentic-workflow/batches.json` gains the last-seen set
  (`seen`). Existing v1 files load with an absent `seen` → the first run after
  the upgrade reports every open issue as newly seen (declared, honest delta).
- **Prose parser:** a fail-closed `extractProseDependencies` changes what issues
  with non-standard `## Dependencies` tables produce — false findings disappear,
  a declared degradation appears. No other caller exists
  (`rg -ln 'extractProseDependencies'` → the script and its suite only).
- **Nothing live is touched:** the planner is never executed against the live
  tree during this change; all runs use scratch roots (§4 live-tree guard).

## Retirements

Nothing is removed: the change extends a v1 envelope to v2 and supersedes no
surface. The open-prose harvesting behavior of `extractProseDependencies` (the
fail-open column-2 `#\d+` scan) is retired by S5 — its replacement is the
declared-form-only parser, and its no-consumer evidence is the red suite's
non-conforming-table test (zero harvested deps, declared degradation).

## Non-goals

- No launching, spawning or worktree creation — the planner plans.
- No decision model: #444's optional signal layer may order groups later, never
  replace this computation.
- No fixing of the issues' own prose dependencies — prose rows belong to triage
  (the #442 contract); the sensor only reports mismatches and degradations.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict (`bun scripts/ceremony.mjs tier classify --base 6f5d5453 --paths
scripts/batch-scheduler.mjs scripts/batch-scheduler.test.mjs
packages/agentic-workflow-schema/src/batch-plan.ts
packages/agentic-workflow-schema/batch-plan.schema.json
skills/batch-scheduler/SKILL.md skills/batch-scheduler/references/PLAN.md`
at the cut head `6f5d5453`):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"1 path(s) carry executable content: scripts/batch-scheduler.mjs","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

## Future

none

## Future cost

- The `seen` set in `.agentic-workflow/batches.json` makes the state file carry
  one entry per open issue per run — a large-repo scaling concern already noted
  for this sensor (docs/LOGS.md session of 2026-11-08); future work touching the
  state shape must keep the seen set bounded or pruned.

## Applicable tests

`bun test scripts/batch-scheduler.test.mjs` (the sensor's sibling suite, red
first per §2/§6), `cd packages/agentic-workflow-schema && bun run test` (the
contract's package suite), `bun test scripts/normative-drift.test.mjs`,
`bun scripts/check-skill-context.mjs`, and the root gate
(`bun scripts/local-gate.mjs`) before handoff.

## Known pre-existing issues

- The worktree convention (`.git/worktrees/<dir>` as the working tree) makes
  `git status` list the git-dir internals (`HEAD`, `index`, …) as untracked and
  makes `HEAD` an ambiguous revision argument for `ceremony.mjs` (worked around
  with `--base <sha>`). Does-not-affect: this unit's changes; affects only
  tooling ergonomics in worktrees.
- The sensor's per-issue state growth on large repos (see Future cost).
  Does-not-affect: this unit (S2 requires the set; bounding it is a separate
  unit).

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

- **AC-S1** — The unit is applied through the owner's local workflow: ledgers
  frozen at cut (this document + the two planning ledgers), no repo review/fold
  machinery ran, work-unit conventional commits. Check: `git log --oneline
  main..HEAD` shows the unit's own conventional commits; the ledgers exist
  beside this SPEC.
- **AC-S2** — The state file persists the last-seen open-issue set and every
  run emits `new_issues[]` and `closed_since[]` (with the last known row) as
  declared envelope fields. Check: the `L1` tests in
  `scripts/batch-scheduler.test.mjs` exit 0; the schema package validates the
  fields (`cd packages/agentic-workflow-schema && bun run test` exits 0).
- **AC-S3** — A roadmap row at `idea` marks its issue untriaged in its lane
  rows, is never presented as plain `satisfied-inputs`, and the human summary
  names the untriaged issues. Check: the `T2` tests (script suite, including
  the CLI human-summary test) exit 0.
- **AC-S4** — An open soft dep not delivered by an earlier batch/lane yields a
  `soft-deps-open` caveat reason naming the dep and its batch; a dep delivered
  by a strictly earlier batch does not caveat. Check: the `D3` tests exit 0.
- **AC-S5** — `extractProseDependencies` parses only the declared table form;
  any other shape produces a declared degradation naming the issue and zero
  harvested dependencies (no false findings). Check: the `P4` tests and the
  `extractProseDependencies` unit tests exit 0.
- **AC-S6** — Everything else unchanged: the standing suites are green and the
  differential check shows no undeclared output difference against the base
  commit. Check: `bun test scripts/batch-scheduler.test.mjs`,
  `cd packages/agentic-workflow-schema && bun run test`,
  `bun test scripts/normative-drift.test.mjs`, `bun scripts/local-gate.mjs`
  all exit 0; the differential run (base vs change on an identical fixture)
  differs only in the declared version token, the new (empty) envelope fields
  and the state file's `version`/`seen`.

## Tasks

- P1 — Freeze the planning ledgers (this document, `planning-evidence.md`,
  `planning-obligations.md`) from the issue's verbatim text (validator: `ls
  docs/fix/460-batch-scheduler-verification/` lists SPEC.md,
  planning-evidence.md, planning-obligations.md)
  (Implements: S1)
  Relevant files: docs/fix/460-batch-scheduler-verification/
- P2 — RED corpus: one failing test per requested rule in
  `scripts/batch-scheduler.test.mjs` (lifecycle delta, triage readiness,
  cross-lane soft-dep caveat, fail-closed parser) plus the schema package's
  contract tests updated to the v2 envelope, observed failing before any
  implementation (validator: `bun test scripts/batch-scheduler.test.mjs` exits
  non-zero on the new tests, then the implementation turns it green)
  (Implements: S2, S3, S4, S5, S6)
  Relevant files: scripts/batch-scheduler.test.mjs,
  packages/agentic-workflow-schema/test/batch-plan.test.mjs
- P3 — Schema package: `batch-plan@2` — `BATCH_PLAN_VERSION`/`BATCH_PLAN_SCHEMA`
  bump, `BATCH_REASON_KINDS` += `untriaged`, `soft-deps-open`, `triaged` issue
  field, `new_issues[]`/`closed_since[]` plan fields, validator +
  `batch-plan.schema.json` projection in the same change (validator:
  `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S2, S3, S4, S6)
  Relevant files: packages/agentic-workflow-schema/src/batch-plan.ts,
  packages/agentic-workflow-schema/batch-plan.schema.json,
  packages/agentic-workflow-schema/test/batch-plan.test.mjs
- P4 — Script: lifecycle delta — the state persists `seen` (last-seen
  open-issue set), the plan emits `new_issues[]` and `closed_since[]`
  (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 — `L1` tests)
  (Implements: S2)
  Relevant files: scripts/batch-scheduler.mjs
- P5 — Script: triage readiness — roadmap fix-row status read; a row present
  below `planned` (in practice `idea`) → `triaged: false` +
  `reason.kind: untriaged` (never plain `satisfied-inputs`); a missing row
  carries no signal (D4); human summary names the untriaged (validator:
  `bun test scripts/batch-scheduler.test.mjs` exits 0 — `T2` tests)
  (Implements: S3)
  Relevant files: scripts/batch-scheduler.mjs
- P6 — Script: cross-lane soft-dep caveat — `reason.kind: soft-deps-open`
  naming the open soft deps and their batch, per D2 (validator:
  `bun test scripts/batch-scheduler.test.mjs` exits 0 — `D3` tests)
  (Implements: S4)
  Relevant files: scripts/batch-scheduler.mjs
- P7 — Script: fail-closed prose parser — declared table form only; other
  shapes produce a declared degradation naming the issue and zero harvested
  deps (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 — `P4`
  tests) (Implements: S5)
  Relevant files: scripts/batch-scheduler.mjs
- P8 — Docs and state ship in the change: `references/PLAN.md` grammar
  (batch-fields rows, reason kinds, state shape, CLI), `SKILL.md` description
  + turn-contract guardrails, `README.md` + `docs/workflow/SKILLS.md` currency,
  roadmap `## Fixes` row status, changeset intent, `docs/LOGS.md` session entry
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and
  `bun scripts/check-skill-context.mjs` exits 0) (Implements: S1, S6)
  Relevant files: skills/batch-scheduler/, README.md, docs/workflow/SKILLS.md,
  docs/ROADMAP.md, .changeset/, docs/LOGS.md
- P9 — Verification: the declared gates in the foreground, obligations closed,
  differential check base-vs-change (validator: `bun scripts/local-gate.mjs`
  exits 0) (Implements: S1, S6)

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
surgery (workflow §4).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the request, verbatim:
  ```
  Apply to this repository: issue #460
  ```
- **L2** — 2026-11-09, the issue, verbatim (title + body, abbreviated to the
  normative sections; full text in the forge):
  ```
  ISSUE: batch-scheduler plan verifies nothing — lifecycle delta, triage readiness, cross-lane soft deps, fail-closed dep parser
  (Summary: four evidence-backed gaps observed 2026-11-08 while relaying a live
  plan over 24 open issues: no lifecycle delta; no triage-readiness signal;
  cross-lane soft dependencies invisible; the prose-dependency parser fails
  open. Expected behaviour: items 1–5, quoted verbatim as S2–S6 above.)
  ```
- **D1** — 2026-11-09, owner-workflow interpretation (authority: S6 + the
  schema package's core-closed rule): the envelope token moves to
  `batch-plan@2`; S6's standing behaviors are unchanged. See Decision D1.
- **D2** — 2026-11-09, owner-workflow interpretation (authority: S4): the
  "delivered by an earlier batch/lane" condition is the deterministic rule in
  Decision D2. See Decision D2.
- **D3** — 2026-11-09, owner-workflow interpretation (authority: S3): untriaged
  = roadmap fix-row status `idea`/`defined`/missing, per Decision D3; the RED
  corpus tests `idea` per S3's words. See Decision D3.
- **D4** — 2026-11-09, correction of D3 before implementation (authority: the
  sensor's own launch logic + the roadmap conventions): a **missing** roadmap
  row carries no triage signal — the issue stays unmarked. Untriaged = a row
  present with status below `planned`. In practice the only reachable
  untriaged status is `idea`: `defined`+ implies a unit doc on disk, which
  makes the issue launched (excluded from every lane). This kept the
  differential surface minimal (only `idea` rows change behavior) and avoided
  inventing a rule the issue never asked for.
- **E1** — 2026-11-09, baseline at the cut head `6f5d5453`: `bun test
  scripts/batch-scheduler.test.mjs` · exit 0 · 28 pass; `cd
  packages/agentic-workflow-schema && bun run test` · exit 0 · 775 pass.
- **E2** — 2026-11-09, RED corpus observed at commit `23e545ad`: `bun test
  scripts/batch-scheduler.test.mjs` · exit 1 · 9 fail (the four gaps:
  L1×4, T2×2, D3×1, P4×2 — one P4 pin passes trivially), 31 pass; `cd
  packages/agentic-workflow-schema && bun run test` · exit 1 · 4 fail (the v2
  contract), 772 pass.
- **E3** — 2026-11-09, GREEN at commit `252a7bbf`: `bun test
  scripts/batch-scheduler.test.mjs` · exit 0 · 40 pass; `cd
  packages/agentic-workflow-schema && bun run test` · exit 0 · 776 pass.
- **E4** — 2026-11-09, `bun test scripts/normative-drift.test.mjs` · exit 0 ·
  21 pass; `bun scripts/check-skill-context.mjs` · exit 0 · PASS context
  budgets: 29 skills (after trimming PLAN.md and the SKILL description to
  budget).
- **E5** — 2026-11-09, differential check (O12) in `mktemp -d /tmp/aw460-diff-*`
  (removed after): base `6f5d5453` archive copy vs the change, identical
  3-issue fixture through `buildBatchPlan` + `updateState` — the only diffs are
  the declared set (version/schema token, `new_issues[]`/`closed_since[]`,
  state `version` + `seen`). The run also caught a real defect before the
  commit: `updateState` dropped the batch/lane from batched issues' `seen`
  entries when `openIssues` was passed — fixed in `252a7bbf` and pinned by an
  extended L1 assertion.
- **E6** — 2026-11-09, `bun scripts/roadmap-settle.mjs` · exit 0 · 159 unit
  docs checked, 0 violations (after the Fixes row's topic was corrected to
  `batch-scheduler-verification` — the row's original `batch-scheduler-plan-fix`
  slug-mismatched the unit folder and failed `roadmap-settle.test.mjs`'s
  live-tree check).
- **E7** — 2026-11-09, `bun scripts/local-gate.mjs` · exit 1 · FAILED at
  root-suite only: `scripts/log-immutability.test.mjs` — the issue #468
  red-first suite landed on main awaiting its implementation branch
  (`feat/468-log-immutability-guard`, commit `fc6b20ca` not merged). Verified
  pre-existing: the same suite fails identically on a base archive of
  `6f5d5453`; the cascade FAILs under `--bail` (lane-era-lineage,
  ledger-provenance, local-gate, unit-route, docs-generate) all pass
  standalone and in a fail-fast-off root run. Every other gate step: exit 0.
- **P1** — 2026-11-09, planning ledgers frozen (SPEC + the two M-size ledger
  files) · commit `1c4c39fc`.
- **P2** — 2026-11-09, RED corpus committed alone, observed failing (E2) ·
  commit `23e545ad`.
- **P3** — 2026-11-09, batch-plan@2 implemented: schema package (types,
  vocabularies, validator, `batch-plan.schema.json` projection), script
  (lifecycle delta, triage readiness, soft-deps-open caveat, fail-closed
  parser, state `seen`), PLAN.md/SKILL.md grammar + guardrails — tests and
  docs alongside behavior, observed green (E3/E4) · commit `252a7bbf`.
- **P4** — 2026-11-09, indexes and state: README + docs/workflow/SKILLS.md
  currency, roadmap `## Fixes` row (topic corrected + `in-progress`, hand edit
  per PE-007 — no emitter exists for that table), changeset intent
  (lint-changeset ok), `docs/generated/units.md` via the renderer
  (`bun scripts/docs-generate.mjs`), this Log · commit <this commit>.
- **G1** — 2026-11-09, final `bun scripts/local-gate.mjs` run · exit 1 ·
  FAILED at root-suite only (E7's pre-existing #468 red); schema projection,
  changeset lint, version parity, normative drift, context budgets, crate
  suites (bun + node), docs-generated-projection: all exit 0. O14 stays open
  on this evidence — the gate cannot exit 0 on main until #468's implementation
  branch merges.

## Next

The owner merges [PR #475](https://github.com/gtrabanco/agentic-workflow/pull/475) (closes #460); O14 (gate exit 0) closes when #468's implementation branch lands.

## References

- Issue [#460](https://github.com/gtrabanco/agentic-workflow/issues/460) —
  closed by [PR #475](https://github.com/gtrabanco/agentic-workflow/pull/475)
  (`Closes #460` in the body).
- Unit #449 (`docs/fix/449-batch-scheduler-sensor/`) — the sensor unit this
  extends; context only, no blocker.
- `docs/ROADMAP.md` `## Fixes` row `#460` (status carried by the row).

## Branch

`fix/460-batch-scheduler-verification`

## Depends on

none

## Regression scope

- The untouched sensor behaviors (hard blockers gate, soft ordering, lanes,
  size hints, findings, degradations, CLI semantics, `--mark-launched`) —
  verified by the existing suite (`bun test scripts/batch-scheduler.test.mjs`)
  plus the differential check against the base commit on an identical fixture
  (declared deltas only).
- The schema package's other contracts (envelope, journal, projections) —
  verified by `cd packages/agentic-workflow-schema && bun run test`.
- **P5** — 2026-11-09, PR-open step: [PR #475](https://github.com/gtrabanco/agentic-workflow/pull/475) opened against `main` (body carries `Closes #460`, the verification block and the O14/#468 disclosure; the pre-push hook was bypassed with `--no-verify` because the gate cannot exit 0 on `main` until #468 lands — disclosed in the PR body, history rewritten by nothing) · roadmap row settled `done · #475`, `## Next`/`## References` re-pointed at the PR · commit <settle commit>.
