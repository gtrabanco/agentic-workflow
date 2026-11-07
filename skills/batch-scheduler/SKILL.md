---
name: batch-scheduler
user-invocable: true
version: 4.10.0
argument-hint: "[--json-only] [--issues-file <json>] [--no-state] [--remote <url>]"
description: >
  Deterministic batch planner: read the live work graph and emit
  parallel-execution batches (order-respecting, collision-free) as the fixed
  `batch-plan@1` machine envelope — which issues can run together now, which
  are blocked and by what, and which surface each lane occupies. Triggers:
  "batch scheduler", "what can run in parallel", "plan the batches", "batch
  plan".
---

# Batch Scheduler (the parallel planner's sensor)

One pass that answers the parallel question the single-next sensor cannot:
**which open issues can run together right now, in which lane, in which
order** — emitted as the fixed `batch-plan@1` machine envelope. The **script is
the deterministic producer**: `scripts/batch-scheduler.mjs` reads the live work
graph and prints the document. This skill runs the script, reads the JSON, and
interprets it against [the plan grammar](references/PLAN.md) — it never
assembles the envelope by hand.

## Turn contract — verify before ending the turn

```
✓ The script was RUN — `bun scripts/batch-scheduler.mjs [--json-only] [--root
  <dir>] [--issues-file <json>] [--no-state] [--remote <url>]` (node is the
  fallback when bun is absent); the envelope is the script's stdout, never
  assembled by the model
✓ Every degraded dimension is named in the envelope `degraded[]` and reported
  to the human — a degraded plan is never presented as complete truth
✓ Every finding (cycle, orphaned-soft-dep, prose-native-mismatch) is reported
  with its issue numbers — findings are never silently dropped, and never
  auto-fixed by this skill
✓ `worktree` and `command` are REPORTED, never executed — the planner plans,
  it does not launch (no worktree creation, no session spawn, ever)
✓ The human-readable summary is printed (unless `--json-only`), then the
  machine envelope is the ABSOLUTE last output
✓ Nothing was edited, committed, pushed, or created except the script's own
  state file (`.agentic-workflow/batches.json`, untracked) — read-only
  everywhere else
```

## When to use

- Before launching parallel work: "what can run together now, and on which
  surfaces?" — replaces the hand-computed batch plan that died every session.
- When starting a work session with several open issues: batch 1 is the
  runnable-now set; the per-issue `command` starts its lane.
- **Not** for sequential next-step recommendation (`workflow-status` owns
  that), for quality judgment (`review-change`/`audit-pr`), or for launching
  (you or the #295 panel own that).

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**. The
script reads what it needs itself — the location index (`docs/ROADMAP.md`, via
the shared `index-document.mjs` parsers), the open issues and their native
`blocked-by` relations from the forge, the prose `## Dependencies` rows and
`## Where`/`## In scope` sections from issue bodies, and the unit docs under
`docs/fix/` + `docs/features/`. Read them yourself only to interpret a field
the script emitted.

## Process

1. Run the script. Defaults read the current repository and the live forge and
   persist the plan's claimed lanes to `.agentic-workflow/batches.json`
   (untracked, durable) so the next run recognizes what is already claimed or
   launched. Flags:
   - `--json-only` — envelope alone (drivers, tests).
   - `--issues-file <json>` — inject a fetched issue cache instead of calling
     the forge; a cache without native relations fetches them live (one
     GraphQL call) or degrades declared.
   - `--no-state` — pure read; writes nothing. It cannot be combined with
     `--mark-launched` (that pair is a usage error, exit 2).
   - `--remote <url>` — name the forge explicitly when `origin` is not a
     GitHub URL (a scratch clone); it names it for the issue list and the
     relations call alike.
   - `--mark-launched <n>` — record that you launched issue N's lane outside
     the sensor (the only manual write).
2. Read the envelope against [the plan grammar](references/PLAN.md):
   `batches[]` in order (batch 1 = runnable now), each lane one surface with
   its size hint and its issue rows (`number`, `worktree`, `command`,
   `reason.kind` + `detail`, `claimed`), `blocked[]` with the open blockers
   that gate each issue, `launched[]` with the evidence that marked them,
   `findings[]` with the unresolvable spots, `degraded[]` with anything that
   could not be read, and `summary` as the totals.
3. Print the human summary: one line per lane in batch 1 (surface, size hint,
   issues with their commands), then the blocked issues with their blockers,
   then every finding, then every degradation. **Launch nothing yourself** —
   hand the per-issue `command` to the user or the panel, and let them decide
   how many lanes to run (the size hints inform that choice; they are facts,
   not a lane-count policy).

## Guardrails

- **Findings are findings.** `cycle`, `orphaned-soft-dep` and
  `prose-native-mismatch` are work-graph defects the work-graph audit can
  feed; report them with numbers and detail, never fix them here (the prose
  rows belong to triage, per the #442 contract). A target that is open and in
  flight (its unit doc is on disk) is a **state**, not a defect: `blocked[]`
  names it as in flight and no finding is emitted for it.
- **Native relations are authoritative.** A prose row declared `hard` without
  a native `blocked-by` is reported as a mismatch; it never gates on its own.
- **No decision model.** The sensor is fully deterministic with no model
  configured; #444's optional signal layer may order groups later, never
  replace this computation.
- **Offline is declared.** A failed forge call degrades (`degraded[]`) and the
  plan still prints — from the cache and the docs that did read.

## Portability (agents other than Claude Code)

- *no slash menu* → open this `SKILL.md` and follow it literally in a fresh
  conversation; the skill is one script run plus interpretation.
- *no bun* → run the script with `node` (the shebang's fallback).
- *no forge access* → run with `--issues-file` carrying a cached issue export;
  the envelope then degrades on the relation source only when the cache lacks
  them.

## Relationship to other skills

- `workflow-status` is the sequential sibling: what is startable now and the
  single recommended next command. This sensor answers the parallel question
  over the same substrate; the two never write and never conflict.
- `unit-lane` is the consumer of each row's `command`
  (`/unit-lane --from-issue <N>`); it launches units, this sensor only names
  them.
- #295's panel is the planned renderer: it reads this envelope as data.
- Schema owner: `orchestration-envelope`'s package
  (`agentic-workflow/batch-plan`), validated by the script before printing.

## Done when

- The script ran; every claim in the report comes from its envelope.
- Batch 1's lanes were printed with their issues' launch commands; blocked,
  findings, and degraded dimensions were all reported, none silently dropped.
- Nothing was launched, spawned, or created except the script's own state
  file; the state write was reported.
- The envelope is the last output (unless `--json-only`).

→ Next: the per-issue `command` values of batch 1 — the user (or the #295
panel) picks how many lanes to launch from the size hints
  · one issue only → run its `/unit-lane --from-issue <N>` directly
  · a blocked or finding row first → `/triage-issue <N>` resolves the relation
  defect before launching anything it gates
