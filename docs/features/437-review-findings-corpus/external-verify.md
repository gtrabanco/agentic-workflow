# External Verification Receipt

## 2026-11-09 — EXTERNAL VERIFY (full, initial)

```
EXTERNAL VERIFY — base: 2a28f038a246d35ba159037620ebe337a56e57ed · head: 5a38163d4b6ed750e91d3653347fdd555d798879
Blockers: 0
Advisories: 3 (baseline pre-existing-failure for new scripts at base: expected; node availability gap at base for root-suite: environmental, not change-caused; workflow-status-compact pre-existing red at base: confirmed present in main)
Sibling sweep: clean — all surviving mentions of nimio/correction-budget/differential-baseline/findings-corpus in changed surfaces (fold-findings/SKILL.md, GATE_INVENTORY.md) correctly reference the new artifacts; no stale claims remain
Completeness: S1–S17 all resolved to task Implements clauses (S11/S12 are structural constraints); O1–O24 all verified with re-runnable validators
Spot check: bun scripts/findings-corpus.mjs → findings | 1149, legacy-ledgers | 56, fold-annotated | 229 — matches E1 in unit log
Verdict: VERIFIED

Three new suites, all green:
  bun test scripts/findings-corpus.test.mjs · 14 pass / 0 fail
  bun test scripts/correction-budget.test.mjs · 10 pass / 0 fail
  bun test scripts/differential-baseline.test.mjs · 9 pass / 0 fail

Scripts verified against real tree:
  bun scripts/findings-corpus.mjs → findings 1149, admitted 125, repeat-classes 9, findings-per-cycle 6.02, arw 0.88, arw-band measured
  bun scripts/correction-budget.mjs --measure → batch-size 1, sample 70, source findings-corpus
  bun scripts/differential-baseline.mjs --base main --head HEAD · verdict PRE-EXISTING, staleness stale (expected: new scripts absent at base)

Gates:
  bun scripts/check-skill-context.mjs → PASS (29 skills, fold-findings at 5920/403/3 refs inside ceilings)
  bun scripts/prose-gate-inventory.mjs → verdict: PASS
  bun scripts/docs-generate.mjs --check → verdict: PASS

Pre-existing root-suite failures (16 failures across 5 suites): confirmed present at base commit, not caused by this change:
  scripts/next-step-ranking.test.mjs — 10 fail (forge fixture issues)
  scripts/workflow-status-sensor.test.mjs — 16 fail (forge/degradation fixtures)
  scripts/workflow-status-compact.test.mjs — 1 fail (forge fixture)
  scripts/review-receipt.test.mjs — 2 fail (missing node binary in PATH override)
  scripts/review-loop-discipline.test.mjs — 1 error (missing node binary)
  scripts/local-gate.test.mjs — 2 fail (pre-existing)
  scripts/journal-carrier-check.mjs — 1 fail (pre-existing)

## 2026-11-11 — EXTERNAL VERIFY (delta — the correction batch)

Delta scope: commits `be4f6193`, `40b7f54d`, `87c82ed1` since the 2026-11-09
receipt (last receipt had 0 blockers → delta verdict; base `f8ddfb7b`, the
merge-base with `origin/main`; head `87c82ed1`). Read-only run: no commit, no
push, no branch, no forge mutation; no mutation-path command executed against
the live tree (`docs-generate --check` only; the `rowUpsert` writer never run
here — its outcome verified from the row bytes + `docs-generate --check`).

```
EXTERNAL VERIFY — base: f8ddfb7be6a0b375c9a586ee6df331f82ce430c3 · head: 87c82ed1 (delta: be4f6193, 40b7f54d, 87c82ed1)
Blockers: 0
Advisories: 3 — (1) SPEC.md Tasks P3 (~line 170): phase-lint BLOCKED at head — P3's `(Implements: …)` clause glued after the validator's closing paren reads as "links no requirement" and S10/S11/S12/S15 are reported unlinked; pre-existing at base bytes (Tasks section untouched by the delta), disclosed in journal D4 as an owner decision. Smallest action: put the clause on its own line in the unit doc. (2) docs/fix/361-finding-severity-ladder/SPEC.md:402 + decisions.md:34 — dated 2026-11-04 records still say the baseline run is "until it exists": historical closed-unit records, superseded by the CLASSIFY.md owner. (3) docs/features/96-prose-gate-inventory/planning-evidence.md:31 — same historical class ("#363 … row 100 (idea)"); row 100 is now folded/absorbed.
Sibling sweep: clean on live surfaces — CLASSIFY.md cites `scripts/differential-baseline.mjs`, "until it exists" gone there and pinned by the suite; ROADMAP row 437 + docs/generated/units.md settled to done · #492; changeset extended; only the dated closed-unit records in advisories 2–3 survive, none a live narration
Completeness: delta claims P9 resolved — citation (validator `bun test scripts/differential-baseline.test.mjs` 10 pass/0 fail, red-first proven: head test vs base bytes = 9 pass/1 fail in mktemp scratch, removed after) and row settle (`bun scripts/roadmap-settle.mjs` PASS · 0 violations; `docs-generate --check` PASS). O1–O24 all verified; delta-relevant O13–O16, O21, O22 validators re-ran green here. S10/S11/S12/S15 task linkage = advisory 1 (recorded disposition in D4, owner decision pending)
Spot check: bun scripts/roadmap-settle.mjs → "186 unit docs checked · 0 fix docs skipped · verdict: PASS · violations: 0" → match (E9). Also re-ran green, all matching the recorded E-lines: differential-baseline suite (E8), check-skill-context 29 skills + --routes 14 routes + its test (E12/E13), docs-generate --check (E11), vocabulary-parity 21/0, lint-changeset ok, log-immutability PASS at head
Verdict: VERIFIED
```

Note: the 2026-11-09 receipt's completeness line ("S1–S17 all resolved to task
Implements clauses") does not fully reproduce under today's phase-lint (S10
glued, S15 unlinked) — covered by advisory 1; it predates the delta.
