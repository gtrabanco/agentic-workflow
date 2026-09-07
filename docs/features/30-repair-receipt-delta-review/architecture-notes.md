# architecture-notes — 30-repair-receipt-delta-review

## Position in the review→fold loop

```text
review-change (find → verify → classify → persist)
  → fold-findings (queue → group → repair → gate → commit → flip)
      → prints per-finding table + tally + REPAIR-RECEIPT + branch (NEW)
         ├─ RE-REVIEW-REQUIRED (delta) → review-change delta mode (NEW default)
         ├─ RE-REVIEW-OPTIONAL ────────→ consumer decides; no decision = re-review
         ├─ RE-REVIEW-SKIPPED ─────────→ explicit prior skip decision only (E-D2)
         └─ REPLAN-ROUTE ──────────────→ freeze-batch: loop stops, planning routes
  → delta re-review re-verifies folded rows at cited file:line, reviews the
    fold diff only, gate green + exact ACCEPTANCE.md blob → SHA-bound REVIEW-PASS
  → escalation (width ±50 / size 200·15) → full pass, trigger + numbers stated
  → cap counts delta cycles from review-mark@1 + forge receipts (unchanged source)
  → audit-pr consumes the same SHA-bound receipt at the same PR head (unchanged)
```

## Surfaces and layers

- **Skills (docs layer):** `skills/fold-findings/SKILL.md` +
  `references/FOLD_PROCESS.md` + `references/FOLD_POLICY.md` (P1);
  `skills/review-change/references/REVIEW_PROCESS.md` (P2);
  `skills/pre-execution-review/references/LEDGERS.md` (P3). No source code, no
  schema, no runtime dependency.
- **Pins (repository tests):** `scripts/review-loop-discipline.test.mjs` gains
  receipt/classification/freeze/branch/delta/escalation/cap/reproducer pin
  sections; existing pins are strengthened in place, never weakened.
- **Docs:** `docs/workflow/REVIEW_AND_CLASSIFY.md` + `.es.md` (narrative),
  `docs/workflow/MIGRATION.md` (additive note), budget manifest re-measure.
- **Distribution:** `packages/pi-agentic-workflow` re-bundled only through
  `bundle:skills`; `packages/agentic-workflow-schema` and `skills/audit-pr`
  untouched.

## Ownership invariants held

- `fold-findings:folded-flag` stays the sole `folded:` flag writer — zero
  flips under freeze-batch.
- `review-change:finding-mark` / `review-change:review-mark` stay the sole
  mark writers; the receipt is printed output and writes no ledger row (D30-3).
- The receipt's batch class is **derived** from frozen rows; nothing in the
  fold reclassifies severity/class/route (forbidden list intact).
- The two-cycle cap's counting source is untouched; delta cycles count (D30-6,
  AD-008 intact).
- `audit-pr` keeps consuming the SHA-bound `REVIEW-PASS` receipt at the exact
  PR head; delta mode is invisible to it.

## Version surface

`fold-findings` 1.3.0→1.4.0 · `review-change` 3.3.0→3.4.0 ·
`pre-execution-review` 2.1.0→2.2.0 — minor bumps via the `bump-skill`
contract (both changelog siblings), normative-drift version tables kept in
sync, Pi mirror re-bundled in the same release.
