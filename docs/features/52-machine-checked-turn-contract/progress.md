# Progress — 52-machine-checked-turn-contract

Ledger of stage receipts and gate traces for this unit. One receipt per review.

## Pre-execution review receipts

### spec — 2026-09-16

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-52-20260916-1 · Snapshot: a768d95cb498656aeea9d46c7b9bf41110a3bdb6732ed69ee068abb2b850536b · Verdict: spec-review-pass
- Unit: 52-machine-checked-turn-contract · Stage: spec · Unit kind: feature · Parent: null
- Source revision: fc9bfa011baaae7c42ad29812ce111af1983bbff · Artifact revision: fc9bfa011baaae7c42ad29812ce111af1983bbff
- Reviewer: review-spec · Session: 01a0a93b-037f-7302-a9d2-ce6284cff2b0 · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-16T08:00:12Z/2026-09-16T08:20:03Z · Findings: 1 (material open: 0)
```

Snapshot built by `scripts/pre-execution-snapshot.mjs build --stage spec --unit
52-machine-checked-turn-contract` (in-repo canonical serializer; the
`@gtrabanco/agentic-workflow-schema` package is not installed locally, so the
structural contract used is the repo's own `pre-execution-contract.mjs`).
Findings rows for this snapshot: `planning-findings.md` (`SPEC52-F1`).

### plan — 2026-09-16

```text
## Pre-execution review receipt v1 — plan
- Review: plan-review-52-20260916-1 · Snapshot: 53a3868b57598ff65bd03b686ef792e3bf13d5a584d6eb22d349a70169daf9f3 · Verdict: plan-review-fail
- Unit: 52-machine-checked-turn-contract · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: a768d95cb498656aeea9d46c7b9bf41110a3bdb6732ed69ee068abb2b850536b · Parent Product receipt: spec-review-52-20260916-1
- Source revision: 8bbc5eb27c5ea4459c183abe872369b14966531e · Artifact revision: 8bbc5eb27c5ea4459c183abe872369b14966531e
- Reviewer: review-plan · Session: 01a0a9ea-def6-7302-a9d2-ce691c3632ac · Role: reviewer · Author: plan-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-16T11:20:39Z/2026-09-16T11:29:07Z · Findings: 6 (material open: 4)
- Ledgers read: planning-evidence 16 rows · obligations 14 rows (verified-capable: 13 — O1's validator cannot fail, PLAN52-F1)
- Prior plan receipt (re-review only): none — first cycle
```

Snapshot built by `scripts/pre-execution-snapshot.mjs build --stage plan --unit
52-machine-checked-turn-contract --parent a768d95cb498656aeea9d46c7b9bf41110a3bdb6732ed69ee068abb2b850536b`
(the `@gtrabanco/agentic-workflow-schema` package resolved from the in-repo
`packages/agentic-workflow-schema/dist`, as in the spec review). The builder
records no artifact-revision-rotation surface, so `artifactRevisionId`
auto-fills from HEAD; the planner's handoff label for this plan set is
`52-plan-1` (SPEC/PLAN/TASKS/ledger headers) — mutate-and-revert detection
rides that handoff. Parent lineage verified, not copied: the spec-stage snapshot rebuilt at source
revision `fc9bfa01` reproduces `a768d95c…` exactly, and the SPEC Product half
is byte-identical between `fc9bfa01` and `8bbc5eb2` (single diff hunk;
Engineering-half placeholder → Engineering half only). Phase-lint re-run over
`TASKS.md` at this revision reproduces the SPEC's recorded fingerprints
(P1/P2/P3 PASS 8/8, verdict PASS, fingerprint `e3c2aec7…`). Falsification
stance before the check table: CONFIRMED-GAPS (`PLAN52-F1`, `PLAN52-F2`).
Findings rows for this snapshot: `planning-findings.md` (`PLAN52-F1`…`PLAN52-F6`).

### plan — 2026-09-16 · plan set `52-plan-2` (re-review)

```text
## Pre-execution review receipt v1 — plan
- Review: plan-review-52-20260916-2 · Snapshot: 1a929fa77447b16d362a9cadd512d0e8d683df05c5a10a042a64484508fa923f · Verdict: plan-review-pass
- Unit: 52-machine-checked-turn-contract · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: a768d95cb498656aeea9d46c7b9bf41110a3bdb6732ed69ee068abb2b850536b · Parent Product receipt: spec-review-52-20260916-1
- Source revision: 83789d486606de1abe7106f51bbf276a95c7119b · Artifact revision: 83789d486606de1abe7106f51bbf276a95c7119b
- Reviewer: review-plan · Session: 01a0aa27-1f49-7302-a9d2-ce709b3a32a4 · Role: reviewer · Author: plan-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-16T12:18:05Z/2026-09-16T12:38:00Z · Findings: 2 (material open: 0)
- Ledgers read: planning-evidence 16 rows · obligations 16 rows (verified-capable: 16)
- Prior plan receipt (re-review only): plan-review-52-20260916-1 @ 53a3868b57598ff65bd03b686ef792e3bf13d5a584d6eb22d349a70169daf9f3
```

Snapshot built by `scripts/pre-execution-snapshot.mjs build --stage plan --unit
52-machine-checked-turn-contract --parent a768d95cb498656aeea9d46c7b9bf41110a3bdb6732ed69ee068abb2b850536b`
at source revision `83789d48` (the committed repair batch, plan set `52-plan-2`);
the builder records no artifact-revision-rotation surface, so `artifactRevisionId`
auto-fills from HEAD and mutate-and-revert detection rides the planner's handoff
label `52-plan-2` (SPEC/PLAN/TASKS/ledger headers).
Parent lineage re-verified, not copied: the spec-stage snapshot rebuilt at source
revision `fc9bfa01` (temp `git worktree` passed via `--root`) reproduces
`a768d95c…` exactly, and the SPEC Product half is byte-identical between
`fc9bfa01` and HEAD (whole-file delta is the single Engineering-half hunk at
line 454 — the repair batch's placeholder→Engineering-half content). Phase-lint
re-run over `TASKS.md` reproduces the SPEC's recorded trace (P1/P2/P3 PASS 8/8,
verdict PASS, fingerprint `2c7d8179…` — P1's `:7` task count is the PLAN52-F3
regression task, present in TASKS.md).
Repair-batch verification (PLAN52-F1…F5): F1's repeated `-e` grep is
semantically equivalent to SPEC AC12's unescaped alternation and fail-capable
(any token in the shim matches → non-empty output ≠ "no matches"); F2's O15
owns AC10 end to end (echo clause + sensor-suite regression); F3's O3 P1 leg
runs `check-skill-context.mjs` after the profile section lands; F4's box2 codes
(`acceptance-missing`, `phase-lint-failed`) are named in O7/TASKS P2/testing.md
(engine-only per ED-52-3); F5's O16 validators pre-verified against the current
`packages/agentic-workflow/package.json` (`grep -ic dependenc` → 0,
`grep -c '"private": true'` → 1 — both re-run by this review).
Standing suites green at this revision: `normative-drift.test.mjs` 17/17,
`workflow-status-sensor.test.mjs` 56/56 (PE-009/PE-002 empirically confirmed).
Falsification stance before the check table: NO-CONFIRMED-GAPS (probes: PE-002
`workflow-status.mjs:922`/`:1270`, PE-006/O16 greps, PE-009 precedent rows
`CLAUDE.md:327-328` + green suite, PE-015 six skills grep, PE-012 node-compat
job, `orchestration-envelope` version `2.0.2` at `SKILL.md:4`, O4 baseline
`machine-check` count 0/0, AC14 baseline only this unit's records).
Environment note: the review ran on a tree carrying pre-existing uncommitted
cross-unit bytes (`docs/features/ROADMAP.md` consolidation edits folding
48/55 → new feature 59, and the untracked `docs/features/59-executable-continuations-fixture/`
design folder) — none belong to plan set `52-plan-2`, none are part of the
snapshot, and this review wrote to no reviewed artifact (appends to
`progress.md`/`planning-findings.md` are evidence, per contract).
Findings rows for this snapshot: `planning-findings.md`
(`PLAN52-F7`, `PLAN52-F8` — both info/class product, repair rides the next
SPEC-touching design turn alongside `PLAN52-F6`).

## Acceptance receipt v1
- Manifest: docs/features/52-machine-checked-turn-contract/ACCEPTANCE.md · Blob: e3bfd8fffbdf6035cb552a197204c92c5c9d170d · Status: frozen · Verified: 2026-09-16

## Dependency receipt v1
- Fingerprint: 963f208fc252807a04d84f0971c4961e8ede8a96 · Closure: 52-machine-checked-turn-contract ← (none — SPEC hard deps: none)
- Merged PRs: none required · Fully merged: yes · Verified: 2026-09-16

## Gate receipts (2026-09-16, whole-unit entry)
- Branch: `feat/52-machine-checked-turn-contract` (not `main`) — `git branch --show-current`.
- Own-status: roadmap row 52 = `planned` → proceed.
- Pre-execution review: plan receipt `plan-review-52-20260916-2` @ `1a929fa77447b16d362a9cadd512d0e8d683df05c5a10a042a64484508fa923f` — `scripts/pre-execution-snapshot.mjs verify --stage plan` → `current: true, digestMatches: true, verdictIsPass: true`.
- Acceptance manifest: blob `e3bfd8fffbdf6035cb552a197204c92c5c9d170d` recorded above (baseline for the whole unit).
- Phase-lint at entry: P1/P2/P3 PASS (8/8) · verdict PASS · fingerprint `2c7d8179e6598cec42870674f000b1802d7270c977cc5d160f6150204bb7db05`.
- Implementation discovery: `READY` (map-52-p1-20260916) — seven questions closed, falsification probes green (`test-command-guard.sh` exit 0, `normative-drift.test.mjs` 17/17).

## P1 gate (2026-09-16)
- `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` → exit 0 (PASS turn contract: 18 cases)
- `node --test scripts/normative-drift.test.mjs` → exit 0 (17/17 — the new `turn-contract-receipt@1` block and `CLAUDE.md` row both parse)
- `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 (56/56 — AC10/O15)
- `bun scripts/check-skill-context.mjs` → exit 0 (PASS context budgets: 40 skills — O3)
- `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → exit 0 (7/7 — O5, mirror byte-identical)
- `grep -n -e node -e bun -e npm -e npx template/.agentic-workflow/hooks/turn-contract.sh` → no matches, exit 1 (AC12)
- `grep -c machine-check docs/workflow/ORCHESTRATION.md docs/workflow/FEATURE_WORKFLOW.md` → 1 each (O4)

## P1 — 2026-09-16
- Done: machine-check receipt surface — scaffold shim + hook suite (18 cases) + `## Machine-check profile` and `turn-contract-receipt@1` in `TURN_CONTRACT.md` + `CLAUDE.md` normative-surfaces row + `orchestration-envelope` 2.1.0 release + pi mirror re-bundle + one profile pointer each in `ORCHESTRATION.md` and `FEATURE_WORKFLOW.md`
- Remains: P2 (crate engine + engine/parity/grammar-conformance suites), P3 (hardening & PR)
- Gotchas: box4 maps a nonzero `gh pr view` exit to `pr-unreachable` and an absent/empty/non-`OPEN` state to `pr-not-open` (ED-52-6); the shim never emits `phase-lint-failed` (ED-52-3); the shim's `--help` output is frozen byte-for-byte by its hook suite; pre-existing cross-unit feature-59 design bytes found uncommitted in this worktree were relocated to the `feat/59` worktree before P1 (repo hygiene, not this unit's scope)
- Files: template/.agentic-workflow/hooks/turn-contract.sh, template/.agentic-workflow/hooks/tests/test-turn-contract.sh, skills/orchestration-envelope/SKILL.md, skills/orchestration-envelope/references/TURN_CONTRACT.md, CLAUDE.md, CHANGELOG.md, docs/workflow/ORCHESTRATION.md, docs/workflow/FEATURE_WORKFLOW.md, packages/pi-agentic-workflow/skills/orchestration-envelope/SKILL.md, packages/pi-agentic-workflow/skills/orchestration-envelope/references/TURN_CONTRACT.md
- Next: P2 — Implement the turn-contract verifier engine
