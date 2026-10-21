# Decisions — unit 36 (verification-contract-hygiene)

Gap interview 2026-10-18: no expensive-to-undo blocking gap remained — the
request (issue #183) is precise, and the repo state answers the only scope
question. Cheap defaults recorded below as explicit decisions, never silent.

| date | decision | why | alternatives considered |
|---|---|---|---|
| 2026-10-18 | Issue item 3 (run-log machine-comparable result field) is **out of scope as re-work** — verified as already shipped by feature 55 (roadmap row 55 records "absorbs #183's fixture metric row"; `scripts/golden-fixture.test.mjs` enforces the closed Result grammar with cutoff 2026-09-18). The unit re-verifies it (AC6), it does not re-implement it. | The repo already answers it; re-implementing would duplicate a shipped, tested surface. | Re-touch GOLDEN_FIXTURE.md — rejected: would break the "no surface overlap with feat 55" hygiene intent. |
| 2026-10-18 | Template mirror home for both rules = `template/docs/fix/_TEMPLATE/SPEC.md` `## Acceptance` section. | The issue named "template/ (ACCEPTANCE/validator rule mirrors)" but ACCEPTANCE.md templates no longer exist (unit-doc consolidation); the fix template's Acceptance section is the surviving validator mirror (PE-002). | Mirror in the features SPEC template — rejected: it carries no validator wording to extend; adding new wording there would exceed the issue's scope. |
| 2026-10-18 | Property/fuzz sentence homes: `verification-contract` § Artifact (planner-facing, beside the commands-row context) + fix-template Acceptance section (validator-facing), exactly the issue's "one sentence each". | Matches the issue's affected-surfaces list verbatim. | A new reference file — rejected: no new surface for two sentences. |

## Prior-decisions contradiction sweep (plan step, 2026-10-18)

Candidate sources swept: this unit's `decisions.md`, feat 19/26 decision files,
`AGENTS.md`, frozen NRS (`docs/workflow/REPOSITORY_STATE.md`), roadmap rows 36/55.

| claim | prior decision | source path | relation |
|---|---|---|---|
| property/fuzz rides the existing `commands` class — no new validator kind | validator kinds are closed in the authoritative schema validator; runtime behavior is not loosened by projection changes | `docs/features/26-staged-verification-contracts/decisions.md:15-29` | compatible |
| wording growth ⇒ minor/patch bump only for `verification-contract` | no majors until #176 merges (freeze) | `AGENTS.md` (Version every change) + roadmap row 36 note | compatible |
| the run-log Result grammar surface is re-verified, never re-implemented | feature 55 owns that surface and absorbed #183's item 3 | `docs/features/ROADMAP.md` row 55 | compatible |

No `contradicts` row — the plan proceeds without a `NEEDS-DECISION`.

### Prior-decisions contradiction sweep (replan, 2026-10-19)

Swept for the fold phases P5–P12 against the same candidate sources plus the
cycle-3 routes:

| claim | prior decision | source path | relation |
|---|---|---|---|
| the router must refuse close-out for a unit whose index status is not `done`/`absent` (F31) | the hand-off names exactly one phase and the execution tier — never a bare close-out for an unsettled unit (#291 AC3/AC4) | `scripts/unit-route.mjs:742-745` comment + `main` router behavior | compatible |
| the unit doc's Evidence table is the acceptance receipt's declared owner (F34) | `execute-phase` names the unit doc's Evidence rows the receipts; ACCEPTANCE.md is gone | `skills/execute-phase/SKILL.md:13-15` | compatible |
| exported templates state the validator bound without repo-specific nouns (F37) | stack/architecture agnostic — no product, stack, or runtime references in shared docs | `AGENTS.md` (Working rules) | compatible |

No `contradicts` row — the replan proceeds without a `NEEDS-DECISION`.


## Path-protection escape records

Append-only rows the Tier 1 checkpoint gate verifies (the `path-protection-records@1` grammar in the turn contract). Recorded at the cycle-9 fold (F80): the unit's plan predates the policy, so its declaration block is absent and `freeze-after` resolves to `n/a` — the gate then always requires `approval`, whose second half the owner supplies.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/ledger-provenance.test.mjs | P12 | 2026-10-20 | execute-phase | F80 (cycle-9 fold, the queue's only `high` row) adds the regression case that first demonstrates `--check` passing an annotated ledger whose citations it never reads: `folded` cells carry `yes · fold <sha>`, so every row parses `open` and the tool validates nothing; the test appends to the file, touches no existing expectation, and pins that an ancestor-checked token is read and that a dangling/foreign citation fails the check. Guardrail 3 of `fold-findings` requires the red test first for a behavioral finding.
```
