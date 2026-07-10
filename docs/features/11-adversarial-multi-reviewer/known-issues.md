# 11 — adversarial-multi-reviewer · known-issues

Deferred items, each linked to (or destined for) an issue. Do **not** implement
deferred work inline during this feature.

## Deferred

- **Multi-reviewer mode for `audit-pr` / `product-audit`.** This feature scopes
  the N-reviewer mode to `review-change` (and `ship-roadmap`'s use of it) only.
  Extending it to the PR-level merge gate or the product-wide sweep is out of
  scope — open a follow-up issue if the need is demonstrated (not planned).

- **Auto-selection of N and model families.** N is user-supplied (or
  ship-roadmap's fixed floor of 2); family diversity is a documented preference.
  A heuristic that picks N or the family mix from change risk/size is not built —
  potential future enhancement, no issue yet.

## Risks carried into execution

- **Reviewer cost (low).** 2–3× the most expensive review stage. Bounded by
  default-OFF + explicit cost note; ship-roadmap's automatic use is capped to
  L/sensitive at N=2. No action needed beyond the docs.

- **Single-family environments (low).** Where only one model family is available,
  the N reviewers share training blind spots — less decorrelation than intended.
  Documented as "prefer, where available"; the agent states when it could not
  diversify. Not a blocker.
