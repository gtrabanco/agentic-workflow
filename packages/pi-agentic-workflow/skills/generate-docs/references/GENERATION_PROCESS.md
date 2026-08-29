## Process

1. **Resolve the scope** — exactly one of, in this order:
   - an explicit argument (`NN-slug`, `fix-n`, or a path/glob) → that unit's
     branch diff vs the default branch, or the given paths;
   - no argument → the current branch's diff vs the default branch;
   - on the default branch with a clean tree → the last merged unit's diff
     (`git log --merges -1` → its diff). State the resolved scope in the
     report.

2. **Select pages with the incrementality checklist.** A guide page is
   (re)written only if at least one holds — otherwise it is not touched:
   - ✓ the diff changes files under the page's subject paths (page exists →
     update it);
   - ✓ the diff introduces a public entry point (exported API, event, command,
     route, port) that no existing guide covers (→ create the page).

   **Whole-tree regeneration is Forbidden** — an empty selection is a valid,
   reportable outcome (`0 pages`, `Decision: PASS`).

3. **Write the pages** into the adapter's guides location (see the adapter
   table). Fixed page shape, identical on every agent:
   - **Title** — task-oriented ("Create a domain event"), not file-oriented.
   - **Frontmatter** — the adapter's required keys **plus the provenance
     keys** (mandatory, exactly these names):

     ```yaml
     generated-by: agentic-workflow/generate-docs
     source-unit: <NN-slug | fix-n>
     updated: <ISO date>
     ```

   - **Body sections, in order**: *What this is* (1 paragraph) · *How to do
     it* (numbered steps citing real paths — `src/...`, clickable) · *Where
     the pieces live* (table: role → path) · *Related* (links to sibling
     guide pages that share subject paths).
   - **File name**: kebab-case derived from the subject module path
     (`src/domain/events/` → `guides/domain/events.mdx`) — never a
     model-invented name.
   - Facts come from the diff and the code — a claim that cannot cite a path
     does not go in the page.

4. **Knowledge map** (only when the documentation map declares a `map`
   command). The map is the navigable call/module graph that lets a reader
   trace an error doc-to-doc to its origin. Rules — no interpretation:
   - **Run the declared command** (a project script wrapping deterministic
     tooling — dependency-cruiser, madge, TypeDoc, tree-sitter, an LSP dump…).
     The model **never infers graph nodes or edges** — zero-token structural
     truth, or no map at all.
   - **Validate the output**: JSON with `nodes[]` (each
     `{"id", "path"}` minimum) and `edges[]` (each `{"from", "to"}`), any
     extra keys allowed. Invalid → write nothing, report
     `Map: invalid output — <first mismatch>` and count it as a FAIL.
   - Valid → write it to the adapter's map location as `graph.json`, then
     write/refresh one wrapper page per top-level module **the scope
     touched** (incrementality applies to wrapper pages, not to the JSON):
     the page lists the module's nodes with source paths, direct callers,
     direct callees, and links to guide pages sharing subject paths — the
     stack-trace walk. Wrapper pages carry the provenance frontmatter.
   - No `map` command declared → `Map: n/a — no map command declared` in the
     report. Never substitute model inference.

   Per-tool recipes (the mapping each tool needs to emit the shape above):
   `dependency-cruiser --output-type json` → modules⇒nodes, dependencies⇒edges;
   `madge --json` → adjacency object⇒edges; TypeDoc JSON → reflections⇒nodes,
   references⇒edges; tree-sitter/LSP call hierarchy → definitions⇒nodes,
   calls⇒edges. The project's script owns the mapping; these recipes are
   documentation for writing that script, not something this skill executes ad
   hoc.

5. **Review export** (only with the explicit `--review` flag — never
   automatic; findings may predate their fixes and a public site is a
   publishing decision). Take the most recent `review-change` report available
   in the invoking context (or the path the user names), convert its
   fixed-format blocks verbatim into one page at the adapter's reviews
   location (`reviews/<unit>-<ISO-date>.mdx` or `.md`), provenance frontmatter
   included, findings tables intact — no summarizing, no re-judging (that is
   `review-change`'s output, frozen). No report available → state it in the
   report block and write nothing.

6. **Verify.** Run the declared docs build command (e.g. `npx astro check`)
   when the adapter declares one; otherwise check that every intra-docs link
   in the written pages resolves. Paste the command + exit code (or the link
   count) in the report. A red build → fix the written pages or revert them;
   never leave the docs site broken.

7. **Report** (fixed block), then the closing `→ Next:` block as the
   ABSOLUTE last output. This skill does **not** commit — the pages ride the
   unit's workflow (the executor or the user commits them with the unit's
   close-out).
