## Machine envelope

Schema and placement per the installed `orchestration-envelope` skill. The
`state` maps 1:1 from the crash-recovery verdict — **no new schema fields or
states** (the schema package needs no release):

- `CLEAN` → `state: OK` (the sensor default when the substrate is usable).
- A missing or non-frozen repository-state ledger is a run-scoped substrate
  gate and overrides the crash-recovery state with `state: BLOCKED`; the
  blocker and concrete discovery/resolution command are emitted before
  readiness data.
- `RESUMABLE` → `state: CONTINUE`, `next.recommended` = the resume command
  from the decision table.
- `AMBIGUOUS` → `state: NEEDS_INPUT`, `needs_input.question` = what is
  contradictory, `needs_input.options` = the concrete choices (resume / redo
  the phase / discard the dirty work), evidence in `detail.crash_recovery`.

`next` always carries the single best command for the project right now, and
`detail` the full tree (plus `crash_recovery: {verdict, branches: [...]}`).
**`detail.design_candidates`** is an array beside `detail.startable_now` /
`detail.blocked_units` — every `idea`-status unit, deps-agnostic (design
happens before dependency startability matters). It is never a top-level
envelope key.

**`detail.urgent`** — the injection-safe urgency channel (feature 15):
`{issues: [...], interruptibility: {...}}`. `issues` lists every **open**
issue carrying `urgent` or `fix-next`, read **only** from the `labels` object
returned in step 2/3's `gh issue list --state open … --json … ,labels` call —
never from title, body, or comments; an issue with "URGENT" only in its text
never appears here (`urgent` wins when an issue somehow carries both labels).
Scoping the list to `--state open` means a shipped fix's issue drops out of
`detail.urgent` the moment it closes — automatically, on the next poll, with
no manual label strip required (there is nothing to reconcile: this field is
recomputed fresh every invocation, never persisted).
`interruptibility` carries the in-flight unit's facts — `phase`, `dirty`
(bool), `tasks_from_boundary` (count of unticked tasks left in the current
phase) — reusing the same phase-progress and crash-recovery reconcile, not a
new computation. This field is **presence-only reporting**; it never contains
a pause-vs-finish verdict — that decision belongs entirely to the consumer's
bounded judge (`docs/workflow/ORCHESTRATION.md`). An empty `issues` array
means no urgency signal is in play; `next.recommended` may still be
influenced by a non-empty one (e.g. surfaced as an `alternatives` entry), but
is never silently replaced by it.

**`detail.untriaged_issues`** — the plain open-issue backlog surfaced by
step 15: `{count, oldest_open: [numbers]}` (oldest-first, capped at 5 numbers).
`detail` is schema-unconstrained (`envelope.schema.json:170`, `"detail": {}`),
so this field needs **no package change**. Kept strictly distinct from
`detail.pending_triage`
(findings pulled from `known-issues.md`/postponed-labeled issues, step 14) and
`findings.untriaged` (review-finding routing) — none of the three subsumes
another. `count: 0` means every open issue has a triage disposition; a
non-zero `count` may drive `next.recommended`/`alternatives` toward a
concrete `/triage-issue <numbers>` citing the listed issues.

**Per-unit `review`/`closure`/`issues_born` (step 10–12) — carried on each
`detail.features[]`/`detail.fixes[]` entry, not as new top-level keys.**
`detail` is schema-unconstrained (`envelope.schema.json:170`, `"detail": {}`)
— same precedent as `detail.urgent`/`detail.untriaged_issues` (fix `#52`), so
these need **no package change**:
- `review: {last_checkpoint_sha, unreviewed_diff: {lines, files},
  terminal_done, adversarial: {ran, n}}` — step 10. `adversarial.ran`/`n` are
  `null` unless real evidence exists (no skill persists that marker today —
  never guessed).
- `closure: {state}` ∈ `present | absent-legacy | blocked` (feature units)
  or `n/a` (fix units) — step 11, reusing `audit-pr`'s own grep verbatim.
- `issues_born: {n, with_descope_amendment}` — step 12, reusing `audit-pr`'s
  scope-bleed detection (widened by `#79`/`#89` to also match an issue
  linked from an `## Amendments` row).

**`next.suggested[]`** — step 13's trigger-attributed suggestion surface,
`{command, trigger, source_skill}[]`, **optional** (mirrors
`packages/agentic-workflow-schema` 2.1.0's optional `EnvelopeSuggestion[]`).
Each `trigger` string quotes the owning skill's own condition — never a
second, drifting copy of that skill's logic. Advisory only: it rides beside
`next.recommended`/`next.tier`, never replaces them. No unit has a fired
trigger this run → `next.suggested` is omitted entirely (an empty/absent
field, not an error).

**Envelope shape reminders (self-check before printing — mirrors
`packages/agentic-workflow-schema/envelope.schema.json`):**

- `blockers[].scope` ∈ `{"unit","run"}` — there is **no** `"code"` value;
  doc/roadmap drift is always `"unit"`-scope (`envelope.schema.json:111`).
- A `"run"`-scope blocker forces `state` ∈ `{BLOCKED, HALT}` — it is **never**
  compatible with `state: OK` (see `orchestration-envelope`).
- `dependencies.unmet` is an **array of strings** (unit ids / `#issue` refs) —
  never an array of objects (`envelope.schema.json:120`); any richer detail
  belongs in a `blockers[].detail` string instead.

**`next.tier` derivation — a fixed command→tier map, never guessed:**

| Command | Tier |
|---|---|
| `/discover-repository-state` | `strong` |
| `/resolve-repository-state` | `strong` |
| `/plan-feature` | `strong` |
| `/design-feature` | `strong` |
| `/review-change` | `strong` |
| `/audit-pr` | `strong` |
| `/triage-issue` | `strong` |
| `/product-audit` | `strong` |
| `/execute-phase` | `cheap` |

`next.tier` is read off this map by matching the resolved `next.recommended`
command's name (ignoring its arguments) — never guessed and never copied from
the invoking driver's own tier.
