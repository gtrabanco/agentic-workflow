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
reads this column. The adaptive lane uses the same five states, but the
transitions go through the lane conductor (`unit-lane`) instead of standalone
skills:

```
idea ──/unit-lane (triage → design step)──▶ defined
        (SPEC.md with product half + closure)
                                                     │
                        /unit-lane (plan step)      │
             (SPEC.md engineering half complete)    ▼
                                                   planned
                                                     │
                     execute-phase (catalog steps)   │
              (branch open; row → in-progress)       ▼
                                                 in-progress
                                                     │
                        PR-open step                 │
              (row → done; merge state in forge)     ▼
                                                    done
```

- `idea` — a roadmap row exists (the wishlist); no completed product design.
  **No new file** — a thin row *is* the idea. Next action: `/unit-lane <NN>`
  (tridirection, creates unit doc, runs triage → design step). Set by whoever
  adds the row.
- `defined` — `SPEC.md` exists with the **product half complete** (capability
  closure satisfied, acceptance criteria induced from user scenarios). Next
  action: `/unit-lane <NN>` (tridirection, runs plan step → `planned`).
- `planned` — full SPEC (**engineering half filled**, tasks P1…Pn, evidence
  table, progress log section). Next action: `/unit-lane <NN>` (tridirection,
  returns ordered catalog steps) → `execute-phase`. Set by the plan step.
- `in-progress` — branch open, catalog steps executing. Set by `execute-phase`.
- `done` — built and its PR open (the last step opened the PR); **merge state
  lives in the forge**, not the status — a `done` row may still be awaiting a
  human merge. Set by the PR-open step.

Each transition is owned by exactly one lane step (a write) — no status is ever
inferred, and no second step writes the same edge.

## Conventions

- Numbers are assigned in order and never reused.
- A feature that depends on another cannot start until its dependency is **merged**
  (not merely `done` — a `done` dep with an open PR isn't on `main` yet).
- A unit is **executable only when `planned`** (or above). The lane's
  `execute-phase` dependency gate STOPs and redirects a sub-`planned` unit:
  `idea` → `/unit-lane <NN>` (tridirection, design step), `defined` →
  `/unit-lane <NN>` (tridirection, plan step).
- **Legacy compat:** a pre-U4 roadmap row still reading a plain `planned` with
  no five-state history, whose SPEC's product half is complete, is treated as
  `defined`+`planned` (no redirect) — see `docs/workflow/MIGRATION.md`.
- Keep this table consistent with the feature folders (the `audit-docs` skill
  checks for drift).
