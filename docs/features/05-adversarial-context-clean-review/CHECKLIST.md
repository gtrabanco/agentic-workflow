# Completion checklist — 05-adversarial-context-clean-review

- Schema migration applied — n/a, docs-only change.
- Core layer has no outer imports — n/a, no code.
- Orchestration idempotent + typed errors — n/a, no code.
- Adapters implement ports — n/a, no code.
- Tests pass — n/a, no test layer; textual/structural gate below is "green".
- Type-check/lint green — `npx skills add . --list` discovers both edited
  skills; frontmatter parses.
- UI strings localized — n/a, no UI.
- Domain value-object rules respected — n/a, no code.
- User-facing limitations disclosed — n/a, internal workflow-quality change,
  no external product surface.
- New deps pinned — n/a, no dependencies added.

## Acceptance criteria verification

1. `grep -iq "assume the diff is wrong" skills/review-implementation/SKILL.md`
   → PASS.
2. Phase 1 axis table (10 axes) and the entire Phase 2 classification section
   are unchanged in structure — confirmed by diff review: only the Phase 1
   opening sentence changed; the axis table and Phase 2 are untouched.
3. `grep -n "did NOT implement" skills/review-change/SKILL.md` → matches
   inside the `## Turn contract` fence.
4. Cross-family model preference is referenced (not re-authored) in
   `review-change`'s Portability section, which already pointed at the
   preference; `review-change`'s "When to use" points at the same
   turn-contract box rather than restating feature 04's text.
5. `grep -rq "adversarial N\|--adversarial" skills/review-change
   skills/review-implementation` → no match (PASS, nothing introduced).
6. `review-implementation` 1.0.3 → 1.1.0 (minor); `review-change` 1.10.2 →
   1.11.0 (minor). Matching rows added to `CHANGELOG.md` and
   `CHANGELOG.es.md`; README/README.es.md skills tables updated for
   `review-change`'s cell (behavior changed); model/effort tables untouched
   (no tier change).
7. `npx skills add . --list` still discovers every skill, both edited files
   parse.

## Decisions not captured in the SPEC

None — implementation followed the SPEC's Design section verbatim (Edit 1,
Edit 2, no caller edits needed since neither `audit-pr` nor `product-audit`
restate the neutral Phase 1 stance).
