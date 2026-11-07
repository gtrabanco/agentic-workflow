---
type: feature
scope: large
---

# fix/449-batch-scheduler-sensor

> Fix specification — one single unit document. Applied through the owner's
> local unpublished application workflow (frozen planning ledgers, direct
> implementation, no self-review machinery); the repo's deterministic gates run
> always.

## Issue

`#449` — NEW FEATURE: batch scheduler sensor — organize open work into
parallel-execution batches (order-respecting, collision-free) as a machine
envelope. The PR must close it via `Closes #449` in the body.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers.

**S1 — Apply issue #449 to this repository.**
> Apply to this repository: issue #449

**S2 — A deterministic batch sensor emitting parallel-execution batches as a
machine envelope.**
> A deterministic sensor (via `workflow-status` extended mode or its own skill — triage decides) that reads the live work graph and emits **parallel-execution batches as a machine envelope**: which issues can run together **now**, which are blocked and by what, and which surface each lane occupies — with zero surface collisions.

**S3 — Inputs already existing today.**
> - The relations we already maintain per the #442 contract: native `blocked-by` (authoritative) + the prose `## Dependencies` soft rows.
> - **Touched-surface per issue** — derived from each issue's scope (`Where`/`In scope` sections → skill paths / package paths), which is the piece that made the manual batching work: **one lane per surface** (e.g. the pi package runs one lane at a time; two skills twice if disjoint).
> - Roadmap state (`docs/ROADMAP.md`) + unit docs in flight (a surface occupied by an open unit doc is occupied).

**S4 — Emit batches with per-issue lane, worktree, command, reason.**
> 1. Emit batch N (the runnable-now set), batch N+1…, and for each issue: its lane, its worktree name, the command that starts it (`/unit-lane --from-issue <N>`), and the reason it is where it is (satisfied input / blocker / surface conflict).

**S5 — Standing constraints enforced mechanically.**
> 2. Enforce the standing constraints mechanically: hard blockers gate, soft dependencies order, single-occupant-per-surface, measured-size hints for lane count.

**S6 — Persistence across runs.**
> 3. Persist enough state (e.g. `.agentic-workflow/` ledger) that a re-run recognizes lanes already claimed/launched — the hand-computed plan died every session because nothing remembered it.

**S7 — Unresolvable spots are findings, not silent omissions.**
> 4. Verdicts the work-graph audit can feed: an issue with an unresolvable spot (cyclic wait, orphaned soft dep) is a **finding**, not a silent omission.

**S8 — Works with no decision model configured.**
> This sensor is that authoritative deterministic half — it must exist and work with **no decision model configured**; #444* can later add the signal layer over it. No hard dependency between them.

