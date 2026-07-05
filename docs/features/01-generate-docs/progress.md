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

## 2026-07-05 — P2 — Integrations

- generate-docs: added Process step 4 (knowledge map — declared deterministic
  command only, `nodes[]/edges[]` validation, per-tool recipes, wrapper pages)
  and step 5 (`--review` export, opt-in, verbatim conversion); adapter table
  gained Map/Reviews rows; report gained `Map:`/`Review export:` lines.
- execute-phase 1.13.0: close-out hand-off gains the `/generate-docs` line,
  printed only when the doc map declares a `Docs site` block.
- audit-docs 1.7.0: new check 13 (orphan/stale generated pages via provenance
  frontmatter); workflow-discipline block renumbered 10–14.
- init-workspace 1.7.0: interview gains the Docs site round; template
  CLAUDE.md gains the commented `Docs site` block + doc-map row.
- Bookkeeping: CHANGELOG EN/ES (4 skill tables + release-log entry), README
  EN/ES (counts 27→28, Document/Documentación section, model-table row),
  docs/workflow/SKILLS.md Document section.
- Gate: `npx skills add . --list` exit 0.
- Noted pre-existing drift (NOT this unit's scope): docs/workflow/SKILLS.md
  intro still says "12 user-facing + 4 internal" and lacks workflow-status —
  see known-issues.md.
