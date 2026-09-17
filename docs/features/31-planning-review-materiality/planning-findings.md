# Planning findings — 31-planning-review-materiality

One stage-aware table, both stages; reviewers append rows, only the stage's
author resolves. Row shape per `pre-execution-review/references/LEDGERS.md` §3:
`finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision`

Review `spec-review-31-1` (stage spec) @ source revision
`cf2380405cb08fa4a4ff578a9e0779eeb02542d9`, snapshot
`735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a`,
2026-09-17. Context-clean reviewer turn; first review of the unit's Product half.
Verdict: `spec-review-pass` — 14/14 checks pass, no material finding. Both rows
below are `info` (immaterial) and route to their product-class owner
(`design-feature`); a PASS may coexist with open `info` rows.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N31-001 | spec | info | product | 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a | Two grounding citations are imprecise, though the substantive claims hold. (a) SPEC §Context says POLICY §4 "says more cycles \"stay allowed when correctness needs them\"" and that `REPAIR.md` §4 "repeats" it; the exact string is in `design-feature/references/REPAIR.md` §4, while POLICY §4 says "Entering a second cycle is allowed when correctness needs it". (b) decisions.md's code-side-cap row cites `skills/review-change/SKILL.md:159-163` for both the cap and the `LOOP CAP REACHED` literal; the third-cycle rule is at those lines, but `LOOP CAP REACHED` lives in `skills/review-change/references/REVIEW_PROCESS.md` (the file `scripts/review-loop-discipline.test.mjs` reads as `reviewProcess`). | SPEC.md §Context, 3rd bullet (POLICY §4 / REPAIR.md §4 quote); decisions.md evidence row `Code-side loop cap, test-pinned`; `skills/pre-execution-review/references/POLICY.md:60-61,83`; `skills/design-feature/references/REPAIR.md:64-65,71`; `skills/review-change/SKILL.md:162-163`; `scripts/review-loop-discipline.test.mjs:67,317` | open | — | — |
| N31-002 | spec | info | product | 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a | E2's `Read/list` surface lists only plan-stage homes for a recorded wording-only determination (`planning-evidence.md` for M/L, the SPEC's `### Planning evidence` section for XS/S), but POLICY §3 governs both stages and a spec-stage wording-only route is executed by `design-feature`, whose frozen-evidence home is the evidence rows in `decisions.md` (ledger ownership map: the `decisions` ledger, `design-feature:product-decisions`). The `Create` row's generic phrase "the unit's frozen evidence" covers the spec stage, so no entity row is blank and no check fails; only the pointer is incomplete for one of the two stages the feature claims to cover. | SPEC.md §Capability closure §1, entity E2 (`Create` and `Read/list` cells); `skills/pre-execution-review/references/LEDGERS.md` ledger ownership map (`decisions` row) and §1 planning-evidence home (writer: the authoring planner); `skills/pre-execution-review/references/POLICY.md` §3 (both stages) | open | — | — |
