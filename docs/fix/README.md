# Active fixes

Index of in-progress and pending fixes. Merged fixes are removed from
this table — history lives in git log + closed issues.

## Status legend

- `pending` — SPEC drafted, branch not yet open
- `in-progress` — branch open, work ongoing
- `done` — built, PR open, awaiting merge (merge state lives in the forge — same
  meaning as the roadmap's `done`); the entry is removed only **after** the PR merges

## Active

| Folder | Topic | Status | Depends on | Issue |
| ------ | ----- | ------ | ---------- | ----- |

_No active fixes — all merged entries removed per the convention below._

---

## Conventions

- Folder: `docs/fix/<issue-number>-<topic>/`
- Branch: `fix/<issue-number>-<topic>`
- Every fix has a GitHub issue; PR closes it with `Closes #<n>`.
- Entry is removed from this table on merge — do not maintain history
  here.
- See `_TEMPLATE/SPEC.md` for the spec format.
- Workflow rules: `.claude/skills/execute-phase/SKILL.md` (`--fix`
  mode).
