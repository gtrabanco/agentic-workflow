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
| 04 | `running-economically` | planned · [#11](https://github.com/gtrabanco/agentic-workflow/issues/11) | — | Docs-only cost pack (backlog U1): a Context hygiene & cost section (clear + log-session over compaction, with the compaction cost mechanism stated) in FEATURE_WORKFLOW/template; a cross-family review line extending the "never review with a weaker model" invariant to prefer a different model *family*; driver prompt-cache guidance (byte-stable prefixes, short window, no mid-unit model switch) in ORCHESTRATION |

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
