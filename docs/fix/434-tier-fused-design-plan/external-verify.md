# External verify — fix/434-tier-fused-design-plan

2026-11-11 (full verdict — no prior `EXTERNAL VERIFY` receipt exists for this unit; base `origin/main` = merge-base `27275c94`)

```text
EXTERNAL VERIFY — base: 27275c94007df4899fab290dcffab7e55bff218b · head: 350faee2afb993d2f57ef062216cb4245e76da5e
Blockers: 3 —
  1. docs/fix/434-tier-fused-design-plan/SPEC.md:281 (O7) — obligations closure: status `verified`, validator "`bun test scripts/catalog.test.mjs scripts/unit-doc-contract.test.mjs` exits 0 and `node scripts/run-root-suite.mjs` exits 0". Reproducer: `bun test scripts/catalog.test.mjs scripts/unit-doc-contract.test.mjs` → exit 0 (37 pass) ✓, but `node scripts/run-root-suite.mjs` → exit 1 (roadmap-settle + workflow-status-sensor 120s SUITE-TIMEOUT) and `bun scripts/run-root-suite.mjs` → exit 1 (roadmap-settle only, 101/102). Base-vs-head: the suite reds are base-identical (base export reproduces roadmap-settle `verdict: FAIL · violations: 1`; base's workflow-status-sensor isolated run 152.3s > the 120s killer, head 131.6s), yet the row's stated outcome never reproduced here — nor at the unit's own G1 (SPEC.md:362, exit 1). Smallest action: restate O7's validator/evidence cell to the observed outcome (exit 1 with the two named base-identical reds) or record a dated disposition — /aw-local-apply.
  2. docs/fix/434-tier-fused-design-plan/SPEC.md:234 (P5 validator) — completeness closure: P5's validator "`node scripts/run-root-suite.mjs` exits 0" does not re-run green (exit 1 on both runtimes, see blocker 1), so S5, S7, S10, S13, S14, S15, S17, S18 (P5 is the sole carrier of all but S15) have no green task validator here. Smallest action: amend P5's validator cell to the honest observed outcome — /aw-local-apply.
  3. docs/fix/434-tier-fused-design-plan/SPEC.md:353 (E3) — reported differential receipt does not reproduce. Reproducer: `git archive 27275c94` export in `mktemp -d` scratch vs this head, `node scripts/unit-route.mjs --triage 82-relay-lane-execution` and `--json`: head stdout gains `Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)` and the JSON gains `fused: {steps: ["design","plan"]}`; base has neither (507-driver-write and 61-adaptive-unit-lane byte-identical in both modes, exit codes included). E3 claims "byte-identical in all six runs". Base-vs-head: the added bytes are exactly the requested standard-tier annotation (O3 — behavior correct, receipt claim false; 82 records `standard` with design+plan triaged). Smallest action: correct E3's wording to the actual differential result (82 fuses; 507/61 identical) — /aw-local-apply.
Advisories: 4 —
  1. scripts/roadmap-settle.test.mjs:77 — live-tree `docs/features/494-telemetry-by-turn/SPEC.md:1 row-missing`: base export run gives the identical `verdict: FAIL · violations: 1` (494 SPEC present and row absent at both refs) → base-identical, advisory.
  2. scripts/workflow-status-sensor.test.mjs (node-leg 120s SUITE-TIMEOUT in the root gate) — base export isolated run 152.3s vs head isolated run 131.6s (78/0 green both); base exceeds the bound too and the bun leg runs it green → environmental/load, base-identical, advisory.
  3. docs/fix/434-tier-fused-design-plan/SPEC.md:363 (G2) — reported "16 + 24 pass"; observed `bun test scripts/catalog.test.mjs scripts/unit-doc-contract.test.mjs` → 37 pass (16 + 21) at head and identically at base; exit 0 (the obligation's outcome) reproduces → receipt miscount only, advisory (its obligation O7 is already blocked).
  4. skills/unit-lane/references/PLAN.md:6 — Purpose still opens "sweep every claim against what the repository already decided"; the delta restriction follows in the same paragraph and Stage 2 (line 62) and the checklist (lines 225–227) are fully delta-consistent, so the superseded truth is not left standing → advisory note, not a blocker.
Sibling sweep: clean (one note, advisory 4) — `rg "same provenance search"` = 0 across skills/ and docs/workflow (the unit doc cites it only as history; the negative pin in scripts/activity-fusion.test.mjs asserts 0), no surviving claim that design/plan are unconditionally separated at `standard` (README, SKILLS.md, LANE_FLOW.md, SKILL.md, DESIGN.md all carry the fusion statement; "separated" statements are conditioned on `high`/unrecorded), the LANE_FLOW `Fused:` sample is byte-identical to the emitter, the fixed-prefix triage parsers (`unit-cycle`, `unit-lineage`, lane-era-lineage, unit-doc-contract) are green, and the normative/budget/residue gates (normative-drift, check-skill-context --routes/--documents, residue-dimensions, prose-gate-inventory) are green.
Completeness: resolved S1, S2, S3, S4, S6, S8, S9, S11, S12, S16 (P1–P4 validators re-ran green here: activity-fusion+catalog 30/0, lint-changeset exit 0, docs-generate --check PASS, rg pins exit 0/1 as specified); open: S5, S7, S10, S13, S14, S15, S17, S18 (P5's validator exit 1; E3's S15 differential receipt does not reproduce).
Spot check: `node scripts/unit-route.mjs --triage 82-relay-lane-execution [--json]` (base export vs head, the E3 differential) → mismatch (reported byte-identical; head prints the `Fused:` line / `fused` key) — per the rule the reported verification set is untrusted as written; this verdict rests on the commands re-run directly in this session (declared validators, both root-suite runtimes, the base-side proofs above).
Verdict: NEEDS-DECISION (3 open blockers)
```

