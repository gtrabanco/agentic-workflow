---
name: orchestration-envelope
user-invocable: false
version: 1.0.0
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal contract of the agentic-workflow pack: the machine envelope — a fixed
  JSON block every user-facing skill prints as its absolute last output, so an
  external program can parse the outcome and orchestrate the next step (which
  command, which model tier) without a human reading the chat. Not a menu entry;
  the user-facing skills reference this schema, and docs/workflow/ORCHESTRATION.md
  documents the driver loop that consumes it.
---

# Machine envelope (internal contract)

Every **user-invocable** skill in this pack ends its turn with one fenced
`json` block — the **envelope** — printed **after** the closing `→ Next:`
block, as the **absolute last output** of the turn. Internal skills (the
review pack, the plan-feature steps, this one) do NOT emit it: they return
their fixed completion reports to the composing caller, and only the outermost
user-facing skill emits the single envelope for the whole turn.

**Parse contract for orchestrators:** take the **last fenced ```json block**
of the final assistant message. Exactly one envelope per turn.

## Schema (all top-level keys ALWAYS present — use null / [] / 0 when n/a)

```json
{
  "skill": "<emitting skill name>",
  "state": "OK | CONTINUE | READY_FOR_REVIEW | READY_FOR_AUDIT | MERGE_READY | MERGED | NEEDS_FIXES | BLOCKED | NEEDS_INPUT | FAILED | HALT",
  "summary": "<one plain-text sentence: what happened this turn>",
  "unit": {"type": "feature | fix | docs | none", "id": "<NN-slug | N-topic | null>", "issue": null, "branch": "<branch | null>"},
  "phase": {"current": "<P2 | null>", "total": null, "completed": null},
  "pr": {"number": null, "url": null, "state": "open | merged | none", "head_sha": null, "merge_ready": null, "ci": "green | red | pending | none | null"},
  "gates": {"verification": "green | red | not-run | null", "review_pending": null, "audit_pending": null},
  "findings": {"fix_now": [], "issues_filed": [], "untriaged": 0, "decisions_recorded": 0},
  "blockers": [],
  "dependencies": {"unmet": [], "build_order": []},
  "recommendations": {"product_audit": false, "reason": null},
  "needs_input": null,
  "next": {"recommended": "<the → Next: block's recommended command>", "alternatives": [], "tier": "strong | cheap"},
  "detail": null
}
```

Field rules — checkable, no interpretation:

- **`state`** (the orchestrator's routing key — exactly one of the 11):
  - `OK` — the skill's job finished; nothing pending from it. Follow `next`.
  - `CONTINUE` — same unit has more of the same work (next phase, next loop
    iteration). Re-invoke per `next.recommended`.
  - `READY_FOR_REVIEW` — implementation checkpoint or unit end; `review-change`
    is the mandatory next step (`gates.review_pending: true`).
  - `READY_FOR_AUDIT` — review clean; `audit-pr` is next.
  - `MERGE_READY` — audit passed; the human (or the documented auto-merge
    policy) merges. `pr.merge_ready: true`.
  - `MERGED` — an authorized auto-merge was executed this turn.
  - `NEEDS_FIXES` — findings/blockers exist that fold into the CURRENT branch
    (`findings.fix_now` non-empty); fold, then re-run the gate that sent them.
  - `BLOCKED` — cannot proceed; `blockers` says why and `dependencies` gives
    the build order when the cause is an unmet dependency.
  - `NEEDS_INPUT` — a decision only the human can make; `needs_input.question`
    + `needs_input.options` filled. Nothing was guessed.
  - `FAILED` — an error the in-skill retries didn't clear (red gate past its
    cap, unrunnable substrate). A human looks before anything continues.
  - `HALT` — **stop-the-world**: a discovery that invalidates continuing ANY
    unit (critical security hole in merged code, broken substrate invariant,
    data-loss risk). Every `blockers[]` entry carries `"scope": "run"`. The
    orchestrator must stop the whole run and surface it, not just park a unit.
- **`findings`** — `fix_now` is an array of objects
  `{"ref": "F1", "title": "…", "file": "path:line"}` (they have no issue
  numbers yet); `issues_filed` is an **array of issue numbers** (integers)
  created/updated this turn; `untriaged` counts findings still without a
  destination (must be 0 when the skill's own contract requires routing all).
- **`blockers[]`** — objects
  `{"kind": "dependency | issue | gate | merge-conflict | substrate | input", "id": "<NN-slug | #N | check-name>", "scope": "unit | run", "detail": "<one line>"}`.
- **`dependencies`** — `unmet`: roadmap ids / `#issue` refs whose merge must
  land first; `build_order`: deepest-first order to unblock (mirrors
  execute-phase's dependency-gate output).
- **`next.tier`** — `strong` when the recommended command is judgment work
  (plan / review / audit / triage), `cheap` when it is mechanical execution.
  This is the model-routing hint for the orchestrator.
- **`detail`** — optional skill-specific payload (object), documented in the
  emitting skill's `## Machine envelope` section; `null` otherwise.
- **Truthfulness:** every value reflects what actually happened — sha/PR/issue
  numbers pasted from real command output, never invented. A value you did not
  verify is `null`, not a guess.
- **Placement:** fenced ```json, ONE object, absolute last output — nothing
  after it, not even a sign-off line.

## Relationship to other skills

- Every `user-invocable: true` skill of the pack carries a `## Machine
  envelope` section stating which states it can emit and what it puts in
  `detail`; this file is the single source of truth for the shared schema.
- `workflow-status` is the read-only sensor that emits the richest envelope
  (full feature/fix dependency tree in `detail`).
- `docs/workflow/ORCHESTRATION.md` documents the external driver loop
  (state → next command → model tier) that replaces Claude Code's `/loop`
  and subagents on any agent.
