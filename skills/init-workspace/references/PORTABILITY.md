## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  the interview and adaptation are judgment work — run them on your
  **strongest** model.
- **No Claude Code hooks** — choose the Cursor, Copilot, or OpenCode adapter
  when available. If the agent exposes no pre-tool hook, report the safety hook
  as unavailable and keep forge rulesets as the hard boundary; `log-session`
  remains the manual logging alternative.

