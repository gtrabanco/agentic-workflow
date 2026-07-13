# 17 — finding-severity-routing · known-issues

Deferred items, each linked to (or destined for) an issue. Deferred work is **not**
implemented inline by this feature's phases.

## Deferred

- **Orchestrator model *selection* from `suggested_tier`.** This feature only
  *surfaces* `suggested_tier` in the envelope; how a driver / `ship-roadmap`
  consumes it to actually pick a fixing model per finding is a separate
  consumption concern (SPEC "Out of scope"). File a follow-up issue **if/when** a
  consumer needs it — not tracked as a blocker on 17.

- **`#37` fold-cycle-ladder prose.** The manual model ladder documented in prose is
  owned by `docs/fix/37-bilingual-human-docs` (merged). This feature makes the
  ladder machine-assisted but does **not** edit #37's docs. No action here.

## Latent inconsistency resolved incidentally (not deferred)

- `workflow-status` step 8 already assumed a "review report present in the feature
  folder" to detect that review ran, but no skill wrote one. The `review-findings.md`
  ledger gives that detection a real artifact — handled within this feature's
  scope, listed here only for traceability.
