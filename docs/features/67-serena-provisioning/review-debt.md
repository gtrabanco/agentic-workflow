# REVIEW TECH DEBT — scope: feat/219-serena-mcp-provisioning (PR #313), commit 7c29bb06

## Cycle 2 (context-clean end review, clean)

| # | Finding | Severity | file:line | Trigger + smallest action |
|---|---------|----------|-----------|---------------------------|
| 1 | Missing timeout on `gh` spawnSync calls — `npmLatest()` had `timeout: 30_000`, `openIssues()` / `createIssue()` did not — could hang on network stall | medium (resolved) | `scripts/pin-watch.mjs:199-218` | **RESOLVED** at b2f0502c: `timeout: 30_000` added to both `openIssues()` and `createIssue()`. Re-trigger: if future audit surfaces missing timeout elsewhere, apply same guard. |
| 2 | No `npm audit` gate — security scan of dependencies not enforced in CI | low | `scripts/version-parity-gate.mjs` / CI workflow | When CI becomes the gate for every merge, add `npm audit --audit-level=moderate` as a CI step. Minimum action: one `npm audit` run in the CI matrix. Deferred until CI gate is in place (non-blocking; current-unit debt not at risk — audit of @bacnh85/pi-serena@0.10.0 showed 0 vulnerabilities, package is benign). |

Rows: 2 transformed, 2 with trigger, 0 new findings, 3 n/a (N-3: writeFileSync import actively used — false positive; N-4: recorded?.state guard short-circuits before .revision — false positive; N-5: index += 1 intentional rename-pair skip — stylistic, correct as-is)

Summary: Context-clean end review (cycle 2) — no new debt items. One medium-severity tech debt item was fixed and folded at b2f0502c. One low-severity proposal tracked as non-blocking. Three non-defects correctly ignored. All four review axes (code, security, verify, perf) returned PASS.

Decision: PASS

## Cycle 1 (original) — retained for audit trail

Rows: 2 transformed, 2 with trigger, 0 findings, 3 n/a (N-3: writeFileSync import actively used — false positive; N-4: recorded?.state guard short-circuits before .revision — false positive; N-5: index += 1 intentional rename-pair skip — stylistic, correct as-is)

Summary: One medium-severity tech debt item was fixed and folded at b2f0502c (timeout on gh spawnSync). One low-severity proposal (npm audit gate) is tracked as non-blocking — no immediate action needed while CI is not yet a merge gate. Three non-defects correctly ignored.