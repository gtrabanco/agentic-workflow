---
name: generate-docs
user-invocable: true
version: 1.0.0
argument-hint: "[NN-slug | fix-n | path/glob] [--review]"
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Generate or update incremental developer documentation in the target
  project's own docs site: diff-driven how-to guides for what a unit of work
  changed, written through a discovered docs adapter (Starlight/Astro MDX is
  the first-class reference; plain markdown is the always-available fallback).
  Never a whole-project pass; never scaffolds a website; never edits source
  code. On Claude Code and want hand-tuned per-skill model/effort tiers?
  Install the `#claude` branch instead
  (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This
  branch is model-agnostic: the skill inherits whatever model and effort your
  agent session is already using.
  Triggers: "generate the docs", "update the docs site", "document this unit",
  "document what changed", "generate-docs".
---

# Generate Docs

Turn the knowledge produced by a unit of work into developer documentation a
contributor can read on the project's docs website — incrementally, as a
by-product of shipping, so a public repo's docs stay current instead of
rotting. A commit says what changed; a guide says how to use it ("how do I
create a domain event and where do I register its handler").

## Turn contract — verify before ending the turn

```
✓ The docs adapter was resolved through the Step 0 detection checklist and the
  outcome (adapter name, or NOT CONFIGURED) is stated in the report
✓ Every generated/updated page is WRITTEN to disk (paths listed in the report)
  and carries the provenance frontmatter — or zero pages were written and the
  report says exactly why
✓ The verify step was RUN (docs build command or link check) and its result
  pasted — never assumed
✓ Artifact language: explicit user instruction > the project's declared docs
  language > English. The CONVERSATION language never decides
✓ The fixed report block is printed, then the closing `→ Next:` block, as the
  ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- **After finishing a unit of work** — `execute-phase` recommends this skill at
  close-out when the project declares a docs site: document what the unit
  changed while the context is fresh.
- **On demand** for a specific area: `generate-docs src/domain/events/`.
- **`--review`** — export the latest `review-change` report as a docs page so
  humans can review findings from the website.
- Not for writing SPECs/planning docs (`plan-feature`), session journals
  (`log-session`), or reviewing code (`review-change` produces the findings;
  this skill only publishes an existing report on request).

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
   with `Decision: NOT-CONFIGURED`, include this snippet for the user to add
   to their documentation map, and emit the envelope with
   `state: NEEDS_INPUT`:

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

7. **Report** (fixed block), then the closing `→ Next:` block, then the
   envelope. This skill does **not** commit — the pages ride the unit's
   workflow (the executor or the user commits them with the unit's close-out;
   an orchestrator sees the paths in the envelope).

## Adapters (reference implementations)

The generic contract is the six slots below; anything stack-specific lives
only in this table. Starlight is the first-class reference.

| Slot | Starlight (reference) | Plain markdown (fallback) |
|---|---|---|
| Content dir | `src/content/docs/` (or the declared one) | `docs/site/` |
| Page format | `.mdx`; frontmatter `title`, `description` + provenance keys | `.md`; H1 title + provenance keys in an HTML comment frontmatter block |
| Guides | `<content>/guides/<area>/<topic>.mdx` | `docs/site/guides/<area>/<topic>.md` |
| Knowledge map | `<content>/map/graph.json` + `<content>/map/<module>.mdx` wrappers | `docs/site/map/graph.json` + `docs/site/map/<module>.md` |
| Review reports | `<content>/reviews/<unit>-<date>.mdx` | `docs/site/reviews/<unit>-<date>.md` |
| Sidebar | Starlight autogenerated sidebar (directory-based); no manual sidebar edits | n/a — directory listing |
| Verify | declared build command (`npx astro check` / `astro build`) | intra-docs link check |
| Assets | none generated | none generated |

## Allowed & forbidden (fixed lists — no interpretation)

**Allowed:**
- Writing/updating pages under the adapter's guides location
- Running the declared docs build/verify command
- Reading anything (diff, code, docs)

**Forbidden — never, even if it "would help":**
- Whole-project doc regeneration (the incrementality checklist is the only
  page selector)
- Editing source code, tests, or config
- Scaffolding a docs site (installing Astro/Starlight, creating configs)
- Writing outside the adapter's content locations
- Pages without the provenance frontmatter
- Committing or pushing (the unit's workflow owns the commit)

## Return exactly

```
GENERATE DOCS — adapter: <starlight|docusaurus|markdown|NOT CONFIGURED> — scope: <scope>

| Page | Action | Source-unit | Subject paths |
|---|---|---|---|
| <content-path> | created|updated | <NN-slug> | <paths> |

Map: regenerated (<command>) | n/a — no map command declared | invalid output — <reason>
Review export: <page path> | not requested | no report available
Verify: <command + exit code | links checked: <n>, broken: 0 | n/a — not configured>
Pages: <n> written, <n> skipped by incrementality checklist
Decision: PASS | FAIL | NOT-CONFIGURED
```

`FAIL` only when the verify step is red or a written page had to be reverted;
`NOT-CONFIGURED` per Step 0.5; `PASS` otherwise (including 0 pages).

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` and follow it literally in a fresh conversation.
- **No per-skill `model:`/`effort:`** — writing guides is structured
  summarization over a diff: a **mid-tier** model suffices; never below the
  tier that can read the project's language accurately.
- **No argument passing** — state the scope in the invocation message
  ("generate docs for 01-generate-docs"); the Process step 1 order still
  applies.

## Relationship to other skills

- **`execute-phase`** recommends this skill at unit close-out when the
  documentation map declares a docs site (hand-off via `→ Next:` — never
  composed in-turn).
- **`audit-docs`** detects orphan/stale generated pages via the provenance
  frontmatter.
- **`init-workspace`** records the `Docs site` declaration this skill's Step 0
  reads.
- Not a review: findings/quality belong to `review-change`.

## Done when

- The adapter outcome is stated with evidence; every selected page is written
  with provenance frontmatter; the verify step ran and is green (or the
  NOT-CONFIGURED report was printed and nothing was written).
- The fixed report block was returned, then:

  ```
  → Next: commit these pages with the unit's close-out (they ride the unit's PR)
    · unit already closed → commit as docs(<unit>): generated guides on the unit's branch
    · adapter NOT CONFIGURED → add the Docs site block to the documentation map, then re-run /generate-docs
  ```
