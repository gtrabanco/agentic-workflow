# 11 — adversarial-multi-reviewer · TASKS

Per-phase checklists the executor ticks off. Command-checkable criteria are
emitted as the command to run — verify by running it, not by judging prose. All
commands assume repo root.

## P1 — `review-change --adversarial N` mode

- [x] Add `--adversarial N` to the `argument-hint:` line in
      `skills/review-change/SKILL.md` frontmatter.
- [x] Add the "Adversarial multi-reviewer mode (`--adversarial N`, opt-in)"
      section covering: N≥2 semantics (N absent → single reviewer; N<2 → usage
      error + single-reviewer fallback); the three-tier platform-adaptive spawn
      (subagents / headless / sequential fresh conversations); each reviewer
      context-clean + diff-only + adversarial reusing `review-implementation`;
      merge/dedupe by `file:line`+axis with a `Reviewers n/N` column; inclusion
      threshold ≥1 (no quorum); default OFF; auto-recommend (never force) for
      L/sensitive.
- [x] Add the Portability fallback line for the three spawn tiers.
- [x] Do NOT weaken the context-clean turn-contract box; do NOT hand-edit
      `version:` (bump deferred to P3/`bump-skill`, still MINOR-eligible).
- [x] Verify (all exit 0):
      ```sh
      grep -q -- "--adversarial" skills/review-change/SKILL.md
      grep -qi "subagent" skills/review-change/SKILL.md
      grep -qi "headless" skills/review-change/SKILL.md
      grep -qi "sequential\|fresh conversation" skills/review-change/SKILL.md
      grep -qi "dedup\|deduped\|deduplicat" skills/review-change/SKILL.md
      grep -qi "file:line" skills/review-change/SKILL.md
      grep -qi "default off\|off by default\|opt-in" skills/review-change/SKILL.md
      grep -qi "sensitive" skills/review-change/SKILL.md
      grep -qi "did NOT implement the change\|did not write the diff" skills/review-change/SKILL.md
      ```
      All 9 commands ran green.
- [x] read-verified: Process step 1 now reads "No `--adversarial N` flag → run
      `review-implementation` once … unchanged from before this mode existed" —
      the default (no-flag) path is provably additive-gated (AC8).
- [x] Commit the planning artifacts + this phase:
      `feat(skills): add review-change --adversarial N multi-reviewer mode`.

## P2 — ship-roadmap floor + workflow doc

- [x] In `skills/ship-roadmap/SKILL.md` REVIEW step: enable `--adversarial 2` as
      a hard floor for L/sensitive features; add the "deliberately does not mirror
      the interactive advisory checkpoint — do not align" note.
- [x] In `docs/workflow/REVIEW_AND_CLASSIFY.md`: add the "Adversarial
      multi-reviewer (opt-in)" subsection (three spawn tiers, ≥1 inclusion rule,
      2–3× cost note → why opt-in).
- [x] Do NOT hand-edit `version:`.
- [x] Verify (all exit 0):
      ```sh
      grep -qi -- "--adversarial" skills/ship-roadmap/SKILL.md
      grep -qi "floor" skills/ship-roadmap/SKILL.md
      grep -qi "adversarial" docs/workflow/REVIEW_AND_CLASSIFY.md
      ```
      All 3 commands ran green.
- [x] read-verified: the do-not-align rationale ("deliberately does **not
      mirror** … must never be 'aligned' into one") is present in ship-roadmap's
      REVIEW step.
- [x] Commit `docs(ship-roadmap,workflow): adversarial multi-reviewer floor + review-stage doc`.

## P3 — Release metadata

- [x] Run `bump-skill` for `review-change` + `ship-roadmap`: MINOR bump each,
      rows in `CHANGELOG.md` + `CHANGELOG.es.md`, both README skill/model tables
      refreshed. (No model/effort tier changes → `model-routing.yml` untouched.)
- [x] Add the `docs/workflow/MIGRATION.md` entry for feature 11 (additive
      `--adversarial N`; default OFF; ship-roadmap L/sensitive floor).
- [x] Verify:
      ```sh
      grep -c "adversarial\|multi-reviewer\|11-adversarial" CHANGELOG.md   # >= 1 → got 10
      grep -qi "adversarial" docs/workflow/MIGRATION.md                    # exit 0
      ```
- [x] read-verified: `review-change` 2.0.0 → 2.1.0, `ship-roadmap` 2.0.0 →
      2.1.0 — mirrored in `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`
      (skills table cell), `README.es.md` (skills table cell). No tier change,
      so `model-routing.yml` and the model tables are untouched (correct — no
      capability requires a different model/effort).
- [x] Commit `chore(release): minor bump — review-change --adversarial N`.

## P4 — Hardening + PR

- [ ] Dangling-ref sweep — no doc points at a review-change behavior that doesn't
      exist; default-path description still coherent:
      ```sh
      grep -rin "adversarial" skills/ docs/workflow/ | grep -vi "context-clean"
      ```
      (read the hits; every one must be a real, current behavior.)
- [ ] Confirm untouched (expect NO output):
      ```sh
      git diff --name-only origin/main...HEAD | grep -E '^(packages/|skills/review-implementation/)'
      ```
- [ ] Discovery intact:
      ```sh
      npx skills add . --list
      ```
      all skills listed, exit 0.
- [ ] Re-read the merge/dedupe + ship-roadmap floor sections for internal
      coherence (dev scenarios `adversarial:dedup`, `adversarial:sub-2`,
      `adversarial:floor`).
- [ ] Re-run every P1/P2/P3 verify command; all green.
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown
      file, real backticks, never inline `--body`/heredoc that leaves
      `\`-escaped backticks; body includes `Closes #18`) and PRINT THE PR URL in
      the chat.
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`.
- [ ] commit `docs: link PR #<n>` and push.
