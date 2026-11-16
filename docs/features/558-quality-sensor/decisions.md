# Decisions — feature/558-quality-sensor

Path-protection records (`path-protection-records@1`). `**/*.test.*` is a
protected path, so every edit below the test surface carries the justification
the checkpoint gate reads. The rows below fix a fixture the change itself wrote,
before it ever ran green: the canonical vector declared an `unavailable` row whose
reason named a degradation the document did not list, which is exactly the
inconsistency the validator exists to refuse. No assertion is relaxed, removed or
narrowed, and no expected value moves.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/quality-metrics.test.mjs | P1 | 2026-11-16 | execute-phase | The canonical fixture's `degraded` list gains the `unavailable-findings-corpus` code its own `escaped_defects.reason` already names, so the accepted vector is internally consistent; the two cases that depend on it (the canonical acceptance and the null-source-revision acceptance) keep every assertion unchanged
justification | packages/agentic-workflow/test/quality-metrics.collect.test.mjs | P3 | 2026-11-16 | execute-phase | Two fixture facts corrected against the fixture helpers the suite uses, no assertion weakened: (a) `newRepo` seeds a `base` commit, so the git-reader case expects 4 commits rather than 3 (the revert count it asserts is unchanged); (b) the lead-time fixture now expresses its three samples as hours of one day (`at(0, 12)` / `at(0, 10)` …) instead of days, so the asserted median is the 6 hours those samples mean rather than a 144-hour value the fixture never intended
justification | packages/agentic-workflow/test/quality-metrics.cli.test.mjs | P4 | 2026-11-16 | execute-phase | The end-to-end fixture stopped depending on the wall clock: its five commits now carry pinned author and committer instants inside the pinned window (the shared `newRepo`/`commitFile` helpers stamp `now`, which drifted past `--until` and made the window empty), so the assertions follow the fixture's five commits (1 revert of 5) instead of four, and every other expected value (10-hour lead time, 2-hour latency, one open findings row) is unchanged. No case is deleted, skipped, relaxed or narrowed
justification | packages/agentic-workflow/test/runner.dispatch.test.mjs | P4 | 2026-11-16 | execute-phase | The two inventory pins grow by the command this unit adds — `quality-metrics` joins the exact `RUNNER_COMMANDS` key list and the "every sensor exposes its entry" matrix. Both are declarations of the shell-visible surface, not behavioural assertions: nothing is removed from either list, the foreign-name refusal stays as it was, and the new sensor gets the same import-only no-side-effect assertion every sibling already has
justification | packages/agentic-workflow/test/quality-metrics.cli.test.mjs | P7 | 2026-11-16 | execute-phase | One case added beside the existing feedback case: a plain run must announce itself on stderr and report its duration, because the collection blocks the event loop and a channel that waited for its own timer stayed silent for a 13-second run. Nothing existing is edited, relaxed or removed — the new case asserts the same stdout purity the neighbouring case asserts for the tier flags
justification | packages/agentic-workflow/test/quality-metrics.collect.test.mjs | P7 | 2026-11-16 | execute-phase | Self-review finding F1: a capped deploy read (`merged_truncated`) truncated the denominator of three rows while their confidence stayed `measured`, which is the very rule S12 forbids. One case is added for that state — no existing case is edited, removed or narrowed; the new case is the reproducer the repair is measured against
justification | packages/agentic-workflow/test/quality-metrics.cli.test.mjs | P4 | 2026-11-16 | execute-phase | Correction batch on the 2026-11-16 EXTERNAL VERIFY receipt (blocker B1): one case is added asserting that all three `gh` reads ran inside the directory `--repo` names, and the shared `gh` stub gains only the `pwd` recording line that case reads — no existing assertion is edited, relaxed, removed or narrowed, and the 14 pre-existing cases keep every expectation they had
justification | packages/agentic-workflow/test/runner.distribution.test.mjs | P4 | 2026-11-16 | execute-phase | Correction batch on the same receipt (blocker B3): one case is added asserting every key of the crate's `RUNNER_COMMANDS` appears in the runner contract's `## Subcommands` table; the file's two existing cases (the published-surface run and the two pin sweeps) are untouched, and the new case only reads `RUNNER.md` and the dispatch table
```

## Why the fixture moved, and why it is not a test relaxation

The contract's rule is that an `unavailable` row may only name a degradation the
document declares. The corpus-absence case is a real degradation, so the code
belongs in `degraded`; the fixture was wrong, not the rule. The alternative —
loosening the rule so a row could name an undeclared failure — would be the
defect this unit's S12 exists to prevent.
