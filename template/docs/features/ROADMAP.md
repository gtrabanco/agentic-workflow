# Roadmap

The single source of truth for feature **numbering, ordering, and dependencies**.
Every feature folder under `docs/features/<NN>-<slug>/` must have a row here, and
every row must have a folder (or be explicitly marked "scheduled").

## Features

| NN | Slug | Status | Depends on | Summary |
|----|------|--------|------------|---------|
| 01 | `<slug>` | planned | — | `<one line>` |

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
  exist. Next action: `/execute-phase <NN>`. Set by `plan-feature-scaffold`
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
