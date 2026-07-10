# 11 — adversarial-multi-reviewer · architecture-notes

Layer impact, surfaces touched. This repo has no application runtime — the
"architecture" is the skills + workflow-docs layer.

## Layer

- **Skills/docs layer only.** No code, no runtime, no schema, no npm package.
- Files touched:
  - `skills/review-change/SKILL.md` — new opt-in `--adversarial N` mode (flag +
    section + portability line). MINOR bump.
  - `skills/ship-roadmap/SKILL.md` — REVIEW-step L/sensitive hard floor. MINOR
    bump.
  - `docs/workflow/REVIEW_AND_CLASSIFY.md` — opt-in mode + cost note.
  - `docs/workflow/MIGRATION.md`, `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`,
    `README.es.md` — release metadata (via `bump-skill`).
  - `docs/features/ROADMAP.md` — feature 11 row (registered at planning).

## Invariants the implementation must hold

- **Default path unchanged.** No-flag `review-change` is byte-for-byte today's
  behavior; `--adversarial N` is additive and gated on the flag (AC8).
- **U2 contract inherited, not modified.** Each reviewer is context-clean +
  diff-only + adversarial; the context-clean turn-contract box in `review-change`
  is not weakened (AC7). The mode multiplies reviewers; it does not relax the
  invariant.
- **Engine untouched — and the ONLY thing fanned out.** The N reviewers each run
  the existing `review-implementation` engine only (the applicable pack runs
  once, over the merged table — D4) — no parallel findings engine, and
  `skills/review-implementation/SKILL.md` is not edited.
- **Merge is orchestration.** `review-change` (the orchestrator) fans out the N
  reviewers and merges by `file:line`+axis into its one decision table — the same
  "orchestrator composes what it synthesizes" pattern it already uses for the
  applicable pack.
- **Two distinct policies.** ship-roadmap's unattended hard floor and the
  interactive advisory recommendation are intentionally separate; neither is
  derived from the other.

## Composition / tier

- `review-change` composes the N reviewers in-turn at equal tier (same rule as
  its existing pack composition). ship-roadmap composes `review-change`
  `--adversarial 2` at equal tier in its REVIEW step (as it already composes
  `review-change`).
- On Claude Code the reviewers are subagents; the subagent override pins the
  model but not the effort (the known ship-roadmap limitation) — documented,
  not a blocker.
