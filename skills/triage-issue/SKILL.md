---
name: triage-issue
user-invocable: true
version: 1.1.0
argument-hint: <issue-number> [more issue numbers…]
model: opus
effort: high
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Classify an issue and take a defensible decision: fix-now, postpone
  (deferred/trigger-based), wontfix, or promote-to-feature. Reads the issue's own
  "when to fix"/trigger and severity, verifies the trigger against the CURRENT
  codebase (counts consumers, checks thresholds, measures), then routes or
  reports with a dated, auditable comment. Triggers: "triage issue N", "should we
  fix #N now", "classify this issue", "is #N's trigger met", "what do we do with
  #N".
---

# Triage Issue

Decide what happens to an issue, grounded in evidence — not vibes. Prevents both
premature work (acting on a deferred item whose trigger is unmet) and silent rot
(a fix-now bug left to drift).

## When to use

- Any issue needing a decision: a freshly filed bug, a `postpone`/`needs-triage`
  item, or a periodic re-confirmation of a deferred tradeoff.
- **Batch triage** — pass several numbers (`triage-issue 12 14 17`): each issue
  gets its own independent verdict + evidence, then one summary table at the
  end. Batching applies to *triage only* — any resulting fix still gets its own
  branch and PR.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the fix index (e.g. `docs/fix/README.md`) and fix SPEC
template, and the roadmap. Then read the issue in full, including comments and
labels (forge CLI per the project's Workflow conventions — examples use `gh`):

```sh
gh issue view <N> --json number,title,body,labels,state,comments
```

## Process

1. **Parse the issue's own contract.** Extract its severity and any "When to
   fix" / "Trigger" / "Acceptance (when triggered)" clause. Many issues carry an
   explicit signal-based trigger — honor it.
2. **Verify the trigger against current code.** Do the actual check, e.g.:
   - count real consumers of a duplicated helper (is the "3rd consumer" here?),
   - check a threshold (article count, p95 latency, row count),
   - reproduce a reported defect, or confirm it's already fixed.
   Use `grep`/`gh`/tests — cite the evidence (paths, counts, line refs).
3. **Classify** into one of:
   - **fix-now** — defect or trigger met → route to `plan-fix` then
     `execute-phase --fix`; add the entry to the fix index.
   - **promote-to-feature** — really new capability → route to `plan-feature`
     (the router handles the issue path).
   - **postpone** — valid but trigger unmet → leave open; post a **dated
     re-confirmation** comment stating what you checked and why it stays
     deferred. Do **not** implement deferred work inline.
   - **wontfix** — obsolete or explicitly bounded by the issue → propose closing,
     with rationale.
4. **When the call is the user's, ask.** If the decision hinges on product/risk
   judgment rather than evidence, present the verdict and options and let the
   user choose before acting.
5. **Report and keep docs coherent.** Post the decision as a dated issue comment
   with evidence. If it becomes an active fix, register it in the fix index; if
   closed, remove any stale index entry. Never mutate GitHub state (labels,
   close) without confirmation when ambiguous.

## Guardrails

- Don't build deferred work just because asked to "look at" the issue — surface
  that the trigger is unmet and stop.
- Keep issues, the fix index, and docs in sync with reality.
- Otherwise per the project's **Workflow conventions** (docs-language, evidence):
  state exactly what you checked.

## Relationship to other skills

```
                 ┌─ fix-now ─────────▶ plan-fix ─▶ execute-phase --fix
triage-issue ────┼─ promote ─────────▶ plan-feature (router → from-issue)
                 ├─ postpone ────────▶ dated comment, leave open
                 └─ wontfix ─────────▶ propose close
```

## Done when

- The issue has a clear verdict with cited evidence.
- The verdict is recorded (routed, commented, and/or index-updated), and nothing
  deferred was implemented inline.
