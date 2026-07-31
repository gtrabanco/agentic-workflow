---
name: orchestration-envelope
user-invocable: false
version: 1.4.1
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

The **envelope** is one fenced `json` block, the **absolute last output** of
a turn, that lets an external orchestrator route on the outcome. **Who emits
it** (since feature 10 — see `docs/workflow/MIGRATION.md`):

- **`workflow-status` — always**, as part of its own contract (emitting the
  envelope *is* the sensor's function).
- **Every other skill — only when a driver asks for it**, by injecting the
  canonical system-prompt snippet below into the headless invocation. In an
  interactive/human session, no skill prints an envelope and none should be
  expected.
- Internal skills (the review pack, the planning steps, this one) never emit
  it in any mode: they return their fixed completion reports to the composing
  caller; at most one envelope exists per turn, for the whole turn.

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
- **`next.suggested[]`** — optional, `workflow-status`-only: trigger-attributed
  suggestions `{command, trigger, source_skill}`, one entry per fired trigger
  the driver can act on right now. `trigger` **quotes** the owning skill's own
  condition verbatim — never a second, drifting copy of that skill's logic.
  Advisory only: it rides beside `next.recommended`/`next.tier`, never
  replaces or reorders them. Absent/empty on any envelope that doesn't emit
  it — old consumers ignore an unknown key, so this is additive. Mirrored in
  `packages/agentic-workflow-schema` 2.1.0 (`EnvelopeSuggestion[]`, optional)
  — see that package's `## Versioning` for the additive-minor rule this
  followed.
- **`detail`** — optional skill-specific payload (object), documented in the
  emitting skill's `## Machine envelope` section; `null` otherwise.
- **Truthfulness:** every value reflects what actually happened — sha/PR/issue
  numbers pasted from real command output, never invented. A value you did not
  verify is `null`, not a guess.
- **Placement:** fenced ```json, ONE object, absolute last output — nothing
  after it, not even a sign-off line.

## Driver system-prompt snippet + repair loop

As of feature 10, user-facing skills (all except `workflow-status`) no longer
print the envelope inline — the requirement moved to this layer, the one a
driver can actually enforce. A driver that wants the envelope injects the
following **canonical system-prompt snippet**, verbatim, into every headless
invocation:

```text
Every turn you produce MUST end with exactly one fenced ```json block matching
the orchestration envelope schema (all top-level keys present; values only
from verified command output). Emit nothing after it.
```

**Repair loop (driver protocol).** If `parseEnvelope(lastTurn)` fails (no
fenced json block, or it doesn't validate), do not treat the turn as failed:
re-invoke the **same session** with the single-line prompt
`Emit only the machine envelope for the turn above.` and parse that reply.
Rationale: a weak model that won't spontaneously emit JSON at the end of a
long document almost always can when it is the only thing being asked — this
is why the snippet, not a per-skill turn-contract box, is the enforcement
point. Bound the retry: **one repair attempt per turn**; a second parse
failure is a driver-level `FAILED` for that step, surfaced to a human rather
than looped indefinitely.

**Structured-outputs shortcut (provider-conditional).** If the provider/model
supports strict structured outputs (`response_format: {type: "json_schema",
strict: true}` — many OpenAI-compatible providers offer it on selected models;
check your provider's docs for which), the driver can force the envelope
rather than hope for it: send the
envelope-only turn (the repair prompt above, or a dedicated final "emit the
envelope" turn) with the package's `envelope.schema.json` as the response
format, and the reply validates by construction. The repair loop remains the
fallback for models without the feature. Never set a response format on the
working turns themselves — it forces the entire output to JSON and suppresses
the prose and tool use the turn still needs.

`workflow-status` is the one exception: it still emits the envelope inline as
part of its own output (emitting it *is* its function — `--json-only` is
meaningless without it), so a driver polling it needs no repair loop for that
call; the snippet above and the repair loop apply only to the other
user-facing skills.

## Companion npm package (keep it in sync)

The schema ships as **`@gtrabanco/agentic-workflow-schema`**
(`packages/agentic-workflow-schema/` in this repo): TypeScript types, a JSON
Schema, and `parseEnvelope()` implementing the last-fenced-json parse
contract. **Any change to the schema in this file changes the package in the
same PR** — update `src/index.ts` + `envelope.schema.json` + tests, and bump
the package version by the contract's own semver (key/state removed or
renamed → major; additive key/state → minor; fixes → patch). CI
(`.github/workflows/publish-schema.yml`) publishes to npm automatically on
merge when the version is new. A schema change that skips the package is an
incomplete change.

## Relationship to other skills

- Every `user-invocable: true` skill of the pack carries a `## Machine
  envelope` section stating which states it can emit and what it puts in
  `detail`; this file is the single source of truth for the shared schema.
- `workflow-status` is the read-only sensor that emits the richest envelope
  (full feature/fix dependency tree in `detail`).
- `docs/workflow/ORCHESTRATION.md` documents the external driver loop
  (state → next command → model tier) that replaces Claude Code's `/loop`
  and subagents on any agent.

## Normalized Repository State

Drivers call `discover-repository-state` before planning and pass the frozen
`docs/workflow/REPOSITORY_STATE.md` ledger reference to later skills. A contradiction routes to
`resolve-repository-state`; drivers never silently replace the snapshot.
