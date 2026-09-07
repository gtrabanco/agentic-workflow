# Review findings — fix-162 (source stage)

Fold ledger contract: `skills/review-change/references/PERSIST_AND_DECIDE.md` step 11 +
`skills/pre-execution-review/references/LEDGERS.md` (§review-mark@1, §finding-mark@1).
Reviewers append; `execute-phase`'s fold cycle is the only step that flips `folded`.
Cycle 1 — reviewed head `43c39fd561c74002015beed710c1b29729ac8608` (PR #178, open).
Scope: branch diff vs `main` (60 files, +1475/−139). Low findings are report-only
notes in that review's chat report and are never written here.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | skills/review-plan/references/OUTPUT.md:55 | workflow | med | fix-now | fold into current unit (/fold-findings) | yes |
| VF-1 | skills/review-plan/references/OUTPUT.md:55 · reviewer review-change · HEAD 43c39fd561c74002015beed710c1b29729ac8608 · recheck direct read + greps of the cited bytes: the diff edits executor-path wording in `review-spec` 1.7.0 (OUTPUT.md self-check + RUN box), `review-plan` 1.6.0 (OUTPUT.md self-check + two-verdict set, SKILL.md) and `review-change` 3.3.0 (PERSIST_AND_DECIDE cap-scope), while `grep -c "162" docs/workflow/GOLDEN_FIXTURE.md` → 0, `grep -n "2026-09-06" docs/workflow/GOLDEN_FIXTURE.md` → 0 rows (log ends 2026-09-05, feature 29), `grep -rn GOLDEN_FIXTURE docs/fix/162-verdict-receipt-roadmap-desync/` → 0 — CLAUDE.md § "Smoke-test wording changes to executor-path skills" mandates the fixture for `review-*` edits; the operating norm (every prior row, e.g. 2026-07-12) records unavailability as a dated NOT-RUN row, never silence. The changed RUN-box/self-check wording is exactly the class weak models misrendered before (F39, 2026-09-02 log row) | workflow | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 43c39fd561c74002015beed710c1b29729ac8608 | n/a | n/a | review-mark | n/a | n/a |

Cycle 2 — reviewed head `f6dbd47e264555fcdc721ad69cfb321e43f621fa` (PR #178, open).
Scope: branch diff vs `main` (62 files, +1491/−139). F1 re-verified first:
defect gone (run-log row at `docs/workflow/GOLDEN_FIXTURE.md:369`) — fold confirmed.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F2 | docs/workflow/GOLDEN_FIXTURE.md:369 | workflow | high | fix-now | fold into current unit (/fold-findings) | yes |
| VF-2 | docs/workflow/GOLDEN_FIXTURE.md:369 · reviewer review-change · HEAD f6dbd47e264555fcdc721ad69cfb321e43f621fa · recheck direct read + pair sweep: `git diff main...HEAD -- docs/workflow/GOLDEN_FIXTURE.md` shows the added 2026-09-06 run-log row; the same diff over `docs/workflow/GOLDEN_FIXTURE.es.md` is empty and the ES run log ends at the 2026-09-05 coverage note — the CLAUDE.md bilingual hard rule ("a diff that touches only the English side of a bilingual pair is incomplete and must not be committed or merged") is violated by this unit's own fold commit | workflow | confirmed | finding-mark | n/a | n/a |
| F3 | skills/review-spec/references/OUTPUT.md:130 | code | med | fix-now | fold into current unit (/fold-findings) | yes |
| VF-3 | skills/review-spec/references/OUTPUT.md:130 + skills/review-plan/references/OUTPUT.md:135 · reviewer review-change · HEAD f6dbd47e264555fcdc721ad69cfb321e43f621fa · recheck direct read: both RUN boxes demand `exit 0` (+ `current: true` on PASS) and name only `exit 3`; `scripts/pre-execution-snapshot.mjs:544` sets `exitCode = receipt.verdict ? 4 : 3` — a legitimately persisted FAIL-verdict receipt answers exit 4, unnamed in either box, so the box is unsatisfiable on a FAIL turn; POLICY §8 (`:165-166`) states the correct condition | code | confirmed | finding-mark | n/a | n/a |
| F4 | packages/agentic-workflow-schema/src/index.ts:3745 | code | med | fix-now | fold into current unit (/fold-findings) | yes |
| VF-4 | packages/agentic-workflow-schema/src/index.ts:3745,3748 · reviewer review-change · HEAD f6dbd47e264555fcdc721ad69cfb321e43f621fa · recheck direct read + grep: `isImpossibleReceiptTimeline` and `VERDICTS_BY_STAGE` are re-exported from `src/index.ts` but grep over both package READMEs hits only `PRE_EXECUTION_RECEIPT_TIMELINE_SKEW_MS` (README.md:305, README.es.md:316); `test/pre-execution-docs.test.mjs:107-119` filter (`PRE_EXECUTION_*` / verb-`PreExecution`) matches neither name, so the docs guard stayed green over a real omission | code | confirmed | finding-mark | n/a | n/a |
| F5 | skills/execute-phase/references/PRE_EXECUTION_GATE.md:24 | code | med | fix-now | fold into current unit (/fold-findings) | yes |
| VF-5 | skills/execute-phase/references/PRE_EXECUTION_GATE.md:24 · reviewer review-change · HEAD f6dbd47e264555fcdc721ad69cfb321e43f621fa · recheck direct read: the gate keeps the disjunct "the review returned NEEDS-DESIGN / a Product-rooted finding → /design-feature" while `skills/review-plan/SKILL.md:102` declares the closed two-verdict set (`PLAN-REVIEW-PASS \| PLAN-REVIEW-FAIL`) — review-plan can no longer emit NEEDS-DESIGN; the live second disjunct still routes the case | code | confirmed | finding-mark | n/a | n/a |
| F6 | skills/workflow-status/references/PRE_EXECUTION.md:44 | code | med | fix-now | fold into current unit (/fold-findings) | yes |
| VF-6 | skills/workflow-status/references/PRE_EXECUTION.md:40-52 + SENSOR_CORE.md:77-78 · reviewer review-change · HEAD f6dbd47e264555fcdc721ad69cfb321e43f621fa · recheck direct read: the closed label table and 6a enumeration (`current/missing/stale/wrong-stage/substitute/self-approved/author-readiness/legacy`) carry no member whose evidence can produce `impossible-timeline` (digest and revision match by construction); the contrast surface `audit-pr/02:98` was updated by this unit (O8) | code | confirmed | finding-mark | n/a | n/a |
| F8 | docs/fix/162-verdict-receipt-roadmap-desync/SPEC.md:384 | workflow | med | fix-now | plan re-cut — SPEC P6 tick state (user-confirmed; not /fold-findings) | no |
| VF-8 | docs/fix/162-verdict-receipt-roadmap-desync/SPEC.md:384-394 · reviewer review-change · HEAD f6dbd47e264555fcdc721ad69cfb321e43f621fa · recheck direct read: all seven P6 (Hardening & PR) tasks read `- [ ]` while `progress.md` carries the P6 unit-loop receipt (commit 2820f8da, full gate green), the terminal COMPLETE receipt, PR #178, and the fix-index row `done · [#178]` — the execution ledger misdescribes the executed build | workflow | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD f6dbd47e264555fcdc721ad69cfb321e43f621fa | n/a | n/a | review-mark | n/a | n/a |

Cycle 3 — reviewed head `471212217f2959d14202da7c64babb30790d0728` (PR #178, open).
Scope: branch diff vs `main` (68 files, +1531/−145). User-authorized third cycle: the
two-cycle cap was reached at cycle 2 and the user explicitly invoked this review.
F1–F6 re-verified first at their cited locations: defect gone in all six (GOLDEN_FIXTURE
run-log row present EN `:369` + ES `:386`; `exit 4`/`current: false` named in both RUN boxes
(review-spec OUTPUT.md:131, review-plan OUTPUT.md:137); `isImpossibleReceiptTimeline` +
`VERDICTS_BY_STAGE` documented in both package READMEs (EN :264-265, ES :275-276); the
NEEDS-DESIGN disjunct gone from PRE_EXECUTION_GATE.md's route block; the
`impossible-timeline` label row (PRE_EXECUTION.md:50) + 6a member (SENSOR_CORE.md:78)
present) — folds confirmed. F8 re-verified: defect still present (SPEC.md:384-394 P6
tasks all `- [ ]`) — row stands, not re-appended. F7 was never on this ledger (reported
outside it in cycle 2); the id gap is preserved.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F9 | docs/workflow/SKILLS.md:72 | code | med | fix-now | fold into current unit (/fold-findings) | yes |
| VF-9 | docs/workflow/SKILLS.md:72 + SKILLS.es.md:74 + README.md:149 + README.md:516 + README.es.md:155 + skills/ship-roadmap/references/ADVANCE.md:46-47 · reviewer review-change · HEAD 471212217f2959d14202da7c64babb30790d0728 · recheck direct read of all six cells + machine map `packages/agentic-workflow-schema/src/pre-execution-contract.ts:133-136` (`plan: ["plan-review-pass", "plan-review-fail"]`) + reproducer: `node --test scripts/normative-drift.test.mjs` → 16/16 green over the stale cells — the checker attributes verdict stages by file path (`normative-drift.test.mjs:544`) and none of the six paths contains "review-plan" | code | confirmed | finding-mark | n/a | n/a |
| F10 | skills/workflow-status/references/PRE_EXECUTION.md:50 | brand | med | fix-now | fold into current unit (/fold-findings) | yes |
| VF-10 | skills/workflow-status/references/PRE_EXECUTION.md:50 + SENSOR_CORE.md:77-78 · reviewer review-change · HEAD 471212217f2959d14202da7c64babb30790d0728 · recheck direct read + grep: the sensor-level fail-open (a legacy receipt without a parsable `Started/finished:` line, or a source revision git cannot resolve, stays unflagged under `impossible-timeline`) is disclosed at `scripts/pre-execution-snapshot.mjs:41-45` and `docs/fix/162-verdict-receipt-roadmap-desync/SPEC.md:218-220` and in the schema README (pure comparator), but `grep -i "fail-open\|unresolvable\|legacy\|unparsable"` over both operating docs surfaces no fail-open statement for this dimension (SENSOR_CORE.md: "unresolvable" 0 hits) — undisclosed enforced limitation, CLAUDE.md honest-copy hard rule | brand | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 471212217f2959d14202da7c64babb30790d0728 | n/a | n/a | review-mark | n/a | n/a |

Cycle 4 — reviewed head `074ec8dc8c7ae291ef64027d314b989d868ce0ea` (PR #178, open).
Scope: branch diff vs `main` (73 files, +1560/−153). User-invoked cycle beyond the
two-cycle cap (the user's explicit instruction; cycle 3 was likewise user-authorized).
F1–F6, F9, F10 re-verified first at their cited locations: defect gone in all eight
(GOLDEN_FIXTURE run-log rows EN `:369` + ES `:386`; `exit 4`/`current: false` named in
both RUN boxes; schema exports documented EN :264-265 / ES :275-276; the NEEDS-DESIGN
disjunct gone from the gate route; the `impossible-timeline` label row + 6a member
present; all six verdict cells narrow) — folds confirmed. F8 re-verified: defect still
present (SPEC.md:384-394 P6 tasks all `- [ ]`) — row stands, not re-appended. Five NEW
fix-now rows below (F11–F15); all other candidates this cycle were low (report-only
notes in the cycle-4 chat report). Where a new row shares a file:line with a folded row
of a different axis, the folded defect was re-verified intact and the new row is a
distinct defect, not a re-litigation.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F11 | packages/pi-agentic-workflow/skills/ship-roadmap/references/ADVANCE.md:45-47 | code | high | fix-now | fold into current unit (/fold-findings): re-run the full bundle re-sync AFTER the other bundled-skill folds land, then `bun run test` green | no |
| VF-11 | packages/pi-agentic-workflow/skills/ship-roadmap/references/ADVANCE.md:45-47 · reviewer review-change · HEAD 074ec8dc8c7ae291ef64027d314b989d868ce0ea · recheck failing reproducer: `cd packages/pi-agentic-workflow && bun run test` → exit 1 (1 fail / 139 pass), "AC2: every bundled file is byte-identical to its skills/ source — ship-roadmap/references/ADVANCE.md: bundle bytes drifted from skills/ source"; mirror still routes "→ `NEEDS-DESIGN` → park as in REVIEW-SPEC" where source reads "→ PLAN-REVIEW-FAIL with class: product → design-feature"; introduced by fold commit 074ec8dc, which re-bundled the two workflow-status references but not ship-roadmap's; root suite 206/0, schema 684/0, route budgets green — AC9 unmet at the reviewed head only via this drift | code | confirmed | finding-mark | n/a | n/a |
| F12 | docs/fix/162-verdict-receipt-roadmap-desync/progress.md:80 | verify | med | fix-now | plan re-review — fresh /review-plan re-pin after all folds + the user-confirmed SPEC amendments land, then correct the progress.md:161 gate claim (not /fold-findings) | no |
| VF-12 | docs/fix/162-verdict-receipt-roadmap-desync/progress.md:80,161 · reviewer review-change · HEAD 074ec8dc8c7ae291ef64027d314b989d868ce0ea · recheck reproducer: `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-162 --dir docs/fix/162-verdict-receipt-roadmap-desync --unit-kind fix` → `"current": false`, reasonCode `stale-source-revision`, changedPaths `["docs/fix/162-verdict-receipt-roadmap-desync/SPEC.md"]`, exit 4 (receipt rp-fix162-20260906-003 pins ed6f81790083f36905d1b876c1f2fa73dd1a2480; bound SPEC bytes last changed at 1e225a81c2d39dea3f153b8c91bf1630503b9239); progress.md:161 claims gate PASS with "pi 140/0", false at HEAD per F11 — by the unit's own amended rules (gates read receipts, roadmap rows are labels) audit-pr on PR #178 would block this unit until review-plan re-runs | verify | confirmed | finding-mark | n/a | n/a |
| F13 | skills/workflow-status/references/PRE_EXECUTION.md:50 | code | med | fix-now | fold into current unit (/fold-findings) | no |
| VF-13 | skills/workflow-status/references/PRE_EXECUTION.md:50 · reviewer review-change · HEAD 074ec8dc8c7ae291ef64027d314b989d868ce0ea · recheck direct read + reproducer: the label row states the machine evidence as `structural.fresh: true, structural.reasonCode: impossible-timeline`, but the real CLI answers fresh `false` with that reasonCode — back-dated run inside `scripts/pre-execution-timeline.test.mjs` printed `{"fresh":false,"reasonCode":"impossible-timeline",…}` and the test asserts `r.structural.fresh === false`; a consumer keying the documented pair can never match the label. Distinct defect from folded F10 (brand, missing fail-open disclosure — re-verified intact) at the same line | code | confirmed | finding-mark | n/a | n/a |
| F14 | skills/execute-phase/references/PRE_EXECUTION_GATE.md:24 + skills/ship-roadmap/references/ADVANCE.md:45-47 | workflow | med | fix-now | fold into current unit (/fold-findings): minor bumps (execute-phase 4.3.0→4.4.0, ship-roadmap 5.1.0→5.2.0) + EN/ES changelog rows + fix the 0.6.0 aggregate count 8→10 | no |
| VF-14 | skills/execute-phase/references/PRE_EXECUTION_GATE.md:24 + skills/ship-roadmap/references/ADVANCE.md:45-47 · reviewer review-change · HEAD 074ec8dc8c7ae291ef64027d314b989d868ce0ea · recheck greps: `git diff main...HEAD --name-only -- skills/execute-phase/ skills/ship-roadmap/` → reference files only (no SKILL.md; versions 4.3.0 / 5.1.0 unchanged); `git diff main...HEAD -- CHANGELOG.md CHANGELOG.es.md \| grep -E "^\+.*(execute-phase\|ship-roadmap)"` → 0 added rows; repo precedent d3160fb7 bumped+logged workflow-status 3.0.3 for a references-only edit; the unit's own SPEC hygiene bullet mandates "minor bumps on every touched skill"; CHANGELOG.md:93 0.6.0 row says "re-bundles the 8 touched skills" while the branch edits copy in 10 distinct skills. Distinct defect from folded F5 (code, NEEDS-DESIGN disjunct — re-verified gone) at the same gate line | workflow | confirmed | finding-mark | n/a | n/a |
| F15 | packages/agentic-workflow-schema/test/pre-execution-docs.test.mjs:106-113 | code | med | fix-now | fold into current unit (/fold-findings): derive the guarded export set from the README API table (fail-closed on unknown exports) instead of the name allowlist | no |
| VF-15 | packages/agentic-workflow-schema/test/pre-execution-docs.test.mjs:106-113 · reviewer review-change · HEAD 074ec8dc8c7ae291ef64027d314b989d868ce0ea · recheck direct read: `PRE_EXECUTION_EXPORTS` is a name-pattern allowlist (`^PRE_EXECUTION_`, verb-`PreExecution`, `selectSpecProduct`, plus the two F4 names bolted on), not derived from the README table and not inverted fail-closed; the `length >= 26` floor only stops shrinkage — any future export outside the patterns ships undocumented with the guard green; the failure mode is proven by F4/VF-4 on this ledger (the guard stayed green over a real omission) | code | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 074ec8dc8c7ae291ef64027d314b989d868ce0ea | n/a | n/a | review-mark | n/a | n/a |
