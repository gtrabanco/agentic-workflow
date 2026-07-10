# Programmatic orchestration — driving the workflow without Claude Code

The workflow's skills are plain instructions any agent can follow — but two
conveniences of Claude Code made the *autopilot* feel native there: **`/loop`**
(auto re-invocation) and **subagents** (a fresh cheap-model context per phase).
Neither is part of the contract. This document specifies the vendor-neutral
replacement: every user-facing skill ends with a **machine envelope** (a fixed
JSON block), and an **external driver** — a shell loop, a CI job, your own
program — parses it and decides the next command and the model to run it on.

```
            ┌──────────────────────────────────────────────┐
            │              YOUR ORCHESTRATOR                │
            │  parse envelope → route on state → pick tier  │
            └────────┬─────────────────────────▲────────────┘
                     │ invoke (headless)       │ last fenced ```json block
                     ▼                         │
      agent session running ONE skill: workflow-status /
      plan-feature / execute-phase / review-change / audit-pr / …
```

This is exactly `ship-roadmap`'s loop with the conductor moved outside the
agent — you gain per-step model choice (run `execute-phase` on a cheap model,
`audit-pr` on your strongest) and lose nothing: the skills' own gates (branch
safety, verification gate, mandatory review, merge gate) still bind inside
every step.

## The envelope

Full schema in [`skills/orchestration-envelope/SKILL.md`](../../skills/orchestration-envelope/SKILL.md).
Contract in one line: **the last fenced ```json block of the final message is
the envelope; exactly one per turn; all top-level keys always present.**

### Parsing with the official package

**`@gtrabanco/agentic-workflow-schema`** (npm) implements the contract:
`parseEnvelope(text)` extracts the last fenced ```json block, validates it,
and returns a fully-typed envelope; helpers `isTerminal(state)` and
`isRunHalt(envelope)` cover the two stop rules; the raw JSON Schema is
exported for non-JS drivers. Source lives in
[`packages/agentic-workflow-schema/`](../../packages/agentic-workflow-schema/)
and is version-locked to this contract (see its README).

```ts
import { parseEnvelope, isRunHalt, isTerminal } from "@gtrabanco/agentic-workflow-schema";
const r = parseEnvelope(agentOutput);
if (!r.ok) throw new Error(r.errors.join("; "));
if (isRunHalt(r.envelope)) stopRun(r.envelope.blockers);
else if (!isTerminal(r.envelope.state)) invoke(r.envelope.next.recommended, r.envelope.next.tier);
```

## Injecting the envelope requirement (system-prompt snippet + repair loop)

As of feature 10, the envelope is no longer a per-skill turn-contract
obligation — every user-facing skill except `workflow-status` dropped its
inline `## Machine envelope` section, since the only consumer is a driver
like this one, and a static `SKILL.md` instruction cannot detect or recover
from an omission the way a driver can. The contract now lives here and in
[`skills/orchestration-envelope/SKILL.md`](../../skills/orchestration-envelope/SKILL.md);
a driver that wants the envelope must supply it itself:

