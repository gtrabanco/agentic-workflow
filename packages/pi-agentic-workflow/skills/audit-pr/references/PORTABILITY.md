## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  the merge gate is the highest-stakes automated verdict — run it on your
  **strongest** model, never on the cheap tier that wrote the code.
- **Receipt consumption is comment-based, not forge-branded.** The
  `review-change:pass` marker lives in PR comments (`gh pr view <N> --json
  comments` on GitHub). On a forge without a native comments list, use its
  closest equivalent (MR notes, review threads); the newest-marker-wins and
  head-SHA comparison semantics are forge-independent.
