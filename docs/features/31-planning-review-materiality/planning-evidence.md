# Planning evidence — 31-planning-review-materiality

Compact source-backed conclusions used to cut this Engineering plan. This is
not an exploration transcript. All rows observed at HEAD `180c7127`
(branch `feat/31-planning-review-materiality`) unless a row says otherwise.

Planning baseline: HEAD `180c7127` + live forge state per the design turn
(issue #171 read 2026-09-17). Product receipt: `spec-review-31-1` bound to
snapshot `735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a`.

| ID | Question or claim | Authority | Repository evidence and revision | Affected decision or obligation | Freshness | Status | Owner or next evidence |
|---|---|---|---|---|---|---|---|
| PE-001 | `LEDGERS.md` §3 still reads "`info` is the only immaterial one" — the planning materiality line has not moved | repository contract | `skills/pre-execution-review/references/LEDGERS.md:93` | O1; AC1 | current | proven | re-verify before editing P1 |
| PE-002 | Both stage CHECKS files carry the old floor "Material = anything above `info`" | repository contract | `skills/review-spec/references/CHECKS.md:104`; `skills/review-plan/references/CHECKS.md:105` | O2; AC2 | current | proven | re-verify before editing P1 |
| PE-003 | POLICY §3's opening paragraph mandates "a single re-review of the resulting snapshot" for every repair batch; the Wording-only row exists (:47) but its consequence only forbids skipping the *determination record*, not the re-review | repository contract | `skills/pre-execution-review/references/POLICY.md:36-52` (opening :41-42; Wording-only row :47) | O6; AC6 | current | proven | re-verify before editing P3 |
| PE-004 | POLICY §4 prints `CONVERGENCE-ANOMALY` on a second cycle but states more cycles "stay allowed when correctness needs it" and closes with "no cap converts a verdict into a dead end"; the block text (:62-77) must survive byte-identical per AC4 | repository contract | `skills/pre-execution-review/references/POLICY.md:53-85` (:60-61, :62-77, :83) | O4; AC4 | current | proven | re-verify before editing P2; diff hunk read-verified in P4 |
| PE-005 | `REPAIR.md` §4 carries the uncapped mirror "More cycles stay allowed when correctness needs them" (:64-65) and "no cycle cap converts its verdict into a dead end" (:71) | repository contract | `skills/design-feature/references/REPAIR.md:57-71` | O5; AC5 | current | proven | re-verify before editing P2 |
| PE-006 | The verdict surfaces already state the second-cycle anomaly (`OUTPUT.md` spec :120, plan :125-126) and `review-plan` already binds the cycle-counting field "Prior plan receipt … `none — first cycle`" (:28); the cap text is absent from both | repository contract | `skills/review-spec/references/OUTPUT.md:109-123`; `skills/review-plan/references/OUTPUT.md:28,118-126` | O7; AC7 | current | proven | re-verify before editing P2 |
| PE-007 | The discipline suite reads `LEDGERS.md` and both `OUTPUT.md` files already (:27-28, :134); it has no `POLICY.md`/`CHECKS.md`/`REPAIR.md` reads — planning-side pins are additive `read()` consts + sections, so existing assertions are untouched | repository tests | `scripts/review-loop-discipline.test.mjs:20-28,32-43,67-69,108-114,134` | O3, O8, O9; AC9 | current | proven | run the suite after every phase edit |
| PE-008 | Current versions: `pre-execution-review` 2.2.1, `review-spec` 1.7.1, `review-plan` 1.6.1, `design-feature` 3.4.0 | repository | the four SKILL.md frontmatters | O10; AC13 | current | proven | bump minor per the #176 freeze; one bump per skill per PR (E-D31-1) |
| PE-009 | `bump-skill` owns the mechanical bump (SKILL.md `version:`, CHANGELOG rows, README/SKILLS cells) and must run before each phase commit that edits a skill | repository contract | `CLAUDE.md` §"Version every change"; `skills/bump-skill/SKILL.md` | O10; AC13 | current | proven | follow the bump-skill contract in P1/P2 |
| PE-010 | `OUTPUT.md` ×2 pin the receipt contract literal `agentic-workflow/pre-execution-review-receipt@1` in the rendered-facts table — edits must not touch those lines, and verdict blocks are machine-pinned grammar (`review-spec-verdicts`/`review-plan-verdicts`) | repository tests | `CLAUDE.md` `rendered-facts@1` row 4; `scripts/normative-drift.test.mjs` | O4, O7; AC11 | current | proven | keep receipt-literal lines byte-identical; run normative-drift in P4 |
| PE-011 | Context budgets live in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, checked by `scripts/check-skill-context.mjs`; the four edited skills re-measure after the edits | repository tests | `scripts/check-skill-context.mjs`; `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (entries for all four skills) | O11; AC11 | current | proven | re-measure and update the manifest in P4 |
| PE-012 | The Pi mirror is written only by `bun run bundle:skills`; hand edits of `packages/pi-agentic-workflow/skills/` are forbidden; package tests enforce parity | repository contract | `packages/pi-agentic-workflow/package.json` scripts; `CLAUDE.md` normalizer inventory | O12; AC12 | current | proven | bundle after the last `skills/` edit, then package suite |
| PE-013 | NRS is `frozen`; F010: no `docs/architecture/ARCHITECTURAL_INVARIANTS.md` exists → the formal classification is `n/a: no project invariants declared`; AD-008 ("Correctness is evidence- and obligation-bound, never cycle-count-bound") is reconciled by D-31-5: the cap routes to a human decision, it never establishes correctness by cycle count | ledger | `docs/workflow/REPOSITORY_STATE.md` Snapshot status, F010, AD-008; decisions.md D-31-5 | architecture classification; O14 | current (not-applicable for the decision row) | decision | record `preserves` for AD-008 in the SPEC's Architecture impact; NRS amendment not needed |
| PE-014 | Roadmap row 31 reads `defined`, depends on 29 (`done · #175`, merged); rows 32/35/42/46 chain after 31; no other row claims 31 | repository | `docs/features/ROADMAP.md` rows 29-35, 42, 46 | roadmap write; O13 | current | proven | scaffold flips 31 `defined → planned` this turn and re-reads |
| PE-015 | `docs/workflow/REVIEW_AND_CLASSIFY.md` carries no severity/materiality statement (grep empty, 2026-09-17) and is NOT in the SPEC's In-scope surface list — editing it would violate AC8 | repository + SPEC scope | `grep -niE "material\|severity" docs/workflow/REVIEW_AND_CLASSIFY.md` → no semantic hits; SPEC §In scope enumeration | O13; AC8 | current | proven | no tutorial edit; audit-docs owns inventory↔docs drift |
| PE-016 | The schema package is a negative integration: severity vocabularies untouched, no schema change of any kind | repository | `packages/agentic-workflow-schema/src/` (severity sets); SPEC Out-of-scope bullet 2 | O15; AC10 | current | proven | `git diff --name-only main...HEAD -- packages/agentic-workflow-schema` empty + suite green in P4 |
| PE-017 | The unit's `planning-findings.md` carries two open `info` rows (N31-001, N31-002, class product) — immaterial under the current and the new line; they route to `design-feature` (the spec-stage product-class owner), never to this scaffold | ledger | `docs/features/31-planning-review-materiality/planning-findings.md` rows N31-001/N31-002 | O1 (non-blocking semantics demonstrated in-repo); AC1 | current | proven | design-feature resolves them at its next repair cycle; plan-feature never resolves `class: product` rows |

## Closure

- Material planning claims without evidence: none.
- Unresolved product or architecture decisions: none (engineering
  interpretation decisions are recorded and frozen in `decisions.md`
  E-D31-1…E-D31-4).
- Revalidation required before execution: current bytes of the eight edited
  skill reference files (LEDGERS, POLICY, CHECKS ×2, OUTPUT ×2, REPAIR) and
  `scripts/review-loop-discipline.test.mjs`; current versions of the four
  bumped skills; current Pi bundle parity behavior.
