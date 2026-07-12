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
| `37-bilingual-human-docs` | Spanish `.es.md` siblings for all human-readable docs (`docs/workflow/*.md` + schema package README) + on-next-touch sync convention; also folds in the model-routing recommendation revision (GLM-5.2 → €200 plan, quota-aware per-task ladders) | done · [#50](https://github.com/gtrabanco/agentic-workflow/pull/50) | — | [#37](https://github.com/gtrabanco/agentic-workflow/issues/37) |
| `52-workflow-status-envelope-hardening` | Emit-time hardening of the `workflow-status` envelope: turn-contract assertions for a non-bare, correctly-staged `next.recommended` + `next.tier` derivation + always-emit on follow-ups; schema shape reminders (`blockers[].scope`, `dependencies.unmet`) so it passes `validateEnvelope()`; mechanical (exception-proof) `product_audit` trigger; unknown-status → `idea` mapping; **new** untriaged open-issue backlog field (`detail.untriaged_issues`) | done · [#53](https://github.com/gtrabanco/agentic-workflow/pull/53) | — | [#52](https://github.com/gtrabanco/agentic-workflow/issues/52) |
| `51-plan-feature-replan-loop` | Break the infinite re-plan loop: `plan-feature` already-planned short-circuit (`planned`/`in-progress`/`done` → hand off, never re-scaffold) + `--next` retargets to `defined` + turn-contract assertion the `defined→planned` write landed; `plan-feature-scaffold` re-reads the row to confirm the write; `workflow-status` no-progress guard (hint recommended `/plan-feature <slug>` yet `<slug>` still `defined` → `workflow_observations` note) | done | — | [#51](https://github.com/gtrabanco/agentic-workflow/issues/51) |

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
