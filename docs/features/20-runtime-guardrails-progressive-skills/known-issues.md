# 20 — runtime-guardrails-progressive-skills · known-issues

## Deferred

None. Forge-side branch protection remains an explicit deployment requirement,
not deferred implementation: hooks are defense-in-depth and cannot sandbox a
hostile process.

P6: none. The wrapper intentionally fails closed when the forge cannot provide
current audit, decision, base, head, or CI evidence.

P7: none. OpenCode receives its worktree from plugin initialization context;
the checker rejects every file or directory nested below a skill's
`references/` directory.
