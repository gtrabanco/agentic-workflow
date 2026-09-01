---
name: workflow-status
user-invocable: true
version: 3.0.3
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
argument-hint: "[--json-only] [--last-envelope <json|path>]"
description: >
  Read-only workflow sensor: compute repository, roadmap, dependency, PR,
  finding, and recovery state, then emit the fixed machine envelope. Never
  edits. Triggers: "workflow-status", "workflow status", "what can I build
  next", "state of the run".
---

# Workflow Status (the orchestrator's sensor)

One read-only pass over the project that answers, in a single fixed JSON
envelope: **what exists, what is blocked on what, what is startable right now,
and what the recommended next command is.** Built for external orchestrators
(see `docs/workflow/ORCHESTRATION.md`) but equally useful to a human asking
"where do we stand?".

## Turn contract — verify before ending the turn

```
✓ Every claim comes from a RUN command or a READ file (git/forge output, roadmap,
  fix index, feature folders) — nothing inferred from memory
✓ Nothing was edited, committed, pushed, or created — read-only, always
✓ `next.recommended` is non-bare (carries the unit's slug/NN, never a bare
  `/plan-feature`) AND staged by the target unit's resolved status **and** its
  current pre-execution evidence: `idea`/undesigned → `/design-feature <slug>`;
  `defined` → `/plan-feature <slug>` only on a current `SPEC-REVIEW-PASS`, else
  `/review-spec <slug>`; `planned`/`in-progress` → `/execute-phase <NN>` only on a
  current `PLAN-REVIEW-PASS`, else `/review-plan <NN>` (step 6a)
✓ A missing or non-frozen repository-state ledger emits a machine-readable
  substrate blocker and routes to discovery or resolution before any unit is
  listed as startable
✓ Every `detail.design_candidates[].next` begins with `/design-feature ` — design
  candidates always route to design, regardless of anything else
✓ When `--last-envelope` is supplied: the no-progress guard ran (crash-recovery
  checklist) — a hint that recommended `/plan-feature`/`/design-feature` for a
  unit still at its pre-advance status produces a `workflow_observations` note,
  never a silently repeated bland recommendation
✓ `recommendations.product_audit` was computed by the step-16 mechanical
  two-condition check (never guessed), and `next.tier` was derived from the
  resolved `next.recommended` command via the command→tier map in
  `## Machine envelope` (never guessed)
✓ Per-unit `review`/`closure`/`issues_born` (steps 10–12) were computed per
  their fixed rules — `adversarial.ran`/`n` stayed `null` unless real
  evidence exists, never guessed — and any fired `next.suggested[]` entries
  (step 13) quote their owning skill's condition verbatim, never a second
  copy of the trigger logic
✓ The envelope is emitted on **every** invocation of this skill, including a
  same-session natural-language follow-up about state — never replaced by prose
✓ The emitted envelope was checked against the shape reminders in
  `## Machine envelope` (mirroring
  `packages/agentic-workflow-schema/envelope.schema.json`) before printing
✓ The human-readable summary is printed, then the machine envelope (fenced
  ```json — see ## Machine envelope) is the ABSOLUTE last output
```

With `--json-only`, skip the human-readable summary: print the envelope alone.

## When to use

- Between orchestration steps: an external driver runs it to decide the next
  command and model tier without parsing prose.
- Before picking work manually: "what can I start right now?"
- **Not** for judging quality (that's `review-change`/`audit-pr`) or product
  health (that's `product-audit`) — this skill reports state, it never judges.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then
read what THIS skill needs: `docs/features/ROADMAP.md`, the fix index
(`docs/fix/README.md`), every in-flight feature folder's `TASKS.md` +
`progress.md` + `known-issues.md`, and `docs/features/SHIP_DECISIONS.md` if a
ship-roadmap run exists.


## Progressive loading — fixed sensor route

The reference allowlist is exactly the seven linked paths below. Never invent or
read another `references/` path. This skill is a read-only sensor. Every
invocation loads this baseline in order:

1. [sensor core](references/SENSOR_CORE.md)
2. [crash recovery](references/CRASH_RECOVERY.md)
3. [envelope core](references/ENVELOPE_CORE.md)
4. [envelope fields](references/ENVELOPE_FIELDS.md)
5. [pre-execution evidence](references/PRE_EXECUTION.md)
6. [guardrails](references/GUARDRAILS.md)

Add [pre-execution evidence](references/PRE_EXECUTION.md) whenever a unit is
`defined`, `planned` or `in-progress` — it defines step 6a (receipt sensing, the
one-label-per-stage table, and the legacy-adoption route).
Add [sensor signals](references/SENSOR_SIGNALS.md) only when a unit, issue,
finding, or recommendation exists; an empty project skips that file but still
emits the empty shapes defined by envelope fields. Add
[portability](references/PORTABILITY.md) only when the platform actually lacks a
named primitive. `--json-only` does not skip any baseline file.

All resources are one hop from this file. Missing required detail means
`BLOCKED`; do not fabricate a partial envelope.

## Portability

The sensor uses repository and forge commands only. When a named agent feature
is unavailable, follow [portability](references/PORTABILITY.md) without changing
the JSON contract.

## Relationship to other skills

- The **sensor** counterpart to `ship-roadmap`'s conductor: an external
  orchestrator calls `workflow-status` → routes on the envelope → invokes
  `plan-feature` / `execute-phase` / `review-change` / `audit-pr` /
  `triage-issue` directly, choosing the model per step — the same loop without
  the in-agent autopilot.
- Read-only sibling of `audit-docs` (which judges coherence and can fix) and
  `product-audit` (which judges health): this one only reports state.
- Schema owner: `orchestration-envelope` (internal).

## Done when

- Every roadmap/fix row, open PR, and in-flight folder was actually read, the
  dependency closures are computed transitively, and inconsistencies are
  reported (never repaired).
- The `CRASH RECOVERY` sub-block was printed with a verdict from the decision
  table, and the envelope `state` matches it (CLEAN→OK, RESUMABLE→CONTINUE,
  AMBIGUOUS→NEEDS_INPUT).
- With `--last-envelope` supplied: the no-progress guard ran — a stalled
  `/plan-feature`/`/design-feature` hint surfaces as a `workflow_observations`
  note, never a silent bland repeat, with no new write path introduced.
- The human summary (unless `--json-only`) and the envelope — with
  `detail` carrying design_candidates, features, fixes, startable_now,
  blocked_units, open_prs, pending_triage, `untriaged_issues`
  (count + oldest_open) and `urgent` (labels-only issue list +
  interruptibility facts) — are printed, envelope last.
- Each `detail.features[]`/`detail.fixes[]` entry additionally carries
  `review`, `closure`, and `issues_born` (steps 10–12) — `detail`-scoped, no
  schema change — and any fired triggers appear in a top-level
  `next.suggested[]` (step 13), single-sourced from the owning skill's own
  condition text.
- Nothing was modified anywhere.

→ Next: the envelope's `next.recommended` command — it is computed from the
  actual state, so it IS the recommendation
  · a human overview → read the printed table
  · orchestrating programmatically → parse the last fenced json block
