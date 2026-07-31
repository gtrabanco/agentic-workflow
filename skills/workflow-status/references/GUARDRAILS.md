## Guardrails

- **Read-only, always.** No commit, push, issue, comment, label, or file edit —
  not even fixing an obviously stale roadmap row (report it as a blocker of
  kind `substrate` instead; `audit-docs` is the fixer).
- Evidence discipline per the project's **Workflow conventions**: every status
  comes from a command's output or a file's content; unverifiable → `null` +
  a `workflow_observations` note, never a guess.
- Forge unavailable → still report the git/docs view, with a `blockers` entry
  `{"kind": "substrate", "id": "forge", "scope": "run"}` so the orchestrator
  knows PR-dependent states are unknown.
- **`detail.urgent` is presence-only and read-only, always.** Derive it
  **exclusively** from the `labels` object of `gh issue list … --json …
  ,labels` — never parse title, body, or comments, and never cross-check the
  labeling actor's permission via the issue timeline (presence is already
  triage+-gated by GitHub). This sensor never emits a pause-vs-finish
  decision — only the facts the consumer's judge needs.

