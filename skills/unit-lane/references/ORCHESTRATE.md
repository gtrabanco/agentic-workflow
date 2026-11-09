# Orchestrate mode — the non-executing orchestrator (issue #260)

The execution topology of roadmap row 68: the orchestrating agent **designs,
briefs and verifies** while atomic work runs in **context-free subagents on
the cheap tier** the operator approved. Judgment steps (research, design,
plan, evidence, review, docs) stay in-orchestrator; implementation phases are
the atomic work that dispatches. The two-axis classifier is always the first
decision (size → tracking, risk → verification depth —
[risk-tiers.md](../../execute-phase/references/risk-tiers.md) owns the tier
table); orchestrate mode changes who executes, never which gates run.

**When it applies.** Only when the operator or the unit declares orchestrate
mode. Absent a declaration, the default stays the per-phase turn hand-off —
the absorbed-gap fix (one press per phase) is resolved *by this mode when it
is asked for*, never by silently spawning subagents.

## The delegate brief (frozen before any spawn)

Never improvised at spawn time. One brief per atomic work unit, with:

1. **Exact target files** — the paths the delegate may touch, nothing else.
2. **The exact gate command** — the deterministic check that proves the work
   (the same command `execute-phase`'s post-step runs).
3. **The exact expected values** — what the gate must print, the behavior the
   diff must show.
4. **`expected_duration` and resource `requirements`** — the progress-led
   guard's inputs (see below).
5. **The model** — resolved from the operator's table by
   `agentic-workflow resolve-passes` (the fail-closed chain: `passes.<name>`
   → `passes.default` → the configured cheap tier → inline). Never re-derived
   by the orchestrator; `auto` only when the operator wrote it.

## Spawn, verify, check in

- **Spawn** — `subagents_run` (the durable-subagent substrate the package
  registers; the run gets its own record, model and cost accounting). The
  delegate is context-free: it reads the brief, not the orchestrator's
  context. Admission is deterministic: `agentic-workflow resources detect`
  prints the host envelope, `resources admit` checks the brief's expectations
  and requirements against it and against the operator's caps — a refusal is
  a decision to make, never bypassed.
- **Verify by running** — when the delegate returns, the orchestrator runs
  the brief's gate command itself and reads the diff. **Never trust the
  delegate's summary**; a summary is a claim, the gate run and the diff are
  the evidence. The Evidence row cites the gate run, not the summary.
- **Check in, don't kill** — a spawned trial must stay observable: durable
  records (`subagents_inspect`) show whether it is moving. When a run exceeds
  its `expected_duration` or stops producing output, the guard informs the
  orchestrator with data; the orchestrator then waits explicitly, steers
  (`subagents_steer`), or stops (`subagents_stop`) — a silent kill is never
  the first response. A recorded bound-kill receipt blocks an identical
  re-run; re-decide with the receipt (split, shrink, or a bigger host).
- **Sequential by default.** One subagent at a time unless the host envelope
  derives more (`resources detect`'s parallelism). Parallelism is an
  optimization, never part of the contract.
- **Degrade inline, stated.** A spawn that cannot be admitted, or a pass
  whose model cannot resolve, runs inline at the orchestrator's model with
  the degrade stated in the report — never a failed run, never an unapproved
  model.

## What the orchestrator still writes

The orchestrator's context is never the design authority for hand-off: the
committed artifacts (unit doc, Evidence rows, Progress log, commits) stay
authoritative, and the orchestrator writes them — the same durability rule
every mode follows. Cross-session resumption reads the unit doc, not a lost
context.
