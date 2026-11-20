# Normalized Repository State

> Evidence-backed snapshot of the repository. The repository remains the source
> of truth; this ledger is a frozen, reviewable representation of observed
> truth. Historical snapshots remain recoverable from Git. Only
> `resolve-repository-state` may replace frozen facts or accepted decisions.
>
> The freshness rule this snapshot obeys is
> [`repository-state@1`](../../skills/resolve-repository-state/references/STATE_CONTRACT.md):
> read `covers-through` before consuming anything here, and treat a decision
> dated after it as a contradiction, never as current truth.

## Snapshot

| Field | Value |
|---|---|
| Snapshot ID | `2026-11-20-reconciliation-refreeze` |
| Source revision | `8fc204abb4e945f47a7d70d6faf5545d33af206c` (`main`) |
| Status | `frozen` |
| Covers through | 2026-11-20 |
| Created by | `resolve-repository-state` after repository, suite and forge verification |
| Created at | 2026-11-20 |

## Repository facts

| ID | Statement | Evidence | Status |
|---|---|---|---|
| F001 | The repository `gtrabanco/agentic-workflow` uses `main`; the re-freeze was measured on a clean worktree at the source revision above. | `git branch --show-current`; `git status --porcelain`; `git rev-parse HEAD` | frozen |
| F002 | The bun workspace carries four packages, all at `4.10.0`: `@gtrabanco/agentic-workflow-schema`, `@gtrabanco/agentic-workflow`, `@gtrabanco/pi-agentic-workflow` and `@gtrabanco/pi-nan-agentic-workflow`, under one lockfile and one version-parity gate. | `packages/*/package.json`; `bun.lock`; `scripts/version-parity-gate.mjs` | frozen |
| F003 | The canonical skill tree has 30 `SKILL.md` entrypoints; the context budgets and the `skills` CLI discovery both pass. | `find skills -name SKILL.md \| wc -l` → 30; `bun scripts/check-skill-context.mjs`; `npx skills add . --list` | frozen |
| F004 | The root suite set is 130 `scripts/*.test.mjs` files, run per file by `scripts/run-root-suite.mjs` in a bounded worker pool and composed into the local gate. | `ls scripts/*.test.mjs \| wc -l` → 130; `bun scripts/local-gate.mjs --list` | frozen |
| F005 | 13 issues are open and no pull request is open; the roadmap is the worklist, not the forge queue. | `gh issue list --state open` → 13; `gh pr list --state open` → 0 | frozen |
| F006 | `docs/ROADMAP.md` carries 175 numbered unit rows over 107 feature folders and 148 fix folders; a fix row is written through `agentic-workflow roadmap … fixrow`, a feature row through the emitter and the doc's `roadmap_summary:`. | `rg -c '^\| [0-9]+ \|' docs/ROADMAP.md` → 175; `ls -d docs/features/*/ \| wc -l` → 107; `ls -d docs/fix/*/ \| wc -l` → 148 | frozen |
| F007 | A project architectural-invariants document exists and carries a real invariant: `docs/architecture/ARCHITECTURAL_INVARIANTS.md` publishes `AI-001` (vocabulary residency) with its `vocabulary-residency@1` block, so planning no longer classifies `n/a: no project invariants declared`. | `docs/architecture/ARCHITECTURAL_INVARIANTS.md`; `bun test scripts/vocabulary-parity.test.mjs` | frozen |
| F008 | Human and machine documentation is English-only **permanently** (owner decision 2026-10-27, issue #232): bilingualism is a rendering concern of the project's web layer, no `.es.md` sibling is created, and no language switcher ships in a committed artifact. | `AGENTS.md` § Working rules; `docs/ROADMAP.md` row 57 (`declined`); `rg -c '\.es\.md' docs skills template` → the rule text only | frozen |
| F009 | The unit-record contract has two accepted shapes — the legacy 14 sections and `spec-by-reference` — owned by one const, read by the router and the templates rather than copied. | `packages/agentic-workflow-schema/src/pre-execution.ts` (`UNIT_DOC_REQUIRED_SECTIONS`, `UNIT_DOC_SPEC_REF_SECTIONS`); `bun test scripts/unit-doc-contract.test.mjs` | frozen |
| F010 | `docs/audits/` carries two audits, `docs/generated/` carries three emitted pages (`code.md`, `index.md`, `units.md`), and `template/` ships its own documentation tree; none of the three is hand-written. | `ls docs/audits`; `ls docs/generated`; `find template -name '*.md' \| wc -l`; `bun scripts/docs-generate.mjs --check` | frozen |
| F011 | The gate is local-first: `bun scripts/local-gate.mjs` runs every check the remote workflow runs, and `.github/workflows/root-suite.yml` is manual only. | `scripts/local-gate.mjs`; `.github/workflows/root-suite.yml` | frozen |
| F012 | The frozen planning ledgers (planning evidence, obligations, findings) have one writer per column set, mapped once in `skills/pre-execution-review/references/LEDGERS.md` and pinned by a suite. | `skills/pre-execution-review/references/LEDGERS.md` § Durable ledger write ownership; `bun test scripts/ledger-ownership.test.mjs` | frozen |
| F013 | No `CLAUDE.md` exists in the tree: the host guide is `AGENTS.md` alone, and a host that reads only `CLAUDE.md` is pointed at it by the scaffold's own rule. | `ls CLAUDE.md` → absent; `AGENTS.md` header; `docs/workflow/SKILLS.md` § init-workspace | frozen |

## Accepted decisions

| ID | Decision | Decided | Rationale | Evidence |
|---|---|---|---|---|
| AD-002 | Documentation is English-only permanently, and bilingualism is a rendering concern of the web layer rather than a per-release artifact set. Supersedes the 2026-09-15 interim decision recorded in C005. | 2026-10-27 | A per-commit translation duty doubled documentation cost while duplicating machine contracts; the web layer renders languages. | `AGENTS.md` § Working rules; issue #232; `docs/ROADMAP.md` row 57 |
| AD-004 | One implementation PR per delivery unit against the project's default branch; direct-main work is exceptional and requires explicit owner authority. | 2026-08-30 | Keeps implementation units independently reviewable. | `AGENTS.md` § Working rules; `IR2`, `IR6` |
| AD-007 | The schema runtime validator is the semantic authority; a generated projection can never become a competing authority. | 2026-08-30 | Prevents public contract drift. | `packages/agentic-workflow-schema`; `scripts/normative-drift.test.mjs` |
| AD-008 | Correctness is evidence- and obligation-bound, never cycle-count-bound: one batched repair plus one re-review is the normal path, and a second entry emits `CONVERGENCE-ANOMALY` without discarding findings. | 2026-08-30 | Makes a repeated review/fold diagnosable upstream instead of an approval shortcut. | `IR4`; `scripts/correction-budget.mjs`; `skills/pre-execution-review/references/POLICY.md` |
| AD-009 | Authoring is progressive: inventory, evidence, compact conclusions, draft, deterministic readiness, then independent review. Readiness never emits a review PASS. | 2026-08-30 | Moves discovery before edits while keeping approval independent. | `skills/unit-lane/references/DESIGN.md`; `skills/pre-execution-review` |
| AD-010 | Implementation validates and specializes a sound reviewed plan; file or read counts carry no authority, and a missing topology, obligation or validator returns to planning. | 2026-08-30 | Prevents execution from becoming deferred planning. | `skills/unit-lane/references/PLAN.md`; `skills/execute-phase/references/PRE_EXECUTION_GATE.md` |
| AD-011 | Every closed vocabulary a published contract names has exactly one machine owner, `@gtrabanco/agentic-workflow-schema`, and a consumer imports it; a copy is legal only inside a named pre-build entrypoint. | 2026-11-19 | A mirror drifts silently once its justifying premise expires. | `docs/architecture/ARCHITECTURAL_INVARIANTS.md` § AI-001; issue #643; PR #648 |
| AD-012 | A decision whose scope is `cross-unit` lands in exactly ONE permanent owner doc, and the unit ledger cites it instead of restating it. | 2026-11-19 | A decision buried in a unit folder dies with it. | `docs/architecture/ARCHITECTURE.md` § Promoting a decision; issue #650; PR #657 |
| AD-013 | The workflow's inviolable laws are always-loaded inside the host guide, never behind a pointer, and a superseded surface is deleted rather than kept for compatibility. | 2026-11-19 | A law a session must obey cannot depend on a hop, and compatibility copies are where drift starts. | `AGENTS.md` § Inviolable rules; `IR6`; issue #645; PR #652 |

## Current work

The worklist is `docs/ROADMAP.md`'s single numbered table and its five-state
legend, not a section of this snapshot: 13 open issues are triaged through
`triage-issue`, and every unit's state lives on its own row. This snapshot
records truth, never a queue — a planned-work table here was the fastest thing
to go stale.

## Open questions

None that block work. A unit that supersedes an accepted decision above
re-freezes this snapshot as its own recorded close step (`covers-through` moves
with that unit), so the artifact cannot outlive its coverage again.

## Superseded-state resolutions

This re-freeze replaces the `2026-08-30-first-pass-convergence` snapshot. Its
prior resolution rows live in Git history; the rows below record what *this*
re-freeze supersedes, so a reader of the artifact alone can see the change.

| ID | Prior frozen statement | Current evidence | Resolution |
|---|---|---|---|
| C001 | F004: "the canonical skill tree has 35 `SKILL.md` entrypoints." | F003 (30 today) | Replaced by the measured count; a count in prose is a claim the tree must be re-measured for. |
| C002 | F006: "the only open implementation issues are #146 and #149; there are no open pull requests." | F005 (13 open issues, 0 open PRs) | Replaced by the measured forge state. |
| C003 | F007: "Roadmap rows 01-27 are done; feature 28 is planned from #146 and 29 from #149." | F006 (175 rows, all states through the legend) | Replaced: the roadmap is the single index and the snapshot no longer restates its state. |
| C004 | F010: "No project-specific architectural-invariants document exists." | F007 | Replaced: the document exists and carries `AI-001`. |
| C005 | F011 and AD-002: "Human workflow documentation is English-only (interim, 2026-09-15)… feature 57 restores them per release," recorded as current. | F008; AD-002 (2026-10-27) | The owner reversed the decision on 2026-10-27 (issue #232) and the reversal post-dates every snapshot in between: the interim claim is retired, the permanent rule stands, and feature 57 is `declined`. This is the exact contradiction `repository-state@1` now makes visible — a decision dated after `covers-through` is a stale snapshot, never current truth. |
| C006 | F009: "Features 28 and 29 each have a frozen SPEC, acceptance manifest, phase topology and progress record." | F009 (the unit-record contract's two shapes) | Retired: both units landed long ago, their artifacts are frozen history, and the fact this snapshot keeps is the contract those artifacts established. |

---

**Status: `frozen`**

Source revision: `8fc204abb4e945f47a7d70d6faf5545d33af206c` · covers through 2026-11-20

Next: `bun scripts/repository-state.mjs docs/workflow/REPOSITORY_STATE.md` answers
`fresh` while no decision is dated after 2026-11-20 and the ttl holds; a unit that
supersedes an accepted decision re-freezes it.
