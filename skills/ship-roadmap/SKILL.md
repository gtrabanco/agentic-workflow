---
name: ship-roadmap
user-invocable: true
version: 3.1.1
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
argument-hint: "[--fullauto] | --continue [--fullauto]"
description: >
  Found or continue a roadmap autopilot one stage per invocation. Default:
  human merge. --fullauto is invocation-scoped and uses the transient wrapper
  only after a fresh audit. Triggers: "ship-roadmap", "ship the roadmap",
  "autopilot this project".
---

# Ship the roadmap (autopilot)

Run the entire agentic workflow unattended between human decision points: one
interactive founding turn that asks **everything**, then a driver-fired build
loop (Claude Code's `/loop`, an external orchestrator, or manual re-invocation
— see the launch contract) that plans, implements, reviews, opens and
(optionally) merges one PR per
feature until the roadmap is done — then keeps going: an **issue sweep**
inventories open issues and the run's own documented residue (known-issues,
trade-offs, postponed findings), triages it all, and ships what's fix-now —
ending in a final report that recommends
issues, newly discovered features, and the product-audit cadence.

This is the **expensive** skill: a full run burns planning, implementation and
review tokens for every roadmap feature. It exists to spend them well — strong
tiers only where judgment lives, cheap tiers where code gets typed, humans only
where a wrong call is expensive to undo.

> **Ultracode tip:** for large roadmaps, the user can enable the `ultracode`
> session setting (`/effort ultracode`) before starting the loop — the conductor
> then fans out independent sub-work (review axes, report evidence gathering)
> more aggressively. It is a session toggle only the user can set; this skill
> cannot declare or enable it (`effort:` accepts only low/medium/high/xhigh/max).

## Turn contract — verify before ending the turn

