## Batch execution with `/loop`

To run all phases without manual re-invocation, use Claude Code's self-paced
`/loop` with a goal rather than a direct command (the skill requires a phase
argument, so `/loop /execute-phase NN` alone won't advance automatically):

```
/loop implement all phases of feature NN one by one using /execute-phase,
commit each phase, and stop when TASKS.md shows all phases checked
```

The loop reads `TASKS.md` to pick the next uncompleted phase, implements it,
and terminates naturally when nothing remains — no explicit stop condition
needed. **Trigger-based checkpoints are skipped in this mode, but the end review is
not optional:** at the end, **mark done + open the PR**, then run `/review-change`
once (the mandatory final review) → `audit-pr`.

Use this when the SPEC is solid and you want to review the whole branch at once
rather than at each intermediate checkpoint. For incremental, phase-by-phase
review, stick to the default (manual re-invocation + checkpoint hand-offs).

**No `/loop` on your agent?** Two vendor-neutral equivalents: (a) an
**external orchestrator** loops this skill headless, injecting the
driver-facing envelope requirement (see `orchestration-envelope`) so each
invocation's `state`/`next.recommended` say exactly what to run next
(`CONTINUE` → next phase on a cheap tier, `READY_FOR_REVIEW` → review on a
strong tier); protocol + driver skeleton in `docs/workflow/ORCHESTRATION.md`.
(b) Run the same loop by hand: after each phase, re-invoke this skill with the
next phase (`execute-phase <NN> <next>`) — the closing block always names the
exact next command — and keep the mandatory end review. The sequence is
identical; only the automation differs.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  planning, review, and audit need your **strongest** model; mechanical
  execution may run cheaper. Never review a change with a model weaker than
  the one that wrote it — and prefer a different model family than the
  writer's: same-family instances share training blind spots, cross-family
  decorrelates errors.
- **No `/loop`** — re-invoke the skill by hand per phase, following its closing
  `→ Next:` block each time (see *Batch execution* above).
