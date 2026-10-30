---
"@gtrabanco/pi-agentic-workflow": minor
---

feat(pi): config-gated tool guards — owner-gated merges, history, CI and expensive tests

Four guards at the `tool_call` gate, all config-driven under the new `guards`
config key and all shipping OFF (a project opts in per guard):

- `merge` (issue #278, extended): `git merge`, `gh pr merge`, the `gh api`
  merge endpoints and mutations, and `git pull`'s merge form.
- `history`: pushes are decided by git itself — the push runs as
  `git push --dry-run` first and git's outcome (forced update, ref delete,
  destination `main`) declines it, so no flag spelling needs enumerating;
  offline falls back to a text check on the push's own segment.
- `ci`: writing workflow definitions (`.github`/`.gitea`/`.forgejo`
  workflows, `.gitlab-ci.yml`) and triggering runs (`gh workflow run`,
  `gh run rerun`, the `dispatches` endpoint).
- `expensiveTests`: commands matching configured patterns, gated when their
  estimated token cost exceeds `maxTokens` (`0` gates every match).

The only way through any guard is the explicit per-command token — the
command's first word — after an owner instruction in the same turn:
`AW_ALLOW=merge`, `AW_ALLOW=force` (never enables a push to `main`),
`AW_ALLOW=ci`, `AW_ALLOW=cost`. Documented residuals: payloads inside scripts
or interpreter one-liners, and git aliases invoked by name.
