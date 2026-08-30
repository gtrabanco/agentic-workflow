# Normalized Repository State

> Evidence-backed snapshot of the repository. The repository remains the source
> of truth; this ledger is a frozen, reviewable representation of observed
> truth. Historical snapshots remain recoverable from Git.

## Snapshot

| Field | Value |
|---|---|
| Snapshot ID | `2026-08-30-pre-execution-planning` |
| Source revision | `5bb235bc140e19e80cf671afa4c59db2708cf94f` (`origin/main`) |
| Status | `frozen` |
| Created by | `resolve-repository-state` after direct repository and forge verification |

## Repository Facts

| ID | Statement | Evidence | Observed at | Status |
|---|---|---|---|---|
| F001 | **Repository:** `gtrabanco/agentic-workflow`; primary branch and `origin/HEAD` are `main`. | `git remote get-url origin`; `git symbolic-ref refs/remotes/origin/HEAD` | 2026-08-30 | frozen |
| F002 | **Planning baseline:** `origin/main` resolves to `5bb235bc140e19e80cf671afa4c59db2708cf94f`. | `git rev-parse origin/main` | 2026-08-30 | frozen |
| F003 | **No root package manifest:** the published package lives under `packages/agentic-workflow-schema/`. | `test ! -f package.json`; `test -f packages/agentic-workflow-schema/package.json` | 2026-08-30 | frozen |
| F004 | **Schema package:** `@gtrabanco/agentic-workflow-schema` version `3.4.0`, Node `>=18`; its test command compiles source and test TypeScript before running Node tests. | `packages/agentic-workflow-schema/package.json` fields `version`, `engines.node`, and `scripts.test` | 2026-08-30 | frozen |
| F005 | **Skills:** 35 `SKILL.md` entrypoints: 18 with `user-invocable: true`, 17 with `user-invocable: false`, and 2 carrying a `metadata` block. | `find skills -mindepth 2 -maxdepth 2 -name SKILL.md`; anchored frontmatter `grep` counts | 2026-08-30 | frozen |
| F006 | **Context budgets pass:** every current skill entrypoint passes the repository budget checker. | `node scripts/check-skill-context.mjs` -> `PASS context budgets: 35 skills` | 2026-08-30 | frozen |
| F007 | **Distribution discovery succeeds:** the Skills CLI discovers 34 installable entries from the repository. | `npx skills add . --list` -> exit 0, `Found 34 skills` | 2026-08-30 | frozen |
| F008 | **No project capability inventory exists.** Feature design must derive the applicable inventory from current repository architecture and code until a project-owned inventory is created. | `test ! -f docs/CAPABILITIES.md` | 2026-08-30 | frozen |
| F009 | **No project architectural-invariants document exists.** Planning classification is therefore `n/a: no project invariants declared`, without treating the scaffold template as project policy. | `test ! -f docs/architecture/ARCHITECTURAL_INVARIANTS.md`; `docs/workflow/WORKFLOW_INVARIANTS.md` | 2026-08-30 | frozen |
| F010 | **Human workflow documentation is bilingual; code, prompts, SPECs, planning artifacts, commits, and PRs are English-only.** | `CLAUDE.md`; paired `docs/workflow/*.md` / `*.es.md` files | 2026-08-30 | frozen |
| F011 | **Open implementation issues:** #146, evidence-grounded specification and plan review gates; #149, bounded pre-edit implementation discovery and execution maps. | `gh issue list --state open --limit 100 --json number,title,url` | 2026-08-30 | frozen |
| F012 | **Open pull request:** #150, feature 27 Pi package and model routing, from `feat/27-pi-agentic-workflow`; forge reports it mergeable and no status checks are registered. | `gh pr list --state open --json number,title,headRefName,mergeStateStatus,statusCheckRollup` | 2026-08-30 | frozen |
| F013 | **Roadmap:** rows 01-26 are done; rows 28 and 29 are scheduled; row 27 is not on `main` because it belongs to open PR #150. | `docs/features/ROADMAP.md`; `gh pr view 150` | 2026-08-30 | frozen |
| F014 | **Fix planning corpus:** 31 numbered fix directories exist under `docs/fix/`; directory presence does not prove an open forge issue or executable status. | `find docs/fix -mindepth 1 -maxdepth 1 -type d -name '[0-9]*'` | 2026-08-30 | frozen |
| F015 | **Remote branch inventory:** `origin/main`, `origin/claude`, and `origin/inheritance`; PR #150's head is visible through the forge even though no matching tracking ref is currently fetched. | `git branch -r`; `gh pr view 150 --json headRefName` | 2026-08-30 | frozen |

## Accepted decisions

