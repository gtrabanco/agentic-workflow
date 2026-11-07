# 449 — batch scheduler sensor · decisions

- **D1 (2026-11-07) — triage: its own skill + script, not a `workflow-status`
  extended mode.** Authority: S2 ("via `workflow-status` extended mode or its
  own skill — triage decides"). Grounds: `workflow-status` is strictly
  read-only (PE-005) and S6 requires a persisted state file; its Envelope v2
  is consumed by `decideWorkflowAction()` and drivers, and batch grouping is a
  different question (parallel lanes) with a different consumer (#295 renders
  it as data). Precedent: producers ship as their own deterministic scripts
  (`ceremony.mjs`, `workflow-status.mjs`, `risk-tiers.mjs`).
- **D2 (2026-11-07) — the envelope carries facts, not policy.** Authority: S5's
  "measured-size hints for lane count" + S9 (planner, not orchestrator). Size
  hints and lane grouping are computed and reported; the parallelism decision
  (how many lanes to actually launch) stays with the consumer — the sensor
  never launches, never caps anything.
- **D3 (2026-11-07) — the state file is untracked.** Authority: S6 (persist
  enough state that a re-run recognizes claimed/launched lanes). The file
  lives at `.agentic-workflow/batches.json`, which the carrier's own
  `.gitignore` whitelist ignores (PE-008): durable across sessions on the
  machine, never a commit-churning tracked artifact. `--no-state` gives a
  pure read.
- **D4 (2026-11-07) — applied via the owner's local workflow, not the lane.**
  Authority: owner workflow §4 (never run this repo's machinery on its own
  surgery). The frozen ledgers are the plan; `unit-route --triage` was not run
  for the same reason; the repo's deterministic gates (tests, lints) run
  always.
- **D5 (2026-11-07, P2) — path-protection records:**

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/batch-scheduler.test.mjs | P2 | 2026-11-07 | execute-phase | initial RED suite authorship plus two typo repairs within the same cut, before the suite's first run — no assertion relaxed
```
