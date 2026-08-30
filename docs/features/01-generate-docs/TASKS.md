# 01 — generate-docs — Tasks

## P1 — Core skill

- [x] Create `skills/generate-docs/SKILL.md` with frontmatter
      (`user-invocable: true`, `version: 1.0.0`, trigger-rich description)
      — `skills/generate-docs/SKILL.md`
- [x] `## Turn contract` section (first body section)
- [x] Discovery-step adapter-detection checklist (fixed order: declaration →
      Starlight → Docusaurus → plain-markdown fallback; evidence required per
      match)
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

- [x] Knowledge-map section (command contract, JSON shape, per-tool recipes,
      wrapper-page rules, n/a rule) — Process step 4 + report `Map:` line
- [x] `--review` export mode section — Process step 5 + report line
- [x] Edit `skills/execute-phase/SKILL.md` close-out hand-off — v1.13.0,
      `/generate-docs` line gated on the `Docs site` block
- [x] Edit `skills/audit-docs/SKILL.md` orphan/stale checklist item — v1.7.0,
      new check 13, block renumbered 10–14
- [x] Add `Docs site` block to the template doc map (commented, optional);
      referenced in `skills/init-workspace/SKILL.md` interview — v1.7.0
- [x] Run `bump-skill` (all touched skills; CHANGELOG EN/ES rows +
      release-log entries; README EN/ES: counts 28/14, Document section,
      model-table row; docs/workflow/SKILLS.md Document section)
- [x] progress.md entry for P2

## P3 — Hardening

- [x] Failure-mode branches written into the SKILL.md (not-configured →
      NEEDS_INPUT + snippet in the discovery checklist's outcome 5; invalid
      map JSON → FAIL in the knowledge-map process item; missing map command
      → n/a rule; monorepo limitation → discovery-step note + known-issues #1)
- [x] Cross-reference sweep (SKILLS.md, READMEs, CHANGELOGs — all reference
      generate-docs; `Docs site` block consistent across 5 files; no stray
      phase-label tokens in planning artifacts — audit-docs check 10 clean)
- [x] Verification gate green (`npx skills add . --list` exit 0)
- [x] progress.md entry for P3
- [x] open PR [#8](https://github.com/gtrabanco/agentic-workflow/pull/8)
      (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc that leaves
      `\`-escaped backticks) and PRINT THE PR URL in the chat
- [x] update the roadmap row to
      `done · [#8](https://github.com/gtrabanco/agentic-workflow/pull/8)`
- [x] commit the PR-linked roadmap row and push; PR #8 merged to `main`
