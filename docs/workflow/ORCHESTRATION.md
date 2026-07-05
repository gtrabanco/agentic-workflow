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
