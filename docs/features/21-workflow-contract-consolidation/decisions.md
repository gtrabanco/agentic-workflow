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

## 2026-08-04 — Route arrays vs reality (P2)

- The planned approach expected new internal contracts to be added to route
  `skills` arrays in `SKILL_CONTEXT_BUDGETS.json`. Reality contradicted the
  plan: adding them would inflate route estimates above the baselines captured
  in `testing.md`, so the `skills` arrays are left unchanged and the internal
  contracts are instead linked from routers via `(../planning-preflight/SKILL.md)`
  / `(../phase-contract/SKILL.md)` — the route resolver only pulls
  `references/`-linked files into route totals, so these links change no route
  membership.
- The three planning routes carry reduced regression maxima (set below their
  captured baselines): `plan-feature:scoped` 3346/258, `plan-feature:issue`
  5221/398, `plan-fix:issue` 3145/222. Execute/review/audit routes stay `null`
  until P3/P4 assign them maxima.
