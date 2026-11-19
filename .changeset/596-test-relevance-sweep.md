---
"@gtrabanco/agentic-workflow-schema": minor
"product-audit": minor
"unit-lane": minor
---

feat(596): obligation tags per suite, and the gate that refuses a stale one

The workflow could answer *which tests can this change affect?* and not *which
tests justify their cost?* — so the only cheap answer left was line coverage,
which measures at roughly zero correlation with fault detection once suite size
is controlled.

Every root suite now declares, at its head, the surface it protects and the
obligations its assertions cover there:

    // test-obligation: protects=<path>… obligations=<kind>…

The obligation values are a new published closed set — `TEST_OBLIGATION_KINDS`
(`contract`, `failure-path`, `boundary`, `distribution-contract`,
`fixture-support`, `convention`) — exported from the schema package and owned by
the `test-obligation-tag@1` block in the tests-step reference.

`scripts/test-obligation-tags.mjs` is the gate: it refuses an untagged suite, a
declaration that is not at the head, an empty or half declaration, a value
outside the closed set, and a tag whose protected surface no longer exists. That
last refusal is the maintenance rule — "the surface is gone, so the test goes"
is now detectable on every push instead of re-derivable at every audit, and the
audit's test-surplus sweep reads the tags as its dead-surface evidence.

`--sweep` is the report mode: it clusters the tags by protected surface, labels
the obligation-level duplicates (same surface, same obligation set — never line
coverage), and ranks clusters by measured cost per obligation value using the
root gate's own `PASS <file> (N.Ns)` lines. The deterministic result is the
suspect list a selective kill-rate runs on, capped at five clusters on purpose:
an exhaustive mutation sweep was already rejected on measured cost.

The targeting half (`scripts/test-impact.mjs`) is untouched.
