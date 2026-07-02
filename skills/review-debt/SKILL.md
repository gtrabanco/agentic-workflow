---
name: review-debt
user-invocable: false
version: 1.0.0
model: sonnet
effort: medium
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal tech-debt review pass of the agentic-workflow review pack — composed
  in-turn by review-change and product-audit; not a menu entry. Inventories
  shortcuts, duplication, stale abstractions and missing coverage on the
  changed surface, each with a re-trigger condition. Findings only; never
  edits code.
---

# Review Tech Debt (internal)

Composed by `review-change` / `product-audit` within their conversation — on any
agent, follow this file inline as the routed step. **Findings only; never edits,
never refactors.**

## Scope

The diff or path/glob the caller passes; default the current change vs the
default branch. State the scope at the top of the returned table.

## Checklist (evaluate EVERY item — none is optional; n/a must be stated)

✓ Every TODO/FIXME/HACK in the diff is inventoried (file:line + what it defers)
✓ Duplicated logic across the changed files and against existing helpers (cite both sides)
✓ Stale/orphaned abstractions the change leaves behind (a port with one adapter, a config no one reads)
✓ Dead code left by the change (replaced-but-not-removed paths)
✓ Complexity hotspots introduced (functions past ~40 lines or 3+ nesting levels — cite)
✓ Missing tests for behavior the change adds/alters (name the untested path)
✓ Workarounds that depend on external fixes (pin the upstream issue if known)
✓ Every finding carries a TRIGGER: the condition under which it must be paid (e.g. "3rd consumer appears", ">100k rows") — a debt item without a trigger is itself a finding

## Return exactly

```
REVIEW TECH DEBT — scope: <scope>

| # | Finding | Sev | Evidence | Suggested fix |
|---|---------|-----|----------|---------------|
| 1 | <what>  | critical|major|minor | <file:line> | <smallest action> |

Checklist: <n> evaluated, <n> pass, <n> findings, <n> n/a (<which + why>)
Summary: <1-2 sentences>
Decision: PASS | FAIL
```

For this pass, the Suggested fix column carries the TRIGGER — the condition
under which the debt must be paid — alongside the smallest action.

FAIL if any critical or major finding is open; PASS otherwise. Minor findings
never block — they route to the caller's triage step.

## Done when

- Every checklist item was evaluated with evidence (file:line or command output)
  or explicitly marked n/a with the reason.
- The fixed-format block above is returned — nothing more, nothing less — and
  no code was changed.
