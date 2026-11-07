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

## Acceptance criteria

One observable, testable criterion per `S#`, frozen at cut and re-bound by the
correction batch (external verify, 11 blockers). Each names the check that
proves it.

- **AC-S1** — The issue is applied as one change and every external-verify
  blocker is closed at the bound head. Check: `bun scripts/local-gate.mjs`
  exits 0, `bun scripts/roadmap-settle.mjs` exits 0 (0 violations), and the
  `## Log` carries an `E` line per obligation validator.
- **AC-S2** — The envelope exists, is closed to `batch-plan@1` and is
  deterministic for identical inputs, and its contract publishes from the
  schema package. Check: `bun test scripts/batch-scheduler.test.mjs` exits 0;
  `cd packages/agentic-workflow-schema && bun run test` exits 0 (including the
  committed projection's `files` contract).
- **AC-S3** — Surfaces are read from where they live: the issue body is the
  source, a tree-root token covers every declared child lane, and a soft dep
  on a running unit is not a defect. Check: the `B3` tests in
  `scripts/batch-scheduler.test.mjs` exit 0.
- **AC-S4** — Every batched issue carries its lane, derived worktree,
  `/unit-lane --from-issue <N>` command and a reason. Check: the `S4` tests.
- **AC-S5** — Standing constraints are enforced mechanically: hard blockers
  gate (an open blocker with a unit doc is named as in flight and never
  batched), soft deps order but never gate, one lane per surface serializes
  its occupants, and size hints are reported facts. Check: the `S5`, `B4` and
  `B5` tests.
- **AC-S6** — Persistence: a re-run recognizes claimed lanes, `--no-state` is
  a pure read, and the write options are mutually exclusive. Check: the `S6`
  and `B6` tests.
- **AC-S7** — Unresolvable spots are findings and resolvable states are never
  reported as findings: a real cyclic wait is a `cycle` finding, an in-flight
  target is not. Check: the `S7`, `B4` and `B5` tests.
- **AC-S8** — No decision model anywhere in the path. Check: the
  byte-identical determinism test and the `S8` source pins.
- **AC-S9** — Planner only: never spawns, never creates worktrees; `worktree`
  and `command` are reported strings. Check: the `S9` source pins.

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

- **`packages/agentic-workflow/test/journal.surfaces.test.mjs` S15 was red at
  the base commit** — the fragment
  `.agentic-workflow/journal/20261107T151312Z-docs-batch-2-landing-safeguard-manual.md`
  carried the segment `manual` where the fragment grammar requires
  `mechanical|narrative` (`parseFragmentName` returns null), so the carrier
  probe failed. Verified identical at `b8b1d814` (base archive run, this
  session). **Repaired in this unit** (E14, out-of-unit and disclosed): the
  fragment was renamed to the grammar and the crate suite is green since.
  A later log-session fragment reproduced the same class (`…-session-log.md`)
  and is repaired here by naming it `narrative` (external verify B11) — the
  writer that produced both names is a separate finding, not this unit's.

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
- P9 — Correction batch I (external verify B3, B4, B5, B6, B8): the frozen reproducers run red first, then the planner normalizes tree-root surfaces, models in-flight targets, refuses the write-option pair and names the forge on both collection sources (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0)
  (Implements: S2, S3, S5, S6, S7)
  Relevant files: scripts/batch-scheduler.mjs
- P10 — Correction batch II (external verify B7): the committed draft-07 projection is declared in the package `files`, like every sibling contract (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S1, S2)
  Relevant files: packages/agentic-workflow-schema/package.json
- P11 — Correction batch III (external verify B2): the guide's source-skill counts state the tree it ships (validator: `rg -c '29 source skills \(14 user-facing' README.md` matches 1)
  (Implements: S1)
  Relevant files: README.md
- P12 — Correction batch IV (external verify B9, B10, B11): the ledger cells name the runner they were measured with, the known-issue section states the repair this unit already made, and the carrier's fragment name parses (validator: `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` exits 0)
  (Implements: S1)
  Relevant files: docs/fix/449-batch-scheduler-sensor/
- P13 — Correction batch V (external verify B1): the roadmap row settles `done` with the PR it carries, the projections are regenerated, and the recheck runs the settle gate and the full gate (validator: `bun scripts/roadmap-settle.mjs` exits 0 and `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2)
  Relevant files: docs/ROADMAP.md
- P14 — Correction batch VI (A5): the plan grammar declares the nested `reason` fields and the parity pin refuses nested drift (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 and `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S1)
  Relevant files: skills/batch-scheduler/
- P15 — Correction batch VII (X1): the changed-set comparison reads its dirty list through the one parsing owner, and a staged rename is pinned both ways (validator: `bun test scripts/version-parity-gate.test.mjs` exits 0 in a tree carrying a staged rename)
  (Implements: S1)
  Relevant files: scripts/version-parity-gate.test.mjs
- P16 — Correction batch VIII (A1, A2): the budget narration counts its own rows and the portable prompt states the tree's counts (validator: `bun scripts/check-skill-context.mjs --documents` exits 0 and `rg -U -c '14\s+user-facing skills \+ 15 internal steps' docs/workflow/PORTABLE_PROMPT.md` matches 1)
  (Implements: S1)
  Relevant files: docs/workflow/
- P17 — Correction batch IX (A3): the pi catalogue lists its commands in the table's order (validator: `rg -o '^\| ./[a-z-]+.' packages/pi-agentic-workflow/README.md | LC_ALL=C sort -c` exits 0)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/README.md

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
| X1 | scripts/version-parity-gate.test.mjs:290 | tests | low | a **staged rename** in the working tree fails the root suite: the test's own dirty-list helper renders `old -> new` while `porcelainPaths` returns both sides. Reproduced by staging the journal-fragment rename here; green once the batch was committed (the state the gate models). Reported, not fixed — a new finding never earns a correction cycle | report-note | owner |

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
- **P1** — 2026-11-07, unit doc + planning ledgers cut (SPEC, planning-evidence, planning-obligations, decisions) + Fixes roadmap row · `a649f3b3`.
- **P2** — 2026-11-07, RED suite committed, observed failing on the missing module (0 pass / 1 fail) · `c31f54c9`.
- **P3** — 2026-11-07, batch-plan@1 contract in the schema package; package suite 771 pass / 0 fail · `382a87bf`.
- **P4** — 2026-11-07, `scripts/batch-scheduler.mjs` implemented; suite 19 pass / 0 fail · `d7fc6243`.
- **P5** — 2026-11-07, scratch-clone live-path run: 3 findings (canonical roadmap path; relations-unknown vs mismatch; `--remote`) each pinned by a test; live plan byte-identical under `--no-state`, blocked/batched/launched/summary match the GraphQL ground truth · `fb14e7d9`.
- **P6/P7** — 2026-11-07, skill + references + registration + docs surfaces + changeset + regenerated projection; normative-drift 21 pass / 0 fail, budgets PASS, skill-lint PASS, skills CLI discovers the skill · `a38ddf03`.
- **E6** — 2026-11-07, P8 foreground verification run (final commit): `bun test scripts/batch-scheduler.test.mjs` · exit 0 · 21 pass / 0 fail (O1–O13).
- **E7** — 2026-11-07, O10: `rg -n 'fetch\(|embedding|decideWorkflow' scripts/batch-scheduler.mjs` (comment lines excluded) · exit 1 — no match. O11: `rg -n 'spawn\(|execFile\(|worktree add|gh pr|gh run'` minus `spawnSync` · exit 1 — clean; the only child processes are `gh`/`git` reads. O12: `roadmapTableRows`/`readRoadmapIndex` imported from the shared `index-document.mjs` (lines 39/274/282).
- **E8** — 2026-11-07, O15: `cd packages/agentic-workflow-schema && bun run test` · exit 0 · 771 pass / 0 fail. O20: `bun test scripts/workflow-status-{compact,pre-execution} scripts/workflow-docs-index scripts/index-document` · exit 0 · 32 pass / 0 fail.
- **E9** — 2026-11-07, O17: `bun scripts/check-skill-context.mjs` · exit 0 · PASS, 29 skills; `npx skills add . --list` lists batch-scheduler. O16: `rg -n '#449' docs/ROADMAP.md` matches the Fixes row (line 163).
- **E10** — 2026-11-07, O18: `bun test scripts/normative-drift.test.mjs` · exit 0 · 21 pass / 0 fail (after the pinned literal 13→14 update, D-recorded).
- **E11** — 2026-11-07, full gate: `bun scripts/local-gate.mjs --no-bail` · 9/12 steps exit 0 (docs-generated-projection, version-parity-content, workspace-install, dependency-pin-gate, schema-build, dependency-advisories, pi-node-compat, pi-compat-guard, normative-relevant checks); **3 steps red — root-suite, crate-suite-node, crate-suite-bun — all solely the pre-existing S15 fragment failure (PE-017, identical at base)**; 1 dependent step skipped (schema-node-compat). `bun scripts/local-gate.mjs` (bail) reaches the same single root cause.
- **E12** — 2026-11-07, P5 determinism/differential receipts: scratch clone, two live runs with `--no-state` byte-identical (`cmp` clean); with state, run 2 marks 28 claimed issues (53 lane rows); differential of the touched shared-parser suites at the base archive shows the identical fail set (the 3 forge-timeout tests in `workflow-status-sensor.test.mjs` fail at `b8b1d814` too — environmental, not a regression).
- **E13** — 2026-11-07, P8 second gate pass after two more findings the run surfaced: (a) the guide's pinned machine-region count moved 111 → 115 with the five new inventory rows — `SKILL_CONTEXT_BUDGETS.json` re-pinned at the measured value (exact pin, sources entry added, PE-014's manifest mechanics); (b) `prose-gate-inventory` refused the four undeclared surface ids — `docs/workflow/GATE_INVENTORY.md`'s `normative-surface-grammar` row now claims them. Then: `bun scripts/local-gate.mjs` · exit 0 · **PASS — 12/12 steps**.
- **E14** — 2026-11-07, the journal-fragment repair (out-of-unit, disclosed): `git mv` of the `…-manual.md` fragment to `…-narrative-local.md` per fix-432's recorded Next line · `2e3e81e5`; `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` · exit 0 · 11 pass / 0 fail; the gate's three crate/root-suite steps green since.
- **P8** — 2026-11-07, obligations ledger closed (all 20 rows verified below), pi package README catalogue row added (AC15), GATE_INVENTORY claim + budget re-pin, session journal fragment written · `92e54baa`.
- **E15** — 2026-11-07, the legitimacy pass S1 asks for first: every external-verify blocker reproduced before any implementation. The eight frozen reproducers were observed **red** (`scripts/batch-scheduler.test.mjs`: `B3` tree-root lane split, `B3` wildcard key, `B3` body fallback, `B4` in-flight blocker as `cycle`, `B5` in-flight soft target as orphan, `B6` `--no-state`+`--mark-launched` write, `B8` `--remote` inert; package: `the committed projection ships`), and the three command-level ones re-ran at the bound head (`bun scripts/roadmap-settle.mjs` exit 1 / 2 violations; `README.md:29` 28/13/27 against a 29/14/28 tree; `bun test test/journal.surfaces.test.mjs` 10 pass / 1 fail with the `…-session-log.md` fragment). All 11 held — none refuted, so all 11 are corrected.
- **E16** — 2026-11-07, P9: `bun test scripts/batch-scheduler.test.mjs` · exit 0 · 28 pass / 0 fail (O21–O25) · `b8eb69e8`.
- **E17** — 2026-11-07, P10: `cd packages/agentic-workflow-schema && bun run test` · exit 0 · 772 pass / 0 fail, including `batch-plan: the committed projection ships with the package` (O26) and the family gate `files and exports agree on the shipped schema documents`, which refused the half-fix until `exports` carried the projection too · `c120b4a3`.
- **E18** — 2026-11-07, P11 (O28): `rg -c '29 source skills \(14 user-facing' README.md` · 1; `npx skills add . --list` · "Found 28 skills" (the tree's 29 minus the repo-only `skill-lint`).
- **E19** — 2026-11-07, P12 (O29): `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` · exit 0 · 11 pass / 0 fail (S15 green with `…-narrative-session-log.md`); `bun scripts/roadmap-settle.mjs` · exit 0 · `verdict: PASS`, 0 violations · `a2836adb`.
- **E20** — 2026-11-07, P13 + recheck (O27): the live-path fixture, a `mktemp -d` copy of the worktree (removed after; never the live tree): live forge run · exit 0 · 28 open issues, `degraded: []`, every lane key inside the documented set (no `skills/`, no `skills/**`), `#284` root declaration serialized into each declared skills lane, no `cycle` finding, 72 lane rows / 27 claimed on the re-run, two `--no-state` runs byte-identical. Then `bun scripts/local-gate.mjs` · exit 0 · **PASS — 12/12 steps** (155 s) at `a2836adb`.
- **E21** — 2026-11-07, the second batch's legitimacy pass (S1): every remaining finding reproduced first — A1's narration said "five rows / four schema-export" where `AGENTS.md` gained four rows (one table, three schema-export); A2's prompt said "16 user-facing + 13 internal" against a 14 + 15 tree; A3's catalogue row sat between `/discover-repository-state` and `/execute-phase` and the table itself broke order at `triage-issue`; A5's `batch-fields@1` declared `issue | reason` and no nested field; X1 reproduced in a scratch clone with `git mv` staged (`bun test scripts/version-parity-gate.test.mjs` → 50 pass / 1 fail). The reported fragment-writer finding was closed by evidence, not code: the carrier already refuses an unparseable kind three ways (PE-024).
- **E22** — 2026-11-07, P14 (O30): `bun test scripts/batch-scheduler.test.mjs` · exit 0 · 28 pass / 0 fail (the nested `reason.kind` / `reason.detail` pin; RED before the grammar rows and the `BATCH_PLAN_FIELDS` name); `cd packages/agentic-workflow-schema && bun run test` · exit 0 · 772 pass / 0 fail.
- **E23** — 2026-11-07, P15 (O31): the reproducer clone with a staged rename — before the fix 50 pass / 1 fail, after it 52 pass / 0 fail. The suite in the live tree: `bun test scripts/version-parity-gate.test.mjs` · exit 0 · 52 pass / 0 fail (the dirty list now reads the same `-z` form the producer does, and `porcelainPaths` pins both sides of a rename).
- **E24** — 2026-11-07, P16/P17 (O32, O33): `bun scripts/check-skill-context.mjs --documents` · exit 0 · PASS (4 budgeted documents); `rg -U -c '14\s+user-facing skills \+ 15 internal steps' docs/workflow/PORTABLE_PROMPT.md` · 1; `rg -o '^\| ./[a-z-]+.' packages/pi-agentic-workflow/README.md | LC_ALL=C sort -c` · exit 0 (the catalogue's own order, `triage-issue` included).
- **E25** — 2026-11-07, the second batch's full gate and push: `bun scripts/local-gate.mjs` · exit 0 · **PASS — 12/12 steps** (174 s) at `9e154829`; the branch is pushed to `origin/feat/449-batch-scheduler-sensor` (fast-forward from `7d6dacf5`, no history rewritten).
- **P9** — 2026-11-07, branch pushed (pre-push offline gate PASS; one transient `schema-node-compat` red on the first hook run, green on re-run and standalone) and PR #454 opened with `Closes #449` · PR [454](https://github.com/gtrabanco/agentic-workflow/pull/454).

## Next

External verification by the owner (§8 of the application workflow — the diff
is the handoff; nothing is self-approved) on
[PR #454](https://github.com/gtrabanco/agentic-workflow/pull/454).

## References

- Issue #449 (this unit), #442 (issue-relationships contract — dependency
  semantics), #444 (decision substrate — optional signal layer over this
  deterministic half), #295 (panel consumer).
- PR #454 — <https://github.com/gtrabanco/agentic-workflow/pull/454>.
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
