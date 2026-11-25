---
name: review-security
user-invocable: false
version: 5.0.0-canary.20261125.1
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal security review pass of the agentic-workflow review pack — composed
  in-turn by review-change and product-audit; not a menu entry. Checks secrets,
  input validation, injection, authn/authz, PII exposure, and dependency risk
  on the changed surface. Findings only; never edits code.
---

# Review Security (internal)

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

✓ No secrets/credentials/tokens in code, config, tests, or fixtures (grep the
  diff for key-like strings)
✓ Every external input on the changed paths is validated/sanitized before use
✓ No injection vectors (SQL/command/path/template) — parameterized/escaped,
  never concatenated
✓ AuthN/AuthZ enforced on every new/changed endpoint or entry point (cite
  where)
✓ No PII or secrets written to logs/error messages on the changed paths
✓ Webhooks/callbacks verify signatures before processing
✓ Rate limiting / abuse controls considered where a new public surface appears
  (n/a if none)
✓ New/updated dependencies pinned and free of known-critical advisories — run
  `runner dependency-advisory-pass` (node fallback if bun is not
  installed) and cite the row it prints for a dependency this change **adds or
  updates**: a `blocking` row is a finding, a `report-only` row is a report-note,
  and a pre-existing advisory on an untouched dependency is never a finding here
  — the baseline-advisory rule, owner `review-implementation` (`CLASSIFY.md`
  §Severity ladder)
✓ Error responses don't leak stack traces or internal paths
✓ Unsafe deserialization / dynamic evaluation of untrusted data absent

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
REVIEW SECURITY — scope: <scope>

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
