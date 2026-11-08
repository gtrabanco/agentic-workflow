## Portability (agents other than Claude Code)

Preamble + no-slash-menu fallback: owned by `skills/orchestration-envelope/references/PORTABILITY.md` — this section
keeps only its own fallbacks:
- **No per-skill `model:`/`effort:`** — no skill pins a tier; pick tiers yourself:
  the merge gate is the highest-stakes automated verdict — run it on your
  **strongest** model, never on the cheap tier that wrote the code.
- **Receipt consumption is comment-based, not forge-branded.** The
  `review-change:pass` marker lives in PR comments (`gh pr view <N> --json
  comments` on GitHub). On a forge without a native comments list, use its
  closest equivalent (MR notes, review threads); the newest-marker-wins and
  head-SHA comparison semantics are forge-independent.
