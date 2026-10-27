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
| [#316](https://github.com/gtrabanco/agentic-workflow/issues/316) | roadmap-settle | `done` · [#323](https://github.com/gtrabanco/agentic-workflow/pull/323) · [SPEC](316-roadmap-settle/SPEC.md) | The roadmap row's `done` settle is code: the crate's `roadmap check` cross-document check (closed codes `row-missing`/`slug-mismatch`/`pr-url-unsettled`), the offline root gate `scripts/roadmap-settle.mjs` with the 77/79 frozen-failure corpus, `unit-cycle` writes the settle itself via `rowUpsert`, and the writer's call sites land in `unit-lane` (RELEASE/PLAN) + `execute-phase` close-out. Out of scope: #227 composer, #260 verifier, #301 receiver. Depends on none. |

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
