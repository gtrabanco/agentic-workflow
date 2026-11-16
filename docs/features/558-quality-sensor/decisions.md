# Decisions — feature/558-quality-sensor

Path-protection records (`path-protection-records@1`). `**/*.test.*` is a
protected path, so every edit below the test surface carries the justification
the checkpoint gate reads. The rows below fix a fixture the change itself wrote,
before it ever ran green: the canonical vector declared an `unavailable` row whose
reason named a degradation the document did not list, which is exactly the
inconsistency the validator exists to refuse. No assertion is relaxed, removed or
narrowed, and no expected value moves.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/quality-metrics.test.mjs | P1 | 2026-11-16 | execute-phase | The canonical fixture's `degraded` list gains the `unavailable-findings-corpus` code its own `escaped_defects.reason` already names, so the accepted vector is internally consistent; the two cases that depend on it (the canonical acceptance and the null-source-revision acceptance) keep every assertion unchanged
```

## Why the fixture moved, and why it is not a test relaxation

The contract's rule is that an `unavailable` row may only name a degradation the
document declares. The corpus-absence case is a real degradation, so the code
belongs in `degraded`; the fixture was wrong, not the rule. The alternative —
loosening the rule so a row could name an undeclared failure — would be the
defect this unit's S12 exists to prevent.
