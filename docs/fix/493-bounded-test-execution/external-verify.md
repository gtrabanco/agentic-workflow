# External verification — fix/493-bounded-test-execution

```
EXTERNAL VERIFY — base: f349d7b5 · head: ec54a60f
Blockers: 0
Advisories: 3 —
  (A1) docs/fix/493-bounded-test-execution/SPEC.md:222 (E7) — the spot check
  transiently disagreed on first run at head a37aabcb (exit 1, 3 pass / 9 fail,
  every failure a ~0.4 s forge-degradation case in sensor code #493 does not
  touch). The worktree was deleted mid-run minutes later (A3); the sensor
  surface is byte-unchanged across the whole a37aabcb..ec54a60f delta, and the
  re-run at ec54a60f matches E7 (12 pass / 0 fail, timeout tests 10612/10556 ms
  vs the reported 10572/10568). Environmental, not change-caused; disclosed
  because a disagreeing spot check nominally untrusts the report — the re-run
  restores trust.
  (A2) scripts/test-timeout-allowlist.json:2,9 — the two measured costs are
  single-run samples from 2026-11-10, not distributions; a future re-measure
  that drifts above an entry's timeoutMs fails red (the correct direction).
  Standing obligation already declared in the unit's Future cost.
  (A3) environment incident, disclosed per the verification's mutation rules —
  the worktree at .git/worktrees/fix/493-bounded-test-execution was deleted by
  a concurrent actor mid-verification (the unit's own L3 class), and while the
  session was suspended another session merged main into the branch
  (d9c77a7e, bringing #388/#500/#501) and pushed. Every validator was re-run
  at the new head; no #493 executable surface changed in the delta
  (run-root-suite.mjs, its suite, the allowlist, invocation-drift, both
  packages' budgets and the unit doc are byte-identical), and openAScope's
  bounded re-ask survived the merge intact.
Sibling sweep: clean — `rg -c '60000'` over the three pinned surfaces exits 1
  (0 matches); invocation-drift@1 PASS with the re-pinned SUITE_CARVE_OUT
  tokens; no surviving "60s budget" claim in any live surface (remaining
  hits are unit-doc history, log entries and unrelated 60000-ms pacing
  defaults); `openAScope` is the only dead-end `for(;;)` in console.ts (the
  other four are menus with a cancel/undefined escape each iteration);
  docs-generate --check exit 0; lint-changeset exit 0; unit-route --triage
  exit 0; origin/main (11cc242b) contained in head.
Completeness: S1–S8 resolved — S2/S3: scratch proofs (mktemp -d, cleaned) at
  head: SUITE TIMEOUT at the 2.0s bound (named verdict, exit 1), SUITE MEMORY
  CAP at a 512 MB cap (named verdict, exit 1), and at base f349d7b5 the same
  hang is silent and unbounded (external timeout 8 kills it, exit 124);
  S4: 10s default + measured allowlist (rg pin + drift PASS + full-gate claim
  G1/G2 accepted on the suite's own green); S5: trap pin green <100 ms
  (68/68 settings-console); S6: bounded re-ask green (dead-end refusal case);
  S7: all four acceptance criteria re-run green here (23/23 gate suite under
  bun and node, 68/68 console suite, injected-loop survival: 3 healthy PASS +
  the hang killed named at the 3.0s bound, exit 1); S8: non-goals untouched
  (the #427 fixture and /tmp crontab are not in the diff). Differential
  base-vs-head on passing fixtures: byte-identical apart from the declared
  header line — O9 holds. All ten obligations (O1–O10) re-verified green at
  head; the scratch bounds proofs ran at a37aabcb and carry over (the script
  is byte-identical at ec54a60f).
Spot check: timeout 300 bun test --timeout=60000 -t "forge"
  scripts/workflow-status-sensor.test.mjs → match (first run mismatched —
  advisory A1; re-run at head matches E7: 12 pass / 0 fail, exit 0)
Verdict: VERIFIED
```

2026-11-10 · First receipt for this unit (no prior block → full verdict, once).
Read-only run: no commit, no push, no branch, no forge mutation; the only
writes are this receipt and the mktemp scratch (removed). The bounds proofs
spawned/killed throwaway fixture processes in scratch only — the live tree was
never exercised by a mutation path of the change.
