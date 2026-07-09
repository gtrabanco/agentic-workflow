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
| 06 | `design-feature` | planned | — | Backlog U3 (closes #13, major): new user-facing `design-feature` skill owning product definition via **capability closure** (per entity → CRUD + state transitions + UI entry + API + test, or explicit `n/a`; per capability → entry point + ACL; per role → assign/revoke/view) → exhaustive acceptance criteria — the fix for weak executor models omitting implicit work. **One SPEC in two halves** (design writes product half, plan writes engineering half; `## Design status` marker). `plan-feature` slims to engineering planning (**major**) and STOPS+redirects to `/design-feature` when a feature is undesigned (no bypass flag); `plan-feature-interview` is retired into `design-feature`. Roadmap `defined` state + workflow-status/ship-roadmap wiring are **U4/#14** (depends on this) |

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

- `planned` — in the roadmap, not started
- `in-progress` — branch open, phases executing
- `done` — built and its PR open (the last step opened the PR); **merge state lives
  in the forge**, not the status — a `done` row may still be awaiting a human merge

## Conventions

- Numbers are assigned in order and never reused.
- A feature that depends on another cannot start until its dependency is **merged**
  (not merely `done` — a `done` dep with an open PR isn't on `main` yet).
- Keep this table consistent with the feature folders (the `audit-docs` skill
  checks for drift).
