# 01 — generate-docs — Decisions

| # | Decision | Chosen | Rationale |
|---|---|---|---|
| D1 | Provenance frontmatter | `generated-by: agentic-workflow/generate-docs`, `source-unit`, `updated` (ISO date) | Minimal set audit-docs can match deterministically |
| D2 | Review export | Opt-in flag `--review`, never automatic | Pre-fix findings on a public site is a publishing decision, not a default |
| D3 | Adapter declaration location | Target project's agent-guide documentation map (`Docs site` block) | Single source every skill already reads in Step 0 |
| D4 | Graph source | Project-declared deterministic command only; model never infers edges | Token cost and hallucinated edges; structural truth must be tool-derived |
| D5 | Composition | Hand-off from `execute-phase` via `→ Next:`, never in-turn composition | Tier-boundary rule in CLAUDE.md (executor runs cheaper than doc synthesis may need) |
| D6 | Page naming | Derived kebab-case from source module path; fixed taxonomy `guides/ map/ reviews/` | Closed output contract — every agent (opencode, codex, hermes, Claude) yields the same tree |

## Open questions

- Q1 (→ known-issues #1): monorepo multi-site declaration syntax. DEFERRED.
- Q2: should `generate-docs` gate a phase as "not done" hard, or stay a
  recommended close-out step? **Resolved for v1**: recommended close-out task in
  `execute-phase`'s `→ Next:` + audit-docs drift detection; a hard gate would
  block projects without a docs site. Revisit via product-audit if drift is
  observed twice.
