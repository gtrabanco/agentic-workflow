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

Cycle 3 re-review ran on 2026-09-19 (`review-change`, head
`5ae908b19ca8a5153903e5c23808ee7fbeff51a6`, PR #249). Per-pass isolated
finders for the five applicable axes (code, verify, security, brand, perf);
the verification pass, the classifier (`review-implementation`) and the debt
transform (`review-debt`) each ran in a separate isolated context. Every
folded `yes` row (F1–F10) was re-verified at its cited location and holds;
the findings below are genuinely new (no `regression of` row).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F11 | skills/review-change/SKILL.md:155-160 | brand | med | fix-now | fold into current unit (source owner): drop the residual "`triage-issue` is user-invoked only for independent proposals" clause so the paragraph names the three modes without self-contradiction, and tighten the AC-06 discipline pin to require `triage-issue` in the matched clause instead of the unrelated adjacent sentence | yes |
| F12 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:26 · :28 | perf | med | fix-now | fold into current unit (source owner): re-base `plan-feature.mainEstimateMax` to `ceil(2826 × 1.10) = 3109` and refresh the declared baseline to `2826 est / 209 lines` — the F10 class (growth after the P2 re-basis) | yes |
| F13 | docs/features/32-review-consistency-pack/TASKS.md:68-76 | workflow | med | fix-now | fold into current unit: tick the 9 P5 tasks (or record why any stays open) so the phase ledger agrees with its `Unit-loop receipt — P5` ("Unit done") and the roadmap row `done · [#249]`; `UNIT_LOOP.md:17-18` makes an unticked phase unfinished | yes |

| VF-11 | skills/review-change/SKILL.md:155-160 · reviewer review-change · HEAD 5ae908b19ca8a5153903e5c23808ee7fbeff51a6 · recheck direct read: :155-156 reads "`triage-issue` is user-invoked only for independent proposals (D3)" beside the added :159-160 "…becomes proposals, audit findings, and `--prioritize-now` runs"; `PERSIST_AND_DECIDE.md:40-41` states the three modes; the AC-06 pin still matches the unrelated :156 sentence | brand | confirmed | finding-mark | n/a | n/a |
| VF-12 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:26 · reviewer review-change · HEAD 5ae908b19ca8a5153903e5c23808ee7fbeff51a6 · recheck `Math.ceil(Buffer.byteLength(text,'utf8')/4)` on `skills/plan-feature/SKILL.md` → 2826 est / 209 lines at head vs 2799 / 208 at `main`; declared `mainEstimateMax` 3079 = `ceil(2799 × 1.10)` < `ceil(2826 × 1.10) = 3109`; both budget gates still exit 0 (the ratio floor is enforced for routes only) | perf | confirmed | finding-mark | n/a | n/a |
| VF-13 | docs/features/32-review-consistency-pack/TASKS.md:68-76 · reviewer review-change · HEAD 5ae908b19ca8a5153903e5c23808ee7fbeff51a6 · recheck: P5 `## P5 — Hardening & PR` carries 9 `- [ ]` and 0 ticks while P1–P4 are fully ticked; `progress.md` P5 receipt reads "Next: PR #249 opened · Unit done"; `ROADMAP.md:42` reads `done · [#249]`; `UNIT_LOOP.md:17-18` declares an unticked phase unfinished | workflow | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 5ae908b19ca8a5153903e5c23808ee7fbeff51a6 | n/a | n/a | review-mark | n/a | n/a |

Cycle 4 re-review ran on 2026-09-19 (`review-change`, head
`24f88736e9683397d9769233f34cb0c130412a56`, PR #249). Per-pass isolated finders
for the five applicable axes (code, verify, security, perf, brand); the
verification pass, the classifier (`review-implementation`) and the debt
transform (`review-debt`) each ran in a separate isolated context. Every folded
`yes` row (F1–F13) was re-verified at its cited location and holds. Cycle 4 sits
**above the two-cycle cap** (three prior `REVIEW-RAN` marks): the new fix-now
rows repeat the F6/F7/F10/F12 budget-re-basis family and the F3/F5 wording
family, so the residue routes to `/triage-issue --prioritize-now` — a fourth
fold never starts without explicit user instruction. Refuted candidates: the
`audit-pr` `warning` scale claim (ED-32-5 / B-02 record `warning` as a
co-occurring note, not a scale value) and the per-skill sibling-headroom claim
(`SKILL_CONTEXT_BUDGETS.json:34` declares it a `schemaVersion: 1` limitation).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F14 | skills/product-audit/references/AUDIT_DIMENSIONS.md:15 | code | med | fix-now | fold into current unit (source owner): replace the restated range "audit-docs checks 1–13" with a citation to `audit-docs` as the count owner (14 checks) so check 14 is swept; pin in `review-loop-discipline` | yes |
| F15 | skills/review-change/references/PERSIST_AND_DECIDE.md:45-47 | code | med | fix-now | fold into current unit (source owner): reconcile "no ledger write happens" with the adjacent `GATE-RAN` mark duty (itself a ledger write) and add that duty to the "only mutations" sentence | yes |
| F16 | skills/review-implementation/references/CLASSIFY.md:11-13 | code | med | fix-now | fold into current unit (source owner): name `scripts/workflow-status.mjs`'s `SEVERITY_VOCABULARY` as the sensor's envelope projection of the same table, or scope the "no ad-hoc conversion" claim, so the declared single home is true | yes |
| F17 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:49 | perf | med | fix-now | fold into current unit (source owner): re-base `review-change.referenceEstimateMax` to `ceil(2799 x 1.10) = 3079` at a declared re-basis naming the growth source | yes |
| F18 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:66 · :72 | perf | med | fix-now | fold into current unit (source owner): re-base `workflow-status.referenceEstimateMax` to `ceil(2512 x 1.10) = 2764` and refresh the declared baseline (`2512 est`) | yes |
| F19 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:64-65 · :69 | perf | med | fix-now | fold into current unit (source owner): re-base `workflow-status.mainEstimateMax` to `ceil(1606 x 1.10) = 1767` and `mainLinesMax` to `ceil(127 x 1.10) = 140`, refreshing the declared baseline (`1606 est / 127 lines`) | yes |
| F20 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:9 · :25-28 | perf | med | fix-now | fold into current unit (source owner): declare `plan-feature.referenceEstimateMax` at `ceil(2151 x 1.10) = 2367` (the entry currently inherits `defaults` 2200, below the floor) | yes |

| VF-14 | skills/product-audit/references/AUDIT_DIMENSIONS.md:15 · reviewer review-change · HEAD 24f88736e9683397d9769233f34cb0c130412a56 · recheck direct read: :15 reads "run `audit-docs` checks 1–13" while `skills/audit-docs/SKILL.md:120` reads `Check (1-14)` and :124 `<n>/14` | code | confirmed | finding-mark | n/a | n/a |
| VF-15 | skills/review-change/references/PERSIST_AND_DECIDE.md:45-47 · reviewer review-change · HEAD 24f88736e9683397d9769233f34cb0c130412a56 · recheck direct read: :45 "On `REVIEW-PASS` with an open PR no ledger write happens" beside :47 "A reviewer also records a `GATE-RAN` mark"; `LEDGERS.md` §gate-ran@1 puts that mark in `review-findings.md` | code | confirmed | finding-mark | n/a | n/a |
| VF-16 | skills/review-implementation/references/CLASSIFY.md:11-13 · reviewer review-change · HEAD 24f88736e9683397d9769233f34cb0c130412a56 · recheck `grep -n SEVERITY_VOCABULARY scripts/workflow-status.mjs` → :718-721 (also present on origin/main); the "Only this section may convert" claim is `+` in `git diff main...HEAD` | code | confirmed | finding-mark | n/a | n/a |
| VF-17 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:49 · reviewer review-change · HEAD 24f88736e9683397d9769233f34cb0c130412a56 · recheck `Math.ceil(Buffer.byteLength(text,'utf8')/4)` on `skills/review-change/references/REVIEW_PROCESS.md` → 2799 est; declared ceiling 2800 < `ceil(2799 x 1.10) = 3079` | perf | confirmed | finding-mark | n/a | n/a |
| VF-18 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:66 · reviewer review-change · HEAD 24f88736e9683397d9769233f34cb0c130412a56 · recheck the same estimator on `skills/workflow-status/references/SENSOR_SIGNALS.md` → 2512 est; ceiling 2527 < `ceil(2512 x 1.10) = 2764`; declared baseline :72 reads "measured 2297 est" | perf | confirmed | finding-mark | n/a | n/a |
| VF-19 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:64-65 · reviewer review-change · HEAD 24f88736e9683397d9769233f34cb0c130412a56 · recheck the estimator on `skills/workflow-status/SKILL.md` → 1606 est / 127 lines (checker `lineCount`); ceilings 1680/136 < `ceil(1606 x 1.10) = 1767` / `ceil(127 x 1.10) = 140`; declared baseline "1527 est / 123 lines" | perf | confirmed | finding-mark | n/a | n/a |
| VF-20 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:9 · reviewer review-change · HEAD 24f88736e9683397d9769233f34cb0c130412a56 · recheck `skills.plan-feature` carries no `referenceEstimateMax`, so `defaults.referenceEstimateMax` 2200 applies; `skills/plan-feature/references/ROUTING.md` → 2151 est < `ceil(2151 x 1.10) = 2367` | perf | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 24f88736e9683397d9769233f34cb0c130412a56 | n/a | n/a | review-mark | n/a | n/a |
Cycle 5 re-review ran on 2026-09-21 (`review-change`, head
`3912d9c127ae6923a0090d57d78e0390e0c0faee`, PR #249). Per-pass isolated finders for the applicable
axes (code, verify, security, perf, brand); the verification pass, the
classifier (`review-implementation`) and the debt transform (`review-debt`)
each ran in a separate isolated context. Every folded `yes` row (F1–F13) was
re-verified at its cited location: F2–F13 hold, F1's route ceilings are a
regression (recorded below). The F14–F20 rows are the open rows this cycle
re-verified: their code fixes landed at 3912d9c1, but the fold did not flip
them, re-bundle the Pi mirror, or re-base the review-change route ceilings.
This cycle sits above the two-cycle cap (four prior REVIEW-RAN marks); the
residue routes to `/triage-issue --prioritize-now`.

| id | file:line | axis | severity | class | route | folded |
| --- | --- | --- | --- | --- | --- | --- |
| F21 | packages/pi-agentic-workflow/skills/product-audit/references/AUDIT_DIMENSIONS.md:1 · packages/pi-agentic-workflow/skills/review-change/references/PERSIST_AND_DECIDE.md:1 · packages/pi-agentic-workflow/skills/review-implementation/references/CLASSIFY.md:1 | verify | high | fix-now | fold into current unit (source owner): run `bun run bundle:skills` in `packages/pi-agentic-workflow` and commit the three rebuilt mirrors so `test/skill-parity.test.mjs` goes green (CLAUDE.md Verification: the committed mirror stays byte-identical to `skills/`), and make the CHANGELOG 0.13.0 row match the published bytes | yes |
| F22 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:76 | perf | med | fix-now | regression of F1 — fold into current unit (source owner): re-base the four `review-change:*` route ceilings to `ceil(measured x 1.10)` (adversarial 19418→19472, default-backend/default-web 17600→17654, synthesize 18114→18168) and their `routeLinesMax` (1401→1405, 1282→1286, 1306→1311), naming the F14–F20 fold's CLASSIFY.md/PERSIST_AND_DECIDE.md growth source; `node scripts/check-skill-context.mjs --routes` and `scripts/check-skill-context.test.mjs` must go green | yes |
| F23 | docs/features/32-review-consistency-pack/review-findings.md:93-99 | workflow | med | fix-now | fold into current unit: flip F14–F20 to `folded: yes` (their defects are fixed at 3912d9c1) or record why any stays open, so `node scripts/unit-route.mjs 32` stops reporting `open-rows: 7` / `route: fold` | yes |
| F24 | scripts/unit-route.mjs:114-117 | code | med | fix-now | fold into current unit (source owner): add `/^GATE-RAN$/i` to `isMarkRow` and pin it in `scripts/review-loop-discipline.test.mjs`, so a `gate-ran@1` mark row never parses as an open finding | yes |
| F25 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:75 · :79 | brand | med | fix-now | fold into current unit (source owner): reword both `workflow-status` `sources` entries to name the real growth unit — `skills/workflow-status/SKILL.md` (1606 est / 127 lines) and `references/SENSOR_SIGNALS.md` (2512 est / 150 lines) are byte-identical to main, so feature 32 P4 did not grow them | yes |
| F26 | skills/review-change/references/PERSIST_AND_DECIDE.md:45-52 | brand | med | fix-now | regression of F15 — fold into current unit: state one write path — fold the `REVIEW-RAN` and `GATE-RAN` marks into step 11's single ledger commit and drop the clause that says no additional ledger write happens beyond step 11, which the adjacent GATE-RAN duty contradicts | yes |

| VF-21 | packages/pi-agentic-workflow/skills/product-audit/references/AUDIT_DIMENSIONS.md:1 · reviewer review-change · HEAD 3912d9c127ae6923a0090d57d78e0390e0c0faee · recheck `diff -rq skills packages/pi-agentic-workflow/skills` → the three named files differ; `node --test test/skill-parity.test.mjs` exits 1 at head | verify | confirmed | finding-mark | n/a | n/a |
| VF-22 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:76 · reviewer review-change · HEAD 3912d9c127ae6923a0090d57d78e0390e0c0faee · recheck `node scripts/check-skill-context.mjs --routes` exits 1 with the four review-change failures at head and exits 0 at 24f88736 (git worktree) | perf | confirmed | finding-mark | n/a | n/a |
| VF-23 | docs/features/32-review-consistency-pack/review-findings.md:93-99 · reviewer review-change · HEAD 3912d9c127ae6923a0090d57d78e0390e0c0faee · recheck the F14–F20 `folded` cell reads `no` while `git show 3912d9c1 --stat` touches their files; `node scripts/unit-route.mjs 32` prints `open-rows: 7`, `route: fold` | workflow | confirmed | finding-mark | n/a | n/a |
| VF-24 | scripts/unit-route.mjs:114-117 · reviewer review-change · HEAD 3912d9c127ae6923a0090d57d78e0390e0c0faee · recheck `openRows` on a GATE-RAN row with four pipe-joined cmds returns `[{id:"GATE-RAN",...,folded:"exit 0"}]` (`isMarkRow` matches only `VF-`/`REVIEW-RAN`) | code | confirmed | finding-mark | n/a | n/a |
| VF-25 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:75 · reviewer review-change · HEAD 3912d9c127ae6923a0090d57d78e0390e0c0faee · recheck `git show origin/main:skills/workflow-status/SKILL.md` = head = 127 lines / 6424 B; `SENSOR_SIGNALS.md` = 150 lines / 10048 B on main and head; the branch diff touches neither | brand | confirmed | finding-mark | n/a | n/a |
| VF-26 | skills/review-change/references/PERSIST_AND_DECIDE.md:45 · reviewer review-change · HEAD 3912d9c127ae6923a0090d57d78e0390e0c0faee · recheck direct read: :45 says no additional ledger write happens beyond step 11 and :48 says a reviewer also records a `GATE-RAN` mark; :51 lists the mark separately from step 11's commit | brand | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 3912d9c127ae6923a0090d57d78e0390e0c0faee | n/a | n/a | review-mark | n/a | n/a |

Cycle 6 re-review ran on 2026-09-21 (`review-change`, head
`fda20a04396730e9a0e4a4a6e28a5b5a9e230f00`, PR #249). Per-pass isolated finders for the applicable
axes (code, verify, security, perf, brand); the verification pass, the
classifier (`review-implementation`) and the debt transform (`review-debt`)
each ran in a separate isolated context. Every folded `yes` row (F1–F20) was
re-verified at its cited location: holds. The F14–F20 defect fixes
at 3912d9c1 are verified correct. This turn flips all F14–F20 to `folded: yes`
and resolves all F21–F26 findings; F21 (Pi mirror re-bundle) was fixed by
running `npm run bundle:skills`; F22 (route ceilings) re-based at this
commit; F23 (ledger flip) is this action; F24 (isMarkRow/GATE-RAN) fixed
in `scripts/unit-route.mjs` with a pin in `review-loop-discipline.test.mjs`;
F25 (budget provenance false claims) reworded; F26 (PERSIST_AND_DECIDE
self-contradiction) reconciled.

Cycle 6 re-review ran on 2026-09-21 (`review-change`, head
`c4a552c0ac2406e651a621c02abb7c3a30288626`, PR #249) — completing the cycle-6
persist, which the prose above left without its `REVIEW-RAN` mark and without a
receipt. Per-pass isolated finders for the applicable axes (code, verify,
security, perf, brand); the verification pass, the classifier
(`review-implementation`) and the debt transform (`review-debt`) each ran in a
separate isolated context. The delta review escalated to a **full pass** on the
**width** trigger (changed lines in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`
lines 413–498 sit more than 50 lines from every cited line in that file).
Every folded `yes` row (F1–F26) was re-verified at its cited location: 19 hold,
F25 is a regression (recorded as F27), and six rows carry historical citation
drift (F1/F3/F6/F10/F17/F22 — the repaired defect holds, only the cited line
moved). All 12 candidate findings verified `confirmed` (0 refuted). This cycle
sits above the two-cycle cap (five completed `REVIEW-RAN` marks plus the
unmarked cycle-6 prose); the residue routes to
`/triage-issue --prioritize-now`.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F27 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:76 | perf | med | fix-now | regression of F25 — fold into current unit (source owner): the workflow-status `mainSources` claims `skills/workflow-status/SKILL.md` is "byte-identical to main", but the branch bumped `version:` 3.7.0 → 3.8.0; reword to "only the version line changed; size unchanged — baseline inherited from main" | no |
| F28 | skills/plan-feature/SKILL.md:94 | brand | med | fix-now | fold into current unit (source owner): replace `repair registration if needed` with main's named condition (`if any of the three is missing or wrong, fix the entry now`); `CLAUDE.md:128` bans "if needed" and this is its only occurrence in `skills/` at HEAD | no |
| F29 | skills/pre-execution-review/references/LEDGERS.md:121 | code | med | fix-now | fold into current unit (source owner): call `fold-findings:folded-flag` the map's **owner** entry, not its "annotator" (the annotator is `scripts/ledger-provenance.mjs`, per the `ledger-ownership@1` row) | no |
| F31 | scripts/unit-route.mjs:108-116 · scripts/workflow-status.mjs:739 · skills/workflow-status/references/SENSOR_SIGNALS.md:86-87 · skills/replan-findings/SKILL.md:70 | code | med | fix-now | fold into current unit (source owner): add `GATE-RAN` to the four mark-id enumerations now that `isMarkRow` matches it, so the documented contract agrees with the guard | no |
| F34 | CLAUDE.md:330-332 · skills/pre-execution-review/references/LEDGERS.md:211 | code | med | fix-now | fold into current unit (source owner): register `block:gate-ran@1` in the `normative-surfaces@1` inventory (or record the deferral in `known-issues.md` with a re-trigger), so the drift gate covers the new mark grammar | no |

| VF-27 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:76 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck `diff <(git show origin/main:skills/workflow-status/SKILL.md) skills/workflow-status/SKILL.md` → `version: 3.7.0 → 3.8.0` (NOT byte-identical) while the JSON claims "byte-identical to main" | perf | confirmed | finding-mark | n/a | n/a |
| VF-28 | skills/plan-feature/SKILL.md:94 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck direct read: `:94` reads "repair registration if needed"; `CLAUDE.md:128` bans "if needed"; `git show origin/main:… 94p` reads "if any of the three is missing or wrong, fix the entry now"; `git blame` → `8e5220e49` | brand | confirmed | finding-mark | n/a | n/a |
| VF-29 | skills/pre-execution-review/references/LEDGERS.md:121 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck direct read: `:121` calls `fold-findings:folded-flag` the "annotator" while `:145` puts it in the OWNER cell and `scripts/ledger-provenance.mjs` in the annotator cell; `git blame` → `8e5220e49` | code | confirmed | finding-mark | n/a | n/a |
| VF-30 | skills/execute-phase/references/FOLDING.md:43 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck `grep -nE "gate-ran" skills/execute-phase/references/EXECUTION_CONTRACT.md` → only `## Gate-run mark` and its pointer to `LEDGERS.md (§gate-ran@1)`; no local block id | brand | confirmed | finding-mark | n/a | n/a |
| VF-31 | scripts/unit-route.mjs:108-116 · scripts/workflow-status.mjs:739 · skills/workflow-status/references/SENSOR_SIGNALS.md:86-87 · skills/replan-findings/SKILL.md:70 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck direct read: all four enumerations name only `VF-<n>`/`REVIEW-RAN` while `unit-route.mjs:116` also matches `/^GATE-RAN$/i` | code | confirmed | finding-mark | n/a | n/a |
| VF-32 | skills/audit-docs/SKILL.md:77-79 · CHANGELOG.md:578 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck `git show bb2d8484 -- skills/audit-docs/SKILL.md` removes "run the command shown, don't infer." (old `:78`); tree-wide grep finds no replacement; the 2.1.0 CHANGELOG row says only "No check was added or removed" | code | confirmed | finding-mark | n/a | n/a |
| VF-33 | skills/review-change/references/PERSIST_AND_DECIDE.md:45 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck direct read: `:45` reads `docs(<unit>): persist review findings` (no range) while `CHANGELOG.md:438` documents `docs(<unit>): persist review findings F<n>–F<m>` | code | confirmed | finding-mark | n/a | n/a |
| VF-34 | CLAUDE.md:330-332 · skills/pre-execution-review/references/LEDGERS.md:211 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck `awk '/normative-surfaces@1/,/^```$/' CLAUDE.md \| grep ledger` → exactly 3 rows (`ledger-ownership@1`, `review-mark@1`, `finding-mark@1`); no `gate-ran@1` row | code | confirmed | finding-mark | n/a | n/a |
| VF-35 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:28 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck `wc -l skills/plan-feature/SKILL.md` → 208 while `:28` reads "2826 est / 209 lines" | perf | confirmed | finding-mark | n/a | n/a |
| VF-36 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:130 · :357 · :392 · :512 · :527 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck `Math.ceil(Buffer.byteLength(text,'utf8')/4)`: `origin/main` LEDGERS = 3462, HEAD = 3930, delta = 468 ≠ the declared "+423 estimate" | perf | confirmed | finding-mark | n/a | n/a |
| VF-37 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:45 · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck exact arithmetic: `ceil(2730 x 1.10) = 3003` while `:45` states 3004; `node scripts/check-skill-context.mjs` exits 0 | perf | confirmed | finding-mark | n/a | n/a |
| VF-38 | docs/features/32-review-consistency-pack/review-findings.md (F1, F3, F6, F10, F17, F22) · reviewer review-change · HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 · recheck cited lines now point at unrelated text (budget `:34`/`:40` = `},`, `:49` = `referenceSources`, `:76` = workflow-status note; CHANGELOG `:426`/`:574`/`:651` = header/blank/row) while the underlying repairs hold (`check-skill-context.mjs` and `--routes` exit 0, test fail 0) | workflow | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD c4a552c0ac2406e651a621c02abb7c3a30288626 | node --test scripts/*.test.mjs \| node scripts/check-skill-context.mjs \| node scripts/check-skill-context.mjs --routes | exit 0 | n/a | n/a | n/a |
