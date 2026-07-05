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
