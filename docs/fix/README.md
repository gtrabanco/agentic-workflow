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
| `38-schema-package-republish` | Republish schema package (bump 1.0.1 → 1.0.2 so the stranded #44 README reaches npm) | done · [#48](https://github.com/gtrabanco/agentic-workflow/pull/48) | — | [#38](https://github.com/gtrabanco/agentic-workflow/issues/38) |
| `37-bilingual-human-docs` | Spanish `.es.md` siblings for all human-readable docs (`docs/workflow/*.md` + schema package README) + on-next-touch sync convention; also folds in the model-routing recommendation revision (GLM-5.2 → €200 plan, quota-aware per-task ladders) | pending | — | [#37](https://github.com/gtrabanco/agentic-workflow/issues/37) |

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
