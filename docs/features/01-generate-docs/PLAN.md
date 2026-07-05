# 01 — generate-docs — Plan

Phases (labels are the executor's argument: `execute-phase 01 P2`).

## P1 — Core skill

Write `skills/generate-docs/SKILL.md` in full:

- Frontmatter (`name: generate-docs`, `user-invocable: true`, `version: 1.0.0`,
  description with trigger phrases: "generate the docs", "update the docs site",
  "document this unit", "export the review to the docs", "generate-docs").
- `## Turn contract` first (report block printed; `→ Next:` last before the
  envelope; envelope absolute last; files actually WRITTEN, paths listed).
- Discovery step: project discovery + **adapter detection checklist** (fixed
  order, first match wins; the four outcomes and their required evidence).
- Process: scope resolution (diff vs default branch | explicit unit/path),
  incrementality checklist, page taxonomy (`guides/`, `map/`, `reviews/`),
  provenance frontmatter, per-adapter file conventions table (Starlight
  reference + plain-markdown fallback), verify step (docs build command or
  link check).
- Allowed / Forbidden lists (Forbidden: whole-project regeneration, model-
  inferred graph edges, scaffolding a docs site, editing source code).
- Fixed output report block + decision, `→ Next:` example, envelope per
  `orchestration-envelope`, `## Portability`, `Relationship to other skills`,
  `Done when`.

P1 also commits the planning artifacts (this folder + ROADMAP.md).

## P2 — Integrations

- Knowledge-map section: declared-command contract, minimal `nodes[]/edges[]`
  JSON shape, per-tool mapping recipes (dependency-cruiser, madge, TypeDoc,
  tree-sitter), wrapper-page generation rules, n/a rule.
- `--review` export mode: parse the last `review-change` fixed report → page in
  `reviews/`; opt-in only.
- `skills/execute-phase/SKILL.md`: close-out `→ Next:` recommends
  `/generate-docs` when the doc map declares a docs site.
- `skills/audit-docs/SKILL.md`: orphan/stale generated-page checklist item
  (match on `generated-by` frontmatter; compare `source-unit` against roadmap +
  fix index; stale = source unit merged after page's `updated`).
- `template/` documentation map: optional `Docs site` block;
  `skills/init-workspace/SKILL.md`: interview asks for it when a docs site
  exists or is wanted.
- Run `bump-skill` for every touched skill.

## P3 — Hardening (always last)

- Encode failure modes as explicit SKILL.md branches: not-configured
  (NEEDS_INPUT + snippet), invalid map JSON (FAIL + mismatch cited), map
  command missing (n/a), monorepo multi-site (documented limitation →
  known-issues).
- Cross-reference sweep: SKILL.md ↔ docs/workflow/SKILLS.md ↔ README tables
  (EN/ES) ↔ CHANGELOGs.
- Verification gate: `npx skills add . --list` shows `generate-docs`; markdown
  links resolve.
- Close-out: open the PR and print its URL; roadmap row → `done · #PR`.
