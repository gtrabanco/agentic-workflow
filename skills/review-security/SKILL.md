---
name: review-security
user-invocable: false
version: 1.0.1
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal security review pass of the agentic-workflow review pack — composed
  in-turn by review-change and product-audit; not a menu entry. Checks secrets,
  input validation, injection, authn/authz, PII exposure, and dependency risk
  on the changed surface. Findings only; never edits code.
---

# Review Security (internal)

Composed by `review-change` / `product-audit` within their conversation — on any
agent, follow this file inline as the routed step. **Findings only; never edits,
never refactors.**

## Scope

The diff or path/glob the caller passes; default the current change vs the
default branch. State the scope at the top of the returned table.

## Checklist (evaluate EVERY item — none is optional; n/a must be stated)

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
✓ New/updated dependencies pinned and free of known-critical advisories (state
  how you checked)
✓ Error responses don't leak stack traces or internal paths
✓ Unsafe deserialization / dynamic evaluation of untrusted data absent

## Return exactly

```
REVIEW SECURITY — scope: <scope>

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
