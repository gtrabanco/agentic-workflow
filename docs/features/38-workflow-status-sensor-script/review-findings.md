# Review findings — 38-workflow-status-sensor-script

Fold ledger for the end review of feature 38 (schema `finding-mark@1` /
`review-mark@1`, `skills/pre-execution-review/references/LEDGERS.md`).
Created 2026-09-11 by `/review-change` (cycle 1, single-reviewer) over
HEAD `0a9b740d9a6195f4788aaffdc60725b3260e96d3` (PR #213). Every row below is a
**confirmed** candidate verified against the reviewed head's bytes; each carries
its `VF-` signature. `folded` is flipped to `yes` only by the unit's fold cycle
(`/fold-findings`).

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
| REVIEW-RAN | HEAD 0a9b740d9a6195f4788aaffdc60725b3260e96d3 · 2026-09-11 · review-change · axes: code, security, verify, perf (+ usage-docs inline) · verdict: REVIEW-FAIL · cycle: 1 | | | | | |
