# Planning findings — 30-repair-receipt-delta-review

One stage-aware table, both stages; reviewers append rows, only the stage's
author resolves. Row shape per `pre-execution-review/references/LEDGERS.md`:
`finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision`

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| F1 | spec | info | product | 42c0091e965f62f27bacfd4bae73dbc9f8a9610725092e2fea9a5bb39728b6d3 | The SPEC deviates from governing issue #170's receipt design (issue: receipt "persisted with the ledger tick", batch-class vocabulary `behavioral-high\|behavioral-med\|docs-only`, three route values) without a dated amendment on the issue; the deviation is recorded in-SPEC as user-accepted decisions D30-1/D30-3 and adds a fourth branch (`REPLAN-ROUTE`) the issue's non-goal "no new vocabulary beyond the receipt block and the three route values" does not include | SPEC.md IS-2/IS-3 + Out of scope; decisions.md D30-1/D30-3 2026-09-07; forge issue #170 body §1 "persisted with the ledger tick" and §Non-goals | open | — | — |
| F2 | spec | info | product | 42c0091e965f62f27bacfd4bae73dbc9f8a9610725092e2fea9a5bb39728b6d3 | Expectation row 13's pointer (AC-10) does not itself assert that the REPAIR-RECEIPT survives the handoff to the outer driver unchanged; the guarantee is carried in effect by AC-01's verbatim text pins of the fixed block, consistent with the repo's wording-pin convention | SPEC.md `### Expectation sweep` row 13 vs AC-01/AC-10; decisions.md D30-3 (printed block) | open | — | — |
