# Roadmap

The single source of truth for feature **numbering, ordering, and dependencies**.
Every feature folder under `docs/features/<NN>-<slug>/` must have a row here, and
every row must have a folder (or be explicitly marked "scheduled").

## Features

| NN | Slug | Status | Depends on | Summary |
|----|------|--------|------------|---------|
| 01 | `<slug>` | planned | — | `<one line>` |

## Status legend

- `planned` — in the roadmap, not started
- `in-progress` — branch open, phases executing
- `done` — merged

## Conventions

- Numbers are assigned in order and never reused.
- A feature that depends on another cannot start until its dependency is merged.
- Keep this table consistent with the feature folders (the `audit-docs` skill
  checks for drift).
