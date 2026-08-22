# Normalized Repository State

> Evidence-backed snapshot of the repository. The repository remains the source
> of truth; this ledger is a frozen, reviewable representation of observed truth.

## Snapshot

| Field | Value |
|---|---|
| Snapshot ID | `2025-08-22-nrs-regen` |
| Source revision | `118112217ed7ec7c8d5f14d6102e279d420c1706` |
| Status | `frozen` |
| Created by | `discover-repository-state` |

## Repository Facts

| ID | Statement | Evidence | Observed at | Status |
|---|---|---|---|---|
| F001 | **Repo name:** `agentic-workflow` (GitHub: `gtrabanco/agentic-workflow`) | `CLAUDE.md` line 1 | 2025-08-22 | frozen |
| F002 | **Primary branch:** `main` | `git branch` — `* feat/23-…`, `main` present; `origin/HEAD → origin/main` | 2025-08-22 | frozen |
| F003 | **No root `package.json`** | `ls package.json` → absent (package lives in `packages/`) | 2025-08-22 | frozen |
| F004 | **Schema package:** `@gtrabanco/agentic-workflow-schema` v3.1.0, npm public, Node ≥18 | `packages/agentic-workflow-schema/package.json` — `"version": "3.1.0"`, `"access": "public"`, `"node": ">=18"` | 2025-08-22 | frozen |
| F005 | **Schema package language:** TypeScript 6; build = `tsc`; test = `tsc && tsc -p tsconfig.test.json && node --test test/*.test.mjs` | `packages/agentic-workflow-schema/package.json` — `devDependencies.typescript: "6"`, `scripts.test` | 2025-08-22 | frozen |
| F006 | **Schema package exports:** `dist/index.js`, `dist/index.d.ts`, `envelope.schema.json`, `skill-outcome.schema.json`, `workflow-snapshot.schema.json` | `packages/agentic-workflow-schema/package.json` — `exports` and `files` fields; `npm pack --dry-run` lists all 4 public artifacts | 2025-08-22 | frozen |
| F007 | **Schema package test suite:** 51 tests, exit 0 | `cd packages/agentic-workflow-schema && npm test` → 51 pass, 0 fail, 0 skip, 0 todo | 2025-08-22 | frozen |
| F008 | **Skills:** 35 total SKILL.md files; 18 user-invocable (frontmatter `user-invocable: true`); 17 internal (`user-invocable: false`); 2 marked `metadata.internal: true` | `ls skills/*/SKILL.md | wc -l` → 35; `grep -l "user-invocable: true" skills/*/SKILL.md | wc -l` → 18; `grep -l "user-invocable: false" skills/*/SKILL.md | wc -l` → 17 | 2025-08-22 | frozen |
| F009 | **All skills carry version frontmatter** | `grep -l "^version:" skills/*/SKILL.md | wc -l` → 35 | 2025-08-22 | frozen |
| F010 | **Context budgets pass:** all 35 skill entrypoints within 2,800 estimated-token / 240-line cap | `node scripts/check-skill-context.mjs` → PASS (35 skills) | 2025-08-22 | frozen |
| F011 | **Skills CLI discovers all:** `npx skills add . --list` → exit 0, lists 33 skills (19 user-facing + 14 counted; `metadata.internal: true` excluded from discovery) | `npx skills add . --list` → exit 0 | 2025-08-22 | frozen |
| F012 | **Template scaffold:** `template/docs/workflow/` contains bilingual docs template including `REPOSITORY_STATE.md`, all workflow reference docs, and `SKILL_CONTEXT_BUDGETS.json` | `ls template/docs/workflow/` | 2025-08-22 | frozen |
| F013 | **Architectural invariants file exists but is empty** (no project-specific rules declared) | `wc -l docs/architecture/ARCHITECTURAL_INVARIANTS.md` → 0 (empty) | 2025-08-22 | frozen |
| F014 | **All skills have ES siblings in `template/`** (`docs/workflow/*.md` ↔ `*.es.md`) | `ls docs/workflow/*.md docs/workflow/*.es.md | wc -l` → paired | 2025-08-22 | frozen |
| F015 | **Docs language:** English; bilingual EN+ES pairs for human-readable docs | `CLAUDE.md` — "Docs language is English"; README.md ↔ README.es.md reciprocal links; docs/workflow/*.md ↔ *.es.md | 2025-08-22 | frozen |
| F016 | **Commit convention:** conventional commits (`feat(scope):`, `fix(scope):`, `docs(scope):`, `test(scope):`) | `git log --oneline -10` — all match pattern | 2025-08-22 | frozen |
| F017 | **Remote branches:** `origin/main`, `origin/claude`, `origin/codex/fix-orchestration-envelope-distribution`, `origin/feat/23-workflow-skill-capability-profiles`, `origin/inheritance` | `git branch -r` | 2025-08-22 | frozen |
| F018 | **Open PR:** #140 `feat/23-workflow-skill-capability-profiles` (feature 23, all phases done, REVIEW-PASS receipt at `1181122`) | `gh pr list --state open --json number,title,headRefName` → #140 | 2025-08-22 | frozen |
| F019 | **Open issues:** #136 (feature 23, closed by PR #140), #137, #138, #139 (all NEW FEATURE proposals) | `gh issue list --state open --json number,title` | 2025-08-22 | frozen |
| F020 | **Roadmap:** 23 features, all status `done` | `docs/features/ROADMAP.md` — every row shows `done · [#NN]` | 2025-08-22 | frozen |
| F021 | **Fix index:** 28 open fix entries in `docs/fix/` (various stale/ongoing items, none active in-progress) | `ls docs/fix/[0-9]*` excluding _TEMPLATE and README | 2025-08-22 | frozen |
| F022 | **No `package.json` at root** (monorepo-like structure with `packages/` subdirectory only) | `ls package.json` → absent | 2025-08-22 | frozen |
| F023 | **SKILLS.md user-facing count is stale** (claims 17; frontmatter truth is 18) | `docs/workflow/SKILLS.md` line 4 — "17 user-facing skills"; frontmatter grep → 18 | 2025-08-22 | frozen |
| F024 | **`docs/workflow/REPOSITORY_STATE.md` was deleted** on feature branch `feat/23-…` (commit `7dc28e8`, fold F7 — stale NRS dropped). `template/docs/workflow/REPOSITORY_STATE.md` (60 lines, canonical template) is preserved. | `git show 7dc28e8 --stat`; `wc -l template/docs/workflow/REPOSITORY_STATE.md` → 60 | 2025-08-22 | frozen |

## Accepted decisions

| ID | Decision | Rationale | Evidence | Accepted at |
|---|---|---|---|---|
| AD-002 | **Bilingual docs rule:** every human-readable doc with an ES sibling is updated in the same change, never deferred. Scope exception: SKILL.md, SPECs, commits, PRs, machine config (English-only). | Cross-language consistency for agent and human consumers; prevents the ES side from going stale. | `CLAUDE.md` "Human-readable docs carry EN + ES siblings" rule; `docs/workflow/REPOSITORY_STATE.md` (deleted F7) originally documented this as a fact. | Feature 18 (PR #114), confirmed by F17 (PR #57) bilingual audit |
| AD-004 | **One PR per unit of work, always against `main`.** Never work on `main` directly; never stack PRs. | Keeps the workflow linear, reviewable, and mergeable; prevents hidden dependencies between stacked PRs. | `CLAUDE.md` "One PR per unit of work, always against main"; every roadmap feature merged via one PR against `main`. | Feature 18 (PR #114) |
| AD-007 | **Schema package strict contracts:** `npm test` must exit 0 (tsc + tests); JSON schemas must match TypeScript types; version bump required for any public API change. | Prevents silent contract drift between the schema package and the skills that consume it. | `packages/agentic-workflow-schema/package.json` — `scripts.test`, `scripts.prepublishOnly: "npm test"`; `CLAUDE.md` "If packages/agentic-workflow-schema/ was touched: npm test passes there" | Feature 18 (PR #114) |

## Planned work

| ID | Work | Status | Evidence |
|---|---|---|---|
| W001 | PR #140 — `feat/23-workflow-skill-capability-profiles` (Closes #136) | done (awaiting human merge) | `gh pr list --state open`; `review-change:pass` receipt at exact HEAD `1181122` |
| W002 | Issue #137 — NEW FEATURE: Decide safe workflow transitions from trusted machine state | open (proposal) | `gh issue list --state open` |
| W003 | Issue #138 — NEW FEATURE: Bind review receipts to exact candidate content | open (proposal) | `gh issue list --state open` |
| W004 | Issue #139 — NEW FEATURE: Add staged, candidate-bound verification contracts | open (proposal) | `gh issue list --state open` |

## Documentation

| ID | Statement | Document evidence | Implementation evidence |
|---|---|---|---|
| D001 | `docs/workflow/WORKFLOW_INVARIANTS.md` defines the architectural invariants evaluation protocol; references NRS `when present` | `docs/workflow/WORKFLOW_INVARIANTS.md:56` | NRS deleted (F024); skills treat as optional (`when present` / `n/a if absent`) |
| D002 | `docs/features/ROADMAP.md` is the single source of truth for feature numbering, ordering, and dependencies | `docs/features/ROADMAP.md` header | All23 features have folders and rows; all merged |
| D003 | `docs/workflow/SKILLS.md` claims "17 user-facing + 14 internal"; frontmatter truth is 18 user-facing + 17 internal = 35 | `docs/workflow/SKILLS.md` line 4 | F008 (frontmatter grep) — count is stale |
| D004 | `docs/workflow/MIGRATION.md` consolidates upgrade notes for the backlog's major skill changes | `docs/workflow/MIGRATION.md` | Single document covering U1–U10 majors |

## Open Questions

| ID | Question | Evidence | Owner |
|---|---|---|---|
| Q001 | SKILLS.md user-facing count is stale (17 vs 18); when should this be corrected? | F008 (frontmatter) vs D003 (SKILLS.md) | User / `/audit-docs` |
| Q002 | Should this repo's own `docs/workflow/REPOSITORY_STATE.md` be regenerated from this snapshot? | F024 (NRS deleted); skills treat as optional | User — non-blocking (skills degrade gracefully) |

## Inference

| ID | Reasoning | Based on |
|---|---|---|
| I001 | All 23 roadmap features are done; the repo has no active `planned` or `in-progress` units. The next work unit would be one of the 4 open issues (#137–#139) or one of the 28 open fix index entries, routed by the user via `/design-feature` or `/plan-fix`. | F020, F019, F021 |
| I002 | The deleted `docs/workflow/REPOSITORY_STATE.md` is referenced conditionally ("when present") by `workflow-status`, `review-change`, and `review-change`'s own SKILL.md. Skills report `n/a` when absent. No skill requires it unconditionally. The template copy is preserved for target projects. | F024, `skills/workflow-status/references/SENSOR_CORE.md:5`, `skills/review-change/SKILL.md:124` |
| I003 | The `metadata.internal: true` exclusion from the skills CLI explains why `npx skills add . --list` shows 33 while `ls skills/*/SKILL.md` shows 35 — two skills (bump-skill + one more) are excluded from discovery. | F008, F011 |
| I004 | Feature 23's NRS is now this snapshot (replacing the deleted stale one). Future planning/review on this repo should consume this NRS rather than reconstructing facts independently. | F024, this document |

## Contradictions

| ID | Frozen fact | New evidence | Reported by | Resolution |
|---|---|---|---|---|
| — | (none) | — | — | — |
