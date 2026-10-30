# Active fixes

Index of in-progress and pending fixes. Merged fixes are removed from this
table — history lives in git log + closed issues.

## Status legend

- `pending` — SPEC drafted, branch not yet open
- `in-progress` — branch open, work ongoing
- `done` — built, PR open, awaiting merge (merge state lives in the forge — same
  meaning as the roadmap's `done`); the row is removed only **after** the PR merges

## Active

| Issue | Topic | Status | Notes |
|---|---|---|---|
| [#331](https://github.com/gtrabanco/agentic-workflow/issues/331) | authoring-setup | in-progress | Authoring-repo initial setup — `docs/workflow/SETUP.md`, `scripts/setup-env.mjs` (`--check`), `scripts/update-tools.mjs` (`--dry-run`), CI check job; branch `feature/331-authoring-repo-setup` |
| [#318](https://github.com/gtrabanco/agentic-workflow/issues/318) | class-escalation-forward-closure | in-progress | Class escalation + forward closure + generated PR evidence pack + remove narration surface (complements #315); branch `fix/318-class-escalation-forward-closure` |

Historical artifacts remain under `docs/fix/`; merged and closed work is
intentionally absent from this index.

---

## Conventions

- Folder: `docs/fix/<issue-number>-<topic>/`
- Branch: `fix/<issue-number>-<topic>`
- Every fix has a tracked issue in the project's forge; the PR closes it via
  `Closes #<n>` (or the forge's equivalent auto-close convention).
- The row is removed from this table only **after** the PR merges — do not
  maintain history here.
- See `_TEMPLATE/SPEC.md` for the spec format.
- Workflow rules: the `execute-phase` skill's `--fix` mode (wherever your
  agent installed the skills).
