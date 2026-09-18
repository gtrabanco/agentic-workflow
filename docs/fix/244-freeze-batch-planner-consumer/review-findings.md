# review-findings — 244-freeze-batch-planner-consumer

review-change cycle 1 ran on 2026-09-18 at head cdd351a6394815aa9a1f80b78e866376389dc645 (default single-reviewer route; isolated `code`, `verify`, `brand/docs` passes — `security`/`perf`/`design`/`a11y`/`seo` inapplicable). Decision: NEEDS-DECISION (F3 decision-required) with six open fix-now findings.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | scripts/review-loop-discipline.test.mjs:278 | verify | high | fix-now | fold into current unit — maintain the fold-findings version pin 1.5.0→1.5.1 (its own contract says every later bump maintains it); the full root gate is red without it | yes |
| VF-1 | scripts/review-loop-discipline.test.mjs:278 · reviewer review-change · HEAD cdd351a6394815aa9a1f80b78e866376389dc645 · recheck command reproducer: `node --test scripts/review-loop-discipline.test.mjs` → AssertionError "did not match /version: 1\.5\.0/" against frontmatter `version: 1.5.1`; `node --test scripts/*.test.mjs` → exit 1, 556/557 | verify | confirmed | finding-mark | n/a | n/a |
| F2 | scripts/normative-drift.test.mjs:1169-1251 | code | med | fix-now | fold into current unit — the `#244` pin must read `skills/fold-findings/references/FOLD_PROCESS.md` and assert its planner tokens and both format sentences (SPEC P1 task 2 says "both skill files") | yes |
| VF-2 | scripts/normative-drift.test.mjs:1169-1251 · reviewer review-change · HEAD cdd351a6394815aa9a1f80b78e866376389dc645 · recheck overlay reproducer: deleting the `/plan-fix`/`/plan-feature` tokens and both sentences from `references/FOLD_PROCESS.md` leaves the pin green; `grep -n "FOLD_PROCESS" scripts/normative-drift.test.mjs` → no output | code | confirmed | finding-mark | n/a | n/a |
| F4 | scripts/normative-drift.test.mjs:1179,1212-1213 | code | med | fix-now | fold into current unit — read the block/table through the sensor's `fixedOutputBlocks`/`markdownTable` helpers, not a bespoke regex (SPEC §Testing) | yes |
| VF-4 | scripts/normative-drift.test.mjs:1179,1212-1213 · reviewer review-change · HEAD cdd351a6394815aa9a1f80b78e866376389dc645 · recheck direct read: private `/```[\s\n]*→ Next:([\s\S]*?)```/` and ad-hoc line filtering at :1179/:1212 vs helpers at :255-274; SPEC §Testing requires the sensor's own helpers | code | confirmed | finding-mark | n/a | n/a |
| F5 | scripts/normative-drift.test.mjs:1184-1203 | code | med | fix-now | fold into current unit — the first captured line must not be skipped; run the shape and `unit-route.mjs` token checks over every captured line | yes |
| VF-5 | scripts/normative-drift.test.mjs:1184-1203 · reviewer review-change · HEAD cdd351a6394815aa9a1f80b78e866376389dc645 · recheck overlay reproducer: with the `→ Next:` header tail removed and the first sub-bullet made `· all FOLDED → node scripts/unit-route.mjs <unit>`, the pin is green | code | confirmed | finding-mark | n/a | n/a |
| F7 | skills/fold-findings/SKILL.md:179-180 | brand/docs | med | fix-now | fold into current unit — extend the replacement instruction to cover the `/plan-fix <n>` / `/plan-feature <slug>` unit placeholders (weak-model verbatim copy is this unit's declared use case) | yes |
| VF-7 | skills/fold-findings/SKILL.md:179-180 · reviewer review-change · HEAD cdd351a6394815aa9a1f80b78e866376389dc645 · recheck direct read: the block at :173 now carries `<n>`/`<slug>` while the only replacement sentence covers finding IDs (`Replace placeholders with every actual affected finding ID`) | brand/docs | confirmed | finding-mark | n/a | n/a |
| F8 | skills/fold-findings/SKILL.md:173 | brand/docs | med | fix-now | fold into current unit — restore the "user confirms" step to the fixed REPLAN sub-bullet so the block matches the decision table and FOLD_PROCESS step 9 | yes |
| VF-8 | skills/fold-findings/SKILL.md:173 · reviewer review-change · HEAD cdd351a6394815aa9a1f80b78e866376389dc645 · recheck direct read: block omits "user confirms" present at :190 and `references/FOLD_PROCESS.md:61`; SPEC P2 task 2 requires the planner-append/user-confirm/fresh-review/execute chain | brand/docs | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD cdd351a6394815aa9a1f80b78e866376389dc645 | n/a | n/a | review-mark | n/a | n/a |
| F9 | docs/fix/244-freeze-batch-planner-consumer/progress.md:47 | code | med | fix-now | fold into current unit — replace the dead PR reference `#246`/`pull/246` with the unit's real PR #247 (`docs/fix/README.md:18` already cites it); CLAUDE.md requires documented cross-references to resolve | no |
| VF-9 | docs/fix/244-freeze-batch-planner-consumer/progress.md:47 · reviewer review-change · HEAD 0947a10debf86d5d43ebc6bcd361de5c1ba0ec1c · recheck direct read + forge check: the line reads `[#246](.../pull/246)`; `gh pr view 246` → "Could not resolve to a PullRequest with the number of 246"; `gh pr view 247 --json number,state,headRefName` → `{"headRefName":"fix/244-freeze-batch-planner-consumer","number":247,"state":"OPEN"}`; `docs/fix/README.md:18` cites #247 | code | confirmed | finding-mark | n/a | n/a |
| F10 | skills/fold-findings/references/FOLD_PROCESS.md:46 (+ skills/fold-findings/SKILL.md:121-126,192) | brand/docs | med | fix-now | fold into current unit — split the freeze-batch consumer by the router's emitted conclusion: `replan-in-unit` → `/plan-fix <n>` / `/plan-feature <slug>`, `decision-required` → stop and surface the decision to the user, never a planner; extend the `#244` pin to the decision branch | no |
| VF-10 | skills/fold-findings/references/FOLD_PROCESS.md:46 · reviewer review-change · HEAD 0947a10debf86d5d43ebc6bcd361de5c1ba0ec1c · recheck reproducible command output: `UNIT_ROUTE_REPO=scripts/fixtures/unit-route node scripts/unit-route.mjs 12-decision-unit` → `route: decision` / `next: decision required — stop and surface to the user`, while the cell's trigger admits `decision-required` and its consumer is `/plan-fix <n>` / `/plan-feature <slug>`; sibling contracts `docs/workflow/REVIEW_AND_CLASSIFY.md:84`, `skills/review-change/references/OUTPUT_AND_GUARDRAILS.md:35` | brand/docs | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 0947a10debf86d5d43ebc6bcd361de5c1ba0ec1c · 2026-09-19 · review-change · cycle 2 · full pass (delta escalated: width + size) · verdict: REVIEW-FAIL · new: F9 F10 | n/a | n/a | review-mark | n/a | n/a |

Cycle 2 ran on 2026-09-19 at head `0947a10debf86d5d43ebc6bcd361de5c1ba0ec1c` (default single-reviewer route; isolated `code`, `verify`, `security`, `brand/docs`, `perf` finder passes; isolated verification of both candidates; isolated classifier and debt transform — `design`/`a11y`/`seo` inapplicable: no UI/web surface). All six `folded: yes` rows re-verified clean at their cited locations. Delta mode escalated to a full pass — **width** (changed files outside the folded rows' cited-file union: the unit docs, the pi mirror, and the new `scripts/check-changelog-row.mjs` + test) and **size** (278 changed lines > 200). Gate green at the reviewed head; frozen `ACCEPTANCE.md` blob `687f7e55a89c2c49133144a9af0ac4b77cd56b19` recomputed to an exact match. Decision: REVIEW-FAIL (two new `med` fix-now rows).

```text
CONVERGENCE-ANOMALY — 244-freeze-batch-planner-consumer source
- Finding ids: new: F9, F10 (no repeat of a prior row's location)
- Snapshots: cdd351a6394815aa9a1f80b78e866376389dc645 -> 0947a10debf86d5d43ebc6bcd361de5c1ba0ec1c (cycle-1 reviewed head -> cycle-2 reviewed head)
- Missed: no validator reads the unit ledger's own PR cross-reference (progress.md:47), and the cycle-1 finders asserted the planner tokens exist without checking that every class the freeze-batch trigger admits maps to a conclusion the router actually emits (`decision-required` -> `decision`, not a planner)
- Owning stage: source (both rows)
- Why the prior review failed: cycle 1 reviewed the pre-fold bytes, so it never saw the folded consumer wording, and it read the ledger's delivery rows for phase evidence rather than for their own reference integrity
- Route to owner: source rows -> `/fold-findings` with the explicit ids F9 + F10
```

```text
LOOP CAP REACHED — 244-freeze-batch-planner-consumer
- Finding ids: F9 + F10 (both source-owned, foldable in one atomic batch)
- Cycles: 2 (REVIEW-RAN marks + forge receipts)
- Route: /triage-issue --prioritize-now 244-freeze-batch-planner-consumer F9 F10 (or the programmatic outer driver)
```

Cycle 2 completed two review→fold cycles without convergence (cycle 1's six rows all folded, F3 resolved by the user-approved AC6 amendment, then this cycle produced two new fix-now rows). Both rows are source-owned and small enough to fold in place, but a verifying third cycle is the **user's** escape, never a reviewer election — the cap block above names the residue route.