```
✓ Exactly ONE stage advanced (or a terminal banner printed) and ONE line appended to the run log
✓ Nothing was merged outside the active --fullauto wrapper; direct merge
  commands remained blocked and no authorization survived the iteration
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- You have a roadmap — or at least a product idea and a feature list in your
  head — and want the whole application built with supervision only at merge
  points and at the end.
- **Not** for one feature (`plan-feature` → `execute-phase`), one bug
  (`plan-fix`), or exploratory work. The autopilot ships a locked scope; it is
  the wrong tool when the scope is still being discovered.

## Step 0 — Discover the project (always first)

Read before acting: the agent guide (`CLAUDE.md`/`AGENTS.md`) and its
**Workflow conventions** (forge CLI, verification gate, docs language), the
documentation map, `docs/features/ROADMAP.md`, the fix index, the architecture
doc, and `.github/` templates. Then establish run context:

1. **Substrate present?** CLAUDE.md with Workflow conventions + doc map +
   roadmap + fix index → founding is skipped and interview rounds 3–4 collapse
   to confirmations of what the docs already state. Missing pieces → founding
   will create them.
2. **Workflow skills installed?** Verify `plan-feature`, `execute-phase`,
   `review-change`, and `audit-pr` are actually available in this environment
   (e.g. listed by the skills CLI or present under the skills directory), and
   **record the discovered skills-directory path in the decision record** —
   subagent prompts reference it. Missing → stop and instruct:
   `npx skills add gtrabanco/agentic-workflow`. Without these files the loop
   silently degrades.
   When this invocation carries `--fullauto`, also require executable
   `.agentic-workflow/hooks/fullauto-merge.sh` plus the active platform guard.
   Missing → stop and route to `init-workspace` upgrade; never fall back to a
   direct forge merge command.
3. **Run in progress?** `docs/features/SHIP_DECISIONS.md` exists — on any
   branch — or a `docs/ship-founding` PR is open → a run exists: `--continue`
   resumes it; a bare `/ship-roadmap` prints run status and the resume command
   instead of re-interviewing (never a second founding).
4. **Repo shape:** empty greenfield vs existing history; current branch; dirty
   tree (an unexplained dirty default branch is a stop condition, never
   something to clean up silently).


## Progressive loading — select the invocation route

The reference allowlist is exactly the ten linked paths below. Never invent or
read another `references/` path. Every route first loads
[guardrails](references/GUARDRAILS.md), then adds only the matching row:

**Hard rule for `--continue` at AUDIT:** LOAD exactly, in this order,
`references/GUARDRAILS.md`, `references/RECOVERY_AND_SELECTION.md`,
`references/STOP_CONDITIONS.md`, `references/ADVANCE.md`,
`references/MODEL_ROUTING.md`, and
`references/AUDIT_AND_MERGE.md`; after the stage, load
`references/CLOSEOUT_AND_LOG.md`. When the run is not terminal and all named
primitives exist, every other reference is forbidden for that turn.

| Condition now | LOAD complete route in this order | SKIP now |
|---|---|---|
| Found or inspect a run, no `--continue` (default mode or greenfield `--fullauto`) | [guardrails](references/GUARDRAILS.md) → [founding](references/FOUNDING.md) | recovery, stop conditions, advance, model routing, audit/merge, terminal report, portability |
| Existing-repo founding with `--fullauto` | [guardrails](references/GUARDRAILS.md) → [founding](references/FOUNDING.md) → [audit and merge policy](references/AUDIT_AND_MERGE.md) | recovery, stop conditions, advance, model routing, terminal report, portability |
| Continue one non-AUDIT iteration | [guardrails](references/GUARDRAILS.md) → [recovery and selection](references/RECOVERY_AND_SELECTION.md) → [stop conditions](references/STOP_CONDITIONS.md) → [advance](references/ADVANCE.md) → [model routing](references/MODEL_ROUTING.md) before stage execution → [closeout and log](references/CLOSEOUT_AND_LOG.md) after it | founding, audit/merge, terminal report, portability |
| Continue an AUDIT/fullauto iteration | [guardrails](references/GUARDRAILS.md) → [recovery and selection](references/RECOVERY_AND_SELECTION.md) → [stop conditions](references/STOP_CONDITIONS.md) → [advance](references/ADVANCE.md) → [model routing](references/MODEL_ROUTING.md) → [audit and merge policy](references/AUDIT_AND_MERGE.md) before the AUDIT stage → [closeout and log](references/CLOSEOUT_AND_LOG.md) after it | founding, terminal report, portability |
| Terminal stop/report | the active row above, then [terminal report](references/TERMINAL_REPORT.md) | unrelated rows |
| A named platform primitive is absent | the active row above, then [portability](references/PORTABILITY.md) | unrelated rows |

Do not load terminal reporting before a terminal condition. Do not load
portability when all named primitives exist. Model routing is mandatory before
each stage; audit/merge is mandatory before every AUDIT stage, even without
`--fullauto`.

Every selected resource is one hop from this file. Fixed banners, state
transitions, floor checks, and output blocks remain normative. A required
resource that cannot be read stops the run; never improvise from an older run.

## Portability

The workflow is driver-neutral. Use the exact fallback in
[portability](references/PORTABILITY.md) only when the current platform lacks a
primitive; do not change the stage sequence or safety floors.

## Relationship to other skills

- **Composes in-turn** (all ≤ its tier): `init-workspace` (founding, answers
  pre-fed), `design-feature` + `plan-feature-scaffold` (JIT design for a
  mid-run `idea`/`defined` unit, derive-only from the locked founding
  decisions), `plan-feature` (JIT planning, scoped path), `review-change`
  (checkpoints), `audit-pr` (verdict/comment merge gate; never the merge
  executor), `audit-docs` (docs-only founding /
  report PR coherence).
- **Spawns as sonnet subagents:** `execute-phase` discipline — phases,
  XS/S single passes, fix-now folding, audit-blocker fixes.
- **Hands off to the human:** every merge in default mode; `product-audit`
  always (its effort max exceeds the conductor's high — composing it would
  under-power it, the exact regression the ≥ rule exists to prevent); `triage-issue` for the
  report's issue batch.
- The manual flow (`plan-feature` → `execute-phase` → `review-change` →
  `audit-pr`, feature by feature) remains the default way of working —
  ship-roadmap is the same flow with the human moved to its edges.
- **External-orchestration sibling:** `workflow-status` + the driver-injected
  envelope (see `docs/workflow/ORCHESTRATION.md`) run this same loop from OUTSIDE the
  agent — sensor → route → invoke the skill directly, choosing the model per
  step. Prefer that when you want per-step model control or your agent lacks
  `/loop`/subagents; ship-roadmap remains the in-agent packaging of the loop.

## Done when

- The run reached a terminal banner with the final report written and its PR
  open; the roadmap's statuses are true; every PR is merged, open-and-audited,
  or parked with its reason recorded; on `SHIP: COMPLETE` the issue sweep is
  accounted for — inventory, triage verdicts, fix-now issues shipped or parked.
- Every decision of the run is traceable: locked answers in
  `SHIP_DECISIONS.md`, iteration evidence in the run log, outcomes and
  recommendations in the report.
- The human knows exactly what to do next — merge list, triage batch, accepted
  proposals, product-audit timing — without reading anything but the report.
