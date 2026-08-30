## Classify and route (no refactor)

The single classification engine is `review-implementation`, run **once** over
the **synthesized** findings table (D5). Classify each finding into exactly one
class, in this order. Never reopen source files to classify; the table's
evidence is authoritative.

### Step 1 — `ignore` first (the claim, not a class choice)

`ignore` claims **"this is not a real defect"** — a false positive or a
negligible taste/overengineering note. It is decided first, on the claim alone:
a false positive has no fix and no scope to check, so it never runs through the
current-unit gate. If the finding IS a real defect, it is not `ignore` — drop it
only with a rationale.

### Step 2 — Is it current-unit work? (only blocking outcomes)

A finding belongs to the **current unit** when it maps to the governing SPEC, a
phase, a documented invariant, correctness, security, accessibility, a required
UX/error state, or an expectation necessary for a competent user to consider an
in-scope capability complete (D2: complete capabilities, not short unit
duration). Current-unit work has **only blocking outcomes**:

- **fix-now** — it can fold directly. It is NEVER a tracked issue and NEVER
  routes to `plan-fix`: it folds into the current unit's open phase (AC 12).
- **replan-in-unit** — it needs additional user-confirmed phases (see *Large
  in-scope fix-now → replan, never downgrade* below).
- **decision-required** — a new product/architecture decision is unavoidable.
  Stop and surface it; the unit blocks until the user decides.

For current-unit work, `postpone`, `tradeoff`, `wontfix`, `disputed`, and
reviewer-created issue creation are **forbidden** (AC 10). A previously approved
trade-off is **cited as existing evidence**, never reinvented by review.
`disputed` remains a later fold/user outcome, not a reviewer shortcut.

### Step 3 — Independent future capabilities → proposals, never issues

Only a **truly independent future capability** — work the current unit does not
promise and no competent user expects from it (D3) — may become a
**non-blocking proposal**: batched in the report with a trigger, and NEVER sent
to `triage-issue` automatically. `review-change` creates no backlog work; only
the user routes a proposal to `triage-issue`.

### Large in-scope fix-now → replan, never downgrade

An in-scope fix-now too large to fold as-is (multi-file redesign, or evidence
the unit should have been split) keeps its **fix-now** class — size is never a
reason to downgrade. Set its `Route` to **`replan-in-unit`**: the unit's SPEC
`## Phases` ledger gets one or more new phases covering the work, on the SAME
branch — proposed to the user for confirmation, then executed via
`execute-phase`. It never routes to `plan-fix` or a new issue (AC 12). Placement
depends on whether the final `Hardening & PR` phase has already run:

- **Hardening not yet executed** → insert the new phase(s) BEFORE it; the
  ledger's existing close-out stays last.
- **Hardening already executed** → append the new phase(s) AFTER it, plus one
  fresh final `Hardening & PR` phase closing them out — the ledger must always
  end with an unexecuted hardening close-out covering every phase before it; a
  completed hardening never vouches for work added after it ran.

The finding is not folded directly; it is folded by the new phase(s).

### Decision table

For every finding, give the reasoning columns. Example (generic — your findings,
your domains):

| Finding | Axis | Sev | Class | WHY | Implementation risk | Long-term impact | Premature-opt? | Route |
|---|---|---|---|---|---|---|---|---|
| API token committed in a config file | security | high | fix-now | Credential exposure | Low (move to secret store) | Incident risk | no | fold into phase |
| New export endpoint has no failure-mode test | tests | med | fix-now | Untested error path | Low | Regression risk | no | fold into phase |
| Fixing this backend bug pulls in an auth redesign | correctness | high | decision-required | Unavoidable product/architecture decision | — | Blocking | no | surface decision, block |
| Rate limiter reusable across the fleet | architecture | low | proposal | Independent of this unit (D3) | — | — | yes | batch proposal + trigger |
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

- **fix-now** → fold directly into the current unit's open phase; never a
  tracked issue, never `plan-fix` (AC 12).
- **fix-now / `replan-in-unit`** → new phase(s) appended to the unit's SPEC
  `## Phases` ledger (user confirms first), then `execute-phase` on the same
  branch — never a downgrade, never a tracked issue (AC 12).
- **fix-now / `decision-required`** → stop and surface the decision; the unit
  blocks until the user decides. No issue is created.
- **proposal** (independent future capability) → batched in the report with a
  trigger; the **user** decides whether to route it to `triage-issue` (D3).
- **ignore** → note the rationale in the report; no further action.
