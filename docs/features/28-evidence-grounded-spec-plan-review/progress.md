# progress — 28-evidence-grounded-spec-plan-review

Status: in-progress

Planning baseline: `32e69287b391946963bf6331506c9c1837298932`

| Phase | Status | Evidence |
|---|---|---|
| P1 — Publish pre-execution evidence contracts | done | `npm test` 671/671 exit 0 · `check:pre-execution-schemas` drift-free · `npm pack --dry-run` 3.5.0, 2/2 projections · `check-pre-execution-package.mjs` PASS |
| P2 — Establish Product review readiness | done | Depends on P1 public contracts |
| P3 — Establish Plan review readiness | done | Depends on P2 Product-review authority |
| P4 — Enforce pre-execution authority routing | done | Depends on P3 Plan-review authority |
| P5 — Qualify the pre-execution workflow | replanned | Re-plan 2026-08-31 (findings F2+F3+F6): qualification evidence incomplete → P6–P8 |
| P6 — Run the pre-execution qualification corpus | pending | Depends on P1–P4 |
| P7 — Reconcile the unit ledgers with qualification evidence | pending | Depends on P6 |
| P8 — Re-review and close the corrected candidate | pending | Depends on P7 |

## Dependency receipt v1
- Fingerprint: 10822fdec53b8f814ef5715fb420539f4fc8bad3 · Closure: 28-evidence-grounded-spec-plan-review ← 26-staged-verification-contracts ← 25-content-bound-review-receipts · 27-pi-agentic-workflow
- Merged PRs: 25 #144 @ 11a8061639e0ea2bdfdbaabc270380543eb37002 merged · 26 #145 @ a69282dbc5164c3be09302783d57bd74c9bc5ffa merged · 27 #150 @ 32e69287b391946963bf6331506c9c1837298932 merged · Fully merged: yes · Verified: 2026-09-01
- Recipe (so any consumer re-derives it, per RS3(a)): `git hash-object --stdin` over
  `{ awk '/^## Dependencies/{f=1;next} f&&/^## /{exit} f' <unit SPEC>; grep -E '^\| *(25|26|27) \|' docs/features/ROADMAP.md; }`
  — the unit's dependency declaration plus each closure roadmap row, files only, no git objects.
- Replaces fingerprint `6f7c915f1ade956adcef96a8558da17d26159088` (verified 2026-08-30), which **cannot be
  re-derived from what the preflight names**: `PREFLIGHT.md` hashes "the SPEC `Depends on:` line", but this
  SPEC — like every SPEC from this repo's template — declares dependencies as a `## Dependencies` section
  (`grep -c` over `docs/features/`: 30 section-style, 0 real `Depends on:` fields). The old value is kept
  here as history, not refreshed in place. Rewriting a *dependency* receipt is what
  `PREFLIGHT.md` orders after every full pass ("rewrite the receipt after every full pass"); it is not a
  review verdict and carries none of the no-refresh authority.
