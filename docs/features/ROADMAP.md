# Roadmap

The single source of truth for feature **numbering, ordering, and dependencies**.
Every feature folder under `docs/features/<NN>-<slug>/` must have a row here, and
every row must have a folder (or be explicitly marked "scheduled").

## Features

| NN | Slug | Status | Depends on | Summary |
|----|------|--------|------------|---------|
| 01 | `generate-docs` | done · [#8](https://github.com/gtrabanco/agentic-workflow/pull/8) | — | New user-invocable skill: incremental, diff-driven developer docs into the target project's docs site (Starlight MDX first-class adapter), deterministic knowledge/call map, optional review-report export, drift protection via execute-phase and audit-docs |
| 02 | `measured-perf-review` | done · [#9](https://github.com/gtrabanco/agentic-workflow/pull/9) | — | init-workspace discovers/installs performance tooling (lint complexity rules, benchmark harness, profiler) and registers its commands; review-perf runs them when declared so perf findings cite real measurements |
| 03 | `orchestrator-crash-recovery` | done · [#10](https://github.com/gtrabanco/agentic-workflow/pull/10) | — | workflow-status gains a crash-recovery reconcile section (dirty tree, half-closed phase, stale envelope) so an external driver (opencode REST server) can restart safely from ground truth |
| 04 | `running-economically` | done · [#22](https://github.com/gtrabanco/agentic-workflow/pull/22) | — | Docs-only cost pack (backlog U1, closes #11): a Context hygiene & cost section (clear + log-session over compaction, with the compaction cost mechanism stated) in FEATURE_WORKFLOW/template; a cross-family review line extending the "never review with a weaker model" invariant to prefer a different model *family*; driver prompt-cache guidance (byte-stable prefixes, short window, no mid-unit model switch) in ORCHESTRATION |
| 05 | `adversarial-context-clean-review` | done · [#23](https://github.com/gtrabanco/agentic-workflow/pull/23) | — | Backlog U2 (closes #12): harden the mandatory end-of-unit review. `review-implementation`'s find phase becomes adversarial by default ("assume the diff is WRONG; prove it does not work"); `review-change` gains a mandatory context-clean turn-contract box (the end review MUST run in a conversation that did NOT write the diff — else STOP and hand off). References feature 04's cross-family preference; does NOT build `--adversarial N` (that is U8/#18, which depends on this). Minor bumps for both skills |
| 06 | `design-feature` | done · [#24](https://github.com/gtrabanco/agentic-workflow/pull/24) | — | Backlog U3 (closes #13, major): new user-facing `design-feature` skill owning product definition via **capability closure** (per entity → CRUD + state transitions + UI entry + API + test, or explicit `n/a`; per capability → entry point + ACL; per role → assign/revoke/view) → exhaustive acceptance criteria — the fix for weak executor models omitting implicit work. **One SPEC in two halves** (design writes product half, plan writes engineering half; `## Design status` marker). `plan-feature` slims to engineering planning (**major**) and STOPS+redirects to `/design-feature` when a feature is undesigned (no bypass flag); `plan-feature-interview` is retired into `design-feature`. Roadmap `defined` state + workflow-status/ship-roadmap wiring are **U4/#14** (depends on this) |
| 07 | `roadmap-status-machine` | done · [#25](https://github.com/gtrabanco/agentic-workflow/pull/25) | 06 | Backlog U4 (closes #14, M): promote the roadmap status column to the pipeline's state machine `idea → defined → planned → in-progress → done` (repo + `template/` legend). `workflow-status` reports `idea` rows as **design candidates** and only calls `defined`+ units startable (new `design_candidates` envelope field); `execute-phase`'s gate redirects a sub-`planned` unit (`idea`→`/design-feature`, `defined`→`/plan-feature`); the authoring skills **set** the statuses (`defined` by design-feature/from-issue, `planned` by scaffold) and `plan-feature`'s gate keys on the roadmap status (SPEC `## Design status` retained as legacy fallback); `ship-roadmap` complies via **batch design (founding) + JIT design from locked decisions (mid-run, no new questions)**, undesignable → `NEEDS_INPUT`+park. Legacy `planned`-with-designed-SPEC = `defined`+`planned` (MIGRATION.md). Minor bumps across the touched skills |
| 08 | `phase-economics` | done · [#26](https://github.com/gtrabanco/agentic-workflow/pull/26) | — | Backlog U5 (closes #15, M): move cost from execution to planning so a **weak model** can execute a phase. `plan-feature-scaffold` gains a **hard split rule** (mandatory `Depends on:`-chained split on >~5 phases OR a multi-layer/concern phase OR an unresolved design decision — replaces the soft "consider splitting"), a **per-phase cheap-executability checklist** (independently checkable · zero open decisions · one concern · gate runs locally), and **acceptance criteria emitted as runnable commands** in TASKS/testing. `execute-phase` + `FEATURE_WORKFLOW` state the **one-phase-one-session** rule. SPEC template hardened (repo + `template/`). Soft dep on 06/07 (both merged). Rejected: dynamic model self-selection. Golden-fixture enforcement deferred to U9. Minor bumps to `plan-feature-scaffold` + `execute-phase` |
| 09 | `product-audit-tooling-sweep` | done · [#27](https://github.com/gtrabanco/agentic-workflow/pull/27) | — | Backlog U6 (closes [#16](https://github.com/gtrabanco/agentic-workflow/issues/16), S): give `product-audit` an **installed-tooling sweep** — inventory installed skills + connected MCP servers, cross them against the project's applicable review axes and roadmap features, and PROPOSE (never auto-apply) either **registering** a useful one in the project's `CLAUDE.md` (zero-discovery-cost reuse by `review-change`/`execute-phase`) or **re-designing** a feature a discovered skill/MCP would rescope (routes to `/design-feature <slug>`). New dimension + process step + a fourth proposal stream in `skills/product-audit/SKILL.md`, keeping its proposes-only contract. Placement invariant: heavy discovery lives only in `design-feature` (per feature) and here (product-wide); the execution path stays read-only. Soft pair with 06 (merged). Single-pass; minor bump to `product-audit` |
| 10 | `envelope-orchestrator-only` | done · [#28](https://github.com/gtrabanco/agentic-workflow/pull/28) | — (driver-gated) | Backlog U7 (closes [#17](https://github.com/gtrabanco/agentic-workflow/issues/17), M, **major**): move the machine turn-envelope out of the per-skill contract and into the orchestration layer that consumes it. Remove the `## Machine envelope` section **and** its turn-contract box from **14 user-facing skills** (`audit-docs, audit-pr, bump-skill, design-feature, execute-phase, generate-docs, init-workspace, log-session, plan-feature, plan-fix, product-audit, review-change, ship-roadmap, triage-issue`); **`workflow-status` keeps it** (emitting the envelope IS the sensor's function). `orchestration-envelope` + `ORCHESTRATION.md`/`PORTABLE_PROMPT.md` gain the canonical **driver-injected system-prompt snippet** + a **repair loop** (parse-fail → re-invoke "Emit only the machine envelope for the turn above"). MAJOR bump chain × 14; MIGRATION.md note; schema/npm package **unchanged**. **Hard external gate (not a roadmap dep): the driver must ship the repair loop before this merges** — blocks execution, not planning |
| 11 | `adversarial-multi-reviewer` | planned | 05 | Backlog U8 (closes [#18](https://github.com/gtrabanco/agentic-workflow/issues/18), M): opt-in `review-change --adversarial N` — N independent, **context-clean**, diff-only reviewers carrying U2's adversarial stance run in **parallel** (Claude Code subagents / headless invocations / sequential-fresh-conversation fallback), preferring model-family diversity; findings **merged + deduped by `file:line`** into the one decision table, inclusion threshold **≥1** reviewer (no quorum). **Default OFF**; auto-recommended (never forced) for `L`/sensitive changes. `ship-roadmap` enables `--adversarial 2` as an **unattended hard floor** for L/sensitive checkpoints (deliberately NOT aligned with the interactive advisory). MINOR bumps for `review-change` + `ship-roadmap`; `REVIEW_AND_CLASSIFY.md` + MIGRATION.md notes. Depends on 05 (U2), merged |

> **Merge order & shared-file coupling (2026-07-05).** Features 01–03 are
> functionally independent (no `Depends on:`), but their PRs edit overlapping
> files — `skills/init-workspace/SKILL.md` (01: Docs site round → 1.7.0; 02:
> Performance tooling round → 1.8.0), `skills/execute-phase/SKILL.md` (01 →
> 1.13.0; 03 → 1.13.1), `template/CLAUDE.md`, and both CHANGELOGs. **Merge in
> PR order: [#8](https://github.com/gtrabanco/agentic-workflow/pull/8) →
> [#9](https://github.com/gtrabanco/agentic-workflow/pull/9) →
> [#10](https://github.com/gtrabanco/agentic-workflow/pull/10)**, resolving
> conflicts by **keeping both sides' additions** (both interview rounds, both
> changelog rows, the higher version number). A "take theirs/ours" resolution
> silently drops one feature's content while other skills still reference it.

## Status legend

The pipeline's single ground-truth state machine — every sensor and executor
reads this column, not a SPEC-local marker:

```
idea ──design-feature / plan-feature-from-issue──▶ defined
        (stamps ## Design status: designed)
                                                     │
                        plan-feature-scaffold        │
             (fills engineering half + artifacts)    ▼
                                                   planned
                                                     │
                     execute-phase P1                │
              (branch open; row → in-progress)       ▼
                                                 in-progress
                                                     │
                        PR-open step                 │
              (row → done; merge state in forge)     ▼
                                                    done
```

- `idea` — a roadmap row exists (the wishlist); no completed product design.
  **No new file** — a thin row *is* the idea. Next action: `/design-feature
  <slug>`. Set by whoever adds the row (human or `ship-roadmap` founding).
- `defined` — `SPEC.md` exists with the **product half complete** (`## Design
  status: designed`, capability closure filled). Next action: `/plan-feature
  <slug>`. Set by `design-feature` or `plan-feature-from-issue`.
- `planned` — full SPEC (**engineering half filled**) + planning artifacts
  exist. Next action: `/execute-phase <NN> P1`. Set by `plan-feature-scaffold`
  (XS/S SPEC-only sizes included — scaffold still runs and lands here).
- `in-progress` — branch open, phases executing. Set by `execute-phase` P1.
- `done` — built and its PR open (the last step opened the PR); **merge state
  lives in the forge**, not the status — a `done` row may still be awaiting a
  human merge. Set by the PR-open step.

Each transition is owned by exactly one skill (a write) — no status is ever
inferred, and no second skill writes the same edge.

## Conventions

- Numbers are assigned in order and never reused.
- A feature that depends on another cannot start until its dependency is **merged**
  (not merely `done` — a `done` dep with an open PR isn't on `main` yet).
- A unit is **executable only when `planned`** (or above). `execute-phase`'s
  dependency gate STOPs and redirects a sub-`planned` unit: `idea` →
  `/design-feature <slug>`, `defined` → `/plan-feature <slug>`.
- **Legacy compat:** a pre-U4 roadmap row still reading a plain `planned` with
  no five-state history, whose SPEC's product half is complete, is treated as
  `defined`+`planned` (no redirect) — see `docs/workflow/MIGRATION.md`.
- Keep this table consistent with the feature folders (the `audit-docs` skill
  checks for drift).
