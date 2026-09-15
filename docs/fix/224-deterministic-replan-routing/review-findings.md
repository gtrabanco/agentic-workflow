# review-findings — fix-224-deterministic-replan-routing

Fix-now fold ledger for this unit, written by `/review-change` (Cycle 1,
2026-09-15, reviewed head `0e35b189ddf72acc7ff0a71f2d49e5c3136b367c`, PR #225).
Scope: `git diff origin/main...HEAD` (98 files, +2329/−146). All 19 candidate
findings from six isolated passes (code, security, verify, perf, brand,
api-ergonomics/usage-docs) were verified against this head — 19 confirmed,
0 refuted — then classified by `review-implementation` (coverage: pass).
Schema: `| id | file:line | axis | severity | class | route | folded |` — each
row is followed by its `finding-mark@1` verification row. `folded` is flipped
only by the fold cycle (`/fold-findings`). Low findings are report-only notes
in the review report, never rows here. Fold order note from the classifier:
**F19 first** (budget headroom blocks the F2/F7/F11 edits).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | .claude-plugin/plugin.json:33-40 | workflow | med | fix-now | fold (source) | yes |
| VF-1 | .claude-plugin/plugin.json:33-40 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck direct read + git evidence: the skills array holds 38 alphabetical entries ending `./skills/workflow-status` with no `./skills/replan-findings`, while internal `user-invocable: false` skills ARE registered (`implementation-discovery`, `planning-preflight`, `phase-contract`, `pre-execution-review`); the diff touches no `.claude-plugin` file (`git diff origin/main...HEAD --stat -- .claude-plugin/` → empty); the parity lint covers only `user-invocable: true` (skills/bump-skill/SKILL.md:117, docs/fix/71-skill-registration-parity/SPEC.md:104-105) so no test catches it; precedent `git log --all -S implementation-discovery -- .claude-plugin/plugin.json` → 7a7cfca3; Pi mirror exempt (packages/pi-agentic-workflow/package.json:26-27 declares `"skills": ["./skills"]`) | workflow | confirmed | finding-mark | n/a | n/a |
| F2 | scripts/workflow-status.mjs:760-775 | code | med | fix-now | fold (source) | yes |
| VF-2 | scripts/workflow-status.mjs:760-775 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck failing reproducer (isolated /tmp repo, `node scripts/workflow-status.mjs --json-only`): an open row whose frozen class is decision-required yields `next.suggested=[{"command":"/fold-findings","trigger":"unfolded fix-now finding(s) on the ledger",…}]` while the same row through the router (`UNIT_ROUTE_REPO=<tree> node scripts/unit-route.mjs 90-alpha`) answers `route: decision` / `next: decision required — stop and surface to the user`; readSuggestions tests only PLAN_ROUTE (:714) then folds; `grep -n decision scripts/workflow-status-sensor.test.mjs` → 0 matches (the SPEC-named S3 decision pin, docs/fix/224-deterministic-replan-routing/SPEC.md:244, is absent); SENSOR_SIGNALS.md:78-80 copy overclaims parity with the router | code | confirmed | finding-mark | n/a | n/a |
| F3 | CHANGELOG.md:95,159,392,443,553 · CHANGELOG.es.md:97,161,305,337,394,445,555 | code | med | fix-now | fold (source) | yes |
| VF-3 | CHANGELOG.md:95,159,392,443,553 · CHANGELOG.es.md:97,161,305,337,394,445,555 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck direct read vs origin/main (`git show origin/main:CHANGELOG.md`): 12 diff-added version rows carry a glued trailing 5th cell `\|---\|` (EN 5, ES 7 — all diff-added) and 12 diff-added delimiter rows are 3-cell (`|---|---|---|`) under 4-column headers (`| Version | Date | Type | What changed |` / `| Versión | Fecha | Tipo | Qué cambió |`; origin/main form was 4-cell; EN rows 302/334's 3-cell delimiters pre-exist — out of scope) → 10 tables × 2 languages render broken; violates CLAUDE.md's "Markdown is well-formed" green condition | code | confirmed | finding-mark | n/a | n/a |
| F4 | skills/workflow-status/references/ENVELOPE_FIELDS.md:15-16 | usage-docs | med | fix-now | fold (source) | yes |
| VF-4 | skills/workflow-status/references/ENVELOPE_FIELDS.md:15-16 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck direct read: the reference states `next.suggested[]` is "not yet mechanized … and do[es] not appear in its output" while scripts/workflow-status.mjs:1185 assigns it unconditionally and scripts/workflow-status-sensor.test.mjs:625 asserts its content; the file is untouched by the diff (the unit mechanized the surface but never scheduled this doc — SPEC `## Affected docs` lacks it) and its byte-identical Pi mirror copy ships the same falsehood | usage-docs | confirmed | finding-mark | n/a | n/a |
| F5 | skills/workflow-status/references/ENVELOPE_CORE.md:88-90 | usage-docs | med | fix-now | fold (source) | yes |
| VF-5 | skills/workflow-status/references/ENVELOPE_CORE.md:88-90 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck direct read: the reference says when nothing fires `next.suggested` is "omitted entirely (an empty/absent field, not an error)" while the sensor always emits `"suggested": []` (scripts/workflow-status.mjs:1185 unconditional; scripts/workflow-status-sensor.test.mjs:628-629 asserts the empty array); absence-keyed consumers mis-parse; stale byte-identical copy in the Pi mirror | usage-docs | confirmed | finding-mark | n/a | n/a |
| F6 | scripts/unit-route.mjs:292-317 | usage-docs | med | fix-now | fold (source) | yes |
| VF-6 | scripts/unit-route.mjs:292-317 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck failing reproducer (command output at the reviewed head): `node scripts/unit-route.mjs --help` → stderr `UNIT ROUTE — error` + `unknown unit: --help`, exit 1; `node scripts/unit-route.mjs -h` → `unknown unit: -h`, exit 1 — both standard help flags are treated as unit tokens; main() prints usage only for 0 or >1 args, so a first-time human/agent asking for help gets a wrong answer instead of usage | usage-docs | confirmed | finding-mark | n/a | n/a |
| F7 | skills/replan-findings/SKILL.md:43-44 (only route/read-set/rows documented) | usage-docs | med | fix-now | fold (source) | yes |
| VF-7 | skills/replan-findings/SKILL.md:43-44 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck missing-documentation method (grep over docs/workflow/ + skills/, excluding docs/fix/224-*): `grep -rln "open-rows\|UNIT ROUTE" docs/workflow/ skills/ --include="*.md"` → zero files; every `fingerprint` hit is the unrelated phase fingerprint — the routed block's header `UNIT ROUTE — <unit>` and fields `status:`, `open-rows:`, `next:`, `fingerprint:` (emitted at scripts/unit-route.mjs:318-329) plus exit codes 1/2 are documented nowhere outside the source header and the fix's own ledgers, while every routing doc points agents at the command | usage-docs | confirmed | finding-mark | n/a | n/a |
| F13 | scripts/unit-route.mjs:73-77 vs scripts/workflow-status.mjs:724-736 | code | med | fix-now | fold (source) | yes |
| VF-13 | scripts/unit-route.mjs:73-77 vs scripts/workflow-status.mjs:724-736 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck failing reproducer (isolated /tmp repo): ledger rows folded `-` (F1) and `""` (F2) → sensor counts both open (`findings.fix_now ids ["F1","F2"]` + `/fold-findings` suggestion, exit 0) while the router answers `open-rows: 0`, `route: execute`, `rows: none` (exit 0) — the two shipped surfaces disagree on the same frozen ledger row (router closes `yes/—/-/n/a/""`; sensor opens anything not in `yes/—/n/a`) | code | confirmed | finding-mark | n/a | n/a |
| F14 | scripts/unit-route.mjs:54-55,269-286 | code | med | fix-now | fold (source) | yes |
| VF-14 | scripts/unit-route.mjs:54-55,269-286 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck failing reproducer (committed fixture): `UNIT_ROUTE_REPO=scripts/fixtures/unit-route node scripts/unit-route.mjs 37-phase-lint-script` → `read-set (5)` without `docs/features/38-workflow-status-sensor-script/PLAN.md` nor `TASKS.md`, though both exist in the fixture (`find` confirms) and row F92 (fixture ledger line 21) cites `docs/features/38-workflow-status-sensor-script/{PLAN.md:29,TASKS.md:55}`; the un-braced cite `…37-phase-lint-script/PLAN.md:93` IS resolved, so the brace composition is exactly what the delimiter classes and the isDir guard drop — AC2's "each cited repository path" is unmet on this pattern | code | confirmed | finding-mark | n/a | n/a |
| F15 | scripts/workflow-status.mjs:767 | security | med | fix-now | fold (source) | yes |
| VF-15 | scripts/workflow-status.mjs:767 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck failing reproducer (isolated /tmp repo): a plan-owned open row with a 211-char id lands verbatim in `next.suggested[0].trigger` (length 279, `trigger.includes(longId) === true`, exit 0) — `plan.map((row) => row.id).join(", ")` is raw and uncapped, while the sibling surface bounds every echoed cell to 160 chars (CELL_MAX, scripts/unit-route.mjs:27,50-56; the same tree via the router echoes `rows:` at exactly 160 + `…`); JSON escaping prevents structural injection, so this is bounding discipline dropped on the changed path | security | confirmed | finding-mark | n/a | n/a |
| F19 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:6,48 | perf | med | fix-now | fold (source) — fold FIRST; unblocks F2/F7/F11 | yes |
| VF-19 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:6,48 · reviewer review-change · HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c · recheck measurement at the reviewed head: `node scripts/check-skill-context.mjs --skill plan-feature` → `plan-feature 2799` vs `mainEstimateMax: 2800` (headroom 1); `wc -c skills/workflow-status/references/SENSOR_SIGNALS.md` → 9186 bytes → est ceil(9186/4)=2297 vs `referenceEstimateMax: 2300` (headroom 3) — any future one-token edit of two core files trips the gate, including this review's own F2/F7/F11 repairs; repair per the manifest's declared policy: re-basis with `ceil(measured × 1.10)` and a named growth source, or trim | perf | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 0e35b189ddf72acc7ff0a71f2d49e5c3136b367c | n/a | n/a | review-mark | n/a | n/a |
| F21 | gate: Review receipt — PR #225 head a74ee351 (0 comments, 0 reviews) | Review receipt | high | fix-now | replan-in-unit: the phase ledger never schedules the end-review hop (P8 ends at "Commit `docs: link PR #<n>` and push"), so no `review-change` pass receipt exists at the close-out head; append the phase that runs `/review-change` at `a74ee351`, folds on REVIEW-FAIL, re-reviews and hands to `/audit-pr` | yes |
| F22 | gate: Pre-execution lineage — `pre-execution-snapshot.mjs verify --stage plan --unit fix-224` | Pre-execution lineage | high | fix-now | replan-in-unit: the newest plan receipt `rp-224-20260915-003` (snapshot `a65783d8…779f`) no longer re-derives — `current:false`, `digestMatches:false`, `reasonCode: stale-source-revision`, "reviewed at dbbd6a92, bound bytes now sit at 0e35b189", `changedPaths:[docs/fix/224-deterministic-replan-routing/SPEC.md]` (the P1–P8 `[ ]`→`[x]` tick flips); this replan rotates `artifactRevisionId` and the phase re-runs `/review-plan fix-224` to re-bind the receipt | yes |
| F23 | scripts/unit-route.mjs:210-220 (`fixIndexStatus`, post-merge dogfood) | code | low | fix-now | replan-in-unit: the `status` field echoes the fix-index markdown cell — `node scripts/unit-route.mjs 224-deterministic-replan-routing` prints `status: \`done` (leading backtick) because `cells[3].split("·")[0]` keeps `docs/fix/README.md:30`'s cell (`\`done · [#225](…)`) verbatim, while the roadmap path prints a clean `status: done` (`docs/features/ROADMAP.md:47`); no test asserts the field (`scripts/unit-route.test.mjs` asserts the `result.status` exit code only); strip the markdown form and pin both surfaces | yes |
| F24 | scripts/unit-route.mjs:331-351 (route selection, post-merge dogfood) | workflow | med | fix-now | replan-in-unit: a `done` unit has no close-out route — with `open-rows 0` the router answers `route: execute` / `next: /execute-phase 224-deterministic-replan-routing` (S4 pins no-open-row → `execute`; the table never reads `status`) and the closed five-route vocabulary cannot express a missing/stale review receipt either (`routeOfRow` falls back to `fold`); needs the close-out decision, the AC1 vocabulary amendment and router tests | yes |
| F25 | scripts/phase-lint.mjs:653 (`finalCloseOut`) vs skills/replan-findings/references/PHASE_APPEND.md (append placement) | workflow | med | fix-now | replan-in-unit: the replay append contract cannot be linted — appending the mandated fresh final `Hardening & PR` makes the executed hardening non-last, and `finalCloseOut = index === phases.length - 1 && HARDENING_LAYERS.has(layer)` (line 653) is shared by box-3's task budget and box-7's `gh pr` position rule (line 585), so the executed phase's already-ticked task is retro-judged: `node scripts/phase-lint.mjs docs/fix/224-deterministic-replan-routing/SPEC.md` → `P8 box-7: task 5 carries a manual/external gate outside the hardening phase` + `verdict BLOCKED: lint-blocked`, while the same run passes P9–P12 8/8; no corpus case covers a replanned (two-hardening) plan; a fully-ticked phase is history and must not be re-judged by boxes 3 and 7, pinned as a corpus pair | yes |

Report-only notes (low/debt · never persisted, never blocking — debt items with
re-open triggers from `review-debt`):

- **F8** (brand/usage-docs): 6 surfaces (+ES siblings) say "its `route: replan` line names the planner" but the planner lives on the `next:` line (scripts/unit-route.mjs:320-324). TRIGGER: next edit of the routing prose (8 skill / 6 tutorial files) or a mirror re-bundle → reword to "names the planner on the `next:` line" in both languages + mirror.
- **F9** (usage-docs): `scripts/fixtures/unit-route/` has no README; `UNIT_ROUTE_REPO` documented only in the source header + test comment. TRIGGER: next touch of `scripts/fixtures/unit-route/` or a maintainer-docs round → add the 5-line fixture README (purpose, consumer, override, owner test).
- **F10** (brand): `unknown unit` error states the token but not the remedy (valid tokens: unit folder under `docs/features`/`docs/fix` or a fix-index issue number); the ambiguous error lists matches. TRIGGER: next edit of unit-route.mjs error paths → append the remedy.
- **F11** (brand): SENSOR_SIGNALS.md step-13 breaks its own "quote, never paraphrase, the owning skill's condition" rule — the new plan-owned trigger paraphrases review-change's PERSIST_AND_DECIDE.md:133-134 condition. TRIGGER: next SENSOR_SIGNALS.md edit (fold F19 first) → quote verbatim or attribute to the router.
- **F12** (brand/bilingual): PORTABLE_PROMPT.es.md:146-149 is untranslated English, byte-identical to PORTABLE_PROMPT.md:140-143, inside an otherwise-Spanish file. TRIGGER: next bilingual docs/mirror round (same-commit rule makes it a free rider) → translate the sentence.
- **F16** (security): the router sanitizer's flatten range misses C1 controls U+0080–U+009F (repro: `F1<U+0085>X` id → NEL byte `C2 85` survives to stdout); impact bounded to negligible by the evidence (cannot break line structure in UTF-8 consumers). TRIGGER: next router-sanitizer edit, or a consumer found treating C1 controls structurally → extend the range.
- **F17** (perf): the sensor reads+parses each unit's ledger 2× (3× when mark-eligible) — readFixNow and readSuggestions each call uncached readOpenRows (workflow-status.mjs:1129-1130, :717-718, :761, :170-176, :684); micro-optimization without measured need. TRIGGER: F20's tooling measures envelope latency, or the next workflow-status read-path refactor (folds free if F13 lands as a shared parser) → read once per unit.
- **F18** (perf): fixIndexStatus recompiles a loop-invariant RegExp per line (unit-route.mjs:198); micro-optimization without measured need. TRIGGER: next edit or measurement of the fixIndexStatus loop → hoist above the loop.

Proposals (batched for the user, no issues created — D3):

- **F20** (perf/tooling, low): adopt perf tooling — micro-bench harness for unit-route + the envelope build (none exists; F17/F18 deferred as premature precisely because impact is unmeasured). TRIGGER: next algorithmic change to the router/envelope → build the harness; it also unblocks paying F17/F18 with evidence.


---

Cycle 2 — delta on the fold receipt's `RE-REVIEW-REQUIRED (delta)` branch, **escalated to a full pass** — ran 2026-09-16 (`review-change`, fresh context, reviewed head `c3eca2379a917a332ff2d45cdb5678140b0a9b3f`, PR #225). Cycle 2 = 1 completed `REVIEW-RAN` mark + 1.

**Escalation — both delta triggers fired.** (1) *Width* — the fold batch `0318268e..c3eca237` (the fold-ledger persist, the replan, its four plan-review repair rounds, the `P9`–`P12` execution, the re-opened `P8` and the terminal re-bind) changed **22 files**, of which **19 lie outside the union of the folded rows' cited files** (`scripts/unit-route.mjs`, `scripts/phase-lint.mjs`, `skills/replan-findings/references/PHASE_APPEND.md`; the F21/F22 rows cite `gate:` commands, no file). (2) *Size* — `git diff --numstat a74ee351..HEAD` = **22 files** (limit 15) and **+1040/−83 = 1123 changed lines** (limit 200). The review therefore ran as a **full pass** over `git diff origin/main...HEAD` (111 files, +3701/−166), not over the fold diff.

**Structural preconditions at the reviewed head.** Workspace clean and remote-current (`git status --porcelain` empty; `git status -sb` in sync with `origin/fix/224-deterministic-replan-routing`). Acceptance manifest blob `git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` → `15e9661fdcafbc628419926806b27ae0532f021d`, an exact match with the blob recorded in the SPEC `## Status`. Plan receipt `rp-224-20260915-007` re-derived over snapshot `3d5009783b84b41be4c4000dc3ae0f7538a500a30c07c01824033fb1a74734fa` → `current: true`, `digestMatches: true`, `verdictIsPass: true`. No `docs/architecture/ARCHITECTURAL_INVARIANTS.md` exists → architectural invariants `n/a`.

**Every `folded: yes` row re-verified at its cited location — 16/16 repaired, 0 regressions.** F1 `.claude-plugin/plugin.json` carries `./skills/replan-findings` in a sorted 39-entry array. F2/F13 (`scripts/workflow-status.mjs:36,777`) the sensor imports `isOpen`/`isMarkRow`/`routeOfRow`/`sanitize` from the router and a decision-required row contributes **nothing**; the S3 pin exists (`scripts/workflow-status-sensor.test.mjs:681`). F3 the changelogs ship 24 four-cell delimiter rows and no three-cell row under a four-column header. F4/F5 both envelope references now state that `next.suggested` is emitted as an empty array. F6 `--help`/`-h` print the usage contract on stdout, exit 0. F7 the router's whole eight-field block is documented in `skills/replan-findings/SKILL.md`. F14 the brace-composed citation resolves to every file it names. F15 the plan-entry ids ride `sanitize`/`CELL_MAX`. F19 `plan-feature` main 3079 = ceil(2799 × 1.10) — repaired; the `workflow-status` reference ceiling is improved 2200 → 2527 (see the report-only note below). F21 the re-opened `P8` now carries tasks 9–10 (the independent end review, then the merge audit) — this review is that hop. F22 above. F23/F24 live `node scripts/unit-route.mjs 224-deterministic-replan-routing` → `status: done`, `route: close-out`, `next: /audit-pr`, and both surfaces are pinned (`scripts/unit-route.test.mjs:56,64`). F25 `node scripts/phase-lint.mjs docs/fix/224-deterministic-replan-routing/SPEC.md` → `verdict PASS`, overall fingerprint `1299caaa5db0fbec7062dc5a0a702397f8d518839c1dacc516019e212bbb1c6a`, on the replanned two-hardening ledger.

**Gates re-derived at the reviewed head.** `node --test scripts/*.test.mjs` → 418 pass / 0 fail, exit 0 · `cd packages/pi-agentic-workflow && bun run test` → 214 pass / 0 fail · `bun scripts/check-skill-context.mjs --routes --budgets` → `PASS context budgets: 40 skills`, exit 0 · `node scripts/phase-lint.mjs docs/fix/224-deterministic-replan-routing/SPEC.md` → `verdict PASS`, exit 0 · `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → 7 pass / 0 fail · `npx skills add . --list` → exit 0. Mutation proofs: reverting the `close-out` route and `statusToken()` turns `scripts/unit-route.test.mjs` red (`AC1/fix #224: a finished unit answers the terminal route` → `'execute' !== 'close-out'`); forcing `executedPhase()` false turns `scripts/phase-lint.test.mjs` red (`F25: an executed mid-plan hardening is not re-judged by box 3 or box 7` → `P1 Phase-lint: BLOCKED — box 7`).

**New rows F26–F28 below** come from an isolated brand pass (F26), an isolated verify pass (F27) and the orchestrator's own reproduced reproducer (F28), whose candidate the isolated security pass surfaced but judged below the bar on counter-evidence this review falsified. The classification engine (`review-implementation`, isolated, re-run over the updated table) applied the CLASSIFY.md severity floor and returned `COVERAGE: PASS`. Two lows are `ignore` (report notes below), and the cycle-1 report-only debt note F16 is **superseded by F28**.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F26 | skills/phase-contract/SKILL.md:62 | brand | med | fix-now | fold (source) — reword the armed-box enumeration to "boxes 1, 2, 4, 5, 6 and 8", then re-bundle the Pi mirror and sync the two changelog cells | yes |
| VF-26 | skills/phase-contract/SKILL.md:62-63 · reviewer review-change · HEAD c3eca2379a917a332ff2d45cdb5678140b0a9b3f · recheck direct read of all five authorities: the owner text enumerates "boxes 1, 2 and 4–8 stay armed for an executed phase" while its own preceding sentence says the exemption is "scoped to those two boxes"; `scripts/phase-lint.mjs:636` is `if (historical && (index === 2 \|\| index === 6)) continue;` (boxes 3 and 7); `scripts/phase-lint.mjs:621` states the correct set "boxes 1, 2, 4, 5, 6 and 8"; `scripts/phase-lint.test.mjs:345` lints a fully-ticked non-last `Hardening & PR` carrying a `gh pr` task to `PASS (8/8)` (box 7 not applied) while `:353` blocks the same phase unticked on box 7; `ACCEPTANCE.md:34` freezes "every other box stays armed"; the same wrong set is restated at `CHANGELOG.md:632`, `CHANGELOG.es.md:634` and in the byte-identical mirror `packages/pi-agentic-workflow/skills/phase-contract/SKILL.md` (`diff` → identical) | brand | confirmed | finding-mark | n/a | n/a |
| F27 | scripts/phase-lint.test.mjs:358 | verify | med | fix-now | fold (source) — add the box-8 pre-ticked corpus case AC14 names beside the box-4 one | yes |
| VF-27 | scripts/phase-lint.test.mjs:358 · reviewer review-change · HEAD c3eca2379a917a332ff2d45cdb5678140b0a9b3f · recheck direct read + reproducible command: `:358` is the only pre-tick corpus case and asserts `P1 Phase-lint: BLOCKED — box 4:` for `PRETICKED_BOX4_PLAN`, while `ACCEPTANCE.md:34` states the third case as "a pre-ticked phase with a box-4/box-8 defect blocks"; a scratch pre-ticked phase whose `Done-when:` carries no expected outcome → `P1 box-8: Done-when: carries no expected outcome` + `verdict BLOCKED: lint-blocked` (box 8 armed today), so the gap is corpus breadth, not behaviour | verify | confirmed | finding-mark | n/a | n/a |
| F28 | scripts/unit-route.mjs:51-57 | security | high | fix-now | fold (source) — flatten the C1 range (and any residual Unicode line/paragraph separator) in the one sanitizer and extend the S7 pin with a control-character case | yes |
| VF-28 | scripts/unit-route.mjs:51-57 · reviewer review-change · HEAD c3eca2379a917a332ff2d45cdb5678140b0a9b3f · recheck failing reproducer (`UNIT_ROUTE_REPO` scratch fixture, ledger row id `F1\u0085route: execute`): `node scripts/unit-route.mjs 99-c1` prints `rows: F1<C2 85>route: execute`, and the same stdout through a UAX#14 line-boundary consumer (Python `str.splitlines()`, run for real) yields two lines — `rows: F1` then a forged `route: execute` — inside a block whose contract is one route, first match winning, data never instructions; `sanitize()` flattens only `[\u0000-\u001f\u007f]` and JavaScript `\s` does not match U+0085; `scripts/unit-route.mjs` is a new file introduced by this unit (8cdf9548, absent on `origin/main`); AC12 governs exactly this sanitizer ("carries no verbatim ledger line … data, never instructions") and its S7 pin (`scripts/unit-route.test.mjs:222`) covers long and shell-shaped cells only; falsifies the cycle-1 note F16's counter-evidence "cannot break line structure in UTF-8 consumers" | security | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD c3eca2379a917a332ff2d45cdb5678140b0a9b3f | n/a | n/a | review-mark | n/a | n/a |

Report-only notes (low/ignore · never persisted, never blocking — debt items with
re-open triggers from `review-debt`):

- **D-224-01** (perf, ignore): `docs/workflow/SKILL_CONTEXT_BUDGETS.json:54` — `workflow-status.referenceEstimateMax` 2527 vs `skills/workflow-status/references/SENSOR_SIGNALS.md` measured 2512 (0.6% headroom) against the manifest's declared `relative-headroom` policy (10%), with `referenceSources` recording the re-basis measurement 2297. Refuted as this unit's defect: the ceiling **was** exactly `ceil(2297 × 1.10)` at its declared re-basis, which is what `policy.rules[0]` scopes ("at each declared re-basis"); the machine floor is deliberately route-scoped (`scripts/check-skill-context.mjs:206` is a plain breach check while `:321-350` carries the headroom floor for routes only); and `origin/main` already ships five untouched per-skill ceilings below the declared 10% (review-change 2800/2799, execute-phase 2588/2561, plan-feature default 2200/2151, review-plan 2350/2294, pre-execution-review 3557/3370) — this branch *raised* the entry 2200 → 2527. TRIGGER: the next edit of `skills/workflow-status/references/SENSOR_SIGNALS.md`, or measured headroom ≤ 0 → re-base that one ceiling to `ceil(measured × 1.10)` with a named growth source, else trim. (A repo-wide per-skill 10% headroom is a separate deliberate policy change, not a repair of this unit.)
- **D-224-02** (brand, ignore): `skills/phase-contract/SKILL.md:69,87` — the fixed result line `Phase-lint: PASS (8/8)` is nominal coverage for a phase whose boxes 3 and 7 were skipped, while plans record that token as the phase's binding lint result. Not a defect: the limitation is disclosed in the paragraph immediately above (`:57-64`) and in both changelog cells, and the token is a frozen output contract. TRIGGER: the next revision of the phase-contract result contract, or a consumer that must distinguish skipped boxes → annotate the token while keeping the fixed string parseable.
- The cycle-1 report-only notes **F8–F12, F17–F18** and the proposal **F20** stand unchanged. **F16** (the sanitizer's C1-control flatten gap) is **superseded by F28**: its recorded counter-evidence ("cannot break line structure in UTF-8 consumers") is falsified by F28's reproducer, so the gap is no longer a below-the-floor note.

Cross-pass disagreement (recorded, never silently dropped): the isolated
`review-debt` pass returned `Decision: FAIL` because it flagged the sanitizer
candidate back to the classifier as current-unit work that cannot ride as a
non-blocking note. The classifier re-ran over the updated table and classed it
`high`/fix-now (F28 above), which resolves the flag-back in the direction the
debt pass argued. No other disagreement remains; the union rule turned the
below-bar judgement into a persisted row rather than a note.

```text
CONVERGENCE-ANOMALY — fix-224 source
- Finding ids: new: F26, F27, F28 (no repeat of a prior row's location)
- Snapshots: 72f2f58d0ebf19189c77b2e3e8e8b4213e4b7548 -> c3eca2379a917a332ff2d45cdb5678140b0a9b3f (fix-224-artrev-0007 -> cycle-2 reviewed head)
- Missed: nothing missed by the cycle-1 review — its own reproducers were accurate. What survived was a below-the-floor note (F16) whose counter-evidence the cycle-2 reproducer falsified, and the two defects the replan's execution introduced in the F25/F24 repair surfaces: the owner-side rule text (F26) and the corpus breadth (F27) were written by `P11` and never re-read against the code, so the repair that closed F25 opened two record-fidelity defects.
- Owning stage: source (all three rows — the router sanitizer is this unit's new file; the phase-contract text and its corpus are this unit's edits)
- Why the prior review failed: cycle 1 verified each fold in isolation at its own cited line and classified the sanitizer gap below the floor on an impact claim it never exercised with a Unicode-line-boundary consumer; the replan's repair text was reviewed by the *plan* reviewer, which checks plan authority, not record fidelity against the shipped code.
- Route to owner: source rows -> `/fold-findings` with the explicit ids F26 + F27 + F28
```

```text
LOOP CAP REACHED — fix-224
- Finding ids: F26 + F27 + F28 (all source-owned, all foldable in one atomic batch)
- Cycles: 2 (REVIEW-RAN marks + forge receipts)
- Route: /triage-issue --prioritize-now 224-deterministic-replan-routing F26 F27 F28 (or the programmatic outer driver)
```

Cycle 2 completed two review→fold cycles without convergence (cycle 1's 19 rows
all folded, then the audit-pr gate rows F21–F25 folded through the replan, then
this cycle produced three new fix-now rows). The three rows are source-owned and
small enough to fold in place, but a verifying third cycle is the **user's**
escape, never a reviewer election — the cap block above names the residue route.

---

Cycle 3 — delta on the fold receipt's `RE-REVIEW-REQUIRED (delta)` branch,
**escalated to a full pass** — ran 2026-09-16 (`review-change --adversarial 3`:
three isolated, context-clean reviewers R1 correctness/logic, R2 security/inputs,
R3 SPEC-coverage — same model family, `Diversity label: same-model`,
`authorExclusion: not-enforceable`, reviewed head
`1e8080a76cc678c207d3916ee3bb8145b1762709`, PR #225). Cycle 3 = 2 completed
`REVIEW-RAN` marks + 1, and it runs **on the user's explicit instruction** — the
two-cycle cap was reached in cycle 2 and a third cycle never starts without one,
so this is the user's escape observed, never a reviewer election. No receipt is
posted: the table is not clean.

**Escalation — the width trigger fired; the size trigger did not.** *Width:* of
the fold batch `81f2d8cc..1e8080a7`'s **11 changed files**, **8 lie outside the
union of the folded rows' cited files** (`skills/phase-contract/SKILL.md:62`,
`scripts/phase-lint.test.mjs:358`, `scripts/unit-route.mjs:51-57`) —
`CHANGELOG.md`, `CHANGELOG.es.md`, `progress.md`, `review-findings.md`,
`docs/workflow/SKILL_CONTEXT_BUDGETS.json`,
`packages/pi-agentic-workflow/package.json`,
`packages/pi-agentic-workflow/skills/phase-contract/SKILL.md`,
`scripts/unit-route.test.mjs` (no cited-file changed line sits more than 50 lines
from a cited line). *Size — not fired:* 11 files (limit 15) and 127 changed lines
(limit 200). The contract escalated the run to a **full pass over
`git diff origin/main...HEAD`** (111 files, +3843/−166), and that scope is what
surfaced F29–F34: every one of those defects sits in bytes **unchanged since
`c3eca237`**, so a delta-scoped run would have re-confirmed three clean folds and
missed all six.

**Delta obligations, all discharged at the reviewed head.** Workspace clean and
remote-current (`git status --porcelain` empty; `git status -sb` in sync with
`origin/fix/224-deterministic-replan-routing`). Acceptance manifest blob
`git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` →
`15e9661fdcafbc628419926806b27ae0532f021d`, an exact match with the value recorded
in the SPEC `## Status`. Plan receipt `rp-224-20260915-007` re-derived over
snapshot `3d5009783b84b41be4c4000dc3ae0f7538a500a30c07c01824033fb1a74734fa` →
`current: true`, `digestMatches: true`, `verdictIsPass: true`. No
`docs/architecture/ARCHITECTURAL_INVARIANTS.md` exists → architectural invariants
`n/a`.

**Gates re-derived at the reviewed head.** `node --test scripts/*.test.mjs` →
**419 pass / 0 fail**, exit 0 · `cd packages/pi-agentic-workflow && bun run test`
→ **214 pass / 0 fail** · `node scripts/check-skill-context.mjs --routes
--budgets` → `PASS route budgets: 22 routes` + `PASS context budgets: 40 skills`,
exit 0 · `node scripts/phase-lint.mjs docs/fix/224-deterministic-replan-routing/\
SPEC.md` → `verdict PASS`, overall fingerprint
`1299caaa5db0fbec7062dc5a0a702397f8d518839c1dacc516019e212bbb1c6a`, exit 0 ·
`node --test scripts/normative-drift.test.mjs` → 17 pass / 0 fail ·
`node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → 7 pass / 0
fail · `npx skills add . --list` → exit 0 ·
`node scripts/unit-route.mjs 224-deterministic-replan-routing` → `status: done` /
`open-rows: 0` / `route: close-out` / `next: /audit-pr`, fingerprint
`8dbfbbb10f2bc1d50198909cb7be0d7e3912cb715cf0556cc1fe7578a9ec4efd`. ACPI1–AC14
were each re-derived by its own validator (AC1/AC2/AC3/AC4/AC5/AC12 by
`scripts/unit-route.test.mjs`, AC6 by `scripts/workflow-status-sensor.test.mjs`,
AC7/AC8 by the 16 greps ≥ 1 each, AC9 by the budget checker + `npx skills add .
--list`, AC10 by the parity suite, AC11 by the whole-script gate, AC13 by the
three version greps, AC14 by `scripts/phase-lint.test.mjs` → 130 pass / 0 fail
plus the owner-text grep). All 18 evaluation rows met, none untouched.

**Folded-row re-verification — 19/19 rows re-verified at their cited locations;
18 repaired, 1 re-opened.** F26 `skills/phase-contract/SKILL.md:62` now reads
"boxes 1, 2, 4, 5, 6 and 8 stay armed", matching `scripts/phase-lint.mjs:621` and
`:636` (`index === 2 || index === 6`), with frontmatter `1.0.5`, both per-skill
changelog cells and a byte-identical Pi mirror (`diff` empty); F27
`scripts/phase-lint.test.mjs:358` carries the box-8 pre-ticked case beside the
box-4 one (130 pass / 0 fail); F28's cited defect (C1 + U+2028/U+2029 survival) is
repaired — a scratch fixture with NEL-, U+2028- and ESC-prefixed ids renders one
`rows:` line with no control byte surviving, and Python `str.splitlines()` returns
a single line. **F28's declared class invariant is not repaired → recorded as F33
`regression of F28`.** F1 `.claude-plugin/plugin.json` still registers
`./skills/replan-findings` · F2/F4/F5 the shared predicate is imported by the
sensor, the decision pin lives at `scripts/workflow-status-sensor.test.mjs:681`,
and both envelope references state `next.suggested` is emitted as an array · F3 the
four rows this batch added carry their table's arity (4 in the package table, 5 in
the per-skill table) and no delimiter row was touched · F6 `--help`/`-h` exit 0 ·
F7 the whole block is documented in `skills/replan-findings/SKILL.md` · F13 the
sensor imports `isOpen`/`isMarkRow`/`routeOfRow`/`sanitize` from the router · F14 the
brace-composed citation resolves to all seven paths · F15 ids still ride
`sanitize`/`CELL_MAX` · F19 all 22 route estimate ceilings sit exactly at
`ceil(measured × 1.10)` · F21 the re-opened `P8` still carries tasks 9–10 · F22 the
plan receipt is `current: true` · F23/F24/F25 live `status: done` /
`route: close-out` / `next: /audit-pr` and `verdict PASS`.

**Gate repair disclosed in the batch, verified sanctioned.**
`docs/workflow/SKILL_CONTEXT_BUDGETS.json` moved **12** `routeEstimateMax`
ceilings (not the two the commit message and `policy.declared` name): every route
loading `phase-contract` crossed its `ceil(measured × 1.10)` floor when the +9-byte
wording landed, and `scripts/check-skill-context.mjs:337-346` enforces that floor
for routes ("raise it at a declared re-basis … or trim the route"), so the raises
were **required**, not a weakening; a re-measure confirms all 12 equal the formula
exactly. The under-disclosure is carried as report note D-224-03 below.

**New rows F29–F34 below** come from the three reviewers (F29/F30/F31/F32/F34 from
single reviewers with independent reproducers, F33 flagged by 2/3). Three
candidates were **refuted** with counter-evidence (C6, C9, C11 — see the report).
The classification engine (`review-implementation`, isolated) returned
`COVERAGE: PASS`, moved C4 to `replan-in-unit` as plan-owned (the AC1 route
vocabulary needs a user-confirmed phase) and raised C10 from finder-low to `med`
under the severity floor.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F29 | scripts/unit-route.mjs:116 | code | high | fix-now | fold (source) — read `folded` as the row's **last** cell, never `cells[6]`, and pin an 8–9-cell corpus row | yes |
| VF-29 | scripts/unit-route.mjs:116 · reviewer review-change · HEAD 1e8080a76cc678c207d3916ee3bb8145b1762709 · recheck failing reproducer (live checkouts, no scratch): `node scripts/unit-route.mjs 37-phase-lint-script` → `status: done` / `open-rows: 5` / `route: replan` / `rows: F12 F15 F29 F42 F99`, while all five rows of `docs/features/37-phase-lint-script/review-findings.md` (lines 64, 68, 116, 199, 900) end `\| yes \|`; importing `openRows` returns `folded: "x)]` checkbox) + corpus fixtures"` for line 64 — route text — because an unescaped `\|` inside the route cell yields 8–9 cells and the destructuring at `:116` reads `cells[6]`; `scripts/unit-route.mjs` is this unit's new file (absent on `origin/main`), AC1 freezes `close-out` as "the route of a finished unit", and the sensor projects the same rows through the imported predicate; this ledger itself already carries a 21-cell `VF-` row at line 22 (cycle 1's, quoting the changelog fragments) that only the mark-row id filter keeps out of the projection — the parser's fragility is visible inside the unit's own ledger | code | confirmed | finding-mark | n/a | n/a |
| F30 | scripts/unit-route.mjs:89-92 | code | high | fix-now | fold (source) — accept the ledger's own annotated closed spellings (prefix match on `yes`/`—`/`-`/`n/a`) and pin them | yes |
| VF-30 | scripts/unit-route.mjs:89-92 · reviewer review-change · HEAD 1e8080a76cc678c207d3916ee3bb8145b1762709 · recheck failing reproducer: `isOpen("yes · fold c95ff5b4") === true` and `isOpen("yes ↳ folded by 942ab62") === true` (direct import), while `skills/pre-execution-review/references/LEDGERS.md:119,141` declares that `scripts/ledger-provenance.mjs` appends exactly `· fold <sha>` / `· ticked <sha>` to the `folded` cell; `node scripts/unit-route.mjs 166-pi-0850-baseline-refresh` (ledger line 3 ends `yes · fold c95ff5b4`, unit `done`) → `open-rows: 1` / `route: fold` / `next: /fold-findings`, and `node scripts/unit-route.mjs 20-runtime-guardrails-progressive-skills` (roadmap `done`, 10 rows `yes ↳ folded by <sha>`) → `open-rows: 10` / `route: replan`; the predicate is this unit's code (F13's fold made the sensor import it, so both surfaces share the defect) | code | confirmed | finding-mark | n/a | n/a |
| F31 | scripts/unit-route.mjs:370-372 | usage-docs | med | fix-now | fold (source) — emit the documented `--fix <n>` invocation for a `docs/fix/` unit and pin the execute route's `next:` line | yes |
| VF-31 | scripts/unit-route.mjs:370-372 · reviewer review-change · HEAD 1e8080a76cc678c207d3916ee3bb8145b1762709 · recheck failing reproducer: `node scripts/unit-route.mjs 179-declared-ledger-delta-receipts` → `route: execute` / `next: /execute-phase 179-declared-ledger-delta-receipts`, while the fix invocation is frozen at `skills/execute-phase/SKILL.md:5` (`--fix <n>`), `skills/execute-phase/references/UNIT_LOOP.md:9-10` and `references/WORKFLOWS_FIX.md:3`, and the canonical machine strings print `--fix` (`scripts/workflow-status.mjs:649`, `skills/plan-fix/SKILL.md:69`); no test asserts the execute route's `next:` line | usage-docs | confirmed | finding-mark | n/a | n/a |
| F32 | scripts/unit-route.mjs:344,370 | workflow | med | fix-now | replan-in-unit (plan-owned): the archived half of F24 — give the closed route table a historical/merged state for a unit whose status source is gone (AC1 vocabulary + fixtures), via the plan owner | no |
| VF-32 | scripts/unit-route.mjs:344,370 · reviewer review-change · HEAD 1e8080a76cc678c207d3916ee3bb8145b1762709 · recheck failing reproducer: `node scripts/unit-route.mjs 100-stale-fix-index-rows` → `status: absent` / `route: execute` / `next: /execute-phase 100-stale-fix-index-rows` while `gh issue view 100 --json state` → `CLOSED`; `fixIndexStatus(...) ?? "absent"` at `:344`, and `docs/fix/README.md`'s legend plus `skills/execute-phase/references/WORKFLOWS_FIX.md:9` remove the index row on merge, so ~30 archived folders answer `execute`; F24's cited range `:331-351` contains `:344`, so this row is the unclosed part of F24 rather than a plain new location | workflow | confirmed | finding-mark | n/a | n/a |
| F33 (regression of F28) | scripts/unit-route.mjs:51-58 | security | med | fix-now | fold (source) — `regression of F28`: extend the one flatten class to the Unicode format characters, or stop claiming the class is closed, and pin a Cf case in S7 | yes |
| VF-33 | scripts/unit-route.mjs:51-58 · reviewer review-change · HEAD 1e8080a76cc678c207d3916ee3bb8145b1762709 · recheck failing reproducer: `sanitize("A\u202eB") === "A\u202eB"` (direct import) — U+202A–U+202E, U+2066–U+2069, U+200B–U+200D and U+00AD all survive the regex `[\u0000-\u001f\u007f-\u009f\u2028\u2029]`, while the comment the fold batch added at `:51-53` claims "no echoed cell can carry a character a consumer might read structurally"; F28's cited defect (C1 + U+2028/U+2029 survival) IS repaired at this location — the same sanitizer's declared class invariant is not, which is exactly the `regression of F28` the delta rule admits | security | confirmed | finding-mark | n/a | n/a |
| F34 | scripts/unit-route.mjs:303,334 | usage-docs | med | fix-now | fold (source) — either recognise a roadmap-tracked feature issue number or narrow the `--help`/header contract to fix-index issues, with a fixture | yes |
| VF-34 | scripts/unit-route.mjs:303,334 · reviewer review-change · HEAD 1e8080a76cc678c207d3916ee3bb8145b1762709 · recheck failing reproducer: `node scripts/unit-route.mjs 205` → stderr `UNIT ROUTE — error` / `unknown unit: 205`, exit 1, although #205 is an OPEN `docs/features/ROADMAP.md` row-50 feature issue with no unit folder and the router's own `--help` contract and header promise `<unit\|issue>` and "a tracked issue with no unit folder yet" (scenario S5); `fixIndexIssues()` reads only `docs/fix/README.md` (`:192-203`) and is the sole gate at `:334`; the classifier raised the finder-low to `med` under the severity floor (a documented input class dead-ends) | usage-docs | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 1e8080a76cc678c207d3916ee3bb8145b1762709 | n/a | n/a | review-mark | n/a | n/a |

Report-only notes (low/ignore · never persisted, never blocking — debt items with
re-open triggers):

- **D-224-03** (perf/workflow, low): `docs/workflow/SKILL_CONTEXT_BUDGETS.json:429`
  (`policy.declared`) and the fold commit message name **two** routes
  (`plan-feature:scoped`, `plan-fix:issue`) as having grown, while the batch moved
  **12** `routeEstimateMax` ceilings — every route loading `phase-contract` crossed
  its `ceil(measured × 1.10)` floor. The named growth source is correct and all 12
  raises were required by the checker's route headroom floor, so no gate is
  weakened; only the enumeration under-reports. TRIGGER: next edit of
  `policy.declared` or the next re-basis → name every route the batch moved.
- **D-224-04** (brand, low): `CHANGELOG.md:634` · `CHANGELOG.es.md:636` — the
  `phase-contract` **1.0.4** cells still read "boxes 1, 2 and 4–8" / "cajas 1, 2 y
  4–8" (includes the exempt box 7, omits box 1). The classifier kept it `ignore`:
  1.0.4 is a released historical record, the 1.0.5 cell directly below carries the
  correction, and `scripts/normative-drift.test.mjs` checks only the newest
  per-skill cell. TRIGGER: next changelog/normative-drift round → decide whether
  released history is rewritten or annotated.
- **D-224-05** (brand, low): `docs/fix/224-deterministic-replan-routing/SPEC.md:316,318`
  and `progress.md:656` repeat the same false enumeration ("boxes 2 and 4–8 stay
  armed"). The SPEC is frozen authority — a review may not edit it and the repair
  needs a user-approved amendment. TRIGGER: next user-approved SPEC
  amendment/replan touching `## Impact`; owning stage **plan**.
- **D-224-06** (verify, low): `scripts/phase-lint.mjs:636` — the executed-phase
  exemption keys only on "fully ticked", so a 12-task all-ticked phase lints
  `PASS (8/8)` where the same phase unticked is `BLOCKED — box 3`, and a pre-ticked
  non-final `gh pr` phase passes box 7; the owner's "pre-ticking … is a defect" is a
  policy declaration the plan text cannot mechanize. TRIGGER: next revision of the
  exemption/result contract, or a consumer that must distinguish pre-ticked from
  executed → enforce or restate the declaration.
- The cycle-1 report-only notes **F8–F12, F17–F18** and the proposal **F20** stand.
  **F8's trigger has fired** (`docs/workflow/REVIEW_AND_CLASSIFY.md:80`,
  `FEATURE_WORKFLOW.md:286`, `PORTABLE_PROMPT.md:141-142`, the router prose in
  `skills/review-change/references/OUTPUT_AND_GUARDRAILS.md:30-32`,
  `skills/review-implementation/SKILL.md:100`, `skills/fold-findings/SKILL.md:125`
  still say the planner is named on the `route: replan` line, while it is on
  `next:`), and **F12's trigger has fired**
  (`docs/workflow/PORTABLE_PROMPT.es.md:146-148` gained another English clause);
  both stay below the severity floor and are re-confirmed, not re-opened.

Cross-pass disagreement (recorded, never silently dropped): R2 called the sanitizer
residual a `DISPUTED` F28-fold; R1 assessed the same surface as `minor`/security.
Fusion kept the higher severity and the delta rule's only legitimate id
(`regression of F28`) instead of a plain new row. No other disagreement remains.

```text
CONVERGENCE-ANOMALY — fix-224 source
- Finding ids: new: F29, F30, F31, F32, F34 + F33 (regression of F28); none is a plain re-report of a prior row's location except F32, which is F24's own unclosed half (F24 cited :331-351, F32 sits at :344)
- Snapshots: c3eca2379a917a332ff2d45cdb5678140b0a9b3f -> 1e8080a76cc678c207d3916ee3bb8145b1762709 (cycle-2 reviewed head -> cycle-3 reviewed head; the plan artifacts are byte-identical across it — no artifactRevisionId rotation, plan receipt rp-224-20260915-007 still current)
- Missed: cycle 2 ran a full pass over the same bytes but exercised the router only through its committed fixture — whose rows carry exactly 7 cells and a bare `yes` — and never across the live `docs/features/*` and `docs/fix/*` ledgers, so the one row parser's positional `cells[6]` read (F29), the one open-row predicate's closed vocabulary against the workflow's own annotator token (F30), the fix-unit invocation string (F31), the missing status source of an archived unit (F32), the Cf character class (F33) and the roadmap-issue input class (F34) were all inside its scope and none was falsified.
- Owning stage: source (F29, F30, F31, F33, F34 — all in scripts/unit-route.mjs, this unit's new file) + plan (F32 — the closed AC1 route vocabulary)
- Why the prior review failed: both cycles verified the router against its own fixture and its own pins instead of against the fleet's ledgers; the fixture was authored alongside the parser, so it encoded the parser's assumptions. A reviewer that only runs the suite cannot falsify a parser whose corpus was written by the same hand.
- Route to owner: source rows -> `/fold-findings` with the explicit ids F29 + F30 + F31 + F33 + F34; plan row F32 -> `node scripts/unit-route.mjs 224-deterministic-replan-routing` (after this ledger write it prints `route: replan` and names `/plan-fix 224`) -> `/plan-fix 224` -> fresh `/review-plan fix-224` -> `/execute-phase 224`
```

```text
LOOP CAP REACHED — fix-224 (cycle 3 run on the user's explicit instruction)
- Finding ids: F29 + F30 + F31 + F32 + F33 + F34 (five source-owned and foldable in one batch, one plan-owned)
- Cycles: 3 (REVIEW-RAN marks + forge receipts); the cap of 2 was already reached in cycle 2, so cycle 4 needs the user's explicit instruction — never a reviewer election
- Route: /fold-findings F29 + F30 + F31 + F33 + F34 and /plan-fix 224 for F32, or /triage-issue --prioritize-now 224-deterministic-replan-routing F29 F30 F31 F32 F33 F34 (or the programmatic outer driver)
```

The cycle-3 residue splits cleanly: five source rows in one new file are one
atomic fold batch, and F32 is plan authority (the frozen AC1 route vocabulary),
so it takes the planner route that `node scripts/unit-route.mjs` now names. The
review's own scope decision is the lesson of this cycle: the fold batch was three
small in-scope repairs, but the width trigger escalated the run to a full pass,
and every new finding came from bytes the delta would have skipped.
