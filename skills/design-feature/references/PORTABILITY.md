## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the
  frontmatter pins these tiers; here, pick tiers yourself: capability closure
  is judgment work — run it on your **strongest** model available.
- **No `/loop`** — re-invoke this skill by hand when a review round or an
  instruction-mode revision is needed; follow the closing `→ Next:` block each
  time.

