# Decisions — feat/644-substrate-gap-alarm

Decision log for this unit. The frozen decisions live in the unit doc's
`## Log`; this file carries the open-question ledger, the decision log, and the
path-protection records the protected-path gate reads. Append-only — the ledger
grammar is owned by
[`skills/orchestration-envelope/references/TURN_CONTRACT.md`](../../../skills/orchestration-envelope/references/TURN_CONTRACT.md)
(`open-questions@1`, `path-protection-records@1`) and the crate's readers.

## Open questions

No question is open: the issue is fully specified and its one soft relation
(#643) is merged. The block stays because the dispatcher reads this file and a
ledger without its own header fails closed — an empty ledger is a statement, not
a malformed one.

```text
open-questions@1
id | date | type | question | blocks | search-receipt | options | route
```

## Decision log

| ID | Decision | Alternatives considered | Rationale |
|---|---|---|---|
| D-644-1 | The unit's home is `docs/features/644-substrate-gap-alarm/`, not `docs/fix/…` | `docs/fix/644-substrate-gap-alarm/` (rejected: `docs/ROADMAP.md:196` — a hand-owned cell — already names `features/644-substrate-gap-alarm/SPEC.md` as this unit's doc, and the issue carries `feature` + `promoted`) | The roadmap index is the state that decides where a unit lives; creating a fix folder would leave the index pointing at a missing doc, which is the drift `audit-docs` reports |
| D-644-2 | A substrate route is qualified: the ledger cell reads `init-workspace:<class>` and the dispatcher verifies the claim against the workspace census. A bare `init-workspace` fails closed as `unknown-route` | A bare route token the lane chooses freely (rejected: with no class there is nothing to check, so the scaffold route would become an escape hatch from any hard question — the exact defect S3 names); letting the dispatcher *derive* the class from the question's prose (rejected: that is inference, and prose is not machine-readable) | S3 asks for structural detection. A claim the machine can falsify is structural; a claim it must believe is not. The refusal direction matters as much as the confirmation: `substrate-present` makes "route around an owner that exists" impossible |
| D-644-3 | The census reads the four surfaces the engineering interview already declares as their `lands-in` slots: `docs/architecture/ARCHITECTURE.md`, the charter's `Decision records` and `API posture` slots, and the guide's `Documentation map` | Inventing new homes (a `docs/architecture/DECISIONS.md` and a `docs/CONTRACTS.md` the template does not ship) | `interview-bank@1` already asks ARC-01/02, DEC-01 and API-01 and names where each answer lands. Reading those slots means the gate checks answers the scaffold already collected, and adding a home would create a second owner for the same fact |
| D-644-4 | The census is one module (`src/runner/sensors/substrate.mjs`) shared by the dispatcher and by `substrate check` | Two readers (a verification path and a gate path) | One definition, one drift surface. The dispatcher verifies a route with the same bytes the install gate reports |
| D-644-5 | The route and class sets are published by the schema package (`NEEDS_INPUT_ROUTES`, `SUBSTRATE_CLASSES`) and imported by the runner; no schema *version* changes and no envelope field is added | Keeping the literal in the dispatcher (rejected: `vocabulary-residency@1` — a closed vocabulary a published contract names is owned by the schema) | The vocabulary grows without touching the envelope, so the change is a const + consumer + grammar-block edit in one PR, exactly as the residency invariant states |
| D-644-6 | A *declined* class keeps the scaffold route open; only a *present* surface refuses it | Refusing a declined class too (rejected: a decline is a recorded, reversible decision made ask-first; a question that reveals the decline was wrong must be able to reopen it) | The census's own vocabulary already distinguishes the three states, so the route can honour them instead of collapsing two of them |
| D-644-7 | The evidence-staleness rule ships as prose (`evidence-staleness@1`) with the lint candidate recorded in `## Future`, not as a script | Shipping the lint now (rejected per S5's receipt-neutrality clause) | One measured case (#643's stale header) is a corpus; a gate needs a class. The re-trigger condition is recorded on the row |

## Path protection

The plan declaration lives in the unit doc's `## Tasks` section; this file
carries the *records* that override it. Both changed test files are
`**/*.test.*`, so the policy's `test-file` class applies (`freeze: true`,
pre-freeze `modify` → `justification`).

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/substrate.test.mjs | P2 | 2026-11-19 | execute-phase | The red commit's own correction, before any implementation existed: the "complete install exits 0" control asserted the evidence cell as a single `\S+` token, while the contract the block publishes is "the row names the surface it read" — and two of the four surfaces are charter slots whose evidence is `AGENTS.md § Project charter · Decision records`. The assertion now requires a present state and a non-empty evidence cell; no other assertion is relaxed, skipped, narrowed or deleted, and the case still fails if the state or the evidence is wrong.
justification | scripts/substrate.test.mjs | P5 | 2026-11-19 | execute-phase | Second correction in the same suite, still before the implementation's first green: the vocabulary pin demanded the `open-questions@1` block list all four substrate-class tokens, which asks a published grammar to restate a vocabulary whose single home is the schema const — the opposite of the residency rule it was meant to protect. The assertion now requires the block to *cite* its owner (`schema-export:SUBSTRATE_CLASSES`) and keeps the exact per-token comparison against the schema const itself (the dispatcher imports it). The route tokens are still compared token-by-token, because the block's `route:` line is that vocabulary's published ordering.
justification | packages/agentic-workflow/test/runner.dispatch.test.mjs | P3 | 2026-11-19 | execute-phase | One token is added to the exact dispatch-order list — `substrate`, after `needs-input` — because the table gained that command and the list is the surface's own registry, not a behaviour being asserted about anything else. The message beside it already says the list is "the shell-visible half of the runner"; it stays exact, so a command that lands without a row here still fails.
justification | scripts/needs-input.test.mjs | P2 | 2026-11-19 | execute-phase | The suite gains the eight `#644` route cases (substrate confirmed, refused on an owned surface, declined, bare route, unknown class, no discoverable workspace, `--workspace` re-point, and the lazy-census control). Every existing case is untouched: the 34 pre-existing assertions still run, and the two that now pass for a different reason (the refused routes) keep asserting the same fail-closed exit and reason.
justification | packages/agentic-workflow/test/cli.surface.test.mjs | P2 | 2026-11-19 | execute-phase | One assertion is appended — the bin dispatches `substrate` — in the same shape the file already uses for `provision`. It is the red case for the new subcommand: it failed on the base head because the bin's dispatch table did not name `substrate`. Nothing existing is changed.
```
