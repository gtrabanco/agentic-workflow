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
- **D-D — the external verify's advisories, triaged.** A1–A3 and the three
  same-class siblings the batch swept up (PE-002's `:392/:376`, PE-003's
  `:88/:209/:390+`, PE-014's `→ 0`) are corrections of samples that were false at
  the cut: the ledger freeze protects `status` and outcome-laundering, not a
  sample that never reproduced — each cell now names the true binding, recorded
  in E11. A4's `4923 est` never held at its own commit (the same commit's SL-04
  citation fix shrank the reference): fixed by re-measurement, `referenceEstimateMax`
  5416 → 5399 = ceil(4908 x 1.10), with a new `referenceSources` entry — the
  manifest's history is append-only, so fix 440's older entry still stands. A5 is
  folded by the main integration: the shared-doc driver's mark promise did not
  materialize (the worktree was byte-identical to our side), so the union was
  hand-built from the three stages and the pins re-measured on the merged tree.
  Unit 590's PE-010-class cell (true at cut, stale later) stays frozen — not this
  batch's.
