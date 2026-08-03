---
name: generate-docs
user-invocable: true
version: 2.0.1
argument-hint: "[NN-slug | fix-n | path/glob] [--review]"
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Generate incremental, diff-driven developer guides through the project's
  detected docs adapter. Never regenerate the whole site, scaffold it, or edit
  source. Triggers: "generate-docs", "generate the docs", "document this unit".
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

## Progressive loading — resolve the docs route

The reference allowlist is exactly the three paths below. Read them in this
order; every selected resource is normative and one hop from this entrypoint.

1. Every invocation: read [adapter discovery](references/ADAPTER_DISCOVERY.md)
   and resolve the adapter with evidence. `NOT CONFIGURED` stops writing.
2. Configured adapter only: before choosing any output path or format, read
   [adapter slots](references/ADAPTERS.md).
3. Read [generation process](references/GENERATION_PROCESS.md) and execute the
   scope, incrementality, map/review, verify, and report steps.

Do not load steps 2–3 after `NOT CONFIGURED`. Missing required resource → stop;
never guess an adapter, output path, or fixed contract.

## Allowed & forbidden (fixed lists — no interpretation)

**Allowed:**
- Writing/updating pages under the adapter's guides location
- Updating only the adapter's declared manual sidebar config when the adapter
  table requires it
- Running the declared docs build/verify command
- Reading anything (diff, code, docs)

**Forbidden — never, even if it "would help":**
- Whole-project doc regeneration (the incrementality checklist is the only
  page selector)
- Editing source code, tests, or any config other than the adapter's declared
  manual sidebar config
- Scaffolding a docs site (installing Astro/Starlight, creating configs)
- Writing outside the adapter's content locations, except that declared manual
  sidebar config
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
