# 119-progressive-planning-docs-adapters · testing

## P1 — 2026-08-02

- `node scripts/check-skill-context.mjs --skill plan-feature` → exit 0.
- `git diff --check` → exit 0 before commit.
- Behavioral probe remains for P3: a fresh-context issue-derived route must load
  `PLANNING_GATES.md` before invoking `plan-feature-from-issue`.

## P2 — 2026-08-02

- `node scripts/check-skill-context.mjs --skill generate-docs` → exit 0.
- `grep -q "Docusaurus" skills/generate-docs/references/ADAPTERS.md` → exit 0.
- `git diff --check` → exit 0 before commit.

## P3 — 2026-08-02

- `node scripts/check-skill-context.mjs` → exit 0.
- `node scripts/check-skill-context.test.mjs` → exit 0.
- `npx skills add . --list` → exit 0; discovered 30 installable skills.
- `git diff --check` → exit 0.
- `git status --porcelain -- docs/` → empty before the P3 close-out edits.
