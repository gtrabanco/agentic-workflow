# planning evidence — 28-evidence-grounded-spec-plan-review

Compact source-backed conclusions used to cut this Engineering plan. This is
not a review receipt and contains no raw exploration transcript.

Planning baseline: `32e69287b391946963bf6331506c9c1837298932` plus live
forge state verified on 2026-08-30. Revalidate changed evidence before
execution.

| ID | Question or claim | Authority | Repository evidence and revision | Affected decision or obligation | Freshness | Status | Owner or next evidence |
|---|---|---|---|---|---|---|---|
| PE-001 | Product design and Engineering planning currently have no independent stage-specific review gate | repository skills | `skills/design-feature/SKILL.md`; `skills/plan-feature/SKILL.md`; `skills/plan-feature/references/ROUTING.md` at planning baseline | S1-S5; P2-P4 | current at baseline | proven | revalidate the three skill contracts before P2 |
| PE-002 | Current planning can hand a planned unit directly to execution | repository skills | `skills/plan-feature/SKILL.md` Done-when handoff; `skills/plan-feature/references/ROUTING.md` planned-state route | S3, S9; AC3, AC8 | current at baseline | proven | P2/P4 replace the route only after new receipts exist |
| PE-003 | Candidate review/fold happens after source work and does not own Product or Plan approval | repository skills | `skills/review-change/SKILL.md`; `skills/loop-review-fold/SKILL.md`; `skills/fold-findings/SKILL.md` | S9, PD3; P4 | current at baseline | proven | P4 preserves candidate authority and adds backward root-cause routes |
| PE-004 | Existing candidate review identity is already content-bound and must not be redefined | published package and feature 25 | `packages/agentic-workflow-schema/src/index.ts`; `docs/features/25-content-bound-review-receipts/` | S4; AC9; D1 | current at baseline | proven | P1 adds a distinct pre-execution family |
| PE-005 | Existing staged verification is a separate bounded authority | published package and feature 26 | `packages/agentic-workflow-schema/src/verification-contract.ts`; `docs/features/26-staged-verification-contracts/` | S4; AC9; D1 | current at baseline | proven | P1/P4 preserve its public meaning |
| PE-006 | Phase atomicity has one canonical eight-box owner | repository internal contract | `skills/phase-contract/SKILL.md` | S7, S11; AC4, AC13 | current at baseline | proven | P3 consumes it; no duplicated phase rules |
| PE-007 | Frozen acceptance is the current implementation/review finish line | repository internal contract | `skills/verification-contract/SKILL.md` | S7, PD5; AC6, AC8 | current at baseline | proven | P3 adds obligation/evidence closure without weakening acceptance |
| PE-008 | The schema package is 3.4.0 and current public contracts use one runtime semantic authority plus generated projections | package manifest and tests | `packages/agentic-workflow-schema/package.json`; `packages/agentic-workflow-schema/src/`; feature 26 decisions | S4-S6; D4, D9 | current at baseline | proven | P1 revalidates package version and public surface before bumping |
| PE-009 | Pi distribution parity is available on main after feature 27 merged | repository plus forge | `packages/pi-agentic-workflow/` present at `32e69287b391946963bf6331506c9c1837298932`; PR #150 merged on 2026-08-30 | satisfied prerequisite; S10; AC10 | live 2026-08-30 | proven | re-run bundle/parity commands before P1 writes |
| PE-010 | Skills must remain text-first, portable, progressively loaded, and within checked context budgets | project guide and budget checker | `CLAUDE.md`; `scripts/check-skill-context.mjs`; current checker PASS recorded in NRS | S2, S10-S12; P2-P5 | current at baseline | proven | P5 reruns budget/installability gates |
| PE-011 | Provider/model routing, persistence, retries, and acknowledgement belong to consumers such as AWL, not these portable skills | accepted product boundary | issue #146 and this SPEC Product decisions; `docs/research/agentic-workflow-machine-contract-options.md` | non-goals; PD6; architecture boundary | current design authority | decision | P1-P4 expose portable contracts only |
| PE-012 | More than one correction cycle must remain correctness-safe but become a qualification anomaly | explicit user authority | 2026-08-30 user-approved amendment in this SPEC | S13; PD7; AC14 | current design authority | decision | P2-P5 implement and qualify without suppressing findings |
| PE-013 | P5's recorded evidence does not satisfy AC11/AC12/AC14: no every-changed-executor-path fixture rows, no baseline/post-change canary fields, no fix or cross-boundary sample; O9–O14 remain planned; roadmap row was flipped done prematurely | independent candidate-code review | `docs/features/28-evidence-grounded-spec-plan-review/review-findings.md` F2+F3+F6 (`replan-in-unit`) at PR #155 head `a42c244b` | O11, O12, O14; P6-P8 | live 2026-08-31 | proven | P6 produces the corpus/fixture evidence; P7 reconciles statuses; P8 re-reviews |
| PE-014 | Replayable qualification samples exist: fix unit 78 (`plan-fix` path, one fold cycle + re-review history) and cross-boundary feature 17 (skills + schema package + template) | repository fix and feature artifacts | `docs/fix/78-audit-pr-closure-integrity/SPEC.md`; `docs/features/17-finding-severity-routing/` | P6 sample selection | current at replan | proven | P6 replays both in clean contexts and records canary fields |
| PE-015 | The terminal release steps partially ran: Pi package bumped 0.1.0 -> 0.2.0 (commit `a42c244b`) and PR #155 is open | git log and forge | `git log --oneline`; `gh pr list --state open` (PR #155, head `feat/28-evidence-grounded-spec-plan-review`) | P8 close-out | live 2026-08-31 | proven | P8 re-verifies the terminal candidate and updates the PR; no new PR |

## Closure

- Material planning claims without evidence: none.
- Unresolved product or architecture decisions: none.
- Revalidation required before execution: Pi bundle/parity behavior, current
  package version/API, current skill contents, and current NRS; after the
  2026-08-31 re-plan also the P6 sample units' artifacts (fix 78, feature 17)
  and the open review findings ledger (F2+F3+F6 stay `folded: no` until their
  phase fixes land).
