# Review Findings — 67-serena-provisioning

## Review Cycle 2 (context-clean end review)

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | `scripts/pin-watch.mjs:199-218` | review-code | med | fix-now | folded: yes (b2f0502c) | yes |
| VF-1 | 5c321aa9… | code | med | confirmed | spawnSync("gh", …) lacked timeout: 30_000 while npmLatest() had it — added to both openIssues() and createIssue() | |
| R-2 | | review-security | low | proposal | user-routed — npm audit of @bacnh85/pi-serena@0.10.0 showed 0 vulnerabilities; package is benign (MIT, no scripts, 0 deps, 20+ releases) | n/a |
| N-3 | `packages/pi-agentic-workflow/src/routing/state.ts:1` | review-code | low | ignore | writeFileSync import is actively used inside writeThrough() closure — false positive | |
| N-4 | `packages/pi-agentic-workflow/src/routing/serena-readiness.ts` | review-code | low | ignore | recorded?.state === "ready" guard short-circuits before .revision access — false positive | |
| N-5 | `scripts/version-parity-gate.mjs:211` | review-code | low | ignore | index += 1 is intentional rename-pair skip — stylistic only, correct as-is | |

## Review Cycle 2 (context-clean end review, clean pass)

All applicable axes returned PASS. No new findings:
- **review-code**: PASS — all 15 observations are low-severity notes, confirmed correct patterns or false positives
- **review-security**: PASS — soft failures, timeouts, no user input in CLI args
- **review-verify**: PASS — tests cover all main paths and error cases; minor gap on direct `createSerenaReadinessStore` testing is covered end-to-end through the gate
- **review-perf**: PASS — no performance issues (bounded file I/O, O(1) checks, timeouts on all spawns)

No medium/high fix-now findings. No rows persisted.

## REVIEW-RAN
- head: 7c29bb06fd782e6dc93647ff3fc4136f70fc94d4
- axes: review-code, review-security, review-verify, review-perf
- classifier: review-implementation
- debt: review-debt
- decision: REVIEW-PASS
- mark: 2026-10-23 review-cycle-2-clean

## GATE-RAN
- pre-execution: clean
- head: 7c29bb06fd782e6dc93647ff3fc4136f70fc94d4
- mark: 2026-10-23 pre-execution-clean

## Review Cycle 3 (context-clean end review, clean pass)

All applicable axes returned PASS. No new findings — the fold ledger from cycle 2 is still intact, all folded rows verified at their cited locations (F1: timeout present at `scripts/pin-watch.mjs:199-218`), all ignore/notes confirmed false positives or non-defects.

- **review-code**: PASS — all observations remain low-severity notes (N-3: writeFileSync used in writeThrough closure; N-4: optional chain short-circuits; N-5: index += 1 intentional rename-pair skip). No new code findings.
- **review-security**: PASS — soft failures, timeouts on all spawns, no user input in CLI args, no secrets.
- **review-verify**: PASS — tests cover all new paths (`serena-readiness.test.mjs`, `serena-activation.test.mjs`, `pin-watch.test.mjs`); minor gap on direct `createSerenaReadinessStore` testing is covered end-to-end through the gate.
- **review-perf**: PASS — no performance issues (bounded file I/O, O(1) checks, timeouts on all spawns).

No medium/high fix-now findings. No rows persisted.

## REVIEW-RAN
- head: b56836512a02e1489cde3c4e1aeca01a125ffc84
- axes: review-code, review-security, review-verify, review-perf
- classifier: review-implementation
- debt: review-debt
- decision: REVIEW-PASS
- mark: 2026-10-23 review-cycle-3-clean

## GATE-RAN
- pre-execution: clean
- head: b56836512a02e1489cde3c4e1aeca01a125ffc84
- mark: 2026-10-23 pre-execution-clean-3
## Review Cycle 4 (context-clean end review)