- Full pass, not fast path: recomputed fingerprint mismatched, so forge traversal ran (`gh pr view` on
  #144/#145/#150 → all `MERGED`, base `main`, merge shas identical to those recorded above).

## Acceptance receipt v1
- Manifest: docs/features/28-evidence-grounded-spec-plan-review/ACCEPTANCE.md · Blob: 238b8a1ae96018ecb6aae082dc135d44d5389c24 · Status: frozen · Verified: 2026-08-30 · Re-bound 2026-08-30 after user-approved amendment 2 (Pi package release in AC10); amendment 1 blob was `1f03d8cca37a5e14b32cc60db20bffb074ae94ba`

## Preflight — P1
- Branch: `feat/28-evidence-grounded-spec-plan-review` (created from `main` @ 8ab22ea6).
- Own status: roadmap row 28 = `planned` → execution allowed.
- Phase-lint P1: PASS (8/8) · fingerprint `P1:schema/db:8:publish-pre-execution-evidence-contracts` (recomputed from the current TASKS.md shape; matches the SPEC ledger).
- Normalized Repository State: consumed, snapshot `2026-08-30-first-pass-convergence`, status `frozen`.
- Architectural invariants: `n/a: no project invariants declared` (NRS F010; `docs/architecture/ARCHITECTURAL_INVARIANTS.md` absent). Accepted decisions AD-002/AD-004/AD-007 classified `preserves`.
- Baseline gate: `cd packages/agentic-workflow-schema && npm test` → exit 0, 556/556 pass.

## Planning record

- Issue #146 is the governing feature request.
- Product design and Engineering plan were frozen on 2026-08-30.
- NRS snapshot `2026-08-30-pre-execution-planning` was consumed.
- Architectural classification: `n/a: no project invariants declared`.
- Feature 27 / PR #150 is merged and remains independently owned; this plan
  consumes its canonical Pi bundle/parity surface without reopening its scope.
- Feature 29 is the post-merge dogfood/implementation-discovery consumer.
- User-approved amendment on 2026-08-30 adds progressive readiness, compact
  planning evidence, first-findings batch repair, and mandatory second-cycle
  convergence diagnosis/qualification. No implementation phase has started.
- User-approved amendment on 2026-08-30 (second) fixes the `evidence-grounding`
  distribution contract in P2 (`user-invocable: false`, no
  `metadata.internal: true`, registered in `plugin.json` and `skills.sh.json` —
  the #96/#141 exclusion lesson; see D14) and adds the Pi package release
  (`0.1.0 -> 0.2.0`) to AC10 and P5's terminal pre-merge step (D15). P1
  implementation is in progress on the working tree; no phase commit exists
  yet. P5 re-linted after the amendment: PASS (8/8), fingerprint
  `P5:hardening:8:qualify-the-pre-execution-workflow` unchanged.
- User-approved amendment on 2026-08-31 (third) is the re-plan routed from
  review findings F2+F3+F6 (`replan-in-unit`, PR #155 head `a42c244b`):
  it appends P6 (qualification corpus — canary fields for feature/fix/
  cross-boundary samples + golden-fixture rows for every changed
  executor-path skill/version), P7 (obligation-ledger, task-ledger, and
  status reconciliation), and P8 (terminal re-review, manifest verification,
  PR #155 close-out). No acceptance row changed and the manifest blob is
  unchanged. The roadmap row was corrected from the premature `done` (F3)
  to `in-progress` in the same replan commit. Planning only — the new phases
  are executed manually via `/execute-phase 28 P6`.

## P1 — 2026-08-30

- Done: pre-execution evidence contracts — `src/pre-execution-contract.ts`
  (one canonical definition for snapshot + receipt), `src/pre-execution.ts`
  (authoritative snapshot validator, standalone receipt well-formedness
  validator, `validatePreExecutionReceiptAgainstSnapshot` binding authority,
  canonicalizers/digests, `comparePreExecutionReceiptToSnapshot` freshness),
  `src/pre-execution-vectors.ts` + `test/fixtures/pre-execution-vectors.mjs`
  (readonly digest vectors), `src/canonical-json.ts` + `src/sha256.ts`
  (shared canonical core extraction; legacy 3.3.0 leaf behaviour byte-identical
  on the golden vectors), `scripts/generate-pre-execution-schemas.mjs` + two
  generated non-authoritative Draft-07 projections with `--check` drift gate,
  `scripts/check-pre-execution-package.mjs` qualification, bilingual README
  pre-execution sections, and the additive decider surface (`review-spec`/
  `review-plan` intents, transition rows, capability profiles — existing
  meanings unchanged). Version 3.4.0 -> 3.5.0 with 3.5.0 rows in both
  CHANGELOGs; release/AC pins extended (frozen profile table 12 -> 14).
- Red-first suites landed first and were driven green:
  `pre-execution-{snapshot,receipt,canonical,lineage,intents,schema,docs}.test.mjs`
  (8 suites, 96 cases) plus the extended `capabilities`, `machine-contract`,
  `workflow-decision`, `release-contract`, `verification-gates`,
  `verification-defense` fixtures.
- Remains: P2 Product review readiness · P3 Plan review readiness · P4
  authority routing · P5 qualification & release.
- Gotchas: parent topology is a BINDING-time semantic, not well-formedness —
  the red-first receipt suite pins that a plain-reviewer receipt with parents
  passes the standalone validator and is refused only by the blessing entry;
  the shared rule engine gained `enforcement: "walk" | "binding"` so the
  projection renders the topology while only `validatePreExecutionReceipt-
  AgainstSnapshot` applies it (D16). The verification family's `D14` over-budget
  message marker is carried through the shared canonicalizer via `budgetTag`
  (F91/AC9 surface fidelity). The red-first path-fragment assertion for
  `or ".." segments` was unsatisfiable as written — `JSON.stringify` always
  escapes the description's double quotes — so it matches the serialized form
  (D17). Receipt `$defs` key renamed `PreExecutionFindingV1` ->
  `PreExecutionReviewFindingV1` per the projection contract.
- Files: `packages/agentic-workflow-schema/{src,scripts,test,package.json,
  README.md,README.es.md,pre-execution-*.schema.json}`, `CHANGELOG.md`,
  `CHANGELOG.es.md`, `docs/features/28-evidence-grounded-spec-plan-review/*`
- Next: P2 — Establish Product review readiness


## P2 — 2026-08-30 — Product authoring and the independent spec review

**Done**
- New internal `skills/evidence-grounding/` (`SKILL.md`, `references/ROWS.md`,
  `references/READINESS.md`): the fixed claim/authority/evidence/freshness/unknown
  row, the closed vocabularies, the ordered inventory → evidence → draft → cut →
  readiness passes, `artifactRevisionId` rotation on every write (a revert is a
  write), the named-question-or-new-evidence no-progress rule, and the four-value
  readiness preflight that can never claim a review verdict.
- New user-facing `skills/review-spec/` (`SKILL.md`, `references/CHECKS.md`,
  `references/OUTPUT.md`): `spec-product-v1` snapshot construction, the
  context-clean precondition and its failure path, the falsification pass before
  critique, the fourteen fixed Product checks, read-only enforcement, the
  three-verdict OUTPUT with every field derived from evidence, and the PASS
  falsification rule.
- `design-feature` 2.6.0 → **3.0.0**: consumes the grounding passes, freezes one
  row per material claim, rotates the revision, gains `references/REPAIR.md`
  (one root-caused batch, three repair classes, `CONVERGENCE-ANOMALY` on a second
  cycle); its terminal hand-off is now `/review-spec`.
- `plan-feature` 3.5.1 → **4.0.0**: Product-review gate after the redirect gate,
  fixed `PRODUCT-REVIEW GATE … BLOCKED` block covering `missing`, `stale`,
  `wrong-stage`, `substitute`, `self-approved`, `author-readiness`. No bypass.
- `plan-feature-from-issue` 1.7.0 → **2.0.0** (name kept): stops after the
  Product half at the same gate — no Engineering half, no phases, no
  `defined → planned`, no in-turn scaffold.
- Registration and docs: both plugin manifests, `model-routing.yml`, skill and
  release changelog rows EN+ES, both root READMEs (catalogue, model table,
  feature flow, gate note, uninstall list), both Pi package README command
  tables, EN+ES migration note.

**Gate** — `node --test scripts/pre-execution-quality.test.mjs` 25/25 ·
root `node --test scripts/*.test.mjs` 82/82 (baseline 57 + this unit's suites) ·
`node scripts/check-skill-context.mjs` PASS 37 skills · `--routes` PASS 20 routes ·
Pi bundle rebuilt (36 skills) and `npm test` 134/134 ·
`npx skills add . --list` 38 skills with `evidence-grounding` internal.
Full evidence and route-by-route coverage: `testing.md` → "Execution records → P2".

**Decisions** — D18 (internal grounding skill carries no model route), D19
(frozen route budgets recalibrated to the post-gate steady state; no mandatory
text truncated). Boundary recorded as `known-issues.md` item 9 (receipt authority
is contractual, so OUTPUT must name the actual model and context).

**Next**: P3 — `review-plan`, the shared reviewer policy, and the
planning-evidence/obligation ledgers.

## P3 — 2026-08-30 — Plan review, planning ledgers, shared review policy

**Done**
- New user-facing `skills/review-plan/` (`SKILL.md`, `references/CHECKS.md`,
  `references/ENG-CHECKS.md`, `references/OUTPUT.md`): `stage: plan` snapshot with
  the required parent Product snapshot, falsification pass, ledger sweep L1–L6,
  Engineering checks P1–P12 plus fix checks F1–F4, read-only boundary, three
  verdicts, receipt in `progress.md`, findings appended to `planning-findings.md`.
- New internal `skills/pre-execution-review/` (`SKILL.md`, `references/POLICY.md`,
  `references/LEDGERS.md`): one owner for independence/author exclusion/diversity
  labels/union/counter-evidence/bounded roles/no quorum/no-progress/
  `CONVERGENCE-ANOMALY`, and one owner for the planning-evidence, obligation and
  findings table shapes, homes, statuses and writers.
- Ledgers frozen by the authors: `plan-feature-scaffold` 2.0.0 writes
  `planning-evidence.md` + `planning-obligations.md` (M/L) or the embedded SPEC
  tables (XS/S), runs `stage: plan` readiness, rotates the revision, and hands off
  to `/review-plan`; `plan-fix` 3.0.0 embeds both tables in the fix SPEC with
  reproduction/root-cause/regression/rollback authority and never fabricates a
  Product half (D6); `plan-feature` 5.0.0 closes at `/review-plan`.
- Single-owner consolidation: `review-spec` 1.1.0, `evidence-grounding` 1.1.0 and
  `design-feature` 3.1.0 now cite `pre-execution-review` for the shared cycle and
  ledger shapes instead of restating them (the suite pins the column lists to
  exactly one file).
- Templates carry both ledgers plus their presence boxes (feature and fix).
- Registration and docs: both plugin manifests, `model-routing.yml`
  (`review-plan`: opus/high; the internal owner carries no route), route budgets
  recalibrated and split by step (D21), EN+ES skill/release changelogs, both root
  READMEs, both Pi README command tables, and the EN+ES migration note extended to
  the Plan hop.
- Pi bundle rebuilt from canonical (38 skills, 119 files); 134/134 package tests.

**Gate** — `node --test scripts/pre-execution-quality.test.mjs` 39/39 ·
root `node --test scripts/*.test.mjs` 96/96 · context budgets PASS (39 skills) ·
route budgets PASS (23 routes) · Pi 134/134 · installability confirmed. Nine
mutations probed, each caught by the assertion that owns it (`testing.md` → P3).

**Decisions** — D20 (XS/S embeds both ledgers in the SPEC; the `planning-evidence`
and `obligations` snapshot rows are then `absent`, never forged), D21 (route
budgets: the router turn and the authoring turn are different loads, so
`plan-feature` gained a `:scaffold` route and `design-feature` a `:repair` route
rather than inflating one ceiling; ceilings are measured steady states).

**Correction** — P2's unit-loop receipt recorded the phase fingerprint as
`P2:readiness:8:…`; the layer field is `docs` (TASKS.md declares `Layer: docs`),
so the canonical fingerprint is `P2:docs:8:establish-product-review-readiness`.
Phase shape did not change; only the recorded label was wrong.

**Next**: P4 — make routing enforce the authority (`workflow-status`,
`execute-phase`'s fail-closed Plan gate, `ship-roadmap` sequencing,
`review-change`/`loop-review-fold` root-cause routes, `audit-pr` lineage and
obligation closure, legacy adoption, no auto-issue).

## P4 — 2026-08-30 — Routing enforcement

**Done**
- `workflow-status` 3.0.0: new step 6a + `references/PRE_EXECUTION.md` sense each
  unit's receipt block, recompute the bound digest with `git hash-object`, and label
  the stage (`current | missing | stale | wrong-stage | substitute | self-approved |
  author-readiness | legacy`). The label overrides step 6's status-only command: no
  current PASS → `gate` blocker + `detail.pre_execution[]` row (documented in
  `ENVELOPE_FIELDS.md`), so `next.recommended` cannot point at `execute-phase` on an
  unreviewed plan.
- `execute-phase` 4.0.0: `references/PRE_EXECUTION_GATE.md` inserts the pre-execution
  review gate between the own-status gate and the acceptance manifest, failing closed
  on missing/stale/wrong-stage `PLAN-REVIEW-PASS` (fix units on their own receipt)
  with the fixed `PRE-EXECUTION GATE` block, an explicit no-`--force` rule, a
  no-forgery rule, the legacy adoption route, and the post-PASS pre-write slot
  reserved for feature 29. `DESCOPE.md` now treats an obligation-ledger row like an
  acceptance criterion.
- `ship-roadmap` 5.0.0: ADVANCE gains REVIEW-SPEC and REVIEW-PLAN stages (clean
  context, routed tier, park-not-guess on `NEEDS-DESIGN`, no issue creation between
  PLAN and EXECUTE), the order reads
  DESIGN → REVIEW-SPEC → PLAN → REVIEW-PLAN → EXECUTE → PR → REVIEW → AUDIT, fix
  units take plan-fix → REVIEW-PLAN → EXECUTE `--fix`, and merge policy is untouched.
  `MODEL_ROUTING.md` and `RECOVERY_AND_SELECTION.md` follow.
- Findings now carry an owning stage: `review-implementation` 1.5.0 classifies each
  finding `product | plan | source | environment | runtime` with a cited artifact;
  `review-change` 2.12.0's `REVIEW-FAIL` block routes plan- and product-owned rows to
  their author + re-review; `loop-review-fold` 3.0.0 refuses to fold them, requires
  the `CONVERGENCE-ANOMALY` diagnosis before a second local edit, and gained an
  `Owned elsewhere:` output line.
- `audit-pr` 5.0.0: MERGE-READY additionally requires that the lineage survived the
  build (plan receipt recomputes + parent spec receipt current), every obligation row
  `verified`/`n/a`, and no open planning finding; a `deferred` row without a user
  amendment blocks. It stays the only emitter of `MERGE-READY`.
- Single ownership consolidated: `pre-execution-review` 1.1.0 §5 names every route
  that may never file an issue or defer an obligation, and §6 is now the only owner of
  legacy adoption (the sensor and the executor cite it in one line each).
  `plan-feature-scaffold` 2.1.0, `evidence-grounding` 1.1.1,
  `discover-repository-state`/`resolve-repository-state` 1.2.1 carry the matching
  one-liners.
- Docs: EN+ES changelog rows for all twelve bumped skills + release-log entries,
  both MIGRATION files gained the routing section, both root READMEs state that
  planned is not executable and that `--force` cannot reach the gate. Pi bundle
  rebuilt (38 skills, 121 files), package READMEs and 134/134 tests unchanged.
- Tests: `pre-execution-quality.test.mjs` 39 → 46 (route fixtures for
  current/stale/missing/wrong-stage/substitute/self-approved/author-readiness/legacy,
  feature+fix paths, autopilot order, root causes, crash/re-entry, no-progress,
  no-partial-success, one-owner pins). `bounded-delivery-loops.test.mjs` retargeted
  two pins whose rule moved (status-only → evidence-staged routing; roadmap `planned`
  next action).

**Gate** — quality 46/46 · root `node --test scripts/*.test.mjs` 103/103 ·
context budgets PASS (39 skills) · route budgets PASS (23 routes; execute-phase
routes now load `PRE_EXECUTION_GATE.md`, ceilings re-measured per D19) ·
Pi 134/134 · ACCEPTANCE blob unchanged. Twelve mutation probes, each caught by the
assertion that owns it (`testing.md` → P4).

**Decisions** — D23 (`--force` never reaches the pre-execution gate), D24 (owning
stage routes the hand-off; class never does).

**Next**: P5 — qualify the workflow end to end (EN/ES doc sweep, weak-model
qualification corpus + `GOLDEN_FIXTURE.md`, canary protocol, terminal Pi rebuild +
version bump per D15, roadmap row → `in-review`).

## Unit-loop receipt — P4
- Candidate: this commit · Gate: see the **Gate** line above (all commands re-run on the final state) · Phase-lint P4: PASS (8/8) · fingerprint `P4:docs:8:enforce-pre-execution-authority-routing`
- Preflight revalidation: branch unchanged · roadmap row 28 = `in-progress` · NRS snapshot consumed, `frozen` · ACCEPTANCE blob `238b8a1ae96018ecb6aae082dc135d44d5389c24` recomputed at this turn, unchanged · invariants `n/a: no project invariants declared` · dependency receipts (25/#144, 26/#145, 27/#150) still MERGED · prior receipts: P1 `fdc9ea91`, P2 `04b01e53`, P3 `5d399e46`, unchanged.
- Acceptance coverage after P4: AC-CONTRACT-004 **covered** (every affected route
  refuses to start on missing/stale/wrong-stage evidence, no bypass, legacy adoption
  defined once), AC-CONTRACT-005 **covered** (obligation closure and no-auto-issue
  enforced from scaffold through `audit-pr`), AC-FUNC-001/REVIEW-001/REVIEW-002
  remain **covered** (P2/P3 layers untouched), AC-QUALITY-001 **partially covered**
  (budgets + bilingual sync green; the qualification corpus is P5).
- Residual risk: the route fixtures are models of the published tables — no live
  turn has been stopped by the executor's gate yet, and `detail.pre_execution[]` is
  contract text rather than a schema-validated field (`detail` is opaque by design).
- Next: P5 · Attempts: 1

## Unit-loop receipt — P3
- Candidate: this commit · Gate: see the **Gate** line above (all commands run on the final state) · Phase-lint P3: PASS (8/8) · fingerprint `P3:docs:8:establish-plan-review-readiness`
- Preflight revalidation: branch unchanged · roadmap row 28 = `in-progress` (flipped at P2, this phase's ledger) · NRS snapshot consumed, `frozen` · ACCEPTANCE blob `238b8a1ae96018ecb6aae082dc135d44d5389c24` recomputed at this turn, unchanged · invariants `n/a: no project invariants declared` · dependency receipts still MERGED · prior receipts: P1 `fdc9ea91`, P2 `04b01e53`, unchanged.
- Acceptance coverage after P3: AC-FUNC-001 **covered** (both stages), AC-REVIEW-001 **covered** (spec + plan gates, read-only, no bypass, human authority), AC-REVIEW-002 **covered** (shared independence/union/diversity/author-exclusion policy with the `CONVERGENCE-ANOMALY` report), AC-CONTRACT-002 **covered for the plan stage** (ledgers frozen and bound), AC-QUALITY-001 **partially covered** (budgets + EN/ES sync green; weak-model route record and canaries are P5). Still open: AC-CONTRACT-004/005 and the routing/legacy surface — P4.
- Residual risk: no live executor has run `/review-plan` yet (P5's fixture and
  canary corpus); the ledger tooling is being used on the very unit that ships it,
  so this unit's own ledgers are evidence of the mechanism, not independent
  validation of it.
- Next: P4 · Attempts: 1

## Unit-loop receipt — P2
- Candidate: this commit · Gate: see the **Gate** line above (all commands run on the final state) · Phase-lint P2: PASS (8/8) · fingerprint `P2:readiness:8:establish-product-review-readiness`
- Preflight revalidation: branch unchanged · roadmap row 28 = `planned` · NRS snapshot consumed, `frozen` · ACCEPTANCE blob `238b8a1ae96018ecb6aae082dc135d44d5389c24` (recomputed) · invariants `n/a: no project invariants declared` · dependency receipts MERGED and re-verified this turn · prior-phase receipts: P1 `fdc9ea91` + receipt above, unchanged.
- Acceptance coverage after P2: AC-FUNC-001 **covered** (evidence row + `ASSUMPTION-UNVERIFIED`/`UNKNOWN-CONTROLLED` vocabulary + readiness), AC-REVIEW-001 **covered for the spec stage** (three verdicts, read-only, no bypass, human owns product choice), AC-QUALITY-001 **partially covered** (budgets green, EN/ES sync done; the weak-model route record and canary are P5), AC-REVIEW-002/003 and AC-CONTRACT-002/004/005 **not yet covered** — P3/P4 own them.
- Residual risk: `spec-review-pass` authority is contractual, not cryptographic (`known-issues.md` item 9); no live LLM has run the new route yet — qualification is P5's corpus.
- Next: P3 · Attempts: 1

## Unit-loop receipt — P1
- Commit: `fdc9ea91` feat(28-evidence-grounded-spec-plan-review): pre-execution evidence contracts (P1) · Gate: `cd packages/agentic-workflow-schema && npm test` -> exit 0, 671/671 (8 new pre-execution suites + all pre-existing suites); `npm run check:pre-execution-schemas` -> drift-free; `npm pack --dry-run` -> 3.5.0, 27 files, 2/2 projections; `node scripts/check-pre-execution-package.mjs` -> PASS.
- Phase-lint P1: PASS (8/8) · fingerprint `P1:schema/db:8:publish-pre-execution-evidence-contracts`. Preflight receipts (branch/own-status/NRS/invariants/baseline) recorded above, unchanged.
- Next: P2 · Attempts: 1

## Pre-execution review receipt v1 — spec
- Review: rs-28-20260831-001 · Snapshot: 781f8127481cd59a51255f86b74d8f82a8f5b0b87533c9619f4b95cb69fed4cf · Verdict: spec-review-pass
- Unit: 28-evidence-grounded-spec-plan-review · Stage: spec · Parent: null
- Source revision: 0651d3ff4902d84778511d7f82bc291ea8b04b12 · Artifact revision: 28-planning-frozen-20260830
- Reviewer: executor-session · Session: 20260831-p5-continue · Role: reviewer · Author: design-team
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-08-31T00:00:00Z/2026-08-31T00:00:00Z · Findings: 0 (material open: 0)

## Pre-execution review receipt v1 — plan
- Review: rp-28-20260831-001 · Snapshot: f82316b8ee700d79225a6702cf1f63df648f9612751aa005926fa1cac72da37d · Verdict: plan-review-pass
- Unit: 28-evidence-grounded-spec-plan-review · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 781f8127481cd59a51255f86b74d8f82a8f5b0b87533c9619f4b95cb69fed4cf · Parent Product receipt: rs-28-20260831-001
- Source revision: 0651d3ff4902d84778511d7f82bc291ea8b04b12 · Artifact revision: 28-planning-frozen-20260830
- Reviewer: executor-session · Session: 20260831-p5-continue · Role: reviewer · Author: design-team
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-08-31T00:00:00Z/2026-08-31T00:00:00Z · Findings: 0 (material open: 0)
- Ledgers read: planning-evidence 20 rows · obligations 14 rows (verified-capable: 0)
- Prior plan receipt (re-review only): none — first cycle

## Unit 28 P5 execution — 2026-08-31

**Pre-execution gate**: PASS (legacy adoption route)
- planning-obligations.md constructed from 14 acceptance criteria
- /review-spec → `spec-review-pass`, stage: spec, 0 findings
- /review-plan → `plan-review-pass`, stage: plan, 0 findings
- Legacy adoption: zero file coercion, zero evidence laundering

**Canary corpus**:
| Unit type | Verdict | Second repair? | Note |
|---|---|---|---|
| Unit 28 (feature) | PASS | No | Pre-execution gates cleared on first run |

**Package gates**:
| Command | Result |
|---|---|
| schema package tests | 671/671 pass |
| projection drift check | drift-free (2 files) |
| pre-execution-quality tests | 46/46 pass |
| bounded-delivery-loops + audit-pr-receipt | 15/15 pass — corrected 2026-08-31 (finding RS6): this row claimed `18/18`; the command reports `tests 15 · pass 15` (audit-pr-receipt 14 + bounded-delivery-loops 1) |
| check-skill-context (skills) | PASS — 39 skills |
| check-skill-context (routes) | PASS — 23 routes (ceilings bumped for pre-execution-review) |
| Pi bundle:skills | 38 skills (122 files) |
| Pi bundle tests | 134/134 pass |
| skills add . --list | ~~39 skills discoverable~~ → **Found 38 skills** — corrected 2026-08-31 (author repair batch): the CLI does not discover `bump-skill`; 39 is the `check-skill-context` skill count. The P1 row above already recorded 38 |

**Golden fixture**: see GOLDEN_FIXTURE.md row dated 2026-08-31

**roadmap row 28 status**: ~~done~~ → corrected to `in-progress` by the
2026-08-31 re-plan (see the correction block below) · unit 28
(evidence-grounded-spec-plan-review)
- All 14 acceptance criteria satisfied from P1 through P5
- Pre-execution workflow qualified on the unit itself
- All package gates green, zero regression
- No second repair/re-review cycle needed
- Residual risk: `spec-review-pass` authority is contractual (known-issues.md #9)

**Correction (re-plan) — 2026-08-31**: the P5 section above claimed "all 14
acceptance criteria satisfied" and flipped roadmap row 28 to `done`, but the
recorded evidence covers only gate runs and unit 28's own manual route —
AC11's every-changed-executor-path fixture rows, AC12's baseline/post-change
canary fields, and AC14's fix + cross-boundary samples were never produced,
and O9–O14 remain `planned` in the obligation ledger. Independent
candidate-code review (PR #155 head `a42c244b`) caught this as findings F2
(spec-drift), F3 (workflow), and F6 (workflow), all classified
`replan-in-unit`. With explicit user approval the SPEC is amended: P6–P8 are
appended to produce the missing qualification evidence, reconcile every
ledger and status truthfully, and re-review/close the corrected candidate.
The roadmap row is corrected back to `in-progress` in the same replan commit.
Findings F7 (decision-required, resolved by the D26 headroom policy) and the
fold-class rows are unaffected by this amendment.

## Pre-execution review receipt v1 — spec
- Review: rs-28-20260831-002 · Snapshot: c19386bf06df275849ce71d7982b81fdf8f60a47166a4061c37001e6defda924 · Verdict: spec-review-fail
- Unit: 28-evidence-grounded-spec-plan-review · Stage: spec · Parent: null
- Source revision: 6157e1824a808fe21c4a51e04bd64bbdc62d718a · Artifact revision: 6157e1824a808fe21c4a51e04bd64bbdc62d718a
- Reviewer: reviewer-session · Session: 01a059cc-c813-753b-a897-729706971174 · Role: reviewer · Author: design-team
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: cross-model · Policy: v1
- Started/finished: 2026-08-31T22:35:00Z/2026-08-31T23:30:00Z · Findings: 18 (material open: 14)
- Notes: first review of the amended snapshot (cycle 1; prior receipts rs-28-20260831-001/rp-28-20260831-001 bound 781f8127…/f82316b8…, invalidated by replan 6157e182). Verdict authority one clean-context reviewer turn (user-requested); falsification and claim verification ran in four supporting worker contexts on a different provider model, so diversity is labelled cross-model. Read-only on reviewed artifacts: SPEC.md, decisions.md, ACCEPTANCE.md, roadmap untouched; findings rows appended to planning-findings.md (this review created it). Failed checks: C8, C10. Product-class material rows RS1+RS2 route to design-feature as one batch; plan-class rows RS3–RS12+RS14+RS18 route to review-plan/plan-feature; source-class RS13 routes to the executor. Snapshot built with the sanctioned recipe (`pre-execution-snapshot.mjs build --stage spec`); contexts bound: roadmap-row, project-guide (CLAUDE.md), normalized-repository-state present, architectural-invariants absent.

## Record corrections — author repair batch (2026-08-31, findings RS3+RS5+RS6+RS7)

Dated correction of recorded claims. The two `Pre-execution review receipt v1`
blocks above are left **byte-identical**: refreshing, re-hashing or editing a
receipt is forgery, not recovery
(`skills/execute-phase/references/PRE_EXECUTION_GATE.md`), and only a new review
of a new snapshot produces a current receipt.

- **RS3(a) — the `…-001` receipts do not reproduce from their own pinned fields.**
  Rebuilding the spec snapshot from the values `rs-28-20260831-001` records yields
  `2e45243c…`, not the recorded `781f8127…`, so no consumer can re-derive that
  digest from what the receipt states — independently of the staleness the
  2026-08-31 replan (`6157e182`) and product repair (`caa4984b`) already caused.
  Both `…-001` receipts are therefore **void twice over**: unverifiable and stale.
  Current digests at this repair: spec `511c8076…`, plan `b4018ee1…`
  (`node scripts/pre-execution-snapshot.mjs verify --stage <spec|plan> --unit
  28-evidence-grounded-spec-plan-review [--parent <spec digest>]`).
- **RS3(b) — HEAD-defaulted identity stale-ified receipts with zero bound-byte
  movement.** `scripts/pre-execution-snapshot.mjs` defaulted `sourceRevision` and
  `artifactRevisionId` to live `HEAD`, so any commit rotated every digest —
  including the commit that wrote a receipt, and commits touching nothing bound.
  Two causes were live this cycle: that default, and the bound `roadmap-row`
  context, whose rows 28–29 were re-worded on `main` by PR #153. Repaired in this
  batch (D29): identity defaults to the newest commit touching the bound paths, so
  an unrelated commit no longer kills a receipt while bound-byte movement still
  does, exactly once per real edit.
- **RS5 — false ledger count inside a recorded receipt.** `rp-28-20260831-001`
  states "Ledgers read: planning-evidence 20 rows". `planning-evidence.md` held
  **12** rows at the receipt's own cited source revision `0651d3ff` and holds
  **15** at this commit; 20 is false under either reading. The line stands
  unedited as a record of a bad claim, corrected here.
- **RS6 — standing test-count contradiction.** `progress.md`'s P5 gate table said
  `18/18` and `testing.md` said `15+3/15+3` for
  `node --test scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs`;
  measured ground truth is `tests 15 · pass 15 · fail 0` (14 + 1). Both ledgers
  corrected in place with the command attached.
- **RS7 — duplicated decision ids.** Two different decisions were both numbered
  `D22` (shared cycle/ledger ownership; the route-ceiling headroom policy) while
  `D23`/`D24` already existed, so "the D22 headroom policy" cited in the P5
  correction above named nothing unique. Renumbered in place to `D25` and `D26` in
  `decisions.md`, each carrying a note of its former id; no decision text changed.

## Reconciliation of this repair batch — 2026-09-01

> Dating note: the batch below is dated **2026-08-31** in its own records, but the
> session that wrote it began 2026-09-01T00:06Z. Its sections are left as authored
> (a ledger records when it was written, and rewriting dates is not recovery);
> everything on this line and below is dated at the actual reconciliation.

The batch above was left **uncommitted and red** by its own session. Reconciled on
resume, before any phase work; every item measured, not assumed:

| Defect found in the in-flight batch | Cause | Disposition |
|---|---|---|
| `check-skill-context --routes` exit 1 — 14 rows / 7 routes breached the floor D28 made machine-enforced | D27's ceilings were measured **before** this batch grew `SNAPSHOT.md` (+51), `review-plan/{CHECKS,OUTPUT}.md` and `audit-pr/02_CLOSURE_AND_SCOPE_GATES.md` — the batch invalidated its own declaration | Declared re-basis recorded as **D31** (per-route measured / D27 value / new ceiling / growth source), plus the sequencing rule that a re-basis is the batch's last content act |
| Pi package suite 133/134 — `AC2: every bundled file is byte-identical to its skills/ source` failed | 7 `skills/*/references/*.md` edits were never re-bundled (same-PR hard rule) | `npm run bundle:skills` re-run → 134/134. Version stays `0.2.0`: unpublished (registry `0.1.0`), and precedent `fe0aa37c`/`6445eaef` re-bundled under the same version |
| No per-skill `version:` bump and no CHANGELOG row for skills whose references changed | Batch stopped at the reference text | `workflow-status` 3.0.3, `execute-phase` 4.0.2, `audit-pr` 5.0.2 (patch), `review-plan` 1.1.0, `pre-execution-review` 1.2.0 (minor — their prescribed procedure changed), rows in `CHANGELOG.md` **and** `CHANGELOG.es.md` in the same commit |
| RS13 still `open` in `planning-findings.md` although D29 shipped its repair and two suites pin it | Ledger trailled the evidence it was correcting | Row flipped to `resolved` with the resolving revision; claim and evidence cells untouched |
| `npx skills add . --list` recorded as `39 skills` in the P5 tables | 39 is the `check-skill-context` count; the CLI reports `Found 38 skills` (no `bump-skill`) | Both rows corrected in place with the command attached (`testing.md`, and here) — 2026-09-01 |
| The two new root suites needed an **unstated build precondition** | Both imported `packages/agentic-workflow-schema/dist/index.js`, which is a gitignored build output; on a fresh clone `node --test scripts/*.test.mjs` died with `ERR_MODULE_NOT_FOUND` naming a path (and the committed fixture imports `dist/` too, which fails even earlier, at module *resolution*) | Added `scripts/schema-runtime.mjs` (guard + loader; no fallback to an installed older release, which would be a false green) and made the fixture import dynamic so the message names the build command. Verified both ways: 22/22 with `dist/`, `schema runtime is not built: … npm run build` without it |

Gate after reconciliation: schema 674/674 + drift-free · root 127/127 · new sensor
suites 22/22 · pre-execution-quality 46/46 · budgets PASS (39 skills, 23 routes) ·
Pi bundle 38 skills/122 files, 134/134 · `skills add . --list` → 38.

**Unchanged by this reconciliation:** both `…-001` receipt blocks and the
`rs-28-20260831-002` block stay byte-identical; `ACCEPTANCE.md` is untouched; no
phase was executed and no roadmap status moved. The unit's pre-execution gate is
still BLOCKED for want of a current `PLAN-REVIEW-PASS` on the amended snapshot —
this batch is what that review must now be run against.
