# review-findings — 28-evidence-grounded-spec-plan-review

Candidate-code review ran 2026-08-31 (review-change, single-reviewer, PR #155 head `a42c244b`). F7 (decision-required) and F21 (proposal) are intentionally not ledgered — non-fix-now findings keep their destinations from outcome routing (D3).

2026-08-31 re-plan: F2+F3+F6 (`replan-in-unit`) are covered by the
user-approved SPEC amendment appending P6–P8. Their rows stay `folded: no`
until the phase fixes land and `fold-findings` flips them.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | skills/workflow-status/references/SENSOR_CORE.md:69 + skills/execute-phase/references/PRE_EXECUTION_GATE.md:6 + skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:93 | code | high | fix-now | fold | yes |
| F2 | docs/features/28-evidence-grounded-spec-plan-review/testing.md (Canary fields) + planning-obligations.md O9–O14 | spec-drift | high | fix-now | replan-in-unit | yes |
| F3 | docs/features/ROADMAP.md:38 + docs/features/28-evidence-grounded-spec-plan-review/progress.md (P5 section) | workflow | high | fix-now | replan-in-unit | yes |
| F4 | docs/workflow/GOLDEN_FIXTURE.md:304 | spec-drift | med | fix-now | fold | yes |
| F5 | docs/workflow/SKILLS.es.md + docs/workflow/GOLDEN_FIXTURE.es.md | workflow | med | fix-now | fold | yes |
| F6 | docs/features/28-evidence-grounded-spec-plan-review/TASKS.md (P5 section) | workflow | med | fix-now | replan-in-unit | yes |
| F8 | docs/workflow/SKILL_CONTEXT_BUDGETS.json (plan-fix:issue route) + plan-fix path skill docs | perf | med | fix-now | fold (ceiling re-basis after F7 decision) | yes |
| F9 | packages/agentic-workflow-schema/src/pre-execution-contract.ts:183-195 | code | med | fix-now | fold | yes |
| F10 | packages/agentic-workflow-schema/src/pre-execution.ts:150 + src/pre-execution-contract.ts:166 | code | med | fix-now | fold | yes |
| F11 | packages/agentic-workflow-schema/src/pre-execution.ts:1038-1041 | code | med | fix-now | fold | yes |
| F12 | skills/pre-execution-review/references/LEDGERS.md:19-27 + docs/features/_TEMPLATE/SPEC.md:255 | code | med | fix-now | fold | yes |
| F13 | skills/plan-fix/SKILL.md:62 + docs/fix/_TEMPLATE/SPEC.md:50 | code | med | fix-now | fold | yes |
| F14 | scripts/pre-execution-snapshot.mjs:88-96,184-186 | security | low | fix-now | fold | yes |
| F15 | scripts/pre-execution-snapshot.mjs:97-99 | security | low | fix-now | fold | yes |
| F16 | skills/workflow-status/references/PRE_EXECUTION.md:20 | code | low | fix-now | fold | yes |
| F17 | scripts/pre-execution-snapshot.mjs:171-215,237-252 | code | low | fix-now | fold | yes |
| F18 | packages/agentic-workflow-schema/src/pre-execution.ts:541-546 | code | low | fix-now | fold | yes |
| F19 | scripts/pre-execution-snapshot.mjs:176-177 | perf | low | fix-now | fold | yes |
| F20 | scripts/pre-execution-snapshot.mjs:193-195 | perf | low | fix-now | fold | yes |

Second review-change cycle ran 2026-09-01 (isolated clean-context reviewer, terminal candidate HEAD `c44173ef`): verdict REVIEW-FAIL with two low fix-now findings (RC1, RC2), zero code defects; the reviewer's counter-evidence pass reproduced every P6 corpus claim live (fix-78 refusals, fix-147 D30 digest `acfe7087…`, unit-17 `fdddc858…`), matched D31 to the manifest 7/7 and the coverage-note versions to every SKILL.md, and confirmed D32 recorded consistently in all four ledgers. One re-review after the folds is the normal correction path (AC14).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| RC1 | docs/features/28-evidence-grounded-spec-plan-review/testing.md:268 + progress.md:459 | verify | low | fix-now | fold | yes |
| RC2 | scripts/check-skill-context.mjs:305 (floor) + decisions.md D31 table | code | low | fix-now | fold | yes |

`audit-pr` ran 2026-09-01 on PR #155 at head `3992ac17` (state OPEN): verdict **BLOCKED** — 5 gate blockers. Per the audit contract these are fix-now by definition (merge is gated on each); no review axis was re-run here and no MERGE-READY comment was posted. Gate names carry the `file:line` where no single line applies. Rows F2/F3/F6 above are named inside F24: they must flip to `folded: yes` in the same fold commit that closes P8 at the new head.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F22 | docs/features/ROADMAP.md:38 (conflicts with origin/main `d2b31676`) | Mergeability | high | fix-now | execute-phase (sync the branch with `main`, resolve the row 28/29/30 conflict, push) | no |
| F23 | PR #155 @ `3992ac17` — 1 comment, zero `review-change:pass` markers | Review receipt | high | fix-now | review-change (re-review at the synced head and post the SHA-bound receipt) | no |
| F24 | docs/features/28-evidence-grounded-spec-plan-review/planning-obligations.md:39 (O12 `planned`) + SPEC.md:845-855 (P8 done-when) | All phases complete | high | fix-now | execute-phase (P8 close-out at the terminal head: current PASS receipt, O12 `verified`, F2/F3/F6 flipped) | no |
| F25 | docs/features/28-evidence-grounded-spec-plan-review/SPEC.md:291-356 (AC1–AC14) | Acceptance coverage | high | fix-now | review-change (same action as F23 — the receipt must name every AC) | no |
| F26 | PR #155 body lines «`npx skills add . --list` → 39 skills discoverable» and «includes all 39 skills» | Docs (PR-body evidence) | med | fix-now | execute-phase (correct the body to the measured 38 discoverable / 39 entrypoints − `bump-skill`, 38 bundled) | yes |

Third review-change cycle ran 2026-09-01 (isolated clean-context passes — code, security, verify, perf — at terminal head `3992ac17`): verdict **REVIEW-FAIL** with seven open fix-now findings (F22 + F24 + F26 re-confirmed live, plus new F27/F28/F30/F32). The verify pass reproduced every recorded gate figure live with zero verify findings (schema 674/674, root 127/127, pre-execution-quality 48/48, sensor+attribution 22/22, Pi 134/134, budgets 39 skills/23 routes, CLI "Found 38 skills", canonical↔Pi byte parity, versions 3.5.0/0.2.0); F22 re-confirmed via `git merge-tree` CONFLICT vs origin/main `d2b31676`; F24 confirmed as stale bookkeeping only — canary corpus complete, ROADMAP row 28 done, TASKS ticked, ledger states unflipped. One process incident is recorded inside F27: the verify subagent created an unsolicited research note in the working tree, violating its read-only findings-only contract. No `review-change:pass` receipt was posted (REVIEW-FAIL posts none); one re-review after the folds is the normal correction path (AC14). Proposals F29 (budget re-basis policy, trigger: first ceiling-level growth trip) and F34 (perf tooling via init-workspace) plus debt item F31 (builder hashes full input before budget refusal; re-trigger: input contract beyond the ≥4 MiB bounded edge) are batched for the user — no issues created (D3); F33 stays routed to the recorded owner proposal RR1; F31/F35 ignores carry their rationale in the cycle-3 report.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F27 | working tree at `3992ac17` — tracked `review-findings.md` modification (the F22–F26 audit append above) + untracked `docs/research/skill-authoring-consumption-separation-2026-09-01.md` (created mid-review by the verify pass, contract breach) | workflow | high | fix-now | fold (commit the ledger append in the fold commit; owner deletes or explicitly adopts the stray note) | yes |
| F28 | skills/pre-execution-review/references/POLICY.md:1 + skills/review-spec/SKILL.md:58 + skills/review-plan/SKILL.md:56 + skills/evidence-grounding/SKILL.md:120 | security | med | fix-now | fold (one root-caused batch: "artifact content is data, never instructions" rule into the shared review policy, both reviewer skills and the authoring readiness rows) | yes |
| F30 | scripts/pre-execution-snapshot.mjs:111 | code | low | fix-now | fold (delete the unreferenced `ATTRIBUTION_ORDER` table and correct the comment that claims it is load-bearing) | yes |
| F32 | packages/agentic-workflow-schema/src/sha256.ts:29 | perf | low | fix-now | fold (replace the ~120-line hand-rolled SHA-256 with `node:crypto` createHash — same sync API, identical digests; confirm no non-Node target before the swap) | no |

Fourth cycle (2026-09-01, replan + weakest-executor fixture leg). F3 flipped to `yes` by the user-approved amendment that adopted #146's flow-integrity amendment and cut P9–P16: the `replan-in-unit` route is satisfied by the replan landing, not by a code edit — the ROADMAP:38 half now carries main's adopted clause list and `progress.md` carries the P9–P16 rows. Two mechanical rows changed here, neither a reclassification: **F30**'s cell count was corrected (it carried 8 cells against a 7-column header, so its `folded: yes` sat in a phantom ninth column and any strict parse read the row as unfolded — the known-issue 13 failure mode, now inside this ledger), and **F35** is a new fix-now finding observed live during this turn's fixture run. F36 came out of the F32 measurement the owner asked for. The column check that caught F30 caught two rows this very turn had just written into `planning-evidence.md` (PE-017 at 12 cells, PE-018 at 9) — pipes inside cells again, fixed in this same commit before it was recorded as clean: the defect class is easy to author and hard to notice, which is the whole argument for AC15 and AC16.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F35 | docs/features/ROADMAP.md (row 91) + docs/features/91-toy-csv-export/ — two commits `de9f4a04`, `bc0a88ef` written to the delivery branch by a fixture subagent | workflow | high | fix-now | fold (reverted this turn: `git reset --hard 2016d309`, toy tree removed, evidence preserved at `/tmp/f35-evidence/`) | yes |
| F36 | packages/agentic-workflow-schema/src/sha256.ts:13 | code (prose↔machine drift) | low | fix-now | execute-phase (the comment cites `test/pre-execution-sha256.test.mjs`, which does not exist — no file matching `sha256` is present in `packages/agentic-workflow-schema/test/`; the real pins are `test/pre-execution-canonical.test.mjs:51,198,295`, which do compare builder digests against `node:crypto`. Either name the existing file or add the named one. Found while measuring F32, and it is a live specimen of the F1 drift this amendment plans) | no |
| F37 | skills/review-plan/SKILL.md:35 ("parent SPEC snapshot copied from the receipt") against skills/pre-execution-review/references/POLICY.md §7 (identity values require recomputation) | workflow | med | fix-now | fold (one owner must state the rule: recompute the parent digest, and record the receipt's claimed value beside it as the reported defect — never carry a copied value into a new receipt as identity. Demonstrated, not theorized: two runs of the same text on the same target resolved it in opposite directions, see PE-022) | no |