1. **Inject the canonical system-prompt snippet** into every headless
   invocation (verbatim, from `orchestration-envelope/SKILL.md`):
   ```text
   Every turn you produce MUST end with exactly one fenced ```json block matching
   the orchestration envelope schema (all top-level keys present; values only
   from verified command output). Emit nothing after it.
   ```
2. **Repair loop on parse failure.** Call `parseEnvelope(lastTurn)`
   (`@gtrabanco/agentic-workflow-schema`) after every invocation. If it fails —
   no fenced json block, or it doesn't validate — do not treat the step as
   failed yet: re-invoke the **same session** with the single-line prompt
   `Emit only the machine envelope for the turn above.` and parse that reply.
   Rationale: a weak model that drops JSON at the end of a long document
   almost always produces it when asked for nothing else — repairing per-turn
   at the driver layer is strictly more reliable than a static instruction the
   model was always going to skip.
3. **Retry bound.** One repair attempt per turn. If the repair reply also
   fails to parse, treat the step as a driver-level `FAILED` and surface it to
   a human — do not loop the repair prompt indefinitely.
4. **`workflow-status` needs no repair loop.** It is the sole skill that still
   emits the envelope inline (emitting it is its function), so polling it is a
   normal call with no injected snippet or repair step required.

## The state machine (route on `state`)

| `state` | Meaning | Orchestrator action | Suggested tier |
|---|---|---|---|
| `OK` | Skill finished its job | Invoke `next.recommended` | per `next.tier` |
| `CONTINUE` | Same unit, more work (next phase / iteration) | Re-invoke `next.recommended` | `cheap` |
| `READY_FOR_REVIEW` | Checkpoint or unit end | `/review-change` | `strong` |
| `READY_FOR_AUDIT` | Review clean | `/audit-pr` | `strong` |
| `MERGE_READY` | Audit passed; PR comment posted | Human merges, or your policy merges (respect the skill's pre-merge checklist) | — |
| `MERGED` | Authorized auto-merge executed | Next unit: `workflow-status` → route | `cheap` (sensor) |
| `NEEDS_FIXES` | fix-now findings / in-scope blockers | `/execute-phase` fold cycle, then re-run the gate that emitted them | `cheap` fold, `strong` re-gate |
| `BLOCKED` | Unmet dependency / external cause | Follow `dependencies.build_order` (plan+execute the deepest unmet unit first) or resolve `blockers[]` | per blocked step |
| `NEEDS_INPUT` | Human decision required | Surface `needs_input.question` + `options`; resume with the answer | — |
| `FAILED` | Retries exhausted (red gate, substrate) | Stop this unit; a human looks | — |
| `HALT` | Stop-the-world discovery (`blockers[].scope: "run"`) | **Stop the whole run**; surface it; nothing else proceeds | — |

Safety floor for any driver, non-negotiable: **never skip a `review_pending`
or `audit_pending` gate, never merge on anything but a fresh `MERGE_READY`,
and treat `HALT` as terminal until a human clears it.** The skills enforce
this inside each step; the driver must not route around them.

## The sensor: `workflow-status`

Between steps (or to bootstrap), run `workflow-status --json-only` — it emits
the full project state: every feature/fix with its **transitive dependency
closure** (met/unmet), `startable_now`, `blocked_units` with build orders,
open PRs with audit state, and findings pending triage. Route on
`detail.startable_now` and `next.recommended`. It is read-only and cheap-tier.

## Driver restart protocol (crash recovery)

A driver process will eventually die mid-turn. The recovery rule: **the
driver's persisted state is a hint; ground truth (git, forge, docs) is the
source** — never "repair" your journal, recompute from reality.

1. **Journal (recommended shape).** Persist every envelope **append-only**,
   one entry per turn with a timestamp and the current head SHA — never
   overwrite a single state file. The last entry is your *hypothesis* on
   restart; the full log is your audit trail.
2. **On restart**, call the sensor with the hypothesis:
   `workflow-status --json-only --last-envelope <last-entry.json>` (agents
   without argument passing: paste the JSON into the invocation message —
   the skill reads the last fenced json block of the request as the hint).
3. **Route on the recomputed envelope** — three cases:
   - `state: OK` (verdict `CLEAN`) — no interruption; follow
     `next.recommended` as on any normal tick.
   - `state: CONTINUE` (verdict `RESUMABLE`) — a turn died mid-phase but the
     ledger points to a unique next task; `next.recommended` is the resume
     command (`execute-phase <NN> <phase>` re-enters idempotently — it
     reconciles `TASKS.md` ticks against evidence and continues from the
     first unticked task).
   - `state: NEEDS_INPUT` (verdict `AMBIGUOUS`) — the ledger contradicts the
     commits (ticks without evidence, unknown branch); surface
     `needs_input.question` + `options` to a human. Do not auto-pick.
4. **Divergence line.** The report's `Hint envelope: matched | diverged: …`
   tells you whether work completed after your last journal entry (reality
   ahead of the journal is normal — a skill finished and pushed before the
   crash); adopt the recomputed state and append it to the journal.

Nothing above requires filesystem or git access in the driver itself — the
sensor does the reading; the driver only parses envelopes, which is the point
for REST-API-only drivers (e.g. a Node server talking to an agent's HTTP API).

## Replacing `/loop` (the driver loop)

Invoke the agent headless, one skill per invocation, and loop. Invocation is
per-agent (`claude -p "…"` on Claude Code CLI; `opencode run "…"`; any agent's
non-interactive mode; even a fresh chat via API) — the pattern is identical:

```bash
#!/usr/bin/env bash
# Generic driver skeleton. AGENT_STRONG / AGENT_CHEAP are whatever commands
# start a headless session on that tier for your agent(s) — they may even be
# different agents/vendors per step.
set -euo pipefail

