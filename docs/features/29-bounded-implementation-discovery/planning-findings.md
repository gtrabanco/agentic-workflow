# planning-findings — 29-bounded-implementation-discovery

Stage-aware review findings ledger (one table, both stages). Reviewers append
rows; only the stage's author resolves them. Row shape per
`pre-execution-review/references/LEDGERS.md` §3.

Review rs-29-20260905-001 (stage spec) @ source revision `d2455259f038f50502a8ddabb761605f9124ddad`,
snapshot `b9f49d07b1c53a798f1acac28e4241addc433bcbe26405c2cfe261cb8ccf4e16`,
2026-09-05. Context-clean reviewer turn; first review of the unit's Product
half. Verdict: `spec-review-pass` — 14/14 checks pass, no material finding.
The row below is `info` (immaterial) and routes a plan-class prerequisite to
its owner; a PASS may coexist with an open `info` row.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N29-001 | spec | info | plan | b9f49d07b1c53a798f1acac28e4241addc433bcbe26405c2cfe261cb8ccf4e16 | Unit 29 is size `M` and still has no `planning-obligations.md`; feature 28's resolved finding RS10 fixes the required execution order as "construct unit 29's `planning-obligations.md` from its acceptance rows under the legacy-adoption rule, then review-spec, then review-plan, then execute". The ledger remains absent at this review's source revision, so the `review-plan` stage of that order cannot yet complete. Outside the Product half: no spec-stage check (C1–C14) is affected; recorded so the route is not lost between cycles. | `ls docs/features/29-bounded-implementation-discovery/` (no `planning-obligations.md`); feature-28 SPEC `## Post-merge next feature` (RS10 resolution); `LEDGERS.md` M/L ledger rule | resolved | `planning-obligations.md` built (see N29-005 resolution) with O1–O13 one-to-one with AC1–AC13 under the legacy-adoption rule. The `review-plan` stage can now complete; no SPEC or Product-half edit was made by this row. | d8404285557de05879b83f13449e4220bcdfad77 |

Review rp-29-20260905-001 (stage plan) @ source revision `d2455259f038f50502a8ddabb761605f9124ddad`,
snapshot `faae9acd2ec2e2f7fbed31d88e64fe5d46dc43e3a920ae9ff11533da415c6a42`,
2026-09-05. Context-clean reviewer turn; first plan review of the unit.
Verdict: `plan-review-fail` — L1/L6 pass, L3/L4 fail, L2/L5/P1/P11/P12 findings,
remaining Engineering checks pass. All three rows below are `class: plan` and
share one repair owner (`plan-feature`); the plan is decidable but incomplete
and unsupported, so no `NEEDS-DESIGN` route applies.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N29-002 | plan | medium | plan | faae9acd2ec2e2f7fbed31d88e64fe5d46dc43e3a920ae9ff11533da415c6a42 | planning-evidence row PE-005 cites `skills/loop-review-fold/SKILL.md` as the authority for the claim "candidate review/fold occurs after implementation and currently routes oversized findings through replan" (carried into S9, S12, P3 and P1's affected-surface evidence), and that path does not exist in the repository, so the claim is unevidenced at its cited authority and L2/P1/P12 fail on that row. | `ls skills/loop-review-fold/SKILL.md` → absent at `d2455259`; the actual fold/review surfaces are `skills/review-change/SKILL.md` and `skills/fold-findings/SKILL.md`; `planning-evidence.md` PE-005 row | resolved | Re-cited PE-005 to the real owners `skills/review-change/SKILL.md` and `skills/fold-findings/SKILL.md`; verified `review-change` routes `replan-in-unit` and `fold-findings` is the correction path. No SPEC edit was made. | d8404285557de05879b83f13449e4220bcdfad77 |
| N29-003 | plan | low | plan | faae9acd2ec2e2f7fbed31d88e64fe5d46dc43e3a920ae9ff11533da415c6a42 | SPEC Dev scenario `map:limit-hit` (context/result pressure before all questions close → compact partial evidence plus `BLOCKED`, never truncated `READY`) has no validator: it is absent from AC8's named scenario matrix and from testing.md's mandatory scenario inventory, so no phase/validator exercises it (L5/P11). | SPEC.md Dev scenarios table row `map:limit-hit`; ACCEPTANCE.md AC8 (nine named cases, none is limit-hit); testing.md Mandatory scenario inventory (ten rows, none is limit-hit) | resolved | Added the `map:limit-hit` context/result-pressure case to testing.md's mandatory scenario inventory and to planning-obligations O8's affected-surface cell. Existing AC8/scenario-inventory coverage now includes it. No Spec/ACCEPTANCE edit was made. | d8404285557de05879b83f13449e4220bcdfad77 |
| N29-005 | plan | high | plan | faae9acd2ec2e2f7fbed31d88e64fe5d46dc43e3a920ae9ff11533da415c6a42 | `planning-obligations.md` is absent for this size-`M` unit, so L3 (obligation completeness) and L4 (obligation mapping) cannot pass: none of ACCEPTANCE.md's AC1–AC13 is mapped to a phase, task, implementation-owner, validator, and required evidence, and the unit's own contract (S5, AC1, AC13: "complete phase-obligation coverage") is what the missing ledger would substantiate. Feature-28 RS10 ordered this ledger to be built before `review-plan`; it was not built before this review. | directory listing (no `planning-obligations.md`); feature-28 resolved finding RS10 (legacy-adoption order); ACCEPTANCE.md AC1–AC13 with no obligation rows; plan snapshot `obligations` row absent | resolved | Built `planning-obligations.md` under the legacy-adoption rule: one row per AC1–AC13 (O1–O13), each mapping to a phase (P1–P4), task, implementation-owner, validator, required-evidence, and one closed `planned` status; plus a nine-column parse check and closure note. No acceptance row, SPEC product half, decisions, or roadmap was edited. | d8404285557de05879b83f13449e4220bcdfad77 |
