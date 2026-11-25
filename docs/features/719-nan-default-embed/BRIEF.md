# Reviewer brief — 719-nan-default-embed

Owner: `skills/unit-lane/references/DESIGN.md` → PLAN.md's refreshed brief.
Restates what the design/plan pass asked and what was chosen, so a reviewer
does not re-derive it.

| Asked | Resolution |
|---|---|
| no open questions were asked — every claim was settled by provenance (the tree) or by the issue's own words (S1–S4) | four cheap-to-change boundaries defaulted and recorded as decisions, D1–D4 in [decisions.md](decisions.md): withhold-or-inject default-on (never an auto-write of the committed `index.json`), logic in the pi package with the companion staying pure data, the preset's 6000×6 tuning carried through the crate's request-budget env var, and a `doc_search` read-only deferred tool wrapping the crate's doc-query envelope |
| 2026-11-25 replan: no questions — all seven findings were reviewer-confirmed before the replan ran (SPEC `## Log` R1/V1–V7), so nothing was asked twice | the review's confirmed findings cut decisions D5–D7 ([decisions.md](decisions.md)): the default-on trigger moves to the profile donor (pi-nan applies its own entry right after `register()`, order-proof against pi's unguaranteed load order — D5), the applied default reports its operator-facing `detail` line so the surface stops being dead (D6), and the resolver's own injected trio is value-matched and withdrawn on any withhold so a later operator block wins within the session (D7). Phase mapping: F2→P6, F3→P7, F1→P8, F5→P9, F4→P10, F7→P11, verification P12, settle re-check P13. |

Reviewer pointers: the ACs and the `ac-hash` in the SPEC frontmatter; the task
set and validators in the SPEC's `## Tasks`; the budgets/tuning claims cite
`packages/agentic-workflow/src/doc/config.mjs` and
`packages/agentic-workflow/src/doc/embeddings.mjs:138-144` — re-check those two
before trusting any precedence claim. For the fold batch, re-check finding F1's
root cause first (pi `dist/core/package-manager.js` rank-4 stable sort — no
inter-package load-order contract): every downstream seam decision rests on it.
