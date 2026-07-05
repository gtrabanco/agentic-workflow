# 01 — generate-docs — Testing

This repo ships markdown skills; the gate is documentation-level (see
`CLAUDE.md` → Verification).

| Check | Layer | How |
|---|---|---|
| Skill discovered | integration | `npx skills add . --list` includes `generate-docs` |
| Markdown well-formed, cross-refs resolve | docs | link sweep over SKILL.md, READMEs, SKILLS.md, CHANGELOGs |
| No stack leak into shared docs | docs | adapter names appear only inside the skill's marked adapter section |
| Adapter detection — Starlight | dry-run | fixture layout (`astro.config.mjs` + `@astrojs/starlight` in deps) walked through the Step 0 checklist → Starlight outcome |
| Adapter detection — fallback | dry-run | fixture with only `docs/` → plain-markdown outcome |
| Not configured | dry-run | empty fixture → NEEDS_INPUT report + envelope, declaration snippet printed |
| Invalid map JSON | dry-run | declared command emitting `{}` → FAIL report citing missing `nodes[]/edges[]` |
| Envelope contract | docs | last output of the skill's examples is exactly one fenced json block matching `packages/agentic-workflow-schema` |

Dry-runs are executed manually (any agent) following the SKILL.md literally;
their transcripts are pasted into `progress.md` for the hardening phase.