**S9 — Non-goals: planner, not orchestrator; no second source of truth.**
> - Not an orchestrator: it plans and reports; it does not spawn sessions or run units (the launcher half is #295's panel or the owner's manual command).
> - Not a second source of truth: relations and surfaces are read from where they live (forge + issue bodies + unit docs), never re-declared here.

## Impact

- `workflow-status` is **untouched**: its strictly read-only invariant forbids the
  persistence S6 requires, and its Envelope v2 contract is consumed by
  `decideWorkflowAction()` — bolting batch grouping onto it would churn the
  highest-traffic machine surface for a different question (parallel grouping,
  consumed as data by #295). Triage decision (recorded in `decisions.md`): the
  sensor ships as its own skill + its own deterministic script.
- Consumers of the delivered envelope: the owner (replaces the hand-built
  batches 1–12) and #295's panel (renders it; no hard dependency).
- Registration surfaces a new user-invocable skill touches: `.claude-plugin/plugin.json`
  (alphabetical), README "The skills" narrative (flow order) + its
  `**<N> user-facing skills**` rendered fact (recomputed by `rendered-facts@1`),
  `docs/workflow/SKILLS.md`, `skills.sh.json` channel manifest,
  `check-skill-context` budgets, the `normative-surfaces@1` inventory.
- The script adds a build-time dependency on the schema package's `dist/`
  (same named-precondition loader `workflow-status.mjs` uses) — root suites
  already require `dist/`.

## Retirements

Nothing is retired: the batch scheduler is a new surface. Verified at the cut
head — no existing script, skill, or doc claims the batch-grouping
responsibility (`rg -ni 'batch' skills/ scripts/ docs/workflow/` matches only
unrelated prose: `fold-findings` repair batches and the review-loop batch
vocabulary). Nothing can be removed because nothing exists to supersede.

## Non-goals

- Not an orchestrator (S9): the script never spawns sessions, never runs
  `/unit-lane`, never creates worktrees. `worktree` and `command` fields are
  reported strings.
- Not a second source of truth (S9): relations come from the forge (native
  `blocked-by` + prose `## Dependencies`), surfaces from issue bodies, state
  from `docs/ROADMAP.md` + unit docs on disk.
- No decision-model layer (S8 — that is #444's optional signal half).
- No changes to `workflow-status`, its envelope, or its step sequence.
- No `template/` mirror in this unit: the sensor reads this repo's own live
  work graph; distribution to consumer projects is a later unit's decision
  (the skill prose stays stack-agnostic).

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verbatim verdict (`bun scripts/ceremony.mjs tier classify --paths <planned
paths>` at the cut head `b8b1d814`):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"1 path(s) carry executable content: scripts/batch-scheduler.mjs","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

## Future

- **2026-11-07, open** — "#295 (final batch) — the panel renders the envelope
  and offers worktree creation + lane launch per batch; the sensor is the
  producer, the panel the renderer." (S2 issue body, Consumers section.)

## Future cost

- The `.agentic-workflow/batches.json` state file is a new durable artifact in
  the sensor's own namespace; future units touching the crate's `.agentic-workflow/`
  layout must keep it ignored (`.agentic-workflow/.gitignore`'s whitelist
  already ignores it — nothing to maintain).
- The BatchPlan v1 document contract, once published by the schema package,
  is consumed as data: breaking shape changes need a version bump, never a
  silent reshape (train rule, `docs/workflow/PACKAGES.md`).

## Applicable tests

- `scripts/batch-scheduler.test.mjs` — new suite, red-first (one test per
  requested rule, S4–S8, plus determinism and degradation).
- `packages/agentic-workflow-schema` — batch contract vectors in the package's
  own suite.
- Differential: `scripts/workflow-status*.test.mjs`,
  `scripts/workflow-docs-index.test.mjs`, `scripts/pre-execution-sensor.test.mjs`
  prove the untouched sensor surface still holds (the new script imports
  `index-document.mjs` parsers shared with `workflow-status.mjs`).

## Known pre-existing issues

- `npx skills add . --list` gate and `check-skill-context` are healthy at the
  cut head (verified this session); no known red gate affects this unit.
- The `## Fixes` roadmap table has no deterministic emitter (`rowUpsert` targets
  the `| NN |` Features table only) — affects P7 (hand edit recorded as the
  declared mechanism, PE-006).

## Tasks

- P1 — Cut the unit doc + planning ledgers (this commit) (validator: `bun scripts/phase-lint.mjs docs/fix/449-batch-scheduler-sensor/SPEC.md` exits 0)
  (Implements: S1)
  Relevant files: docs/fix/449-batch-scheduler-sensor/
- P2 — RED: `scripts/batch-scheduler.test.mjs` — one failing test per requested rule (S4–S8) + determinism, observed failing on the missing module (validator: `bun test scripts/batch-scheduler.test.mjs` exits non-zero)
  (Implements: S4, S5, S6, S7, S8)
  Relevant files: scripts/batch-scheduler.test.mjs
- P3 — Schema package: BatchPlan v1 contract (closed vocabularies + validator + vectors) (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S2, S7)
  Relevant files: packages/agentic-workflow-schema/src/batch-plan.ts, packages/agentic-workflow-schema/test/batch-plan.test.mjs
- P4 — Implement `scripts/batch-scheduler.mjs` (collection, computation, and persistence passes as separate functions), suite green (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0)
  (Implements: S2, S3, S4, S5, S6, S7, S8)
  Relevant files: scripts/batch-scheduler.mjs
- P5 — Scratch fixture run of the live collection path + differential check of touched shared parsers (validator: differential run in `mktemp -d` exits 0 with zero unexpected differences)
  (Implements: S3, S9)
- P6 — Skill `skills/batch-scheduler/` (SKILL.md + references/PLAN.md) + budgets + registration (plugin.json, skills.sh.json) (validator: `bun scripts/check-skill-context.mjs` PASS; `npx skills add . --list` lists batch-scheduler)
  (Implements: S2, S4, S5, S6, S7)
  Relevant files: skills/batch-scheduler/
- P7 — Docs and indexes: AGENTS.md normative-surfaces rows, ROADMAP Fixes row, SKILLS.md, README (rendered count), changeset, LOGS.md session entry (validator: `rg -n 'batch-scheduler' AGENTS.md README.md docs/workflow/SKILLS.md docs/ROADMAP.md` matches ≥ 4)
  (Implements: S1, S2)
- P8 — Full verification: root gate + all touched suites in the foreground; obligations ledger closed (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9)

### Planning evidence

The M/L ledger lives beside this doc: [`planning-evidence.md`](planning-evidence.md)
(one row per Engineering claim; sampled at the cut head `b8b1d814`).

### Obligations

The M/L ledger lives beside this doc:
[`planning-obligations.md`](planning-obligations.md) (9-column shape owned by
`skills/pre-execution-review/references/LEDGERS.md`). Before the unit ships,
every row is `verified` or an evidenced `n/a`.

## Triaged steps

The triage step of this application is the owner's local workflow §5 itself
(ledger freeze substitutes for the lane's plan step; no lane machinery runs on
this repo's own surgery — owner workflow §4). The machine triage router was not
run for the same reason: it is the lane's own step. The task list above is the
authoritative step list for this unit.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-07, the request, verbatim:
  ```
  Apply to this repository: issue #449
  ```
- **L2** — 2026-11-07, issue #449 verbatim as filed (title + body) frozen as S2–S9 above; labels at cut: `needs-triage` (no `human-revision-needed` — no hold).
- **E1** — 2026-11-07, `bun scripts/ceremony.mjs tier classify --paths scripts/batch-scheduler.mjs scripts/batch-scheduler.test.mjs skills/batch-scheduler/SKILL.md packages/agentic-workflow-schema/src/batch-plan.ts AGENTS.md README.md` · exit 0 · `tier: standard`, `reason_kind: executable-content`, `signals: []`.
- **E2** — 2026-11-07, `bun scripts/phase-lint.mjs docs/fix/449-batch-scheduler-sensor/SPEC.md` · exit 0 · `verdict PASS` (fingerprint `8de2f3d1…`); one BLOCKED re-run before the fix (P4 task text carried a `→` chain), repaired by rewording the task line.
- **E3** — 2026-11-07, O19's corpus check: `gh issue view 449 --json state,labels` · exit 0 · OPEN, `needs-triage`; `ls docs/fix/ | rg 449` printed nothing at the cut head — no prior batch-scheduler unit, no reproducer to extract.
- **E4** — 2026-11-07, PE-001 fetch: one GraphQL call over open issues · exit 0 · 7 issues carry native `blocked-by` (e.g. `444 blocked-by 427`, `410 blocked-by 407,406`).
- **E5** — 2026-11-07, PE-002 fetch: `gh issue list --state open --limit 3 --json number,title,body` · exit 0 · bodies returned.
- **P1** — 2026-11-07, unit doc + planning ledgers cut (SPEC, planning-evidence, planning-obligations, decisions) + Fixes roadmap row · commit recorded in the P2 line.

## Next

P2 — the RED test batch.

## References

- Issue #449 (this unit), #442 (issue-relationships contract — dependency
  semantics), #444 (decision substrate — optional signal layer over this
  deterministic half), #295 (panel consumer).
- `docs/workflow/ISSUE_WORKFLOW.md` §Relationships (owner of the dependency
  semantics the sensor reads).

## Branch

`feat/449-batch-scheduler-sensor`

## Depends on

None — independent of all open units (its inputs are read-only forge/git/docs
surfaces).

## Regression scope

- `workflow-status` envelope + skill behaviour: `bun test scripts/workflow-status-sensor.test.mjs scripts/workflow-status-compact.test.mjs scripts/workflow-status-pre-execution.test.mjs` exits 0.
- Roadmap/index parsing shared with the sensor: `bun test scripts/workflow-docs-index.test.mjs` exits 0.
- Schema package contract suite: `cd packages/agentic-workflow-schema && bun run test` exits 0.
