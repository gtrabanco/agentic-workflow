## Whole-unit execution and portability

The normal omitted-phase command is already the batch:

```text
/execute-phase <NN>
/execute-phase --fix <n>
```

It selects every unfinished phase, gates and commits each one, skips
intermediate review stops, opens the PR, then recommends
`/loop-review-fold`. An explicit `P<n>` keeps the atomic/manual path.

### Fresh-context driver (recommended for cheap models)

When the host has subagents or headless invocation, the unit-loop conductor
uses one fresh worker per phase and carries only `ACCEPTANCE.md`, the phase task
slice, and compact receipts. An external driver may implement the same contract:

1. Call `workflow-status` and choose the next unfinished phase.
2. Invoke `/execute-phase <unit> P<n>` on the cheap tool-capable tier.
3. Repeat `CONTINUE`; route `READY_FOR_REVIEW` to `/loop-review-fold` on the
   required review/fold tiers.
4. Stop on `NEEDS_INPUT`, `HALT`, repeated unchanged evidence, or the declared
   attempt budget.

The protocol and envelope repair loop live in
`docs/workflow/ORCHESTRATION.md`. The user still starts one driver run; fresh
contexts are an implementation detail.

### Inline fallback

A host without fresh-worker primitives executes the same queue inline. After
each phase it reduces state to `progress.md`'s unit-loop receipt and never
re-reads prior raw context. This is less context-efficient but behaviorally
equivalent. A user who wants maximum control may pass explicit phases manually.

### Model routing

- Planning and acceptance freezing use the strongest available model.
- Mechanical phase execution may use a cheaper tool-capable model.
- Review is never weaker than the writer and should use a different family
  where practical.
- A subtle security/logic fold uses the strongest required tier even when
  surrounding mechanical folds are cheap.
- Cap parallel workers below the provider's concurrency limit; on 429 reduce
  fan-out rather than retrying at the same concurrency.

### Missing platform features

- No slash menu → open the named `SKILL.md` and follow it literally.
- No model tiers → select tiers manually using the rules above.
- No subagents/headless runs → use the inline fallback.
- No external driver → the built-in omitted-phase loop remains available.
