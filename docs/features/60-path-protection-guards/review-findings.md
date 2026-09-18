# review-findings — 60-path-protection-guards

Fix-now fold ledger for feature unit 60 (PR #245). Cycle 1 review ran
2026-09-18 against head `682c57042abe480889ba7259d9568d8a6a65bcbb` (branch diff
vs base `3781d6513eec95aec0002c2875d5cf9e6eb09f52`): five isolated axis passes
(code, security, verify, perf, api-ergonomics) plus one isolated verification
pass. `design`, `a11y`, `brand` and `seo` were skipped — this repository is an
agent-skills/docs substrate with two bun/node ESM packages and no UI, web or
brand surface. Cycle 2 review ran 2026-09-18 against head
`088fcc431fa6bd9e38cbce76e71f2bd84d7683ed` — delta mode escalated to a **full
pass** by the size trigger (408 changed lines in the fold range > 200) — with
the same five axis passes plus an isolated verification pass and a classifier;
all eleven cycle-1 folded rows re-verified gone. Its fix-now rows follow. Ledger
schema:

```
| id | file:line | axis | severity | class | route | folded |
```

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | packages/pi-agentic-workflow/src/extension/index.ts:235 | code | high | fix-now | source (fold) · fold 62b544f | yes |
| F2 | packages/pi-agentic-workflow/src/extension/index.ts:208-209 | code | high | fix-now | source (fold) · fold 62b544f | yes |
| F3 | packages/pi-agentic-workflow/src/extension/index.ts:196-200 | code | med | fix-now | source (fold) · fold 62b544f | yes |
| F4 | packages/pi-agentic-workflow/src/config/path-policy.ts:214-224 | code | med | fix-now | source (fold) · fold 77e2289 | yes |
| F5 | packages/agentic-workflow/bin/path-guard.mjs:39-45,148,151 | code | med | fix-now | source (fold) · fold b3f91b0 | yes |
| F6 | packages/agentic-workflow/bin/path-guard.mjs:136,151 | security | med | fix-now | source (fold) · fold b3f91b0 | yes |
| F7 | packages/pi-agentic-workflow/src/extension/index.ts:205,214-215 | security | med | fix-now | source (fold) · fold 77e2289 | yes |
| F8 | CHANGELOG.md:94,97 | code | med | fix-now | source (fold) · fold 4f2e8be | yes |
| F10 | packages/pi-agentic-workflow/test/path-protection.test.mjs | verify | med | fix-now | source (fold) · fold 62b544f | yes |
| F13 | packages/pi-agentic-workflow/src/extension/index.ts:221 | perf | med | fix-now | source (fold) · fold 77e2289 | yes |
| F16 | template/.agentic-workflow/path-protection.md:61-66 | api-ergonomics | med | fix-now | source (fold) · fold e153934 | yes |
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
| F17 | packages/agentic-workflow/bin/path-guard.mjs:86-105,160 | code+security | high | fix-now | source (fold) · fold fd4e16a | yes |
| F18 | packages/agentic-workflow/bin/path-guard.mjs:51-57 | code+security | high | fix-now | source (fold) · fold fd4e16a | yes |
| F19 | packages/pi-agentic-workflow/src/extension/index.ts:216-237 | security | high | fix-now | source (fold) · fold 20e3b88 | yes |
| F20 | packages/agentic-workflow/src/path-policy.mjs:120-150 | perf | med | fix-now | source (fold) · fold 20e3b88 | yes |
| F21 | packages/pi-agentic-workflow/README.md, template/.agentic-workflow/path-protection.md:8,23-24 | api-ergonomics | med | fix-now | source (fold) · fold 777c4f1 | yes |
| F22 | packages/agentic-workflow/bin/path-guard.mjs:193-194,202 | security | med | fix-now | source (fold) · fold fd4e16a | yes |
| F23 | packages/agentic-workflow/bin/path-guard.mjs:216,221 | api-ergonomics | med | fix-now | source (fold) · fold 777c4f1 | yes |
| F24 | packages/agentic-workflow/bin/path-guard.mjs:180,183,187,223 | api-ergonomics | med | fix-now | source (fold) · fold fd4e16a | yes |
| VF-12 | packages/agentic-workflow/bin/path-guard.mjs:86-105,160 · reviewer review-change · HEAD 088fcc431fa6bd9e38cbce76e71f2bd84d7683ed · recheck reproducer: temp repo modify `tests/café-helper.js` → `git diff --name-status` = `M<TAB>"tests/caf\303\251-helper.js"`; gate `--base` → `PATH-GUARD pass — clean` exit 0 (ASCII control → `fail — protected-modification` exit 1) | code+security | confirmed | finding-mark | n/a | n/a |
| VF-13 | packages/agentic-workflow/bin/path-guard.mjs:51-57 · reviewer review-change · HEAD 088fcc431fa6bd9e38cbce76e71f2bd84d7683ed · recheck reproducer: policy `pre-freeze.delete=approval` + justification-only row; unstaged `rm tests/prot.js` → `PATH-GUARD pass — justified` exit 0, staged `D ` → `fail — approval-required` exit 1 | code+security | confirmed | finding-mark | n/a | n/a |
| VF-14 | packages/pi-agentic-workflow/src/extension/index.ts:216-237 · reviewer review-change · HEAD 088fcc431fa6bd9e38cbce76e71f2bd84d7683ed · recheck reproducer: built `dist` + symlink `alias.mjs -> tests/real.mjs` → handler returns no block (protected file); symlink to `/tmp/outside` passes while `../outside` is blocked | security | confirmed | finding-mark | n/a | n/a |
| VF-15 | packages/agentic-workflow/src/path-policy.mjs:120-150 · reviewer review-change · HEAD 088fcc431fa6bd9e38cbce76e71f2bd84d7683ed · recheck reproducer: `globToRegExp("a*a*a*a*a*a*a*a*a*a*a*a*a*b")` + 36-char path → gate `real 0m53.392s` (40-char → timeout, exit 124); shipped defaults < 0.1 ms | perf | confirmed | finding-mark | n/a | n/a |
| VF-16 | packages/pi-agentic-workflow/README.md · reviewer review-change · HEAD 088fcc431fa6bd9e38cbce76e71f2bd84d7683ed · recheck: `grep -n pathProtection packages/pi-agentic-workflow/README.md` → rc=1; `template/.agentic-workflow/path-protection.md:8` says `path-policy.json` "is the policy the guard reads" vs `src/config/load.ts:29-34` `.pi/pi-agentic-workflow.json` | api-ergonomics | confirmed | finding-mark | n/a | n/a |
| VF-17 | packages/agentic-workflow/bin/path-guard.mjs:193-194,202 · reviewer review-change · HEAD 088fcc431fa6bd9e38cbce76e71f2bd84d7683ed · recheck reproducer: `--unit ../c8evil` with a planted SPEC/decisions → `PATH-GUARD pass — justified` exit 0 (in-repo unit → `fail — protected-modification` exit 1) | security | confirmed | finding-mark | n/a | n/a |
| VF-18 | packages/agentic-workflow/bin/path-guard.mjs:216,221 · reviewer review-change · HEAD 088fcc431fa6bd9e38cbce76e71f2bd84d7683ed · recheck: no-declaration unit emits `phase: P1 · freeze-after: n/a · checked: 0` vs `SPEC.md:576` documenting `freeze-after: <P<m>` or `none` only | api-ergonomics | confirmed | finding-mark | n/a | n/a |
| VF-19 | packages/agentic-workflow/bin/path-guard.mjs:180,183,187,223 · reviewer review-change · HEAD 088fcc431fa6bd9e38cbce76e71f2bd84d7683ed · recheck reproducer: `ignored-removal`/`ignored-lowering` emitted; malformed JSON → `DEGRADED — malformed-config: shipped defaults in force` (parse message computed at :181/:185 discarded at :187) | api-ergonomics | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 088fcc431fa6bd9e38cbce76e71f2bd84d7683ed | n/a | n/a | review-mark | n/a | n/a |

## Cycle 3 — 2026-09-18 (user-invoked third cycle)

Cycle 3 review ran against head `20e3b88297a5b0b82333faccd6cb0f79f65d70e7`.
Delta mode was superseded by the size trigger (329 changed lines in the fold range
> 200), so it ran a **full pass** with five isolated axis passes (code, security,
verify, perf, api-ergonomics), one isolated verification pass, and the isolated
`review-implementation` classifier plus `review-debt` transform. All 24 prior
`folded: yes` rows were re-verified gone at their cited locations; seven new
fix-now rows (F25–F31) were confirmed. Because cycles 1 and 2 each produced new
fix-now rows (no convergence), this third cycle reached the two-cycle cap; the
residue routes to `triage-issue --prioritize-now` rather than a fourth fold.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F25 | packages/agentic-workflow/bin/path-guard.mjs:175 | security | high | fix-now | triage-issue --prioritize-now (loop cap) · source fold | no |
| F26 | packages/agentic-workflow/bin/path-guard.mjs:150-158 | security | high | fix-now | triage-issue --prioritize-now (loop cap) · source fold | no |
| F27 | packages/pi-agentic-workflow/src/extension/index.ts:220-242 | code | high | fix-now | triage-issue --prioritize-now (loop cap) · source fold | no |
| F28 | packages/pi-agentic-workflow/src/extension/index.ts:221-250 | security | high | fix-now | triage-issue --prioritize-now (loop cap) · source fold | no |
| F29 | packages/agentic-workflow/src/path-policy.mjs:150-175 | perf | med | fix-now | triage-issue --prioritize-now (loop cap) · source fold | no |
| F30 | template/.agentic-workflow/hooks/README.md:41-53 | api-ergonomics | med | fix-now | triage-issue --prioritize-now (loop cap) · source fold | no |
| F31 | docs/features/60-path-protection-guards/SPEC.md:576-577 | api-ergonomics | med | fix-now | triage-issue --prioritize-now (loop cap) · replan-in-unit | no |
| VF-20 | packages/agentic-workflow/bin/path-guard.mjs:175 · reviewer review-change · HEAD 20e3b88297a5b0b82333faccd6cb0f79f65d70e7 · recheck reproducer: temp repo, `tests/a.mjs` replaced by a symlink and committed; `git diff --name-status -z --diff-filter=ACMRD BASE` → empty while plain `git diff --name-status BASE` → `T\ttests/a.mjs`; gate `--base BASE` → `PATH-GUARD pass — clean`, `checked: 0`, exit 0 | security | confirmed | finding-mark | n/a | n/a |
| VF-21 | packages/agentic-workflow/bin/path-guard.mjs:150-158 · reviewer review-change · HEAD 20e3b88297a5b0b82333faccd6cb0f79f65d70e7 · recheck reproducer: in-repo symlink `evillink -> /tmp/evil` carrying a valid declaration + justification row; `--unit evillink` → `PATH-GUARD pass — justified` exit 0, real in-repo unit → `fail — protected-modification` exit 1 | security | confirmed | finding-mark | n/a | n/a |
| VF-22 | packages/pi-agentic-workflow/src/extension/index.ts:220-242 · reviewer review-change · HEAD 20e3b88297a5b0b82333faccd6cb0f79f65d70e7 · recheck reproducer: real built handler with `cwd` reached through a symlink → `write src/new.ts` returns `{block:true, reason:"…resolves outside the project root…"}`; the same create under a non-symlinked cwd is allowed | code | confirmed | finding-mark | n/a | n/a |
| VF-23 | packages/pi-agentic-workflow/src/extension/index.ts:221-250 · reviewer review-change · HEAD 20e3b88297a5b0b82333faccd6cb0f79f65d70e7 · recheck reproducer: `escape.ts -> /tmp/outside/created.ts` (target absent) → handler returns undefined; `writeFileSync(escape.ts,"pwned")` creates `/tmp/outside/created.ts` | security | confirmed | finding-mark | n/a | n/a |
| VF-24 | packages/agentic-workflow/src/path-policy.mjs:150-175 · reviewer review-change · HEAD 20e3b88297a5b0b82333faccd6cb0f79f65d70e7 · recheck reproducer: `parsePathPolicy` accepts a 200636-byte doc whose glob is 200000 chars; `matchGlob(200k stars, 1000 chars)` → `RangeError: Maximum call stack size exceeded`, memo 190.9 MB; 51-char star-chain → 1.148 ms (F20 fix intact) | perf | confirmed | finding-mark | n/a | n/a |
| VF-25 | template/.agentic-workflow/hooks/README.md:41-53 · reviewer review-change · HEAD 20e3b88297a5b0b82333faccd6cb0f79f65d70e7 · recheck direct read: the README says the policy "lives beside this README as `../path-policy.json`" and lists the Tier 2 pi guard among its readers, while `packages/pi-agentic-workflow/src/config/load.ts:28-34` reads `<cwd>/.pi/pi-agentic-workflow.json` and `template/.agentic-workflow/path-protection.md:11-13` states the Tier 2 guard never reads that file | api-ergonomics | confirmed | finding-mark | n/a | n/a |
| VF-26 | docs/features/60-path-protection-guards/SPEC.md:576-577 · reviewer review-change · HEAD 20e3b88297a5b0b82333faccd6cb0f79f65d70e7 · recheck direct read + run: the SPEC block documents `freeze-after: <P<m>-or-none>` and `DEGRADED — <missing-config/malformed-config>`; the gate on an undeclared unit emits `freeze-after: n/a`, and a removing/lowering policy emits `ignored-removal`/`ignored-lowering` | api-ergonomics | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 20e3b88297a5b0b82333faccd6cb0f79f65d70e7 | n/a | n/a | review-mark | n/a | n/a |
