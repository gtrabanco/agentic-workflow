# planning evidence — 29-bounded-implementation-discovery

Compact source-backed conclusions used to cut this Engineering plan. This is
not the ephemeral implementation map and contains no raw exploration
transcript.

Planning baseline: `32e69287b391946963bf6331506c9c1837298932` plus live
forge state verified on 2026-08-30. Revalidate changed evidence after feature
28 merges and before implementation.

| ID | Question or claim | Authority | Repository evidence and revision | Affected decision or obligation | Freshness | Status | Owner or next evidence |
|---|---|---|---|---|---|---|---|
| PE-001 | Current execution uses a file-count cap instead of evidence closure | repository executor contract | `skills/execute-phase/SKILL.md` file-cap guardrail at planning baseline | S2, PD2; P1-P2 | current at baseline | proven | P1 removes count authority; revalidate before editing |
| PE-002 | Execution already has a progressive preflight seam before workflow selection | repository executor contract | `skills/execute-phase/SKILL.md`; `skills/execute-phase/references/PREFLIGHT.md` | S1, S3; D1-D3 | current at baseline | proven | P2 inserts discovery after read-only authority gates |
| PE-003 | Phase shape and fingerprint have one canonical owner | repository internal contract | `skills/phase-contract/SKILL.md` | S4-S5; AC1, AC3 | current at baseline | proven | mapper consumes, never redefines, the fingerprint |
| PE-004 | Frozen acceptance remains the finish line and cannot be weakened during mapping | repository internal contract | `skills/verification-contract/SKILL.md` | non-goals; AC9, AC12 | current at baseline | proven | P2/P3 preserve the receipt and anti-gaming gate |
| PE-005 | Candidate review/fold occurs after implementation and currently routes oversized findings through replan | repository review contracts | `skills/review-change/SKILL.md`; `skills/fold-findings/SKILL.md` | S9, S12; P3 | current at baseline | proven | P3 adds earlier source/Plan routing and inherits feature-28 convergence |
| PE-006 | Feature 28 will own reviewed Product/Plan snapshots, planning evidence, obligations, and backward routes | accepted upstream SPEC | `docs/features/28-evidence-grounded-spec-plan-review/SPEC.md`; `planning-evidence.md` | hard dependency; S4, S8, S11 | current planned authority | decision | re-run review-spec/review-plan and bind current receipts after feature 28 merges |
| PE-007 | Semantic navigation and memory are optional accelerators, not repository authority | current project portability rules and issue #149 | `CLAUDE.md`; issue #149; this SPEC Product decisions | S3, S8; PD2 | current design authority | decision | P1/P3 keep direct Git/search/read/test fallback equivalent |
| PE-008 | No durable/public map contract is required in AW v1 | accepted Product scope | issue #149; this SPEC out-of-scope and PD5 | S4, S7; D7 | current design authority | decision | AWL may persist exact opaque evidence without changing semantics |
| PE-009 | Pi distribution parity is available on main after feature 27 merged | repository plus forge | `packages/pi-agentic-workflow/` present at `32e69287b391946963bf6331506c9c1837298932`; PR #150 merged on 2026-08-30 | satisfied transitive prerequisite; AC11 | live 2026-08-30 | proven | verify feature 28 merged and re-run Pi parity before P1 |
| PE-010 | A map must validate a sound Plan, not discover its architecture for the first time | explicit user authority and feature-28 amendment | feature 28 S11-S13/AC13-AC14; 2026-08-30 user-approved amendment in this SPEC | S11-S12; PD7; AC13 | current design authority | decision | READY rejects missing Plan-level topology/validator evidence |

## Closure

- Material planning claims without evidence: none.
- Unresolved product or architecture decisions: none.
- Revalidation required before execution: merged feature 28 contracts and
  receipts, current Pi bundle/parity behavior, current executor/preflight
  contents, current source topology, and current NRS.
