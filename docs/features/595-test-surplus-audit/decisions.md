# Decisions — feature/595-test-surplus-audit

> The unit's decision log and declared geography. The two fenced blocks below are
> the versioned shapes `skills/orchestration-envelope/references/TURN_CONTRACT.md`
> publishes (`path-protection-plan@1`, `path-protection-records@1`); they are
> append-only, and a later phase appends, never rewrites.

## Why this unit touches a test file

The change is prose, and the one file under `scripts/` is a **pin**, not a
producer: it reads the two product-audit references and refuses a rewrite that
drops a rule. The test-file class is `freeze: true` in the shipped policy, so
creating it pre-freeze needs no record and every later modification needs a
`justification` row. Both are declared here.

## Path protection

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
created | scripts/product-audit-surplus.test.mjs | the prose pin for the surplus direction — reads committed bytes, imports no package, dispatches through the root suite
```

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/product-audit-surplus.test.mjs | P2 | 2026-11-17 | execute-phase | the suite lands red first and is corrected to the prose it pins; no assertion is relaxed to pass, and the regression cases are the ones that must keep passing
```

## Decisions

- **D-A — one owner for the surface.** `test-surplus-grammar` is declared in
  `AGENTS.md#normative-surfaces@1` and claimed by exactly one gate-inventory row,
  the drift gate's own (`normative-surface-grammar`). The unit's new
  `test-surplus-audit` row claims no surface id: it names the rule's owner and the
  suite that carries it, which is the shape #590 shipped for `coverage-gap-grammar`.
- **D-B — the receipt rides the health line.** The audit report already puts one
  verdict per dimension in `## Health by dimension`, so `verified: no surplus
  tests` is that line's content instead of a new report section: the report's fixed
  format grows no field, and an audit that skipped the sweep cannot write the row.
- **D-C — no new class vocabulary.** The surplus direction adds a *check*, so the
  finding keeps the published class set and the residue sweep's `fix-now (delete)`
  notation; `packages/agentic-workflow-schema/` stays untouched.
