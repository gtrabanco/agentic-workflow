# 21 — workflow-contract-consolidation · decisions

## 2026-08-04 — Product design

- The feature is one cohesive unit with at most five atomic phases.
- Completing the current capability takes precedence over minimizing elapsed
  review time or issue count cosmetics.
- Review cannot defer in-scope or implicit-completeness gaps, create follow-up
  issues, or decide a new trade-off/wontfix outcome.
- `review-change --merge` is removed and fails closed; `--synthesize` names
  findings-table fusion without merge semantics.
- Final review evidence is a SHA-bound PR comment, not a committed report file,
  so the receipt does not invalidate its own reviewed SHA.
- Audit consumes current review evidence and owns delivery/merge readiness; it
  does not repeat diff-quality review.
- Repeated checks remain only when their underlying state can change; otherwise
  snapshots, fingerprints, and exact-SHA receipts carry evidence forward.
- The project has no root `docs/CAPABILITIES.md`, repository-state artifact, or
  project-specific architectural-invariant document. The SPEC therefore records
  a derived workflow capability inventory and the compatible `n/a` outcomes.
