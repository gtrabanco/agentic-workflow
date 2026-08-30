## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then
resolve the **docs adapter** with this checklist — fixed order, first match
wins, evidence required for the match:

1. **Explicit declaration** — the documentation map contains a `Docs site`
   block (format, content dir, build command, map command). Evidence: quote
   the block. → use the declared adapter.
2. **Starlight** — an `astro.config.*` exists AND `@astrojs/starlight` is in
   the project's dependencies. Evidence: config path + the dependency line.
   → Starlight adapter.
3. **Docusaurus** — a `docusaurus.config.*` exists AND `@docusaurus/core` is a
   dependency. Evidence: config path + the dependency line. → Docusaurus
   adapter (same slots as Starlight; `.mdx` under the site's `docs/` dir,
   sidebar per its convention).
4. **Plain-markdown fallback** — a `docs/` directory exists. → plain-markdown
   adapter (always available).
5. **None of the above** → **NOT CONFIGURED**: write nothing. Print the report
   with `Decision: NOT-CONFIGURED`, and include this snippet for the user to
   add to their documentation map:

   ```markdown
   ## Docs site
   - format: starlight | docusaurus | markdown
   - content-dir: <path, e.g. src/content/docs/>
   - build: <command, e.g. npx astro check | none>
   - map: <command emitting a nodes/edges JSON | none>
   ```

Detection is per invocation — never cached, never guessed. A monorepo with
more than one docs site is a documented limitation: use the first declaration
found and say so in the report (see the feature's `known-issues.md`).
