# 01 — generate-docs — Known issues / deferred

| # | Item | Why deferred | Re-trigger |
|---|---|---|---|
| 1 | Monorepo with multiple docs sites: adapter detection picks one root only | No current user; disambiguation needs a declaration syntax not worth designing speculatively | First monorepo user report → open issue, extend the `Docs site` declaration to a list |
| 2 | Interactive graph rendering component for Starlight (clickable node map) | Skill documents a rendering recipe; building a component is target-project work | If a reference implementation is repeatedly requested → promote to its own feature |
| 3 | Docs-site scaffolding (create the Astro/Starlight site itself) | Out of scope by design (D-scope); init-workspace only records the declaration | If users repeatedly lack a site → consider an `init-workspace` optional step, via product-audit |
