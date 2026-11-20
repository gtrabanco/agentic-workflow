## Portability (agents other than Claude Code)

Preamble + no-slash-menu fallback: owned by `skills/orchestration-envelope/references/PORTABILITY.md` — this section
keeps only its own fallbacks:
- **No per-skill `model:`/`effort:`** — no skill pins a tier; pick tiers yourself:
  the merge gate is the highest-stakes automated verdict, so run it on your
  **strongest** model. The review-authority rule behind that choice — never
  weaker than the author, with the stated inline degrade as its only escape — is
  [`ORCHESTRATE.md`](../../unit-lane/references/ORCHESTRATE.md)'s.
- **Receipt consumption is comment-based, not forge-branded.** The
  `review-change:pass` marker lives in PR comments, read through the guarded
  read (`runner forge-read pr <N> --comments`). On a forge without a native
  comments list, use its closest equivalent (MR notes, review threads); the
  newest-marker-wins and head-SHA comparison semantics are forge-independent.
