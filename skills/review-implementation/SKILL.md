---
name: review-implementation
user-invocable: false
version: 1.0.1
argument-hint: <path-or-glob>
model: opus
effort: high
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

Scan the scope and record findings across these axes. Fix nothing.

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

- **fix-now** — correctness/security risk, or blocks the merge.
- **postpone** — real but deferrable; must become a tracked issue (with a
  trigger), not inline work.
- **ignore** — not worth acting on; say why (false positive, negligible).
- **intentional-tradeoff** — deliberate and acceptable; document the rationale
  where future readers will see it.

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
- **postpone** → open a tracked issue with an explicit *when-to-fix* trigger;
  `triage-issue` owns it thereafter. **Do not implement inline.**
- **intentional-tradeoff** → record it (code comment, `decisions.md`, or an
  issue documenting the choice) so it isn't re-flagged.
- **ignore** → note the rationale in the report; no further action.

## Guardrails

- **Findings + table only. Never refactor or edit code in this skill.**
- Honor the dead-code exception — staged/planned code is not dead code.
- Don't inflate severity; separate "correctness/security" from "taste".
- Otherwise per the project's **Workflow conventions** (docs-language, evidence):
  cite `file:line`, mark uncertainties *verify*.

## Relationship to other skills

- **Engine of `review-change`** — the user-facing review skill composes this plus
  the platform's applicable companion reviews (`/code-review`, `/security-review`,
  `/verify`, design/a11y/brand…). `audit-pr` and `product-audit` reuse this rubric.
- Sits in **Stage 4** of the feature workflow (verification & review).
- `fix-now`/`postpone` outcomes hand off to `plan-fix` / `triage-issue`.

## Done when

- A scoped findings list (Phase 1) and a complete decision table (Phase 2) exist,
  every finding classified with reasoning, each routed — and **no code changed**.
