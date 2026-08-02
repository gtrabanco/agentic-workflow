# Active fixes

Index of in-progress and pending fixes. Merged fixes are removed from this
table — history lives in git log + closed issues.

## Status legend

- `pending` — SPEC drafted, branch not yet open
- `in-progress` — branch open, work ongoing
- `done` — built, PR open, awaiting merge (merge state lives in the forge — same
  meaning as the roadmap's `done`); the row is removed only **after** the PR merges

## Active

| Folder | Topic | Status | Depends on | Issue |
| ------ | ----- | ------ | ---------- | ----- |
| `100-stale-fix-index-rows` | Drop 21 stale rows from this table pointing to already-merged PRs | done · [#102](https://github.com/gtrabanco/agentic-workflow/pull/102) | — | [#100](https://github.com/gtrabanco/agentic-workflow/issues/100) |
| `101-stale-roadmap-merge-order-note` | Remove the dead 2026-07-05 merge-order note for PRs #8/#9/#10 (all merged) from `docs/features/ROADMAP.md` | done · [#103](https://github.com/gtrabanco/agentic-workflow/pull/103) | — | [#101](https://github.com/gtrabanco/agentic-workflow/issues/101) |
| `117-amendment-linkage` | Close issue #117 — user-approved descope of P8 adversarial review (amendment linkage reference) | done · [#118](https://github.com/gtrabanco/agentic-workflow/pull/118) | — | [#117](https://github.com/gtrabanco/agentic-workflow/issues/117) |
| `119-progressive-planning-docs-adapters` | Restore NRS gating for issue-derived planning and the Docusaurus adapter contract | done | — | [#119](https://github.com/gtrabanco/agentic-workflow/issues/119) |

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
