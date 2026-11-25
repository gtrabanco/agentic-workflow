# 698 — ceremony-rule-never-blocks · decisions

Each row is an owner decision this unit's plan rests on (`decision-scope@1`).
Every row here is `unit-only`: the two rules with permanent owners are `IR1`
(the class set has one owner) and `IR11` (a second copy cites its owner), and
both point at `packages/agentic-workflow-schema` and `AGENTS.md`, not at this
ledger.

| id | decision | scope | ground |
|---|---|---|---|
| D1 | The unit is applied **inline** against the frozen ledgers: the §5 freeze is the plan, `review-change`, `audit-pr` and the fold cycle are not run on it, and the repository's deterministic gates are the only ceremony. The operator is the external verifier. | unit-only | the operator's order, quoted verbatim as `## Log` L1/L2; `IR3`/`IR4` still bind (no test is weakened to pass, the new suite lands red first) |
| D2 | `workflow` enters the **one published owning-stage set** (`PRE_EXECUTION_FINDING_CLASSES`), not a new axis and not a second vocabulary. The table's own sentence says `class` names "the owner that repairs it", and the owner of a ceremony defect is the workflow itself — a sixth token is exactly that. | unit-only | S3, S8; `PE-001`; `IR1`/`IR11` |
| D3 | The class/impact coupling is mechanical: a `workflow` row must be `report-only`, and any other impact is refused by the writer. That is what "never lands as an in-unit blocking row" means in a machine, and it keeps the anti-deflation rule from turning a workflow defect into a `BLOCKER`. | unit-only | S3, S8; `PE-002`; `O3` |
| D4 | The repair receipt's marker carries `unit`, `reviewed`, `scope`, `ac` and `gate` in addition to the issue's `sha`/`class` sketch: a consumer that cannot name the unit cannot re-derive the acceptance hash, the findings carrier or the gate proof, and a receipt a consumer cannot re-derive is prose again. Every attribute is validated (40-hex/64-hex/closed token) before it reaches marker bytes. | unit-only | S4; `PE-016`; `O5` |
| D5 | Currency is granted only by `RE-REVIEW-SKIPPED` and `RE-REVIEW-OPTIONAL`; `RE-REVIEW-REQUIRED`, `REPLAN-ROUTE` and `PRODUCT-ROUTE` emit the same typed receipt but grant nothing, and the merge gate keeps today's route. Fail closed is the default, never a silent pass. | unit-only | S4, S9; `PE-008`; `O6`, O7, O9 |
| D6 | The gate-receipt override is bounded: a stale receipt whose judge reported `changedPaths` **all** in the ceremony-bookkeeping class still proves a green gate that ran before bookkeeping moved; a missing, invalid or genuinely red receipt never passes, and `unevaluatable` stays unevaluatable. | unit-only | S4, S6; `PE-004`, `PE-005`; `O8` |
| D7 | The repair receipt is a PR comment, like the review receipt: the forge is the durable carrier both consumers already read, and `emit` posts without committing, which is the prescribed order's "a re-pin that commits nothing". | unit-only | S4, S6; `PE-003`, `PE-008`; `O12` |
| D8 | The non-pass review markers are a **second marker family** (`review-change:fail`, `review-change:needs-decision`), never a reinterpretation of `:pass`: `receiptStatus` keeps meaning "a PASS receipt is current", and the new family is reported beside it. Reusing the pass marker for a failure would make a failed review look green to every existing consumer. | unit-only | S7; `PE-007`; `O11` |
| D9 | The BLOCKED audit receipt is posted by `comment` — the single writer the skill already calls — and re-auditing the same head is idempotent by SHA. `evaluate` keeps printing the verdict and writing nothing, so a read-only audit stays read-only. | unit-only | S5, S7; `PE-006`; `O9`, `O10` |
| D10 | `isCeremonyBookkeeping` is **additive**: `isNonAffecting`, the manifest object and the scope digest do not change, so no published review receipt rotates and no consumer's freshness rule changes. The class is closed and owned in `scope-manifest`, consumed by the repair receipt only. | unit-only | S4; `PE-003`; `O13` |
| D11 | `docs-only` reuses the fold's own test — every file in the delta is Markdown — and `ceremony` is the narrower bookkeeping class. Anything with a source, script, template or config path is `RE-REVIEW-REQUIRED`; no heuristic guesses a class from a path that could carry behaviour. | unit-only | S4; `PE-008`, `PE-017`; `O7`, O13 |
| D12 | No config key ships (`review.max-cycles`/`audit-pr.max-runs` belong to #669's driver): a key no runtime reads is not shipped, and this unit's rule does not need a cap to hold. | unit-only | S4's own bullet (`#669`); `## Non-goals` |
| D13 | The duplicate #698 roadmap row is repaired **through the writer**, never by a hand edit: `roadmap rowUpsert` updates the row readers keep and splices the earlier duplicate, so the table ends with one row and the hand-owned cells stay owned. The fact that the duplicate existed (and which commits made it) is disclosed in `## Log` E0. | unit-only | `## Log` E0; `PE-015`; `packages/agentic-workflow/src/edit/Roadmap.mjs` (`rowUpsert`'s duplicate splice) |

## Open questions

The ledger the `needs-input` sensor reads (`open-questions@1`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`). None is open: the
one design point the issue left unparked (the anonymized bundle) is #703's
declared surface (`## Non-goals`), and the class-derivation ambiguity is resolved
by D11 with the fold's own test.
