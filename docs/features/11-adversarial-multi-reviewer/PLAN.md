# 11 — adversarial-multi-reviewer · PLAN

Phased implementation plan. Phases are labelled `P1, P2, …` (the executor's
argument, e.g. `execute-phase 11 P2`). Planning is done; `P1` is the first
implementation phase (it also commits the planning artifacts). The last phase is
hardening. Opening the PR is the final *step* of P4, not a phase of its own.

## P1 — `review-change --adversarial N` mode

One concern: the `review-change` contract. Add the opt-in mode without touching
the default (no-flag) path beyond gating the findings-gathering step on the flag.

- Add `--adversarial N` to the `argument-hint` frontmatter.
- Add a "Adversarial multi-reviewer mode (`--adversarial N`, opt-in)" section:
  - N is an integer **≥ 2**; absent → default single reviewer (unchanged); `< 2`
    → usage error, fall back to single reviewer (never silently run 1).
  - **Three-tier platform-adaptive spawn:** Claude Code → N parallel subagents
    (prefer different model families); other agent with headless invocation → N
    parallel headless invocations; neither → N sequential fresh conversations
    (inline fallback, documented).
  - Each reviewer is **context-clean, diff-only, adversarial** (reuses the
    existing `review-implementation` engine **only** — no new engine; the
    applicable pack runs once, over the merged table — see D4).
  - **Merge + dedupe by `file:line`+axis** into the one decision table; annotate
    each row with the reviewer count (`Reviewers n/N`); **inclusion threshold
    ≥1** (no quorum). Then the unchanged classification/synthesis/report runs
    once over the merged set.
  - **Default OFF; auto-recommend (never force)** for `L`/sensitive changes.
- Add the Portability fallback line for the three spawn tiers.
- Do **not** weaken U2's context-clean turn-contract box (AC7).
- Do **not** hand-edit `version:` here (P3 does it via bump-skill).
- Commit the planning artifacts (`docs/features/11-*/`) as part of this phase.
- Gate: AC1, AC2, AC3, AC4, AC7, AC8.

## P2 — ship-roadmap floor + workflow doc

One concern: the autopilot policy and its workflow doc.

- In `skills/ship-roadmap/SKILL.md` REVIEW step: for **L or sensitive-flagged**
  features, the composed `review-change` runs **`--adversarial 2`** as a **hard
  floor** (unattended → risk-proportional floor replaces the human's skip
  judgment). Record inline that this floor **deliberately does not mirror** the
  interactive advisory checkpoint — do not "align" the two.
- In `docs/workflow/REVIEW_AND_CLASSIFY.md`: add an "Adversarial multi-reviewer
  (opt-in)" subsection — what it is, the three spawn tiers, the ≥1 inclusion rule,
  and the **cost note** (2–3× the most expensive stage → why opt-in).
- Do **not** hand-edit `version:` here.
- Gate: AC5, AC6.

## P3 — Release metadata

One concern: version/release docs.

- Run `bump-skill` for `review-change` + `ship-roadmap`: **MINOR** bump each
  (new backward-compatible capability), add rows to `CHANGELOG.md` +
  `CHANGELOG.es.md`, refresh both README skill/model tables.
- Add the `docs/workflow/MIGRATION.md` entry (additive `--adversarial N`
  capability; default OFF; ship-roadmap floor for L/sensitive).
- Gate: AC9.

## P4 — Hardening + PR

Edge cases + dev-scenario failure modes, then close out.

- **Dangling-ref sweep:** no doc points at a `review-change` behavior that
  doesn't exist; the default-path (no-flag) description still reads coherently.
- Confirm `review-implementation`, the schema package, and the npm package are
  **untouched** (this feature edits only `review-change`, `ship-roadmap`, and the
  two docs + release metadata).
- Confirm `npx skills add . --list` lists all skills (AC10).
- Re-read the merge/dedupe + floor sections end-to-end for internal coherence
  (dev scenarios `adversarial:dedup`, `adversarial:sub-2`, `adversarial:floor`).
- Re-run every AC command; all pass.
- Open the PR (`gh pr create --body-file …`, body includes `Closes #18`), PRINT
  THE PR URL, update the roadmap row to `done · [#<pr>]`, commit `docs: link PR`.
- Gate: full AC re-run green.