run() { # run <tier> <prompt> -> prints the envelope (last fenced json block)
  local out; out="$("$@" 2>/dev/null)"
  printf '%s\n' "$out" | awk '/^```json$/{f=1;j="";next} /^```$/{if(f){last=j};f=0} f{j=j $0 "\n"} END{printf "%s", last}'
}

while true; do
  env_json="$(run $AGENT_CHEAP "Follow .agents/skills/workflow-status/SKILL.md with --json-only")"
  state=$(jq -r .state <<<"$env_json"); next=$(jq -r .next.recommended <<<"$env_json")
  tier=$(jq -r .next.tier <<<"$env_json")
  case "$state" in
    HALT|FAILED|NEEDS_INPUT) echo "$env_json" | jq .; exit 1 ;;
    MERGE_READY)             echo "merge pending: $(jq -r .pr.url <<<"$env_json")"; exit 0 ;;
    *) driver=$([ "$tier" = cheap ] && echo "$AGENT_CHEAP" || echo "$AGENT_STRONG")
       env_json="$(run $driver "Follow the installed SKILL.md for: $next")" ;;
  esac
done
```

The skeleton is deliberately minimal — a real driver adds per-state handling
(fold cycles, build-order recursion on `BLOCKED`, merge policy on
`MERGE_READY`) using the table above. The point: **nothing here is
Claude Code-specific.**

## Prompt-cache economics

Each `run()` call above is a fresh headless invocation — cheap by design, but
only if the driver doesn't fight the model provider's prompt cache:

- **Keep the system prompt / preamble byte-stable across invocations.** Same
  skill → same prefix, every time (no timestamp, run id, or other per-call
  noise injected into the cached portion). A stable prefix is what makes a
  cache hit possible at all; a single byte of drift invalidates it.
- **Group a unit's invocations within a short window.** Cache TTL is
  typically on the order of ~5 minutes — running a unit's steps back-to-back
  keeps hitting the warm cache; leaving long gaps between steps lets it expire
  and pay full price again.
- **Never switch model mid-unit.** Beyond invalidating the cache (each
  provider's cache is model-specific), it also breaks stylistic continuity
  across the unit's steps — pick the tier per step (per the state table above)
  but keep it fixed for that step's full lifetime, not swapped mid-way.
- **A one-invocation-per-step driver never needs compaction at all** — see
  `docs/workflow/FEATURE_WORKFLOW.md` → *Context hygiene & cost* for why a
  fresh context per step is the cheap path, not just a safe one.

## Replacing subagents (per-phase cheap contexts)

`ship-roadmap` spawns one Claude Code subagent per `execute-phase` phase to
run implementation below the conductor's tier. The external equivalent is
built into the loop above: each `execute-phase NN Pk` invocation IS a fresh
headless session, and the driver picks the cheap tier for it. Fresh context
per phase, cheap model, `execute-phase`'s own discipline inside — same
properties, no subagent primitive required.

## What remains Claude Code-only (and its status)

| Feature | Status |
|---|---|
| `/loop` | Convenience. Fully replaced by the driver loop above. |
| Subagents | Convenience. Replaced by one headless invocation per phase. |
| Per-skill `model:`/`effort:` frontmatter | `#claude` branch only; the default branch inherits the session — the driver picks tiers instead. |
| `ultracode` session setting | Optional Claude Code accelerator for ship-roadmap's fan-out; no equivalent needed — a driver parallelizes by running independent units concurrently itself (respect the project's declared git workflow before parallelizing). |
| `.claude/` session hooks (log-session capture) | Optional extra; `log-session` invoked by the driver at run end covers it. |

`ship-roadmap` remains the *in-agent* way to run this same loop when you'd
rather not host a driver — the two are equivalent by design, and both consume
the same skills underneath.
