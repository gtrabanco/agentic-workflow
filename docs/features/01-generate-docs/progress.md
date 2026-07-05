# 01 — generate-docs — Progress

One entry per phase, appended by `execute-phase`.

## 2026-07-05 — P1 — Core skill

- Wrote `skills/generate-docs/SKILL.md` v1.0.0: turn contract, Step 0 adapter
  detection (declaration → Starlight → Docusaurus → markdown fallback →
  NOT-CONFIGURED/NEEDS_INPUT), scope resolution, incrementality checklist,
  fixed page shape + provenance frontmatter, adapter table, Allowed/Forbidden,
  fixed report block, envelope mapping, Portability.
- Scope note: P1 ships the `guides/` taxonomy only; `map/` and `reviews/`
  sections land in P2 per PLAN.md.
- Gate: `npx skills add . --list` exit 0, `generate-docs` discovered.
- Left open for P2: knowledge-map contract, `--review` export, execute-phase /
  audit-docs / init-workspace / template integration, bump-skill run.
