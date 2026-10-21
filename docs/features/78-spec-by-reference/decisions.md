# Decisions — unit 78 (spec-by-reference)

The question ledger (`open-questions@1`, the grammar `scripts/needs-input.mjs`
reads), the resolutions the decide stage recorded, and the assumptions taken
instead of asking. Append-only: a superseded entry gets a new row naming it.

open-questions@1
id | date | type | question | blocks | search-receipt | options | route
Q1 | 2026-10-21 | open-question | Section-set strategy for the re-cut: does this unit ship the full re-cut plus the mirrored schema change (the machine accepts both the current and the new shape), or honor #308's non-goal and leave `## Evidence` / `## Progress log` in the template with the Evidence fold deferred? | Nothing can be authored or triaged after P2 until this is settled: `scripts/unit-route.mjs:649` fails closed without all 14 sections, and the Product selector requires them in order (`pre-execution.ts:529-556`), so a template that drops two of them cannot pass any gate; the answer also decides whether a published package changes in this PR | `scripts/unit-route.mjs:381-385,649`; `packages/agentic-workflow-schema/src/pre-execution.ts:225-241,529-556`; `scripts/unit-doc-contract.test.mjs:3-13`; precedent `docs/features/77-promise-coherence-guard/decisions.md` D-77-1; `#308` §Scope 1 and §Non-goals | A — full re-cut now: new 14-section set (Specs/Log replace Evidence/Progress log), the selector, constant, producer and router accept BOTH shapes so closed units keep validating, mirrored package change same PR, `#308`'s non-goal amended — machine stays equal to the published template, at the cost of the stated non-goal \| B — honor the non-goal: template adds `## Specs` / `## Log` but keeps `## Evidence` / `## Progress log`, the Evidence fold deferred to a follow-up unit that owns the required-list change — no package change here, scope item 1 only half-lands \| Decide for me \| Explain the options | design
Q2 | 2026-10-21 | open-question | Unit sizing: ship issue #308's five scope items as one unit, or split the ledger collapse into its own unit? | Scope sets triage (`scope: large` adds the release step), the plan cut, and whether one PR or two carry the change; a wrong size forces a mid-flight replan of an already-written doc | `#308` §Scope 1-5; `#307` layer 1 "substantial work = ONE recoverable feature document"; `skills/unit-lane/references/PLAN.md:153-160` (M/L ledger home); `scripts/catalog.json` (release on medium+); `AGENTS.md` unit-sizing rule (one surface per unit, no self-serve exceptions) | A — one unit, `scope: large`, one PR: the issue is one coherent re-cut and #307 asks for one recoverable document; per-phase diff guards and a recorded exception if the whole-unit delta exceeds the budget \| B — split: 78 = templates + machine dual-grammar + fixtures, 79 = ledger collapse — smaller diffs, two reviews, two migrations of the same reader set \| Decide for me \| Explain the options | design
Q3 | 2026-10-21 | open-question | Where the OPEN findings table lives once `review-findings.md` disappears: its own `## Findings` section in the unit doc, or the head of `## Log`? | The carrier is a published grammar block (`LEDGERS.md` `finding-mark@1`) read by `unit-route.mjs:716`, `workflow-status.mjs:640-699` and `ledger-provenance.mjs`, so its shape is frozen by fixtures and pins the moment P4 starts | `#308` §Scope 3; `skills/pre-execution-review/references/LEDGERS.md`; `scripts/unit-route.mjs:716`; `scripts/workflow-status.mjs:640-699`; heading census `grep -rn "^## Findings" docs template skills` (only `product-audit`) | A — `## Findings` as its own tolerated section (like `## Future`), `## Log` stays purely append-only — a live table never mutates inside an append-only contract \| B — the open table at the head of `## Log`, one carrier section — fewer headings, but `## Log` stops being strictly append-only while rows are open \| Decide for me \| Explain the options | design

## Assumptions

Cheap defaults taken instead of asking, dated and correctable:

- **A1 — 2026-10-21** — unit number `78`, slug `spec-by-reference` (roadmap's
  highest row is 77; the branch is `feat/308-spec-by-reference`). Change of
  number = rename + `MIGRATION.md` note, so it is worth correcting early.
- **A2 — 2026-10-21** — `scope: large` set in the frontmatter so triage can run
  before Q2 answers. If Q2 splits the unit, re-triage with
  `bun scripts/unit-route.mjs --triage 78-spec-by-reference --retriage`.
- **A3 — 2026-10-21** — this unit's own SPEC stays in the current 14-section
  shape while it is being written (every gate it runs reads that shape today);
  it migrates at its next touch after the new template lands, exactly as
  `#308` §Scope 4 prescribes for open units.
- **A4 — 2026-10-21** — `S#` are requirement ids and `P#` are phase labels; the
  standing "never `S1`/`S2`" wording in `AGENTS.md` and `PLAN.md` is amended by
  P5 to keep the two vocabularies apart rather than blocking `#308`'s `S#`.
  `#308` (owner-written, later) outranks the older wording on intent; the owner
  can correct this row.
- **A5 — 2026-10-21** — the migration fixture corpus lives at
  `scripts/fixtures/spec-by-reference/`, beside
  `scripts/fixtures/golden-fixture/` (same read-only, committed-fixture
  convention).
