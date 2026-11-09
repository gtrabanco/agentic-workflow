# 460 — external verify receipt

First (and full) external verification of this unit — no prior `EXTERNAL VERIFY`
block or review verdict existed for it at bind time (PR #475 carried no review),
so this is the full verdict, once.

Bound state: unit dir `docs/fix/460-batch-scheduler-verification/` · base
`origin/main` at bind time `f24b726f` (also the PR's merge-base) · head
`a7f7fd16`. Mid-run disclosure: `origin/main` advanced to `fc62c03f` during this
verification (issue #468's PR #469 merged); `merge-base` is unchanged and the
batch-scheduler surface is byte-identical across both candidate bases
(`git diff --stat f24b726f fc62c03f -- scripts/batch-scheduler.*
packages/agentic-workflow-schema skills/batch-scheduler` → empty), so every
base-side proof below holds for either.

```text
EXTERNAL VERIFY — base: f24b726fa155ba536ba1f9906668a83f201df86f · head: a7f7fd16ea49804cf319d29067362fbb88bdf06c
Blockers: 7 —
  1. docs/fix/460-batch-scheduler-verification/planning-obligations.md:25 (O14) — reproducer: `bun scripts/local-gate.mjs` → exit 1, FAILED at root-suite; `bun scripts/run-root-suite.mjs` → exit 1, 92 suites, 91 PASS, single FAIL `scripts/log-immutability.test.mjs`. Base-vs-head: at `f24b726f` the identical test blob (481a8b71) fails the same way — `git archive f24b726f` scratch: `bun test scripts/log-immutability.test.mjs` → 0 pass / 1 fail / 1 error (`Cannot find module './log-immutability.mjs'`), module absent at base and at head — so the red is base-caused, but the obligation ships with status `open` (off-vocabulary per LEDGERS.md — `planned|in-progress|verified|n/a|deferred`, "every row is verified before the unit ships") and its validator does not reproduce green here. Smallest action: integrate `main` (now `fc62c03f`, which carries #468's implementation), re-run `bun scripts/local-gate.mjs` green, mark O14 `verified` with that evidence — or the owner amends the row with a legal status naming the out-of-unit cause. Route: /aw-local-apply.
  2. planning-obligations.md:15 (O4) + SPEC.md:216 (P5) — a `verified` obligation whose stated outcome does not reproduce: both assert "`idea` (and `defined`/missing, per D3) → marks untriaged". Reproducer: differential fixture — open issue with NO roadmap `## Fixes` row → head emits `reason.kind: satisfied-inputs` and no `triaged` field (identical to base); `isTriaged(undefined)` returns true (scripts/batch-scheduler.mjs:284), i.e. a missing row carries no signal, exactly as the unit's own D4 (SPEC `## Log`) corrected D3 before implementation. O4/P5 still carry the superseded D3 clause. Smallest action: reconcile the two clauses to D4 (owner-authorized ledger amendment + task-text fix); no code change.
  3. scripts/batch-scheduler.mjs:6 — reproducer: `rg -n 'batch-plan@1' scripts/batch-scheduler.mjs` → line 6 ("emits the fixed `batch-plan@1` document"). Base-vs-head: true at base (envelope was @1); at head `plan.schema = 'batch-plan@2'` (script :549-550, suite green on @2) — surviving mention asserting the old contract. Smallest action: token → `batch-plan@2`.
  4. scripts/batch-scheduler.mjs:850 — reproducer: same grep → line 850: the exit-1 output `BATCH-PLAN REJECTED — the produced document violates batch-plan@1` while `validateBatchPlan` enforces `batch-plan@2` (the schema runtime's `BATCH_PLAN_SCHEMA`); it also contradicts `skills/batch-scheduler/references/PLAN.md` ("failed its own `batch-plan@2` validation"). Base-vs-head: the message matched the @1 validator at base; at head it names a contract the document no longer carries. Smallest action: emit `batch-plan@2` (or interpolate `BATCH_PLAN_SCHEMA`).
  5. packages/agentic-workflow-schema/src/batch-plan.ts:2 — reproducer: `rg -n 'batch-plan@1' packages/agentic-workflow-schema/src/batch-plan.ts` → line 2, module header "The canonical batch plan (`batch-plan@1`)" in the very module that publishes `BATCH_PLAN_SCHEMA = "batch-plan@2"` (line 25). Base-vs-head: true at base, false at head. Smallest action: token → `batch-plan@2`.
  6. packages/agentic-workflow-schema/src/batch-plan.ts:212 — reproducer: same grep → line 212, `validateBatchPlan` JSDoc "Validate one document against `batch-plan@1`" while the validator enforces @2. Base-vs-head: as above. Smallest action: token → `batch-plan@2`.
  7. packages/agentic-workflow-schema/test/batch-plan.test.mjs:9 — reproducer: `rg -n 'batch-plan@1' packages/agentic-workflow-schema/test/batch-plan.test.mjs` → line 9, corpus header "One versioned document. `batch-plan@1`" in the file that asserts `BATCH_PLAN_VERSION === 2` (line ~122). Base-vs-head: true at base, false at head. Smallest action: token → `batch-plan@2` (line 234's `m.schema = "batch-plan@1"` is the intentional wrong-value refusal vector, not a survivor).
Advisories: 4 —
  1. scripts/batch-scheduler.mjs:283 — `isTriaged` exact-membership match misreads the roadmap's own canonical `done · [#475]` status cell (docs/ROADMAP.md:175, written by this change) as untriaged, contradicting Decision D3 ("planned/in-progress/done are triaged"). Reproduced in the differential fixture: an open issue with status `done · [#999]` flips `satisfied-inputs` → `untriaged` + `triaged:false` at head, unchanged at base. Why advisory: manifesting it requires an open `done ·`-row issue with no unit folder, and under the repo's own conventions `done` ⇒ unit doc ⇒ `launched` ⇒ excluded from every lane (the live #460 row is launched), so no observable wrong output exists on any convention-following state today; the misclassification is latent. Smallest action: strip the ` · …` annotation before the allow-list check and pin `done · [#999]` in a T2 test.
  2. .changeset/feat-449-batch-scheduler-sensor-fix-scripts-batch-scheduler-live-path-findings-from-the-scratch-fixture-run.md:6 — the pending changeset still narrates "as the batch-plan@1 machine envelope (#449)" and will publish in the same cut as #460's `batch-plan@2` intent. Why advisory: PR-scoped historical narration of #449's own delivery (same class as the #449 SPEC and LOGS history entries), not a present-tense claim about the head tree. Flagged so it can be folded at cut.
  3. scripts/log-immutability.test.mjs — the gate red's root cause: its sibling `scripts/log-immutability.mjs` is absent at the bound base `f24b726f`, and the failing run is identical at base and at head (same blob 481a8b71, same module-not-found). Base-caused defect → advisory per the base rule; its ledger consequence is blocker 1 (counted once, not twice). Note: #468's implementation landed on `origin/main` as `fc62c03f` mid-run — the suite passes 18/18 there.
  4. scripts/batch-scheduler.mjs:838 — `--no-state` forces `previous = null`, so every `--no-state` run reports ALL open issues in `new_issues[]` and `closed_since: []`, permanently; PLAN.md documents only the pre-v2-state case of that shape. Why advisory: honest by construction (no persisted memory → everything is first-seen), no previously-correct output was silently changed; it is a declaration gap. Smallest action: one sentence in PLAN.md's `new_issues[]`/`--no-state` rows.
Sibling sweep: list — blocking survivors of the `batch-plan@1` → `@2` rewrite: scripts/batch-scheduler.mjs:6, :850; packages/agentic-workflow-schema/src/batch-plan.ts:2, :212; packages/agentic-workflow-schema/test/batch-plan.test.mjs:9 (blockers 3–7); surviving superseded D3 clause: SPEC.md:216 (P5) + planning-obligations.md:15 (O4) (blocker 2). Not survivors — history or negative vectors: SPEC.md:33,36 (D1's own quote of the issue token), docs/fix/449-batch-scheduler-sensor/SPEC.md:118,277, docs/LOGS.md:5058,5065,5329, batch-plan.test.mjs:234 (wrong-value refusal vector), .changeset/feat-449-…:6 (advisory 2). No stale state-shape, reason-kind, fail-open, or manifest narrations elsewhere: README.md, docs/workflow/SKILLS.md, PLAN.md, SKILL.md, `.claude-plugin`, `skills.sh.json` all carry `batch-plan@2` and the v2 fields consistently.
Completeness: S1–S6 resolved — every S# has `(Implements:)` tasks whose validators re-ran green here (P1 `ls` ✓ three ledger files; P2 red at `23e545ad` → green at head ✓; P3 package suite ✓; P4 `L1` ✓; P5 `T2` ✓; P6 `D3` ✓; P7 `P4` ✓; P8 normative-drift ✓ + context budgets ✓) — except P9's `bun scripts/local-gate.mjs` validator, which is red (recorded dated disposition: SPEC `## Log` G1 + `## Next`, 2026-11-09) and is blocker 1 (O14).
Spot check: bun scripts/roadmap-settle.mjs → match (exit 0 · 159 unit docs checked · 0 violations — equals reported E6)
Verdict: NEEDS-DECISION (7 open blockers: O14; O4/P5; scripts/batch-scheduler.mjs:6; scripts/batch-scheduler.mjs:850; packages/agentic-workflow-schema/src/batch-plan.ts:2; packages/agentic-workflow-schema/src/batch-plan.ts:212; packages/agentic-workflow-schema/test/batch-plan.test.mjs:9)
```

## Annex — commands run and observed results (2026-11-09)

| command | observed |
|---|---|
| `bun test scripts/batch-scheduler.test.mjs` | exit 0 · 40 pass / 0 fail (= reported E3) |
| `cd packages/agentic-workflow-schema && bun run test` | exit 0 · 776 pass / 0 fail (= E3) |
| `cd packages/agentic-workflow-schema && bun run test:node` | exit 0 (the gate step `schema-node-compat` skips only as the red root-suite's dependent) |
| `bun test scripts/normative-drift.test.mjs` | exit 0 · 21 pass (= E4) |
| `bun scripts/check-skill-context.mjs` | exit 0 · PASS context budgets: 29 skills (= E4) |
| `bun scripts/roadmap-settle.mjs` | exit 0 · 159 unit docs · 0 violations (= E6; the §3 spot check) |
| `bun scripts/local-gate.mjs` | exit 1 · FAILED at root-suite; every other step result exit 0 (12 steps; default bail additionally killed 3 in-flight suites that pass standalone: lane-era-lineage 23, ledger-provenance 27, local-gate 42) |
| `bun scripts/local-gate.mjs --no-bail` | exit 1 · root-suite only; 1 dependent step skipped (`schema-node-compat`, green standalone) |
| `bun scripts/run-root-suite.mjs` | exit 1 · 92 suites · 91 PASS · 1 FAIL (`scripts/log-immutability.test.mjs`) |
| red-first (scratch `git archive 23e545ad`, symlinked `node_modules`, `tsc` built in place) | script suite exit 1 · 9 fail / 31 pass (= E2); package suite exit 1 · 4 fail / 772 pass (= E2) |
| base baseline (scratch `git archive f24b726f` / `fc62c03f` — identical batch-scheduler bytes) | script suite exit 0 · 28 pass (= E1); package suite exit 0 · 775 pass (= E1) |
| base-side gate red proof (`git archive f24b726f` scratch) | `bun test scripts/log-immutability.test.mjs` → 0 pass / 1 fail / 1 error — same as head |
| differential, identical fixtures, base module vs head module (`buildBatchPlan` + `updateState`, scratch roots) | standing fixture: declared deltas only — `version` 1→2, `schema` →`batch-plan@2`, `new_issues: []`, `closed_since: []`, state `version` + `seen`; every batch/lane/reason/detail/finding/summary/claimed byte-identical. Feature fixture: declared S2–S5 deltas only (`untriaged`, `triaged: false`, `soft-deps-open` naming dep + batch, declared degradation `unavailable-prose-dependencies-issue-307-undeclared-table-shape` + false findings removed) plus the advisory-1 `done ·` flip; nothing else moved |
| live-tree guard | `git status --porcelain` byte-identical before/after; `.agentic-workflow/` untouched; the change's own script ran only through its suites against `mktemp` `--root` fixtures and through pure-function harnesses over scratch roots; no forge/network call executed |

Correction bound per the verify contract: findings above are reported only —
reproducers and smallest actions are named for `/aw-local-apply`, which owns
every correction.
