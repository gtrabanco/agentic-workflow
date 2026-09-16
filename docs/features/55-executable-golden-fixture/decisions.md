# decisions — 55-executable-golden-fixture

> Product-stage decision log and evidence rows. Written by `design-feature`
> (2026-09-17). The SPEC carries the decisions in summary; this file carries
> the full rows with their evidence.

## Decision log

| ID | Decision | Alternatives considered | Rationale |
|---|---|---|---|
| D-55-1 | Fixture home: `scripts/fixtures/golden-fixture/` | `tests/fixtures/golden-fixture/` (new top-level dir) | Matches the `scripts/fixtures/unit-route/` committed-toy-repo precedent; no new top-level dir; keeps the fixture out of the human-docs surface (#230 item 1). User-selected 2026-09-17. |
| D-55-2 | `docs/workflow/GOLDEN_FIXTURE.md` slims to purpose + ~100-word judgment protocol + run log + pointers | Keep the 383-line doc intact and add the fixture dir beside it (duplication) | #230's "short manual protocol in the run-log doc"; a second live copy of the toy SPEC would fork the fixture — the committed files become the single source. User-selected 2026-09-17. |
| D-55-3 | Both toy trees committed: executor CSV fixture AND audit-evidence target | Executor CSV only (audit target stays described in doc prose) | The four trap invariants (worklist lag, ADR terminal item, prior finding, aggregate tail) are deterministic file facts; committing the tree makes the manual product-audit run replayable from bytes. User-selected 2026-09-17. |
| D-55-4 | Run-log Result field: test-enforced closed grammar | Free-text Result column | #230 absorbs #183's "machine-comparable result field"; without enforcement, run-over-run comparison stays qualitative — the exact gap #183 names. User-selected 2026-09-17. |
| D-55-5 | Traceability: #230 closed in error (never absorbed by 59); this SPEC is #230's product definition under roadmap row 55; no forge-state action taken by the design turn | Reopen #230 in this turn; post a corrective comment | Forge state is owner-owned; the roadmap row summary + this file carry the correction. Owner statement 2026-09-17: "#230 wasn't absorbed by feature 59". |
| D-55-6 | Grammar `exact <n>/<n> · invented none|<k> · shape ok|<fail-code>`; cutoff date 2026-09-18; rows dated earlier are grandfathered verbatim | Enforce on all rows (would fail on 30+ historical free-text verdicts); migrate history (rewrites evidence) | Historical rows are evidence, not data to migrate; a dated cutoff is deterministic where a content heuristic is not. |
| D-55-7 | Suite determinism constraints: no network, no wall-clock, no randomness, no model in the mechanical loop | Allow bounded network/time | Golden-master practice (ApprovalTests) + Fowler's non-determinism quarantine rule; #183's anti-flakiness grounding (arXiv:2505.06177) documents harness degradation under drift — a fixture that flakes re-fails frozen criteria with zero changes. |

## Evidence rows (product stage)

| id | claim | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|
| PE-1 | The golden fixture is a test, not human-readable documentation; the owner approved superseding feature 12's docs-only "no runnable script" constraint | forge | https://github.com/gtrabanco/agentic-workflow/issues/230 (fetched 2026-09-17) | issue body @ 2026-09-16 | current | proven | — |
| PE-2 | #230 was closed as "absorbed into feature 59" but the merged roadmap kept row 55 at `idea`; 59's decisions record the owner restoring the executable-fixture scope to row 55 | repository + forge | `docs/features/59-executable-continuations/decisions.md` (scope-reconciliation rows); `gh api issues/230` close comment; `ROADMAP.md` row 55 | main @ `2264b454` (2026-09-16) + owner statement 2026-09-17 | current | proven | — |
| PE-3 | #183's item 3 (machine-comparable run-log result field) routes to this feature; items 1–2 stay with feature 36 | forge | https://github.com/gtrabanco/agentic-workflow/issues/183 (fetched 2026-09-17) | issue body @ 2026-09-07 | current | proven | — |
| PE-4 | The mechanical halves asserted here are real, merged tools: `phase-lint.mjs` (byte-stable stdout, exit semantics), schema runtime loader, committed-fixture test precedent | repository | `scripts/phase-lint.mjs` header (usage/exit contract); `scripts/schema-runtime.mjs` exports; `scripts/fixtures/unit-route/` + `scripts/continuation-discipline.test.mjs` | main @ `2264b454` | current | proven | — |
| PE-5 | Snapshot/golden-master discipline: expected outputs are committed artifacts reviewed in code review; a mismatch means fix-or-deliberate-re-pin, never silent regeneration | web | https://jestjs.io/docs/snapshot-testing (fetched 2026-09-17) | Jest 30.5 docs | current | proven | — |
| PE-6 | Approval tests = "Golden Master Tests", an alternative to asserts, suited to structured output with many fields | web | https://raw.githubusercontent.com/approvals/ApprovalTests.cpp/master/README.md (fetched 2026-09-17) | README @ master, 2026-09-17 | current | proven | — |
| PE-7 | Non-deterministic checks must be quarantined; regression suites must be deterministic (isolation, no time/random/remote causes) | web | https://martinfowler.com/articles/nonDeterminism.html (fetched 2026-09-17, HTTP 200) | article @ 2026-09-17 | current | proven | — |
| PE-8 | The current doc is 383 lines with the toy SPEC/manifest/audit-target embedded; run log holds 30+ dated rows incl. FAILs that drove wording fixes | repository | `docs/workflow/GOLDEN_FIXTURE.md` (heading map + run log) | main @ `2264b454` | current | proven | — |

## Open offers

- Seed `docs/CAPABILITIES.md` from the derived inventory recorded in the SPEC's
  Integration closure (deferred; see SPEC Deferred decisions).

## Opportunistic fixes (this unit's PR)

| Date | Finding | Class | Fix |
|---|---|---|---|
| 2026-09-17 | `ROADMAP.md` row 40 linked `pull/240` as feature 40's PR — a dangling forward reference (no PR #240 existed; feature 40's real PR is #235, merged). This unit's own PR then took number 240, making the stale link actively misleading. | Opportunistic Fix (1 line, same file the unit already touches, verified via `gh pr view 235`) | Row 40 status cell now links `#235`. |
