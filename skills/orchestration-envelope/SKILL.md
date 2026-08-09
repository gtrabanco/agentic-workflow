---
name: orchestration-envelope
user-invocable: false
version: 1.5.1
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal contract of the agentic-workflow pack: the machine envelope — the
  fixed JSON block an external orchestrator parses to route the next step
  (which command, which model tier) without a human reading the chat. Skills
  do NOT emit it on their own (except workflow-status, the sensor): a driver
  that wants it injects the canonical system-prompt snippet defined here and
  runs the repair loop on parse failure. Not a menu entry; this skill owns the
  schema, and docs/workflow/ORCHESTRATION.md documents the driver loop that
  consumes it.
---

# Machine envelope (internal contract)

The **envelope** is one fenced `json` block, the **absolute last output** of a
turn, used by an external orchestrator to route the outcome. This skill also
owns the canonical [Turn contract](references/TURN_CONTRACT.md) (11 boxes;
other skills load it plus their additions). **Emission** (feature 10):

- **`workflow-status` always** (emitting it is the sensor's function).
- **Other user-facing skills only on driver request**, via the canonical
  injected snippet below; interactive sessions emit none.
- Internal skills never emit one; they return their fixed reports. At most one
  envelope exists per turn.

**Parse contract for orchestrators:** take the **last fenced ```json block**
of the final assistant message. Exactly one envelope per turn; parse failure
→ the repair loop below.

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
  "next": {"recommended": "<the → Next: block's recommended command>", "alternatives": [], "tier": "strong | cheap", "suggested": []},
  "detail": null
}
```

Field rules (checkable):

- **`state`** is exactly one of the 11 schema values. Route semantics: `OK`
  finished; `CONTINUE` has more same-unit work; `READY_FOR_REVIEW` requires
  `review-change` and `gates.review_pending: true`; `READY_FOR_AUDIT` requires
  `audit-pr`; `MERGE_READY` permits documented human/auto merge and sets
  `pr.merge_ready: true`; `MERGED` means authorized auto-merge ran;
  `NEEDS_FIXES` has current-branch `findings.fix_now`; `BLOCKED` cannot proceed;
  `NEEDS_INPUT` fills `needs_input.question` and `.options`; `FAILED` exhausted
  in-skill retries; `HALT` stops the whole run and every blocker has `scope: run`.
- **`findings`**: `fix_now` objects are `{ref,title,file}`; `issues_filed` is
  integer issue numbers; `untriaged` counts findings without a destination.
- **`blockers[]`** objects are `{kind,id,scope,detail}` where `kind` is
  `dependency|issue|gate|merge-conflict|substrate|input` and `scope` is
  `unit|run`.
  `dependencies.unmet` lists prerequisite ids; `build_order` is deepest-first.
- **`next.tier`** is `strong` for plan/review/audit/triage judgment and `cheap`
  for mechanical work. `next.suggested[]` is optional and workflow-status-only;
  each `{command,trigger,source_skill}` quotes the owning condition and is
  advisory beside `next.recommended`/`next.tier` (mirrored in schema package 2.1.0).
- **`detail`** is an optional emitter-defined object, otherwise `null`.
  Truthfulness: use verified command output; unverified values are `null`.
  Placement: one fenced ```json object, absolutely last, with nothing after it.

## Driver system-prompt snippet + repair loop

User-facing skills (except `workflow-status`) do not print an envelope inline.
A driver that wants one injects this **canonical system-prompt snippet**
verbatim into every headless invocation:

```text
Every turn you produce MUST end with exactly one fenced ```json block matching
the orchestration envelope schema (all top-level keys present; values only
from verified command output). Emit nothing after it.
```

**Repair loop:** if `parseEnvelope(lastTurn)` fails, re-invoke the **same
session** once with `Emit only the machine envelope for the turn above.` and
parse that reply. A second failure is driver-level `FAILED`; never retry
indefinitely.

**Structured-output shortcut (optional):** when supported, send only the
envelope/repair turn with `response_format: {type: "json_schema", strict: true}`
and the package schema. Keep working turns unrestricted; otherwise prose/tool
use is suppressed. The repair loop remains the fallback.

`workflow-status` still emits inline (`--json-only` depends on it), so polling
it needs no repair loop; the snippet applies only to other user-facing skills.

## Companion npm package (keep it in sync)

The schema ships as **`@gtrabanco/agentic-workflow-schema`** in
`packages/agentic-workflow-schema/` (types, JSON Schema, `parseEnvelope()`).
Any schema change must update `src/index.ts`, `envelope.schema.json`, tests and
the package semver in the same PR (removed/renamed key or state = major,
additive = minor, fix = patch). CI publishes new versions on merge; skipping
the package makes the change incomplete.

## Relationship to other skills

Every user-facing skill carries a `## Machine envelope` section for its states
and `detail`; this file owns the shared schema. `workflow-status` is the
read-only sensor with the richest `detail`. `docs/workflow/ORCHESTRATION.md`
documents the external state → command → tier loop.

## Normalized Repository State

Drivers call `discover-repository-state` before planning and pass the frozen
`docs/workflow/REPOSITORY_STATE.md` reference forward. Contradictions route to
`resolve-repository-state`; never silently replace the snapshot.
