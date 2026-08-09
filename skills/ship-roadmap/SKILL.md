---
name: ship-roadmap
user-invocable: true
version: 4.0.1
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
argument-hint: "[--fullauto] | --continue [--fullauto]"
description: >
  Found or continue a roadmap autopilot one stage per invocation. Default:
  human merge. --fullauto is invocation-scoped and uses the transient wrapper
  only after a fresh audit. Triggers: "ship-roadmap", "ship the roadmap",
  "autopilot this project".
---

# Ship the roadmap (autopilot)

Found once, then run the driver-fired loop (Claude `/loop`, external driver, or
manual re-invocation): plan, implement, review, open and optionally merge one PR
per roadmap unit. After the roadmap, sweep existing issues, ship fix-now work,
report residue as proposals (never create backlog automatically), and print the
final report. Use strong tiers for judgment, cheap tiers for typing, and humans
at expensive-to-undo decisions.

## Turn contract — verify before ending the turn

```
✓ Exactly ONE stage advanced (or a terminal banner printed) and ONE line appended to the run log
✓ Nothing was merged outside the active --fullauto wrapper; direct merge
  commands remained blocked and no authorization survived the iteration
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

Any unchecked box means the turn is not done.

## When to use

Use for a locked roadmap with supervision at merge/end points. For one feature,
one bug, or exploratory work use the manual planning/execution flow instead.

## Step 0 — Discover the project (always first)

Read before acting: `CLAUDE.md`/`AGENTS.md` Workflow conventions, documentation
map, `docs/features/ROADMAP.md`, fix index, architecture doc, and `.github/`
templates. Then establish:

1. **Substrate:** if the guide, map, roadmap and fix index exist, skip founding
   and confirm their answers; otherwise founding creates missing pieces.
2. **Skills:** verify `plan-feature`, `execute-phase`, `review-change`, and
   `audit-pr` are installed and record their directory for worker prompts. If
   absent, stop with `npx skills add gtrabanco/agentic-workflow`. With
   `--fullauto`, also require executable `.agentic-workflow/hooks/fullauto-merge.sh`
   and its platform guard; otherwise route to `init-workspace`, never direct merge.
3. **Run:** existing `docs/features/SHIP_DECISIONS.md` or an open
   `docs/ship-founding` PR means resume with `--continue`; bare invocation reports
   status instead of founding again.
4. **Shape:** greenfield/existing, branch, and dirty tree; unexplained dirty
   default branch stops (never clean it silently).


## Progressive loading — select the invocation route

The allowlist is exactly the linked paths below. Never invent another reference.
Every route starts with [guardrails](references/GUARDRAILS.md), then loads only
its matching row:

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

Do not load terminal reporting before terminal state or portability when all
primitives exist. Model routing precedes every stage; audit/merge precedes every
AUDIT stage, including non-`--fullauto` runs.

Selected resources are one hop from this file. Fixed banners, transitions, floor
checks and output blocks are normative; an unreadable required resource stops the
run—never improvise from an older run.

## Portability

The workflow is driver-neutral. Use the exact [portability](references/PORTABILITY.md)
fallback only when a primitive is unavailable; keep stage order and safety floors.

## Relationship to other skills

| Relation | Skills/policy |
|---|---|
| Compose (same/lower tier) | `init-workspace`; JIT `design-feature` + `plan-feature-scaffold`; `plan-feature`; `loop-review-fold`; verdict-only `audit-pr`; `audit-docs`. |
| Cheap workers | `execute-phase` (fresh context/phase), mechanical folds, audit-blocker fixes; use the validated worker model. |
| Human hand-off | Default merges, `product-audit` (higher effort), and report issue batches via `triage-issue`. |
| Sibling | `workflow-status` + injected envelope runs the same loop externally with per-step model choice. |

Manual feature-by-feature flow remains the default; this skill packages it with
the human at its edges.

## Done when

- A terminal banner and final report exist with an open PR; roadmap statuses are
  true; every PR is merged, open/audited, or parked with a reason. `SHIP: COMPLETE`
  also accounts for the issue sweep and reports residue as proposals.
- Locked answers, iteration evidence, outcomes and recommendations are traceable
  in `SHIP_DECISIONS.md`, the run log and report; the report states exact next
  human actions (merges, triage, proposals, product-audit timing).
