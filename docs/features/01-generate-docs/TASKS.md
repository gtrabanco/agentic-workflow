# 01 — generate-docs — Tasks

## P1 — Core skill

- [x] Create `skills/generate-docs/SKILL.md` with frontmatter
      (`user-invocable: true`, `version: 1.0.0`, trigger-rich description)
      — `skills/generate-docs/SKILL.md`
- [x] `## Turn contract` section (first body section)
- [x] Step 0 adapter-detection checklist (fixed order: declaration → Starlight
      → Docusaurus → plain-markdown fallback; evidence required per match)
- [x] Incrementality checklist + page taxonomy + provenance frontmatter spec
      — Process steps 2–3 (guides taxonomy; `map/` and `reviews/` land in P2)
- [x] Adapter conventions table (Starlight reference + fallback)
- [x] Allowed / Forbidden lists
- [x] Fixed output report block + `→ Next:` example + envelope rule +
      `## Portability` + `Done when`
- [x] Commit planning artifacts (`docs/features/01-generate-docs/`,
      `docs/features/ROADMAP.md`) and the new SKILL.md on `feat/01-generate-docs`
      — commit d503e47 (planning) + P1 commit
- [x] Run the repo verification gate (`npx skills add . --list`) — exit 0,
      `generate-docs` listed
- [x] progress.md entry for P1

## P2 — Integrations

- [ ] Knowledge-map section (command contract, JSON shape, per-tool recipes,
      wrapper-page rules, n/a rule)
- [ ] `--review` export mode section
- [ ] Edit `skills/execute-phase/SKILL.md` close-out hand-off
- [ ] Edit `skills/audit-docs/SKILL.md` orphan/stale checklist item
- [ ] Add `Docs site` block to the template doc map; reference it in
      `skills/init-workspace/SKILL.md` interview
- [ ] Run `bump-skill` (all touched skills; CHANGELOG EN/ES; README tables EN/ES)
- [ ] progress.md entry for P2

## P3 — Hardening

- [ ] Failure-mode branches written into the SKILL.md (not-configured, invalid
      map JSON, missing map command, monorepo limitation)
- [ ] Cross-reference sweep (SKILLS.md, READMEs, CHANGELOGs)
- [ ] Verification gate green (`npx skills add . --list`; links resolve)
- [ ] progress.md entry for P3
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc that leaves
      `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push
