# Review & classify — `review-implementation`

When and how to use the two-phase, **no-refactor** review that ends in a
**classified decision table**. The full spec lives in the skill
(`.claude/skills/review-implementation/SKILL.md`); this is the practical
when/how.

## When to use it

- **Stage 4 of the feature workflow** — over the completed branch, right before
  opening the PR.
- **Mid-feature**, when you want a triaged read of what's wrong and what to
  actually do about it (not just a flat bug list).
- Whenever you'd otherwise run your two manual prompts — *"review for X, Y, Z —
  findings only"* then *"classify those findings into a decision table"*. This
  skill collapses both into one pass.
- Before a release cut or after a large refactor.

**Not for:** actually fixing code (it never refactors), or routine
type/test/build gating — that's the project's verification gate (type-check,
tests, build).

## How to invoke

- `/review-implementation` — defaults to the **current branch diff vs `main`**.
- Pass a path/glob to widen or narrow scope, e.g. *"review-implementation on
  src/payments/"*.
- It prints the **scope** at the top, so you know what was and wasn't covered.

## What it produces (two phases, no refactor)

**Phase 1 — Find.** Findings (id + `file:line` + evidence) across: bugs,
architecture violations, removable/dead code, security/cybersecurity,
platform/runtime incompatibilities, overengineering & premature optimization,
bundle-size risk, and tests (failing **and** missing) — plus any project-rule
violations (whatever the project's docs mandate).

> **Dead-code exception:** code intentionally staged for an in-progress or
> planned feature is **not** dead. The skill cross-checks the roadmap, the
> feature SPEC/`TASKS.md`, and `known-issues.md`; if it can't tell, it marks the
> finding *verify* and asks — it never asserts "dead" on a guess.

**Phase 2 — Classify.** Every finding lands in a decision table:

| Finding | Axis | Sev | Class | WHY | Impl risk | Long-term impact | Premature-opt? | Route |
|---|---|---|---|---|---|---|---|---|
| Unbounded query on hot path | perf | low | postpone | Negligible now | Low (cache) | Grows with data | no | issue + trigger |
| Helper duplicated in 2 files | maintainability | low | intentional-tradeoff | Coupling 2 features is worse | — | Near-zero divergence | no | document in code |
| Secret committed to a config file | security | high | fix-now | Credential exposure | Low (move to secret store) | Incident risk | no | draft-fix-spec |
| New module without tests | tests | med | fix-now | Untested failure path | Low | Regression risk | no | fold into phase |

Classes: **fix-now / postpone / ignore / intentional-tradeoff**.

## What you do with the output

- **fix-now** → `draft-fix-spec` → `execute-phase --fix` (or fold into the
  current feature phase if it's unmerged work).
- **postpone** → open a tracked issue **with a trigger**; `triage-issue` owns it
  thereafter. Do **not** implement inline.
- **intentional-tradeoff** → document it (code comment, `decisions.md`, or an
  issue) so it isn't re-flagged next review.
- **ignore** → note the rationale; no action.

## Where it sits

Stage 4 (verification & review), alongside `/code-review`, `/security-review`,
`/verify`. It adds the **classification + project-aware axes** those don't, in
one pass. Routes into `draft-fix-spec` (fix-now) and `triage-issue` (postpone).
