# 13 — init-workspace-upgrade-mode · testing

This repo has **no application build** — "green" is doc coherence + the
command-checkable acceptance criteria, not a test suite. Prefer running the
`grep`s; only genuinely judgement-only checks are `read-verified`.

## Layer: command-checkable (run from repo root)

| Check | Command | Phase |
|---|---|---|
| Upgrade mode exists | `grep -qi "upgrade mode" skills/init-workspace/SKILL.md` | P1 |
| Reads MIGRATION.md | `grep -qi "MIGRATION.md" skills/init-workspace/SKILL.md` | P1 |
| Diffs current template | `grep -qiE "diff\|current template" skills/init-workspace/SKILL.md` | P1 |
| Never-clobber invariant | `grep -qiE "never (clobber\|overwrite)\|additive" skills/init-workspace/SKILL.md` | P1 |
| Roadmap row 13 present | `grep -q "init-workspace-upgrade-mode" docs/features/ROADMAP.md` | P1 |
| Recommendation in README EN | `grep -q "init-workspace" README.md` | P2 |
| Recommendation in README ES | `grep -q "init-workspace" README.es.md` | P2 |
| Version bumped > 2.0.0 | `grep -qE "^version: 2\.[1-9]" skills/init-workspace/SKILL.md` | P2 |
| CHANGELOG row (EN) | `grep -q "init-workspace" CHANGELOG.md` | P2 |
| CHANGELOG row (ES) | `grep -q "init-workspace" CHANGELOG.es.md` | P2 |

## Layer: read-verified (judgement-only)

- The upgrade-mode section states all four contract parts **in order**: diff vs.
  current template · read `MIGRATION.md` · propose **only** missing blocks
  (short, discovery-defaulted interview) · **never clobber** existing decisions.
- The bilingual recommendation names the **ordered** path: update skills → read
  `MIGRATION.md` → `init-workspace` (upgrade) → optional `product-audit`, in
  `README.md`, `README.es.md`, and `docs/workflow/MIGRATION.md`.
- The four failure edges (`no-drift`, `no-migration`, `tailored-block`,
  `bootstrap-unchanged`) are each stated explicitly (see SPEC Dev scenarios).
- `bump-skill` output: README skill tables carry the new `init-workspace` version
  in both languages.

## Layer: coherence

- `audit-docs` after the change: roadmap ↔ folder ↔ doc-map links resolve; no
  stack/real-project reference leaked into the skill or shared docs; naming
  conventions held.

## Informal manual read (not a committed fixture)

Walk the new mode against a toy target dir that has a scaffold **missing the
`Docs site` block**: confirm it proposes only that block, defaults from
discovery (e.g. Starlight detected), and touches nothing else.
