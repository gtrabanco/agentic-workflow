# 04 — running-economically — Completion checklist (single-pass)

- [x] No schema/migrations — n/a (docs-only repo)
- [x] Core layer imports — n/a (markdown docs and skill bodies, no code layers)
- [x] `docs/workflow/FEATURE_WORKFLOW.md`: new `## Context hygiene & cost`
      section (after Stage 2) — fresh conversation over compaction at unit/phase
      end, hand-offs already fresh, compact only mid-phase for unpersisted
      state, and the compaction cost mechanism stated (re-reads the whole
      transcript at the current session model, fires near the context limit)
- [x] `template/CLAUDE.md`: short fixed-rule pointer added under `## Session log`,
      linking back to FEATURE_WORKFLOW.md's section
- [x] `docs/workflow/ORCHESTRATION.md`: new `## Prompt-cache economics`
      subsection (after "Replacing `/loop`") — byte-stable prefixes, ~5-min
      window grouping, never switch model mid-unit, one-invocation-per-step
      drivers never need compaction
- [x] Cross-family review line added to all four locations: `review-change`
      1.10.2, `execute-phase` 1.14.1 (both patch), `README.md`, `README.es.md`
      — verified by `grep -rniI "prefer a different model" skills/ README.md
      README.es.md` (3 English hits) + manual check of the Spanish equivalent
      in README.es.md (different wording, same content)
- [x] Gate green: `npx skills add . --list` exit 0; markdown link sweep on
      touched files clean; stack-leak grep (`biome|mitata|sonarjs`) clean
      outside existing adapter/equivalence sections
- [x] CHANGELOG.md + CHANGELOG.es.md rows for `execute-phase` 1.14.1 and
      `review-change` 1.10.2; README EN/ES skill/model tables unchanged (no new
      skill, no tier change — only the invariant-line prose was edited)
- [x] No new dependencies
- [x] No skill-driven compaction automation added (explicitly out of scope per
      issue #11 — guidance only)

Decisions not in the SPEC: none — D1 (edit existing homes, no new doc), D2
(FEATURE_WORKFLOW.md primary + template pointer), and D3 (cross-family as
"prefer", not a hard gate) implemented as specified.