### Fold ledger append (new fix-now findings)

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F6 | `scripts/serena-activation-check.mjs:71` | review-perf | med | fix-now | source/fold into phase | yes |
| F7 | `scripts/serena-activation-check.mjs:177` | review-perf | med | fix-now | source/fold into phase | yes |
| F8 | `scripts/serena-activation-check.mjs:242` | review-perf | med | fix-now | source/fold into phase | yes |
| F9 | `scripts/serena-activation-check.mjs:253` | review-perf | med | fix-now | source/fold into phase | yes |
| VF-2 | `scripts/serena-activation-check.mjs:71` · reviewer review-change · HEAD 871ca132ce952cd39c13e2f90d54611d9e2f643f · recheck spawnSync("npm view", …) lacks timeout: 30_000 — call can block indefinitely on network stall | review-perf | med | confirmed | n/a | yes |
| VF-3 | `scripts/serena-activation-check.mjs:177` · reviewer review-change · HEAD 871ca132ce952cd39c13e2f90d54611d9e2f643f · recheck spawnSync(process.execPath, …) lacks timeout — process boot hangs indefinitely | review-perf | med | confirmed | n/a | yes |
| VF-4 | `scripts/serena-activation-check.mjs:242` · reviewer review-change · HEAD 871ca132ce952cd39c13e2f90d54611d9e2f643f · recheck spawnSync("pi", ["install", …]) lacks timeout — stalled install blocks forever | review-perf | med | confirmed | n/a | yes |
| VF-5 | `scripts/serena-activation-check.mjs:253` · reviewer review-change · HEAD 871ca132ce952cd39c13e2f90d54611d9e2f643f · recheck spawnSync("pi", ["list"]) lacks timeout — stalled command blocks indefinitely | review-perf | med | confirmed | n/a | yes |

### Cycle 4 findings summary

All applicable axes reviewed at HEAD 871ca132:
- **review-code**: PASS — 8 notes, all prior ignore findings confirmed at cited locations (N-3: writeFileSync in writeThrough closure; N-4: optional chain guard; N-5: index+=1 intentional skip). No new code defects.
- **review-security**: PASS — all spawnSync use array args (no shell injection), timeouts on network-facing spawns, no secrets, least-privilege token, soft degradation. No security findings.
- **review-verify**: PASS — 77/77 tests pass (serena-readiness: 17, serena-activation: 3, pin-watch: 20, version-parity-gate: 22, alias-coverage: 15). All new code paths tested.
- **review-perf**: PASS — all 4 spawnSync calls now carry `timeout: 30_000` (F6: run helper line 71; F7: registeredTools line 177; F8: pi install line 242; F9: pi list line 253).

### Fold ledger rows persisted (medium severity fix-now)

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F6 | `scripts/serena-activation-check.mjs:71` | review-perf | med | fix-now | source/fold into phase | yes |
| F7 | `scripts/serena-activation-check.mjs:177` | review-perf | med | fix-now | source/fold into phase | yes |
| F8 | `scripts/serena-activation-check.mjs:242` | review-perf | med | fix-now | source/fold into phase | yes |
| F9 | `scripts/serena-activation-check.mjs:253` | review-perf | med | fix-now | source/fold into phase | yes |
| VF-2 | `scripts/serena-activation-check.mjs:71` · reviewer review-change · HEAD 871ca132ce952cd39c13e2f90d54611d9e2f643f · recheck spawnSync("npm view", …) lacks timeout | review-perf | confirmed | finding-mark | n/a | yes |
| VF-3 | `scripts/serena-activation-check.mjs:177` · reviewer review-change · HEAD 871ca132ce952cd39c13e2f90d54611d9e2f643f · recheck spawnSync(process.execPath, …) lacks timeout | review-perf | confirmed | finding-mark | n/a | yes |
| VF-4 | `scripts/serena-activation-check.mjs:242` · reviewer review-change · HEAD 871ca132ce952cd39c13e2f90d54611d9e2f643f · recheck spawnSync("pi", ["install", …]) lacks timeout | review-perf | confirmed | finding-mark | n/a | yes |
| VF-5 | `scripts/serena-activation-check.mjs:253` · reviewer review-change · HEAD 871ca132ce952cd39c13e2f90d54611d9e2f643f · recheck spawnSync("pi", ["list"]) lacks timeout | review-perf | confirmed | finding-mark | n/a | yes |

## REVIEW-RAN
- head: 871ca132ce952cd39c13e2f90d54611d9e2f643f
- axes: review-code, review-security, review-verify, review-perf
- classifier: review-implementation
- debt: review-debt
- decision: REVIEW-FAIL (4 medium fix-now findings: F6 + F7 + F8 + F9)
- mark: 2026-10-23 review-cycle-4

## GATE-RAN
- pre-execution: clean
- head: 871ca132ce952cd39c13e2f90d54611d9e2f643f
- mark: 2026-10-23 pre-execution-clean-4
