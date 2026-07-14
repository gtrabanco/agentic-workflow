# 17 — finding-severity-routing · decisions

Architecture/scope decisions + open questions. D1/D2 were resolved in the Product
half (`design-feature`); D3/D4 were drafting assumptions flagged re-questionable
in planning and are **confirmed here, unchanged**.

## Resolved

- **D1 (product, confirmed with project lead 2026-07-13).** Persistence surface =
  a **new per-unit fix-now fold ledger** `review-findings.md`, not the full review
  report and not an extension of `known-issues.md`. Fits existing per-unit-artifact
  patterns; keeps `known-issues.md` reserved for its distinct (postponed) lifecycle;
  lets `workflow-status` stay read-only by surfacing a writer-owned artifact.

- **D2 (product, confirmed 2026-07-13).** Severity = **verbatim `high`/`med`/`low`**
  passed through from `review-change`'s `Sev` column, **plus** a derived
  `suggested_tier`. Zero-loss; any consumer can apply its own policy.

- **D3 (confirmed at planning 2026-07-13, unchanged).** `suggested_tier` reuses the
  existing `strong`/`cheap` vocabulary of `next.tier` — no third tier name. The
  subtle-axis set is {security, correctness, logic, architecture, design,
  concurrency}; everything else (tests, style, docs, perf-low, mechanical) is
  routine. `high` severity on **any** axis also forces `strong`. Rationale: per
  CLAUDE.md's `≥` rule over-powering a fix is harmless, under-powering is the
  regression — so the derivation is deliberately conservative and fully mechanical
  (a weak model runs it as a lookup, not a judgement).

- **D4 (confirmed at planning 2026-07-13, unchanged).** `audit-pr` writes to the
  **same** `review-findings.md` ledger as `review-change` — the fold cycle consumes
  one list, not two.

- **Phase-grouping decision (planning).** P4 groups the `workflow-status` emit with
  its schema-package mirror as **one concern** (the `findings.fix_now[]` item
  shape). The repo's Verification rule already treats the SKILL envelope section
  and the schema package as a single synchronized unit ("same PR"), so this keeps
  the plan at 5 phases without splitting a single contract across two — the
  mandatory split rule is respected, not evaded.

## Open questions

None. D1–D4 are all resolved; no genuinely-unknown value remains for planning.
