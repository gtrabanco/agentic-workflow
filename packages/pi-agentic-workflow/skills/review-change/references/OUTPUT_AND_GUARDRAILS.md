## Example output (generic)

For a change to a backend export module (no UI surface):

> Scope: branch diff vs `main` (`src/export/**`). Skipped: design / a11y / SEO /
> brand — no UI surface.

| Axis | Finding | Sev | Class | WHY | Route |
|---|---|---|---|---|---|
| security | API token read from a committed file | high | fix-now | Credential exposure | fold into phase |
| tests | Export handler has no failure-mode test | med | fix-now | Untested error path | fold into phase |
| architecture | Rate limiter reusable across the fleet | low | proposal | Independent of this unit (D3) | batch proposal + trigger |

> Manual-verification (automation can't confirm):
> - The exported file opens cleanly in a spreadsheet app.
> - An empty result set still produces a valid (header-only) file.

## Routing

Every finding gets a destination under the current-unit contract — none silently
lost, and none becomes reviewer-created backlog (D3):

- **fix-now** → persisted to the unit's `review-findings.md` fold ledger, then
  folded into the current phase (unmerged work) — never a tracked issue, never
  `plan-fix`. Classification honors `review-implementation`'s **current-unit
  contract**: in-scope defects are always fix-now / replan-in-unit — never a
  postpone/tradeoff/wontfix/new-issue escape.
- **fix-now / `replan-in-unit`** (too large to fold as-is) → keeps its fix-now
  class and ledger row; propose the new SPEC phase(s) to the user, then
  `execute-phase` on the same branch folds it.
- **fix-now / `decision-required`** → stop and surface the decision to the user;
  the unit blocks until decided. No issue is created.
- **proposal** (independent future capability) → batched in the report with a
  trigger; only the **user** routes it to `triage-issue`.
- **ignore** → note the rationale in the report; no further action.

The report's `Decision:` line is **three-state** (D10): `REVIEW-PASS` when the
table is clean (the ledger carries only `high`/`med` fix-now rows — `low`
findings are report-only notes that never block), `REVIEW-FAIL` while any
fix-now finding is open, and
`NEEDS-DECISION` when a decision-required finding blocks. Only `REVIEW-PASS`
**and only when the PR exists** posts the idempotent exact-SHA receipt (step 13
of *Persist and decide*); `REVIEW-FAIL` leaves findings in the fold ledger and
posts nothing; `NEEDS-DECISION` blocks without creating an issue. The
`→ Next:` block in *Persist and decide* step 14 is the single place that maps
each decision to its next command — never emit a `→ Next:` block that disagrees
with the `Decision:` line.

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
- **The `REVIEW-PASS` receipt is a PR comment, never a commit** (D6): it goes
  through a temporary `--body-file` (exact body from *Persist and decide* step
  13), is idempotent by SHA, and is never added to the branch. `REVIEW-FAIL` and
  `NEEDS-DECISION` post no receipt.

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
