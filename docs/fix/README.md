# Active fixes

Index of in-progress and pending fixes. Merged fixes are removed from
this table — history lives in git log + closed issues.

## Status legend

- `pending` — SPEC drafted, branch not yet open
- `in-progress` — branch open, work ongoing
- `done` — built, PR open, awaiting merge (merge state lives in the forge — same
  meaning as the roadmap's `done`); the entry is removed only **after** the PR merges

## Active

| Folder                                                                                 | Topic                                                                                         | Status    | Depends on      | Issue                                                      |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------- | --------------- | ---------------------------------------------------------- |
| [33-stale-envelope-contract](33-stale-envelope-contract/SPEC.md) | Pre-feature-10 envelope contract still stated in orchestration-envelope's head + schema-package README | done | — | [#33](https://github.com/gtrabanco/agentic-workflow/issues/33) |
| [35-single-pass-closeout-phase](35-single-pass-closeout-phase/SPEC.md) | Single-pass units drop the close-out chain — always emit a final Hardening & PR phase (≥ 2 phases) | done · [#36](https://github.com/gtrabanco/agentic-workflow/pull/36) | — | [#35](https://github.com/gtrabanco/agentic-workflow/issues/35) |
| [39-publish-schema-oidc-403](39-publish-schema-oidc-403/SPEC.md) | `publish-schema.yml` E403 OIDC — make the failure self-serve in-repo; authorization repair is a manual npm Trusted Publisher step (blocks #38) | done | — | [#39](https://github.com/gtrabanco/agentic-workflow/issues/39) |


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
