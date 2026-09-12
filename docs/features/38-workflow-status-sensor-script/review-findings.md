# Review findings — 38-workflow-status-sensor-script

Fold ledger for the end review of feature 38 (schema `finding-mark@1` /
`review-mark@1`, `skills/pre-execution-review/references/LEDGERS.md`).
Created 2026-09-11 by `/review-change` (cycle 1, single-reviewer) over
HEAD `0a9b740d9a6195f4788aaffdc60725b3260e96d3` (PR #213). Every row below is a
**confirmed** candidate verified against the reviewed head's bytes; each carries
its `VF-` signature. `folded` is flipped to `yes` only by the unit's fold cycle
(`/fold-findings`).

Cycle 2 (2026-09-11, single-reviewer) over HEAD
`e5fa988c7973e5871387e4d1bf7fb84782452604`: every cycle-1 folded row was
re-verified **pass** at its cited location (no regressions, no `regression of`
rows); the cycle-2 passes surfaced new fix-now findings F19–F26 below (cycle 2
produced new fix-now rows → `CONVERGENCE-ANOMALY` block appended to the
report). F21 is a **new** bypass vector distinct from folded F13 (F13's
confinement itself verified present at current bytes; F21 is the leaf-only
symlink gap the confinement leaves open).

Cycle 3 (2026-09-12, single-reviewer) over HEAD
`cc82069884ef4547ec03c4bcbc49a91860c97b51` — user-instructed third cycle (the
two-cycle cap's explicit-instruction escape). All 21 `folded: yes` rows were
re-verified **pass** at current bytes (no regressions, no `regression of`
rows). The fold-batch diff `e5fa988..cc820698` tripped both delta-escalation
triggers (Size: 630 changed lines > 200; Width: changed files outside the
folded rows' cited union), so the cycle ran as a **full pass** and surfaced
new fix-now findings F27–F36 (cycle ≥ 2 produced new fix-now rows →
`CONVERGENCE-ANOMALY` printed in the report; loop cap reached — residue
routes to `/triage-issue --prioritize-now`).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | scripts/workflow-status.mjs:127 (field "Status" regex `^\s*Status:`) | code | high | fix-now | fold into phase | yes |
| F2 | scripts/workflow-status.mjs:178 (`--limit 20` merged window feeding isMerged) | code | med | fix-now | fold into phase | yes |
| F3 | scripts/workflow-status.mjs:434-446 (step-6a verifier spawn, cwd PROJECT only) | code | med | fix-now | fold into phase | yes |
| F4 | scripts/workflow-status.mjs:655 (unreachable receipt-gate branch in resolveNext) | code | med | fix-now | fold into phase | yes |
| F5 | scripts/workflow-status.mjs:743 (`OPEN_STATES` filter skips done-but-unmerged units) | code | med | fix-now | fold into phase | yes |
| F6 | scripts/workflow-status.mjs:506 (currency binds unitDir, not SPEC bound inputs) | code | med | fix-now | fold into phase | yes |
| F7 | scripts/workflow-status.mjs:513-530 + :250 (readFixNow severity passthrough + unescaped `\|` split) | verify | med | fix-now | fold into phase | yes |
| F8 | scripts/workflow-status.mjs:518 (separator guard admits no-space dash rows) | code | med | fix-now | fold into phase | yes |
| F9 | skills/workflow-status/references/ENVELOPE_CORE.md (steps 10-12 + tier table + tasks_from_boundary) | code | med | fix-now | fold into phase | yes |
| F10 | scripts/workflow-status.mjs:152 (`git fetch --quiet` writes refs) | code | med | fix-now | fold into phase | yes |
| F11 | scripts/workflow-status.mjs:727-742 (readCrashRecovery current-branch-only + false clean evidence) | code | med | fix-now | fold into phase | yes |
| F12 | skills/workflow-status/SKILL.md:27 + references/SENSOR_CORE.md:3 + docs/workflow/ORCHESTRATION.md:38 + script USAGE:56 | code | med | fix-now | fold into phase | yes |
| F13 | scripts/workflow-status.mjs:465-470 + :99-107 (unitDirFor/readProject unconfined) | security | med | fix-now | fold into phase | yes |
| F14 | scripts/workflow-status.mjs:568-587 (loadHint unbounded absolute-path read) | security | med | fix-now | fold into phase | yes |
| F18 | scripts/workflow-status-sensor.test.mjs (no findings-ledger boundary coverage) | verify | med | fix-now | fold into phase | yes |
| F19 | scripts/workflow-status.mjs:229-239,35,98,371 (forge reads) | perf | med | fix-now | fold into phase | yes |
| F20 | scripts/workflow-status.mjs:916,923-924,517 | perf | med | fix-now | fold into phase | no |
| F21 | scripts/workflow-status.mjs:105-121 (projectPath/readProject; same leaf-only pattern pre-execution-snapshot.mjs:167) | security | med | fix-now | fold into phase | yes |
| F22 | docs/features/38-workflow-status-sensor-script/ACCEPTANCE.md (SPEC criterion A:24 row dropped) | workflow | med | fix-now | replan-in-unit (user-confirmed manifest amendment, then /review-plan 38) | no |
| F23 | scripts/workflow-status.mjs:1064 | code | med | fix-now | fold into phase | yes |
| F24 | scripts/workflow-status.mjs:586-593 | code | med | fix-now | fold into phase | yes |
| F25 | scripts/workflow-status.mjs:482-500 | code | med | fix-now | fold into phase | yes |
| F26 | docs/workflow/MIGRATION.md:12-13 + .es.md:12-13 + ORCHESTRATION.md:41-43 + .es.md:43-44 | usage-docs | med | fix-now | fold into phase | yes |
| F27 | scripts/workflow-status.mjs:1139-1152 (vs :511-524 — build_order derived twice, divergent output) | code | med | fix-now | fold into phase | no |
| F28 | scripts/workflow-status.mjs:429-431 (zero-PR success read as forge failure) | code | med | fix-now | fold into phase | no |
| F29 | scripts/workflow-status.mjs:273-276,284-285 (parse cause misattributed to no-network) | code | med | fix-now | fold into phase | no |
| F30 | scripts/workflow-status.mjs:273-276,415,940,1015 (non-array forge answer → exit 1 vs declared degrade contract) | code | med | fix-now | fold into phase | no |
| F31 | scripts/workflow-status-sensor.test.mjs:476-479 (concurrency pin runs sequentially) | verify | med | fix-now | fold into phase | no |
| F32 | scripts/workflow-status.mjs:224,229 (duplicate full `git status` scans) | perf | med | fix-now | fold into phase | no |
| F33 | scripts/workflow-status.mjs:700-703,755 (2 git spawns per local branch, eager) | perf | med | fix-now | fold into phase | no |
| F34 | scripts/workflow-status.mjs:642,647,996-1004 (readReviewMark 2 spawns/ledger, no OPEN_STATES gate) | perf | med | fix-now | fold into phase | no |
| F35 | scripts/workflow-status.mjs:247,255 (forge reads without --limit; gh page-30 truncation falsifies counts) | perf | med | fix-now | fold into phase | no |
| F36 | docs/workflow/MIGRATION.es.md:3 (language-switcher self-link; hard bilingual rule) | usage-docs | med | fix-now | fold into phase | no |
| VF-1 | docs/workflow/REPOSITORY_STATE.md:14 · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck live run: sensor emitted repository_state status "draft" on this repo's frozen table-form ledger; colon-regex read at :127 misses `\| Status \|` rows (template/docs/workflow/REPOSITORY_STATE.md:12 same shape) | code | confirmed | finding-mark | n/a | n/a |
| VF-2 | gh pr view 150/24 → MERGED · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck live run: 25/33 dependencies.unmet are done units with MERGED PRs outside the 20-PR window; 12 spurious substrate blockers | code | confirmed | finding-mark | n/a | n/a |
| VF-3 | /tmp cross-root fixture · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck reproducer: sensor with PROJECT=/tmp/sensed-repo produced pre_execution rows computed from the sensor's own checkout (pre-execution-snapshot.mjs:56 binds repoRoot from import.meta.url, refuses outside-root dirs) | code | confirmed | finding-mark | n/a | n/a |
| VF-4 | fixture: planned unit + stale plan receipt, state OK → next "/workflow-status" · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck static trace :655 branch requires state BLOCKED which only the NRS branch (returning first at :642) produces; SKILL.md turn contract promises /review-plan for gate-blocked planned units | code | confirmed | finding-mark | n/a | n/a |
| VF-5 | live: unit 38 done with open PR #213 · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck code+doc: :743 skips every non-OPEN status before any PR check; SENSOR_CORE step 6a requires sensing done-with-open-PR rows | code | confirmed | finding-mark | n/a | n/a |
| VF-6 | SPEC.md:672-674 · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck direct read: SPEC requires "no later commit touched a bound input", script binds unitDir only; live: 0/47 units show a current mark (32 ledgers with REVIEW-RAN rows all review_pending true; 15 without ledgers report null/false) | code | confirmed | finding-mark | n/a | n/a |
| VF-7 | this repo · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck live: `node scripts/workflow-status.mjs 2>err` exit 0, stderr "envelope self-check failed" with 12 validateEnvelope errors (fix_now severities "critical", `").split("` debris, empty), schema-invalid envelope on stdout | verify | confirmed | finding-mark | n/a | n/a |
| VF-8 | /tmp fixture · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck reproducer: no-space `\|-----\|` 7-cell separator row projected as fix_now[0] {"id":"-----"}; spaced form and `\|---\|` are filtered, the no-space form is not | code | confirmed | finding-mark | n/a | n/a |
| VF-9 | direct read · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck direct read: ENVELOPE_CORE documents per-unit review/closure/issues_born absent from buildProjections output, tasks_from_boundary always null (:867), tier table omits /review-spec//review-plan present in TIER_MAP (:44-45) | code | confirmed | finding-mark | n/a | n/a |
| VF-10 | direct read · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck direct read: :152 `git fetch --quiet` updates remote-tracking refs/FETCH_HEAD (documented git behavior), contradicting header :8-10 "performs no write of any kind" | code | confirmed | finding-mark | n/a | n/a |
| VF-11 | direct read · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck direct read: readCrashRecovery pushes a single branch entry and hardcodes evidence "clean tree, coherent ledgers" on the non-unit-branch early return regardless of gitState.dirty; CRASH_RECOVERY.md:59-62 mandates per-unit-branch worst-wins | code | confirmed | finding-mark | n/a | n/a |
| VF-12 | direct read · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck direct read: SKILL.md:27, SENSOR_CORE.md:3, ORCHESTRATION.md:38, USAGE:56 all show `node scripts/...`; CLAUDE.md:269-274 declares bun-first strings with node as fallback | code | confirmed | finding-mark | n/a | n/a |
| VF-13 | direct read · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck direct read: unitDirFor builds docs/features/<unit.id> from parsed slug cells, readProject path.join(PROJECT, rel) with no confinement/realpath check | security | confirmed | finding-mark | n/a | n/a |
| VF-14 | direct read · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck direct read: loadHint accepts any absolute path and fs.readFileSync unbounded; no size cap, no confinement | security | confirmed | finding-mark | n/a | n/a |
| VF-18 | direct read · reviewer review-change · HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · recheck direct read: sensor test suite has zero `severity` assertions and no malformed review-findings.md fixture; mutation check confirmed the 33 existing tests bind (guard removals fail them) — the boundary itself is untested | verify | confirmed | finding-mark | n/a | n/a |
| VF-19 | gh shim sleep-2 reproducer · reviewer review-change · HEAD e5fa988c7973e5871387e4d1bf7fb84782452604 · recheck reproducer: 4 sequential `gh` calls, wall 8.75s ≥ 4×2s (healthy run 3.6s); per-call `FORGE_TIMEOUT_MS` (:35, :98); short-circuit only after first read (:229-237), then mergedPrs/openIssues (:238-239) and lazy allPrStates (:371-372) — no global forge deadline | perf | confirmed | finding-mark | n/a | n/a |
| VF-20 | NODE_OPTIONS --require spawn spy · reviewer review-change · HEAD e5fa988c7973e5871387e4d1bf7fb84782452604 · recheck reproducer: 3 verifier spawns = 3 detail.pre_execution rows (38/fix-191/fix-182); per-unit/stage call sites :923-924, spawn at :517 via process.execPath, uncapped; ≈160ms per spawn measured | perf | confirmed | finding-mark | n/a | n/a |
| VF-21 | /tmp/symfix fixture (docs/features → symlink /tmp/outside) · reviewer review-change · HEAD e5fa988c7973e5871387e4d1bf7fb84782452604 · recheck reproducer: fabricated out-of-repo receipt appeared in detail.pre_execution; projectPath prefix-checks the unresolved path (:105-110), readProject lstats only the final component (:117); distinct vector from folded F13 (confinement itself verified present) | security | confirmed | finding-mark | n/a | n/a |
| VF-22 | git archaeology · reviewer review-change · HEAD e5fa988c7973e5871387e4d1bf7fb84782452604 · recheck direct read: `git show ed7aae98` removed the A-24/ENVELOPE_CORE row; current ACCEPTANCE.md has no ENVELOPE_CORE row (grep 0); SPEC A:24 exists with validators passing at head (script-refs 2 ≥1, self-check prose 0); 32bb6434 reused the vacated AC-24 slot for #209 | workflow | confirmed | finding-mark | n/a | n/a |
| VF-23 | direct read · reviewer review-change · HEAD e5fa988c7973e5871387e4d1bf7fb84782452604 · recheck direct read: :1064 hardcodes state:"open"; schema PR_STATES [open,merged,none] (packages/agentic-workflow-schema/src/index.ts:228); forge.openPrs membership already in hand (isOpenPr :901) | code | confirmed | finding-mark | n/a | n/a |
| VF-24 | direct read · reviewer review-change · HEAD e5fa988c7973e5871387e4d1bf7fb84782452604 · recheck direct read: REVIEW_STAGE_ARTIFACTS/REVIEW_CONTEXT_PATHS re-declared :586-593 under a "Mirrors the two tables" comment; verifier exports STAGE_ARTIFACTS (:96); sensor import list (:20-24) does not import it | code | confirmed | finding-mark | n/a | n/a |
| VF-25 | direct read · reviewer review-change · HEAD e5fa988c7973e5871387e4d1bf7fb84782452604 · recheck direct read: identical receipt split regex + field fallbacks (sensor :483-495 vs verifier :299-330, incl. `Parent SPEC snapshot` ?? `Parent`) | code | confirmed | finding-mark | n/a | n/a |
| VF-26 | direct read · reviewer review-change · HEAD e5fa988c7973e5871387e4d1bf7fb84782452604 · recheck direct read: MIGRATION.md:12-13/.es.md:12-13 + ORCHESTRATION.md:41-43/.es.md:43-44 claim "only an invalid invocation is fatal" and "diagnostics … live in detail"; script :1152-1157 self-check failure → stderr note with exit 0, :1161-1166 any uncaught error → exit 1 | usage-docs | confirmed | finding-mark | n/a | n/a |
| VF-27 | scripts/workflow-status.mjs:1139-1152 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck reproducer: /tmp fixture (90 done/merged, 91 idea, 92 planned deps "90 91") → blocked_units[92].build_order ["90-shipped","91-missing","92-blocked"] vs dependencies.build_order ["91-missing","92-blocked"] | code | confirmed | finding-mark | n/a | n/a |
| VF-28 | scripts/workflow-status.mjs:429-431 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck reproducer: gh shim `--state all` → `[]` exit 0 → envelope degradation unavailable-forge-no-network + resolvable=false | code | confirmed | finding-mark | n/a | n/a |
| VF-29 | scripts/workflow-status.mjs:273-276 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck reproducer: gh exit 0 + non-JSON stdout → degradation unavailable-forge-no-network (real cause lost) | code | confirmed | finding-mark | n/a | n/a |
| VF-30 | scripts/workflow-status.mjs:273-276,1015 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck reproducer: gh exit 0 + non-array JSON → "workflow-status failed: (forge.openPrs ?? []).map is not a function", exit 1, 0 stdout bytes | code | confirmed | finding-mark | n/a | n/a |
| VF-31 | scripts/workflow-status-sensor.test.mjs:476-479 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck direct read: both run() (spawnSync) calls execute synchronously inside Promise executors — strictly sequential, property untested | verify | confirmed | finding-mark | n/a | n/a |
| VF-32 | scripts/workflow-status.mjs:224,229 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck measured: 10-iter two-call 0.324s vs single `--porcelain=v1 -b` 0.181s | perf | confirmed | finding-mark | n/a | n/a |
| VF-33 | scripts/workflow-status.mjs:700-703 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck direct read: rev-parse @{u} + rev-list --count per call; :755 calls branchIsUnpushed eagerly per unit-resolving branch | perf | confirmed | finding-mark | n/a | n/a |
| VF-34 | scripts/workflow-status.mjs:642,647 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck direct read: merge-base + log per marked ledger; loop :996-1004 has no OPEN_STATES gate (8 marked ledgers → 16 spawns/invocation) | perf | confirmed | finding-mark | n/a | n/a |
| VF-35 | scripts/workflow-status.mjs:247,255 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck direct read: openPrs/openIssues argv lack --limit (mergedPrs 20, allPrStates 1000); gh default page 30 truncates counts | perf | confirmed | finding-mark | n/a | n/a |
| VF-36 | docs/workflow/MIGRATION.es.md:3 · reviewer review-change · HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · recheck direct read: switcher is `> 🇪🇸 [Versión en español](MIGRATION.es.md)` (self-link); main had `> 🇬🇧 [English version](MIGRATION.md)`; introduced by 3161b614 (P4) | usage-docs | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · 2026-09-11 · review-change · axes: code, security, verify, perf (+ usage-docs inline) · verdict: REVIEW-FAIL · cycle: 1 |
| REVIEW-RAN | HEAD e5fa988c7973e5871387e4d1bf7fb84782452604 · 2026-09-11 · review-change · axes: code, security, verify, perf (+ usage-docs inline) · verdict: REVIEW-FAIL · cycle: 2 · folded-row re-verification: 15/15 pass | | | | | |
| REVIEW-RAN | HEAD cc82069884ef4547ec03c4bcbc49a91860c97b51 · 2026-09-12 · review-change · axes: code, security, verify, perf (+ usage-docs inline) · verdict: REVIEW-FAIL · cycle: 3 · folded-row re-verification: 21/21 pass · user-instructed third cycle (two-cycle-cap escape) | | | | | |
