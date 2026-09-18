# review-findings — 60-path-protection-guards

Fix-now fold ledger for feature unit 60 (PR #245). Cycle 1 review ran
2026-09-18 against head `682c57042abe480889ba7259d9568d8a6a65bcbb` (branch diff
vs base `3781d6513eec95aec0002c2875d5cf9e6eb09f52`): five isolated axis passes
(code, security, verify, perf, api-ergonomics) plus one isolated verification
pass. `design`, `a11y`, `brand` and `seo` were skipped — this repository is an
agent-skills/docs substrate with two bun/node ESM packages and no UI, web or
brand surface. Ledger schema:

```
| id | file:line | axis | severity | class | route | folded |
```

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | packages/pi-agentic-workflow/src/extension/index.ts:235 | code | high | fix-now | source (fold) | yes |
| F2 | packages/pi-agentic-workflow/src/extension/index.ts:208-209 | code | high | fix-now | source (fold) | yes |
| F3 | packages/pi-agentic-workflow/src/extension/index.ts:196-200 | code | med | fix-now | source (fold) | yes |
| F4 | packages/pi-agentic-workflow/src/config/path-policy.ts:214-224 | code | med | fix-now | source (fold) | yes |
| F5 | packages/agentic-workflow/bin/path-guard.mjs:39-45,148,151 | code | med | fix-now | source (fold) | yes |
| F6 | packages/agentic-workflow/bin/path-guard.mjs:136,151 | security | med | fix-now | source (fold) | yes |
| F7 | packages/pi-agentic-workflow/src/extension/index.ts:205,214-215 | security | med | fix-now | source (fold) | yes |
| F8 | CHANGELOG.md:94,97 | code | med | fix-now | source (fold) | yes |
| F10 | packages/pi-agentic-workflow/test/path-protection.test.mjs | verify | med | fix-now | source (fold) | yes |
| F13 | packages/pi-agentic-workflow/src/extension/index.ts:221 | perf | med | fix-now | source (fold) | yes |
| F16 | template/.agentic-workflow/path-protection.md:61-66 | api-ergonomics | med | fix-now | source (fold) | yes |
| VF-1 | packages/pi-agentic-workflow/src/extension/index.ts:235 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck reproducer `cd packages/pi-agentic-workflow && bun run test` → exit 2, `error TS1128: Declaration or statement expected` at 235,4 and 236,1 (stray `});`) | code | confirmed | finding-mark | n/a | n/a |
| VF-2 | packages/pi-agentic-workflow/src/extension/index.ts:208-209 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck `grep -rn reportedDegradations packages/pi-agentic-workflow/src` → only the read (208) and write (209), no declaration; `npx tsc --noEmit` on a copy with 235 fixed → TS2304 "Cannot find name 'reportedDegradations'" at 208 | code | confirmed | finding-mark | n/a | n/a |
| VF-3 | packages/pi-agentic-workflow/src/extension/index.ts:196-200 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck direct read: handler consumes `receiptGuard` only under `event.toolName === "mcp"`, while `src/extension/receipt-guard.ts:65-66` returns `{block:false}` for anything but `"bash"` → the Bash-call guard is unreachable | code | confirmed | finding-mark | n/a | n/a |
| VF-4 | packages/pi-agentic-workflow/src/config/path-policy.ts:214-224 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck reproducer on the built pure reader: block1(no match)+block2(match `tests/x.mjs`) concatenated → `false`, block2 alone → `true` (reader `findIndex` + `break` at the first fence) | code | confirmed | finding-mark | n/a | n/a |
| VF-5 | packages/agentic-workflow/bin/path-guard.mjs:39-45,148,151 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck reproducer `node packages/agentic-workflow/bin/path-guard.mjs --unit docs/features/60-path-protection-guards --phase P1 --base no-such-ref-xyz` → `PATH-GUARD pass — clean`, `checked: 0`, exit 0; valid base `3781d6513eec…` → `fail — protected-modification`, exit 1 | code | confirmed | finding-mark | n/a | n/a |
| VF-6 | packages/agentic-workflow/bin/path-guard.mjs:136,151 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck reproducer `… --base --output=/tmp/pg_out_test` → exit 0 and `/tmp/pg_out_test` is created (the value reaches git's argv unvalidated) | security | confirmed | finding-mark | n/a | n/a |
| VF-7 | packages/pi-agentic-workflow/src/extension/index.ts:205,214-215 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck reproducer on the pure functions: `tests/x.mjs` → block true; `./tests/x.mjs`, `sub/../tests/x.mjs`, `foo/../tests/x.mjs` → block false | security | confirmed | finding-mark | n/a | n/a |
| VF-8 | CHANGELOG.md:94,97 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck `node --test scripts/normative-drift.test.mjs` → `fail 1`, `✖ a changelog version row appears once per table … 0.11.0 ×2` (scripts/normative-drift.test.mjs:1051), exit 1; `packages/pi-agentic-workflow/package.json` version is 0.11.1 | code | confirmed | finding-mark | n/a | n/a |
| VF-9 | packages/pi-agentic-workflow/test/path-protection.test.mjs · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck `grep -n 'tool_call\|\.on(' packages/pi-agentic-workflow/test/path-protection.test.mjs` → no match; AC-04/AC-10 cases call the pure `evaluateToolCall` only | verify | confirmed | finding-mark | n/a | n/a |
| VF-10 | packages/pi-agentic-workflow/src/extension/index.ts:221 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck direct read: `recordsText: collectRecordTexts(ctx.cwd)` is evaluated before any protection check; replica over this repo measured ≈4.63 ms and ≈382,714 B per call across 38 unit dirs | perf | confirmed | finding-mark | n/a | n/a |
| VF-11 | template/.agentic-workflow/path-protection.md:61-66 · reviewer review-change · HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb · recheck direct read of the shipped page: the records fence exists but no sentence states that only rows whose `phase` equals the gate's `--phase` count (`src/path-policy.mjs:453`), and `skills/execute-phase/references/PREFLIGHT.md:212` runs `--phase P<n-1>` | api-ergonomics | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 682c57042abe480889ba7259d9568d8a6a65bcbb | n/a | n/a | review-mark | n/a | n/a |
