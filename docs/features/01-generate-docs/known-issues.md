# 01 — generate-docs — Known issues / deferred

| # | Item | Why deferred | Re-trigger |
|---|---|---|---|
| 1 | Monorepo with multiple docs sites: adapter detection picks one root only | No current user; disambiguation needs a declaration syntax not worth designing speculatively | First monorepo user report → open issue, extend the `Docs site` declaration to a list |
| 2 | Interactive graph rendering component for Starlight (clickable node map) | Skill documents a rendering recipe; building a component is target-project work | If a reference implementation is repeatedly requested → promote to its own feature |
| 3 | Docs-site scaffolding (create the Astro/Starlight site itself) | Out of scope by design (D-scope); init-workspace only records the declaration | If users repeatedly lack a site → consider an `init-workspace` optional step, via product-audit |
| 4 | Pre-existing drift found in P2, not this unit's scope: `docs/workflow/SKILLS.md` intro says "12 user-facing + 4 internal" (real: 14 + 14) and lists neither `workflow-status` nor the review pack | Fixing it here would be unrelated-doc refactoring (Forbidden list) | Next `/audit-docs` run will catch and route it |
