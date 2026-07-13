# @gtrabanco/agentic-workflow-schema

> 🇪🇸 [Versión en español](README.es.md)

Types, JSON Schema, and parser/validator for the
[agentic-workflow](https://github.com/gtrabanco/agentic-workflow) **machine
envelope** — the fixed JSON block a driven agent turn ends with (emitted by
`workflow-status` always, and by any other skill when the driver injects the
canonical system-prompt snippet — see the driver protocol below), so external
orchestrators can route the workflow programmatically (which command next, on
which model tier).

Zero runtime dependencies. Source of truth for the contract:
[`skills/orchestration-envelope/SKILL.md`](https://github.com/gtrabanco/agentic-workflow/blob/main/skills/orchestration-envelope/SKILL.md);
driver protocol:
[`docs/workflow/ORCHESTRATION.md`](https://github.com/gtrabanco/agentic-workflow/blob/main/docs/workflow/ORCHESTRATION.md).

## Install

```sh
npm install @gtrabanco/agentic-workflow-schema
```

## Use

```ts
import {
  parseEnvelope,
  isTerminal,
  isRunHalt,
} from "@gtrabanco/agentic-workflow-schema";

const output = await runAgentHeadless("Follow the installed SKILL.md for: /workflow-status --json-only");

const result = parseEnvelope(output); // extracts the LAST fenced ```json block
if (!result.ok) throw new Error(result.errors.join("; "));

const env = result.envelope; // fully typed
if (isRunHalt(env)) stopEverythingAndPage(env.blockers);
else if (isTerminal(env.state)) askHuman(env);
else invokeNext(env.next.recommended, env.next.tier); // "strong" | "cheap"
```

The parse contract is exactly what the skills promise: **the last fenced
```` ```json ````…```` ``` ```` block of the final message is the envelope**,
one per turn, all top-level keys always present.

Also exported: `extractLastJsonBlock(text)`, `validateEnvelope(value)`,
`ENVELOPE_STATES` (the 11-state enum), `TERMINAL_STATES`, and every field
type. A language-agnostic **JSON Schema** ships too — works on the
`engines.node` minimum (>=18):

```ts
import { createRequire } from "node:module";
const schema = createRequire(import.meta.url)("@gtrabanco/agentic-workflow-schema/envelope.schema.json");
```

On Node 20.10+/22, the newer import-attributes form also works:

```ts
import schema from "@gtrabanco/agentic-workflow-schema/envelope.schema.json" with { type: "json" };
```

## The envelope, field by field

Every top-level key is **always present** (`required` in the JSON Schema) —
a skill that has nothing to report for a key uses `null` / `[]` / `0`, never
omits it. **Closed** = the exact enum below is exhaustive (the validator
rejects anything else); **open** = free-form, any value of the stated type.

| Field | Type | Values | Meaning |
|---|---|---|---|
| `skill` | string | open (non-empty) | Which skill produced this envelope. |
| `state` | enum | **closed** — the 11 states below | The routing key. Everything an orchestrator decides starts here. |
| `summary` | string | open | One plain-text sentence: what happened this turn. |
| `unit.type` | enum | **closed** — `feature` · `fix` · `docs` · `none` | What kind of unit the turn worked on. |
| `unit.id` | string\|null | open | The unit's identifier (`NN-slug` for features, `n-topic` for fixes). |
| `unit.issue` | integer\|null | open | The tracking issue number, when the unit is issue-born. |
| `unit.branch` | string\|null | open | The working branch. |
| `phase.current` | string\|null | open (by convention `P1`, `P2`, …) | Phase just worked, for phased (M/L) features. |
| `phase.total` / `phase.completed` | integer\|null | open | Phase counts; `null` for single-pass units. |
| `pr.number` / `pr.url` / `pr.head_sha` | int/str\|null | open | The unit's PR, once it exists. |
| `pr.state` | enum | **closed** — `open` · `merged` · `none` | Merge state lives in the forge, not the roadmap. |
| `pr.merge_ready` | boolean\|null | open | `true` only after an `audit-pr` MERGE-READY verdict on the current head. |
| `pr.ci` | enum | **closed** — `green` · `red` · `pending` · `none` · `null` | `none` = the project has no CI; `null` = not checked this turn. |
| `gates.verification` | enum | **closed** — `green` · `red` · `not-run` · `null` | The project's own gate (type-check + tests + build) as last RUN. |
| `gates.review_pending` / `gates.audit_pending` | boolean\|null | open | Whether the mandatory review / merge audit still has to happen. |
| `findings.fix_now[]` | object array | items: `id`/`file`/`axis`/`class`/`route` (open), `severity` (**closed** — `high`·`med`·`low`), `suggested_tier` (**closed** — `strong`·`cheap`) | Findings that must fold into the CURRENT branch before it advances — one item per unfolded row of the unit's `review-findings.md` fold ledger. |
| `findings.issues_filed[]` | integer array | open | Issue numbers created/updated this turn. |
| `findings.untriaged` | integer ≥ 0 | open | Findings still without a destination — skills whose contract routes everything must report `0`. |
| `findings.decisions_recorded` | integer ≥ 0 | open | Decisions written to `decisions.md`-class records this turn. |
| `blockers[].kind` | enum | **closed** — `dependency` · `issue` · `gate` · `merge-conflict` · `substrate` · `input` | Why the unit (or run) cannot proceed. |
| `blockers[].scope` | enum | **closed** — `unit` · `run` | `run` means stop-the-world: nothing else proceeds either. |
| `blockers[].id` / `blockers[].detail` | string | open | What exactly (a slug, `#N`, a check name) + one line of context. |
| `dependencies.unmet[]` / `dependencies.build_order[]` | string arrays | open | Unmet roadmap/issue refs, and the deepest-first order to build them. |
| `recommendations.product_audit` | boolean | open | `true` when recurring drift suggests the founding assumptions are stale. |
| `recommendations.reason` | string\|null | open | Why (required in practice when the flag is `true`). |
| `needs_input` | object\|null | `question` (open) + `options[]` (open) | Non-null only on `state: NEEDS_INPUT` — the human decision to surface, with concrete options. Nothing was guessed. |
| `next.recommended` | string | open (a skill invocation) | The single best next command. |
| `next.alternatives[]` | string array | open | The other defensible choices. |
| `next.tier` | enum | **closed** — `strong` · `cheap` | Which model class the next step deserves — judgment vs mechanical. |
| `detail` | any | open (skill-specific) | Per-skill payload — e.g. `workflow-status` carries the full project tree (`features`, `fixes`, `startable_now`, `blocked_units`, `crash_recovery`, …) here. |

### The `state` routing table (closed — exactly these 11)

| `state` | Meaning | Orchestrator action |
|---|---|---|
| `OK` | Skill finished its job | Invoke `next.recommended` on `next.tier` |
| `CONTINUE` | Same unit, more of the same work | Re-invoke `next.recommended` (advisory checkpoints also land here — the alternative is listed) |
| `READY_FOR_REVIEW` | Unit finished; mandatory review next | `/review-change` on a strong model, fresh context |
| `READY_FOR_AUDIT` | Review clean | `/audit-pr` (strong) |
| `MERGE_READY` | Audit passed on the current head SHA | Human merges — or your written auto-merge policy does |
| `MERGED` | An authorized auto-merge ran this turn | Next unit: poll `workflow-status` |
| `NEEDS_FIXES` | `findings.fix_now` is non-empty | Fold on-branch (commit AND push), then re-run the gate that emitted them |
| `BLOCKED` | Unmet dependency / external cause | Follow `dependencies.build_order`, or resolve `blockers[]` |
| `NEEDS_INPUT` | A human must decide | Surface `needs_input.question` + `options`; resume with the answer |
| `FAILED` | Retries exhausted | Stop this unit; a human looks |
| `HALT` | Stop-the-world discovery (`blockers[].scope: "run"`) | Stop the whole run; nothing proceeds until a human clears it |

`isTerminal(state)` covers `NEEDS_INPUT` / `FAILED` / `HALT` (+ human-gated
`MERGE_READY`); `isRunHalt(envelope)` is the `HALT` / run-scoped-blocker check.

## Orchestrating with this schema

Two patterns, both consuming the same envelope. In both, **inject the
canonical system-prompt snippet** into every headless invocation (skills do
not emit the envelope on their own — `workflow-status` is the one exception):

```text
Every turn you produce MUST end with exactly one fenced ```json block matching
the orchestration envelope schema (all top-level keys present; values only
from verified command output). Emit nothing after it.
```

…and run the **repair loop** on parse failure — one retry, then fail the step:

```ts
async function turn(prompt: string) {
  let out = await invokeAgent(prompt, { system: SNIPPET });
  let r = parseEnvelope(out);
  if (!r.ok) {
    out = await invokeAgent("Emit only the machine envelope for the turn above.", { resume: true });
    r = parseEnvelope(out);
    if (!r.ok) throw new Error(`step failed: no valid envelope (${r.errors.join("; ")})`);
  }
  return r.envelope;
}
```

**Pattern 1 — fixed driver loop** (start here): poll the sensor, route on
`state`, repeat. Full skeleton in
[`docs/workflow/ORCHESTRATION.md`](https://github.com/gtrabanco/agentic-workflow/blob/main/docs/workflow/ORCHESTRATION.md),
including the crash-recovery restart protocol (`--last-envelope` hint +
append-only envelope journal).

**Pattern 2 — dynamic workflows** (the conductor pattern): one long-running
conductor context *writes and monitors* the work plan; every worker runs in a
**clean context** and only its envelope flows back up — the conductor never
ingests raw transcripts, which is what lets it stay long-running without
degrading. The envelope is precisely the "structured result" this pattern
needs:

```ts
// Conductor: fan out independent units (workflow-status said they're startable
// in parallel and the project declares `worktrees`), read back only envelopes.
const status = await turn("Follow the installed SKILL.md for: /workflow-status --json-only");
const units = status.detail.startable_now as string[];

const results = await Promise.all(
  units.map((u) => turn(`Follow the installed SKILL.md for: /execute-phase ${u}`))
);

for (const env of results) {
  if (isRunHalt(env)) throw new Error(`HALT: ${JSON.stringify(env.blockers)}`);
  if (env.state === "NEEDS_FIXES")
    await turn(`Fold the fix-now findings on ${env.unit.branch}: ${JSON.stringify(env.findings.fix_now)}`);
}
// The conductor's own context grew by a few KB of envelopes — not by N transcripts.
```

Safety floor for any driver, fixed loop or dynamic: never skip a
`review_pending`/`audit_pending` gate, never merge on anything but a fresh
`MERGE_READY` bound to the current head SHA, and treat `HALT` as terminal
until a human clears it.

## Versioning

This package's semver tracks the **envelope contract**, not the repo:
breaking schema change (key removed/renamed, state removed) → major;
additive (new optional key, new state) → minor; fixes/docs → patch. When the
`orchestration-envelope` skill changes, this package changes in the same PR.
