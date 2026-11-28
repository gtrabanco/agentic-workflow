---
name: review-brand
user-invocable: false
version: 5.0.0-canary.20261128.1
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal brand & copy review pass of the agentic-workflow review pack — composed
  in-turn by review-change and product-audit; not a menu entry. Checks changed
  user-facing copy against the project's brand doc: voice, terminology, and
  honesty of claims — applies only to surfaces with user-facing text. Findings
  only; never edits code.
---

# Review Brand & Copy (internal)

Review-pack pass: follow this file inline as the routed step — findings only,
never edits, never refactors (identity and guardrails owned by
`skills/review-implementation/references/FINDER_CONTRACT.md` §Pass identity).

## Scope

Owned by `skills/review-implementation/references/FINDER_CONTRACT.md` (§Scope):
read it before the checklist and apply it as written, stating the scope at the
top of the returned table. Missing reference → STOP.

## Checklist

The tally this pass returns is the contract
`skills/review-implementation/references/FINDER_CONTRACT.md` §Checklist discipline
owns: `evaluated` equals this list's item count, every item carries evidence or an
`n/a` with its reason, and `pass + findings + n/a` equals it.

- ✓ Read the project's brand doc first (e.g. `docs/brand/BRAND.md`) — cite the
  rule for every finding; n/a all items if the project has none and say so
- ✓ Tone of changed copy matches the declared voice (cite the guideline violated)
- ✓ Product/domain terms used consistently with the declared glossary (same
  concept, same word, same capitalization)
- ✓ No forbidden/deprecated phrases from the brand doc
- ✓ Claims are honest: limits, restrictions, and reductions the code enforces
  are disclosed in the copy (an undisclosed limitation is a `WARNING` finding —
  repo hard rule)
- ✓ Error/empty-state copy is actionable (says what happened and what to do),
  not blame-y
- ✓ Consistency across the changed surface and its siblings (same action
  labeled the same way everywhere)
- ✓ Placeholder/lorem text absent from the diff

## Materiality bar

Owned by `skills/review-implementation/references/FINDER_CONTRACT.md`
(§Materiality bar): read it before the checklist and apply it as written — cite the rule it violates beside the evidence; never pad the table.
Missing reference → STOP.

## Return exactly

`Sev` and `Impact` are the two published closed sets (`BLOCKER | CRITICAL |
WARNING | SUGGESTION` and `blocking | docs-only | report-only`); their meanings
are owned by `review-implementation` (`CLASSIFY.md` §Severity ladder) — assign a
token, never a prose grade.

```
REVIEW BRAND — scope: <scope>

| # | Finding | Sev | Impact | Evidence | Suggested fix |
|---|---------|-----|--------|----------|---------------|
| 1 | <what>  | BLOCKER|CRITICAL|WARNING|SUGGESTION | blocking|docs-only|report-only | <file:line> | <smallest action> |

Checklist: <n> evaluated, <n> pass, <n> findings, <n> n/a (<which + why>)
Summary: <1-2 sentences>
Decision: PASS | FAIL
```

FAIL if any `BLOCKER`, `CRITICAL` or `WARNING` finding is open; PASS otherwise.
`SUGGESTION` findings never block — they route to the caller's triage step.

## Done when

- Every checklist item was evaluated with evidence (file:line or command output)
  or explicitly marked n/a with the reason.
- The fixed-format block above is returned — nothing more, nothing less — and
  no code was changed.