Read-only disclosure: every live-tree command run here was read-only (tests, checks, `--triage`); the base-side differentials ran only in a `mktemp -d` `git archive` export, which was removed — no mutating path introduced by the change was executed against the live tree, and no edit, commit, branch, or forge mutation was made apart from this receipt.

## Correction addendum — 2026-11-11 (one batch, per the correction bounds §9)

The local apply session ran one correction batch over the three blockers above
(unit doc `SPEC.md` — receipt text only; no skill, script, catalog or behavior
surface touched):

- **Blocker 1 (O7, SPEC.md:281)** — validator re-stated from the two-commands-
  one-false-claim form to outcomes that reproduce: the consumer suites exit 0
  and the root suite reds no suite outside the Known pre-existing issues list
  (the base-identical 494 drift; the base-identical load-flake class).
  `required-evidence` now carries E12. Recheck: `bun test scripts/catalog.test.mjs
  scripts/unit-doc-contract.test.mjs` → exit 0 · 37 pass; `bun scripts/run-root-suite.mjs`
  → exit 1 · 100/102, both reds inside the known list (the load flake green in
  isolation, 78/0; base isolated 152.3s > the 120s bound); `node scripts/run-root-suite.mjs`
  → exit 1 · 101/102, single `roadmap-settle` red.
- **Blocker 2 (P5, SPEC.md:234)** — task validator re-stated the same way,
  anchored on the ledger-close validators. Recheck: `bun scripts/lint-changeset.mjs`
  → exit 0; `bun scripts/docs-generate.mjs --check` → PASS; `node scripts/unit-lineage.mjs
  --unit 434-tier-fused-design-plan` → exit 0 · obligations closed (12).
- **Blocker 3 (E3, SPEC.md:353)** — corrected in place (the verifier reads
  current bytes): 507 and 61 byte-identical in all four of their runs; 82's two
  runs differ by exactly the requested `Fused:` line / `fused` key. Differential
  re-run in a fresh `mktemp -d` base export matches the corrected text.
- **Advisory 3 (G2, SPEC.md:363)** — pass count corrected 24 → 21 (the observed
  count at head and at base); exit 0 reproduced.
- **Advisories 1, 2, 4 deliberately left**: the 494 roadmap drift is another
  unit's index row (owner's decision per the unit's known issues), the load-flake
  class is base-identical environment behavior, and the PLAN.md Purpose residue
  is executor-path prose whose re-touch would stale this unit's golden-fixture
  row — each stays an owner decision, not silently absorbed.

Frozen-failure corpus (literal repro patterns, deliberately scoped to the unit
doc — this receipt quotes the old claims, so the corpus never scans it):

```text
rg -c 'node scripts/run-root-suite.mjs` exits 0' docs/fix/434-tier-fused-design-plan/SPEC.md   → red 2 · green 0
rg -c "byte-identical in all six runs" docs/fix/434-tier-fused-design-plan/SPEC.md            → red 1 · green 0
rg -cF "16 + 24 pass" docs/fix/434-tier-fused-design-plan/SPEC.md                             → red 1 · green 0
```

The verdict block above stays as issued — the next run binds it as the
pre-batch receipt and verifies `27275c94…HEAD` (this batch) as a delta against these
blockers only.
