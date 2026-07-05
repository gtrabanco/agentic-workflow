# 01 — generate-docs — Tasks

## P1 — Core skill

- [ ] Create `skills/generate-docs/SKILL.md` with frontmatter
      (`user-invocable: true`, `version: 1.0.0`, trigger-rich description)
- [ ] `## Turn contract` section (first body section)
- [ ] Step 0 adapter-detection checklist (fixed order: declaration → Starlight
      → Docusaurus → plain-markdown fallback; evidence required per match)
- [ ] Incrementality checklist + page taxonomy + provenance frontmatter spec
- [ ] Adapter conventions table (Starlight reference + fallback)
- [ ] Allowed / Forbidden lists
- [ ] Fixed output report block + `→ Next:` example + envelope rule +
      `## Portability` + `Done when`
- [ ] Commit planning artifacts (`docs/features/01-generate-docs/`,
      `docs/features/ROADMAP.md`) and the new SKILL.md on `feat/01-generate-docs`
- [ ] Run the repo verification gate (`npx skills add . --list`)
- [ ] progress.md entry for P1

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
