
---

## Correction batch — 2026-11-16 (one batch on the three blockers above)

Scope: `S2` (the correction-batch step) over blockers **B1–B3** only; advisory
A1 is not a blocker and was not touched. Triage: all three reproduce, all three
are change-caused at this unit's registration, none is out of domain, none was
dismissed. Code + tests + ledgers: `f22a7984`; this addendum and the journal
fragment: the docs commit beside it.

| blocker | smallest action taken | reproducer after the batch |
|---|---|---|
| B1 | `readForge` spawns `gh` with `cwd: repo` behind a directory pre-check (`packages/agentic-workflow/src/runner/sensors/quality-metrics.mjs:270`), so `unavailable-forge-missing-cli` keeps meaning "gh is not on PATH"; the crate README states the `--repo` scope once | `quality-metrics --repo /nonexistent-xyz-558 --until 2026-11-16T12:00:00.000Z` → exit 0, `degraded [unavailable-findings-corpus, unavailable-forge-no-network, unavailable-history-not-a-repository]`, all six rows `unavailable`/`null` with their reason; `--repo <mktemp repo>` run from this worktree → `unavailable-forge-no-network` instead of this worktree's rows |
| B2 | the duplicated fragment line deleted (`docs/features/558-quality-sensor/SPEC.md:74`) | the acceptance-table render → `14 rows`, no phantom |
| B3 | the `quality-metrics` row added to the runner contract's `## Subcommands` table, pinned by a new parity case | `rg -c quality-metrics skills/runner-contract/references/RUNNER.md` → `1`; `bun test test/runner.distribution.test.mjs` → `4 pass 0 fail` |

Red first: both new cases were observed failing at `71648377` before any repair
(`14 pass 1 fail`, `3 pass 1 fail`), green after (`15 pass`, `4 pass`); the five
suites sharing the touched modules → `64 pass 0 fail`. One regression the
contract validator caught mid-batch (a not-a-directory return in the reader's
inner shape → `QUALITY REFUSAL … (got undefined)`, exit 2, nothing printed) was
repaired inside the same batch; it is recorded as `E17` in the unit doc.

The receipt above stays `NEEDS-DECISION (3)` as the historical verdict; the
recheck of these three blockers is the owner's delta verdict.
