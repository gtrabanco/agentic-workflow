# 119-progressive-planning-docs-adapters · testing

## P1 — 2026-08-02

- `node scripts/check-skill-context.mjs --skill plan-feature` → exit 0.
- `git diff --check` → exit 0 before commit.
- Behavioral probe remains for P3: a fresh-context issue-derived route must load
  `PLANNING_GATES.md` before invoking `plan-feature-from-issue`.
