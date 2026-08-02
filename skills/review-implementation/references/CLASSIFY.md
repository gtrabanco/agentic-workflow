## Phase 2 — Classify (no refactor)

Turn findings into a **decision table**. Classify each into exactly one of:

- **fix-now** — correctness/security risk, blocks the merge, is cheap to fix,
  or is in-scope of the unit under review (see the mandatory checks below).
- **postpone** — real but deferrable; must become a tracked issue (with a
  trigger), not inline work.
- **ignore** — not worth acting on; say why (false positive, negligible).
- **intentional-tradeoff** — deliberate and acceptable; document the rationale
  where future readers will see it.

### Fix-now override checks (mandatory before assigning `postpone` / `intentional-tradeoff` to a confirmed real defect — never for `ignore`)

Postpone / intentional-tradeoff are **escape hatches with guards**, not
defaults, for findings that ARE real defects. `ignore` is a different claim —
"this isn't a real defect" (false positive, negligible) — and is decided
first, before these checks: a false positive has no "fix" and no "scope" to
check, so it is never routed through this gate. Once a finding is confirmed a
real, actionable defect and you are choosing between `postpone` /
`intentional-tradeoff` and `fix-now`, run BOTH checks; if either ticks, the
class is **fix-now** regardless of severity:

```
✓ Cheap-fix check — the fix is small and low-risk. Fixed bound, not a
  feeling: "cheap" means **≤ ~15 changed lines AND ≤ 2 files AND no public
  API/schema/design change, no migration** (a missing annotation, a rename,
  a guard clause). Within the bound, a fix costs less than tracking it as an
  issue and is NEVER postponed: classify fix-now, note "cheap" in the WHY
  column.
✓ In-scope check — the defect lies inside the governing SPEC's scope for this
  unit (the feature/fix this branch implements). In-scope defects are the
  branch's own unfinished work: postpone / known-issue / tradeoff is NOT
  available for them — classify fix-now, note "in-scope" in the WHY column.
```

Both checks n/a (the fix is genuinely large AND out of the unit's scope) → the
non-fix-now classes are available as before.

### Large in-scope fix-now → replan, never downgrade

An in-scope fix-now that is too large to fold as-is (multi-file redesign, or
evidence the unit should have been split) keeps its **fix-now** class — size is
never a reason to downgrade. Set its `Route` to **`replan-in-unit`**: the unit's
SPEC `## Phases` ledger gets one or more new phases covering the work, on the
SAME branch — proposed to the user for confirmation, then executed via
`execute-phase`. Placement depends on whether the final `Hardening & PR` phase
has already run:

- **Hardening not yet executed** → insert the new phase(s) BEFORE it; the
  ledger's existing close-out stays last.
- **Hardening already executed** → append the new phase(s) AFTER it, plus one
  fresh final `Hardening & PR` phase closing them out — the ledger must always
  end with an unexecuted hardening close-out covering every phase before it;
  a completed hardening never vouches for work added after it ran.

The finding is not folded directly; it is folded by the new phase(s).

For every finding, give the reasoning columns. Example (generic — your findings,
your domains):

| Finding | Axis | Sev | Class | WHY | Implementation risk | Long-term impact | Premature-opt? | Route |
|---|---|---|---|---|---|---|---|---|
| API token committed in a config file | security | high | fix-now | Credential exposure | Low (move to secret store) | Incident risk | no | `plan-fix` |
| New export endpoint has no tests | tests | med | fix-now | Untested failure path | Low | Regression risk | no | fold into phase |
| Helper duplicated across 2 modules | maintainability | low | intentional-tradeoff | Coupling the 2 callers is worse | — | Near-zero divergence | no | note in `decisions.md` |
| Single-caller wrapper around a stdlib call | overengineering | low | ignore | Indirection with no payoff | — | Negligible | no | note rationale |

- **Sev** — **high**: correctness, security, or data-loss risk, or a merge
  blocker. **med**: degraded behavior, a real untested path, or notable debt.
  **low**: taste, cosmetics, or micro-optimization without a measured need.
- **WHY** — one-sentence justification for the class.
- **Implementation risk** — risk of *fixing* it now (blast radius, churn).
- **Long-term impact** — cost of *not* fixing it (debt, drift, incident odds).
- **Premature-opt?** — yes/no: optimizing without a measured need?
- **Route** — where it goes next (below).

## Routing (what each class feeds)

- **fix-now** → `plan-fix` → `execute-phase --fix`, or fold into the
  current feature phase if part of unmerged work.
- **fix-now / `replan-in-unit`** → new phase(s) appended to the unit's SPEC
  `## Phases` ledger (user confirms first), then `execute-phase` on the same
  branch — never a tracked issue, never a downgrade.
- **postpone** → open a tracked issue with an explicit *when-to-fix* trigger;
  `triage-issue` owns it thereafter. **Do not implement inline.**
- **intentional-tradeoff** → record it (code comment, `decisions.md`, or an
  issue documenting the choice) so it isn't re-flagged.
- **ignore** → note the rationale in the report; no further action.
