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

