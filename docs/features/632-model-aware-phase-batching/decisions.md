# 632 — model-aware-phase-batching · decisions

Owner-scope decisions live in the unit doc's `## Log` (`D1…D6`), so a reviewer
reads them beside the requirement they answer. This file carries only the
writes the repository's own path-protection floor requires the unit to declare.

## Path-protection records

`**/*.test.*` is a frozen class under the shipped floor
(`packages/pi-agentic-workflow/src/config/path-policy.ts`,
`SHIPPED_PATH_POLICY`), and a pre-freeze `modify` needs a `justification` row
(owner: `skills/orchestration-envelope/references/TURN_CONTRACT.md` §
`path-protection-records@1`, block `path-protection@1`). Every row below is a
test this unit either creates or extends — never a test edited to pass: a
red-first corpus is written before its implementation, and an existing suite
only gains cases.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/phase-batching.test.mjs | P1 | 2026-11-19 | execute-phase | the red-first corpus of the new published contract — the file does not exist before this unit
justification | packages/pi-nan-agentic-workflow/test/phase-batching.test.mjs | P3 | 2026-11-19 | execute-phase | the red-first corpus of the capability record, the policy and the command — the file does not exist before this unit
justification | packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs | P3 | 2026-11-19 | execute-phase | the mirror pin S4 requires: the capability record against the recorded snapshot; additive cases only, no existing assertion moves
justification | packages/pi-agentic-workflow/test/config-schema-phase-batching.test.mjs | P5 | 2026-11-19 | execute-phase | the red-first corpus of the config key — the file does not exist before this unit
```

## Residual promises

`bun scripts/residual-classify.mjs --inventory --base main` classifies every
surface this unit adds. Six files come back `orphan` / `no-plan-claim`: the
classifier resolves a claim from the ledgers, and a new file's consumer is a
relative TypeScript import or a suite that runs it, neither of which it reads
as a claim. Every one of them has a live consumer today — the promise rows say
who, so the classifier resolves instead of guessing (owner:
`skills/unit-lane/references/DESIGN.md` § `residual-promise@1`).

```text
residual-promise@1
surface | consumer | date | owner
packages/agentic-workflow-schema/src/phase-batching.ts | row:632 | 2026-11-19 | issue #632
packages/agentic-workflow-schema/test/phase-batching.test.mjs | row:632 | 2026-11-19 | issue #632
packages/pi-agentic-workflow/test/config-schema-phase-batching.test.mjs | row:632 | 2026-11-19 | issue #632
packages/pi-nan-agentic-workflow/src/phase-batching-command.ts | row:632 | 2026-11-19 | issue #632
packages/pi-nan-agentic-workflow/src/phase-batching.ts | row:632 | 2026-11-19 | issue #632
packages/pi-nan-agentic-workflow/test/phase-batching.test.mjs | row:632 | 2026-11-19 | issue #632
```
