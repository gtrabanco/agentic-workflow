# Planning evidence — fix/493-bounded-test-execution

> One row per Engineering claim the change rests on. Frozen at cut except
> `freshness`; a claim sampled later flips to `current` with its source named.
> Ids are stable; an obligation or finding cites a row by id.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | the root gate spawns each suite with **no wall-clock bound and no memory bound**; its only protection is the per-test timer flags it passes to the child | `scripts/run-root-suite.mjs` (`spawnReal` — plain `spawn`, no timer, no RSS reader; `argvFor` pins `--timeout=60000` / `--test-timeout=60000`) | current | O1, O2, O3 |
| PE-002 | issue-forensics, live-reproduced 2026-11-09 | bun's per-test timeout is timer-based and **never fires for a microtask-starved hang** (an infinite loop of already-resolved promises); only an external signal kills such a process | issue #493 appendix (isolated repro: 420 MB → 2.75 GB in 21 s; in-process 5 s emergency `setTimeout` never executed) and the same mechanism recorded in `scripts/run-root-suite.mjs`'s header comment | current | O1, O7 |
| PE-003 | repository | the scripted UI harness returns a **scalar answer on every re-ask** (`take` re-reads the same key; arrays `shift()` to `undefined` when dry), so any console validation dead-end becomes an infinite allocation loop | `packages/pi-agentic-workflow/test/settings-console.test.mjs` (`scriptedUi`, `take`) | current | O5 |
| PE-004 | repository | the production console re-ask loops are unbounded `for(;;)` blocks that re-ask on the same title after a validation failure — five of them in `settings/console.ts` | `packages/pi-agentic-workflow/src/settings/console.ts` (`for (;;)` sites) | current | O6 |
| PE-005 | repository | `PASS_NAMES` does not include `review-change` (it is the composer, not a pass), which is why #427's F4 fixture loops — and that fixture layer is **that lane's** merge blocker, not this unit's | `packages/agentic-workflow-schema/src/vocabularies.ts` (`PASS_NAMES`); issue #493 root-cause note | current | Non-goals, O8 |
| PE-006 | unknown — measured at P4 | which of the repo's suites (if any) need an allowlist entry under the 10 s per-test budget, and what each costs per test, is **measured**, never assumed — the allowlist stays empty unless a measured cost forces an entry | owner: this unit's P4 (full-gate run records the measured per-suite maxima) | measured at P4 | O3, O4 |
| PE-007 | repository | the drift gate pins the AGENTS.md literal "budgets a 60s per-test timeout on the bun leg", so the 60 s → 10 s change must rewrite both in the same PR or the push goes red | `scripts/invocation-drift.mjs` (`SUITE_CARVE_OUT`) | current | O3, O9 |
| PE-008 | repository — sampling route | per-child RSS is sampled portably (Linux `/proc/<pid>/status` `VmRSS`, macOS via `ps -o rss=`), so the watchdog needs no new runtime dependency; the `systemd-run` cgroup alternative is rejected on portability grounds per S3's own weighing | verified live in scratch during P3 (sampling harness run recorded as an E line) | sampled at P3 | O2 |
