# review-findings — 32-review-consistency-pack

Review ran on 2026-09-19 (`review-change`, cycle 1, head
`a40d6bfaf0f29c73d9a5381ca666bcdb1e01bf6b`, PR #249). Single-reviewer run with
per-pass isolated subagents for the five applicable axes (code, verify,
security, perf, brand); the classifier (`review-implementation`) and the debt
transform (`review-debt`) each ran in a separate isolated context.

Cycle 2 re-review ran on 2026-09-19 (`review-change --adversarial 2`, head
`4733af3fb122be0d241a45f23be16443b8d29fd5`, PR #249). Two context-clean
adversarial reviewers (R1 correctness/logic, R2 security/inputs) each ran the
applicable finder checklists over the branch diff vs `main`; the delta scope
escalated to a full pass on the **width** trigger (changed files outside the
folded rows' cited union — `scripts/review-loop-discipline.test.mjs`,
`skills/execute-phase/references/EXECUTION_CONTRACT.md`,
`skills/workflow-status/SKILL.md` — plus cited-file lines more than 50 lines from
every cited line in `SKILL_CONTEXT_BUDGETS.json`). The verification pass, the
classifier (`review-implementation`) and the debt transform (`review-debt`) each
ran in a separate isolated context.

Every folded `yes` row (F1–F7) was re-verified at its cited location: F1–F5,
F6's declared-baseline intent and F7's declaration hold, but F6/F7's `folded:
yes` is **false** — the F4 edit (`4c07e332`) grew `LEDGERS.md` again after the
`00280100` re-basis, so the declared baseline `3885` is stale (est `3930`) and
`referenceEstimateMax` `4274` sits below the declared floor
`ceil(3930 × 1.10) = 4323` (recorded as the regression row F10).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:76 | code | med | fix-now | fold into current unit (source owner): re-base the 14 route ceilings that fail at head (execute-phase:descope/feature/final-pr/finding/fix/legacy/small/unit-loop, plan-feature:issue/scoped, review-change:adversarial/default-backend/default-web/synthesize) at a declared re-basis naming the growth source, or trim the added reference text; `check-skill-context.test.mjs` must go green | yes |
| F2 | skills/fold-findings/SKILL.md:4 · skills/plan-feature/SKILL.md:4 | verify | med | fix-now | fold into current unit (source owner): minor-bump `fold-findings` (1.5.1 → 1.6.0) and `plan-feature` (5.2.0 → 5.3.0), bump the workflow-status skill whose references changed (3.7.0 → 3.8.0), add one CHANGELOG row per touched skill, and re-bundle the Pi mirror — AC-11's per-touched-skill increment | yes |
| F3 | CHANGELOG.md:426 · CHANGELOG.md:651 · CHANGELOG.md:574 | brand | med | fix-now | fold into current unit (source owner): correct the three rows to the edits that exist — drop the `POLICY.md` §7 column-sets claim (no POLICY.md edit) and the `review-change` "Turn contract row" claim, and replace `audit-docs` 2.1.0's "severity-based scoring system" with the real change (orphan finding MEDIUM → `low`; check count 13 → 14) | yes |
| F4 | skills/pre-execution-review/references/LEDGERS.md:221-224 | code | med | fix-now | fold into current unit (source owner): freeze one `gate-ran@1` format and cite it from its consumers — the grammar (`<non-negative integer>`), the "fixed format" prose (`exit <code>`), and `EXECUTION_CONTRACT.md:67` (`<exit code>`) disagree; also state that red runs are recorded (:213 reads green-only) | yes |
| F5 | skills/review-change/references/PERSIST_AND_DECIDE.md:31 | brand | med | fix-now | fold into current unit (source owner): delete the residual "the fold cycle is the only step that ever flips it to `yes`" clause, superseded by the sole-writer sentence on the preceding lines — AC-01's headline invariant | yes |
| F6 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:34 · :40 | perf | med | fix-now | fold into current unit (source owner): declare the measured baselines (`pre-execution-review` LEDGERS 3462 → 3885; `review-implementation` CLASSIFY 2076 → 2671) instead of the previous ceiling `3557` and the inherited `defaults` value `2200` | yes |
| F7 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:32 · :38 | perf | med | fix-now | fold into current unit (source owner): restore the declared 10 % bound — one per-skill `referenceEstimateMax` (4274) now grants `POLICY.md` (3529 est) and `SNAPSHOT.md` (1981 est) sibling slack above the policy's `ceil(measured × 1.10)` | yes |

| VF-1 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:76 · reviewer review-change · HEAD a40d6bfaf0f29c73d9a5381ca666bcdb1e01bf6b · recheck `node scripts/check-skill-context.mjs --routes --json` at head → 37 failures / 19 distinct route ids; same command in a scratch worktree of origin/main → 10 failures / 5 route ids; `node --test scripts/check-skill-context.test.mjs` exits 1 at head | code | confirmed | finding-mark | n/a | n/a |
| VF-2 | skills/fold-findings/SKILL.md:4 · reviewer review-change · HEAD a40d6bfaf0f29c73d9a5381ca666bcdb1e01bf6b · recheck `grep -m1 '^version:'` reads 1.5.1 at head and 1.5.1 at `origin/main` while `git diff origin/main...HEAD -- skills/fold-findings/SKILL.md` shows a content change; same test for plan-feature (5.2.0/5.2.0) | verify | confirmed | finding-mark | n/a | n/a |
| VF-3 | CHANGELOG.md:426 · reviewer review-change · HEAD a40d6bfaf0f29c73d9a5381ca666bcdb1e01bf6b · recheck `git diff --name-only origin/main...HEAD \| grep -i policy` → empty and `grep -n 'gate-ran' skills/pre-execution-review/references/POLICY.md` → no match; `grep -rn 'scoring\|score' skills/audit-docs` → 0 matches | brand | confirmed | finding-mark | n/a | n/a |
| VF-4 | skills/pre-execution-review/references/LEDGERS.md:221-224 · reviewer review-change · HEAD a40d6bfaf0f29c73d9a5381ca666bcdb1e01bf6b · recheck direct read of :221 vs :224 vs `skills/execute-phase/references/EXECUTION_CONTRACT.md:67` — three renderings of the same field | code | confirmed | finding-mark | n/a | n/a |
| VF-5 | skills/review-change/references/PERSIST_AND_DECIDE.md:31 · reviewer review-change · HEAD a40d6bfaf0f29c73d9a5381ca666bcdb1e01bf6b · recheck direct read: the superseded "only step that ever flips it to `yes`" clause still present beside the new sole-writer sentence | brand | confirmed | finding-mark | n/a | n/a |
| VF-6 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:34 · reviewer review-change · HEAD a40d6bfaf0f29c73d9a5381ca666bcdb1e01bf6b · recheck `git show origin/main:skills/pre-execution-review/references/LEDGERS.md \| wc -c` → 13848 B → 3462 est; the declared baseline reads 3557, which is the previous ceiling; CLASSIFY.md at main → 8302 B → 2076 est vs declared 2200 (the `defaults` value) | perf | confirmed | finding-mark | n/a | n/a |
| VF-7 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:32 · reviewer review-change · HEAD a40d6bfaf0f29c73d9a5381ca666bcdb1e01bf6b · recheck measured reference estimates with the script's own estimator `Math.ceil(Buffer.byteLength(text,'utf8')/4)` — `LEDGERS.md` 3885, `POLICY.md` 3529, `SNAPSHOT.md` 1981 — all compared against one `referenceEstimateMax` 4274 (`scripts/check-skill-context.mjs:206`), giving `POLICY.md`/`SNAPSHOT.md` slack above the declared 10 % | perf | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD a40d6bfaf0f29c73d9a5381ca666bcdb1e01bf6b | n/a | n/a | review-mark | n/a | n/a |
| F8 | packages/pi-agentic-workflow/package.json:3 | verify | med | fix-now | fold into current unit (source owner): bump `packages/pi-agentic-workflow/package.json` (minor) and add the CHANGELOG "Companion npm packages" row for the re-bundle — the 19-file mirror change never publishes otherwise (CLAUDE.md §Packages requires the same-PR bump; the publish workflow skips when local == published) | yes |
| F9 | skills/product-audit/SKILL.md:105 | code | med | fix-now | fold into current unit (source owner): restore the example's class to `proposal` at `:105`, matching frozen ED-32-4 / SPEC.md:844 (a product-wide sweep has no unit to re-cut) | yes |
| F10 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:34 | perf | med | fix-now | regression of F6+F7 — fold into current unit (source owner): re-measure `skills/pre-execution-review/references/LEDGERS.md` (est 3930 at this head) and re-base `referenceEstimateMax` to `ceil(3930 × 1.10) = 4323`, updating the declared baseline text (the fold's `3885` predates the F4 edit, so F6/F7's `folded: yes` is false) | yes |

| VF-8 | packages/pi-agentic-workflow/package.json:3 · reviewer review-change · HEAD 4733af3fb122be0d241a45f23be16443b8d29fd5 · recheck `git diff --name-only origin/main...HEAD -- packages/pi-agentic-workflow/skills/ \| wc -l` → 19 changed while `grep -m1 '"version"' packages/pi-agentic-workflow/package.json` → 0.12.0 and `git diff origin/main...HEAD -- packages/pi-agentic-workflow/package.json` → empty | verify | confirmed | finding-mark | n/a | n/a |
| VF-9 | skills/product-audit/SKILL.md:105 · reviewer review-change · HEAD 4733af3fb122be0d241a45f23be16443b8d29fd5 · recheck direct read of `:105` (`class: replan-in-unit`) against `decisions.md:268-278` ED-32-4 ("so it is a `proposal`") and `SPEC.md:844` | code | confirmed | finding-mark | n/a | n/a |
| VF-10 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:34 · reviewer review-change · HEAD 4733af3fb122be0d241a45f23be16443b8d29fd5 · recheck `Math.ceil(byteLength/4)` on `skills/pre-execution-review/references/LEDGERS.md` → 3930 est, `ceil(3930 × 1.10) = 4323 > 4274`; `git log a40d6bfa..HEAD -- skills/pre-execution-review/references/LEDGERS.md` → `4c07e332` (F4) after the `00280100` re-basis | perf | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 4733af3fb122be0d241a45f23be16443b8d29fd5 | n/a | n/a | review-mark | n/a | n/a |