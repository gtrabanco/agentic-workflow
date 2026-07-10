# 11 — adversarial-multi-reviewer · progress

Running log, one entry per phase. Planning writes the header; `execute-phase`
appends as each phase completes.

## Planning (2026-07-10)

- Planned from issue [#18](https://github.com/gtrabanco/agentic-workflow/issues/18)
  (U8) via `plan-feature` → `plan-feature-from-issue` → `plan-feature-scaffold`.
- Size `M`, four phases (P4 = hardening). Dependency: feature 05 (U2), `done` +
  merged (#23) — satisfied. No open questions.
- Artifacts written; roadmap registered as `11` with status `planned`.

## P1 — review-change --adversarial N mode

- Added `--adversarial N` to `argument-hint:` and a full "Adversarial
  multi-reviewer mode" section: N≥2 semantics, three-tier platform-adaptive
  spawn (subagents / headless / sequential fresh conversations), merge/dedupe
  by `file:line`+axis with a `Reviewers n/N` column, inclusion threshold ≥1,
  default OFF, auto-recommend (never force) for L/sensitive. Added the
  Portability fallback line for the three spawn tiers. Process step 1 gates
  the findings-gathering stage on the flag; steps 2–10 unchanged.
- `version:` left at `2.0.0` — the MINOR bump is `bump-skill`'s job in P3, not
  hand-edited here.
- All 9 AC1–AC4 + AC7 grep commands ran green (pasted in `TASKS.md`). AC8
  read-verified against the new step 1 wording.

## P2 — ship-roadmap floor + workflow doc

- `ship-roadmap`'s REVIEW step now runs `review-change --adversarial 2` as a
  hard floor for L/sensitive features (checkpoint and end review alike), with
  an explicit do-not-align note distinguishing it from the interactive
  advisory. XS/S/non-sensitive-M stay single-reviewer.
- `REVIEW_AND_CLASSIFY.md` gained an "Adversarial multi-reviewer (opt-in)"
  subsection: three spawn tiers, default OFF + auto-recommend, ≥1 inclusion,
  the 2–3× cost note, and the ship-roadmap floor.
- `version:` left untouched on both skills (bump-skill's job, P3).
- All 3 AC5/AC6 grep commands ran green.

## P3 — Release metadata

- `review-change` and `ship-roadmap` both MINOR-bumped 2.0.0 → 2.1.0 (new
  backward-compatible capability, default off / hard floor respectively).
- Rows added to `CHANGELOG.md` + `CHANGELOG.es.md` (per-skill tables and the
  chronological release log); `README.md` + `README.es.md` skills-table cells
  refreshed for `review-change` to mention `--adversarial N`. No model/effort
  tier changed, so `model-routing.yml` and the model tables are untouched.
- `docs/workflow/MIGRATION.md` gained a non-breaking, additive-only entry.
- Both P3 grep checks ran green (`CHANGELOG.md` hit count 10; `MIGRATION.md`
  adversarial hit found).

## P4 — Hardening + PR

- Dangling-ref sweep: 16 hits, all real/current behaviors (no stale refs).
- Confirmed `packages/` and `skills/review-implementation/` untouched vs
  `origin/main`.
- `npx skills add . --list` — all skills discovered, exit 0.
- Coherence re-read caught and fixed a "steps 2–9" vs "steps 2–10" mismatch in
  the merge/dedupe section of `review-change` (Process has 10 steps).
- Full P1–P3 AC re-run: all green.
