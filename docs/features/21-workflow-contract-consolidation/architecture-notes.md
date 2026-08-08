# 21 — workflow-contract-consolidation · architecture notes

## Ownership boundaries

| Boundary | Sole owner | Consumers |
|---|---|---|
| Roadmap eligibility and planning snapshot | `plan-feature` router | composed planning internals |
| Final planning invariant result | `planning-preflight` | feature/fix planners and executor |
| Phase atomicity contract | `phase-contract` | planners, executor, audit evidence |
| Phase implementation and local state | `execute-phase` | review and workflow sensor |
| Diff quality, SPEC completeness, final invariant result | `review-change` | `audit-pr` via SHA receipt |
| Current-unit finding classification | `review-implementation` classifier | ledger/fold cycle |
| Delivery and merge readiness | `audit-pr` | human or active fullauto conductor |
| Automated merge execution | active `ship-roadmap --fullauto` wrapper | forge |

## Evidence boundaries

- Same-turn internals receive immutable snapshots rather than re-reading.
- Cross-turn reusable evidence is bound to content or HEAD fingerprints.
- Any mismatch invalidates reuse and runs the owning gate again.
- Reports never grant authority: review receipts prove review; audit comments
  prove readiness; only the external owner may merge.

## Context boundary

Main skill files retain only universal Turn-contract obligations, route
selection, and fail-closed missing-resource behavior. Alternate modes,
explanations, examples, platform fallbacks, and detailed algorithms load only
after their route condition fires. One-hop reference reachability remains a
hard repository invariant.
