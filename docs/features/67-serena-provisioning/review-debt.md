# REVIEW TECH DEBT — scope: feat/219-serena-mcp-provisioning (PR #313), commit 7c29bb06

## Cycle 2 (context-clean end review, clean)

| # | Finding | Severity | file:line | Trigger + smallest action |
|---|---------|----------|-----------|---------------------------|
| 1 | Missing timeout on `gh` spawnSync calls — `npmLatest()` had `timeout: 30_000`, `openIssues()` / `createIssue()` did not — could hang on network stall | medium (resolved) | `scripts/pin-watch.mjs:199-218` | **RESOLVED** at b2f0502c: `timeout: 30_000` added to both `openIssues()` and `createIssue()`. Re-trigger: if future audit surfaces missing timeout elsewhere, apply same guard. |
| 2 | No `npm audit` gate — security scan of dependencies not enforced in CI | low | `scripts/version-parity-gate.mjs` / CI workflow | When CI becomes the gate for every merge, add `npm audit --audit-level=moderate` as a CI step. Minimum action: one `npm audit` run in the CI matrix. Deferred until CI gate is in place (non-blocking; current-unit debt not at risk — audit of @bacnh85/pi-serena@0.10.0 showed 0 vulnerabilities, package is benign). |

Rows: 2 transformed, 2 with trigger, 0 new findings, 3 n/a (N-3: writeFileSync import actively used — false positive; N-4: recorded?.state guard short-circuits before .revision — false positive; N-5: index += 1 intentional rename-pair skip — stylistic, correct as-is)

Summary: Context-clean end review (cycle 2) — no new debt items. One medium-severity tech debt item was fixed and folded at b2f0502c. One low-severity proposal tracked as non-blocking. Three non-defects correctly ignored. All four review axes (code, security, verify, perf) returned PASS.

Decision: PASS

## Cycle 3 (context-clean end review, clean)

| # | Finding | Severity | file:line | Trigger + smallest action |
|---|---------|----------|-----------|---------------------------|
| 1 | Missing timeout on `gh` spawnSync calls — resolved at b2f0502c | medium (resolved) | `scripts/pin-watch.mjs:199-218` | **RESOLVED** at b2f0502c. Re-trigger: if future audit surfaces missing timeout elsewhere. |
| 2 | No `npm audit` gate — deferred until CI is a merge gate | low | `scripts/version-parity-gate.mjs` / CI workflow | When CI becomes the gate for every merge, add `npm audit --audit-level=moderate` as a CI step. |

Rows: 2 transformed, 2 with trigger, 0 new findings, 3 n/a (N-3: writeFileSync actively used — false positive; N-4: optional chain short-circuits — false positive; N-5: index += 1 intentional rename-pair skip — stylistic, correct as-is)

Summary: Context-clean end review (cycle 3) — no new debt items. One medium-severity tech debt item was fixed and folded at b2f0502c. One low-severity proposal tracked as non-blocking. Three non-defects correctly ignored. All four review axes (code, security, verify, perf) returned PASS.

Decision: PASS

## Cycle 1 (original) — retained for audit trail

Rows: 2 transformed, 2 with trigger, 0 findings, 3 n/a (N-3: writeFileSync import actively used — false positive; N-4: recorded?.state guard short-circuits before .revision — false positive; N-5: index += 1 intentional rename-pair skip — stylistic, correct as-is)

Summary: One medium-severity tech debt item was fixed and folded at b2f0502c (timeout on gh spawnSync). One low-severity proposal (npm audit gate) is tracked as non-blocking — no immediate action needed while CI is not yet a merge gate. Three non-defects correctly ignored.
## Cycle 4 (context-clean end review, new debt from review-perf)

| # | Finding | Severity | file:line | Trigger + smallest action |
|---|---------|----------|-----------|---------------------------|
| 1 | Missing timeout on `spawnSync("npm view", …)` in activation check — could hang on npm registry stall | medium (open) | `scripts/serena-activation-check.mjs:71` | Add `timeout: 30_000` to the spawnSync call. Re-trigger: if future audit surfaces missing timeout elsewhere. |
| 2 | Missing timeout on `spawnSync(process.execPath, …)` in activation check — could hang on SDK import | medium (open) | `scripts/serena-activation-check.mjs:177` | Add `timeout: 30_000` to the spawnSync call. Re-trigger: if future audit surfaces missing timeout elsewhere. |
| 3 | Missing timeout on `spawnSync("pi", ["install", …])` in activation check — could hang on stalled install | medium (open) | `scripts/serena-activation-check.mjs:242` | Add `timeout: 30_000` to the spawnSync call. Re-trigger: if future audit surfaces missing timeout elsewhere. |
| 4 | Missing timeout on `spawnSync("pi", ["list"])` in activation check — could hang on stalled command | medium (open) | `scripts/serena-activation-check.mjs:253` | Add `timeout: 30_000` to the spawnSync call. Re-trigger: if future audit surfaces missing timeout elsewhere. |
| 5 | readFileSync on package.json unbounded read — mitigated (package.json typically <50KB) | low (open) | `scripts/serena-activation-check.mjs:81` | If package.json grows beyond expected size, switch to readStream with size limit. Re-trigger: if package.json exceeds 100KB. |

Rows: 5 transformed, 5 with trigger, 0 new findings, 0 n/a

Summary: Cycle 4 produced 4 medium-severity tech debt items (missing timeouts on spawnSync in activation check) and 1 low-severity note. All 4 medium items are fix-now, current-unit, foldable.

Decision: PASS (for debt transform — but review overall is FAIL due to open fix-now rows)