| ID | Decision | Rationale | Evidence | Accepted at |
|---|---|---|---|---|
| AD-002 | **Bilingual docs rule:** every human-readable doc with an ES sibling is updated in the same change, never deferred. Scope exception: SKILL.md, SPECs, planning artifacts, commits, PRs, and machine config are English-only. | Prevents one human-facing language from silently drifting. | `CLAUDE.md`; paired workflow docs | Feature 18 (PR #114), retained |
| AD-004 | **One PR per unit of work, always against `main`.** Never implement directly on `main`; never stack PRs. | Keeps every unit independently reviewable and mergeable. | `CLAUDE.md` | Feature 18 (PR #114), retained |
| AD-007 | **Schema package strict contracts:** `npm test` must pass; generated structural projections cannot become a second semantic authority; a public API change requires an appropriate package version bump. | Prevents drift between runtime validation, published types, projections, and consumers. | `CLAUDE.md`; package scripts; feature 26 decisions | Feature 18 (PR #114), refined by feature 26 |

## Planned work

| ID | Work | Status | Evidence |
|---|---|---|---|
| W001 | PR #150 — feature 27 Pi package with routed skill aliases and model routing | open; independently owned implementation | `gh pr view 150`; feature number reserved by the user |
| W002 | Issue #146 — feature 28 evidence-grounded specification and plan review gates | open; design accepted, planning requested | Issue #146 current body; `docs/features/ROADMAP.md` row 28 |
| W003 | Issue #149 — feature 29 bounded implementation discovery | open; design accepted, planning requested after feature 28 | Issue #149 current body; `docs/features/ROADMAP.md` row 29 |

## Documentation

| ID | Statement | Document evidence | Implementation evidence |
|---|---|---|---|
| D001 | `docs/features/ROADMAP.md` is the numbering, ordering, dependency, and status authority for features. | Roadmap header and status legend | 28 current rows; feature 27 is pending in PR #150 |
| D002 | `docs/workflow/WORKFLOW_INVARIANTS.md` defines how to classify project-declared invariants but does not itself declare project-specific invariants. | `docs/workflow/WORKFLOW_INVARIANTS.md` | F009 |
| D003 | `docs/workflow/REPOSITORY_STATE.md` is a frozen evidence ledger; only discovery/resolution flows may rewrite facts or accepted decisions. | This document; repository-state skills | This refresh records the superseded snapshot under C001-C003 |
| D004 | Feature SPECs and plans are English-only even when they change bilingual workflow documentation during implementation. | `CLAUDE.md` | AD-002 |

## Open Questions

| ID | Question | Evidence | Owner |
|---|---|---|---|
| Q001 | What exact roadmap summary and dependencies will feature 27 add when PR #150 merges? | The row is not present at the frozen `main` revision; the open PR owns it. | PR #150; non-blocking for planning features 28 and 29 |

## Inference

| ID | Reasoning | Based on |
|---|---|---|
| I001 | The only currently open AW implementation proposals are #146 and #149; feature 27 is already being implemented in PR #150 and must not be renumbered or replanned here. | F011-F013, W001-W003 |
| I002 | Feature planning may classify project invariants as `n/a`, but capability closure still has to derive and walk the repository's actual package, skill, documentation, distribution, and orchestration surfaces. | F008-F010, D002 |
| I003 | The CLI count (34) and filesystem count (35) describe different observed surfaces; neither count should be rewritten to match the other without identifying the exact distribution rule. | F005-F007 |

## Contradictions

| ID | Frozen fact | New evidence | Reported by | Resolution |
|---|---|---|---|---|
| C001 | Snapshot `2025-08-22-nrs-regen` bound facts to revision `1181122`, schema package 3.1.0, PR #140, issues #137-#139, and a 23-feature roadmap. | F002, F004, F011-F014 show revision `5bb235b`, schema package 3.4.0, PR #150, issues #146/#149, and the later roadmap state. | `resolve-repository-state`, 2026-08-30 | Accept current direct repository/forge evidence for this snapshot; preserve the older snapshot in Git history. |
| C002 | The prior snapshot said `docs/architecture/ARCHITECTURAL_INVARIANTS.md` existed but was empty. | F009 proves the file is absent at the current source revision. | `resolve-repository-state`, 2026-08-30 | Current planning records `n/a: no project invariants declared`; absence is not silently converted into an invariant. |
| C003 | The prior snapshot reported 33 Skills CLI entries and inferred two metadata-internal exclusions. | F007 reports 34 entries; F005 still reports 35 filesystem entrypoints and two metadata blocks. | `resolve-repository-state`, 2026-08-30 | Freeze only the two observed counts. The old exclusion inference is retired; exact distribution ownership remains outside this snapshot. |
