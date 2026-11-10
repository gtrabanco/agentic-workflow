---
"@gtrabanco/pi-agentic-workflow": patch
"@gtrabanco/agentic-workflow-schema": patch
---

fix(gate): bounded test execution — external wall-clock killer, RSS cap, 10s default budget (issue #493)

The root gate wraps every suite process in two external, signal-based bounds —
a 120s suite wall-clock killer (`SUITE TIMEOUT`, `--suite-timeout` to override)
and a sampled RSS watchdog per suite worker (`SUITE MEMORY CAP`, default 1.5 GB,
`--suite-mem-cap` to override) — because a runner's own timer-based timeout is
dead in a microtask-starved loop and the 2026-11-09 incident ate 6 GB for hours
under no bound at all. The per-test budget defaults to 10s everywhere the 60s
lived (root gate + both packages' test scripts); suites that measured above it
are named, with reason and cost, in `scripts/test-timeout-allowlist.json`. The
settings console's validation dead-end (openAScope) refuses after 3 consecutive
failed opens instead of looping forever. Takes over #476's timeout half; the
scriptedUi anti-loop trap shipped with the #427 lane (68330216) and is pinned
here.
