# Normalized Repository State

> Evidence-backed snapshot of the repository. The repository remains the source
> of truth; this ledger is a frozen, reviewable representation of observed
> truth. Historical snapshots remain recoverable from Git. Only
> `resolve-repository-state` may replace frozen facts or accepted decisions.

## Snapshot

| Field | Value |
|---|---|
| Snapshot ID | `2026-08-30-first-pass-convergence` |
| Source revision | `ea646795aedfcbd9ecc7a89b30dc5e5efe6e3d14` (`main`) |
| Status | `frozen` |
| Created by | `resolve-repository-state` after repository, test, and forge verification |
| Created at | 2026-08-30 |

## Repository facts

| ID | Statement | Evidence | Status |
|---|---|---|---|
| F001 | Repository `gtrabanco/agentic-workflow` uses `main`; the source revision was clean before this snapshot refresh. | `git branch --show-current`; `git status --porcelain`; `git rev-parse HEAD` | frozen |
| F002 | The schema package is `@gtrabanco/agentic-workflow-schema@3.4.0`; its complete current suite passes 554/554. | `packages/agentic-workflow-schema/package.json`; `npm test` on 2026-08-30 | frozen |
| F003 | Feature 27 is merged through PR #150 and provides `@gtrabanco/pi-agentic-workflow@0.1.0`; its current suite passes 132/132 after `npm ci`. | `packages/pi-agentic-workflow/package.json`; `gh pr view 150`; `npm test` on 2026-08-30 | frozen |
| F004 | The canonical skill tree has 35 `SKILL.md` entrypoints; context budgets and Skills CLI discovery pass. The CLI lists 34 installable entries because repository-internal distribution policy excludes one entry. | `find skills ...`; `node scripts/check-skill-context.mjs`; `npx skills add . --list` | frozen |
| F005 | Root bounded-delivery and audit-receipt regressions pass. | `node --test scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs` | frozen |
| F006 | The only open implementation issues are #146 and #149; there are no open pull requests. | `gh issue list --state open`; `gh pr list --state open` | frozen |
| F007 | Roadmap rows 01-27 are done. Feature 28 is planned from #146; feature 29 is planned from #149 and depends on 28. | `docs/features/ROADMAP.md` | frozen |
| F008 | Features 28 and 29 each have a frozen SPEC, acceptance manifest, phase topology, task ledger, decisions, risks, test strategy, progress record, and compact planning evidence. | `docs/features/28-evidence-grounded-spec-plan-review/`; `docs/features/29-bounded-implementation-discovery/` | frozen |
| F009 | Feature 28 has five phase-identical SPEC/PLAN/TASKS/progress entries and exactly eight tasks per phase; feature 29 has four and exactly eight tasks per phase. Their SPEC and acceptance AC sets match. | structural audit run on 2026-08-30 | frozen |
| F010 | No project-specific architectural-invariants document exists. Planning classification remains `n/a: no project invariants declared`; repository architecture and current source evidence still require explicit coverage. | absence of `docs/architecture/ARCHITECTURAL_INVARIANTS.md`; `docs/workflow/WORKFLOW_INVARIANTS.md` | frozen |
| F011 | Human workflow documentation is bilingual when paired; skills, prompts, SPECs, plans, code, commits, and PRs are English-only. | `CLAUDE.md` | frozen |

## Accepted decisions

| ID | Decision | Rationale | Evidence |
|---|---|---|---|
| AD-002 | Update paired English/Spanish human workflow documents together; keep programming artifacts English-only. | Prevents user-facing language drift without duplicating machine contracts. | `CLAUDE.md` |
| AD-004 | One implementation PR per delivery unit against `main`; direct-main work is exceptional and requires explicit user authority. | Keeps implementation units independently reviewable. This snapshot records an explicitly authorized documentation-only exception. | `CLAUDE.md`; 2026-08-30 user instruction |
| AD-007 | The schema runtime validator is semantic authority; generated projections cannot become a competing authority. | Prevents public contract drift. | package policy; feature 26 decisions |
| AD-008 | Correctness is evidence- and obligation-bound, never cycle-count-bound. One batched repair plus one re-review is the normal qualified path; entry into a second cycle emits `CONVERGENCE-ANOMALY` and fails qualification without discarding findings. | Makes repeated review/fold a diagnosable upstream failure instead of an approval shortcut. | feature 28 SPEC/AC14; feature 29 SPEC/AC13; user-approved amendment |
| AD-009 | Authoring is progressive: inventory, evidence acquisition, compact conclusions, draft, deterministic readiness, then independent review. Readiness cannot emit review PASS. | Moves context discovery before edits while keeping approval independent. | feature 28 SPEC and planning evidence |
| AD-010 | Implementation discovery validates and specializes a sound reviewed Plan. File/read counts have no authority; missing Plan topology, obligations, or validators return to planning. | Prevents execution from becoming deferred planning. | feature 29 SPEC and planning evidence |

## Planned work

| ID | Work | Status | Evidence |
|---|---|---|---|
| W001 | Feature 27 — Pi package and routed skill aliases | complete; merged through PR #150 | F003; roadmap row 27 |
| W002 | Feature 28 / issue #146 — evidence-grounded SPEC and Plan review | fully planned and next to implement | frozen feature 28 artifact set; issue #146 amendment |
| W003 | Feature 29 / issue #149 — bounded implementation discovery | fully planned; implementation blocked until feature 28 merges and its contracts are revalidated | frozen feature 29 artifact set; roadmap dependency 28 |

## Planning readiness

| Unit | Can be planned now? | Can be implemented now? | Reason |
|---|---|---|---|
| AW feature 28 / #146 | already planned | yes | feature 27 prerequisite is merged; revalidate current evidence at execution preflight |
| AW feature 29 / #149 | already planned | no | must consume merged feature 28 receipts, routes, and planning-evidence contract |
| New AWL work | outside this repository | no sequencing authority here | AW remains portable and runtime-agnostic; AWL consumes published contracts later |

## Open questions

None block feature 28 implementation. Feature 29's upstream contract values are
known by design but must be rebound to the exact merged feature 28 revision
before its first implementation phase.

## Inference

| ID | Reasoning | Based on |
|---|---|---|
| I001 | The correct AW execution order is feature 28, then feature 29. | F003, F007-F009, W002-W003 |
| I002 | The new plans target fewer late loops by increasing evidence quality before design, planning, and first write; they do not promise that every correct implementation needs zero repairs. | AD-008-AD-010 |
| I003 | A second review/fold cycle is now release-qualification evidence of a process defect, but never authority to merge incomplete code. | AD-008 |

## Superseded-state resolutions

| ID | Prior frozen statement | Current evidence | Resolution |
|---|---|---|---|
| C001 | Source revision was `5bb235bc...`; PR #150 was open and feature 27 absent from `main`. | F001, F003, F007 | Accept current source and forge evidence; preserve the old snapshot in Git history. |
| C002 | Feature 28 and 29 planning was only requested. | F008-F009, W002-W003 | Both units now have complete frozen planning artifact sets. |
| C003 | The roadmap omitted or treated feature 27 as in progress. | F003, F007 | Row 27 is done through merged PR #150; feature numbering remains 28 and 29. |

---

**Status: `frozen`**

Source revision: `ea646795aedfcbd9ecc7a89b30dc5e5efe6e3d14`

Next: implement feature 28 from its frozen artifacts; only after it merges,
revalidate and implement feature 29.
