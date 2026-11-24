# Reviewer brief — 719-nan-default-embed

Owner: `skills/unit-lane/references/DESIGN.md` → PLAN.md's refreshed brief.
Restates what the design/plan pass asked and what was chosen, so a reviewer
does not re-derive it.

| Asked | Resolution |
|---|---|
| no open questions were asked — every claim was settled by provenance (the tree) or by the issue's own words (S1–S4) | four cheap-to-change boundaries defaulted and recorded as decisions, D1–D4 in [decisions.md](decisions.md): withhold-or-inject default-on (never an auto-write of the committed `index.json`), logic in the pi package with the companion staying pure data, the preset's 6000×6 tuning carried through the crate's request-budget env var, and a `doc_search` read-only deferred tool wrapping the crate's doc-query envelope |

Reviewer pointers: the ACs and the `ac-hash` in the SPEC frontmatter; the task
set and validators in the SPEC's `## Tasks`; the budgets/tuning claims cite
`packages/agentic-workflow/src/doc/config.mjs` and
`packages/agentic-workflow/src/doc/embeddings.mjs:138-144` — re-check those two
before trusting any precedence claim.
