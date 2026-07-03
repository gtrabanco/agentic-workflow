---
name: review-perf
user-invocable: false
version: 1.0.1
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal performance review pass of the agentic-workflow review pack — composed
  in-turn by review-change and product-audit; not a menu entry. Checks the
  changed paths for algorithmic and resource regressions: N+1s, hot-path
  allocations, asset weight, and leaks. Findings only; never edits code.
---

# Review Performance (internal)

Composed by `review-change` / `product-audit` within their conversation — on any
agent, follow this file inline as the routed step. **Findings only; never edits,
never refactors.**

## Scope

The diff or path/glob the caller passes; default the current change vs the
default branch. State the scope at the top of the returned table.

## Checklist (evaluate EVERY item — none is optional; n/a must be stated)

- ✓ No N+1 query/IO pattern on changed data-access paths (loop bodies issuing
  queries/requests — cite)
- ✓ Algorithmic complexity of new code paths stated where input can grow (an
  unbounded O(n²) on user data is a major finding)
- ✓ No blocking IO/sync work added on hot/request paths where the platform is
  async
- ✓ Resources opened by the change are closed/released on ALL paths including
  errors (files, connections, subscriptions, timers)
- ✓ No unbounded growth introduced (caches without eviction, arrays that only
  append, listeners never removed)
- ✓ Web only: bundle/asset impact of the change stated (new dep size, image
  weight, lazy-loading where the project uses it) — n/a otherwise
- ✓ Repeated computation hoisted where a loop recomputes an invariant (cite)
- ✓ Pagination/limits on any new listing that reads user-scaled data
- ✓ No premature optimization either: complexity added for speed without a
  cited measurement is a finding (the repo forbids overengineering)

## Return exactly

```
REVIEW PERF — scope: <scope>

| # | Finding | Sev | Evidence | Suggested fix |
|---|---------|-----|----------|---------------|
| 1 | <what>  | critical|major|minor | <file:line> | <smallest action> |

Checklist: <n> evaluated, <n> pass, <n> findings, <n> n/a (<which + why>)
Summary: <1-2 sentences>
Decision: PASS | FAIL
```

FAIL if any critical or major finding is open; PASS otherwise. Minor findings
never block — they route to the caller's triage step.

## Done when

- Every checklist item was evaluated with evidence (file:line or command output)
  or explicitly marked n/a with the reason.
- The fixed-format block above is returned — nothing more, nothing less — and
  no code was changed.
