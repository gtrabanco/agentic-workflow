# 15 — injection-safe-urgency · known-issues

Deferred items — each linked to (or destined for) an issue. Deferred work is
**not** implemented inline.

## Deferred

- **Timeline / actor-permission cross-check.** Verifying the labeling actor still
  holds triage+ permission via `gh api .../timeline` `labeled` events is deferred
  defense-in-depth (Product-half decision, `decisions.md`). Presence is already
  capability-gated by GitHub; revisit only if a demoted-actor threat materializes.
  No issue opened yet — open one only if that threat is observed.
- **`fix-next` auto-dequeue.** The `fix-next` label is not auto-removed when the
  issue reaches the head of the queue; it drops naturally when the issue closes
  (`status:issue-closed`). A future "consume the label on pickup" behavior would be
  a separate change, not a shortcut here.

## Not an issue (by design)

- **No `template/` mirror.** Labels seed into target repos via `init-workspace`
  behavior, not a templated file (SPEC non-goal). Accepted, not a defect.
- **Judge model not pinned.** The rubric names a *tier* (cheapest capable ·
  clean-context · tool-less), never a model id — required for the workflow's
  model-agnostic portability. Accepted (`decisions.md`).
