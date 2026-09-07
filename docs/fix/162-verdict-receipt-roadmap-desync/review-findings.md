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
