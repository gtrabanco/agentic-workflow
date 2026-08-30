# progress — 28-evidence-grounded-spec-plan-review

Status: in-progress

Planning baseline: `32e69287b391946963bf6331506c9c1837298932`

| Phase | Status | Evidence |
|---|---|---|
| P1 — Publish pre-execution evidence contracts | done | `npm test` 671/671 exit 0 · `check:pre-execution-schemas` drift-free · `npm pack --dry-run` 3.5.0, 2/2 projections · `check-pre-execution-package.mjs` PASS |
| P2 — Establish Product review readiness | done | Depends on P1 public contracts |
| P3 — Establish Plan review readiness | pending | Depends on P2 Product-review authority |
| P4 — Enforce pre-execution authority routing | pending | Depends on P3 Plan-review authority |
| P5 — Qualify the pre-execution workflow | pending | Depends on P1-P4 |

## Dependency receipt v1
- Fingerprint: 6f7c915f1ade956adcef96a8558da17d26159088 · Closure: 28-evidence-grounded-spec-plan-review ← 26-staged-verification-contracts ← 25-content-bound-review-receipts · 27-pi-agentic-workflow
- Merged PRs: 25 #144 @ 11a8061639e0ea2bdfdbaabc270380543eb37002 merged · 26 #145 @ a69282dbc5164c3be09302783d57bd74c9bc5ffa merged · 27 #150 @ 32e69287b391946963bf6331506c9c1837298932 merged · Fully merged: yes · Verified: 2026-08-30

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
