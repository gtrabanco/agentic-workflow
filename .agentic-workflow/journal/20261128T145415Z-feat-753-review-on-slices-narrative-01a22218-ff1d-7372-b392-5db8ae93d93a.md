## 2026-11-28T14:54:15Z — feat/753-review-on-slices — narrative

**Session:** 01a22218-ff1d-7372-b392-5db8ae93d93a

## Summary

Delivered the A/B measurement that Issue #753's acceptance sketch demanded — a full gradient from weak models (qwen3.6, gemma4) through strong models (glm5.3-flash, deepseek-v4-flash), testing review-on-slices against monolithic review on the two units the issue cites (fix/258, fix/224). 112 review calls, all findings scored against the committed cycle-1 defect ledgers. The result is documented in the report, committed under `docs/research/2026-11-28-review-on-slices-ab/`, and the instrument is reusable for the A/B of record on any future unit. A PR (#756) carrying all research — report, external-evidence, harness with 112 packed outputs, results CSV/tables, VERIFICATION notes, ATTRIBUTION rows, and coverage-ledger rows — was pushed to `feat/753-review-on-slices` and a comment with the measurement summary was posted to #753. The integration of #753 itself (the `review-due` CLI subcommand + schema vocabulary + tier→cadence config) was **not started**, per explicit instruction.

## Decisions

1. **Tier-conditional review over universal slices.** Evidence shows slices ≥ mono in every (unit × model) cell, with the advantage shrinking monotonically but never inverting. The verdict is: apply progressive review-due only to **high** risk tiers (where slices provide +1 to +5 recall on weak models, +1 on strong), keep monolithic review for **standard** tiers (where strong models already saturate recall), and **passive** stays untouched. This is the triage that keeps spend proportional.

2. **Model routing: cheap models on slices, strong models on mono verification.** Unlimited/cheap models (qwen3.6, gemma4) benefit most from reduced context load — slice arm gives them 3→6–8 recall on fix/224. Strong flash models saturate at 7→8 or 8→9 even monolithically, making slices cost-inefficient for that tier when only mono recall is needed.

3. **Triaging is deterministic, not an active AI decision.** Row 97's `ceremony tier classify` already provides the classification at zero runtime cost — no need to add a triage call.

4. **Blind spots are structural, not model failures.** Out-of-diff claims (224-F4/F5) and registry/parity changes (224-F1) are unreachable by a content-reviewer at any model strength; they belong to delta-reader and gates respectively. The measurement is honest about this — recall buys precision, not reach.

## Next

- PR #756 (`feat/753-review-on-slices`) is open, refs #753 (does not close it), green in the gate. Owner review and merge at convenience.
- When triage selects #753 as a unit to implement: the harness under `docs/research/2026-11-28-review-on-slices-ab/harness/` is the reusable instrument — add a new unit entry to `config.json` + its ground truth to `gt.json`, run the three scripts, get the measurement.
- The deterministic integration contract (defined in the report § integration contract): new CLI subcommand `ceremony review-due` consuming row 97's tier classification, returning a typed verdict from schema-published vocabulary, consuming #566 B3 verbatim, shadow-verdicts before enforcement, tier→cadence config at plan time.
