# 396 — doc-gen · planning evidence

One row per Engineering claim the change rests on. `authority-kind` is the closed
cell the unit-lane plan step writes as `n`
(`known | assumption | unknown | spec`), `freshness` is
`current | stale | not-applicable`; every row was sampled at the cut head
(`15d23a3c`). Column order and vocabularies are owned by
`skills/pre-execution-review/references/LEDGERS.md` §1.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | the scaffold already declares the format, content dir, build and map in one `Docs site` block, so S3's discovery surface exists and needs no new declaration | `template/AGENTS.md:48-61` (`- format: starlight \| docusaurus \| markdown`, `content-dir`, `build`, `map`), read at the cut head | current | O3, P2 |
| PE-002 | known | the lane's docs step names no output format and closes on "All docs the unit demands are updated" — S1's forced task has no carrier today | `skills/unit-lane/references/DOCS.md` §Checklist (one occurrence, `rg -c` → 1) | current | O1, P3 |
| PE-003 | known | this repository declares no `Docs site` block, so the S4 fallback is this repo's real path, not a hypothetical | `rg -n "Docs site" AGENTS.md` → no match; `rg -l "Docs site" template/AGENTS.md` → 1 | current | O4, P5 |
| PE-004 | known | the roadmap and fix index are read through one committed reader, so the generator consumes rows instead of re-parsing the table | `packages/agentic-workflow/src/index-document.mjs` (`readRoadmapIndex`, `readFixIndexTable`, `roadmapSection`), consumed by `scripts/roadmap-settle.mjs:49` | current | O2, O6, P2 |
| PE-005 | known | the root suite runs every `scripts/*.test.mjs`, so a live-tree `--check` inside a suite is a command the gate calls — the S6 receipt | `scripts/run-root-suite.mjs` (globs `scripts/*.test.mjs`); the same pattern in `scripts/roadmap-settle.test.mjs:77` | current | O8, P2, P6 |
| PE-006 | known | a new script ships its sibling suite as two commits, the suite observed red first | `AGENTS.md` §Working rules (red-first) and `scripts/red-first.mjs` header; enforced in the root suite | current | P1, P2 |
| PE-007 | known | `--triage` reads the unit doc's `type`/`scope` frontmatter and falls back to a section heuristic when it is absent, which is why the pre-cut doc answered `trivial` | `scripts/unit-route.mjs:590-619` (`unitFacts`), observed in the pre-cut doc's triage output | current | D1, the pasted `## Triaged steps` block |
| PE-008 | known | the guide layer is 3 estimate units over its declared ceiling on `main`, before this change | `bun scripts/check-skill-context.mjs --documents` at `c8b64d0b` → `AGENTS.md: estimate 6884 > 6881` | current | §Known pre-existing issues, D1's repair, O11 |
| PE-009 | known | `estimate` is `ceil(bytes / 4)`, so a ≤13-byte prose trim inside `AGENTS.md` closes the overrun without touching a ceiling | `scripts/check-skill-context.mjs:72` (`const estimate = (text) => Math.ceil(Buffer.byteLength(text, "utf8") / 4)`) | current | §Known pre-existing issues, O11 |
| PE-010 | known | the four target formats have no shared extension: a format change renames every generated page, so orphan deletion (S7) must key on the plan, never on a fixed name list | `template/AGENTS.md:55` (one `format` slot) and the issue's own `md`, `mdx`, `html`, `latex` list | current | O9, D4 |
| PE-011 | known | the lane's docs step reference is the only carrier of the docs checklist; no `template/skills/` tree exists, so one file owns it | `ls template/` → `AGENTS.md`, `docs`; `rg -c "All docs the unit demands are updated" skills/` → 1 | current | O1, P3 |
| PE-012 | known | `init-workspace` already asks a `Docs site` question, so S8 extends an existing interview instead of adding a new one | `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` §Interview bullet "Docs site" | current | O10, P4 |
