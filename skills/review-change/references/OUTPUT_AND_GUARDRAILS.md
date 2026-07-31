## Example output (generic)

For a change to a backend export module (no UI surface):

> Scope: branch diff vs `main` (`src/export/**`). Skipped: design / a11y / SEO /
> brand — no UI surface.

| Axis | Finding | Sev | Class | WHY | Route |
|---|---|---|---|---|---|
| security | API token read from a committed file | high | fix-now | Credential exposure | `plan-fix` |
| tests | Export handler has no failure-mode test | med | fix-now | Untested error path | fold into phase |
| perf | Full table loaded before filtering | low | postpone | Fine at current size | issue + trigger (>100k rows) |

> Manual-verification (automation can't confirm):
> - The exported file opens cleanly in a spreadsheet app.
> - An empty result set still produces a valid (header-only) file.

## Routing

Every non-`fix-now` finding is routed **through `triage-issue`** (step 8) so its
disposition is a decision, not a default:

- **fix-now** → persisted to the unit's `review-findings.md` fold ledger, then
  `plan-fix` → `execute-phase --fix`, or fold into the current phase if it's
  unmerged work. Classification honors `review-implementation`'s **fix-now
  override checks**: a cheap fix or an in-scope defect is always fix-now —
  never a postpone/known-issue/tradeoff escape.
- **fix-now / `replan-in-unit`** (too large to fold as-is) → keeps its fix-now
  class and ledger row; propose the new SPEC phase(s) to the user, then
  `execute-phase` on the same branch folds it.
- **postpone** → `triage-issue` → open a tracked issue with a trigger.
- **intentional-tradeoff** → `triage-issue` → record it (comment / `decisions.md` / issue).
- **ignore** → `triage-issue` → note the rationale (or confirm it truly needs nothing).

## Guardrails

- **Findings + tables only. Never refactor or edit code.**
- Run only applicable axes; never an irrelevant pass (no a11y/SEO/brand for
  CLI/lib/infra). Always report what was skipped and why.
- Honor the project's **Workflow conventions** (docs-language, evidence): cite
  `file:line`, mark uncertainties *verify*.
- **Any forge body this review causes (issues/comments filed via `triage-issue`)
  is Markdown, not shell — never hand-escape.** A `\` before a backtick/`*`/`_`
  renders literally (`` \`code\` `` instead of `` `code` ``); bodies go through
  `--body-file <path>`, never an inline `--body "…"`/heredoc. `triage-issue`
  enforces this for the comments it posts — don't undercut it by pre-escaping
  finding text you hand it.

## Normalized Repository State

Use frozen NRS facts from `docs/workflow/REPOSITORY_STATE.md` as evidence context, but remain read-only. A review may
propose a contradiction with fresh evidence; it cannot redefine a fact, accept a
decision, or turn documentation into implementation evidence.

## Architectural invariants

Review the diff against the optional project invariant document declared in the
documentation map (normally `docs/architecture/ARCHITECTURAL_INVARIANTS.md`).
Its absence is compatible: report `n/a: no project invariants declared`. For
each applicable rule, cite its ID and repository evidence and classify the
actual change as `preserves`, `violates`, `introduces`, or `changes`. Consume
frozen NRS facts when present, but inspect the repository for absent facts and
route a conflict to `resolve-repository-state`.

`preserves` reports `pass`. A `violates`, `introduces`, or `changes` result is
an `architecture` finding in the synthesized table, with the evidence and route
`explicit architectural decision`; report it before suggesting any modification.
The reviewer cannot accept the decision, amend the invariant, or treat the SPEC,
implementation, or passing test as approval.
