## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. This
skill has no Claude Code dependency at all — it is the piece that lets ANY
driver (a shell loop, a CI job, another agent) orchestrate the workflow:

- **No slash-command menu** — open this `SKILL.md` and follow it literally in
  a fresh conversation, or invoke it headless (see
  `docs/workflow/ORCHESTRATION.md` for per-agent invocation patterns).
- **No per-skill `model:`/`effort:`** — this is mechanical reading and
  counting: a **cheap** tier is enough; never spend a strong model here.
- **No argument passing (`--last-envelope`)** — paste the persisted envelope
  JSON into the invocation message: the skill treats the last fenced json
  block of the *request* as the hint.
