---
name: review-seo
user-invocable: false
version: 5.0.0-canary.20261126.1
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal SEO review pass of the agentic-workflow review pack — composed
  in-turn by review-change and product-audit; not a menu entry. Checks changed
  web pages/routes for indexability, metadata, and structured data — applies
  only to public web surfaces. Findings only; never edits code.
---

# Review SEO (internal)

Review-pack pass: follow this file inline as the routed step — findings only,
never edits, never refactors (identity and guardrails owned by
`skills/review-implementation/references/FINDER_CONTRACT.md` §Pass identity).

## Scope

Owned by `skills/review-implementation/references/FINDER_CONTRACT.md` (§Scope):
read it before the checklist and apply it as written, stating the scope at the
top of the returned table. Missing reference → STOP.

## Checklist

The tally is `skills/review-implementation/references/FINDER_CONTRACT.md`
§Checklist discipline's contract: `evaluated` equals this list's item count, and
`pass + findings + n/a` equals it — a count above the item count is fabricated.

- ✓ Read the project's SEO doc first (e.g. `docs/frontend/SEO.md`) — n/a all
  items with the reason if the product has no public web surface
- ✓ Every new/changed public page has a unique title and meta description
  within the project's declared lengths
- ✓ Canonical URL correct on new/changed routes (no accidental duplicates)
- ✓ Indexability intended = indexability actual (robots/noindex/sitemap state
  matches the page's purpose)
- ✓ One h1 per page; heading levels don't skip
- ✓ Structured data valid for the content type the project declares (cite the
  validator output when run)
- ✓ Links crawlable (real hrefs, not click handlers) on changed navigation
- ✓ Images on changed pages have descriptive filenames/alt where the SEO doc
  requires
- ✓ No render-blocking regression for primary content (content present without
  JS where the project declares SSR/SSG)

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
REVIEW SEO — scope: <scope>

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
