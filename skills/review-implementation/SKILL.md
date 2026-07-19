---
name: review-implementation
user-invocable: false
version: 1.2.1
argument-hint: <path-or-glob>
allowed-tools: Read, Grep, Glob, Bash, WebFetch
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal findings engine composed by review-change (and reused by the audit
  skills): two-phase find → classify pass ending in a classified decision table
  (fix-now / postpone / ignore / intentional-tradeoff). Findings only — never
  refactors.
---

# Review Implementation (internal engine)

The findings engine the review/audit skills compose: it **produces findings and a
decision table, and stops** — never refactors or edits code. It owns the **review
axes** (Phase 1) and the **classification rubric** (Phase 2) that `review-change`,
`audit-pr`, and `product-audit` reference instead of restating.

## When to use

- Invoked by `review-change` (the user-facing review entry) as its engine; the
  audit skills reference its rubric.
- Run directly only when you want the raw classified pass without the
  platform-adaptive orchestration `review-change` adds.

## Scope

Default target is the **current change** (branch diff vs. the default branch);
accept an explicit path/glob to widen or narrow it. State the scope at the top of
the report so the reader knows what was and wasn't reviewed.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the architecture/layering rules, the testing philosophy,
and any runtime/platform, security, money, i18n/SEO/a11y and bundle rules. Pull
the project's specific risk axes from its guardrail skills where present
(architecture-pattern, runtime/platform, domain-rules). The axis list below is the
default; the project's docs refine it.

## Phase 1 — Find (no refactor)

**Assume the diff is WRONG — your job is to prove it does not work.** Scan the
scope adversarially and record every finding across these axes. Fix nothing; the
classification in Phase 2 decides what matters.

| # | Axis | Looks for |
|---|---|---|
| 1 | **Bug / correctness** | Logic errors, wrong edge-case handling, races, unhandled rejections, imprecise numeric handling |
| 2 | **Architecture violation** | Broken dependency direction, business logic in the wrong layer, abstraction bypass, cross-layer shortcut (per the architecture doc) |
| 3 | **Overengineering / premature optimization** | Unnecessary abstractions, single-caller indirection, speculative generality, micro-opt without a measured bottleneck |
| 4 | **Removable / dead code** | Unused exports, unreachable branches, commented-out blocks, obsolete files — **see exception below** |
| 5 | **Security / cybersecurity** | Secrets in code, injection, missing authz, unsafe deserialization, PII exposure, weak crypto, SSRF, over-broad CORS, leaking errors |
| 6 | **Platform / runtime incompatibility** | APIs unavailable on the target runtime, unsupported in-memory state assumptions, runtime-incompatible deps, blocking external calls in the request path |
| 7 | **Bundle-size risk** | Heavy/duplicate deps, accidental large imports, non-tree-shakeable patterns |
| 8 | **Tests — failing/weak** | Flaky/over-mocked/snapshot-heavy tests, tests asserting nothing meaningful |
| 9 | **Tests — missing** | Uncovered branches, new use-cases/adapters without tests, SPEC dev-scenario failure modes not exercised |
| 10 | **Project-rule violations** | Whatever the project's docs mandate (e.g. domain value-object rules, no hardcoded UI strings, don't hide user-facing limitations, naming conventions) |

### Dead-code exception (important)

Do **not** flag code as removable if it is **intentionally staged for an
in-progress or planned feature**. Before reporting axis 4, cross-check the
roadmap, feature SPECs/`TASKS.md`, and `known-issues.md`: if the code is wired
into a planned phase or another feature, classify it *intentional / in-progress*,
not dead. When unsure, mark it **verify** and ask — never assert "dead" on a
guess.

### Finding format

Each finding: a stable id (`F-1`, `F-2`, …), `file:line`, axis, a one-line
description, and the **evidence** (the code/why it qualifies). No remedy code yet.

## Phase 2 — Classify (no refactor)

Turn findings into a **decision table**. Classify each into exactly one of:

- **fix-now** — correctness/security risk, blocks the merge, is cheap to fix,
  or is in-scope of the unit under review (see the mandatory checks below).
- **postpone** — real but deferrable; must become a tracked issue (with a
  trigger), not inline work.
- **ignore** — not worth acting on; say why (false positive, negligible).
- **intentional-tradeoff** — deliberate and acceptable; document the rationale
  where future readers will see it.

### Fix-now override checks (mandatory, before assigning `postpone` or
### `intentional-tradeoff` — a real, confirmed defect, not `ignore`)

Postpone / intentional-tradeoff are **escape hatches with guards**, not
defaults, for findings that ARE real defects. `ignore` is a different claim —
"this isn't a real defect" (false positive, negligible) — and is decided
first, before these checks: a false positive has no "fix" and no "scope" to
check, so it is never routed through this gate. Once a finding is confirmed a
real, actionable defect and you are choosing between `postpone` /
`intentional-tradeoff` and `fix-now`, run BOTH checks; if either ticks, the
class is **fix-now** regardless of severity:

```
✓ Cheap-fix check — the fix is small and low-risk (a few lines, a missing
  annotation, a rename, a guard clause; no design decision, no migration, no
  API change). A fix that costs less than tracking it as an issue is NEVER
  postponed: classify fix-now, note "cheap" in the WHY column.
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

## Guardrails

- **Findings + table only. Never refactor or edit code in this skill.**
- Honor the dead-code exception — staged/planned code is not dead code.
- Don't inflate severity; separate "correctness/security" from "taste".
- Don't deflate either: never classify a confirmed real defect as `postpone`/
  `intentional-tradeoff` without running the fix-now override checks, and
  never downgrade an in-scope fix-now because it is big — size routes to
  `replan-in-unit`, not to postpone.
- Otherwise per the project's **Workflow conventions** (docs-language, evidence):
  cite `file:line`, mark uncertainties *verify*.

## Relationship to other skills

- **Engine of `review-change`** — the user-facing review skill composes this plus
  the internal review pack's applicable passes (`review-code`, `review-security`,
  `review-verify`, `review-debt`, design/a11y/brand/perf/seo). `audit-pr` and
  `product-audit` reuse this rubric.
- Sits in **Stage 4** of the feature workflow (verification & review).
- `fix-now`/`postpone` outcomes hand off to `plan-fix` / `triage-issue`.

## Done when

- A scoped findings list (Phase 1) and a complete decision table (Phase 2) exist,
  every finding classified with reasoning, each routed — and **no code changed**.
